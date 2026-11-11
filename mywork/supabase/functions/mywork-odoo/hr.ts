// MyWork <-> Odoo HR logic. Every function acts for ONE employee (`me`), who is resolved
// from the signed-in user's verified company email. The Odoo integration user has wider
// rights, so all scoping to "me", "my direct reports" and the company happens here.
import { addDays, type Call, m2oId, m2oName, msToOdoo, nowOdoo, odooToMs, OdooError, todayIn } from "./odoo.ts";

export interface Settings {
  companyId: number;
  tz: string;
}

export class UserError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const EMPLOYEE_FIELDS = [
  "name", "work_email", "work_phone", "mobile_phone", "job_title", "job_id", "department_id", "parent_id",
  "registration_number", "barcode", "resource_calendar_id", "company_id", "work_location_id", "user_id", "create_date",
];

export type Employee = Record<string, any>;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

/** The single active employee in the company whose work email matches. */
export async function findEmployee(call: Call, s: Settings, email: string): Promise<Employee> {
  const rows = await call<Employee[]>("hr.employee", "search_read", {
    domain: [["work_email", "=ilike", escapeLike(email.trim())], ["company_id", "=", s.companyId]],
    fields: EMPLOYEE_FIELDS,
    limit: 2,
  });
  if (rows.length === 0) throw new UserError("Your email isn't linked to an employee record. Ask HR to check your work email in Odoo.", 403);
  if (rows.length > 1) throw new UserError("More than one employee uses this work email. Ask HR to give each person their own work email in Odoo.", 409);
  return rows[0];
}

async function directReports(call: Call, s: Settings, me: Employee): Promise<Employee[]> {
  return call<Employee[]>("hr.employee", "search_read", {
    domain: [["parent_id", "=", me.id], ["company_id", "=", s.companyId]],
    fields: ["name", "work_email"],
  });
}

// ---- Status mapping ---------------------------------------------------------------

const LEAVE_STATUS: Record<string, string> = {
  confirm: "Pending", validate1: "Pending", validate: "Approved", refuse: "Rejected", cancel: "Cancelled",
};
const EXPENSE_STATUS: Record<string, string> = {
  // Claims from the app stay in draft until the manager approves them in MyWork (see review()).
  draft: "Pending", submitted: "Pending", approved: "Approved", posted: "Approved", in_payment: "Approved", paid: "Paid", refused: "Rejected",
};

function mapLeave(l: any) {
  return {
    id: "leave-" + l.id, odooId: l.id, kind: "leave", type: "cuti", title: m2oName(l.work_entry_type_id) || "Time Off",
    from: l.request_date_from, to: l.request_date_to, days: l.number_of_days, note: l.name || "",
    status: LEAVE_STATUS[l.state] ?? l.state, created: odooToMs(l.create_date),
    employee: m2oName(l.employee_id), attachment: (l.supported_attachment_ids || []).length ? "leave-" + l.id : undefined,
  };
}

function mapExpense(e: any) {
  return {
    id: "exp-" + e.id, odooId: e.id, kind: "expense", type: "reimburse", title: "Reimbursement",
    from: e.date, to: e.date, note: e.name || e.description || "", amount: e.total_amount_currency,
    currency: m2oName(e.currency_id), category: m2oName(e.product_id) || undefined,
    status: EXPENSE_STATUS[e.state] ?? e.state, created: odooToMs(e.create_date), employee: m2oName(e.employee_id),
    attachment: e.nb_attachment ? "exp-" + e.id : undefined,
  };
}

const LEAVE_FIELDS = ["work_entry_type_id", "request_date_from", "request_date_to", "number_of_days", "name", "state", "create_date", "employee_id", "supported_attachment_ids"];
const EXPENSE_FIELDS = ["name", "description", "date", "total_amount_currency", "currency_id", "product_id", "state", "create_date", "employee_id", "nb_attachment"];

/** Run a read that the integration user might not be allowed to do (e.g. payroll); return fallback instead of failing. */
async function optional<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof OdooError && (e.status === 403 || /AccessError|access/i.test(e.odooName + e.message))) return fallback;
    throw e;
  }
}

// ---- Load everything the app shows ------------------------------------------------

export async function load(call: Call, s: Settings, me: Employee) {
  const today = todayIn(s.tz);
  const since = addDays(today, -120);
  const reports = await directReports(call, s, me);
  const reportIds = reports.map((r) => r.id);

  const [attendance, leaves, expenses, leaveTypes, categories, holidays, payslips, pendingLeaves, pendingExpenses, company] = await Promise.all([
    call<any[]>("hr.attendance", "search_read", {
      domain: [["employee_id", "=", me.id], ["check_in", ">=", since + " 00:00:00"]],
      fields: ["check_in", "check_out", "worked_hours"], order: "check_in desc", limit: 200,
    }),
    call<any[]>("hr.leave", "search_read", {
      domain: [["employee_id", "=", me.id], ["state", "!=", "cancel"]], fields: LEAVE_FIELDS, order: "create_date desc", limit: 100,
    }),
    call<any[]>("hr.expense", "search_read", {
      domain: [["employee_id", "=", me.id]], fields: EXPENSE_FIELDS, order: "create_date desc", limit: 100,
    }),
    leaveTypesFor(call, s, me),
    call<any[]>("product.product", "search_read", {
      domain: [["can_be_expensed", "=", true], ["company_id", "in", [s.companyId, false]]], fields: ["name"], order: "name", limit: 100,
    }),
    call<any[]>("resource.calendar.leaves", "search_read", {
      domain: [["resource_id", "=", false], ["company_id", "in", [s.companyId, false]],
        ["calendar_id", "in", [m2oId(me.resource_calendar_id), false]],
        ["date_to", ">=", addDays(today, -180) + " 00:00:00"], ["date_from", "<=", addDays(today, 180) + " 23:59:59"]],
      fields: ["name", "date_from", "date_to"],
    }),
    optional(payslipsFor(call, me), null),
    reportIds.length
      ? call<any[]>("hr.leave", "search_read", { domain: [["employee_id", "in", reportIds], ["state", "in", ["confirm", "validate1"]]], fields: LEAVE_FIELDS, order: "create_date" })
      : Promise.resolve([]),
    reportIds.length
      ? call<any[]>("hr.expense", "search_read", { domain: [["employee_id", "in", reportIds], ["state", "in", ["draft", "submitted"]]], fields: EXPENSE_FIELDS, order: "create_date" })
      : Promise.resolve([]),
    call<any[]>("res.company", "search_read", { domain: [["id", "=", s.companyId]], fields: ["currency_id"] }),
  ]);

  const att = attendance.map((a) => ({
    rowId: a.id, date: todayIn(s.tz, new Date(odooToMs(a.check_in)!)), in: odooToMs(a.check_in), out: odooToMs(a.check_out), location: "",
  }));
  const open = att.find((a) => !a.out);
  const todays = open ?? att.find((a) => a.date === today);
  const annual = leaveTypes.find((t) => /annual/i.test(t.name)) ?? leaveTypes[0];
  const events = holidays.flatMap((h) => {
    const out = [];
    const from = todayIn(s.tz, new Date(odooToMs(h.date_from)!)), to = todayIn(s.tz, new Date(odooToMs(h.date_to)!));
    for (let d = from; d <= to; d = addDays(d, 1)) out.push({ date: d, time: "—", title: h.name, place: "Public holiday", color: "red", holiday: true });
    return out;
  });

  return {
    today,
    isManager: reports.length > 0,
    currency: m2oName(company[0]?.currency_id) || "SGD",
    user: {
      name: me.name, role: me.job_title || m2oName(me.job_id), id: me.registration_number || me.barcode || "—", status: "Active",
      email: me.work_email, phone: me.mobile_phone || me.work_phone || "", dept: m2oName(me.department_id),
      joined: (me.create_date || "").slice(0, 10), address: m2oName(me.work_location_id), manager: m2oName(me.parent_id),
    },
    leave: annual ? { total: annual.max, used: Math.max(0, annual.max - annual.remaining) } : { total: 0, used: 0 },
    leaveTypes,
    expenseCategories: categories.map((c) => ({ id: c.id, name: c.name })),
    attendance: todays ?? { date: today, in: null, out: null, location: "" },
    history: att.filter((a) => a !== todays),
    requests: [...leaves.map(mapLeave), ...expenses.map(mapExpense)].sort((a, b) => (b.created ?? 0) - (a.created ?? 0)),
    pending: [...pendingLeaves.map(mapLeave), ...pendingExpenses.map(mapExpense)].map((r) => ({ ...r, requester: r.employee })),
    payslips: payslips ?? {},
    payslipsAvailable: payslips !== null,
    events,
  };
}

/** Time off types this employee may request, with their balance where allocations apply. */
async function leaveTypesFor(call: Call, s: Settings, me: Employee) {
  const types = await call<any[]>("hr.work.entry.type", "search_read", {
    domain: [["time_off_selectable", "=", true], ["country_code", "in", ["SG", false]]],
    fields: ["name", "requires_allocation", "request_unit", "max_leaves", "virtual_remaining_leaves", "leaves_taken", "leave_validation_type"],
    context: { employee_id: me.id },
    order: "name",
  });
  return types
    // Types that need an allocation are only useful if HR allocated some days.
    .filter((t) => !t.requires_allocation || t.max_leaves > 0)
    .map((t) => ({
      id: t.id, name: t.name, unit: t.request_unit, limited: t.requires_allocation, max: t.max_leaves, remaining: t.virtual_remaining_leaves,
      needsApproval: ["manager", "hr", "both"].includes(t.leave_validation_type),
    }));
}

async function payslipsFor(call: Call, me: Employee) {
  const slips = await call<any[]>("hr.payslip", "search_read", {
    domain: [["employee_id", "=", me.id], ["state", "in", ["done", "paid"]]], fields: ["date_from", "line_ids"], order: "date_from desc", limit: 24,
  });
  if (!slips.length) return {};
  // In Odoo 19 appears_on_payslip is a selection: "always" / "non_zero" / "never".
  const lines = await call<any[]>("hr.payslip.line", "search_read", {
    domain: [["slip_id", "in", slips.map((x) => x.id)], ["appears_on_payslip", "!=", "never"]],
    fields: ["slip_id", "name", "code", "total"],
  });
  const round = (n: number) => Math.round(n * 100) / 100;
  const out: Record<string, { earn: [string, number][]; ded: [string, number][]; net?: number }> = {};
  for (const slip of slips) {
    const period = String(slip.date_from).slice(0, 7);
    const all = lines.filter((l) => m2oId(l.slip_id) === slip.id);
    const shown = all.filter((l) => l.total !== 0 && !["GROSS", "NET"].includes(l.code));
    const earn: [string, number][] = shown.filter((l) => l.total > 0).map((l) => [l.name, round(l.total)]);
    const ded: [string, number][] = shown.filter((l) => l.total < 0).map((l) => [l.name, round(-l.total)]);
    // Take-home pay is Odoo's NET line. Deductions that aren't separate lines (such as the
    // employee's CPF contribution) are shown as one line so the payslip adds up to it.
    const netLine = all.find((l) => l.code === "NET");
    if (netLine) {
      const sum = (xs: [string, number][]) => xs.reduce((s, x) => s + x[1], 0);
      const gap = round(sum(earn) - sum(ded) - netLine.total);
      if (gap > 0.005) ded.push(["Other deductions (incl. CPF)", gap]);
    }
    out[period] = { earn, ded, net: netLine ? round(netLine.total) : undefined };
  }
  return out;
}

// ---- Writes ------------------------------------------------------------------------

export async function checkIn(call: Call, me: Employee) {
  const open = await call<any[]>("hr.attendance", "search_read", { domain: [["employee_id", "=", me.id], ["check_out", "=", false]], fields: ["id"], limit: 1 });
  if (open.length) throw new UserError("You're already checked in.", 409);
  const [id] = await call<number[]>("hr.attendance", "create", { vals_list: [{ employee_id: me.id, check_in: nowOdoo() }] });
  return attendanceRow(call, id);
}

export async function checkOut(call: Call, me: Employee, rowId: number) {
  const open = await call<any[]>("hr.attendance", "search_read", { domain: [["id", "=", rowId], ["employee_id", "=", me.id], ["check_out", "=", false]], fields: ["id"] });
  if (!open.length) throw new UserError("Already checked out.", 409);
  await call("hr.attendance", "write", { ids: [rowId], vals: { check_out: nowOdoo() } });
  return attendanceRow(call, rowId);
}

async function attendanceRow(call: Call, id: number) {
  const [a] = await call<any[]>("hr.attendance", "read", { ids: [id], fields: ["check_in", "check_out"] });
  return { rowId: a.id, in: odooToMs(a.check_in), out: odooToMs(a.check_out), location: "" };
}

export interface Upload { name: string; base64: string; mimetype: string }

async function attach(call: Call, model: string, resId: number, file?: Upload) {
  if (!file) return;
  // Odoo 19.3 exchanges attachment content as base64 in the "raw" field ("datas" no longer exists).
  await call("ir.attachment", "create", { vals_list: [{ name: file.name, raw: file.base64, mimetype: file.mimetype, res_model: model, res_id: resId }] });
}

export async function requestLeave(call: Call, s: Settings, me: Employee, p: { typeId: number; from: string; to: string; note: string; file?: Upload }) {
  const allowed = await leaveTypesFor(call, s, me);
  const type = allowed.find((t) => t.id === p.typeId);
  if (!type) throw new UserError("This type of time off isn't available to you.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.from) || !/^\d{4}-\d{2}-\d{2}$/.test(p.to) || p.to < p.from) throw new UserError("Check the dates and try again.");
  const [id] = await call<number[]>("hr.leave", "create", {
    vals_list: [{ employee_id: me.id, work_entry_type_id: p.typeId, request_date_from: p.from, request_date_to: p.to, name: p.note.slice(0, 500) }],
    // The integration user is a Time Off Officer, so Odoo would approve the request as soon as it
    // is created. For types that need approval, leave_fast_create keeps it waiting ("To Approve")
    // for the manager's decision in MyWork. Types set to "No validation" are approved by Odoo as usual.
    ...(type.needsApproval ? { context: { leave_fast_create: true } } : {}),
  });
  await attach(call, "hr.leave", id, p.file);
  const [row] = await call<any[]>("hr.leave", "read", { ids: [id], fields: LEAVE_FIELDS });
  return mapLeave(row);
}

export async function submitExpense(call: Call, s: Settings, me: Employee, p: { productId: number; date: string; amount: number; note: string; file?: Upload }) {
  const ok = await call<any[]>("product.product", "search_read", {
    domain: [["id", "=", p.productId], ["can_be_expensed", "=", true], ["company_id", "in", [s.companyId, false]]], fields: ["id"],
  });
  if (!ok.length) throw new UserError("Choose an expense category.");
  if (!(p.amount > 0)) throw new UserError("Enter an amount.");
  if (!p.file) throw new UserError("Attach a receipt.");
  const [id] = await call<number[]>("hr.expense", "create", {
    vals_list: [{
      employee_id: me.id, product_id: p.productId, name: p.note.slice(0, 200) || "Expense", date: p.date,
      total_amount_currency: p.amount, quantity: 1, payment_mode: "own_account",
    }],
  });
  // Not submitted in Odoo yet: Odoo would make the integration user the approver and
  // approve it on the spot. The manager's decision in MyWork submits (approves) or refuses it.
  await attach(call, "hr.expense", id, p.file);
  const [row] = await call<any[]>("hr.expense", "read", { ids: [id], fields: EXPENSE_FIELDS });
  return mapExpense(row);
}

/** Cancel one of my own requests that nobody has decided on yet. */
export async function cancelRequest(call: Call, me: Employee, requestId: string) {
  const [kind, raw] = requestId.split("-");
  const id = Number(raw);
  if (kind === "leave") {
    const rows = await call<any[]>("hr.leave", "search_read", { domain: [["id", "=", id], ["employee_id", "=", me.id], ["state", "in", ["confirm", "validate1"]]], fields: ["id"] });
    if (!rows.length) throw new UserError("This request can no longer be cancelled.", 409);
    // Nobody has decided yet, so the request is simply withdrawn (deleted) in Odoo.
    await call("hr.leave", "unlink", { ids: [id] });
  } else if (kind === "exp") {
    const rows = await call<any[]>("hr.expense", "search_read", { domain: [["id", "=", id], ["employee_id", "=", me.id], ["state", "in", ["draft", "submitted"]]], fields: ["id"] });
    if (!rows.length) throw new UserError("This request can no longer be cancelled.", 409);
    const [cur] = await call<any[]>("hr.expense", "read", { ids: [id], fields: ["state"] });
    if (cur.state === "submitted") await call("hr.expense", "action_reset", { ids: [id] });
    await call("hr.expense", "unlink", { ids: [id] });
  } else throw new UserError("Unknown request.");
}

/** A manager approves or refuses a direct report's request. Recorded in Odoo with the manager's name. */
export async function review(call: Call, s: Settings, me: Employee, requestId: string, approve: boolean, note: string) {
  const [kind, raw] = requestId.split("-");
  const id = Number(raw);
  const model = kind === "leave" ? "hr.leave" : kind === "exp" ? "hr.expense" : "";
  if (!model) throw new UserError("Unknown request.");
  const pendingStates = kind === "leave" ? ["confirm", "validate1"] : ["draft", "submitted"];
  const [row] = await call<any[]>(model, "search_read", {
    domain: [["id", "=", id], ["state", "in", pendingStates], ["employee_id.parent_id", "=", me.id], ["employee_id.company_id", "=", s.companyId]],
    fields: kind === "leave" ? LEAVE_FIELDS : EXPENSE_FIELDS,
  });
  if (!row) throw new UserError("Request not found, already decided, or not from your team.", 409);

  const reason = note.trim().slice(0, 500);
  await call(model, "message_post", {
    ids: [id],
    body: `${approve ? "Approved" : "Refused"} in MyWork by ${me.name} (manager)${reason ? `: ${reason}` : "."}`,
  });
  if (kind === "leave") {
    if (approve) {
      await call("hr.leave", "action_approve", { ids: [id] });
      const [after] = await call<any[]>("hr.leave", "read", { ids: [id], fields: ["state"] });
      if (after.state === "validate1") await call("hr.leave", "action_validate", { ids: [id] });
    } else {
      await call("hr.leave", "action_refuse", { ids: [id] });
    }
  } else {
    if (approve) {
      if (row.state === "draft") await call("hr.expense", "action_submit", { ids: [id] });
      const [cur] = await call<any[]>("hr.expense", "read", { ids: [id], fields: ["state"] });
      if (cur.state === "submitted") await call("hr.expense", "action_approve", { ids: [id] });
    } else {
      // Odoo refuses through its "Refuse Expense" wizard, which carries the reason.
      const [w] = await call<number[]>("hr.expense.refuse.wizard", "create", {
        vals_list: [{ reason: reason || `Refused in MyWork by ${me.name}`, expense_ids: [[6, 0, [id]]] }],
      });
      await call("hr.expense.refuse.wizard", "action_refuse", { ids: [w] });
    }
  }
  const [after] = await call<any[]>(model, "read", { ids: [id], fields: kind === "leave" ? LEAVE_FIELDS : EXPENSE_FIELDS });
  return { request: kind === "leave" ? mapLeave(after) : mapExpense(after), employeeEmail: await workEmailOf(call, m2oId(row.employee_id)!) };
}

async function workEmailOf(call: Call, employeeId: number): Promise<string> {
  const [e] = await call<any[]>("hr.employee", "read", { ids: [employeeId], fields: ["work_email"] });
  return e?.work_email || "";
}

/** A request's first attachment, if it belongs to me or to one of my direct reports. */
export async function attachment(call: Call, s: Settings, me: Employee, requestId: string) {
  const [kind, raw] = requestId.split("-");
  const id = Number(raw);
  const model = kind === "leave" ? "hr.leave" : kind === "exp" ? "hr.expense" : "";
  if (!model) throw new UserError("Unknown request.");
  const owned = await call<any[]>(model, "search_read", {
    domain: [["id", "=", id], ["employee_id.company_id", "=", s.companyId], "|", ["employee_id", "=", me.id], ["employee_id.parent_id", "=", me.id]],
    fields: ["id"],
  });
  if (!owned.length) throw new UserError("Attachment not found.", 404);
  const [file] = await call<any[]>("ir.attachment", "search_read", {
    domain: [["res_model", "=", model], ["res_id", "=", id]], fields: ["name", "mimetype", "raw"], order: "id", limit: 1,
  });
  if (!file) throw new UserError("Attachment not found.", 404);
  return { name: file.name, mimetype: file.mimetype || "application/octet-stream", base64: file.raw };
}

export { msToOdoo };
