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

- **Supabase mode** (when `config.js` has a Supabase URL and key): real sign-in, and all data
  lives in your Supabase database and storage.
- **Demo mode** (when `config.js` is empty, as in the claude.ai preview): sample data stored
  only in the browser. Demo login: Employee ID **EMP00123**, password **password123**.

## Supabase setup

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
3. **Add people.** Create each person in **Authentication → Users → Add user** (tick **Auto Confirm User**),
   then add them to MyWork in the SQL Editor:
   ```sql
   select public.mywork_add_employee('ahmad@company.com', 'EMP00123', 'Ahmad Fauzi', 'IT Support', 'Information Technology');
   select public.mywork_add_employee('siti@company.com', 'EMP00007', 'Siti Rahma', 'IT Manager', 'Information Technology', 'manager');
   ```
   The last value is `employee` (default) or `manager`; managers can approve requests. Accounts that
   exist on the server but weren't added this way can't sign in to MyWork.
4. **Optional demo data.** With two users created, run
   `select public.mywork_seed_demo('employee@your-domain.com', 'manager@your-domain.com');`
   It adds them to MyWork (as EMP00123 and EMP00007) with sample attendance, requests, payslips,
   schedule and announcements.
5. **Password reset emails** need SMTP configured on your Supabase server (`SMTP_*` in `.env`),
   and the app's address added to the allowed redirect URLs (`ADDITIONAL_REDIRECT_URLS`).
6. **Host the app.** Upload the `mywork/` folder to any static host (your own domain, Vercel,
   Netlify, GitHub Pages). The claude.ai preview page can't reach outside servers, so it always runs in demo mode.

### Who can do what

Enforced by the database (row level security), not the app:

| | Employee | Manager |
|---|---|---|
| Own profile, attendance, requests, notifications, documents, payslips | ✔ | ✔ |
| Edit own phone and address | ✔ | ✔ |
| Check in and out (times come from the server clock, today only) | ✔ | ✔ |
| Submit requests (annual leave balance is checked by the server) | ✔ | ✔ |
| Cancel own **pending** requests | ✔ | ✔ |
| See everyone's profiles, attendance and requests | | ✔ |
| Approve or reject **other people's** requests | | ✔ |
| See other people's documents or payslips | | |

Announcements, payslips and schedule events are added by HR in the Table Editor (`mywork_announcements`, `mywork_payslips`, `mywork_schedule_events`). Every new
announcement notifies all active employees automatically.

## Files

| File | Purpose |
|---|---|
| `index.html`, `styles.css`, `app.js` | The app (screens, routing, demo data) |
| `config.js` | Supabase URL and public anon key; leave empty for demo mode |
| `backend.js` | Supabase data layer: sign-in, queries, uploads |
| `supabase/schema.sql` | Database tables, security rules, triggers, storage, demo seed |
