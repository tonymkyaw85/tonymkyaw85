<?php
// Demo data for trying MyWork. Used by the "Demo data" tab of admin.php.
declare(strict_types=1);

function upsert_employee(string $email, string $password, array $fields): int
{
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
        throw new InvalidArgumentException('Enter valid emails and passwords of at least 8 characters.');
    }
    $row = q('SELECT id FROM employees WHERE email = ?', [$email])->fetch();
    $hash = password_hash($password, PASSWORD_DEFAULT);
    if ($row) {
        q('UPDATE employees SET password_hash = ?, full_name = ?, job_title = ?, department = ?, app_role = ?, phone = ?, address = ?, joined_on = ?, status = \'Active\' WHERE id = ?',
            [$hash, $fields['name'], $fields['job'], 'Information Technology', $fields['role'], $fields['phone'], $fields['address'], $fields['joined'], $row['id']]);
        return (int) $row['id'];
    }
    // Employee IDs must be unique; skip them if already taken by a real person.
    $empId = q('SELECT 1 FROM employees WHERE employee_id = ?', [$fields['empId']])->fetch() ? null : $fields['empId'];
    q('INSERT INTO employees (email, password_hash, employee_id, full_name, job_title, department, app_role, phone, address, joined_on)
       VALUES (?,?,?,?,?,?,?,?,?,?)',
        [$email, $hash, $empId, $fields['name'], $fields['job'], 'Information Technology', $fields['role'], $fields['phone'], $fields['address'], $fields['joined']]);
    return (int) db()->lastInsertId();
}

function load_demo_data(string $empEmail, string $empPw, string $mgrEmail, string $mgrPw): string
{
    if ($empEmail === $mgrEmail) {
        throw new InvalidArgumentException('Use two different emails: managers cannot approve their own requests.');
    }
    db()->beginTransaction();
    $emp = upsert_employee($empEmail, $empPw, ['name' => 'Ahmad Fauzi', 'job' => 'IT Support', 'role' => 'employee', 'empId' => 'EMP00123',
        'phone' => '+62 812 3456 7890', 'address' => 'East Jakarta, DKI Jakarta', 'joined' => '2020-01-12']);
    $mgr = upsert_employee($mgrEmail, $mgrPw, ['name' => 'Siti Rahma', 'job' => 'IT Manager', 'role' => 'manager', 'empId' => 'EMP00007',
        'phone' => '+62 811 2233 4455', 'address' => 'South Jakarta, DKI Jakarta', 'joined' => '2016-03-01']);

    // Start the demo employee from a clean slate so loading twice doesn't duplicate rows.
    foreach (['attendance', 'requests', 'notifications', 'payslips', 'schedule_events'] as $t) {
        q("DELETE FROM $t WHERE user_id IN (?, ?)", [$emp, $mgr]);
    }

    $tz = new DateTimeZone(cfg()['timezone'] ?? 'Asia/Jakarta');
    $today = new DateTime(company_today(), $tz);
    $utc = fn (DateTime $local) => (clone $local)->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    $ago = fn (string $spec) => gmdate('Y-m-d H:i:s', strtotime($spec));
    $day = fn (int $offset) => (clone $today)->modify("$offset days")->format('Y-m-d');

    // Attendance for the past 14 days (weekdays only).
    for ($i = 14, $n = 0; $i >= 1; $i--) {
        $d = (clone $today)->modify("-$i days");
        if ((int) $d->format('N') >= 6) { continue; }
        $n++;
        $in = (clone $d)->setTime(7, 50 + ($n * 7) % 20);
        $out = (clone $d)->setTime(17, ($n * 11) % 40);
        q('INSERT INTO attendance (user_id, work_date, check_in, check_out) VALUES (?,?,?,?)', [$emp, $d->format('Y-m-d'), $utc($in), $utc($out)]);
    }

    $req = 'INSERT INTO requests (user_id, type, title, date_from, date_to, note, amount, category, status, reviewed_by, reviewed_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
    q($req, [$emp, 'cuti', 'Annual Leave', $day(-3), $day(-1), 'Family matters.', null, null, 'Approved', $mgr, $ago('-2 hours'), $ago('-3 hours')]);
    q($req, [$emp, 'izin', 'Permission', $day(-11), $day(-11), 'Late Arrival: Handling civil registry documents.', null, null, 'Pending', null, null, $ago('-4 hours')]);
    q($req, [$emp, 'lembur', 'Overtime', $day(-18), $day(-18), 'Server maintenance outside working hours (18:00–21:00)', null, null, 'Rejected', $mgr, $ago('-6 days'), $ago('-7 days')]);
    q($req, [$emp, 'reimburse', 'Reimbursement', $day(-22), $day(-22), 'Transport for client meeting', 150000, 'Transport', 'Approved', $mgr, $ago('-6 days'), $ago('-7 days')]);

    $note = 'INSERT INTO notifications (user_id, title, body, icon, color, link, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)';
    q($note, [$emp, 'Leave approved', 'Your annual leave request was approved.', 'check', 'green', '#/status', 0, $ago('-2 hours')]);
    q($note, [$emp, 'Overtime rejected', 'Your overtime request was rejected.', 'x', 'red', '#/status', 1, $ago('-6 days')]);
    q($note, [$mgr, 'Request waiting for you', 'Ahmad Fauzi submitted a permission request.', 'clipboard', 'orange', '#/status', 0, $ago('-4 hours')]);

    // Payslips for the last 6 months.
    $overtime = [300000, 450000, 250000, 600000, 450000, 350000];
    for ($m = 0; $m < 6; $m++) {
        $period = (clone $today)->modify('first day of this month')->modify("-$m months")->format('Y-m');
        $earn = [['Basic Salary', 6500000], ['Transport Allowance', 750000], ['Meal Allowance', 900000], ['Overtime', $overtime[$m]]];
        $gross = array_sum(array_column($earn, 1));
        $ded = [['BPJS Health', 130000], ['BPJS Employment', 260000], ['Income Tax (PPh 21)', round(($gross - 390000) * 0.043)]];
        foreach ([$emp, $mgr] as $u) {
            q('INSERT INTO payslips (user_id, period, earnings, deductions) VALUES (?,?,?,?)', [$u, $period, json_encode($earn), json_encode($ded)]);
        }
    }

    // Team schedule on weekdays, ±30 days.
    $ev = 'INSERT INTO schedule_events (user_id, event_date, start_time, title, place, color) VALUES (?,?,?,?,?,?)';
    for ($i = -30; $i <= 30; $i++) {
        $d = (clone $today)->modify("$i days");
        if ((int) $d->format('N') >= 6) { continue; }
        $date = $d->format('Y-m-d');
        $even = ((int) $d->format('j')) % 2 === 0;
        $friday = $d->format('N') === '5';
        q($ev, [$emp, $date, '09:00', 'IT Team Meeting', 'Meeting Room 1', 'green']);
        q($ev, [$emp, $date, $even ? '13:00' : '14:00', $even ? 'Server Maintenance' : 'New Device Installation', $even ? 'Data Center' : '5th Floor', 'blue']);
        q($ev, [$emp, $date, '15:00', $friday ? 'Weekly Report' : 'Database Backup', $friday ? 'Online Meeting' : 'Data Center', 'purple']);
    }

    if (!q('SELECT 1 FROM announcements LIMIT 1')->fetch()) {
        $ann = 'INSERT INTO announcements (category, icon, color, title, body, published_on) VALUES (?,?,?,?,?,?)';
        q($ann, ['HR', 'file', 'blue', 'Work From Office Policy Update', 'Starting next month, WFO applies 3 days a week (Monday, Wednesday, Thursday). On other days you may work from home, but still record attendance in the MyWork app.', $day(-2)]);
        q($ann, ['HR', 'heart', 'red', 'Employee Health Program', 'Free health check-ups on the 3rd floor of Head Office, 08:00–15:00. Please fast for 8 hours beforehand for the blood sugar test.', $day(-6)]);
        q($ann, ['IT', 'lock', 'purple', 'Periodic Password Update', 'For security, please update your MyWork password every 90 days. Use at least 12 characters combining letters, numbers and symbols.', $day(-12)]);
    }
    db()->commit();
    return "Demo data loaded. Sign in to the app as $empEmail (employee) or $mgrEmail (manager).";
}
