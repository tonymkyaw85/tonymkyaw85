<?php
// MyWork HR admin page: add employees, reset passwords, post announcements,
// enter payslips, and load demo data. Protected by admin_password in config.php.
declare(strict_types=1);
require __DIR__ . '/lib.php';

start_session();
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'self'; style-src 'unsafe-inline'; form-action 'self'");

function h($s): string { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }
function csrf(): string { return $_SESSION['admin_csrf'] ??= bin2hex(random_bytes(16)); }
function back(string $tab, string $msg, bool $error = false): void
{
    $_SESSION['flash'] = [$msg, $error];
    header('Location: admin.php?tab=' . urlencode($tab));
    exit;
}
/** "Label: 1,234,000" lines → [["Label", 1234000], ...] */
function parse_lines(string $text): array
{
    $out = [];
    foreach (preg_split('/\R/', $text) as $line) {
        if (trim($line) === '') { continue; }
        if (!preg_match('/^(.+?)\s*[:=]\s*([\d.,\s]+)$/u', trim($line), $m)) {
            throw new InvalidArgumentException('Could not read the line "' . trim($line) . '". Use: Label: amount');
        }
        $out[] = [trim($m[1]), (float) preg_replace('/[^\d]/', '', $m[2])];
    }
    return $out;
}

$adminPassword = (string) (cfg()['admin_password'] ?? '');
$configured = strlen($adminPassword) >= 12;
$tab = $_GET['tab'] ?? 'employees';
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);

// ---- Sign in / out ----------------------------------------------------------------
if ($configured && ($_POST['do'] ?? '') === 'login') {
    $since = gmdate('Y-m-d H:i:s', time() - 15 * 60);
    $tries = (int) q("SELECT COUNT(*) FROM login_attempts WHERE email = '(admin)' AND attempted_at > ?", [$since])->fetchColumn();
    if ($tries >= 5) {
        back('employees', 'Too many failed attempts. Wait 15 minutes.', true);
    }
    if (hash_equals($adminPassword, (string) ($_POST['password'] ?? ''))) {
        q("DELETE FROM login_attempts WHERE email = '(admin)'");
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        back('employees', 'Signed in.');
    }
    q("INSERT INTO login_attempts (email, ip, attempted_at) VALUES ('(admin)', ?, ?)", [client_ip(), now_utc()]);
    back('employees', 'Wrong admin password.', true);
}
if (($_POST['do'] ?? '') === 'logout') {
    unset($_SESSION['admin']);
    back('employees', 'Signed out.');
}

$isAdmin = !empty($_SESSION['admin']);

// ---- Actions ------------------------------------------------------------------------
if ($isAdmin && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals(csrf(), (string) ($_POST['csrf'] ?? ''))) {
        back($tab, 'The form expired. Please try again.', true);
    }
    $do = $_POST['do'] ?? '';
    try {
        if ($do === 'save_employee') {
            $id = (int) ($_POST['id'] ?? 0);
            $email = strtolower(trim((string) $_POST['email']));
            $name = trim((string) $_POST['full_name']);
            $pw = (string) ($_POST['password'] ?? '');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '') {
                back('employees', 'Enter a valid email and full name.', true);
            }
            if (($id === 0 || $pw !== '') && strlen($pw) < 8) {
                back('employees', 'The password must be at least 8 characters.', true);
            }
            $fields = [
                'email' => $email, 'full_name' => $name,
                'employee_id' => trim((string) $_POST['employee_id']) ?: null,
                'job_title' => trim((string) $_POST['job_title']), 'department' => trim((string) $_POST['department']),
                'joined_on' => valid_date((string) $_POST['joined_on']) ? $_POST['joined_on'] : null,
                'app_role' => $_POST['app_role'] === 'manager' ? 'manager' : 'employee',
                'status' => $_POST['status'] === 'Inactive' ? 'Inactive' : 'Active',
                'annual_leave_days' => max(0, min(60, (int) $_POST['annual_leave_days'])),
            ];
            if ($pw !== '') {
                $fields['password_hash'] = password_hash($pw, PASSWORD_DEFAULT);
            }
            $cols = array_keys($fields);
            if ($id) {
                q('UPDATE employees SET ' . implode(', ', array_map(fn ($c) => "$c = ?", $cols)) . ' WHERE id = ?', [...array_values($fields), $id]);
                back('employees', "Saved $name." . ($pw !== '' ? ' New password set.' : ''));
            }
            q('INSERT INTO employees (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')', array_values($fields));
            back('employees', "Added $name. They can now sign in with $email.");
        }

        if ($do === 'post_announcement') {
            $title = trim((string) $_POST['title']);
            $body = trim((string) $_POST['body']);
            $cat = in_array($_POST['category'], ['Company', 'HR', 'IT'], true) ? $_POST['category'] : 'Company';
            $color = in_array($_POST['color'], ['blue', 'red', 'green', 'orange', 'purple'], true) ? $_POST['color'] : 'blue';
            if ($title === '' || $body === '') {
                back('announcements', 'Enter a title and message.', true);
            }
            db()->beginTransaction();
            q('INSERT INTO announcements (category, icon, color, title, body, published_on) VALUES (?,?,?,?,?,?)',
                [$cat, 'megaphone', $color, $title, $body, company_today()]);
            q("INSERT INTO notifications (user_id, title, body, icon, color, link, created_at)
               SELECT id, 'New announcement', ?, 'megaphone', 'blue', '#/pengumuman', ? FROM employees WHERE status = 'Active'", [$title, now_utc()]);
            db()->commit();
            back('announcements', 'Announcement posted and everyone notified.');
        }
        if ($do === 'delete_announcement') {
            q('DELETE FROM announcements WHERE id = ?', [(int) $_POST['id']]);
            back('announcements', 'Announcement deleted.');
        }

        if ($do === 'save_payslip') {
            $uid = (int) $_POST['user_id'];
            $period = (string) $_POST['period'];
            if (!preg_match('/^\d{4}-\d{2}$/', $period) || !q('SELECT 1 FROM employees WHERE id = ?', [$uid])->fetch()) {
                back('payslips', 'Choose an employee and a month.', true);
            }
            $earn = parse_lines((string) $_POST['earnings']);
            $ded = parse_lines((string) $_POST['deductions']);
            if (!$earn) {
                back('payslips', 'Add at least one earnings line.', true);
            }
            q('INSERT INTO payslips (user_id, period, earnings, deductions) VALUES (?,?,?,?)
               ON DUPLICATE KEY UPDATE earnings = VALUES(earnings), deductions = VALUES(deductions)',
                [$uid, $period, json_encode($earn), json_encode($ded)]);
            $net = array_sum(array_column($earn, 1)) - array_sum(array_column($ded, 1));
            back('payslips', 'Payslip saved. Net salary: Rp ' . number_format($net, 0, '.', ','));
        }

        if ($do === 'demo') {
            require __DIR__ . '/demo.php';
            back('demo', load_demo_data(
                strtolower(trim((string) $_POST['emp_email'])), (string) $_POST['emp_password'],
                strtolower(trim((string) $_POST['mgr_email'])), (string) $_POST['mgr_password']));
        }
    } catch (InvalidArgumentException $e) {
        back($tab, $e->getMessage(), true);
    } catch (PDOException $e) {
        if (db()->inTransaction()) { db()->rollBack(); }
        error_log('MyWork admin: ' . $e->getMessage());
        back($tab, $e->getCode() === '23000' ? 'That email or employee ID is already used by someone else.' : 'Database error: ' . $e->getMessage(), true);
    }
}

$employees = $isAdmin ? q('SELECT * FROM employees ORDER BY full_name')->fetchAll() : [];
$editing = null;
if ($isAdmin && isset($_GET['edit'])) {
    $editing = q('SELECT * FROM employees WHERE id = ?', [(int) $_GET['edit']])->fetch() ?: null;
}
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>MyWork HR Admin</title>
<style>
:root { --bg:#f3f6fc; --card:#fff; --ink:#14203a; --muted:#5d6a82; --line:#dfe6f2; --blue:#1a6bf0; --red:#d93f44; --green:#14935f; }
@media (prefers-color-scheme: dark) { :root { --bg:#0c1322; --card:#141e33; --ink:#e8eefc; --muted:#9aa8c2; --line:#25324d; --blue:#5b95ff; --red:#ff6b6f; --green:#3fcf8e; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; padding:24px 16px 48px; }
main { max-width: 880px; margin: 0 auto; display: grid; gap: 18px; }
h1 { margin:0; font-size:24px; } h2 { margin:0 0 12px; font-size:18px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px; }
nav { display:flex; gap:6px; flex-wrap:wrap; }
nav a { padding:8px 14px; border-radius:10px; text-decoration:none; color:var(--muted); font-weight:600; border:1px solid var(--line); background:var(--card); }
nav a.on { background:var(--blue); color:#fff; border-color:var(--blue); }
form.grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
label { display:grid; gap:4px; font-size:13px; font-weight:600; }
input, select, textarea { font:inherit; padding:10px 12px; border:1px solid var(--line); border-radius:10px; background:var(--bg); color:var(--ink); width:100%; }
textarea { min-height: 120px; font-family: ui-monospace, monospace; font-size: 13px; }
.full { grid-column: 1 / -1; }
button { font:inherit; font-weight:700; padding:10px 18px; border:0; border-radius:10px; background:var(--blue); color:#fff; cursor:pointer; }
button.link { background:none; color:var(--blue); padding:0; font-weight:600; }
button.danger { background:none; color:var(--red); padding:0; }
.flash { padding:12px 16px; border-radius:10px; background:#e1f5ec; color:#0d6b45; font-weight:600; }
.flash.err { background:#fdecec; color:#a4262c; }
.table { overflow-x:auto; } table { width:100%; border-collapse:collapse; font-size:14px; }
th, td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
th { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
.pill { font-size:12px; padding:2px 8px; border-radius:6px; background:var(--bg); border:1px solid var(--line); }
.muted { color:var(--muted); font-size:13px; }
.row { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
</style>
</head>
<body>
<main>
<div class="row"><h1>MyWork HR Admin</h1>
<?php if ($isAdmin): ?><form method="post"><input type="hidden" name="do" value="logout"><button class="link">Sign out</button></form><?php endif; ?></div>

<?php if ($flash): ?><div class="flash <?= $flash[1] ? 'err' : '' ?>" role="status"><?= h($flash[0]) ?></div><?php endif; ?>

<?php if (!$configured): ?>
  <div class="card"><h2>Set an admin password first</h2>
  <p>Open <code>api/config.php</code> on the NAS and set <code>'admin_password'</code> to a password of at least 12 characters, then reload this page.</p></div>

<?php elseif (!$isAdmin): ?>
  <form class="card grid" method="post" style="max-width:420px">
    <h2 class="full">Sign in</h2>
    <input type="hidden" name="do" value="login">
    <label class="full">Admin password<input type="password" name="password" autocomplete="current-password" required autofocus></label>
    <div><button>Sign In</button></div>
  </form>

<?php else: ?>
  <nav>
    <?php foreach (['employees' => 'Employees', 'announcements' => 'Announcements', 'payslips' => 'Payslips', 'demo' => 'Demo data'] as $k => $label): ?>
      <a href="?tab=<?= $k ?>" class="<?= $tab === $k ? 'on' : '' ?>"><?= $label ?></a>
    <?php endforeach; ?>
  </nav>

  <?php if ($tab === 'employees'): $e = $editing ?? []; ?>
    <form class="card grid" method="post">
      <h2 class="full"><?= $editing ? 'Edit ' . h($e['full_name']) : 'Add an employee' ?></h2>
      <input type="hidden" name="do" value="save_employee"><input type="hidden" name="csrf" value="<?= csrf() ?>">
      <input type="hidden" name="id" value="<?= (int) ($e['id'] ?? 0) ?>">
      <label>Work email<input type="email" name="email" required value="<?= h($e['email'] ?? '') ?>"></label>
      <label>Full name<input name="full_name" required value="<?= h($e['full_name'] ?? '') ?>"></label>
      <label>Employee ID<input name="employee_id" placeholder="EMP00123" value="<?= h($e['employee_id'] ?? '') ?>"></label>
      <label>Job title<input name="job_title" value="<?= h($e['job_title'] ?? '') ?>"></label>
      <label>Department<input name="department" value="<?= h($e['department'] ?? '') ?>"></label>
      <label>Join date<input type="date" name="joined_on" value="<?= h($e['joined_on'] ?? '') ?>"></label>
      <label>Role<select name="app_role">
        <option value="employee">Employee</option>
        <option value="manager" <?= ($e['app_role'] ?? '') === 'manager' ? 'selected' : '' ?>>Manager (can approve requests)</option></select></label>
      <label>Annual leave days<input type="number" name="annual_leave_days" min="0" max="60" value="<?= (int) ($e['annual_leave_days'] ?? 12) ?>"></label>
      <label>Status<select name="status"><option>Active</option><option <?= ($e['status'] ?? '') === 'Inactive' ? 'selected' : '' ?>>Inactive</option></select></label>
      <label><?= $editing ? 'New password (leave empty to keep)' : 'Password (at least 8 characters)' ?>
        <input type="text" name="password" autocomplete="new-password" <?= $editing ? '' : 'required minlength="8"' ?>></label>
      <div class="full row"><button><?= $editing ? 'Save Changes' : 'Add Employee' ?></button>
        <?php if ($editing): ?><a href="?tab=employees">Cancel</a><?php endif; ?></div>
    </form>
    <div class="card"><h2>Employees (<?= count($employees) ?>)</h2><div class="table"><table>
      <tr><th>Name</th><th>Email</th><th>ID</th><th>Role</th><th>Status</th><th></th></tr>
      <?php foreach ($employees as $row): ?>
        <tr><td><?= h($row['full_name']) ?></td><td><?= h($row['email']) ?></td><td><?= h($row['employee_id']) ?></td>
          <td><span class="pill"><?= h($row['app_role']) ?></span></td><td><?= h($row['status']) ?></td>
          <td><a href="?tab=employees&edit=<?= (int) $row['id'] ?>">Edit / reset password</a></td></tr>
      <?php endforeach; ?>
      <?php if (!$employees): ?><tr><td colspan="6" class="muted">No employees yet. Add the first one above.</td></tr><?php endif; ?>
    </table></div></div>

  <?php elseif ($tab === 'announcements'): ?>
    <form class="card grid" method="post">
      <h2 class="full">Post an announcement</h2>
      <input type="hidden" name="do" value="post_announcement"><input type="hidden" name="csrf" value="<?= csrf() ?>">
      <label>Category<select name="category"><option>Company</option><option>HR</option><option>IT</option></select></label>
      <label>Color<select name="color"><option value="blue">Blue</option><option value="red">Red</option><option value="green">Green</option><option value="orange">Orange</option><option value="purple">Purple</option></select></label>
      <label class="full">Title<input name="title" required maxlength="160"></label>
      <label class="full">Message<textarea name="body" required style="font-family:inherit"></textarea></label>
      <div class="full"><button>Post and Notify Everyone</button></div>
    </form>
    <div class="card"><h2>Recent announcements</h2><div class="table"><table>
      <tr><th>Date</th><th>Category</th><th>Title</th><th></th></tr>
      <?php foreach (q('SELECT * FROM announcements ORDER BY published_on DESC, id DESC LIMIT 30')->fetchAll() as $a): ?>
        <tr><td><?= h($a['published_on']) ?></td><td><?= h($a['category']) ?></td><td><?= h($a['title']) ?></td>
          <td><form method="post"><input type="hidden" name="do" value="delete_announcement"><input type="hidden" name="csrf" value="<?= csrf() ?>">
            <input type="hidden" name="id" value="<?= (int) $a['id'] ?>"><button class="danger">Delete</button></form></td></tr>
      <?php endforeach; ?>
    </table></div></div>

  <?php elseif ($tab === 'payslips'): ?>
    <form class="card grid" method="post">
      <h2 class="full">Add or update a payslip</h2>
      <input type="hidden" name="do" value="save_payslip"><input type="hidden" name="csrf" value="<?= csrf() ?>">
      <label>Employee<select name="user_id" required><?php foreach ($employees as $row): ?>
        <option value="<?= (int) $row['id'] ?>"><?= h($row['full_name']) ?> (<?= h($row['employee_id'] ?: $row['email']) ?>)</option><?php endforeach; ?></select></label>
      <label>Month<input type="month" name="period" required value="<?= substr(company_today(), 0, 7) ?>"></label>
      <label class="full">Earnings, one per line
        <textarea name="earnings" required>Basic Salary: 6,500,000
Transport Allowance: 750,000
Meal Allowance: 900,000</textarea></label>
      <label class="full">Deductions, one per line
        <textarea name="deductions">BPJS Health: 130,000
BPJS Employment: 260,000
Income Tax (PPh 21): 0</textarea></label>
      <p class="full muted">Saving the same employee and month again replaces that payslip.</p>
      <div class="full"><button>Save Payslip</button></div>
    </form>
    <div class="card"><h2>Recent payslips</h2><div class="table"><table>
      <tr><th>Month</th><th>Employee</th><th>Net</th></tr>
      <?php foreach (q('SELECT p.*, e.full_name FROM payslips p JOIN employees e ON e.id = p.user_id ORDER BY period DESC, e.full_name LIMIT 40')->fetchAll() as $p):
        $net = array_sum(array_column(json_decode($p['earnings'], true) ?: [], 1)) - array_sum(array_column(json_decode($p['deductions'], true) ?: [], 1)); ?>
        <tr><td><?= h($p['period']) ?></td><td><?= h($p['full_name']) ?></td><td>Rp <?= number_format($net, 0, '.', ',') ?></td></tr>
      <?php endforeach; ?>
    </table></div></div>

  <?php elseif ($tab === 'demo'): ?>
    <form class="card grid" method="post">
      <h2 class="full">Load demo data</h2>
      <p class="full muted">Creates (or updates) two test accounts with sample attendance, requests, payslips, schedule and announcements, so you can try every screen. Use test emails, not real staff.</p>
      <input type="hidden" name="do" value="demo"><input type="hidden" name="csrf" value="<?= csrf() ?>">
      <label>Employee email<input type="email" name="emp_email" required value="employee.demo@delimooo.com"></label>
      <label>Employee password<input type="text" name="emp_password" required minlength="8"></label>
      <label>Manager email<input type="email" name="mgr_email" required value="manager.demo@delimooo.com"></label>
      <label>Manager password<input type="text" name="mgr_password" required minlength="8"></label>
      <div class="full"><button>Load Demo Data</button></div>
    </form>
  <?php endif; ?>
<?php endif; ?>
</main>
</body>
</html>
