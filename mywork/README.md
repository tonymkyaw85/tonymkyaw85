# MyWork – Employee Self Service

A mobile-first employee self-service web app, built from the design in
[`assets/design-reference.jpg`](assets/design-reference.jpg). The UI is in Indonesian.

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
| `#/onboarding` | Welcome | "Mulai Sekarang" opens the app |
| `#/home` | Beranda | Greeting, 12-item menu, today's attendance card, notification dot |
| `#/absensi` | Absensi | Live clock, work-duration ring, Check In / Check Out (asks to confirm when under 8 hours), attendance history, location |
| `#/cuti` | Pengajuan Cuti | Leave types, remaining annual leave, date range, reason, attachment, validation |
| `#/izin`, `#/lembur` | Izin / Lembur | Permission and overtime request forms |
| `#/status` | Status Pengajuan | Filter by type, detail sheet, cancel pending requests |
| `#/slip-gaji` | Slip Gaji | Month picker, hide/show net pay, salary breakdown, printable slip (save as PDF), payslip history |
| `#/reimburse` | Pengajuan Reimburse | Category, rupiah-formatted amount, receipt attachment |
| `#/jadwal` | Jadwal Kerja | Month calendar, holiday and leave markers, agenda for each day |
| `#/pengumuman` | Pengumuman | Category tabs, full announcement in a sheet |
| `#/profil` | Profil Saya | Employee details, edit profile, settings, change password |
| `#/dokumen` | Dokumen Saya | Upload, view, download, delete |
| `#/aktivitas` | Aktivitas | Timeline of attendance and requests |
| `#/bye` | Sampai Jumpa | Logout |

## Data

Everything is stored in the browser's `localStorage` under `mywork-state-v1`, starting
from demo data for "Ahmad Fauzi". To restore the demo data, use **Lainnya → Reset Data Demo**.
There is no backend yet. To add one, replace `addRequest`, `save` and the seed data in
`app.js` with API calls.
