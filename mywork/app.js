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
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
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
      // Demo-only auth: SHA-256 of the password is kept in the browser. Default: "password123".
      auth: { hash: DEFAULT_HASH, loggedIn: false },
      notifications: [
        { id: 1, ts: now - 3 * 3600000, title: "Leave approved", body: `Your Annual Leave for ${fmtRange(d(-3), d(-1))} was approved.`, icon: "check", color: "green", go: "#/status", read: false },
        { id: 2, ts: now - 26 * 3600000, title: "New announcement", body: "National Holiday – the office is closed on 28 Sep 2026.", icon: "megaphone", color: "blue", go: "#/pengumuman", read: false },
        { id: 3, ts: now - 7 * DAY, title: "Overtime rejected", body: `Your overtime request for ${fmtRange(d(-18), d(-18))} was rejected.`, icon: "x", color: "red", go: "#/status", read: true },
      ],
      nextId: 100,
    };
  }
  const DEFAULT_HASH = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f";

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Backend mode: data lives in Supabase (see backend.js); only the "seen onboarding" flag stays local.
  const BE = window.MyWorkBackend;
  const ONBOARDED_KEY = "mywork-onboarded";
  function emptyState() {
    let onboarded = false;
    try { onboarded = localStorage.getItem(ONBOARDED_KEY) === "1"; } catch { /* storage unavailable */ }
    return {
      ...seed(), onboarded, auth: { loggedIn: false }, user: { name: "", role: "", id: "—", status: "", email: "", phone: "", dept: "", joined: today(), address: "" },
      attendance: { date: today(), in: null, out: null, location: "Head Office" }, history: [], requests: [], docs: [],
      notifications: [], payslips: {}, events: [], pending: [], isManager: false,
    };
  }

  let state;
  if (BE) state = emptyState();
  else {
    // Merge over fresh seed data so fields added in newer versions get defaults.
    try { state = Object.assign(seed(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { state = seed(); }
    delete state.notifRead;
  }
  const save = () => {
    try {
      if (BE) localStorage.setItem(ONBOARDED_KEY, state.onboarded ? "1" : "0");
      else localStorage.setItem(KEY, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  };
  const fail = (e) => toast(e && e.message ? e.message : "Something went wrong. Please try again.");

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
  let ANNOUNCEMENTS = [
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
  const holidayOn = (dateStr) => BE ? (state.events.find((e) => e.holiday && e.date === dateStr) || {}).title : HOLIDAYS[dateStr];
  function agendaFor(dateStr) {
    if (BE) {
      const leave = state.requests.find((r) => r.type === "cuti" && r.status !== "Rejected" && dateStr >= r.from && dateStr <= r.to);
      const items = state.events.filter((e) => e.date === dateStr)
        .map((e) => ({ time: e.time, title: e.title, place: e.holiday ? "Office closed" : e.place, color: (COLOR[e.color] || COLOR.blue)[1] }))
        .sort((a, b) => (a.time < b.time ? -1 : 1));
      if (leave) items.unshift({ time: "—", title: leave.title, place: `Status: ${leave.status}`, color: "var(--orange)" });
      return items;
    }
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

  const featureArt = (icon, color, chips) => `
    <div class="feature-art"><span class="feature-core" style="color:${color}">${ic(icon, 72, "currentColor", 1.5)}</span>
      ${chips.map((c, i) => `<span class="feature-chip c${i}">${ic(c[0], 16, c[1])}${c[2]}</span>`).join("")}</div>`;
  const SLIDES = [
    { art: () => onboardArt, title: "Empowered Employees<br/>A More Productive Company" },
    { art: () => featureArt("userCheck", "var(--green)", [["login", "var(--green)", "Checked in 08:02"], ["clock", "var(--primary)", "8h 12m today"]]),
      title: '<span class="slide-title">Attendance in One Tap</span>', text: "Check in and out from your phone and see your hours and history." },
    { art: () => featureArt("send", "var(--primary)", [["check", "var(--green)", "Leave approved"], ["receipt", "var(--orange)", "Rp 150,000"]]),
      title: '<span class="slide-title">Requests Without Paperwork</span>', text: "Submit leave, overtime and reimbursements, and track every approval." },
  ];
  let slide = 0;
  screens.onboarding = () => {
    const sl = SLIDES[slide], last = slide === SLIDES.length - 1;
    return {
      full: true, noTabs: true,
      html: `
      <div class="onboard" id="onboard">
        <button class="skip" data-action="start" ${last ? "hidden" : ""}>Skip</button>
        <div class="logo">${logoMark}<h2>MyWork</h2><p>Employee Self Service</p></div>
        <div class="fade-in slide">
          <p class="tagline">${sl.title}</p>
          ${sl.text ? `<p class="small muted slide-text">${sl.text}</p>` : ""}
        </div>
        <div class="illus fade-in">${sl.art()}</div>
        <div class="pager">${SLIDES.map((_, i) => `<button data-action="slideTo" data-i="${i}" class="${i === slide ? "on" : ""}" aria-label="Slide ${i + 1}"></button>`).join("")}</div>
        <button class="btn" data-action="${last ? "start" : "nextSlide"}">${last ? "Get Started" : "Next"} ${ic("arrowR", 18)}</button>
      </div>`,
      mount() {
        const el = $("#onboard");
        let x0 = null;
        el.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
        el.addEventListener("pointerup", (e) => {
          if (x0 === null) return;
          const dx = e.clientX - x0; x0 = null;
          if (Math.abs(dx) < 50) return;
          const next = Math.min(SLIDES.length - 1, Math.max(0, slide + (dx < 0 ? 1 : -1)));
          if (next !== slide) { slide = next; render(); }
        });
      },
    };
  };

  screens.login = () => ({
    full: true, noTabs: true,
    html: `
      <div class="login fade-in">
        <div class="logo">${logoMark}<h2>MyWork</h2></div>
        <h1 class="login-title">Welcome back</h1>
        <p class="small muted" style="text-align:center;margin-bottom:24px">Sign in with your employee account.</p>
        <form id="login-form" novalidate>
          ${BE
            ? `<div class="field"><label for="login-id">Work Email</label>
            <input class="input" id="login-id" name="id" type="email" autocomplete="username" placeholder="name@company.com" autocapitalize="off"/></div>`
            : `<div class="field"><label for="login-id">Employee ID</label>
            <input class="input" id="login-id" name="id" autocomplete="username" placeholder="e.g. EMP00123" autocapitalize="characters"/></div>`}
          <div class="field"><label for="login-pw">Password</label>
            <div class="pw-wrap"><input class="input" id="login-pw" type="password" name="pw" autocomplete="current-password" placeholder="Your password"/>
              <button type="button" class="icon-btn pw-toggle" id="pw-toggle" aria-label="Show password">${ic("eye", 18)}</button></div></div>
          <p class="form-error" id="login-error" role="alert" hidden></p>
          <button class="btn" type="submit" id="login-btn">Sign In</button>
        </form>
        <button class="link forgot" data-action="forgot">Forgot password?</button>
        ${BE ? "" : `<div class="demo-hint">${ic("info", 16)}<span>Demo account: <b>${esc(state.user.id)}</b> / <b>password123</b></span></div>`}
      </div>`,
    mount() {
      const f = $("#login-form"), err = $("#login-error");
      const toggle = $("#pw-toggle");
      toggle.onclick = () => {
        const show = f.pw.type === "password";
        f.pw.type = show ? "text" : "password";
        toggle.innerHTML = ic(show ? "eyeOff" : "eye", 18);
        toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      };
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fail = (msg) => { err.textContent = msg; err.hidden = false; };
        if (BE) {
          const email = f.id.value.trim();
          if (!email || !f.pw.value) return fail("Enter your work email and password.");
          const btn = $("#login-btn");
          btn.disabled = true; btn.textContent = "Signing in…"; err.hidden = true;
          try {
            await BE.signIn(email, f.pw.value);
            await hydrate();
          } catch (ex) {
            await BE.signOut().catch(() => {});
            btn.disabled = false; btn.textContent = "Sign In";
            f.pw.value = ""; f.pw.focus();
            return fail(ex.message);
          }
          go("#/home");
          return toast(`Welcome back, ${state.user.name.split(" ")[0]}`);
        }
        const id = f.id.value.trim().toUpperCase();
        if (!id || !f.pw.value) return fail("Enter your employee ID and password.");
        const ok = id === state.user.id.toUpperCase() && (await sha256(f.pw.value)) === state.auth.hash;
        if (!ok) { f.pw.value = ""; f.pw.focus(); return fail("Employee ID or password is incorrect."); }
        state.auth.loggedIn = true; save();
        go("#/home");
        toast(`Welcome back, ${state.user.name.split(" ")[0]}`);
      });
    },
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
          <button class="icon-btn" data-go="#/notifikasi" aria-label="Notifications${unread() ? `, ${unread()} unread` : ""}">${ic("bell", 22)}${unread() ? `<span class="count">${unread() > 9 ? "9+" : unread()}</span>` : ""}</button>
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
          <button class="list-item" data-go="#/riwayat">${ic("history", 20, "var(--muted)")}<span class="grow">Attendance History</span><span class="chev">${ic("chevR", 18)}</span></button>
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
        <div class="balance"><div><div class="small bold" style="color:var(--primary)">Annual Leave Balance</div><div class="big">${plural(left, "day")}</div><div class="xs muted">of ${plural(state.leave.total, "day")}</div></div>${ic("palm", 54, "var(--green)", 1.6)}</div>` : `
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
        f.addEventListener("submit", async (e) => {
          e.preventDefault();
          const from = f.from.value, to = f.to.value, note = f.note.value.trim();
          if (!from || !to) return toast("Select your leave dates");
          if (to < from) return toast("End date is invalid");
          if (!note) return toast("Please enter a reason");
          const days = daysBetween(from, to);
          if (cutiTab === 0 && days > state.leave.total - state.leave.used) return toast("Not enough leave balance");
          if (!(await addRequest({ type: "cuti", title: CUTI_TABS[cutiTab], from, to, note }, f))) return;
          if (!BE && cutiTab === 0) { state.leave.used += days; save(); }
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
        f.addEventListener("submit", async (e) => {
          e.preventDefault();
          let note = f.note.value.trim();
          if (!f.date.value) return toast("Select a date");
          if (!note) return toast("Please enter a description");
          if (isLembur) {
            if (!f.start.value || !f.end.value || f.end.value <= f.start.value) return toast("Overtime hours are invalid");
            note += ` (${f.start.value}–${f.end.value})`;
          } else note = `${f.sub.value}: ${note}`;
          if (!(await addRequest({ type: kind, title: isLembur ? "Overtime" : "Permission", from: f.date.value, to: f.date.value, note }, f))) return;
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
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const amount = Number(amt.value.replace(/\D/g, ""));
        if (!f.date.value) return toast("Select a date");
        if (!amount) return toast("Enter an amount");
        if (!f.note.value.trim()) return toast("Please enter a description");
        if (!f.file.files[0]) return toast("Attach a receipt");
        if (!(await addRequest({ type: "reimburse", title: "Reimbursement", from: f.date.value, to: f.date.value, note: f.note.value.trim(), amount, category: f.category.value }, f))) return;
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
    if (BE) {
      const p = state.payslips[ym];
      if (!p) return null;
      const earn = p.earn.map(([k, v]) => [k, Number(v)]), ded = p.ded.map(([k, v]) => [k, Number(v)]);
      const gross = earn.reduce((s, e) => s + e[1], 0);
      return { earn, ded, gross, net: gross - ded.reduce((s, d) => s + d[1], 0) };
    }
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
          <div class="amount">${!p ? "Not available" : showSalary ? idr(p.net) : "Rp ••••••••"}</div>
          <button class="icon-btn" data-action="toggleSalary" aria-label="${showSalary ? "Hide" : "Show"} salary">${ic(showSalary ? "eye" : "eyeOff", 22, "#fff")}</button>
        </div>
        <div class="card row" style="margin-bottom:16px">${avatar(40)}
          <div class="grow"><div class="bold small">${esc(state.user.name)}</div><div class="xs muted">${esc(state.user.role)}</div></div>
          <span class="xs muted">${esc(state.user.id)}</span></div>
        ${p ? "" : `<div class="demo-hint" style="margin:0 0 16px">${ic("info", 16)}<span>There's no payslip for ${monthLabel(slipMonth)} yet. Pick another month or check Payslip History.</span></div>`}
        <button class="list-item" data-action="slipDetail" ${p ? "" : "hidden"}>${ic("file", 20, "var(--muted)")}<span class="grow">Salary Details</span><span class="chev">${ic("chevR", 18)}</span></button>
        <button class="list-item" data-action="slipDownload" ${p ? "" : "hidden"}>${ic("download", 20, "var(--muted)")}<span class="grow">Download Payslip (PDF)</span><span class="chev">${ic("chevR", 18)}</span></button>
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
      ${p.earn.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${idr(v)}</td></tr>`).join("")}
      <tr><td colspan="2" class="xs muted bold" style="border:0;padding:14px 0 2px;text-align:left">DEDUCTIONS</td></tr>
      ${p.ded.map(([k, v]) => `<tr><td>${esc(k)}</td><td style="color:var(--red)">-${idr(v)}</td></tr>`).join("")}
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
        (holidayOn(s) || state.requests.some((r) => r.type === "cuti" && r.status !== "Rejected" && s >= r.from && s <= r.to)) && "has"].filter(Boolean).join(" ");
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
          : `<div class="empty">${[0, 6].includes(selD.getDay()) ? "No agenda – it's the weekend" : "No agenda for this day"}</div>`}
      </div>`,
    };
  };

  const ANN_TABS = ["All", "Company", "HR", "IT"];
  let annTab = 0;
  screens.pengumuman = () => {
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
      $("#doc-upload").addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const kinds = Object.keys(COLOR);
        const kind = kinds[state.docs.length % kinds.length];
        if (BE) {
          if (file.size > 10 * 1048576) return toast("Files must be 10 MB or smaller");
          toast("Uploading…");
          try { state.docs.push(await BE.uploadDoc(file, kind)); } catch (ex) { return fail(ex); }
        } else {
          state.docs.push({ id: state.nextId++, name: file.name.replace(/\.[^.]+$/, ""), file: file.name, size: file.size, kind });
        }
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

  const unread = () => state.notifications.filter((n) => !n.read).length;
  function notify(n) {
    if (BE) return; // the database creates notifications
    state.notifications.unshift({ id: state.nextId++, ts: Date.now(), read: false, ...n });
    state.notifications = state.notifications.slice(0, 50);
  }

  screens.notifikasi = () => ({
    html: `
      ${header("Notifications", { right: unread() ? `<button class="link" data-action="readAll">Mark all read</button>` : "" })}
      <div class="fade-in">
        ${state.notifications.map((n) => `
          <button class="notif ${n.read ? "" : "unread"}" data-action="openNotif" data-id="${n.id}">
            <span class="circle-ic" style="background:${COLOR[n.color][0]}">${ic(n.icon, 18, COLOR[n.color][1])}</span>
            <div class="grow"><div class="row between"><span class="bold small">${esc(n.title)}</span><span class="xs muted">${ago(n.ts)}</span></div>
              <p>${esc(n.body)}</p></div>
          </button>`).join("") || `<div class="empty">You're all caught up.</div>`}
      </div>`,
  });

  screens.approvals = () => {
    const pending = BE ? state.pending : state.requests.filter((r) => r.status === "Pending").sort((a, b) => a.created - b.created);
    return {
      html: `
      ${header("Approvals")}
      <div class="fade-in">
        ${BE ? "" : `<div class="demo-hint" style="margin:0 0 16px">${ic("info", 16)}<span>Demo: act as your manager to approve or reject pending requests.</span></div>`}
        ${pending.map((r) => {
          const m = TYPE_META[r.type];
          return `<div class="card approval">
            <div class="row"><span class="circle-ic" style="background:${m.bg}">${ic(m.icon, 20, m.fg)}</span>
              <div class="grow"><div class="bold small">${esc(r.title)}</div><div class="xs muted">${esc(r.requester || state.user.name)} · ${ago(r.created)}</div></div>
              <span class="badge orange">Pending</span></div>
            <div class="small" style="margin:12px 0 4px"><b>${fmtRange(r.from, r.to)}</b>${r.type === "cuti" ? ` · ${plural(daysBetween(r.from, r.to), "day")}` : ""}${r.amount ? ` · ${idr(r.amount)}` : ""}</div>
            <div class="small muted">${esc(r.note)}</div>
            ${r.attachment ? `<button class="link" style="margin-top:6px;padding:0" data-action="openAttachment" data-path="${esc(r.attachment)}">${ic("file", 14)} View attachment</button>` : ""}
            <div class="row" style="margin-top:14px">
              <button class="btn ghost danger-ghost" data-action="reject" data-id="${r.id}">${ic("x", 16)} Reject</button>
              <button class="btn" data-action="approve" data-id="${r.id}">${ic("check", 16)} Approve</button>
            </div></div>`;
        }).join("") || `<div class="empty">No pending requests.</div>`}
      </div>`,
    };
  };

  let histCursor = null;
  screens.riwayat = () => {
    if (!histCursor) { const d = new Date(); histCursor = new Date(d.getFullYear(), d.getMonth(), 1); }
    const ym = `${histCursor.getFullYear()}-${pad(histCursor.getMonth() + 1)}`;
    const a = state.attendance;
    const all = (a.in ? [{ date: a.date, in: a.in, out: a.out }] : []).concat(state.history);
    const recs = all.filter((h) => h.date.startsWith(ym)).sort((x, y) => (x.date < y.date ? 1 : -1));
    const isLate = (h) => { const d = new Date(h.in); return d.getHours() * 60 + d.getMinutes() > 8 * 60; };
    const done = recs.filter((h) => h.out);
    const avg = done.length ? done.reduce((sum, h) => sum + (h.out - h.in), 0) / done.length : 0;
    const now = new Date();
    const atLatest = histCursor.getFullYear() === now.getFullYear() && histCursor.getMonth() === now.getMonth();
    return {
      html: `
      ${header("Attendance History")}
      <div class="fade-in">
        <div class="cal-head card" style="padding:8px">
          <button class="icon-btn" data-action="histPrev" aria-label="Previous month">${ic("chevL", 20)}</button>
          <span>${MONTHS_LONG[histCursor.getMonth()]} ${histCursor.getFullYear()}</span>
          <button class="icon-btn" data-action="histNext" aria-label="Next month" ${atLatest ? "disabled style=\"opacity:.3\"" : ""}>${ic("chevR", 20)}</button>
        </div>
        <div class="summary">
          <div class="card"><div class="xs muted">Present</div><div class="big-num">${recs.length}<small> days</small></div></div>
          <div class="card"><div class="xs muted">Late</div><div class="big-num" style="color:${recs.filter(isLate).length ? "var(--orange)" : "inherit"}">${recs.filter(isLate).length}<small> days</small></div></div>
          <div class="card"><div class="xs muted">Avg. hours</div><div class="big-num">${done.length ? `${Math.floor(avg / 3600000)}h ${pad(Math.floor(avg / 60000) % 60)}m` : "–"}</div></div>
        </div>
        ${recs.map((h) => `
          <div class="status-item">
            <div class="date-tile"><b>${parseIso(h.date).getDate()}</b><span>${DAYS[parseIso(h.date).getDay()]}</span></div>
            <div class="grow"><div class="small"><span class="muted xs">In</span> <b>${hm(h.in)}</b> &nbsp; <span class="muted xs">Out</span> <b>${h.out ? hm(h.out) : "–"}</b></div>
              <div class="xs muted" style="margin-top:3px">Head Office${h.out ? ` · ${Math.floor((h.out - h.in) / 3600000)}h ${pad(Math.floor((h.out - h.in) / 60000) % 60)}m` : " · In progress"}</div></div>
            <span class="badge ${isLate(h) ? "orange" : "green"}">${isLate(h) ? "Late" : "On time"}</span>
          </div>`).join("") || `<div class="empty">No attendance records this month.</div>`}
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
  const pendingCount = () => (BE ? state.pending.length : state.requests.filter((r) => r.status === "Pending").length);
  const recalcLeave = () => { if (BE) state.leave.used = BE.leaveUsed(state.requests, today().slice(0, 4)); };
  // Manager decision on a request (approvals screen).
  async function review(id, status, note) {
    if (BE) {
      try { await BE.review(id, status, note); } catch (ex) { fail(ex); }
      try { state.pending = await BE.loadPending(); } catch { state.pending = state.pending.filter((r) => r.id !== id); }
      render();
      return toast(`Request ${status.toLowerCase()}`);
    }
    const r = state.requests.find((x) => x.id === id);
    if (!r || r.status !== "Pending") return;
    r.status = status;
    if (note) r.reviewNote = note;
    if (status === "Rejected" && r.type === "cuti" && r.title === "Annual Leave") state.leave.used -= daysBetween(r.from, r.to);
    const ok = status === "Approved";
    notify({ title: `${r.title} ${ok ? "approved" : "rejected"}`, body: `Your ${r.title.toLowerCase()} request for ${fmtRange(r.from, r.to)} was ${ok ? "approved" : "rejected"}${note ? `: "${note}"` : "."}`,
      icon: ok ? "check" : "x", color: ok ? "green" : "red", go: "#/status" });
    save(); render(); toast(`Request ${status.toLowerCase()}`);
  }
  // Submit a request; returns true on success. `form` supplies the optional attachment and submit button.
  async function addRequest(r, form) {
    if (!BE) {
      state.requests.push({ id: state.nextId++, status: "Pending", created: Date.now(), ...r });
      save();
      return true;
    }
    const btn = form && form.querySelector('button[type="submit"]');
    const file = form && form.querySelector('input[type="file"]')?.files[0];
    if (file && file.size > 10 * 1048576) { toast("Attachments must be 10 MB or smaller"); return false; }
    if (btn) btn.disabled = true;
    try {
      state.requests.unshift(await BE.addRequest(r, file));
      recalcLeave();
      return true;
    } catch (ex) {
      fail(ex);
      return false;
    } finally {
      if (btn) btn.disabled = false;
    }
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
      <table>${p.earn.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${idr(v)}</td></tr>`).join("")}
      ${p.ded.map(([k, v]) => `<tr><td>${esc(k)}</td><td>-${idr(v)}</td></tr>`).join("")}
      <tr class="t"><td>Net Salary</td><td>${idr(p.net)}</td></tr></table>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  const actions = {
    start() { state.onboarded = true; save(); go("#/login"); },
    nextSlide() { slide = Math.min(SLIDES.length - 1, slide + 1); render(); },
    slideTo(el) { slide = Number(el.dataset.i); render(); },
    async logout() {
      if (BE) {
        state.auth.loggedIn = false; // so the signed-out listener stays quiet
        await BE.signOut().catch(() => {});
        const onboarded = state.onboarded;
        state = emptyState();
        state.onboarded = onboarded;
      }
      state.auth.loggedIn = false; save(); closeSheet(); go("#/login"); toast("You have logged out");
    },
    forgot() {
      if (BE && !BE.canResetByEmail) {
        return sheet(`<div class="bold" style="font-size:16px">Forgot your password?</div>
          <p class="small muted" style="margin:8px 0 18px;line-height:1.5">Ask HR to reset it for you. They'll give you a new password, which you can change later in Profile → Settings.</p>
          <button class="btn ghost" data-close>OK</button>`);
      }
      if (BE) {
        const typed = ($("#login-id") || {}).value || "";
        return sheet(`<div class="bold" style="font-size:16px">Reset your password</div>
          <p class="small muted" style="margin:8px 0 14px;line-height:1.5">We'll email you a link to set a new password.</p>
          <form id="reset-form" novalidate><div class="field"><label for="reset-email">Work Email</label>
            <input class="input" id="reset-email" type="email" name="email" value="${esc(typed)}" autocomplete="username"/></div>
          <button class="btn" type="submit">Send Reset Link</button></form>`, (sh) => {
          $("#reset-form", sh).onsubmit = async (e) => {
            e.preventDefault();
            const email = e.target.email.value.trim();
            if (!/^\S+@\S+\.\S+$/.test(email)) return toast("Enter a valid email address");
            try { await BE.resetPassword(email); } catch (ex) { return fail(ex); }
            closeSheet(); toast("Check your email for the reset link");
          };
        });
      }
      sheet(`<div class="bold" style="font-size:16px">Forgot your password?</div>
        <p class="small muted" style="margin:8px 0 18px;line-height:1.5">Contact HR at <b>hr@company.co.id</b> to reset your password. In this demo you can restore the default password instead.</p>
        <button class="btn" id="reset-pw">Reset to demo password</button><button class="btn ghost" data-close style="margin-top:10px">Cancel</button>`,
        (s) => { $("#reset-pw", s).onclick = () => { state.auth.hash = DEFAULT_HASH; save(); closeSheet(); toast("Password reset to password123"); }; });
    },
    readAll() {
      state.notifications.forEach((n) => { n.read = true; }); save(); render();
      if (BE) BE.markRead(null).catch(fail);
    },
    openNotif(el) {
      const n = state.notifications.find((x) => x.id === Number(el.dataset.id));
      if (!n) return;
      if (BE && !n.read) BE.markRead(n.id).catch(fail);
      n.read = true; save();
      go(n.go || "#/notifikasi");
    },
    approve(el) { review(Number(el.dataset.id), "Approved"); },
    reject(el) {
      const id = Number(el.dataset.id);
      sheet(`<div class="bold" style="font-size:16px;margin-bottom:12px">Reject request</div>
        <form id="reject-form"><div class="field"><label for="reject-note">Reason (optional)</label>
          <textarea class="input" id="reject-note" name="note" placeholder="e.g. Team is short-staffed that week"></textarea></div>
          <button class="btn danger" type="submit">Reject Request</button></form>`, (s) => {
        $("#reject-form", s).onsubmit = (e) => { e.preventDefault(); closeSheet(); review(id, "Rejected", e.target.note.value.trim()); };
      });
    },
    histPrev() { histCursor = new Date(histCursor.getFullYear(), histCursor.getMonth() - 1, 1); render(); },
    histNext() { histCursor = new Date(histCursor.getFullYear(), histCursor.getMonth() + 1, 1); render(); },
    more() {
      sheet(`<div class="bold" style="margin-bottom:14px">More</div>
        <button class="list-item" data-close data-go="#/aktivitas">${ic("activity", 20, "var(--primary)")}<span class="grow">My Activity</span>${ic("chevR", 18)}</button>
        <button class="list-item" data-close data-go="#/reimburse">${ic("receipt", 20, "var(--green)")}<span class="grow">Reimbursement Request</span>${ic("chevR", 18)}</button>
        ${BE && !state.isManager ? "" : `<button class="list-item" data-close data-go="#/approvals">${ic("clipboard", 20, "var(--purple)")}<span class="grow">${BE ? "Approvals" : "Approvals (demo)"}</span>${pendingCount() ? `<span class="badge orange">${pendingCount()}</span>` : ""}${ic("chevR", 18)}</button>`}
        ${BE ? "" : `<button class="list-item" data-close data-action="resetDemo">${ic("history", 20, "var(--orange)")}<span class="grow">Reset Demo Data</span>${ic("chevR", 18)}</button>`}
        <button class="list-item" data-close data-go="#/bye">${ic("logout", 20, "var(--red)")}<span class="grow">Log Out</span>${ic("chevR", 18)}</button>`);
    },
    resetDemo() { state = seed(); state.onboarded = true; state.auth.loggedIn = true; save(); render(); toast("Demo data restored"); },
    async checkin(el) {
      if (BE) {
        el.disabled = true;
        try { state.attendance = await BE.checkIn(today(), state.attendance.location || "Head Office"); } catch (ex) { el.disabled = false; return fail(ex); }
      } else state.attendance.in = Date.now();
      save(); render(); toast(`Checked in at ${hm(state.attendance.in)}`);
    },
    checkout() {
      const worked = Date.now() - state.attendance.in;
      const confirmOut = async () => {
        if (BE) {
          try { state.attendance = await BE.checkOut(state.attendance.rowId); } catch (ex) { return fail(ex); }
        } else state.attendance.out = Date.now();
        save(); closeSheet(); render(); toast(`Checked out at ${hm(state.attendance.out)}`);
      };
      if (worked < 8 * 3600000) {
        sheet(`<div class="bold" style="font-size:16px">Check out now?</div>
          <p class="small muted" style="margin:8px 0 18px">You have only worked ${Math.floor(worked / 3600000)} hours ${Math.floor(worked / 60000) % 60} minutes (less than 8 hours).</p>
          <button class="btn" id="confirm-out">Yes, Check Out</button><button class="btn ghost" data-close style="margin-top:10px">Cancel</button>`,
          (s) => { $("#confirm-out", s).onclick = confirmOut; });
      } else confirmOut();
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
        <div class="info-row"><div class="grow xs muted">Date</div><div class="small bold">${fmtRange(r.from, r.to)}${r.type === "cuti" ? ` (${plural(daysBetween(r.from, r.to), "day")})` : ""}</div></div>
        ${r.amount ? `<div class="info-row"><div class="grow xs muted">Amount</div><div class="small bold">${idr(r.amount)}</div></div>` : ""}
        ${r.category ? `<div class="info-row"><div class="grow xs muted">Category</div><div class="small bold">${esc(r.category)}</div></div>` : ""}
        <div class="info-row"><div class="grow xs muted">Description</div><div class="small bold" style="text-align:right;max-width:65%">${esc(r.note)}</div></div>
        ${r.reviewNote ? `<div class="info-row"><div class="grow xs muted">Manager note</div><div class="small bold" style="text-align:right;max-width:65%">${esc(r.reviewNote)}</div></div>` : ""}
        ${r.attachment ? `<button class="list-item" style="margin-top:14px" data-action="openAttachment" data-path="${esc(r.attachment)}">${ic("file", 20, "var(--muted)")}<span class="grow">View attachment</span>${ic("chevR", 18)}</button>` : ""}
        ${r.status === "Pending" ? `<button class="btn danger" id="cancel-req" style="margin-top:16px">Cancel Request</button>` : ""}`,
        (s) => {
          const b = $("#cancel-req", s);
          if (b) b.onclick = async () => {
            if (BE) {
              b.disabled = true;
              try { await BE.cancelRequest(r.id); } catch (ex) { b.disabled = false; return fail(ex); }
              state.requests = state.requests.filter((x) => x.id !== r.id);
              recalcLeave();
            } else {
              if (r.type === "cuti" && r.title === "Annual Leave") state.leave.used -= daysBetween(r.from, r.to);
              state.requests = state.requests.filter((x) => x.id !== r.id);
            }
            save(); closeSheet(); render(); toast("Request cancelled");
          };
        });
    },
    async openAttachment(el) {
      if (!BE) return toast("Attachments are only stored when connected to the server");
      try {
        const url = await BE.attachmentUrl(el.dataset.path);
        sheet(`<div class="bold" style="margin-bottom:12px">Attachment</div>
          ${BE.linkNote === "" ? "" : `<p class="small muted" style="margin-bottom:16px">${BE.linkNote ?? "The link works for 5 minutes."}</p>`}
          <a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${ic("eye", 18)} Open attachment</a>`);
      } catch (ex) { fail(ex); }
    },
    toggleSalary() { showSalary = !showSalary; render(); },
    slipDetail() { sheet(`<div class="bold" style="margin-bottom:4px">Salary Details</div><div class="xs muted">${monthLabel(slipMonth)}</div>${slipTable(payslip(slipMonth))}`); },
    slipDownload: printSlip,
    slipHistory() {
      const now = new Date();
      const months = BE ? Object.keys(state.payslips).sort().reverse().slice(0, 24)
        : Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; });
      if (!months.length) return toast("No payslips yet");
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
        $("#pw-form", s).onsubmit = async (e) => {
          e.preventDefault();
          const f = e.target;
          if (!f.old.value) return toast("Enter your current password");
          if (!BE && (await sha256(f.old.value)) !== state.auth.hash) return toast("Current password is incorrect");
          if (f.n1.value.length < 8) return toast("Password must be at least 8 characters");
          if (f.n1.value !== f.n2.value) return toast("Passwords do not match");
          if (f.n1.value === f.old.value) return toast("New password must be different");
          if (BE) {
            try { await BE.changePassword(state.user.email, f.old.value, f.n1.value); } catch (ex) { return fail(ex); }
            closeSheet(); return toast("Password changed");
          }
          state.auth.hash = await sha256(f.n1.value);
          notify({ title: "Password changed", body: "Your account password was changed. If this wasn't you, contact IT.", icon: "lock", color: "purple", go: "#/profil" });
          save(); closeSheet(); toast("Password changed");
        };
      });
    },
    editProfile() {
      const u = state.user;
      sheet(`<div class="bold" style="margin-bottom:14px">Edit Profile</div>
        <form id="profile-form" novalidate>
          <div class="field"><label>Email</label><input class="input" type="email" name="email" value="${esc(u.email)}" ${BE ? 'readonly title="Your sign-in email is managed by HR"' : ""}/></div>
          <div class="field"><label>Phone</label><input class="input" type="tel" name="phone" value="${esc(u.phone)}"/></div>
          <div class="field"><label>Address</label><input class="input" name="address" value="${esc(u.address)}"/></div>
          <button class="btn" type="submit">Save Changes</button></form>`, (s) => {
        $("#profile-form", s).onsubmit = async (e) => {
          e.preventDefault();
          const f = e.target;
          if (!/^\S+@\S+\.\S+$/.test(f.email.value)) return toast("Invalid email format");
          if (f.phone.value.replace(/\D/g, "").length < 9) return toast("Invalid phone number");
          if (!f.address.value.trim()) return toast("Please enter an address");
          if (BE) {
            try { await BE.updateProfile({ phone: f.phone.value.trim(), address: f.address.value.trim() }); } catch (ex) { return fail(ex); }
          }
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
    async docView(el) {
      const d = state.docs.find((x) => x.id === Number(el.dataset.id));
      if (BE) {
        try {
          const url = await BE.docUrl(d, false);
          const isImg = /\.(png|jpe?g|gif|webp)$/i.test(d.file);
          return sheet(`<div class="bold" style="margin-bottom:12px">${esc(d.name)}</div>
            ${isImg ? `<img src="${esc(url)}" alt="${esc(d.name)}" style="width:100%;border-radius:12px;margin-bottom:14px"/>` : ""}
            <a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${ic("eye", 18)} Open ${esc(d.file)}</a>
            ${BE.linkNote === "" ? "" : `<p class="xs muted" style="text-align:center;margin-top:10px">${BE.linkNote ?? "The link works for 5 minutes."}</p>`}`);
        } catch (ex) { return fail(ex); }
      }
      sheet(`<div class="bold" style="margin-bottom:12px">${esc(d.name)}</div>
        <div style="aspect-ratio:3/4;border-radius:12px;background:${COLOR[d.kind][0]};display:grid;place-items:center">${ic("file", 64, COLOR[d.kind][1], 1.4)}</div>
        <div class="xs muted" style="text-align:center;margin-top:10px">Preview of ${esc(d.file)}</div>`);
    },
    async docDownload(el) {
      const d = state.docs.find((x) => x.id === Number(el.dataset.id));
      if (!BE) return toast(`Downloading ${d.file}…`);
      try {
        const url = await BE.docUrl(d, true);
        sheet(`<div class="bold" style="margin-bottom:12px">Download ${esc(d.file)}</div>
          <a class="btn" href="${esc(url)}" rel="noopener">${ic("download", 18)} Download</a>
          ${BE.linkNote === "" ? "" : `<p class="xs muted" style="text-align:center;margin-top:10px">${BE.linkNote ?? "The link works for 5 minutes."}</p>`}`);
      } catch (ex) { fail(ex); }
    },
    async docDelete(el) {
      const id = Number(el.dataset.id);
      if (BE) {
        try { await BE.deleteDoc(state.docs.find((x) => x.id === id)); } catch (ex) { return fail(ex); }
      }
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
    if (!state.onboarded) return "onboarding";
    if (!state.auth.loggedIn) return "login";
    if (!r || !screens[r] || r === "onboarding" || r === "login") return "home";
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

  // Backend mode: load the signed-in user's data from Supabase into `state`.
  async function hydrate() {
    Object.assign(state, await BE.load(today()));
    state.auth.loggedIn = true;
    if (state.announcements) ANNOUNCEMENTS = state.announcements;
  }
  // Screens without forms can be refreshed in place when the app comes back into view.
  const REFRESHABLE = ["home", "status", "notifikasi", "approvals", "aktivitas", "riwayat", "pengumuman", "absensi", "dokumen", "slip-gaji", "jadwal"];

  navStack.push(location.hash || "#/home");
  if (BE) {
    $("#app").innerHTML = `<div class="empty" style="padding-top:45%">${ic("clock", 28, "var(--primary)")}<br/><br/>Loading your workspace…</div>`;
    (async () => {
      try {
        if (await BE.hasSession()) await hydrate();
      } catch (ex) {
        state.auth.loggedIn = false;
        await BE.signOut().catch(() => {});
        fail(ex);
      }
      render();
    })();
    BE.onSignedOut(() => {
      if (!state.auth.loggedIn) return;
      state = { ...emptyState(), onboarded: state.onboarded };
      render();
      toast("You have been signed out");
    });
    // Opened from a password-reset email: ask for the new password.
    BE.onRecovery(() => {
      sheet(`<div class="bold" style="font-size:16px;margin-bottom:12px">Choose a new password</div>
        <form id="recover-form" novalidate>
          <div class="field"><label for="rec-1">New Password</label><input class="input" id="rec-1" type="password" name="n1" autocomplete="new-password"/></div>
          <div class="field"><label for="rec-2">Confirm New Password</label><input class="input" id="rec-2" type="password" name="n2" autocomplete="new-password"/></div>
          <button class="btn" type="submit">Save Password</button></form>`, (sh) => {
        $("#recover-form", sh).onsubmit = async (e) => {
          e.preventDefault();
          const f = e.target;
          if (f.n1.value.length < 8) return toast("Password must be at least 8 characters");
          if (f.n1.value !== f.n2.value) return toast("Passwords do not match");
          try { await BE.setPassword(f.n1.value); await hydrate(); } catch (ex) { return fail(ex); }
          closeSheet(); history.replaceState(null, "", location.pathname + "#/home"); render(); toast("Password updated");
        };
      });
    });
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState !== "visible" || !state.auth.loggedIn || !REFRESHABLE.includes(route()) || $(".sheet-back")) return;
      try { await hydrate(); render(); } catch { /* keep showing what we have */ }
    });
  } else if (window.MyWorkBackendError) {
    $("#app").innerHTML = `<div class="empty" style="padding:45% 24px 0">${ic("info", 28, "var(--red)")}<br/><br/>${esc(window.MyWorkBackendError)}</div>`;
  } else {
    render();
  }
})();
