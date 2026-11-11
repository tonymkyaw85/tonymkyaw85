// MyWork <-> Odoo bridge, deployed as a Supabase Edge Function ("mywork-odoo").
//
// The app sends POST {action, ...} with the employee's Supabase session token. This function:
//   1. verifies the token with Supabase Auth and requires a confirmed email,
//   2. finds the ONE employee in the configured Odoo company with that work email,
//   3. reads or writes only that employee's records (or their direct reports', for managers),
//   4. keeps a small profile row in Supabase so announcements and notifications work.
// The Odoo API key stays here, in the function's environment; it never reaches the app.
//
// Environment (see README): ODOO_URL, ODOO_DB, ODOO_API_KEY, ODOO_COMPANY_ID, MYWORK_TIMEZONE,
// MYWORK_ALLOWED_ORIGINS, plus SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// (the last three are provided to Edge Functions by Supabase).
import { odooClient, OdooError } from "./odoo.ts";
import * as hr from "./hr.ts";

const env = (k: string, fallback = "") => Deno.env.get(k) ?? fallback;
const SUPABASE_URL = env("SUPABASE_URL").replace(/\/+$/, "");
const ANON_KEY = env("SUPABASE_ANON_KEY");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const settings: hr.Settings = { companyId: Number(env("ODOO_COMPANY_ID", "1")), tz: env("MYWORK_TIMEZONE", "Asia/Singapore") };
const allowedOrigins = env("MYWORK_ALLOWED_ORIGINS", "*").split(",").map((o) => o.trim()).filter(Boolean);
const call = odooClient({ url: env("ODOO_URL"), db: env("ODOO_DB"), apiKey: env("ODOO_API_KEY") });

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"];

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allow = allowedOrigins.includes("*") ? "*" : allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" } });

interface AuthUser { id: string; email: string }

async function currentUser(req: Request): Promise<AuthUser> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new hr.UserError("Please sign in.", 401);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new hr.UserError("Your session expired. Please sign in again.", 401);
  const u = await res.json();
  if (!u?.email || !(u.email_confirmed_at || u.confirmed_at)) throw new hr.UserError("Confirm your email address first, then sign in.", 403);
  return { id: u.id, email: String(u.email).toLowerCase() };
}

// ---- Supabase (service role) for profiles + notifications ---------------------------

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}

/** Keep the employee's Supabase profile in step with Odoo (used for announcements, notifications, documents). */
async function syncProfile(user: AuthUser, me: hr.Employee, isManager: boolean) {
  await rest("mywork_profiles?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: user.id, email: user.email, employee_id: `odoo:${me.id}`, full_name: me.name,
      job_title: me.job_title || "", department: Array.isArray(me.department_id) ? me.department_id[1] : "",
      app_role: isManager ? "manager" : "employee", status: "Active",
    }),
  });
}

/** Best effort: tell someone (by work email) about a request. Skipped if they've never opened the app. */
async function notify(email: string, n: { title: string; body: string; icon: string; color: string; link: string }) {
  if (!email) return;
  try {
    const rows = await rest(`mywork_profiles?select=id&email=eq.${encodeURIComponent(email.toLowerCase())}`);
    if (rows?.[0]) await rest("mywork_notifications", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ user_id: rows[0].id, ...n }) });
  } catch (e) {
    console.error("notify failed", e);
  }
}

async function managerEmail(me: hr.Employee): Promise<string> {
  const id = Array.isArray(me.parent_id) ? me.parent_id[0] : null;
  if (!id) return "";
  const [m] = await call<any[]>("hr.employee", "read", { ids: [id], fields: ["work_email"] });
  return m?.work_email || "";
}

function upload(f: unknown): hr.Upload | undefined {
  if (!f) return undefined;
  const { name, base64, mimetype } = f as hr.Upload;
  if (typeof base64 !== "string" || typeof name !== "string") throw new hr.UserError("The attachment could not be read.");
  if (base64.length * 0.75 > MAX_UPLOAD_BYTES) throw new hr.UserError("Attachments must be 10 MB or smaller.", 413);
  if (!UPLOAD_TYPES.includes(mimetype)) throw new hr.UserError("Attach a PDF or a photo (JPG, PNG, HEIC).", 415);
  return { name: name.replace(/[\\/\0]/g, "_").slice(0, 200), base64, mimetype };
}

const fmtDates = (from: string, to: string) => (from === to ? from : `${from} to ${to}`);

// ---- Request handling ----------------------------------------------------------------

async function handle(req: Request) {
  const user = await currentUser(req);
  const body = await req.json().catch(() => ({}));
  const me = await hr.findEmployee(call, settings, user.email);

  switch (body.action) {
    case "load": {
      const state = await hr.load(call, settings, me);
      await syncProfile(user, me, state.isManager);
      return state;
    }
    case "checkin":
      return hr.checkIn(call, me);
    case "checkout":
      return hr.checkOut(call, me, Number(body.rowId));
    case "leave": {
      const r = await hr.requestLeave(call, settings, me, {
        typeId: Number(body.typeId), from: String(body.from), to: String(body.to), note: String(body.note ?? ""), file: upload(body.file),
      });
      await notify(await managerEmail(me), { title: "Time off request", body: `${me.name} asked for ${r.title} (${fmtDates(r.from, r.to)}).`, icon: "palm", color: "orange", link: "#/approvals" });
      return r;
    }
    case "expense": {
      const r = await hr.submitExpense(call, settings, me, {
        productId: Number(body.productId), date: String(body.date), amount: Number(body.amount), note: String(body.note ?? ""), file: upload(body.file),
      });
      await notify(await managerEmail(me), { title: "Expense claim", body: `${me.name} submitted ${r.currency} ${r.amount} (${r.category ?? "expense"}).`, icon: "receipt", color: "orange", link: "#/approvals" });
      return r;
    }
    case "cancel":
      await hr.cancelRequest(call, me, String(body.id));
      return { ok: true };
    case "review": {
      const approve = body.decision === "approve";
      const { request, employeeEmail } = await hr.review(call, settings, me, String(body.id), approve, String(body.note ?? ""));
      const note = String(body.note ?? "").trim();
      await notify(employeeEmail, {
        title: `${request.title} ${approve ? "approved" : "refused"}`,
        body: `Your ${request.title.toLowerCase()} for ${fmtDates(request.from, request.to)} was ${approve ? "approved" : "refused"} by ${me.name}${note ? `: "${note}"` : "."}`,
        icon: approve ? "check" : "x", color: approve ? "green" : "red", link: "#/status",
      });
      return request;
    }
    case "attachment":
      return hr.attachment(call, settings, me, String(body.id));
    default:
      throw new hr.UserError("Unknown action.", 404);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Use POST." }, 405);
  try {
    return json(req, await handle(req));
  } catch (e) {
    if (e instanceof hr.UserError) return json(req, { error: e.message }, e.status);
    if (e instanceof OdooError) {
      if (e.status === 403 || /AccessError/.test(e.odooName)) {
        console.error("Odoo access denied:", e.message);
        return json(req, { error: "MyWork's Odoo account isn't allowed to do this. Ask your Odoo administrator to check its access rights." }, 403);
      }
      // Odoo validation messages (overlapping time off, not enough balance, ...) are written for users.
      if (e.status >= 400 && e.status < 500) return json(req, { error: e.message }, 400);
      console.error("Odoo error:", e.status, e.odooName, e.message);
      return json(req, { error: "Odoo had a problem. Please try again in a moment." }, 502);
    }
    console.error("mywork-odoo error:", e);
    return json(req, { error: "Something went wrong. Please try again." }, 500);
  }
});
