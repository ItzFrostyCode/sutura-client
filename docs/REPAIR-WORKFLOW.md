# SUTURA Repair Service Workflow

> Scoped addition to `docs/CUSTOMER-WORKFLOW.md` §8 (Direct Order Workflow) — repair only, nothing else redesigned. As with every companion doc in this series: **Current** claims trace to a specific controller/model already verified; **Target** items are decisions to build. No code was modified.

---

## 1. Tracking Code — already current, not a gap

**Verified:** `JobOrderController::customerRepairRequest()` already calls the exact same `generateTrackingCode($store, $orderNumber)` every other order-creation path uses (Made-to-Order, Bulk, staff-created jobs). A repair Job Order gets a real, unique, non-sequential tracking code **today, with no change needed** — the mechanism the requirement asks for already exists and repair already uses it.

**One precision correction against the example given:** the code is **not** type-prefixed (`RPR-...`). `generateTrackingCode()` prefixes with the *store's* code (`Store.store_code`, e.g. `TNED` for "Thread & Needle"), then a random 4-character alphanumeric suffix drawn from a charset that excludes visually ambiguous characters (`0/O/1/I` are absent from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), re-rolled until it's guaranteed unique against `JobOrder.tracking_code` (including soft-deleted rows). So a repair at "Thread & Needle" gets something like `TNED4K7Q` — the same shape a custom tailoring job or bulk order from that same store would get, not a repair-distinct prefix. This already satisfies every functional requirement (unique, non-sequential, stored on the Job Order, usable by `/track/[code]`) — the only gap is cosmetic, and adding a service-type prefix on top of the store prefix is an optional enhancement, not something this document recommends by default, since it would special-case repairs against the one identity scheme every other order type shares.

**Do NOT create a separate repair tracking record — already true, nothing to change.** `JobOrderTrackingController::show()` and `myOrders()`/`myOrderDetail()` already work against any `JobOrder` regardless of type; a repair is retrieved exactly the same way a custom tailoring job is.

## 2. Guest / Customer Tracking — already current, not a gap

**Verified:** `/track/[code]` (guest, no login) and `/account/orders`/`/account/orders/[id]` (registered) both read the same `job_orders` row via `JobOrderTrackingController` — confirmed in `CUSTOMER-WORKFLOW.md` §12. A repair Job Order needs nothing added here; it already flows through the identical dual-path tracking architecture every other order type uses. No duplicate data, no separate repair-tracking table — already the case today, not a target.

## 3. Repair Note — real gap found

**Current, verified against `customerRepairRequest()`'s actual `create()` call:**
```
$validated['garment_description']       →  JobOrder.notes                (generic, shared field)
$validated['pre_existing_damage_notes'] →  JobOrder.custom_order_data.pre_existing_damage_notes
```
The customer's specific repair request ("Replace broken zipper on front pants") is captured today as `garment_description` and stored in the **generic `notes` column** — the same column `AppointmentController::complete()` elsewhere in this codebase already appends staff-authored text to (e.g. `"[Fitting Notes — Oct 2] ..."` gets concatenated onto a `JobOrder.notes` value). Nothing in `customerRepairRequest`/`update()` currently appends staff notes onto a repair's `notes` field the same way — but the field is shared infrastructure, not repair-specific, so there is no structural guarantee separating "what the customer originally asked for" from "whatever gets appended here later." This is exactly the risk the requirement names: **"Do NOT mix internal staff notes with the customer's original repair request."**

**Target — smallest fix, no new column:** `custom_order_data` is already the correct, existing mechanism for structured per-service-type data (it already holds `pre_existing_damage_notes`, `repair_items`, `team_roster`, `reference_size` for other order types) — move the customer's repair description into it instead of `notes`:
```
custom_order_data: {
  repair_note: "Replace broken zipper on front pants."     ← NEW key, customer's original request, immutable
  pre_existing_damage_notes: "..."                          ← unchanged, existing field
  repair_items: [...]                                       ← unchanged, existing field
}
```
`notes` stays free for whatever staff/operational annotation gets appended over the job's life (exactly as it already works for every other order type) — `repair_note` inside `custom_order_data` is written once, at creation, by the customer, and never touched again. This is a request-mapping change in `customerRepairRequest()`, not a schema change — `custom_order_data` is already a JSON column.

**Visibility, already correct today and unaffected by this fix:** the customer sees it (their own submission, echoed back), staff/owner see it (full `JobOrder` access), and nothing currently strips it from any of the existing read paths — moving it from `notes` to `custom_order_data.repair_note` doesn't change who can see it, only where it lives and whether it stays pristine.

## 4. Repair Record — field-by-field against what exists

| Field the requirement names | Current | Verdict |
|---|---|---|
| Job Order Number | `order_number` | Current |
| Tracking Code | `tracking_code` | Current (Section 1) |
| Customer | `customer_id` | Current |
| Store | `store_id` | Current |
| Repair Service | `service_id` (must carry `Service::TYPE_ALTERATION_REPAIR`) | Current |
| Repair Note | `notes` today, target `custom_order_data.repair_note` | Target fix (Section 3) |
| Current Repair Stage | `status` — but see Section 5, the real gap | **Target — needs a repair-specific stage set** |
| Estimated Ready Time | `due_date` | **Gap — date only, no time-of-day** (Section 6) |
| Actual Start Time | Not tracked per-repair distinctly | See Section 6 |
| Actual Completion Time | Not tracked per-repair distinctly | See Section 6 |
| Payment / Balance | `total_amount`, `balance`, `payment_status`, `payments` | Current — same architecture as every other order (`PAYMENT-WORKFLOW.md`) |
| Progress History | `job_order_staff.assigned_at` per stage (best-effort) | Current, same mechanism `myOrderDetail()` already uses for every order type |

## 5. The real gap: repairs run through the full custom-tailoring pipeline

**Verified:** `JobOrder::STATUSES` has exactly one conditional branch — the Bulk Order override (`mass_cutting_printing` replaces `pattern_making`, via `JobOrder::isBulkOrder()`). There is **no equivalent branch for repairs.** A repair Job Order today progresses through the identical 10-stage pipeline a from-scratch custom Barong Tagalog would: `pending → design → pattern_making → cutting → sewing → ready_for_fitting → final_adjustments → qc_ironing → ready_for_pickup → completed`. Confirmed against the frontend too — `jobHelpers.tsx` only maps `alteration_repair` to a *category label* ("Alterations & Repair"), not to an alternate stage set; no repair-specific stage relabeling exists anywhere in the client.

This is why the target flow in the request ("Received → Queued → In Repair → QC/Final Check → Ready for Pickup → Completed") doesn't match what the system does today — a real zipper replacement has no "design" or "pattern_making" or "fitting" step, but the schema currently offers no shorter path.

**Target — mirrors the Bulk Order precedent exactly, same shape, new small conditional:**
```
JobOrder::isRepairOnly(): bool {
  return $this->garment_category === 'alteration_repair'
      || $this->service?->hasType(Service::TYPE_ALTERATION_REPAIR);
}
```
When true, the customer-facing (and, optionally, staff-facing) stage set collapses to:
```
pending → queued → in_repair → qc_check → ready_for_pickup → completed
```
This can be built the same low-risk way the Bulk override already is — `job_orders.status` is a plain string column (Section 6 of `EMERGENCY-WORKFLOW.md` already confirmed this for the same reasons), so adding `queued`/`in_repair`/`qc_check` as new string values costs no schema migration. The 50%-down-payment gate (`JobOrder::STAGES_REQUIRING_DOWNPAYMENT`) and the completion-balance rule need the new values added to their arrays — a small, explicit decision (does a repair need a 50% gate at all, given most repairs are small-ticket and same-day? Recommend: yes, for consistency, but this is a business-rule call, not a technical constraint).

**Not proposed:** a second `JobOrder` model, a separate `Repair` table, or forking the pipeline logic — this is the same single-table, single-status-column mechanism every other order type already uses, extended the same way Bulk already was.

## 6. The other real gap: no time-of-day ETA

**Verified:** `JobOrder.due_date` is cast `date:Y-m-d` — a pure calendar date, no time component, by design (the model's own comment explains this was deliberate, to stop a bare `'date'` cast from silently writing a spurious `00:00:00`). This works fine for a multi-day custom tailoring job ("due Friday") but cannot represent "ready at 3:00 PM today," which is exactly the granularity a same-day repair needs (`"Balik after 2 hours"` → `Estimated Ready = 2:00 PM`).

**Target — smallest fix:** add one nullable datetime column, `JobOrder.estimated_ready_at`, used *in addition to* `due_date` — not replacing it. `due_date` stays the calendar-day due date every order type already has; `estimated_ready_at` is the optional time-of-day refinement repairs (and any same-day rush job) actually need. Staff updates it the same way any other field is updated today (`JobOrderController::update()`); the customer sees it via the same `/track/[code]`/`/account/orders/[id]` response, added as one more field alongside `due_date`.

**Actual Start / Actual Completion Time:** rather than two more new columns, reuse the existing best-effort stage-timestamp mechanism (`buildStageTimestamps()`, already documented in `CUSTOMER-WORKFLOW.md` §12) — under the repair pipeline (Section 5), "Actual Start" is the `assigned_at` of the `in_repair` stage and "Actual Completion" is the `assigned_at` of `qc_check` (or a `completed_at` timestamp on that same pivot row once it's marked done) — no new fields needed beyond what Section 5 already introduces.

## 7. Repair Flow — target, reconciled against Sections 1–6

```
Customer: Search/Store → Select Repair Service → Enter Repair Note (→ custom_order_data.repair_note, Section 3)
   ↓
Submit  →  POST /stores/{slug}/repair-requests  (JobOrderController::customerRepairRequest — unchanged endpoint)
   ↓
JobOrder created, status = pending, tracking_code auto-generated (Section 1 — already true today)
   ↓
Customer receives tracking code (in the create response, same as today)
   ↓
Customer brings garment / visits shop
   ↓
Staff inspects, confirms repair requirements  →  status: pending → queued  (Section 5, target pipeline)
   ↓
in_repair  →  estimated_ready_at set/updated as needed (Section 6)
   ↓
qc_check
   ↓
ready_for_pickup  →  customer notified (existing notification mechanism, unchanged)
   ↓
Pickup  →  balance settled if needed (existing payment architecture, unchanged — PAYMENT-WORKFLOW.md)
   ↓
completed
```

## 8. Source of Truth

Unchanged from `CUSTOMER-WORKFLOW.md`'s governing rule, restated for repair specifically: the `JobOrder` row is the only source of truth for repair status, stage, `estimated_ready_at`, payment/balance, `repair_note`, tracking code, and progress history. A staff member telling a customer "balik after 2 hours" is not itself a system fact — it becomes one only once written to `estimated_ready_at`; if the repair runs long, updating that same field (not a verbal revision) is what the customer's tracking page reflects on next load.

## 9. Customer Tracking Display — data already available, this is a frontend-only addition

Every field the requirement's example screen needs is already returned by the existing `/track/[code]` response shape (`CUSTOMER-WORKFLOW.md` §12) plus the two Section 6 additions:
```
tracking_code        ← already returned
order_number          ← already returned
service_name           ← already returned
custom_order_data.repair_note  ← Section 3 addition
status (mapped to repair-pipeline label, Section 5)  ← target
estimated_ready_at      ← Section 6 addition
updated_at (as "Last Updated")  ← already on the row, just not currently surfaced in the response — add it
payment_status / balance  ← already returned, shown "where appropriate" per the existing pattern
```
No new endpoint — `JobOrderTrackingController::show()`/`myOrderDetail()` gain two additional keys in their existing response array.

## 10. Summary — what's actually new here

```
ALREADY CURRENT, NO CHANGE:
  - Unique tracking code generation, on repair creation, by the existing mechanism
  - Guest (/track/[code]) and registered (/account/orders) tracking, same JobOrder row
  - Payment/balance architecture
  - Progress-history mechanism (job_order_staff.assigned_at)

REAL GAPS, MINIMAL TARGET FIX:
  1. repair_note mixed into generic `notes` → move into custom_order_data.repair_note
  2. No repair-specific pipeline → add isRepairOnly() + a short status set, same pattern as Bulk's override
  3. No time-of-day ETA → add JobOrder.estimated_ready_at (nullable datetime), alongside the existing due_date
  4. Tracking display needs 2 more response keys (repair_note, estimated_ready_at) + updated_at — no new endpoint
```
