# SUTURA Staff Workflow

> Built entirely from `docs/CUSTOMER-WORKFLOW.md`, `docs/CUSTOMER-JOURNEY-TARGET.md`, `docs/PAYMENT-WORKFLOW.md`, `docs/EMERGENCY-WORKFLOW.md`, `docs/REPAIR-WORKFLOW.md`, and `docs/PRACTICAL-SITUATIONS.md` — no new audit, no re-derivation of the 30 situations. This document is Staff's own slice of those six: what Staff physically does at the shop, and exactly what that action writes into SUTURA. **Current** claims trace to a specific route/controller already verified in the prior documents; **Target** items are decisions those documents already made, restated here from Staff's vantage point. No code was modified.

---

## 0. Staff Role Definition

**Current, verified:** `staff` is a `User` + `Role` + `StaffProfile` (`role`: head_tailor/tailor/cutter/seamstress/etc.). Route access (`routes/api.php`) puts Staff in the **Shared Access** group (`role:store_owner,branch_manager,staff`) for: measurements (full CRUD), job orders (index/show/**update**/progress-photos/materials/roster-toggle), appointments (index/**update**, but not create/destroy), catalog orders (create/update), customers (CRUD), and read-only services/staff/branches/subscription. Staff is **excluded** from: creating a JobOrder from scratch (`POST /jobs` is Owner/Branch-Manager only), creating or cancelling an Appointment, assigning staff to a job, applying discounts, rejecting orders/payments, recording a JobOrder payment (`pay()`), deleting/restoring anything, analytics, audit logs, and every Admin action.

**One precise, non-obvious current fact worth stating plainly:** `JobOrderController::update()` — the endpoint Staff uses to progress a job's `status` — has **no in-code restriction on which status value Staff may set**, unlike `AppointmentController::update()`, which explicitly limits Staff to two transitions (`in_progress`, `completed`). Staff can technically set any `JobOrder::STATUSES` value through this one shared endpoint, including `cancelled`/`rejected`/`on_hold`. In practice, `rejectOrder()` (Owner/Branch-Manager only) is the real, richer rejection path — but nothing today stops Staff from setting `status='rejected'` directly via `update()` and bypassing it. This isn't treated as a bug to fix in this document; it's flagged so Staff Module implementation doesn't assume a restriction that doesn't actually exist in code.

## 1. Customer Arrival / Check-In

```
TRIGGER                Customer physically arrives for a scheduled appointment
STAFF ACTION            [TARGET] Taps "Check In" / "Mark Arrival"
SYSTEM RECORD UPDATE    [TARGET] Appointment.checked_in_at = now() (new nullable timestamp — PRACTICAL-SITUATIONS.md #1)
                        On-time/Late is a DERIVED label (checked_in_at vs scheduled_at), never a stored status value
CUSTOMER/PHYSICAL       Waits to be attended
NEXT STEP               → Section 2 (On-time vs Late) determines what happens next
```

**Current:** no check-in concept exists at all — `Appointment` has no arrival field; Staff moves straight to `in_progress`/`completed` with no arrival record. This entire section is target.

## 2. On-Time vs Late

```
TRIGGER                 Check-in recorded, checked_in_at compared against scheduled_at
STAFF ACTION            None — the label is computed, not chosen
SYSTEM RECORD UPDATE    No new status value; on-time/late stays a presentation label derived from
                        checked_in_at and scheduled_at, never written as its own field
CUSTOMER/PHYSICAL       If late: Staff checks SAME-DAY availability first (Appointment::hasSchedulingConflict,
                        already current) → offers a later same-day slot → only checks another day if none exists
NEXT STEP               Reschedule only if genuinely necessary — a fire rule this document does not relax:
                        "Customer Late does NOT automatically mean reschedule."
```

**Current:** the same-day-then-another-day conflict check itself (`Appointment::hasSchedulingConflict`) already exists and needs no change — only the check-in/late trigger is new (Section 1). **Target:** the decision sequence above, using an existing mechanism.

## 3. Appointment Handling (day-to-day)

```
TRIGGER                 An appointment appears on Staff's list for today (GET /stores/{store}/appointments)
STAFF ACTION            Attends the customer; moves status in_progress → completed once done
SYSTEM RECORD UPDATE    Appointment.status — Staff is restricted to exactly these two transitions
                        (AppointmentController::validateAndEnforceRole, current, verified)
CUSTOMER/PHYSICAL       Receives the scheduled service (consultation/measurement/fitting/alteration/pickup)
NEXT STEP               Completion may require job_order_id already set (fitting/pickup types) — current rule,
                        unchanged; Staff cannot confirm, reschedule, or cancel — those stay Owner/Manager (below)
```

**Current, unchanged.** Confirming a pending request, rescheduling, and store-side cancellation remain Owner/Branch-Manager-only in both current and target — Staff's appointment authority is deliberately narrow.

## 4. Customer Consultation

```
TRIGGER                 Customer arrives for a consultation appointment (no specific catalog design chosen —
                        CUSTOMER-JOURNEY-TARGET.md §3, Path B/C)
STAFF ACTION            Discusses garment/design/fabric/style with the customer; records what was agreed
SYSTEM RECORD UPDATE    Notes captured on the appointment or, once a JobOrder exists, on the job — no new
                        entity; a consultation does not by itself create a JobOrder (manual link, Section 6)
CUSTOMER/PHYSICAL       Describes what they want; may return later for measurement if not taken same-visit
NEXT STEP               → Measurement (Section 5) if required, then → Job Order receiving (Section 6)
```

**Current + Target:** the consultation appointment type already exists (`Appointment::TYPES`); routing "no specific design" customers here is the one target frontend decision already specified in `CUSTOMER-JOURNEY-TARGET.md` §3 — nothing new for Staff to operate beyond attending the appointment (Section 3).

## 5. Measurement

```
TRIGGER                 Customer needs measurements taken (new customer, new garment, or a stale profile)
STAFF ACTION            Physically measures the customer
SYSTEM RECORD UPDATE    POST/PUT /stores/{store}/measurements (MeasurementController) — creates a new
                        Measurement row, or forks a new version of an existing profile (superseded_at set
                        on the old row, version+1 on the new one — never overwritten in place)
CUSTOMER/PHYSICAL       Stands for measurement; can later view the result read-only via /my-measurements
NEXT STEP               → Job Order created/updated, optionally pinning measurement_id to this exact version
```

**Current, unchanged, already well-built** (`CUSTOMER-WORKFLOW.md` §9). Reaffirmed rules this document does not touch: **customer never enters official measurements; only Staff/Owner/Branch Manager record them; editing always creates a new version, never mutates history.**

## 6. Job Order Receiving

```
TRIGGER                 Customer brings a garment/order in physically, OR a customer-submitted online
                        request (repair/made-to-order/bulk) already exists and needs staff attention
STAFF ACTION            Inspects the item, confirms requirements with the customer
SYSTEM RECORD UPDATE    ⚠ Staff CANNOT create a JobOrder from scratch — POST /stores/{store}/jobs is
                        Owner/Branch-Manager only (current, verified against routes/api.php). For a genuine
                        walk-in with no prior online submission, Staff prepares the details; Owner/Branch
                        Manager is the one who actually creates the record.
CUSTOMER/PHYSICAL       Hands over the garment/material; confirms the request in person
NEXT STEP               Once the JobOrder exists (either self-submitted online by the customer, or created
                        by Owner/Manager for a walk-in), Staff can update/progress it via the shared
                        update() endpoint from here on
```

**Current, precise and worth stating plainly:** this is the one place Staff's authority is narrower than might be assumed — "receiving" a walk-in order is physically Staff's job, but *recording* it as a new JobOrder is not currently something Staff can do through the API. Nothing in any prior document proposes changing this; it's simply the accurate current boundary.

## 7. Production Stage Updates

```
TRIGGER                 A job on Staff's list is ready to advance (e.g. cutting done, moving to sewing)
STAFF ACTION            Updates the job's status
SYSTEM RECORD UPDATE    PUT /stores/{store}/jobs/{id} — status moves within JobOrder::STATUSES; server-side
                        50%-downpayment gate blocks entry into a production-committing stage if
                        paidSoFar < 50% of total_amount (PAYMENT-WORKFLOW.md §6, unaffected by this document)
CUSTOMER/PHYSICAL       Sees the updated (collapsed, customer-facing) phase via /account/orders or /track/[code]
                        (CUSTOMER-WORKFLOW.md §12's 6-phase target mapping)
NEXT STEP               Continues through the pipeline; Staff cannot delete the job or reassign who's
                        working on it (Owner/Branch-Manager actions, Section 18)
```

**Current, unchanged** — this is Staff's single most-used action day to day.

## 8. Repair Workflow

```
TRIGGER                 A repair JobOrder exists (customer self-submitted online, or created by Owner/Manager
                        for a walk-in — Section 6)
STAFF ACTION            Physically inspects the garment against the customer's repair_note
SYSTEM RECORD UPDATE    [TARGET] status moves through the repair-specific short pipeline
                        (pending → queued → in_repair → qc_check → ready_for_pickup → completed —
                        REPAIR-WORKFLOW.md §5), not the full 10-stage custom-tailoring pipeline
CUSTOMER/PHYSICAL       Drops off the garment; returns at the estimated ready time
NEXT STEP               → Section 9 (repair_note handling), → Section 10 (ETA)
```

**Current:** tracking code generation already works for repairs, no change (`REPAIR-WORKFLOW.md` §1). **Target:** the short pipeline itself — today a repair runs the identical `design→pattern_making→...` pipeline a full custom garment does, which is the real gap this document inherits unchanged from `REPAIR-WORKFLOW.md` §5.

## 9. Repair Inspection + `repair_note`

```
TRIGGER                 Staff opens a repair job to begin work
STAFF ACTION            Reads the customer's original repair_note ("Replace broken zipper on front pants")
SYSTEM RECORD UPDATE    [TARGET] repair_note lives in custom_order_data.repair_note — written once, by the
                        customer, at submission, and never overwritten by Staff. Any operational commentary
                        Staff needs to add goes in the separate, shared `notes` field instead
                        (REPAIR-WORKFLOW.md §3)
CUSTOMER/PHYSICAL       n/a — this is an internal read
NEXT STEP               → begins the repair, referencing the original request throughout, not a paraphrase
                        of it that drifted after staff edits
```

**Current:** today the customer's repair description is stored in the same generic `notes` field Staff/other actions already append to elsewhere — the mixing risk the source document exists to prevent. **Target:** the `custom_order_data.repair_note` separation. This document does not relax "Customer's repair_note must remain distinct from staff operational notes" — Staff writes to `notes`, never to `repair_note`.

## 10. Repair ETA / Tracking

```
TRIGGER                 Customer asks "how long," or Staff needs to set/update an estimate
STAFF ACTION            Sets or updates the estimated ready time
SYSTEM RECORD UPDATE    [TARGET] JobOrder.estimated_ready_at (new nullable datetime, additive to the
                        existing date-only due_date — REPAIR-WORKFLOW.md §6)
CUSTOMER/PHYSICAL       Checks /track/[code] or /account/orders/[id] for the current estimate — never
                        relies on what was said verbally
NEXT STEP               If the repair runs long, Staff updates estimated_ready_at again — the tracking
                        page reflects the new figure on next load, the verbal promise never was a record
```

**Target, entirely new field** (Section 9 of `REPAIR-WORKFLOW.md`). **Rule preserved exactly:** "Verbal ETA is not the source of truth" — `JobOrder` (this one field, once built) is.

## 11. Customer-Provided Materials

```
TRIGGER                 Customer supplies their own fabric/material for a job (material_source = customer_supplied)
STAFF ACTION            Records description/quantity/condition on receipt
SYSTEM RECORD UPDATE    Current: OrderMaterial exists but only for the store's own material *cost*
                        attribution — not a condition field. Target: JobOrder.customer_material_status
                        (safe/damaged/lost/returned) — same field EMERGENCY-WORKFLOW.md §7 proposes, not
                        emergency-specific; it applies to ordinary receiving too
CUSTOMER/PHYSICAL       Hands over the material; is notified if its status is later updated (e.g. damaged)
NEXT STEP               Owner/Branch Manager decides replacement/compensation if damaged/lost — Staff
                        records the fact only, never a liability or refund decision (EMERGENCY-WORKFLOW.md §7)
```

**Target** — no such condition field exists on any entity today (`PRACTICAL-SITUATIONS.md` #13). Staff's role, once built, is factual recording only.

## 12. Customer Order Changes

```
TRIGGER                 Customer requests a design/material/quantity change mid-order
STAFF ACTION            Reviews the request, discusses feasibility/price impact with the customer
SYSTEM RECORD UPDATE    ⚠ Current gap, verified: UpdateJobOrderRequest does not accept total_amount at all —
                        there is no supported way to change a job's price after creation today
                        (PRACTICAL-SITUATIONS.md #11). Target: total_amount becomes editable, but scoped to
                        OWNER/BRANCH MANAGER only (a money-affecting field, matching the existing pattern
                        that balance/payment_status/discount are already supervisory-only) — Staff does not
                        gain this authority even once the gap is fixed.
CUSTOMER/PHYSICAL       Agrees to the revised scope/price
NEXT STEP               Same JobOrder updated in place — never a duplicate order, per the existing "update,
                        don't recreate" pattern this whole document series follows
```

**Staff's actual role here, once the gap is fixed:** flag the requested change and its price impact (via `notes` or a request to Owner/Manager) — Staff does not execute the `total_amount` change itself, consistent with "Staff does NOT become the payment authority."

## 13. Production Delays

```
TRIGGER                 A job will not meet its due_date / estimated_ready_at
STAFF ACTION            Updates the date, optionally records why
SYSTEM RECORD UPDATE    due_date is already Staff-editable via update() (current, verified — no role
                        restriction on this field in UpdateJobOrderRequest); hold_reason exists if the
                        delay actually pauses the job (status → on_hold) rather than just shifting the date
CUSTOMER/PHYSICAL       Sees the new date on their existing tracking view — no separate delay notification
                        needed beyond what the status/date change already triggers
NEXT STEP               Production continues from wherever it is — a delay alone is not a hold
```

**Current, unchanged** — this already works exactly as needed; no gap.

## 14. Fitting

```
TRIGGER                 Job reaches ready_for_fitting
STAFF ACTION            None required to trigger it — automatic
SYSTEM RECORD UPDATE    ready_for_fitting auto-creates a Fitting appointment (current, verified —
                        JobOrder::STATUSES doc-comment, CUSTOMER-WORKFLOW.md §7.4). A manual follow-up
                        fitting (customer needs another one) is [TARGET] Staff-creatable via the scoped
                        follow-up action (Section 17)
CUSTOMER/PHYSICAL       Returns to the shop for the fitting
NEXT STEP               Staff performs the fitting, records outcome/fitting_notes on completion
                        (AppointmentController::complete — current, already copies fitting_notes onto the
                        linked job's notes)
```

**Current for the automatic case; Target for the manual follow-up case** — both already fully specified upstream.

## 15. Adjustment

```
TRIGGER                 Fitting reveals an issue
STAFF ACTION            Moves the job to final_adjustments
SYSTEM RECORD UPDATE    final_adjustments is the explicit revert target (current, verified doc-comment on
                        JobOrder::STATUSES) — from there the job goes back to sewing for rework, or forward
                        to qc_ironing once resolved. Same JobOrder row throughout.
CUSTOMER/PHYSICAL       May need to return again depending on the adjustment — a follow-up appointment
                        (Section 17) if a physical visit is required
NEXT STEP               → qc_ironing / repair's qc_check (Section 16)
```

**Current, unchanged, already correct.**

## 16. QC

```
TRIGGER                 Job reaches qc_ironing (custom) or qc_check (repair target pipeline, Section 8)
STAFF ACTION            Final inspection
SYSTEM RECORD UPDATE    Pass → ready_for_pickup. Fail → back to sewing/final_adjustments (custom) or
                        in_repair (repair target) — same row, no duplicate JobOrder ever created
                        (current behavior, PRACTICAL-SITUATIONS.md #16, verified)
CUSTOMER/PHYSICAL       No action yet — waiting on the outcome
NEXT STEP               → Ready for Pickup (Section 19) once QC passes
```

**Current, unchanged.**

## 17. Follow-Up Appointments

```
TRIGGER                 Staff/Owner determines the customer needs to physically return (fitting, adjustment,
                        consultation, pickup coordination — anything not covered by an already-scheduled visit)
STAFF ACTION            [TARGET] Creates the appointment directly — a narrow, purpose-built action
                        (date/time/purpose/notes/job_order_id only), NOT the full owner/manager store()
                        form, so Staff never incidentally gains fields like payment method
                        (CUSTOMER-WORKFLOW.md §7.4)
SYSTEM RECORD UPDATE    New row in the same shared appointments table, optionally linked via job_order_id
CUSTOMER/PHYSICAL       Is notified automatically; sees it appear under their account without having
                        created it themselves — "Balik po kayo Friday 2PM," formalized
NEXT STEP               Customer returns at the scheduled time → Section 3 (Appointment Handling)
```

**Current: Owner/Branch-Manager-only** to create an internal appointment at all. **Target: this document's central Staff addition** — the one genuine new authority Staff gains anywhere in this series. **Unchanged in both current and target: the customer never creates this appointment themselves.**

## 18. Staff Reassignment

```
TRIGGER                 Assigned staff becomes unavailable mid-job
STAFF ACTION            n/a — this is an Owner/Branch-Manager action, not Staff's own
SYSTEM RECORD UPDATE    POST /stores/{store}/jobs/{id}/staff (assignStaff, owner/manager only, current).
                        Verified: reassigning the SAME person back preserves their assigned_at/completed_at;
                        reassigning to a DIFFERENT person replaces that stage's pivot row outright — the
                        outgoing assignee's record is not preserved as history today (PRACTICAL-SITUATIONS.md
                        #20, minor gap). [TARGET] close out the old pivot row instead of deleting it, so a
                        genuine handoff leaves both people's involvement visible.
CUSTOMER/PHYSICAL       No visible effect on the customer — the JobOrder itself is untouched either way
NEXT STEP               New staff member continues the job from its current status — never reset
```

**Current, with one verified minor gap; Owner/Branch-Manager action, not Staff's.** Included here because Staff is the subject of the reassignment, not its actor.

## 19. Ready for Pickup

```
TRIGGER                 Job/repair reaches its final QC pass
STAFF ACTION            Moves status → ready_for_pickup
SYSTEM RECORD UPDATE    ready_for_pickup_at stamped automatically (current, verified); completion photo
                        optional, never a hard gate (an explicit prior reversal, per the codebase's own
                        history — unrelated to this document, unchanged)
CUSTOMER/PHYSICAL       Notified automatically; returns to the shop when ready
NEXT STEP               → Customer Pickup (Section 20)
```

**Current, unchanged.**

## 20. Customer Pickup

```
TRIGGER                 Customer arrives to claim the garment
STAFF ACTION            Verifies the garment matches the order; checks displayed balance (read-only for Staff)
SYSTEM RECORD UPDATE    If balance > 0: ⚠ Staff cannot record the payment — pay() is Owner/Branch-Manager
                        only, current, and stays that way under the PAYMENT-WORKFLOW.md target (single-step
                        Owner/Manager capture replaces even Staff's current Appointment/CatalogOrder
                        verify-payment authority — Staff's payment role only shrinks, never grows).
                        Completion is blocked server-side while balance > 0 ("no balance, no claim").
CUSTOMER/PHYSICAL       Pays the shop directly if a balance remains; shows proof to Owner/Branch Manager
NEXT STEP               Owner/Branch Manager records the payment → balance = 0 → Staff (or Owner/Manager)
                        marks status = completed → garment released
```

**Current + Target, both already fully specified in `PAYMENT-WORKFLOW.md`.** Restated here only to be explicit: **Staff is never the one who takes the customer's final payment**, at pickup or anywhere else.

## 21. Emergency Handling

```
TRIGGER                 An incident occurs (fire or otherwise) affecting the shop or its production
STAFF ACTION            Reports the situation to Owner/Branch Manager; continues normal duties on anything
                        genuinely unaffected once scope is determined
SYSTEM RECORD UPDATE    ⚠ Staff does not create the Incident record, does not determine affected_scope, and
                        does not decide which JobOrders/appointments are affected — those are explicitly
                        Owner/Branch-Manager judgment calls (EMERGENCY-WORKFLOW.md §5, §12), not something
                        the system infers or Staff decides unilaterally. Staff also does not assess
                        customer-material condition after an incident — EMERGENCY-WORKFLOW.md §7 names this
                        as an Owner/Manager evaluation, not a Staff one.
CUSTOMER/PHYSICAL       Unaffected customers continue as normal (production-only emergency does NOT close
                        the store); affected customers are notified per EMERGENCY-WORKFLOW.md §10
NEXT STEP               Staff resumes affected jobs from their preserved previous_status once Owner/Manager
                        marks the incident resolved (EMERGENCY-WORKFLOW.md §13) — never from Pending
```

**Current: no Incident entity exists at all.** **Target, entirely Owner/Admin-directed:** Staff's role during an emergency is executional (keep working on what's unaffected, physically assist with recovery) rather than decisional. **Explicitly preserved, unchanged:** existing payments, measurements, materials, and order history are never touched by an emergency — this was already true by construction before this document and remains so.

## 22. Customer Notifications

```
TRIGGER                 Any Staff action that changes customer-visible state (status update, measurement
                        recorded, appointment completed, follow-up appointment created)
STAFF ACTION            None beyond the action itself — Staff never manually composes or sends a notification
SYSTEM RECORD UPDATE    The existing Notification classes fire automatically off the same actions Staff
                        already performs in Sections 3–20 (current, comprehensive, reusable — no gap)
CUSTOMER/PHYSICAL       Receives the notification through the existing in-app/email channel
NEXT STEP               n/a — this is a side effect of Staff's other actions, not a separate workflow
```

**Current, unchanged.** Two new message bodies are proposed in `EMERGENCY-WORKFLOW.md` §10 (order-on-hold, store-closed) — same delivery mechanism, not a new one.

## 23. Staff vs. Owner/Branch Manager Responsibilities

| Action                                               | Staff                                                     | Owner/Branch Manager                                             |
| ---------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Check in / mark appointment arrival                  | ✓ (target)                                               | ✓                                                               |
| Confirm / reschedule / cancel an appointment         | ✗                                                        | ✓                                                               |
| Create an appointment (internal)                     | ✗ current → ✓**scoped, follow-up only** (target) | ✓ (full authority, both)                                        |
| Progress appointment status (in_progress→completed) | ✓                                                        | ✓                                                               |
| Record / version measurements                        | ✓                                                        | ✓                                                               |
| Create a JobOrder from scratch                       | ✗                                                        | ✓                                                               |
| Progress a JobOrder's production status              | ✓                                                        | ✓                                                               |
| Assign staff to a production stage                   | ✗                                                        | ✓                                                               |
| Add progress photos / materials / roster toggles     | ✓                                                        | ✓                                                               |
| Change`total_amount` (once the gap is fixed)       | ✗                                                        | ✓                                                               |
| Record a JobOrder payment                            | ✗                                                        | ✓                                                               |
| Verify Appointment/CatalogOrder payment              | ✓ current → ✗ (target, once single-step capture ships) | ✓                                                               |
| Apply a discount / reject a payment or order         | ✗                                                        | ✓                                                               |
| Set`customer_material_status` (target)             | ✓                                                        | ✓                                                               |
| Create an Incident / determine emergency scope       | ✗                                                        | ✓                                                               |
| Assess material condition after an incident          | ✗                                                        | ✓                                                               |
| Approve Emergency Subscription Hold                  | ✗                                                        | ✗ —**Admin only**                                        |
| Approve store registration                           | ✗                                                        | ✗ —**Admin only**                                        |
| Own/manage customer accounts, roles, or subscription | ✗                                                        | ✗ for subscription tier changes; ✓ for day-to-day customer CRM |

---

## Inherited Rules — restated, not redefined

Every rule listed in the phase prompt that produced this document is already satisfied by the sections above, not newly invented here: Customer Late never auto-reschedules (§2); same-day availability is checked before another day (§2); Appointment is a scheduled physical visit, not a mandatory step (§3–4, §17); Staff gains only scoped follow-up-appointment creation, never full booking authority (§17); Customer never creates a follow-up appointment or enters official measurements (§5, §17); Repair reuses the same JobOrder/tracking-code architecture with its own short pipeline (§8–10); JobOrder is the source of truth, verbal ETA is not (§10); `repair_note` stays distinct from staff operational notes (§9); Staff does not own accounts, control subscriptions, approve Emergency Hold, or become a payment authority (§0, §12, §20–21, §23); emergency scope is determined before anything else, and a production-only emergency never closes the store (§21); existing payments/measurements/materials/history are preserved through both a hold and an emergency (§21); staff reassignment preserves history in the target model (§18); and order price changes follow the verified Situation #11 rule exactly — a real current gap, with the fix scoped to Owner/Branch Manager, not Staff (§12).
