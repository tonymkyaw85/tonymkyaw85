# MyWork – Employee Self Service

A mobile-first employee self-service web app, built from the design in
[`assets/design-reference.jpg`](assets/design-reference.jpg). The UI is in English.

Plain HTML, CSS and JavaScript. There's no build step and nothing to install.

## Run

```bash
cd mywork
python3 -m http.server 8000   # or: npx http-server
# open http://localhost:8000
```

On desktop the app shows inside a phone frame. On a phone it fills the screen.

## Screens

| Route | Screen | What works |
|---|---|---|
| `#/onboarding` | Welcome | 3 swipeable slides, Skip / Next / Get Started |
| `#/login` | Sign in | Employee ID and password, show/hide password, "forgot password" reset |
| `#/home` | Home | Greeting, 12-item menu, today's attendance card, unread notification count |
| `#/notifikasi` | Notifications | Approval results, announcements and security alerts; mark all read; tap to open |
| `#/absensi` | Attendance | Live clock, work-duration ring, Check In / Check Out (asks to confirm when under 8 hours), location |
| `#/riwayat` | Attendance History | Month by month: days present, late arrivals (after 08:00), average hours, daily records |
| `#/cuti` | Leave Request | Leave types, remaining annual leave, date range, reason, attachment, validation |
| `#/izin`, `#/lembur` | Permission / Overtime | Permission and overtime request forms |
| `#/status` | Request Status | Filter by type, detail sheet with manager note, cancel pending requests |
| `#/approvals` | Approvals | Managers approve or reject (with a reason) pending requests, which notifies the employee. In demo mode you act as the manager |
| `#/slip-gaji` | Payslip | Month picker, hide/show net pay, salary breakdown, printable slip (save as PDF), payslip history |
| `#/reimburse` | Reimbursement Request | Category, rupiah-formatted amount, receipt attachment |
| `#/jadwal` | Work Schedule | Month calendar, holiday and leave markers, agenda for each day |
| `#/pengumuman` | Announcements | Category tabs, full announcement in a sheet |
| `#/profil` | My Profile | Employee details, edit profile, settings, change password |
| `#/dokumen` | My Documents | Upload, view, download, delete |
| `#/aktivitas` | Activity | Timeline of attendance and requests |
| `#/bye` | See You Soon | Logout |

## Two modes

- **Server mode** (when `config.js` has `apiUrl`): real sign-in, and all data is stored in your
  MySQL / MariaDB database through the PHP API in `api/`.
- **Demo mode** (when `apiUrl` is empty, as in the claude.ai preview): sample data stored only in
  the browser. Demo login: Employee ID **EMP00123**, password **password123**.

## Setup on a Synology NAS (Web Station + MariaDB + phpMyAdmin)

The browser can't talk to MySQL directly, so the NAS runs a small PHP API (`api/`) next to the
app. Everything is served from the NAS at one address, e.g. `https://your-nas/mywork/`.

### 1. Packages (Package Center)
Install **Web Station**, **PHP 8.2** (8.0 or newer works), **MariaDB 10** and **phpMyAdmin**.

In **Web Station → Script Language Settings**, edit the PHP 8.2 profile and enable the
`pdo_mysql`, `mysqli`, `fileinfo` and `mbstring` extensions. Make sure the default web server
(or your web portal) uses this PHP profile.

### 2. Database (phpMyAdmin)
1. Click **New**, name the database `mywork`, collation `utf8mb4_unicode_ci`, **Create**.
2. With `mywork` selected, open **Import**, choose [`database/schema.sql`](database/schema.sql), click **Import**.
3. **User accounts → Add user account**: user name `mywork`, host `localhost`, a strong password.
   Don't tick any global privileges. Save, then open **Edit privileges → Database → mywork** and grant only
   `SELECT`, `INSERT`, `UPDATE`, `DELETE`.

### 3. Files (File Station)
1. Copy this `mywork` folder into the **web** shared folder, so you have `/web/mywork/index.html`.
2. In `web/mywork/api/`, copy `config.sample.php` to `config.php` and edit it:
   - `db`: for Synology MariaDB 10 use `'socket' => '/run/mysqld/mysqld10.sock'` (or host `127.0.0.1`, port `3307`),
     database `mywork`, user `mywork` and the password from step 2.
   - `admin_password`: at least 12 characters. This opens the HR admin page.
   - `timezone`: your company's time zone (default `Asia/Jakarta`).
3. Give the **http** group read/write permission on `web/mywork/api/storage` (right-click → Properties →
   Permission). Uploaded documents are saved there under random names. For extra safety, point `storage_dir`
   at a folder outside `web` (and add it to the PHP profile's `open_basedir`).

### 4. HTTPS (strongly recommended)
Passwords travel over the network, so use HTTPS: get a certificate in **Control Panel → Security →
Certificate** (Let's Encrypt), and reach the NAS through its HTTPS address or a reverse proxy
(**Control Panel → Login Portal → Advanced → Reverse Proxy**). Then set `'https_only_cookies' => true`
in `config.php`.

### 5. First run
1. Open `https://your-nas/mywork/api/admin.php` and sign in with the admin password.
2. **Employees**: add each person (email, name, employee ID, role, password). Choose **Manager** for
   people who approve requests. Use **Edit / reset password** when someone forgets their password.
   Or use **Demo data** to create two test accounts with sample data.
3. Open `https://your-nas/mywork/` and sign in with a work email and password.

### Day-to-day (HR)
| Task | Where |
|---|---|
| Add or deactivate an employee, reset a password | Admin page → Employees |
| Post an announcement (notifies everyone) | Admin page → Announcements |
| Enter a payslip | Admin page → Payslips (`Label: amount`, one per line) |
| Add a public holiday or team agenda | phpMyAdmin → `schedule_events` (leave `user_id` empty for everyone) |

### Who can do what
Enforced by the PHP API, not the app:

| | Employee | Manager |
|---|---|---|
| Own profile, attendance, requests, notifications, documents, payslips | ✔ | ✔ |
| Edit own phone and address | ✔ | ✔ |
| Check in and out (times come from the server clock, today only) | ✔ | ✔ |
| Submit requests (annual leave balance is checked by the server) | ✔ | ✔ |
| Cancel own **pending** requests | ✔ | ✔ |
| See pending requests from everyone, open their attachments | | ✔ |
| Approve or reject **other people's** requests | | ✔ |
| See other people's documents or payslips | | |

Also built in: passwords stored as bcrypt hashes, sign-in locked for 15 minutes after 5 wrong
passwords, protection against cross-site requests, uploads limited to PDF, image, Word and Excel
files (10 MB), and deactivated employees are signed out immediately.

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js` | The app (screens, routing, demo data) |
| `config.js` | `apiUrl` of the PHP API; leave empty for demo mode |
| `backend.js` | Talks to the PHP API: sign-in, data, uploads |
| `api/index.php` | The JSON API with all permission checks |
| `api/admin.php`, `api/demo.php` | HR admin page and its demo-data loader |
| `api/lib.php` | Database, session and file helpers |
| `api/config.sample.php` | Settings template; copy to `config.php` (never commit that file) |
| `database/schema.sql` | MySQL / MariaDB tables, imported with phpMyAdmin |
