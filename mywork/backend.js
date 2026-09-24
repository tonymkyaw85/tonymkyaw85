/* MyWork – data layer for the PHP + MySQL API in /api.
 * Exposes window.MyWorkBackend when config.js sets apiUrl; otherwise the app runs in
 * offline demo mode. The API decides what each signed-in employee may read and write. */
(() => {
  "use strict";
  const cfg = window.MYWORK_CONFIG || {};
  window.MyWorkBackend = null;
  if (!cfg.apiUrl) return;

  const base = cfg.apiUrl.replace(/\/?$/, "/") + "index.php";
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
  let signedOutCb = null;

  async function call(action, { body, form, query } = {}) {
    const url = `${base}?a=${action}${query ? "&" + new URLSearchParams(query) : ""}`;
    const opts = { credentials: "same-origin", headers: { "X-MyWork": "1" } };
    if (form) { opts.method = "POST"; opts.body = form; }
    else if (body !== undefined) { opts.method = "POST"; opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    let res;
    try { res = await fetch(url, opts); } catch { throw new Error("Can't reach the server. Check your connection and try again."); }
    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    if (!res.ok) {
      if (res.status === 401 && action !== "login" && signedOutCb) signedOutCb();
      throw new Error((data && data.error) || `The server returned an error (${res.status}).`);
    }
    return data;
  }
  const withFile = (fields, file) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
    if (file) fd.append("file", file);
    return fd;
  };

  function leaveUsed(requests, year) {
    return requests
      .filter((r) => r.type === "cuti" && r.title === "Annual Leave" && r.status !== "Rejected" && r.from.startsWith(String(year)))
      .reduce((sum, r) => sum + daysBetween(r.from, r.to), 0);
  }

  window.MyWorkBackend = {
    url: base,
    leaveUsed,
    canResetByEmail: false, // passwords are reset by HR on the admin page
    linkNote: "",

    async hasSession() { return (await call("session")).signedIn; },
    onSignedOut(cb) { signedOutCb = cb; },
    onRecovery() { /* no email-based recovery with this backend */ },
    async signIn(email, password) { await call("login", { body: { email, password } }); },
    async signOut() { await call("logout", { body: {} }); },
    async changePassword(_email, oldPassword, newPassword) { await call("change_password", { body: { old: oldPassword, new: newPassword } }); },

    async load() {
      const s = await call("load");
      s.requests = s.requests.map(clean);
      s.pending = s.pending.map(clean);
      return s;
    },
    async loadPending() { return (await call("pending")).map(clean); },

    async checkIn(_today, location) { return call("checkin", { body: { location } }); },
    async checkOut(rowId) { return call("checkout", { body: { id: rowId } }); },

    async addRequest(r, file) {
      return clean(await call("request", { form: withFile({
        type: r.type, title: r.title, from: r.from, to: r.to, note: r.note, amount: r.amount, category: r.category,
      }, file) }));
    },
    async cancelRequest(id) { await call("cancel_request", { body: { id } }); },
    async review(id, status, note) { return clean(await call("review", { body: { id, status, note: note || "" } })); },
    async attachmentUrl(requestId) { return `${base}?a=file&type=att&id=${encodeURIComponent(requestId)}`; },

    async markRead(id) { await call("notif_read", { body: id == null ? {} : { id } }); },
    async updateProfile({ phone, address }) { await call("profile", { body: { phone, address } }); },

    async uploadDoc(file, kind) { return call("doc_upload", { form: withFile({ kind }, file) }); },
    async docUrl(doc, download) { return `${base}?a=file&type=doc&id=${doc.id}${download ? "&download=1" : ""}`; },
    async deleteDoc(doc) { await call("doc_delete", { body: { id: doc.id } }); },
  };

  // The API sends null for empty optional fields; the app expects them to be absent.
  function clean(r) {
    for (const k of ["amount", "category", "attachment", "reviewNote"]) if (r[k] == null) delete r[k];
    return r;
  }
})();
