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

## How it fits together

- **Odoo (`edpn.odoo.com`, EDPN Technologies Pte. Ltd. only)** is the system of record for HR data:
  employee profile, attendance, time off, expenses (with receipts) and payslips.
- **Supabase (`supabase.delimooo.com`)** handles sign-in with the company email, announcements,
  in-app notifications and personal documents.
- **The `mywork-odoo` Edge Function** (in `supabase/functions/`) sits between them. It holds the Odoo
  API key, checks the signed-in user's email against Odoo, and only lets each person see and change
  their own records. Managers (anyone who is set as "Manager" on an employee in Odoo) approve or refuse
  their direct reports' time off and expenses in the app; Odoo records the decision with a note naming
  the manager.
- **Demo mode**: with `supabaseUrl` empty in `config.js` (as in the claude.ai preview) the app uses
  sample data in the browser. Demo login: Employee ID **EMP00123**, password **password123**.

## Odoo setup (EDPN SG)

1. **Integration user.** In Odoo create a user such as "MyWork Integration" with:
   - Allowed companies: **EDPN TECHNOLOGIES PTE. LTD.** only.
   - Access rights: Employees **Officer**, Attendances **Officer**, Time Off **Officer**,
     Expenses **Team Approver**, Payroll **Assistant** (to read payslips).
2. **API key** for that user: Preferences → Account Security → New API Key. Odoo limits keys to
   **3 months**, so renew it before it expires and update `ODOO_API_KEY` on the server.
3. **One work email per person.** Each employee signs in with the work email on their Odoo employee
   record, so every work email must be unique within EDPN SG.
4. **Time off.** Allocate Annual Leave and Sick Time Off to employees in Odoo; types that need an
   allocation are hidden in the app until the employee has days allocated.
5. **Public holidays.** Add Singapore public holidays in Odoo (Time Off → Configuration → Public
   Holidays) so they appear in the app's schedule.

## Install the Odoo function on your Supabase server

On the machine that runs Supabase (the `supabase/docker` folder of the self-hosted setup):

1. Copy this repository's `mywork/supabase/functions/mywork-odoo/` folder to
   `supabase/docker/volumes/functions/mywork-odoo/`.
2. Add these lines to `supabase/docker/.env` (the key from step 2 above goes here, nowhere else):
   ```
   ODOO_URL=https://edpn.odoo.com
   ODOO_DB=edpn
   ODOO_API_KEY=paste-the-integration-user-key-here
   ODOO_COMPANY_ID=1
   MYWORK_TIMEZONE=Asia/Singapore
   MYWORK_ALLOWED_ORIGINS=https://your-app-address
   ```
3. In `supabase/docker/docker-compose.yml`, under the `functions:` service's `environment:`, add:
   ```
   ODOO_URL: ${ODOO_URL}
   ODOO_DB: ${ODOO_DB}
   ODOO_API_KEY: ${ODOO_API_KEY}
   ODOO_COMPANY_ID: ${ODOO_COMPANY_ID}
   MYWORK_TIMEZONE: ${MYWORK_TIMEZONE}
   MYWORK_ALLOWED_ORIGINS: ${MYWORK_ALLOWED_ORIGINS}
   ```
4. Run `docker compose up -d functions`. Opening
   `https://supabase.delimooo.com/functions/v1/mywork-odoo` in a browser should then show
   `{"error":"Use POST."}`.

## Supabase setup (sign-in, announcements, notifications, documents)

`config.js` already points to `https://supabase.delimooo.com` with its public anon key.

1. **Create the database.** In Supabase Studio, open **SQL Editor → New query**, paste all of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. It is safe to run again later.
   If the paste gets cut off (an "unterminated dollar-quoted string" error), run the 9 smaller files in
   [`supabase/parts/`](supabase/parts) one at a time, in order, instead. They contain the same SQL;
   regenerate them with `python3 supabase/split_schema.py` after editing `schema.sql`.
   Everything it creates starts with `mywork_` (tables, functions, triggers) or `mywork-` (the two
   private storage buckets), so it never touches other apps on the same server.
2. **Turn off public sign-ups.** HR should create employee accounts, so strangers can't sign up.
   On self-hosted Supabase, set `DISABLE_SIGNUP=true` in your `.env` and restart.
3. **Add people.** Create each person in **Authentication → Users → Add user** using the **same work email
   as on their Odoo employee record**, and tick **Auto Confirm User**. Nothing else is needed: their
   name, job, department, manager and role come from Odoo when they first sign in. People whose email
   doesn't match exactly one EDPN SG employee can't use the app.
4. **Password reset emails** need SMTP configured on your Supabase server (`SMTP_*` in `.env`),
   and the app's address added to the allowed redirect URLs (`ADDITIONAL_REDIRECT_URLS`).
5. **Host the app.** Upload the `mywork/` folder to any static host (your own domain, Vercel,
   Netlify, GitHub Pages). The claude.ai preview page can't reach outside servers, so it always runs in demo mode.

The tables for attendance, requests, payslips and schedule in `schema.sql` (and the `mywork_seed_demo`
helper) are from before the Odoo connection and are no longer used by the app.

### Who can do what

Enforced by the `mywork-odoo` function (and Odoo's own rules), not the app:

| | Employee | Manager |
|---|---|---|
| See own profile, attendance, time off, expenses, payslips | ✔ | ✔ |
| Check in and out (time from the server clock) | ✔ | ✔ |
| Request time off, submit expenses with receipts | ✔ | ✔ |
| Cancel own requests that haven't been decided | ✔ | ✔ |
| See and decide on **direct reports'** time off and expenses | | ✔ |
| Decide on own requests, or anyone else's | | |

Every new announcement notifies all active employees automatically; time off and expense
requests notify the employee's manager, and decisions notify the employee.

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js` | The app (screens, routing, demo data) |
| `config.js` | Supabase URL and public anon key; leave empty for demo mode |
| `backend.js` | Sign-in and Supabase data; calls the Odoo function for HR data |
| `supabase/functions/mywork-odoo/` | Edge Function bridging the app and Odoo (`index.ts`, `hr.ts`, `odoo.ts`) |
| `supabase/schema.sql` | Supabase tables, security rules and storage (profiles, announcements, notifications, documents) |
