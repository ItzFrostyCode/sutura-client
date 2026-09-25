# SUTURA Practical Situations Reference

> Seed reference for the future Staff Workflow and Owner Workflow documents — every situation below is checked against `CUSTOMER-WORKFLOW.md`, `CUSTOMER-JOURNEY-TARGET.md`, `PAYMENT-WORKFLOW.md`, `EMERGENCY-WORKFLOW.md`, and `REPAIR-WORKFLOW.md` rather than re-derived, plus a handful of situations that needed fresh verification against the code because none of those five documents covered them yet. **Status** column: `CURRENT` = works today, no change needed; `GAP` = verified missing, with the smallest target fix; `COVERED` = already fully specified in a companion doc, referenced rather than repeated here.

---

## A. Appointment Lifecycle (Situations 1–5)

| # | Situation | Current | Target / Gap | Status |
|---|---|---|---|---|
| 1 | Customer Late | **Verified: no such concept exists.** `Appointment` has no `checked_in_at`/late field — only `status` (pending/confirmed/in_progress/completed/cancelled/no_show). | Add a lightweight "Check In" action: staff marks arrival, system compares against `scheduled_at` to label on-time/late (a computed label, not a new status — `status` stays `in_progress`). Late does **not** auto-reschedule — staff checks same-day availability first (`Appointment::hasSchedulingConflict`, already exists), then another day only if needed. | **GAP** — smallest fix: one nullable `checked_in_at` timestamp; on-time/late is derived, not stored |
| 2 | Customer No-Show | `Appointment::TRANSITIONS['confirmed'] = [..., 'no_show']` already exists and is a terminal status. | Nothing to add — staff marks `no_show`, history preserved (soft, same row), a new appointment can be created normally afterward (no block unless the store explicitly sets `rebooking_blocked`, which no-show doesn't touch). | **CURRENT** |
| 3 | Customer Reschedule Request | `AppointmentController::update()` already re-checks conflicts/closures on reschedule (`CUSTOMER-WORKFLOW.md` §7.2). | Same-day-first, then another-day-if-needed is a staff *decision process*, not a system rule — the existing conflict check supports either without change. | **CURRENT** |
| 4 | Appointment Follow-Up | Covered in full — `CUSTOMER-JOURNEY-TARGET.md` §4, `CUSTOMER-WORKFLOW.md` §7.4. | Staff gains scoped follow-up-creation authority (target); customer never creates one (current *and* target). | **COVERED** |
| 5 | Measurement Update | Covered in full — `CUSTOMER-WORKFLOW.md` §9 (versioning, immutable history, `JobOrder.measurement_id` pinning). | No change — this is one of the more carefully built parts of the system already. | **CURRENT** |

## B. Order Entry Paths (Situations 6–9)

| # | Situation | Current | Target / Gap | Status |
|---|---|---|---|---|
| 6 | Specific Design / Catalog Order | Made-to-Order path, fully live (`CUSTOMER-WORKFLOW.md` §8). | No change. | **CURRENT** |
| 7 | No Specific Design | Consultation appointment type already exists; no dedicated "general order" entry point. | Route to consultation appointment (`CUSTOMER-JOURNEY-TARGET.md` §3, Path B/C) — frontend routing only. | **COVERED** (target) |
| 8 | Repair Request | Full detail in `REPAIR-WORKFLOW.md`. | Tracking code already works; `repair_note` needs to move out of the shared `notes` field (Section 3 of that doc). | **COVERED** |
| 9 | Repair Tracking / ETA | Full detail in `REPAIR-WORKFLOW.md` §5–6. | Repair-specific pipeline and `estimated_ready_at` are the two real gaps. | **COVERED** |

## C. Production (Situations 10–16)

| # | Situation | Current | Target / Gap | Status |
|---|---|---|---|---|
| 10 | Production Delay | `due_date` is editable via `update()`; `hold_reason` exists for context. | Already supported — staff updates `due_date`, optionally `hold_reason` if pausing outright; customer sees the new date on their existing tracking view. No new field needed for a delay that doesn't involve `on_hold`. | **CURRENT** |
| 11 | Customer Changes Order (price/quantity/material) | **Verified, real gap:** `UpdateJobOrderRequest` does **not** include `total_amount` in its validated fields at all — confirmed by reading the request class directly. `balance`/`payment_status` are also explicitly excluded (by design, per the class's own comment — they may only move through `pay()`). So today there is no supported way to *increase* a job's price after creation; `applyDiscount()` only ever moves `balance` down, `pay()` only ever records money coming in. | Add `total_amount` as an owner/branch-manager-only editable field on `update()`, paired with an explicit rule: changing `total_amount` must adjust `balance` by the same delta in the same request (server-side, inside a locked transaction — the same pattern `pay()`/`applyDiscount()` already use) so the two never drift apart. This is the single most concrete, previously-undocumented gap found across this whole session. | **GAP** |
| 12 | Material Unavailable | No dedicated mechanism — handled via the same `update()` fields (`due_date`, `notes`, `custom_order_data`) plus, if the price changes, situation 11's gap. | No new mechanism needed beyond fixing 11 — this is a manual staff conversation with the customer, recorded in existing fields. | **CURRENT** (contingent on fixing #11) |
| 13 | Customer-Provided Material | `JobOrder.material_source` (`store_supplied`/`customer_supplied`) exists; no condition field. | `customer_material_status` (safe/damaged/lost/returned) — already specified in `EMERGENCY-WORKFLOW.md` §7, but note it is **not emergency-specific**: the same field applies just as well to ordinary receiving/handling of customer-supplied fabric, independent of any incident. | **COVERED** (field is shared with the emergency doc, applies generally) |
| 14 | Fitting Required | `ready_for_fitting` already auto-creates a Fitting appointment (`JobOrder::STATUSES` doc-comment, `CUSTOMER-WORKFLOW.md` §7.4). | No change for the automatic case; a *manual* follow-up fitting (situation 4) uses the target Staff-creation authority. | **CURRENT** + **COVERED** |
| 15 | Fitting No-Show / Missed Visit | Same mechanism as situation 2 (`no_show`), applied to a fitting-type appointment. | Order stays exactly where it was (`on_hold` is not implied by a missed fitting alone) — a new appointment is created the same way situation 4 already describes. No new mechanism. | **CURRENT** |
| 16 | QC Failure / Garment Issue | **Verified current, already correct:** `final_adjustments` is explicitly documented as "the revert target if a fitting/QC reveals issues" (`JobOrder::STATUSES` doc-comment) — from there the job either returns to `sewing` for rework or forward to `qc_ironing` once resolved. Same `JobOrder` row throughout; no duplicate. | No change — this is already exactly the behavior requested. | **CURRENT** |

## D. Pickup & Payment (Situations 17–19)

| # | Situation | Current | Target / Gap | Status |
|---|---|---|---|---|
| 17 | Ready for Pickup | `ready_for_pickup_at` stamped automatically; completion blocked while `balance > 0` (`PAYMENT-WORKFLOW.md` §6). | No change. | **CURRENT** |
| 18 | Fully Paid Before Pickup | `balance = 0` already skips any further payment prompt — nothing in `pay()` can be called against a zero balance without failing the "exceeds remaining balance" check. | No change. | **CURRENT** |
| 19 | Remaining Balance | Owner/Branch Manager records final payment via `pay()`, unchanged formula. | No change beyond the target payment-capture mechanism already specified in `PAYMENT-WORKFLOW.md` Part B. | **COVERED** |

## E. Staff & Planned Closure (Situations 20–21)

| # | Situation | Current | Target / Gap | Status |
|---|---|---|---|---|
| 20 | Staff Unavailable → Reassignment | **Verified, partial gap:** `assignStaff()` already protects completion history *when the same person keeps a stage* (`assigned_at`/`completed_at` carried over rather than wiped, per an explicit fix already in the code). **But reassigning a stage to a *different* staff member replaces that stage's pivot row outright** (`detach()` then re-`attach()`) — there is no separate record that Staff A was ever assigned before Staff B took over; only the current assignment survives. | If "historical staff actions remain recorded" needs to survive a genuine handoff (not just a re-save), the fix is to stop hard-deleting the pivot row on reassignment and instead close out the old row (`completed_at`/an explicit `unassigned_at`) while inserting a new one for the new assignee — a soft-history model instead of the current overwrite. Flagged as a real but minor gap; the existing `JobOrder` itself and its history/payments/measurements are never at risk either way. | **GAP (minor)** |
| 21 | Temporary Planned Closure | `StoreSpecialHour` already exists exactly for this (`EMERGENCY-WORKFLOW.md` §9, §14) — a planned closure needs no `Incident` record at all, correctly. | No change — this is the existing, already-correct non-emergency closure path. | **CURRENT** |

## F. Emergency (Situations 22–28)

Fully specified in `EMERGENCY-WORKFLOW.md` — not repeated here. Cross-reference:

| # | Situation | Reference |
|---|---|---|
| 22 | Production-Only Emergency | `EMERGENCY-WORKFLOW.md` §5 |
| 23 | Store-Wide Emergency | `EMERGENCY-WORKFLOW.md` §4 |
| 24 | Ongoing Order During Emergency | `EMERGENCY-WORKFLOW.md` §6 |
| 25 | Customer Material Damaged/Lost During Emergency | `EMERGENCY-WORKFLOW.md` §7 |
| 26 | Payment During Emergency | `EMERGENCY-WORKFLOW.md` §8 (already structurally guaranteed today — no gap) |
| 27 | Emergency Subscription Hold | `EMERGENCY-WORKFLOW.md` §11 (the one genuine schema migration in this whole series) |
| 28 | Shop Reopening After Emergency | `EMERGENCY-WORKFLOW.md` §13 |

## G. Tracking & History (Situations 29–30)

| # | Situation | Current | Target / Gap | Status |
|---|---|---|---|---|
| 29 | Customer Tracking | `CUSTOMER-WORKFLOW.md` §12, `REPAIR-WORKFLOW.md` §9 for the repair-specific fields. | No duplicate tracking record for any order type, guest or registered. | **COVERED** |
| 30 | Customer History | `CUSTOMER-WORKFLOW.md` §22 — read-aggregate, no new table. | No change. | **COVERED** |

---

## Genuinely New Mechanisms Found in This Pass

Everything else in the 30 situations was either already current or already specified in a prior companion document. Exactly three items are new findings from this session, in order of how load-bearing they are:

1. **No way to change a JobOrder's `total_amount` after creation** (#11) — the single most concrete, previously-undocumented gap. Every "customer changes their mind" situation depends on this.
2. **No repair-specific production pipeline** (#8/9, full detail in `REPAIR-WORKFLOW.md`) — repairs currently run the full 10-stage custom-tailoring pipeline.
3. **No check-in/late tracking on Appointment** (#1) — the system has `no_show` but nothing between "on time" and "didn't show at all."

Plus one minor one: reassigning a job's staff mid-stage overwrites rather than preserves the prior assignee's pivot row (#20).

## Core Practical Rules — confirmed against the code, not just asserted

```
Customer Late      → attendance result first, same-day time adjustment first, day change only if needed
                     (target — #1 is a genuine gap)

Repair             → Repair Note → JobOrder → auto Tracking Code (already true) → real-time tracking
                     → ETA is estimated (estimated_ready_at, target), never guaranteed

Emergency          → scope determined first → store-wide OR production-only → only affected records move
                     (fully specified, EMERGENCY-WORKFLOW.md)

Payment            → customer physically pays → Owner/Branch Manager records it → payment never resets
                     (already structurally guaranteed today, not just a rule to follow)

Appointment        → scheduled physical visit → can happen before/during/after JobOrder →
                     follow-up created by Staff/Owner, never the customer

Website            → Search / Book / Track / Notify / View History
Physical Store     → Consult / Measure / Pay / Fit / Adjust / Produce / Pickup
```

This is the complete, verified basis for Staff Workflow and Owner Workflow definitions — those documents should cite this file and the five it aggregates rather than re-deriving any of the above.
