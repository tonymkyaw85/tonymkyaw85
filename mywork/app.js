/* MyWork – Employee Self Service
 * Single-page app, vanilla JS, hash routing, state persisted in localStorage. */
(() => {
  "use strict";

  // ---------- Icons (24x24 stroke icons) ----------
  const ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowR: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6A13 13 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M14.1 14.1a3 3 0 1 1-4.2-4.2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    timer: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.2 12h4.3l1.5-3 3 6 1.5-3h7.3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    palm: '<path d="M12 22V10"/><path d="M12 10c-2-3-6-4-9-2 3 0 5 1 6 3M12 10c2-3 6-4 9-2-3 0-5 1-6 3M12 10c-1-3-4-6-7-6 2 1 4 3 4 5M12 10c1-3 4-6 7-6-2 1-4 3-4 5"/><path d="M7 22h10"/>',
  };
  const ic = (name, size = 20, color = "currentColor", sw = 2) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const fmtDay = (d) => `${DAYS[d.getDay()]}, ${fmtDate(d)}`;
  const fmtRange = (a, b) => (a === b || !b ? fmtDate(parseIso(a)) : (() => {
    const x = parseIso(a), y = parseIso(b);
    return x.getMonth() === y.getMonth() && x.getFullYear() === y.getFullYear()
      ? `${x.getDate()} - ${fmtDate(y)}` : `${fmtDate(x)} - ${fmtDate(y)}`;
  })());
  const hm = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const hms = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const idr = (n) => "Rp " + Math.round(n).toLocaleString("en-US");
  const fileSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  const daysBetween = (a, b) => Math.round((parseIso(b) - parseIso(a)) / 86400000) + 1;
  const ago = (ts) => {
    const diff = Date.now() - ts, m = 60000, h = 60 * m, d = 24 * h;
    if (diff < h) return `${Math.max(1, Math.round(diff / m))} min ago`;
    if (diff < d) return `${Math.round(diff / h)}h ago`;
    if (diff < 7 * d) return `${Math.round(diff / d)}d ago`;
    const w = Math.round(diff / (7 * d));
    return w < 5 ? `${w}w ago` : `${Math.round(diff / (30 * d))}mo ago`;
  };

  // ---------- State ----------
  const KEY = "mywork-state-v2";
  const today = () => iso(new Date());
  const DAY = 86400000;

  function seed() {
    const now = Date.now();
    const t = new Date();
    const at = (h, m) => new Date(t.getFullYear(), t.getMonth(), t.getDate(), h, m).getTime();
    const d = (offset) => iso(new Date(now + offset * DAY));
    const history = [];
    for (let i = 1; i <= 10; i++) {
      const day = new Date(now - i * DAY);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      const base = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      history.push({
        date: iso(day),
        in: base.getTime() + (7 * 60 + 50 + ((i * 7) % 20)) * 60000,
        out: base.getTime() + (17 * 60 + ((i * 11) % 40)) * 60000,
      });
    }
    return {
      onboarded: false,
      user: {
        name: "Ahmad Fauzi", role: "IT Support", id: "EMP00123", status: "Active",
        email: "ahmad.fauzi@company.co.id", phone: "+62 812 3456 7890",
        dept: "Information Technology", joined: "2020-01-12", address: "East Jakarta, DKI Jakarta",
      },
      leave: { total: 12, used: 4 },
      attendance: { date: today(), in: Date.now() > at(8, 2) ? at(8, 2) : null, out: null, location: "Head Office" },
      history,
      requests: [
        { id: 1, type: "cuti", title: "Annual Leave", from: d(-3), to: d(-1), status: "Approved", note: "Family matters.", created: now - 3 * 3600000 },
        { id: 2, type: "izin", title: "Permission", from: d(-11), to: d(-11), status: "Pending", note: "Handling civil registry documents.", created: now - 4 * 3600000 },
        { id: 3, type: "lembur", title: "Overtime", from: d(-18), to: d(-18), status: "Rejected", note: "Server maintenance outside working hours (3 hours).", created: now - 7 * DAY },
        { id: 4, type: "reimburse", title: "Reimbursement", from: d(-22), to: d(-22), status: "Approved", note: "Transport for client meeting", amount: 150000, category: "Transport", created: now - 7 * DAY },
      ],
      docs: [
        { id: 1, name: "ID Card (KTP)", file: "ktp_ahmad.pdf", size: 1258291, kind: "blue" },
        { id: 2, name: "Tax ID (NPWP)", file: "npwp_ahmad.pdf", size: 1153434, kind: "red" },
        { id: 3, name: "BPJS Health", file: "bpjs_kesehatan.pdf", size: 870400, kind: "green" },
        { id: 4, name: "Vaccine Certificate", file: "vaksin_covid.pdf", size: 1003520, kind: "orange" },
        { id: 5, name: "Employment Letter", file: "paklaring.pdf", size: 1468006, kind: "purple" },
      ],
      notifRead: false,
      nextId: 100,
    };
  }

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { state = seed(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ } };

  // Roll attendance over to a new day, archiving yesterday's record.
  function syncAttendanceDay() {
    const a = state.attendance;
    if (a.date !== today()) {
      if (a.in) state.history.unshift({ date: a.date, in: a.in, out: a.out });
      state.attendance = { date: today(), in: null, out: null, location: "Head Office" };
      save();
    }
  }
  syncAttendanceDay();

  // ---------- Static content ----------
  const ANNOUNCEMENTS = [
    { cat: "Company", icon: "megaphone", color: "red", title: "National Holiday", date: "2026-09-12",
      body: "In observance of the Prophet's Birthday, the office will be closed on 28 Sep 2026. Normal operations resume on Tuesday, 29 Sep 2026. Teams on duty, please coordinate with your supervisors." },
    { cat: "HR", icon: "file", color: "blue", title: "Work From Office Policy Update", date: "2026-09-10",
      body: "Starting October 2026, WFO applies 3 days a week (Monday, Wednesday, Thursday). On other days you may work from home, but still record attendance in the MyWork app." },
    { cat: "HR", icon: "heart", color: "red", title: "Employee Health Program", date: "2026-09-08",
      body: "Free health check-ups on 20 Sep 2026 on the 3rd floor of Head Office, 08:00–15:00. Please fast for 8 hours beforehand for the blood sugar test." },
    { cat: "HR", icon: "info", color: "blue", title: "Complete Your Personal Data", date: "2026-09-05",
      body: "Please complete your personal data in the profile menu by the end of this month so BPJS and payroll records stay accurate." },
    { cat: "IT", icon: "lock", color: "purple", title: "Periodic Password Update", date: "2026-09-02",
      body: "For security, all employees must update their office account password every 90 days. Use at least 12 characters combining letters, numbers and symbols." },
  ];

  const HOLIDAYS = { "2026-09-28": "National Holiday – Prophet's Birthday" };
  const AGENDA_POOL = [
    { time: "09:00", title: "IT Team Meeting", place: "Meeting Room 1", color: "var(--green)" },
    { time: "10:30", title: "Helpdesk Ticket Review", place: "Online Meeting", color: "var(--primary)" },
    { time: "13:00", title: "Server Maintenance", place: "Data Center", color: "var(--primary)" },
    { time: "14:00", title: "New Device Installation", place: "5th Floor", color: "var(--orange)" },
    { time: "15:00", title: "Weekly Report", place: "Online Meeting", color: "var(--purple)" },
    { time: "16:00", title: "Database Backup", place: "Data Center", color: "var(--green)" },
  ];
  function agendaFor(dateStr) {
    if (HOLIDAYS[dateStr]) return [{ time: "—", title: HOLIDAYS[dateStr], place: "Office closed", color: "var(--red)" }];
    const d = parseIso(dateStr);
    if (d.getDay() === 0 || d.getDay() === 6) return [];
    const leave = state.requests.find((r) => r.type === "cuti" && r.status !== "Rejected" && dateStr >= r.from && dateStr <= r.to);
    if (leave) return [{ time: "—", title: leave.title, place: `Status: ${leave.status}`, color: "var(--orange)" }];
    const seedN = d.getDate() + d.getMonth();
    const picks = [0, 2 + (seedN % 2), 4 + (seedN % 2)];
    if (d.getDay() === 5) picks[2] = 4; // weekly report every Friday
    return picks.map((i) => AGENDA_POOL[i]);
  }

  const TYPE_META = {
    cuti: { icon: "palm", bg: "var(--primary-soft)", fg: "var(--primary)" },
    izin: { icon: "clipboard", bg: "var(--orange-soft)", fg: "var(--orange)" },
    lembur: { icon: "timer", bg: "var(--red-soft)", fg: "var(--red)" },
    reimburse: { icon: "receipt", bg: "var(--green-soft)", fg: "var(--green)" },
  };
  const STATUS_BADGE = { Approved: "green", Pending: "orange", Rejected: "red" };
  const COLOR = {
    blue: ["var(--primary-soft)", "var(--primary)"], red: ["var(--red-soft)", "var(--red)"],
    green: ["var(--green-soft)", "var(--green)"], orange: ["var(--orange-soft)", "var(--orange)"],
    purple: ["var(--purple-soft)", "var(--purple)"],
  };

  // ---------- Illustrations ----------
  const avatar = (size = 44) => `
    <div class="avatar" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 64 64"><rect width="64" height="64" fill="#dbe7fb"/>
        <path d="M12 64c0-12 9-19 20-19s20 7 20 19Z" fill="#2f6fe0"/>
        <path d="M27 44h10v6l-5 4-5-4Z" fill="#f1c9a5"/><path d="M28 50l4 4 4-4 2 3-6 5-6-5Z" fill="#fff"/>
        <ellipse cx="32" cy="30" rx="11" ry="13" fill="#f6d3b3"/>
        <path d="M20 29c-1-11 6-17 13-17 8 0 13 5 12 16-2-5-5-7-8-8-4 3-11 4-17 9Z" fill="#23272f"/>
        <circle cx="28" cy="31" r="1.3" fill="#23272f"/><circle cx="36" cy="31" r="1.3" fill="#23272f"/>
        <path d="M29 37c2 1.5 4 1.5 6 0" stroke="#b36b4c" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </svg></div>`;

  const person = (x, skin, hair, shirt, female, flip) => `
    <g transform="translate(${x} 0)${flip ? " scale(-1 1)" : ""}">
      <path d="M-44 300c0-52 20-86 44-86s44 34 44 86Z" fill="${shirt}"/>
      <path d="M-10 214h20l-10 26Z" fill="#fff"/><path d="M-2 218h4l2 30-4 6-4-6Z" fill="#1d3f8a"/>
      <rect x="-9" y="190" width="18" height="26" rx="8" fill="${skin}"/>
      ${female ? `<path d="M-28 160c-6 24-4 44 2 56h16v-40ZM28 160c6 24 4 44-2 56h-16v-40Z" fill="${hair}"/>` : ""}
      <ellipse cx="0" cy="170" rx="24" ry="28" fill="${skin}"/>
      <path d="M-25 168c-3-26 11-40 27-40 17 0 28 12 24 38-4-12-12-16-19-18-8 8-20 10-32 20Z" fill="${hair}"/>
      <circle cx="-8" cy="174" r="2.4" fill="#23272f"/><circle cx="9" cy="174" r="2.4" fill="#23272f"/>
      <path d="M-6 186c4 3 8 3 12 0" stroke="#b36b4c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M-18 216c-6 20-6 36 0 48h18" stroke="#1d3f8a" stroke-width="3" fill="none"/>
      <rect x="-4" y="252" width="16" height="22" rx="3" fill="#fff" stroke="#1d3f8a" stroke-width="2"/>
      <rect x="10" y="232" width="38" height="50" rx="6" fill="#2b2f3a" transform="rotate(-8 29 257)"/>
      <rect x="14" y="237" width="30" height="40" rx="3" fill="#5a8ff0" transform="rotate(-8 29 257)"/>
      <ellipse cx="22" cy="266" rx="10" ry="8" fill="${skin}"/>
    </g>`;

  const onboardArt = `
    <svg viewBox="0 0 320 300" role="img" aria-label="Two employees holding tablets">
      <circle cx="160" cy="170" r="130" fill="#dce8fd"/>
      <g fill="#c4d6f7"><rect x="40" y="90" width="36" height="120" rx="4"/><rect x="84" y="60" width="44" height="150" rx="4"/><rect x="200" y="75" width="40" height="135" rx="4"/><rect x="248" y="105" width="30" height="105" rx="4"/></g>
      <g fill="#e8f0ff"><rect x="92" y="72" width="8" height="10"/><rect x="108" y="72" width="8" height="10"/><rect x="92" y="92" width="8" height="10"/><rect x="108" y="92" width="8" height="10"/><rect x="208" y="88" width="8" height="10"/><rect x="224" y="88" width="8" height="10"/><rect x="208" y="108" width="8" height="10"/><rect x="224" y="108" width="8" height="10"/></g>
      <g transform="translate(0 0)">${person(120, "#f6d3b3", "#23272f", "#3f7ff0", false, false)}</g>
      <g transform="translate(0 16) scale(1)">${person(218, "#f3c9a6", "#3a2a22", "#6ea0f5", true, true)}</g>
    </svg>`;

  const goodbyeArt = `
    <svg viewBox="0 0 320 300" role="img" aria-label="Employee waving goodbye">
      <circle cx="160" cy="180" r="120" fill="#dce8fd"/>
      <g fill="#c4d6f7"><rect x="36" y="110" width="40" height="120" rx="4"/><rect x="244" y="90" width="44" height="140" rx="4"/></g>
      ${person(160, "#f6d3b3", "#23272f", "#3f7ff0", false, false)}
      <path d="M130 238c-20-10-30-40-26-66" stroke="#3f7ff0" stroke-width="20" fill="none" stroke-linecap="round"/>
      <circle cx="104" cy="160" r="12" fill="#f6d3b3"/>
      <circle cx="238" cy="110" r="22" fill="#1a6bf0"/><path d="m228 110 7 7 13-14" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  const logoMark = `
    <svg width="64" height="56" viewBox="0 0 64 56" aria-hidden="true">
      <circle cx="16" cy="10" r="8" fill="#3b82f6"/><circle cx="48" cy="10" r="8" fill="#1a6bf0"/>
      <path d="M4 54V32c0-8 5-12 12-12s10 4 16 14c6-10 9-14 16-14s12 4 12 12v22H48V34c0-2-1-3-2-3s-3 2-6 7l-8 12-8-12c-3-5-5-7-6-7s-2 1-2 3v20Z" fill="url(#lg)"/>
      <defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#0f55cc"/></linearGradient></defs>
    </svg>`;

  // ---------- UI primitives ----------
  const header = (title, opts = {}) => `
    <div class="header">
      <button class="icon-btn" data-back aria-label="Back">${ic("back", 22)}</button>
      <h1>${esc(title)}</h1>${opts.right || ""}
    </div>`;

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function sheet(html, onMount) {
    closeSheet();
    const back = document.createElement("div");
    back.className = "sheet-back";
    back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grip"></div>${html}</div>`;
    back.addEventListener("click", (e) => { if (e.target === back || e.target.closest("[data-close]")) closeSheet(); });
    $(".device").appendChild(back);
    onMount && onMount(back.querySelector(".sheet"));
  }
  function closeSheet() { document.querySelectorAll(".sheet-back").forEach((n) => n.remove()); }

  // ---------- Screens ----------
  const screens = {};

  screens.onboarding = () => ({
    full: true, noTabs: true,
    html: `
      <div class="onboard fade-in">
        <div class="logo">${logoMark}<h2>MyWork</h2><p>Employee Self Service</p></div>
        <p class="tagline">Empowered Employees<br/>A More Productive Company</p>
        <div class="illus">${onboardArt}</div>
        <div class="pager"><span></span><span class="on"></span><span></span></div>
        <button class="btn" data-action="start">Get Started ${ic("arrowR", 18)}</button>
      </div>`,
  });

  const MENU = [
    ["Attendance", "userCheck", "orange", "#/absensi"], ["Leave", "palm", "green", "#/cuti"],
    ["Permission", "clipboard", "red", "#/izin"], ["Overtime", "timer", "orange", "#/lembur"],
    ["Payslip", "wallet", "blue", "#/slip-gaji"], ["Reimburse", "receipt", "green", "#/reimburse"],
    ["Documents", "folder", "red", "#/dokumen"], ["Requests", "send", "blue", "#/status"],
    ["Profile", "user", "blue", "#/profil"], ["Schedule", "calendar", "blue", "#/jadwal"],
    ["News", "megaphone", "blue", "#/pengumuman"], ["More", "grid", "blue", "more"],
  ];

  screens.home = () => {
    const a = state.attendance;
    const status = a.out ? ["Checked Out", "blue"] : a.in ? ["Checked In", "green"] : ["Not Checked In", "orange"];
    const h = new Date().getHours();
    const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return {
      html: `
      <div class="fade-in">
        <div class="greet">
          ${avatar(46)}
          <div class="grow"><div class="small muted">Hello,</div><div class="bold" style="font-size:17px">${esc(state.user.name)}</div><div class="xs muted">${esc(state.user.role)}</div></div>
          <button class="icon-btn" data-go="#/pengumuman" aria-label="Notifications">${ic("bell", 22)}${state.notifRead ? "" : '<span class="dot"></span>'}</button>
        </div>
        <div class="hero"><span class="sun"></span><span class="hill"></span>
          <h3>Have a great day!</h3><p>${greeting}. Stay motivated and be your best self today.</p>
        </div>
        <div class="menu-grid">
          ${MENU.map(([label, icon, color, go]) => `
            <button class="menu-item" ${go === "more" ? 'data-action="more"' : `data-go="${go}"`}>
              <span class="menu-icon" style="background:${COLOR[color][0]}">${ic(icon, 24, COLOR[color][1])}</span>${label}
            </button>`).join("")}
        </div>
        <button class="card" data-go="#/absensi" style="width:100%;text-align:left">
          <div class="row between"><div><div class="bold">Today's Attendance</div><div class="small muted" style="margin-top:2px">${fmtDay(new Date())}</div></div>
          <span class="badge ${status[1]}">${status[0]}</span></div>
          <div class="row" style="margin-top:14px">
            <div class="grow"><div class="xs muted">In</div><div class="bold">${a.in ? hm(a.in) : "--:--"}</div></div>
            <div class="grow"><div class="xs muted">Out</div><div class="bold">${a.out ? hm(a.out) : "--:--"}</div></div>
            <div class="grow"><div class="xs muted">Location</div><div class="bold">${esc(a.location)}</div></div>
          </div>
        </button>
      </div>`,
    };
  };

  screens.absensi = () => {
    const a = state.attendance;
    const now = new Date();
    const worked = a.in ? ((a.out || now.getTime()) - a.in) : 0;
    const pct = Math.min(1, worked / (9 * 3600000));
    const C = 2 * Math.PI * 92;
    const label = a.out ? "Checked Out" : a.in ? "Checked In" : "Not Checked In";
    const labelColor = a.in ? "var(--green)" : "var(--muted)";
    const dur = `${Math.floor(worked / 3600000)}h ${pad(Math.floor(worked / 60000) % 60)}m`;
    return {
      tick: true,
      html: `
      ${header("Attendance")}
      <div class="fade-in">
        <div class="bold" style="text-align:center;font-size:16px">${fmtDay(now)}</div>
        <div class="ring-wrap">
          <svg viewBox="0 0 210 210"><circle cx="105" cy="105" r="92" fill="#fff" stroke="#e6ebf3" stroke-width="12"/>
            <circle id="ring" cx="105" cy="105" r="92" fill="none" stroke="var(--green)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" style="transition:stroke-dashoffset .6s"/></svg>
          <div class="ring-center">
            <span class="check ${a.in ? "" : "off"}">${ic(a.in ? "check" : "clock", 20, "#fff", 3)}</span>
            <span class="bold small" style="color:${labelColor}">${label}</span>
            <span class="time" id="live-time">${hms(now)}</span>
            <span class="xs muted">${a.in ? `Worked ${dur}` : esc(a.location)}</span>
          </div>
        </div>
        <div class="card stat-pair">
          <div class="stat"><span class="stat-ic" style="background:var(--green-soft)">${ic("login", 18, "var(--green)")}</span><div><div class="xs muted">Check In</div><div class="bold" style="font-size:17px">${a.in ? hm(a.in) : "-"}</div></div></div>
          <div class="stat"><span class="stat-ic" style="background:#eef1f6">${ic("logout", 18, "var(--muted)")}</span><div><div class="xs muted">Check Out</div><div class="bold" style="font-size:17px">${a.out ? hm(a.out) : "-"}</div></div></div>
        </div>
        ${a.out
          ? `<button class="btn ghost" disabled>${ic("check", 18)} Attendance Complete</button>`
          : `<button class="btn" data-action="${a.in ? "checkout" : "checkin"}">${a.in ? "Check Out" : "Check In"}</button>`}
        <div style="margin-top:20px">
          <button class="list-item" data-action="history">${ic("history", 20, "var(--muted)")}<span class="grow">Attendance History</span><span class="chev">${ic("chevR", 18)}</span></button>
          <button class="list-item" data-action="location">${ic("pin", 20, "var(--muted)")}<span class="grow">My Location</span><span class="chev">${ic("chevR", 18)}</span></button>
        </div>
      </div>`,
    };
  };

  const CUTI_TABS = ["Annual Leave", "Sick Leave", "Other Leave"];
  let cutiTab = 0;
  screens.cuti = () => {
    const left = state.leave.total - state.leave.used;
    const t = today();
    return {
      html: `
      ${header("Leave Request")}
      <div class="fade-in">
        <div class="chips">${CUTI_TABS.map((c, i) => `<button class="chip ${i === cutiTab ? "active" : ""}" data-action="cutiTab" data-i="${i}">${c}</button>`).join("")}</div>
        ${cutiTab === 0 ? `
        <div class="balance"><div><div class="small bold" style="color:var(--primary)">Annual Leave Balance</div><div class="big">${left} days</div><div class="xs muted">of ${state.leave.total} days</div></div>${ic("palm", 54, "var(--green)", 1.6)}</div>` : `
        <div class="balance"><div><div class="small bold" style="color:var(--primary)">${CUTI_TABS[cutiTab]}</div><div class="small muted" style="margin-top:6px;max-width:220px">${cutiTab === 1 ? "A doctor's note is required for sick leave longer than 1 day." : "Marriage, maternity, bereavement or other special leave."}</div></div>${ic(cutiTab === 1 ? "heart" : "calendar", 44, "var(--primary)", 1.6)}</div>`}
        <form id="form-cuti" novalidate>
          <div class="field"><label>Leave Dates</label>
            <div class="date-range"><input class="input" type="date" name="from" value="${t}" min="${t}" required/><span class="muted">–</span><input class="input" type="date" name="to" value="${t}" min="${t}" required/></div></div>
          <div class="field"><label for="alasan">Reason</label><textarea id="alasan" class="input" name="note" placeholder="Family matters." required></textarea></div>
          <div class="field"><label>Attachment (Optional)</label>
            <label class="input file-drop"><span data-filename>Choose File</span>${ic("upload", 18)}<input type="file" name="file" accept="image/*,.pdf"/></label></div>
          <button class="btn" type="submit">Submit Leave</button>
        </form>
      </div>`,
      mount() {
        const f = $("#form-cuti");
        bindFileLabel(f);
        f.from.addEventListener("change", () => { f.to.min = f.from.value; if (f.to.value < f.from.value) f.to.value = f.from.value; });
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          const from = f.from.value, to = f.to.value, note = f.note.value.trim();
          if (!from || !to) return toast("Select your leave dates");
          if (to < from) return toast("End date is invalid");
          if (!note) return toast("Please enter a reason");
          const days = daysBetween(from, to);
          if (cutiTab === 0 && days > state.leave.total - state.leave.used) return toast("Not enough leave balance");
          if (cutiTab === 0) state.leave.used += days;
          addRequest({ type: "cuti", title: CUTI_TABS[cutiTab], from, to, note });
          toast(`${CUTI_TABS[cutiTab]} request submitted`);
          go("#/status");
        });
      },
    };
  };

  // Generic request form for Permission & Overtime
  function simpleForm(kind) {
    const isLembur = kind === "lembur";
    const t = today();
    return () => ({
      html: `
      ${header(isLembur ? "Overtime Request" : "Permission Request")}
      <form id="form-simple" class="fade-in" novalidate>
        <div class="field"><label>Date</label><input class="input" type="date" name="date" value="${t}" required/></div>
        ${isLembur
          ? `<div class="field"><label>Overtime Hours</label><div class="date-range"><input class="input" type="time" name="start" value="18:00"/><span class="muted">–</span><input class="input" type="time" name="end" value="21:00"/></div></div>`
          : `<div class="field"><label>Permission Type</label><select class="input" name="sub"><option>Late Arrival</option><option>Early Leave</option><option>Out of Office</option><option>Absent</option></select></div>`}
        <div class="field"><label>Description</label><textarea class="input" name="note" placeholder="${isLembur ? "e.g. Server maintenance" : "e.g. Handling documents"}" required></textarea></div>
        <div class="field"><label>Attachment (Optional)</label><label class="input file-drop"><span data-filename>Choose File</span>${ic("upload", 18)}<input type="file" name="file"/></label></div>
        <button class="btn" type="submit">Submit ${isLembur ? "Overtime" : "Permission"}</button>
      </form>`,
      mount() {
        const f = $("#form-simple");
        bindFileLabel(f);
        f.addEventListener("submit", (e) => {
          e.preventDefault();
          let note = f.note.value.trim();
          if (!f.date.value) return toast("Select a date");
          if (!note) return toast("Please enter a description");
          if (isLembur) {
            if (!f.start.value || !f.end.value || f.end.value <= f.start.value) return toast("Overtime hours are invalid");
            note += ` (${f.start.value}–${f.end.value})`;
          } else note = `${f.sub.value}: ${note}`;
          addRequest({ type: kind, title: isLembur ? "Overtime" : "Permission", from: f.date.value, to: f.date.value, note });
          toast("Request submitted");
          go("#/status");
        });
      },
    });
  }
  screens.izin = simpleForm("izin");
  screens.lembur = simpleForm("lembur");

  screens.reimburse = () => ({
    html: `
      ${header("Reimbursement Request")}
      <form id="form-reimb" class="fade-in" novalidate>
        <div class="field"><label>Category</label><select class="input" name="category"><option>Transport</option><option>Meals</option><option>Health</option><option>Work Equipment</option><option>Other</option></select></div>
        <div class="field"><label>Date</label><input class="input" type="date" name="date" value="${today()}" max="${today()}"/></div>
        <div class="field"><label>Amount</label><input class="input" name="amount" inputmode="numeric" placeholder="Rp 0" value="Rp 150,000"/></div>
        <div class="field"><label>Description</label><input class="input" name="note" placeholder="e.g. Transport for client meeting"/></div>
        <div class="field"><label>Attachment</label><div id="reimb-att"></div>
          <label class="input file-drop" id="reimb-pick"><span>Upload receipt</span>${ic("upload", 18)}<input type="file" name="file" accept="image/*,.pdf"/></label></div>
        <button class="btn" type="submit">Submit Reimbursement</button>
      </form>`,
    mount() {
      const f = $("#form-reimb");
      const amt = f.amount;
      amt.addEventListener("input", () => {
        const n = Number(amt.value.replace(/\D/g, ""));
        amt.value = n ? idr(n) : "";
      });
      const att = $("#reimb-att"), pick = $("#reimb-pick");
      f.file.addEventListener("change", () => {
        const file = f.file.files[0];
        if (!file) return;
        att.innerHTML = `<div class="attachment"><span class="thumb">${ic(file.type.startsWith("image") ? "image" : "file", 22)}</span>
          <div class="grow"><div class="small bold" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(file.name)}</div><div class="xs muted">${fileSize(file.size)}</div></div>
          <button type="button" class="icon-btn" data-remove aria-label="Remove attachment">${ic("x", 18)}</button></div>`;
        pick.hidden = true;
        att.querySelector("[data-remove]").onclick = () => { f.file.value = ""; att.innerHTML = ""; pick.hidden = false; };
      });
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const amount = Number(amt.value.replace(/\D/g, ""));
        if (!f.date.value) return toast("Select a date");
        if (!amount) return toast("Enter an amount");
        if (!f.note.value.trim()) return toast("Please enter a description");
        if (!f.file.files[0]) return toast("Attach a receipt");
        addRequest({ type: "reimburse", title: "Reimbursement", from: f.date.value, to: f.date.value, note: f.note.value.trim(), amount, category: f.category.value });
        toast("Reimbursement submitted");
        go("#/status");
      });
    },
  });

  const STATUS_TABS = [["All", null], ["Leave", "cuti"], ["Permission", "izin"], ["Overtime", "lembur"], ["Reimburse", "reimburse"]];
  let statusTab = 0;
  screens.status = () => {
    const filter = STATUS_TABS[statusTab][1];
    const list = state.requests.filter((r) => !filter || r.type === filter).sort((a, b) => b.created - a.created);
    return {
      tab: "status",
      html: `
      ${header("Request Status")}
      <div class="fade-in">
        <div class="chips">${STATUS_TABS.map(([l], i) => `<button class="chip ${i === statusTab ? "active" : ""}" data-action="statusTab" data-i="${i}">${l}</button>`).join("")}</div>
        ${list.length ? list.map((r) => {
          const m = TYPE_META[r.type];
          return `<button class="status-item" style="width:100%;text-align:left" data-action="request" data-id="${r.id}">
            <span class="circle-ic" style="background:${m.bg}">${ic(m.icon, 20, m.fg)}</span>
            <div class="grow"><div class="bold small">${esc(r.title)}</div><div class="xs muted" style="margin-top:3px">${r.type === "reimburse" ? idr(r.amount) + " · " : ""}${fmtRange(r.from, r.to)}</div></div>
            <div class="right-meta"><span class="badge ${STATUS_BADGE[r.status]}">${r.status}</span><span class="xs muted">${ago(r.created)}</span></div>
          </button>`;
        }).join("") : `<div class="empty">No requests yet.</div>`}
      </div>`,
    };
  };

  // Payslip
  let slipMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; })();
  let showSalary = true;
  function payslip(ym) {
    const m = Number(ym.split("-")[1]);
    const lembur = [300000, 450000, 250000, 600000, 450000, 350000, 500000, 400000, 450000, 550000, 300000, 650000][m - 1];
    const earn = [["Basic Salary", 6500000], ["Transport Allowance", 750000], ["Meal Allowance", 900000], ["Overtime", lembur]];
    const gross = earn.reduce((s, e) => s + e[1], 0);
    const pph = Math.round((gross - 390000) * 0.043); // simplified estimate
    const ded = [["BPJS Health", 130000], ["BPJS Employment", 260000], ["Income Tax (PPh 21)", pph]];
    const net = gross - ded.reduce((s, d) => s + d[1], 0);
    return { earn, ded, gross, net };
  }
  const monthLabel = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MONTHS_LONG[m - 1]} ${y}`; };

  screens["slip-gaji"] = () => {
    const p = payslip(slipMonth);
    return {
      html: `
      ${header("Payslip")}
      <div class="fade-in">
        <label class="input row between" style="margin-bottom:14px;cursor:pointer;position:relative">
          <span class="bold small">${monthLabel(slipMonth)}</span>${ic("calendar", 18, "var(--muted)")}
          <input type="month" id="slip-month" value="${slipMonth}" max="${today().slice(0, 7)}" style="position:absolute;inset:0;opacity:0;cursor:pointer"/>
        </label>
        <div class="salary"><div class="small" style="opacity:.85">Total Net Salary</div>
          <div class="amount">${showSalary ? idr(p.net) : "Rp ••••••••"}</div>
          <button class="icon-btn" data-action="toggleSalary" aria-label="${showSalary ? "Hide" : "Show"} salary">${ic(showSalary ? "eye" : "eyeOff", 22, "#fff")}</button>
        </div>
        <div class="card row" style="margin-bottom:16px">${avatar(40)}
          <div class="grow"><div class="bold small">${esc(state.user.name)}</div><div class="xs muted">${esc(state.user.role)}</div></div>
          <span class="xs muted">${esc(state.user.id)}</span></div>
        <button class="list-item" data-action="slipDetail">${ic("file", 20, "var(--muted)")}<span class="grow">Salary Details</span><span class="chev">${ic("chevR", 18)}</span></button>
        <button class="list-item" data-action="slipDownload">${ic("download", 20, "var(--muted)")}<span class="grow">Download Payslip (PDF)</span><span class="chev">${ic("chevR", 18)}</span></button>
        <button class="list-item" data-action="slipHistory">${ic("history", 20, "var(--muted)")}<span class="grow">Payslip History</span><span class="chev">${ic("chevR", 18)}</span></button>
      </div>`,
      mount() {
        $("#slip-month").addEventListener("change", (e) => { if (e.target.value) { slipMonth = e.target.value; render(); } });
      },
    };
  };

  const slipTable = (p) => `
    <table class="table">
      <tr><td colspan="2" class="xs muted bold" style="border:0;padding-bottom:2px;text-align:left">EARNINGS</td></tr>
      ${p.earn.map(([k, v]) => `<tr><td>${k}</td><td>${idr(v)}</td></tr>`).join("")}
      <tr><td colspan="2" class="xs muted bold" style="border:0;padding:14px 0 2px;text-align:left">DEDUCTIONS</td></tr>
      ${p.ded.map(([k, v]) => `<tr><td>${k}</td><td style="color:var(--red)">-${idr(v)}</td></tr>`).join("")}
      <tr class="total"><td>Net Salary</td><td style="color:var(--primary)">${idr(p.net)}</td></tr>
    </table>`;

  // Calendar
  let calCursor = null, calSel = null;
  screens.jadwal = () => {
    if (!calCursor) { const d = new Date(); calCursor = new Date(d.getFullYear(), d.getMonth(), 1); calSel = today(); }
    const y = calCursor.getFullYear(), m = calCursor.getMonth();
    const start = new Date(y, m, 1 - new Date(y, m, 1).getDay());
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (i === 35 && d.getMonth() !== m) break;
      const s = iso(d);
      const cls = [d.getMonth() !== m && "out", s === today() && "today", s === calSel && "sel",
        (HOLIDAYS[s] || state.requests.some((r) => r.type === "cuti" && r.status !== "Rejected" && s >= r.from && s <= r.to)) && "has"].filter(Boolean).join(" ");
      cells.push(`<button class="${cls}" data-action="pickDay" data-d="${s}" aria-label="${fmtDate(d)}">${d.getDate()}</button>`);
    }
    const items = agendaFor(calSel);
    const selD = parseIso(calSel);
    return {
      html: `
      ${header("Work Schedule")}
      <div class="fade-in">
        <div class="card" style="margin-bottom:18px">
          <div class="cal-head"><button class="icon-btn" data-action="calPrev" aria-label="Previous month">${ic("chevL", 20)}</button>
            <span>${MONTHS_LONG[m]} ${y}</span>
            <button class="icon-btn" data-action="calNext" aria-label="Next month">${ic("chevR", 20)}</button></div>
          <div class="cal">${DAYS.map((d) => `<span class="dow">${d}</span>`).join("")}${cells.join("")}</div>
        </div>
        <div class="section-title"><span>${calSel === today() ? "Today's Agenda" : `Agenda for ${fmtDay(selD)}`}</span></div>
        ${items.length ? items.map((it) => `
          <div class="agenda"><span class="t">${it.time}</span>
            <div class="body" style="border-color:${it.color}"><div class="bold small">${esc(it.title)}</div><div class="xs muted" style="margin-top:2px">${esc(it.place)}</div></div></div>`).join("")
          : `<div class="empty">No agenda – it's the weekend</div>`}
      </div>`,
    };
  };

  const ANN_TABS = ["All", "Company", "HR", "IT"];
  let annTab = 0;
  screens.pengumuman = () => {
    if (!state.notifRead) { state.notifRead = true; save(); }
    const list = ANNOUNCEMENTS.map((a, i) => ({ ...a, i })).filter((a) => annTab === 0 || a.cat === ANN_TABS[annTab]);
    return {
      html: `
      ${header("Announcements")}
      <div class="fade-in">
        <div class="chips">${ANN_TABS.map((t, i) => `<button class="chip ${i === annTab ? "active" : ""}" data-action="annTab" data-i="${i}">${t}</button>`).join("")}</div>
        ${list.map((a) => `
          <button class="ann" style="width:100%;text-align:left" data-action="ann" data-i="${a.i}">
            <span class="circle-ic" style="background:${COLOR[a.color][0]}">${ic(a.icon, 20, COLOR[a.color][1])}</span>
            <div class="grow"><div class="bold small">${esc(a.title)}</div><p>${esc(a.body.split(". ")[0])}.</p><div class="xs muted">${fmtDate(parseIso(a.date))}</div></div>
          </button>`).join("") || `<div class="empty">No announcements.</div>`}
      </div>`,
    };
  };

  screens.profil = () => {
    const u = state.user;
    const rows = [["mail", "Email", u.email], ["phone", "Phone", u.phone], ["building", "Department", u.dept],
      ["calendar", "Join Date", fmtDate(parseIso(u.joined))], ["pin", "Address", u.address]];
    return {
      tab: "profil",
      html: `
      ${header("My Profile", { right: `<button class="icon-btn" data-action="settings" aria-label="Settings">${ic("settings", 22)}</button>` })}
      <div class="fade-in">
        <div class="profile-head">${avatar(84)}
          <div class="bold" style="font-size:17px">${esc(u.name)}</div><div class="small muted">${esc(u.role)}</div><div class="xs muted" style="margin:2px 0 8px">${esc(u.id)}</div>
          <span class="badge green">${esc(u.status)}</span></div>
        <div class="card" style="padding:4px 16px;margin-bottom:16px">
          ${rows.map(([i, k, v]) => `<div class="info-row">${ic(i, 18)}<div><div class="xs muted">${k}</div><div class="small bold" style="margin-top:2px">${esc(v)}</div></div></div>`).join("")}
        </div>
        <button class="btn ghost" data-action="editProfile">Edit Profile</button>
      </div>`,
    };
  };

  screens.dokumen = () => ({
    html: `
      ${header("My Documents")}
      <div class="fade-in">
        ${state.docs.map((d) => `
          <div class="list-item">
            <span class="doc-ic" style="background:${COLOR[d.kind][0]}">${ic("file", 22, COLOR[d.kind][1])}</span>
            <div class="grow"><div class="bold small">${esc(d.name)}</div><div class="xs muted" style="margin-top:2px">${esc(d.file)}</div><div class="xs muted">${fileSize(d.size)}</div></div>
            <button class="icon-btn" data-action="docMenu" data-id="${d.id}" aria-label="Options for ${esc(d.name)}">${ic("more", 20)}</button>
          </div>`).join("") || `<div class="empty">No documents yet.</div>`}
        <label class="btn" style="margin-top:20px">${ic("upload", 18)} Upload Document<input type="file" id="doc-upload" hidden/></label>
      </div>`,
    mount() {
      $("#doc-upload").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const kinds = Object.keys(COLOR);
        state.docs.push({ id: state.nextId++, name: file.name.replace(/\.[^.]+$/, ""), file: file.name, size: file.size, kind: kinds[state.docs.length % kinds.length] });
        save(); render(); toast("Document uploaded");
      });
    },
  });

  screens.aktivitas = () => {
    const events = [];
    const a = state.attendance;
    if (a.in) events.push({ ts: a.in, icon: "login", color: "green", title: "Check In", sub: a.location });
    if (a.out) events.push({ ts: a.out, icon: "logout", color: "blue", title: "Check Out", sub: a.location });
    state.history.slice(0, 6).forEach((h) => {
      events.push({ ts: h.in, icon: "login", color: "green", title: "Check In", sub: "Head Office" });
      if (h.out) events.push({ ts: h.out, icon: "logout", color: "blue", title: "Check Out", sub: "Head Office" });
    });
    state.requests.forEach((r) => events.push({ ts: r.created, icon: TYPE_META[r.type].icon, color: { cuti: "blue", izin: "orange", lembur: "red", reimburse: "green" }[r.type], title: `${r.title} Request`, sub: r.status }));
    events.sort((x, y) => y.ts - x.ts);
    return {
      tab: "aktivitas",
      html: `
      <div class="header"><h1>Activity</h1></div>
      <div class="fade-in">
        ${events.slice(0, 20).map((e) => `
          <div class="status-item"><span class="circle-ic" style="background:${COLOR[e.color][0]}">${ic(e.icon, 18, COLOR[e.color][1])}</span>
            <div class="grow"><div class="bold small">${esc(e.title)}</div><div class="xs muted" style="margin-top:2px">${esc(e.sub)}</div></div>
            <div class="right-meta"><span class="xs bold">${hm(e.ts)}</span><span class="xs muted">${fmtDate(new Date(e.ts))}</span></div></div>`).join("")}
      </div>`,
    };
  };

  screens.bye = () => ({
    full: true, noTabs: true,
    html: `
      <div class="goodbye fade-in">
        <div class="illus">${goodbyeArt}</div>
        <div class="panel">
          <h2>See You Soon!</h2>
          <p class="small muted" style="margin:10px 0 24px;line-height:1.5">Thank you for being part<br/>of an amazing team.</p>
          <button class="btn" data-action="logout">Logout</button>
          <button class="btn ghost" data-go="#/home" style="margin-top:10px">Cancel</button>
          <p class="quote">“Growing Together,<br/>Achieving More”</p>
        </div>
      </div>`,
  });

  // ---------- Actions ----------
  function addRequest(r) {
    state.requests.push({ id: state.nextId++, status: "Pending", created: Date.now(), ...r });
    save();
  }
  function bindFileLabel(form) {
    const input = form.querySelector('input[type="file"]');
    const label = form.querySelector("[data-filename]");
    input.addEventListener("change", () => { label.textContent = input.files[0]?.name || "Choose File"; label.style.color = input.files[0] ? "var(--text)" : ""; });
  }

  function printSlip() {
    const p = payslip(slipMonth), u = state.user;
    const w = window.open("", "_blank");
    if (!w) { actions.slipDetail(); return toast("Pop-up blocked – showing details instead"); }
    w.document.write(`<!doctype html><html><head><title>Payslip ${monthLabel(slipMonth)} - ${esc(u.name)}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;color:#16223b}h1{color:#1a6bf0;margin:0}table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:8px 0;border-bottom:1px solid #e6ebf3}td:last-child{text-align:right}.t td{font-weight:800;border:0;font-size:18px}</style></head>
      <body><h1>MyWork</h1><p>Payslip – <b>${monthLabel(slipMonth)}</b></p>
      <p>${esc(u.name)} · ${esc(u.role)} · ${esc(u.id)}<br/>${esc(u.dept)}</p>
      <table>${p.earn.map(([k, v]) => `<tr><td>${k}</td><td>${idr(v)}</td></tr>`).join("")}
      ${p.ded.map(([k, v]) => `<tr><td>${k}</td><td>-${idr(v)}</td></tr>`).join("")}
      <tr class="t"><td>Net Salary</td><td>${idr(p.net)}</td></tr></table>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  const actions = {
    start() { state.onboarded = true; save(); go("#/home"); },
    logout() { state.onboarded = false; save(); closeSheet(); go("#/onboarding"); toast("You have logged out"); },
    more() {
      sheet(`<div class="bold" style="margin-bottom:14px">More</div>
        <button class="list-item" data-close data-go="#/aktivitas">${ic("activity", 20, "var(--primary)")}<span class="grow">My Activity</span>${ic("chevR", 18)}</button>
        <button class="list-item" data-close data-go="#/reimburse">${ic("receipt", 20, "var(--green)")}<span class="grow">Reimbursement Request</span>${ic("chevR", 18)}</button>
        <button class="list-item" data-close data-action="resetDemo">${ic("history", 20, "var(--orange)")}<span class="grow">Reset Demo Data</span>${ic("chevR", 18)}</button>
        <button class="list-item" data-close data-go="#/bye">${ic("logout", 20, "var(--red)")}<span class="grow">Log Out</span>${ic("chevR", 18)}</button>`);
    },
    resetDemo() { state = seed(); state.onboarded = true; save(); render(); toast("Demo data restored"); },
    checkin() {
      state.attendance.in = Date.now(); save(); render(); toast(`Checked in at ${hm(state.attendance.in)}`);
    },
    checkout() {
      const worked = Date.now() - state.attendance.in;
      const confirmOut = () => { state.attendance.out = Date.now(); save(); closeSheet(); render(); toast(`Checked out at ${hm(state.attendance.out)}`); };
      if (worked < 8 * 3600000) {
        sheet(`<div class="bold" style="font-size:16px">Check out now?</div>
          <p class="small muted" style="margin:8px 0 18px">You have only worked ${Math.floor(worked / 3600000)} hours ${Math.floor(worked / 60000) % 60} minutes (less than 8 hours).</p>
          <button class="btn" id="confirm-out">Yes, Check Out</button><button class="btn ghost" data-close style="margin-top:10px">Cancel</button>`,
          (s) => { $("#confirm-out", s).onclick = confirmOut; });
      } else confirmOut();
    },
    history() {
      sheet(`<div class="bold" style="margin-bottom:12px">Attendance History</div>
        ${state.history.slice(0, 15).map((h) => `<div class="info-row"><div class="grow"><div class="small bold">${fmtDay(parseIso(h.date))}</div><div class="xs muted">Head Office</div></div>
          <div style="text-align:right"><div class="small"><span class="muted xs">In</span> <b>${hm(h.in)}</b></div><div class="small"><span class="muted xs">Out</span> <b>${h.out ? hm(h.out) : "-"}</b></div></div></div>`).join("") || '<div class="empty">No history yet.</div>'}`);
    },
    location() {
      sheet(`<div class="bold" style="margin-bottom:12px">My Location</div>
        <div style="height:150px;border-radius:14px;background:repeating-linear-gradient(45deg,#e8f0fe 0 12px,#f1f6ff 12px 24px);display:grid;place-items:center;margin-bottom:14px">${ic("pin", 40, "var(--red)")}</div>
        <div class="bold small">Head Office</div><div class="xs muted" style="margin:2px 0 14px">Jl. Jend. Sudirman Kav. 52, South Jakarta · Check-in radius 100 m</div>
        <div class="badge green">You are within the office area</div>`);
    },
    cutiTab(el) { cutiTab = Number(el.dataset.i); render(); },
    statusTab(el) { statusTab = Number(el.dataset.i); render(); },
    annTab(el) { annTab = Number(el.dataset.i); render(); },
    request(el) {
      const r = state.requests.find((x) => x.id === Number(el.dataset.id));
      if (!r) return;
      const m = TYPE_META[r.type];
      sheet(`<div class="row" style="margin-bottom:14px"><span class="circle-ic" style="background:${m.bg}">${ic(m.icon, 20, m.fg)}</span>
          <div class="grow"><div class="bold">${esc(r.title)}</div><div class="xs muted">Submitted ${ago(r.created)}</div></div><span class="badge ${STATUS_BADGE[r.status]}">${r.status}</span></div>
        <div class="info-row"><div class="grow xs muted">Date</div><div class="small bold">${fmtRange(r.from, r.to)}${r.type === "cuti" ? ` (${daysBetween(r.from, r.to)} days)` : ""}</div></div>
        ${r.amount ? `<div class="info-row"><div class="grow xs muted">Amount</div><div class="small bold">${idr(r.amount)}</div></div>` : ""}
        ${r.category ? `<div class="info-row"><div class="grow xs muted">Category</div><div class="small bold">${esc(r.category)}</div></div>` : ""}
        <div class="info-row"><div class="grow xs muted">Description</div><div class="small bold" style="text-align:right;max-width:65%">${esc(r.note)}</div></div>
        ${r.status === "Pending" ? `<button class="btn danger" id="cancel-req" style="margin-top:16px">Cancel Request</button>` : ""}`,
        (s) => {
          const b = $("#cancel-req", s);
          if (b) b.onclick = () => {
            if (r.type === "cuti" && r.title === "Annual Leave") state.leave.used -= daysBetween(r.from, r.to);
            state.requests = state.requests.filter((x) => x.id !== r.id);
            save(); closeSheet(); render(); toast("Request cancelled");
          };
        });
    },
    toggleSalary() { showSalary = !showSalary; render(); },
    slipDetail() { sheet(`<div class="bold" style="margin-bottom:4px">Salary Details</div><div class="xs muted">${monthLabel(slipMonth)}</div>${slipTable(payslip(slipMonth))}`); },
    slipDownload: printSlip,
    slipHistory() {
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; });
      sheet(`<div class="bold" style="margin-bottom:12px">Payslip History</div>
        ${months.map((ym) => `<button class="list-item" data-close data-action="pickSlip" data-ym="${ym}"><span class="grow">${monthLabel(ym)}</span><span class="small bold">${idr(payslip(ym).net)}</span>${ic("chevR", 18)}</button>`).join("")}`);
    },
    pickSlip(el) { slipMonth = el.dataset.ym; render(); },
    calPrev() { calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1); render(); },
    calNext() { calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1); render(); },
    pickDay(el) {
      calSel = el.dataset.d;
      const d = parseIso(calSel);
      if (d.getMonth() !== calCursor.getMonth()) calCursor = new Date(d.getFullYear(), d.getMonth(), 1);
      render();
    },
    ann(el) {
      const a = ANNOUNCEMENTS[Number(el.dataset.i)];
      sheet(`<span class="badge blue">${a.cat}</span><div class="bold" style="font-size:17px;margin:10px 0 4px">${esc(a.title)}</div>
        <div class="xs muted" style="margin-bottom:12px">${fmtDay(parseIso(a.date))}</div><p class="small" style="line-height:1.6">${esc(a.body)}</p>
        <button class="btn ghost" data-close style="margin-top:18px">Close</button>`);
    },
    settings() {
      sheet(`<div class="bold" style="margin-bottom:12px">Settings</div>
        <button class="list-item" data-close data-action="editProfile">${ic("user", 20, "var(--muted)")}<span class="grow">Edit Profile</span>${ic("chevR", 18)}</button>
        <button class="list-item" data-close data-action="password">${ic("lock", 20, "var(--muted)")}<span class="grow">Change Password</span>${ic("chevR", 18)}</button>
        <button class="list-item" data-close data-go="#/dokumen">${ic("folder", 20, "var(--muted)")}<span class="grow">My Documents</span>${ic("chevR", 18)}</button>
        <button class="list-item" data-close data-go="#/bye" style="color:var(--red)">${ic("logout", 20)}<span class="grow">Log Out</span></button>`);
    },
    password() {
      sheet(`<div class="bold" style="margin-bottom:14px">Change Password</div>
        <form id="pw-form"><div class="field"><label>Current Password</label><input class="input" type="password" name="old" autocomplete="current-password"/></div>
        <div class="field"><label>New Password</label><input class="input" type="password" name="n1" autocomplete="new-password"/></div>
        <div class="field"><label>Confirm New Password</label><input class="input" type="password" name="n2" autocomplete="new-password"/></div>
        <button class="btn" type="submit">Save</button></form>`, (s) => {
        $("#pw-form", s).onsubmit = (e) => {
          e.preventDefault();
          const f = e.target;
          if (!f.old.value) return toast("Enter your current password");
          if (f.n1.value.length < 8) return toast("Password must be at least 8 characters");
          if (f.n1.value !== f.n2.value) return toast("Passwords do not match");
          closeSheet(); toast("Password changed");
        };
      });
    },
    editProfile() {
      const u = state.user;
      sheet(`<div class="bold" style="margin-bottom:14px">Edit Profile</div>
        <form id="profile-form" novalidate>
          <div class="field"><label>Email</label><input class="input" type="email" name="email" value="${esc(u.email)}"/></div>
          <div class="field"><label>Phone</label><input class="input" type="tel" name="phone" value="${esc(u.phone)}"/></div>
          <div class="field"><label>Address</label><input class="input" name="address" value="${esc(u.address)}"/></div>
          <button class="btn" type="submit">Save Changes</button></form>`, (s) => {
        $("#profile-form", s).onsubmit = (e) => {
          e.preventDefault();
          const f = e.target;
          if (!/^\S+@\S+\.\S+$/.test(f.email.value)) return toast("Invalid email format");
          if (f.phone.value.replace(/\D/g, "").length < 9) return toast("Invalid phone number");
          if (!f.address.value.trim()) return toast("Please enter an address");
          Object.assign(state.user, { email: f.email.value.trim(), phone: f.phone.value.trim(), address: f.address.value.trim() });
          save(); closeSheet(); render(); toast("Profile updated");
        };
      });
    },
    docMenu(el) {
      const d = state.docs.find((x) => x.id === Number(el.dataset.id));
      if (!d) return;
      sheet(`<div class="bold">${esc(d.name)}</div><div class="xs muted" style="margin-bottom:14px">${esc(d.file)} · ${fileSize(d.size)}</div>
        <button class="list-item" data-close data-action="docView" data-id="${d.id}">${ic("eye", 20, "var(--muted)")}<span class="grow">View</span></button>
        <button class="list-item" data-close data-action="docDownload" data-id="${d.id}">${ic("download", 20, "var(--muted)")}<span class="grow">Download</span></button>
        <button class="list-item" data-action="docDelete" data-id="${d.id}" style="color:var(--red)">${ic("trash", 20)}<span class="grow">Delete</span></button>`);
    },
    docView(el) {
      const d = state.docs.find((x) => x.id === Number(el.dataset.id));
      sheet(`<div class="bold" style="margin-bottom:12px">${esc(d.name)}</div>
        <div style="aspect-ratio:3/4;border-radius:12px;background:${COLOR[d.kind][0]};display:grid;place-items:center">${ic("file", 64, COLOR[d.kind][1], 1.4)}</div>
        <div class="xs muted" style="text-align:center;margin-top:10px">Preview of ${esc(d.file)}</div>`);
    },
    docDownload(el) { const d = state.docs.find((x) => x.id === Number(el.dataset.id)); toast(`Downloading ${d.file}…`); },
    docDelete(el) {
      const id = Number(el.dataset.id);
      state.docs = state.docs.filter((x) => x.id !== id);
      save(); closeSheet(); render(); toast("Document deleted");
    },
  };

  // ---------- Router & render ----------
  const TABS = [["home", "Home", "home"], ["status", "Requests", "file"], ["aktivitas", "Activity", "activity"], ["profil", "Account", "user"]];
  const navStack = [];
  let tickTimer = null;

  function route() {
    const r = (location.hash.replace(/^#\/?/, "") || "").split("?")[0];
    if (!state.onboarded && r !== "bye") return "onboarding";
    if (!r || !screens[r] || r === "onboarding") return "home";
    return r;
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  function render() {
    syncAttendanceDay();
    const name = route();
    const s = screens[name]();
    const app = $("#app");
    app.className = "screen" + (s.full ? " full" : "");
    app.innerHTML = s.html;
    const tabbar = $("#tabbar");
    tabbar.hidden = !!s.noTabs;
    const activeTab = s.tab || "home";
    tabbar.innerHTML = TABS.map(([id, label, icon]) =>
      `<button class="tab ${id === activeTab ? "active" : ""}" data-go="#/${id}">${ic(icon, 22)}${label}</button>`).join("");
    s.mount && s.mount();
    clearInterval(tickTimer);
    if (s.tick) tickTimer = setInterval(() => {
      const el = $("#live-time");
      if (!el) return clearInterval(tickTimer);
      el.textContent = hms(new Date());
    }, 1000);
  }

  document.addEventListener("click", (e) => {
    const back = e.target.closest("[data-back]");
    if (back) { if (navStack.length > 1) { navStack.pop(); location.hash = navStack.pop(); } else go("#/home"); return; }
    const act = e.target.closest("[data-action]");
    if (act && actions[act.dataset.action]) { e.preventDefault(); actions[act.dataset.action](act); return; }
    const nav = e.target.closest("[data-go]");
    if (nav) { closeSheet(); go(nav.dataset.go); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  window.addEventListener("hashchange", () => {
    closeSheet();
    navStack.push(location.hash || "#/home");
    if (navStack.length > 30) navStack.shift();
    render();
    $("#app").scrollTop = 0;
  });

  // Status bar clock
  const tickClock = () => { const d = new Date(); $("#clock").textContent = `${d.getHours()}:${pad(d.getMinutes())}`; };
  tickClock(); setInterval(tickClock, 15000);

  navStack.push(location.hash || "#/home");
  render();
})();
