# SUTURA — Appointment → Job Order → Payment: gap analysis and proposed model

**Status (2026-10-01): Phase 1 is built** — see §7. Phases 2–5 are still proposals.

Written 2026-10-01 as a service-management review (service request → fulfilment → verification → closure). **Proposal only — nothing in this document is built yet.** Every "today" statement below was checked against the code, not the older docs.

---

## 1. The three records, and what each one is for

| Record | ITSM role | Question it answers | Today |
|---|---|---|---|
| **Appointment** | Service *request* + scheduling | "Does the customer want to see us, when, for what?" | Exists (`appointments`) |
| **Job order** | Service *fulfilment* (the work) | "What are we making, for how much, who is on it, what stage?" | Exists (`job_orders`) |
| **Payment** | Verification / financial record | "How much was paid, how, and has it been verified?" | Exists (`payments`), job-order only |

Rule to keep: an appointment is **not** a job order. An appointment can end with *no* job (consultation only, rejected, no-show), and a job can exist with *no* appointment (walk-in order). They are linked (`appointments.job_order_id`, `job_orders.appointment_id`), never merged.

---

## 2. Today (verified)

**Appointment**
- Types: `consultation, measurement, fitting, alteration, pickup`.
- Statuses: `pending → confirmed → in_progress → completed`, plus `cancelled`, `no_show`. There is **no `rejected` status** — a store "rejects" a pending request by cancelling it, and a **free-text reason is required** (`cancellation_reason`).
- `assigned_staff_id` exists and the owner can set it in the Schedule form, but **assigning does not notify the staff** (no notification class for it).
- Confirmed/in-progress appointments can share a link/photos with the customer and record measurements (built 2026-09-30).
- Owner **Home** shows today's agenda; it does **not** show a "pending appointments to review" queue.

**Job order**
- Created from an appointment ("Job" button) or directly; carries the service, design, combo package, bundle price, measurement, due date, tracking code.
- 50% downpayment gate before production; only owner / branch manager collect payments.
- Staff are attributed automatically when they move a job into a production stage (no up-front assignment by design, 2026-09-27).

**Payment**
- Methods recorded: `cash, gcash, paymaya`; GCash/PayMaya need a receipt and sit as *pending verification* until the owner/branch manager verifies or rejects (with reason). Cash needs `cash_tendered` and verifies immediately.
- The store has **one** GCash number/QR and **one** bank account on the `stores` row (not a configurable list).
- A payment has **no `source` (online/walk-in) and no `type` (deposit / partial / balance)** — those are inferred.
- Appointments have their own small `payment_*` fields (deposit proof at booking), separate from job payments.

**Staff limits**: plan limits are enforced when adding staff — Basic 1, Pro 5, Premium unlimited.

---

## 3. Gaps (ranked)

| # | Gap | Impact |
|---|---|---|
| G1 | No **pending-requests queue** on Home | Owner can miss new online bookings — the most important queue in the system |
| G2 | "Reject" is a bare cancel with free text; **no preset reasons**, no distinct `rejected` status | Reports can't tell "rejected by shop" from "cancelled by customer" |
| G3 | **Approve and assign are one blurry step**; assigning never notifies staff | The staff member doesn't know a job is theirs |
| G4 | Appointment types are fixed; **no "Other"** | Shops can't book things that aren't one of the five (e.g. fabric shopping, design pickup, complaint visit) |
| G5 | **Measurement / fitting / payment are assumed, not configured** | A bulk jersey order is forced through the same steps as a bespoke suit |
| G6 | Payment methods are one GCash + one bank, not configurable | Shops with Maya, several accounts, or per-branch accounts can't represent them |
| G7 | Payment has no `source` / `type` | Reports can't split online vs walk-in, deposit vs balance |
| G8 | Paper measurements: photo can't be attached to the measurement from the staff phone flow cleanly | Shops that measure on paper must retype |
| G9 | Staff mobile layout (320–599px) not audited for the new appointment actions | Staff work on phones |

---

## 4. Proposed model

### 4.1 Appointment types (general, with "Other")

Keep the five. Add **`other`** — a general bucket so the list never needs another code change:

| Type | Needs a service? | Default length | Notes |
|---|---|---|---|
| consultation | no | 30 | unchanged |
| measurement | yes | 45→**60** (30-min blocks) | unchanged |
| fitting | linked order | 45→**60** | unchanged |
| alteration | yes | 30 | unchanged |
| pickup | linked order | 15→**30** | unchanged |
| **other** *(new)* | no | 30 | requires a short **purpose label** (free text, ≤ 60 chars) so staff know what it is; shows as "Other — {label}" |

Lengths are whole 30-minute blocks because the calendar slots are 30 minutes apart (15/45 collide).

### 4.2 Appointment lifecycle (adds `rejected`)

```
PENDING ──approve──► CONFIRMED ──► IN_PROGRESS ──► COMPLETED
   │                     │
   └──reject (reason)──► REJECTED        └──► CANCELLED / NO_SHOW
```

- **Reject** requires a reason chosen from a list *plus* optional note: *Schedule unavailable · Staff unavailable · Service unavailable · Shop capacity reached · Request can't be accommodated · Other*. Stored (`rejection_reason_code`, `rejection_note`), shown to the customer, written to the audit log.
- **Approve** and **Assign staff** are two actions on the same screen. Approving never forces an assignment; assigning sends the staff a notification ("New appointment assigned": customer, design/service/package, time, branch, notes, what to prepare).

### 4.3 Owner Home — "Needs your decision" queue

A card at the top of Home (owner and branch manager; branch-scoped for managers), above the agenda:

- Count badge + the oldest 5 pending requests, newest-waiting first, each row: customer · what (design/service/package) · date & time · branch · online/walk-in · **Approve / Reject / Open**.
- Also lists **payments awaiting verification** (GCash/PayMaya proofs) — same "needs a decision" idea.
- Must read the **true count from the API** (not derived from a capped list — the known recurring bug in this codebase).

### 4.4 Configurable requirements instead of one fixed flow

Attach three requirements to the **service / design / combo** (defaults sensible, owner can change):

| Requirement | Values |
|---|---|
| Measurement | Not required · Customer-provided / existing · Shop measures |
| Final fitting | Not required · Optional · Required |
| Payment policy | None online · Full · 50% deposit · Custom amount |

The job order **copies** these at creation, so later edits to the service don't rewrite old orders. The tracker and the staff checklist show only the steps that apply. This replaces hard-coding "measure → sew → fit" for everyone and covers bulk, standard, made-to-measure and luxury work with the same screens.

### 4.5 Payments — one record, two dimensions

Keep a **single** `payments` table (no separate online / walk-in tables) and add:

- `source`: `online | walk_in` — *where/how* it was made
- `method`: `cash | gcash | maya | bank_transfer | other` — *what* was used
- `type`: `deposit | partial | full | balance`
- `payment_method_id` → new **shop payment methods** table (name, account name, account number, QR, instructions, active, optional branch)

Online = customer pays outside SUTURA, uploads proof, owner verifies. Walk-in = staff/owner **Record Payment** (cash or e-payment, reference optional). SUTURA never touches money or card credentials — consistent with the approved scope.

Only owner / branch manager record or verify payments (unchanged).

### 4.6 Staff phone experience (320–599px)

- Staff list of "assigned to me" appointments/jobs with one-tap **Start**, **Record measurements**, **Attach photo of paper measurements**, **Share link/photo with customer**.
- Large tap targets (≥ 44px), sticky bottom action bar, no horizontal scroll.

---

## 4.7 Rules agreed after review (binding for implementation)

1. Appointment, job order and payment stay **separate records with separate statuses** (appointment `confirmed` + job `in production` + payment `partial` can all be true at once). Payment is never an appointment status.
2. Add a real appointment status **`rejected`** (shop declined). It is not `cancelled` (customer/other). Rejection requires a **preset reason code**, an optional note, a customer notification and an audit-log entry. Existing cancelled rows are **not** back-filled (we can't know which were store rejections).
3. **Approve does not require assigning staff.** A confirmed appointment may stay unassigned (`status = confirmed`, `assigned_staff_id = null`) — no "assigned" status.
4. **Appointment assignment** (who handles this visit) and **job assignment** (who works the production) are different things. **Phase 1 changes only the appointment**: assigned staff gets a notification. The existing job-order rule — staff are attributed when they move a job into a stage — is **left untouched**.
5. Home → **Needs your decision**: pending appointments and payments awaiting verification, using the API's true total count (never a count derived from a capped list).
6. **Other** = appointment type + short purpose label only. It does not force a service; a service/job can be linked later.
7. **Requirement precedence** (Phase 5): the most specific wins — *design → its linked service → store default*; a combo uses its own setting, else the store default. A job order **snapshots** the resulting measurement / fitting / payment requirements when it is created, so later edits never rewrite old orders.
8. **Payment methods** (Phase 4): configurable with a scope — *whole shop* or *one branch*.
9. Payment stays **one table** with `source`, `method`, `type`, `payment_method_id`, amount, reference, proof, status. SUTURA never takes payment credentials or moves money: online = pay outside + proof + verification; walk-in = staff/owner **Record Payment**.
10. Phase 1 must **not** include Phase 4 (payments) or Phase 5 (configurable requirements).

---

## 5. Suggested build order

| Phase | Scope | Why this order |
|---|---|---|
| **1** | Home "Needs your decision" queue + `rejected` status with reason list + approve/assign split + staff notification | Biggest daily value, small schema change |
| **2** | `other` appointment type (+ purpose label) | Tiny and unblocks general bookings |
| **3** | Staff mobile pass (assigned-to-me, measurements photo, 320–599px) | Needed before staff test on phones |
| **4** | Payment `source`/`type` columns + shop **Payment Methods** list + Record Payment dialog | Touches money; do it carefully, with a backfill |
| **5** | Configurable measurement / fitting / payment policy on service, design, combo | Largest; builds on 1–4 |

Each phase should ship behind a passing end-to-end check (as done for the booking → job → payment flow).

---

## 6. Decisions needed from the shop owner / team

1. **Reject reasons** — is the proposed list right, or should the owner be able to add their own?
2. **Approve vs assign** — may an appointment stay *confirmed but unassigned* (owner assigns later), or must assignment happen at approval?
3. **"Other"** — free-text label only, or also pick whether it needs a service / linked order?
4. **Deposit policy default** — 50% for custom/made-to-measure, full for standard, none for consultation? (Today's gate is 50% before production for everything except repairs.)
5. **Payment methods** — one list per shop, or per branch?
6. **Paper measurements** — photo attached to the measurement record only, or also typed values required?
7. **Scope check** — everything above stays inside the approved limitations (no payment gateway, no hardware, no logistics).

---

## 7. Phase 1 — what was built (2026-10-01)

- **`rejected` status** (terminal; only from `pending`). `POST /stores/{store}/appointments/{id}/reject` with `reason_code` (schedule_unavailable · staff_unavailable · service_unavailable · capacity_reached · cannot_accommodate · other) and an optional `note`. Owner / branch manager only; branch-scoped for managers. Writes the audit log (`appointment_rejected`) and notifies the customer with the reason. The generic `PUT …/appointments/{id}` cannot set `rejected` (a reason is mandatory). Old "cancelled by the store" rows are not back-filled.
- **Approve ≠ assign.** `PUT …/appointments/{id}/assign` `{staff_id|null}` (owner / branch manager). Confirmed + unassigned is a valid state. Assigning notifies that staff member ("New appointment assigned"); staff must belong to the store (and the appointment's branch, unless the owner assigns). Audit-logged. **Job-order production attribution is untouched.**
- **Home → "Needs your decision"** (`GET /stores/{store}/decision-queue`, owner / branch manager, **uncached**, true `->count()`): pending appointment requests (soonest first, Approve / Reject / Open), job-order e-payment proofs awaiting verification, and booking deposit proofs. Hidden when nothing is waiting.
- Customer: Rejected badge, the reason and note on *My Appointments* and the detail page; a rejected request does not count as an active booking, so they can book again.
- Owner Appointments: **Rejected** filter tab; the review dialog's Reject now asks for the reason; an **Assigned staff** picker (with Assign / Unassign) in the review and view dialogs.
- Not in this phase (as agreed): the `other` type, staff mobile pass, payment `source`/`type`/payment-methods, configurable requirements.
