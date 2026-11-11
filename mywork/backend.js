/* MyWork – data layer.
 * Sign-in, announcements, notifications and personal documents use Supabase directly.
 * HR data (profile, attendance, time off, expenses, payslips, approvals) lives in Odoo and goes
 * through the "mywork-odoo" Edge Function, which holds the Odoo key and checks every request.
 * Without supabaseUrl in config.js the app runs in offline demo mode. */
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
  const fnUrl = cfg.functionUrl || cfg.supabaseUrl.replace(/\/+$/, "") + "/functions/v1/mywork-odoo";
  const toMs = (t) => (t ? new Date(t).getTime() : null);
  let signedOutCb = null;

  function friendly(error) {
    const msg = (error && (error.message || error.error_description)) || String(error);
    if (/Invalid login credentials/i.test(msg)) return "Email or password is incorrect.";
    if (/Email not confirmed/i.test(msg)) return "Confirm your email address first, then sign in.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return "Can't reach the server. Check your connection and try again.";
    if (/JWT expired|invalid JWT/i.test(msg)) return "Your session expired. Please sign in again.";
    if (/row-level security|permission denied/i.test(msg)) return "You don't have permission to do that.";
    return msg;
  }
  const must = ({ data, error }) => { if (error) throw new Error(friendly(error)); return data; };
  const safeName = (name) => name.replace(/[^\w.\-]+/g, "_").slice(-80);

  /** Call the Odoo bridge with the signed-in user's session. */
  async function hr(action, payload = {}) {
    const { data } = await sb.auth.getSession();
    const session = data.session;
    if (!session) { if (signedOutCb) signedOutCb(); throw new Error("Please sign in."); }
    let res;
    try {
      res = await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, apikey: cfg.supabaseKey },
        body: JSON.stringify({ action, ...payload }),
      });
    } catch {
      throw new Error("Can't reach the server. Check your connection and try again.");
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && signedOutCb) signedOutCb();
      throw new Error((body && body.error) || `The server returned an error (${res.status}).`);
    }
    return body;
  }

  /** File → {name, mimetype, base64} for the bridge. */
  const readFile = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve(undefined);
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, mimetype: file.type || "application/octet-stream", base64: String(r.result).split(",")[1] || "" });
    r.onerror = () => reject(new Error("The attachment could not be read."));
    r.readAsDataURL(file);
  });

  const mapNotif = (n) => ({ id: n.id, ts: toMs(n.created_at), title: n.title, body: n.body, icon: n.icon, color: n.color, go: n.link, read: n.read });
  const mapDoc = (d) => ({ id: d.id, name: d.name, file: d.file_name, size: Number(d.size_bytes), kind: d.kind, path: d.storage_path });

  let uid = null;

  const api = {
    url: cfg.supabaseUrl,
    odoo: true,
    profileReadOnly: true, // employee details are maintained by HR in Odoo
    leaveUsed: null, // balances come from Odoo allocations
    linkNote: "",

    async hasSession() {
      const { data } = await sb.auth.getSession();
      uid = data.session ? data.session.user.id : null;
      return !!data.session;
    },
    onSignedOut(cb) {
      signedOutCb = cb;
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

    async load() {
      // HR data first: it also creates/updates this user's Supabase profile, which the
      // notification, announcement and document queries below depend on.
      const state = await hr("load");
      const [notifications, announcements, docs] = await Promise.all([
        sb.from("mywork_notifications").select("*").order("created_at", { ascending: false }).limit(50),
        sb.from("mywork_announcements").select("*").order("published_on", { ascending: false }).limit(50),
        sb.from("mywork_documents").select("*").order("created_at"),
      ]).then((results) => results.map(must));
      return {
        ...state,
        uid,
        notifications: notifications.map(mapNotif),
        announcements: announcements.map((a) => ({ cat: a.category, icon: a.icon, color: a.color, title: a.title, date: a.published_on, body: a.body })),
        docs: docs.map(mapDoc),
      };
    },
    async loadPending() { return (await hr("load")).pending; },

    async checkIn(today) { return { date: today, ...(await hr("checkin")) }; },
    async checkOut(rowId) { const r = await hr("checkout", { rowId }); return { date: undefined, ...r }; },

    async addRequest(r, file) {
      const f = await readFile(file);
      if (r.type === "cuti") return hr("leave", { typeId: r.typeId, from: r.from, to: r.to, note: r.note, file: f });
      if (r.type === "reimburse") return hr("expense", { productId: r.productId, date: r.from, amount: r.amount, note: r.note, file: f });
      throw new Error("This request type isn't available.");
    },
    async cancelRequest(id) { await hr("cancel", { id }); },
    async review(id, status, note) { return hr("review", { id, decision: status === "Approved" ? "approve" : "refuse", note: note || "" }); },
    async attachmentUrl(id) {
      const f = await hr("attachment", { id });
      const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));
      return URL.createObjectURL(new Blob([bytes], { type: f.mimetype }));
    },

    async markRead(id) {
      let q = sb.from("mywork_notifications").update({ read: true }).eq("read", false);
      if (id != null) q = q.eq("id", id);
      must(await q);
    },
    async updateProfile() { throw new Error("Your details come from Odoo. Ask HR to update them."); },

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
