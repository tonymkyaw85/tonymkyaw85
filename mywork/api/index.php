<?php
// MyWork JSON API. Called by the app as api/index.php?a=<action>.
// Every action checks the signed-in employee and what they are allowed to do.
declare(strict_types=1);
require __DIR__ . '/lib.php';

set_exception_handler(function (Throwable $e) {
    error_log('MyWork API error: ' . $e);
    json_fail(500, 'Something went wrong on the server. Please try again.');
});

start_session();
$action = (string) ($_GET['a'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Writes must come from the app itself: browsers won't send this custom header
// from another site without permission, which blocks cross-site request forgery.
if ($method !== 'GET' && ($_SERVER['HTTP_X_MYWORK'] ?? '') !== '1') {
    json_fail(403, 'Request blocked.');
}

$input = [];
if ($method === 'POST') {
    $input = str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')
        ? (json_decode((string) file_get_contents('php://input'), true) ?: [])
        : $_POST;
}
function in_str(array $in, string $key, int $max = 500): string
{
    return mb_substr(trim((string) ($in[$key] ?? '')), 0, $max);
}

/** The signed-in employee row, or a 401 error. */
function me(): array
{
    $id = $_SESSION['uid'] ?? null;
    if (!$id) {
        json_fail(401, 'Please sign in.');
    }
    $row = q('SELECT * FROM employees WHERE id = ?', [$id])->fetch();
    if (!$row || $row['status'] !== 'Active') {
        $_SESSION = [];
        session_destroy();
        json_fail(401, 'Your account is not active. Contact HR.');
    }
    return $row;
}

function notify(int $userId, string $title, string $body, string $icon, string $color, string $link): void
{
    q('INSERT INTO notifications (user_id, title, body, icon, color, link, created_at) VALUES (?,?,?,?,?,?,?)',
        [$userId, $title, mb_substr($body, 0, 500), $icon, $color, $link, now_utc()]);
}

function fmt_range(string $from, string $to): string
{
    $f = (new DateTime($from))->format('j M Y');
    return $from === $to ? $f : $f . ' - ' . (new DateTime($to))->format('j M Y');
}

function map_request(array $r): array
{
    return [
        'id' => (int) $r['id'], 'userId' => (int) $r['user_id'], 'type' => $r['type'], 'title' => $r['title'],
        'from' => $r['date_from'], 'to' => $r['date_to'], 'note' => $r['note'],
        'amount' => $r['amount'] !== null ? (float) $r['amount'] : null, 'category' => $r['category'],
        'attachment' => $r['attachment_file'] ? (string) $r['id'] : null, 'status' => $r['status'],
        'reviewNote' => $r['review_note'], 'created' => ms($r['created_at']),
    ];
}

function map_attendance(array $a): array
{
    return ['rowId' => (int) $a['id'], 'date' => $a['work_date'], 'in' => ms($a['check_in']), 'out' => ms($a['check_out']), 'location' => $a['location']];
}

function leave_used(int $userId, string $year): int
{
    $rows = q("SELECT date_from, date_to FROM requests WHERE user_id = ? AND type = 'cuti' AND title = 'Annual Leave'
               AND status <> 'Rejected' AND YEAR(date_from) = ?", [$userId, $year])->fetchAll();
    return array_sum(array_map(fn ($r) => days_between($r['date_from'], $r['date_to']), $rows));
}

function pending_for(array $manager): array
{
    $rows = q("SELECT r.*, e.full_name AS requester FROM requests r JOIN employees e ON e.id = r.user_id
               WHERE r.status = 'Pending' AND r.user_id <> ? ORDER BY r.created_at", [$manager['id']])->fetchAll();
    return array_map(fn ($r) => map_request($r) + ['requester' => $r['requester']], $rows);
}

switch ($action) {

    // ---- Session ----------------------------------------------------------------
    case 'session':
        json_out(['signedIn' => !empty($_SESSION['uid'])]);

    case 'login':
        $email = strtolower(in_str($input, 'email', 190));
        $password = (string) ($input['password'] ?? '');
        if ($email === '' || $password === '') {
            json_fail(400, 'Enter your work email and password.');
        }
        $since = gmdate('Y-m-d H:i:s', time() - 15 * 60);
        $byEmail = (int) q('SELECT COUNT(*) FROM login_attempts WHERE email = ? AND attempted_at > ?', [$email, $since])->fetchColumn();
        $byIp = (int) q('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND attempted_at > ?', [client_ip(), $since])->fetchColumn();
        if ($byEmail >= 5 || $byIp >= 20) {
            json_fail(429, 'Too many failed attempts. Wait 15 minutes and try again.');
        }
        $user = q('SELECT * FROM employees WHERE email = ?', [$email])->fetch();
        // Always run password_verify so a wrong email takes as long as a wrong password.
        $hash = $user['password_hash'] ?? password_hash('no-such-user', PASSWORD_DEFAULT);
        if (!password_verify($password, $hash) || !$user) {
            q('INSERT INTO login_attempts (email, ip, attempted_at) VALUES (?,?,?)', [$email, client_ip(), now_utc()]);
            json_fail(401, 'Email or password is incorrect.');
        }
        if ($user['status'] !== 'Active') {
            json_fail(403, 'Your account is not active. Contact HR.');
        }
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            q('UPDATE employees SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $user['id']]);
        }
        q('DELETE FROM login_attempts WHERE email = ?', [$email]);
        session_regenerate_id(true);
        $_SESSION['uid'] = (int) $user['id'];
        json_out(['ok' => true]);

    case 'logout':
        $_SESSION = [];
        session_destroy();
        json_out(['ok' => true]);

    case 'change_password':
        $u = me();
        $old = (string) ($input['old'] ?? '');
        $new = (string) ($input['new'] ?? '');
        if (!password_verify($old, $u['password_hash'])) {
            json_fail(400, 'Current password is incorrect.');
        }
        if (strlen($new) < 8) {
            json_fail(400, 'Password must be at least 8 characters.');
        }
        q('UPDATE employees SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $u['id']]);
        notify((int) $u['id'], 'Password changed', "Your account password was changed. If this wasn't you, contact HR.", 'lock', 'purple', '#/profil');
        session_regenerate_id(true);
        json_out(['ok' => true]);

    // ---- Everything the app shows -------------------------------------------------
    case 'load':
        $u = me();
        $uid = (int) $u['id'];
        $today = company_today();
        $att = array_map('map_attendance', q('SELECT * FROM attendance WHERE user_id = ? AND work_date >= ? ORDER BY work_date DESC',
            [$uid, (new DateTime($today))->modify('-120 days')->format('Y-m-d')])->fetchAll());
        $todays = null;
        $history = [];
        foreach ($att as $a) {
            if ($a['date'] === $today) { $todays = $a; } else { $history[] = $a; }
        }
        $events = q('SELECT * FROM schedule_events WHERE (user_id IS NULL OR user_id = ?) AND event_date BETWEEN ? AND ?',
            [$uid, (new DateTime($today))->modify('-180 days')->format('Y-m-d'), (new DateTime($today))->modify('+180 days')->format('Y-m-d')])->fetchAll();
        $payslips = [];
        foreach (q('SELECT * FROM payslips WHERE user_id = ? ORDER BY period DESC', [$uid])->fetchAll() as $p) {
            $payslips[$p['period']] = ['earn' => json_decode($p['earnings'], true) ?: [], 'ded' => json_decode($p['deductions'], true) ?: []];
        }
        $isManager = $u['app_role'] === 'manager';
        json_out([
            'today' => $today,
            'isManager' => $isManager,
            'user' => [
                'name' => $u['full_name'], 'role' => $u['job_title'], 'id' => $u['employee_id'] ?: '—', 'status' => $u['status'],
                'email' => $u['email'], 'phone' => $u['phone'], 'dept' => $u['department'],
                'joined' => $u['joined_on'] ?: substr($u['created_at'], 0, 10), 'address' => $u['address'],
            ],
            'leave' => ['total' => (int) $u['annual_leave_days'], 'used' => leave_used($uid, substr($today, 0, 4))],
            'attendance' => $todays ?: ['date' => $today, 'in' => null, 'out' => null, 'location' => 'Head Office'],
            'history' => $history,
            'requests' => array_map('map_request', q('SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 200', [$uid])->fetchAll()),
            'notifications' => array_map(fn ($n) => [
                'id' => (int) $n['id'], 'ts' => ms($n['created_at']), 'title' => $n['title'], 'body' => $n['body'],
                'icon' => $n['icon'], 'color' => $n['color'], 'go' => $n['link'], 'read' => (bool) $n['is_read'],
            ], q('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50', [$uid])->fetchAll()),
            'announcements' => array_map(fn ($a) => [
                'cat' => $a['category'], 'icon' => $a['icon'], 'color' => $a['color'], 'title' => $a['title'], 'date' => $a['published_on'], 'body' => $a['body'],
            ], q('SELECT * FROM announcements WHERE published_on <= ? ORDER BY published_on DESC, id DESC LIMIT 50', [$today])->fetchAll()),
            'docs' => array_map(fn ($d) => [
                'id' => (int) $d['id'], 'name' => $d['name'], 'file' => $d['file_name'], 'size' => (int) $d['size_bytes'], 'kind' => $d['kind'],
            ], q('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at', [$uid])->fetchAll()),
            'payslips' => (object) $payslips,
            'events' => array_map(fn ($e) => [
                'date' => $e['event_date'], 'time' => $e['start_time'] ? substr($e['start_time'], 0, 5) : '—', 'title' => $e['title'],
                'place' => $e['place'], 'color' => $e['color'], 'holiday' => (bool) $e['is_holiday'],
            ], $events),
            'pending' => $isManager ? pending_for($u) : [],
        ]);

    case 'pending':
        $u = me();
        if ($u['app_role'] !== 'manager') {
            json_fail(403, 'Only managers can review requests.');
        }
        json_out(pending_for($u));

    // ---- Attendance (times always come from the server clock) --------------------
    case 'checkin':
        $u = me();
        $location = in_str($input, 'location', 120) ?: 'Head Office';
        try {
            q('INSERT INTO attendance (user_id, work_date, check_in, location) VALUES (?,?,?,?)', [$u['id'], company_today(), now_utc(), $location]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                json_fail(409, "You've already checked in today.");
            }
            throw $e;
        }
        json_out(map_attendance(q('SELECT * FROM attendance WHERE id = ?', [db()->lastInsertId()])->fetch()));

    case 'checkout':
        $u = me();
        $st = q('UPDATE attendance SET check_out = ? WHERE id = ? AND user_id = ? AND check_out IS NULL', [now_utc(), (int) ($input['id'] ?? 0), $u['id']]);
        if ($st->rowCount() !== 1) {
            json_fail(409, 'Already checked out.');
        }
        json_out(map_attendance(q('SELECT * FROM attendance WHERE id = ?', [(int) $input['id']])->fetch()));

    // ---- Requests ----------------------------------------------------------------
    case 'request':
        $u = me();
        $type = in_str($input, 'type', 20);
        $titles = ['cuti' => ['Annual Leave', 'Sick Leave', 'Other Leave'], 'izin' => ['Permission'], 'lembur' => ['Overtime'], 'reimburse' => ['Reimbursement']];
        $title = in_str($input, 'title', 60);
        $from = in_str($input, 'from', 10);
        $to = in_str($input, 'to', 10);
        $note = in_str($input, 'note', 2000);
        if (!isset($titles[$type]) || !in_array($title, $titles[$type], true)) {
            json_fail(400, 'Unknown request type.');
        }
        if (!valid_date($from) || !valid_date($to) || $to < $from) {
            json_fail(400, 'Check the dates and try again.');
        }
        if ($note === '') {
            json_fail(400, 'Please enter a description.');
        }
        $amount = null;
        $category = null;
        if ($type === 'reimburse') {
            $amount = (float) ($input['amount'] ?? 0);
            $category = in_str($input, 'category', 60);
            if ($amount <= 0 || $amount > 1e12) {
                json_fail(400, 'Enter an amount.');
            }
        }
        db()->beginTransaction();
        // Lock this employee's row so two quick submissions can't both pass the balance check.
        $locked = q('SELECT annual_leave_days FROM employees WHERE id = ? FOR UPDATE', [$u['id']])->fetch();
        if ($type === 'cuti' && $title === 'Annual Leave'
            && leave_used((int) $u['id'], substr($from, 0, 4)) + days_between($from, $to) > (int) $locked['annual_leave_days']) {
            db()->rollBack();
            json_fail(400, 'Not enough leave balance.');
        }
        $file = save_upload('file', 'attachments');
        q('INSERT INTO requests (user_id, type, title, date_from, date_to, note, amount, category, attachment_file, attachment_name, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$u['id'], $type, $title, $from, $to, $note, $amount, $category, $file[0] ?? null, $file[1] ?? null, now_utc()]);
        $id = db()->lastInsertId();
        db()->commit();
        json_out(map_request(q('SELECT * FROM requests WHERE id = ?', [$id])->fetch()));

    case 'cancel_request':
        $u = me();
        $id = (int) ($input['id'] ?? 0);
        $row = q("SELECT attachment_file FROM requests WHERE id = ? AND user_id = ? AND status = 'Pending'", [$id, $u['id']])->fetch();
        if (!$row) {
            json_fail(409, 'This request can no longer be cancelled.');
        }
        q("DELETE FROM requests WHERE id = ? AND user_id = ? AND status = 'Pending'", [$id, $u['id']]);
        delete_stored('attachments', $row['attachment_file']);
        json_out(['ok' => true]);

    case 'review':
        $u = me();
        if ($u['app_role'] !== 'manager') {
            json_fail(403, 'Only managers can review requests.');
        }
        $id = (int) ($input['id'] ?? 0);
        $status = in_str($input, 'status', 10);
        $note = in_str($input, 'note', 500);
        if (!in_array($status, ['Approved', 'Rejected'], true)) {
            json_fail(400, 'Invalid status.');
        }
        $st = q("UPDATE requests SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = ?
                 WHERE id = ? AND status = 'Pending' AND user_id <> ?", [$status, $note ?: null, $u['id'], now_utc(), $id, $u['id']]);
        if ($st->rowCount() !== 1) {
            json_fail(409, 'Request not found, already reviewed, or your own.');
        }
        $r = q('SELECT * FROM requests WHERE id = ?', [$id])->fetch();
        $ok = $status === 'Approved';
        notify((int) $r['user_id'], $r['title'] . ($ok ? ' approved' : ' rejected'),
            'Your ' . mb_strtolower($r['title']) . ' request for ' . fmt_range($r['date_from'], $r['date_to']) . ' was ' . mb_strtolower($status)
            . ($note !== '' ? ': "' . $note . '"' : '.'),
            $ok ? 'check' : 'x', $ok ? 'green' : 'red', '#/status');
        json_out(map_request($r));

    // ---- Notifications & profile -----------------------------------------------
    case 'notif_read':
        $u = me();
        if (isset($input['id'])) {
            q('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [(int) $input['id'], $u['id']]);
        } else {
            q('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [$u['id']]);
        }
        json_out(['ok' => true]);

    case 'profile':
        $u = me();
        $phone = in_str($input, 'phone', 40);
        $address = in_str($input, 'address', 255);
        if (strlen(preg_replace('/\D/', '', $phone)) < 9 || $address === '') {
            json_fail(400, 'Enter a valid phone number and address.');
        }
        q('UPDATE employees SET phone = ?, address = ? WHERE id = ?', [$phone, $address, $u['id']]);
        json_out(['ok' => true]);

    // ---- Documents & files --------------------------------------------------------
    case 'doc_upload':
        $u = me();
        $kind = in_str($input, 'kind', 10);
        $file = save_upload('file', 'documents');
        if (!$file) {
            json_fail(400, 'Choose a file to upload.');
        }
        q('INSERT INTO documents (user_id, name, file_name, size_bytes, kind, stored_name, created_at) VALUES (?,?,?,?,?,?,?)',
            [$u['id'], mb_substr(preg_replace('/\.[^.]+$/', '', $file[1]), 0, 160), $file[1], $file[2],
             in_array($kind, ['blue', 'red', 'green', 'orange', 'purple'], true) ? $kind : 'blue', $file[0], now_utc()]);
        $d = q('SELECT * FROM documents WHERE id = ?', [db()->lastInsertId()])->fetch();
        json_out(['id' => (int) $d['id'], 'name' => $d['name'], 'file' => $d['file_name'], 'size' => (int) $d['size_bytes'], 'kind' => $d['kind']]);

    case 'doc_delete':
        $u = me();
        $d = q('SELECT * FROM documents WHERE id = ? AND user_id = ?', [(int) ($input['id'] ?? 0), $u['id']])->fetch();
        if (!$d) {
            json_fail(404, 'Document not found.');
        }
        q('DELETE FROM documents WHERE id = ?', [$d['id']]);
        delete_stored('documents', $d['stored_name']);
        json_out(['ok' => true]);

    case 'file':
        $u = me();
        $id = (int) ($_GET['id'] ?? 0);
        $download = !empty($_GET['download']);
        if (($_GET['type'] ?? '') === 'doc') {
            $d = q('SELECT * FROM documents WHERE id = ? AND user_id = ?', [$id, $u['id']])->fetch();
            if (!$d) {
                json_fail(404, 'Document not found.');
            }
            send_file('documents', $d['stored_name'], $d['file_name'], $download);
        }
        // Request attachment: the employee who sent it, or a manager.
        $r = q('SELECT * FROM requests WHERE id = ? AND attachment_file IS NOT NULL', [$id])->fetch();
        if (!$r || ((int) $r['user_id'] !== (int) $u['id'] && $u['app_role'] !== 'manager')) {
            json_fail(404, 'Attachment not found.');
        }
        send_file('attachments', $r['attachment_file'], $r['attachment_name'], $download);

    default:
        json_fail(404, 'Unknown action.');
}
