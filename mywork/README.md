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
| `#/approvals` | Approvals (demo) | Act as the manager: approve or reject (with a reason) pending requests, which notifies the employee |
| `#/slip-gaji` | Payslip | Month picker, hide/show net pay, salary breakdown, printable slip (save as PDF), payslip history |
| `#/reimburse` | Reimbursement Request | Category, rupiah-formatted amount, receipt attachment |
| `#/jadwal` | Work Schedule | Month calendar, holiday and leave markers, agenda for each day |
| `#/pengumuman` | Announcements | Category tabs, full announcement in a sheet |
| `#/profil` | My Profile | Employee details, edit profile, settings, change password |
| `#/dokumen` | My Documents | Upload, view, download, delete |
| `#/aktivitas` | Activity | Timeline of attendance and requests |
| `#/bye` | See You Soon | Logout |

## Demo login

Employee ID **EMP00123**, password **password123**. You can change the password in
Profile → Settings → Change Password, or reset it from "Forgot password?" on the sign-in screen.

## Data

Everything is stored in the browser's `localStorage` under `mywork-state-v2`, starting
from demo data for "Ahmad Fauzi". To restore the demo data, use **More → Reset Demo Data**.
The password is stored only as a SHA-256 hash, but because everything runs in the browser this
is demo-only security. There is no backend yet. To add one, replace `addRequest`, `save` and the seed data in
`app.js` with API calls.
