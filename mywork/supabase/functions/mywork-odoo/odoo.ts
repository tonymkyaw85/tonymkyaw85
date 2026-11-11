// Minimal client for Odoo's JSON-2 API (Odoo 19+): POST /json/2/<model>/<method>.
// Every call runs in its own transaction, as the integration user that owns the API key.

export class OdooError extends Error {
  constructor(message: string, public status: number, public odooName = "") {
    super(message);
  }
}

export interface OdooConfig {
  url: string; // e.g. https://edpn.odoo.com
  db: string; // e.g. edpn
  apiKey: string;
}

export type Call = <T = unknown>(model: string, method: string, body?: Record<string, unknown>) => Promise<T>;

// Odoo Online rate-limits bursts (HTTP 429), so keep few requests in flight and retry politely.
const MAX_IN_FLIGHT = 3;
const RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function odooClient(cfg: OdooConfig, fetchImpl: typeof fetch = fetch): Call {
  const base = cfg.url.replace(/\/+$/, "") + "/json/2/";
  let inFlight = 0;
  const waiting: (() => void)[] = [];
  const acquire = () => inFlight < MAX_IN_FLIGHT ? (inFlight++, Promise.resolve()) : new Promise<void>((r) => waiting.push(() => { inFlight++; r(); }));
  const release = () => { inFlight--; waiting.shift()?.(); };

  return async function call<T>(model: string, method: string, body: Record<string, unknown> = {}): Promise<T> {
    let res!: Response;
    for (let attempt = 0; ; attempt++) {
      await acquire();
      try {
        res = await fetchImpl(base + model + "/" + method, {
          method: "POST",
          headers: {
            "Authorization": "bearer " + cfg.apiKey,
            "Content-Type": "application/json; charset=utf-8",
            "X-Odoo-Database": cfg.db,
            "User-Agent": "MyWork/1.0",
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        throw new OdooError("Can't reach Odoo right now. Please try again.", 502, String(e));
      } finally {
        release();
      }
      if (res.status !== 429 || attempt >= RETRIES) break;
      await res.body?.cancel();
      const after = Number(res.headers.get("Retry-After"));
      await sleep(after > 0 ? Math.min(after, 10) * 1000 : 500 * 2 ** attempt);
    }
    if (res.status === 429) throw new OdooError("Odoo is busy right now. Please try again in a moment.", 429);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // Odoo returns {name, message, debug}; never pass the traceback on to the app.
      throw new OdooError(cleanMessage(data?.message) || `Odoo returned an error (${res.status}).`, res.status, data?.name ?? "");
    }
    return data as T;
  };
}

/** Odoo user-facing messages sometimes carry "\n\n" detail meant for admins; keep the first part. */
function cleanMessage(msg: unknown): string {
  return typeof msg === "string" ? msg.split("\n\n")[0].trim().slice(0, 300) : "";
}

// ---- Date helpers: Odoo datetimes are UTC strings "YYYY-MM-DD HH:MM:SS" ----

export const odooToMs = (s: string | false | null): number | null =>
  s ? Date.parse(s.replace(" ", "T") + "Z") : null;

export const nowOdoo = (): string => new Date().toISOString().slice(0, 19).replace("T", " ");

export const msToOdoo = (ms: number): string => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

/** Today's date (YYYY-MM-DD) in the given IANA time zone. */
export function todayIn(tz: string, at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Many2one values arrive as [id, "Name"] or false. */
export const m2oId = (v: unknown): number | null => (Array.isArray(v) ? Number(v[0]) : null);
export const m2oName = (v: unknown): string => (Array.isArray(v) ? String(v[1]) : "");
