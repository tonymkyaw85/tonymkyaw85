/* MyWork – Supabase data layer.
 * Exposes window.MyWorkBackend when config.js has a Supabase URL and key; otherwise the
 * app runs in offline demo mode. Row level security in supabase/schema.sql decides what
 * each signed-in user may read and write — nothing here is trusted by the server. */
(() => {
  "use strict";
  const cfg = window.MYWORK_CONFIG || {};
  window.MyWorkBackend = null;
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return;
  if (!window.supabase || !window.supabase.createClient) {
    window.MyWorkBackendError = "The Supabase library could not be loaded. Check your internet connection and reload.";
    return;
  }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const toMs = (t) => (t ? new Date(t).getTime() : null);
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (s, n) => { const [y, m, d] = s.split("-").map(Number); return iso(new Date(y, m - 1, d + n)); };
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

  // Turn Supabase/PostgREST errors into messages a person can act on.
  function friendly(error) {
    const msg = (error && (error.message || error.error_description)) || String(error);
    if (/Invalid login credentials/i.test(msg)) return "Email or password is incorrect.";
    if (/Email not confirmed/i.test(msg)) return "Confirm your email address first, then sign in.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return "Can't reach the server. Check your connection and try again.";
    if (/JWT expired|invalid JWT/i.test(msg)) return "Your session expired. Please sign in again.";
    if (/row-level security|permission denied/i.test(msg)) return "You don't have permission to do that.";
    const raised = msg.match(/^(Not enough leave balance|Already checked out|work_date must be today|Only managers can review requests|Request not found, already reviewed, or your own)/);
    if (raised) return raised[1] === "work_date must be today" ? "Attendance can only be recorded for today." : raised[1] + ".";
    return msg;
  }
  const must = ({ data, error }) => { if (error) throw new Error(friendly(error)); return data; };
  const safeName = (name) => name.replace(/[^\w.\-]+/g, "_").slice(-80);

  const mapRequest = (r) => ({
    id: r.id, userId: r.user_id, type: r.type, title: r.title, from: r.date_from, to: r.date_to, note: r.note,
    amount: r.amount != null ? Number(r.amount) : undefined, category: r.category || undefined,
    attachment: r.attachment_path || undefined, status: r.status, reviewNote: r.review_note || undefined,
    created: toMs(r.created_at),
  });
  const mapNotif = (n) => ({ id: n.id, ts: toMs(n.created_at), title: n.title, body: n.body, icon: n.icon, color: n.color, go: n.link, read: n.read });
  const mapDoc = (d) => ({ id: d.id, name: d.name, file: d.file_name, size: Number(d.size_bytes), kind: d.kind, path: d.storage_path });
  const mapAttendance = (a) => ({ rowId: a.id, date: a.work_date, in: toMs(a.check_in), out: toMs(a.check_out), location: a.location });

  function leaveUsed(requests, year) {
    return requests
      .filter((r) => r.type === "cuti" && r.title === "Annual Leave" && r.status !== "Rejected" && r.from.startsWith(String(year)))
      .reduce((sum, r) => sum + daysBetween(r.from, r.to), 0);
  }

  let uid = null;

  const api = {
    url: cfg.supabaseUrl,
    leaveUsed,

    async hasSession() {
      const { data } = await sb.auth.getSession();
      uid = data.session ? data.session.user.id : null;
      return !!data.session;
    },
    onSignedOut(cb) {
      sb.auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT") { uid = null; cb(); } });
    },
    onRecovery(cb) {
      sb.auth.onAuthStateChange((event, session) => { if (event === "PASSWORD_RECOVERY") { uid = session.user.id; cb(); } });
    },
    async setPassword(password) { must(await sb.auth.updateUser({ password })); },
    async signIn(email, password) {
      const data = must(await sb.auth.signInWithPassword({ email, password }));
      uid = data.user.id;
    },
    async signOut() { await sb.auth.signOut(); uid = null; },
    async resetPassword(email) {
      must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
    },
    async changePassword(email, oldPassword, newPassword) {
      const check = await sb.auth.signInWithPassword({ email, password: oldPassword });
      if (check.error) throw new Error("Current password is incorrect.");
      must(await sb.auth.updateUser({ password: newPassword }));
    },

    // Everything the app shows for the signed-in user, in the app's state shape.
    async load(today) {
      const since = addDays(today, -120);
      const [profile, attendance, requests, notifications, announcements, docs, payslips, events] = await Promise.all([
        sb.from("mywork_profiles").select("*").eq("id", uid).maybeSingle(),
        sb.from("mywork_attendance").select("*").eq("user_id", uid).gte("work_date", since).order("work_date", { ascending: false }),
        sb.from("mywork_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(200),
        sb.from("mywork_notifications").select("*").order("created_at", { ascending: false }).limit(50),
        sb.from("mywork_announcements").select("*").order("published_on", { ascending: false }).limit(50),
        sb.from("mywork_documents").select("*").order("created_at"),
        sb.from("mywork_payslips").select("*").order("period", { ascending: false }),
        sb.from("mywork_schedule_events").select("*").gte("event_date", addDays(today, -180)).lte("event_date", addDays(today, 180)),
      ]).then((results) => results.map(must));
      if (!profile) throw new Error("Your account isn't set up for MyWork yet. Ask HR to add you.");

      const att = attendance.map(mapAttendance);
      const todays = att.find((a) => a.date === today);
      const reqs = requests.map(mapRequest);
      const state = {
        uid,
        isManager: profile.app_role === "manager",
        user: {
          name: profile.full_name || profile.email, role: profile.job_title, id: profile.employee_id || "—",
          status: profile.status, email: profile.email || "", phone: profile.phone, dept: profile.department,
          joined: profile.joined_on, address: profile.address,
        },
        leave: { total: profile.annual_leave_days, used: leaveUsed(reqs, today.slice(0, 4)) },
        attendance: todays || { date: today, in: null, out: null, location: "Head Office" },
        history: att.filter((a) => a !== todays),
        requests: reqs,
        notifications: notifications.map(mapNotif),
        announcements: announcements.map((a) => ({ cat: a.category, icon: a.icon, color: a.color, title: a.title, date: a.published_on, body: a.body })),
        docs: docs.map(mapDoc),
        payslips: Object.fromEntries(payslips.map((p) => [p.period, { earn: p.earnings, ded: p.deductions }])),
        events: events.map((e) => ({
          date: e.event_date, time: e.start_time ? e.start_time.slice(0, 5) : "—", title: e.title, place: e.place,
          color: e.color, holiday: e.is_holiday,
        })),
        pending: [],
      };
      if (state.isManager) state.pending = await api.loadPending();
      return state;
    },

    // Managers: every pending request from other employees, with the requester's name.
    async loadPending() {
      const rows = must(await sb.from("mywork_requests").select("*").eq("status", "Pending").neq("user_id", uid).order("created_at"));
      const ids = [...new Set(rows.map((r) => r.user_id))];
      const people = ids.length ? must(await sb.from("mywork_profiles").select("id, full_name").in("id", ids)) : [];
      const names = Object.fromEntries(people.map((p) => [p.id, p.full_name]));
      return rows.map((r) => ({ ...mapRequest(r), requester: names[r.user_id] || "Employee" }));
    },

    async checkIn(today, location) {
      return mapAttendance(must(await sb.from("mywork_attendance").insert({ work_date: today, location }).select().single()));
    },
    async checkOut(rowId) {
      // The server sets the real check-out time; the value sent here is ignored.
      return mapAttendance(must(await sb.from("mywork_attendance").update({ check_out: new Date().toISOString() }).eq("id", rowId).select().single()));
    },

    async addRequest(r, file) {
      let attachment_path = null;
      if (file) {
        attachment_path = `${uid}/${Date.now()}-${safeName(file.name)}`;
        must(await sb.storage.from("mywork-request-attachments").upload(attachment_path, file, { contentType: file.type || undefined }));
      }
      const row = must(await sb.from("mywork_requests").insert({
        type: r.type, title: r.title, date_from: r.from, date_to: r.to, note: r.note,
        amount: r.amount ?? null, category: r.category ?? null, attachment_path,
      }).select().single());
      return mapRequest(row);
    },
    async cancelRequest(id) {
      const rows = must(await sb.from("mywork_requests").delete().eq("id", id).select("id"));
      if (!rows.length) throw new Error("This request can no longer be cancelled.");
    },
    async review(id, status, note) {
      return mapRequest(must(await sb.rpc("mywork_review_request", { p_id: id, p_status: status, p_note: note || null })));
    },
    async attachmentUrl(path) {
      return must(await sb.storage.from("mywork-request-attachments").createSignedUrl(path, 300)).signedUrl;
    },

    async markRead(id) {
      let q = sb.from("mywork_notifications").update({ read: true }).eq("read", false);
      if (id != null) q = q.eq("id", id);
      must(await q);
    },
    async updateProfile({ phone, address }) {
      must(await sb.from("mywork_profiles").update({ phone, address }).eq("id", uid));
    },

    async uploadDoc(file, kind) {
      const path = `${uid}/${Date.now()}-${safeName(file.name)}`;
      must(await sb.storage.from("mywork-documents").upload(path, file, { contentType: file.type || undefined }));
      try {
        const row = must(await sb.from("mywork_documents").insert({
          name: file.name.replace(/\.[^.]+$/, ""), file_name: file.name, size_bytes: file.size, kind, storage_path: path,
        }).select().single());
        return mapDoc(row);
      } catch (e) {
        await sb.storage.from("mywork-documents").remove([path]);
        throw e;
      }
    },
    async docUrl(doc, download) {
      return must(await sb.storage.from("mywork-documents").createSignedUrl(doc.path, 300, download ? { download: doc.file } : undefined)).signedUrl;
    },
    async deleteDoc(doc) {
      must(await sb.from("mywork_documents").delete().eq("id", doc.id));
      await sb.storage.from("mywork-documents").remove([doc.path]);
    },
  };

  window.MyWorkBackend = api;
})();
