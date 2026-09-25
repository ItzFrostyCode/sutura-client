
# SUTURA Emergency / Fire Workflow

> Not an audit of the whole system — a scoped inspection of exactly the entities an emergency workflow touches (`Store`, `StoreBranch`, `StoreSpecialHour`, `JobOrder`, `OrderMaterial`, `Appointment`, `Payment`, `StoreSubscription`), followed by a target workflow built from the business rules supplied. As with `CUSTOMER-WORKFLOW.md`/`PAYMENT-WORKFLOW.md`, **Current** claims trace to a specific model/controller/migration; **Target** items are decisions to build, not reports of what exists. No code was modified.

---

## 1. Purpose

Define a workflow where an emergency's *scope* — not its mere existence — determines what happens to the store, its orders, its appointments, and its subscription. A production-area fire must not force a store closure the customer-facing side never needed; a store-wide fire must not silently continue billing a shop that cannot operate. The system already has more of the needed primitives than expected (Section 14) — the target workflow (Section 15) is mostly a matter of connecting them, plus one genuinely new, deliberately small record.

## 2. Emergency Incident

**Current:** no such entity exists. A repository-wide search for "emergency," "incident," and "disaster" across `app/`, `database/migrations/`, and `routes/` returns nothing relevant.

**Target:** a single new record, Owner/Branch Manager-created:

```
Incident
- id
- store_id
- incident_type        (free text or small enum — "fire" and others, not enumerated exhaustively here)
- occurred_at
- affected_scope        ← the important field (Section 3)
- description
- evidence_path         (nullable — reuses the existing upload pipeline, not a new one)
- created_by
- resolved_at           (nullable — set on recovery, Section 13)
```

This is the one new table this document proposes. Everything else below reuses existing fields.

## 3. Emergency Scope

**Target — four values, no more:**

| Scope                       | Meaning                                                             | Cascades to                                                                                           |
| --------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `store_wide`              | The whole establishment can't operate                               | Store visibility, all open orders, all upcoming appointments, subscription (Section 11)               |
| `production_area`         | Workshop/production disrupted; storefront safe                      | Only the affected`JobOrder`s and appointments tied to that production work                          |
| `specific_area_operation` | A narrower slice than "production" — e.g. one machine, one process | Same cascade shape as`production_area`, just a smaller affected set — no separate mechanism needed |
| `other`                   | Doesn't fit the above                                               | Owner manually decides scope-by-scope; no automatic cascade                                           |

`production_area` and `specific_area_operation` share identical downstream logic (Sections 5–7) — the distinction is descriptive (what the incident record says happened), not two different code paths.

## 4. Store-Wide Emergency

**Target:**

```
Owner/Manager creates Incident, scope = store_wide
   ↓
Store: made temporarily unavailable to new customers (Section 14 — reuses StoreSpecialHour, no new field)
   ↓
Affected: all open JobOrders → on_hold (Section 6); all upcoming Appointments → cancelled/reschedule-needed (Section 9)
   ↓
Payments, measurements, order history, customer-supplied materials: untouched (Section 8 — already true by construction)
   ↓
Subscription MAY enter Emergency Hold — only after Admin review (Section 11)
```

## 5. Production-Only Emergency

**Target:**

```
Owner/Manager creates Incident, scope = production_area (or specific_area_operation)
   ↓
Store: stays exactly as it is — status unchanged, visibility unchanged, subscription unchanged
   ↓
Owner/Manager identifies which specific JobOrders are actually affected (Section 6) — not all of them
   ↓
Only those JobOrders → on_hold; only appointments tied to the affected production work are touched (Section 9)
   ↓
Everything else — browsing, unaffected orders, consultations, pickups that don't depend on the damaged area — continues normally
```

The critical design point: **nothing here is automatic beyond the incident record existing.** The Owner/Branch Manager decides which orders are affected — the system does not infer it from `garment_category` or any other heuristic, because a real fire's actual blast radius isn't something the schema can guess correctly.

## 6. Affected Job Orders

**Current — this is the load-bearing finding of the whole document.** `JobOrder::STATUSES` already includes `on_hold`, and the model already has a real, working hold mechanism:

```php
// JobOrderController::update() — already shipping, not proposed
if ($jobOrder->status === 'on_hold' && $oldStatus !== 'on_hold') {
    $jobOrder->forceFill(['held_at' => now()])->save();
} elseif ($oldStatus === 'on_hold' && $jobOrder->status !== 'on_hold' && $jobOrder->held_at) {
    $jobOrder->forceFill(['held_at' => null])->save();
}
```

`hold_reason` (free text) and `held_at` (timestamp, auto-managed) already exist as real columns. Setting a job to `on_hold` **already preserves everything else on the row untouched** — `total_amount`, `balance`, `payment_status`, `due_date`, `measurement_id`, `custom_order_data`, progress photos — because entering `on_hold` is just one field changing on the same row; nothing about it touches any other column. **Nothing needs to change to satisfy "preserve total amount / paid / balance / due date / measurements / history" — that's already true today.**

**The one real gap:** there is no `previous_status` field. Today, going `sewing → on_hold` records *that* the job is held, but not *what it was doing before*. Resuming requires a human to remember and manually re-select `sewing` from the status dropdown — there's no system memory of it. This is exactly the "do NOT reset to Pending" risk named in the requirements: nothing resets it *automatically* today either, but nothing *restores* it automatically, since there's nowhere to restore it *from*.

**Target — the fix is one nullable column:**

```
JobOrder.previous_status  (nullable string, same free-string type as status already is)

Entering on_hold:  previous_status = current status (captured once, only if not already held)
Leaving on_hold:   status = previous_status ; previous_status = null
```

`job_orders.status` is already a plain `string(30)` column (converted from a DB enum specifically so new values wouldn't need migrations — confirmed in `2026_07_09_171131_convert_enum_columns_to_strings_for_role_and_status.php`), so adding the value `on_hold` cost nothing structurally, and `previous_status` costs exactly one nullable string column — no new table, no redesign of the pipeline.

**Preserved, not duplicated, not deleted:** the same `JobOrder` row throughout. No new "emergency job order" record, no soft-delete-and-recreate — this is already how `on_hold` works today, and the target changes nothing about that guarantee.

## 7. Customer-Provided Materials

**Current:** `JobOrder.material_source` already distinguishes `store_supplied` from `customer_supplied` (`JobOrder::MATERIAL_SOURCES`) — this is the correct existing anchor for "does this job even have customer material to assess." A separate model, `OrderMaterial`, exists but tracks something different: per-order fabric/trim *consumption cost attribution* (`material_name`, `quantity_used`, `unit_cost`) for the store's own materials — explicitly documented in its own source as "NOT an inventory ledger." It has no condition/safety field, and repurposing it for "is the customer's own fabric safe" would conflate two unrelated concepts.

**Target — one nullable field, on `JobOrder` directly, not a new table:**

```
JobOrder.customer_material_status  (nullable string: safe | damaged | lost | returned)
— only ever meaningful when material_source = 'customer_supplied'
— set by Owner/Branch Manager after physically assessing the material, never automatically
```

**Explicitly out of scope, per the requirement and consistent with everything else in this system:** the system records the *fact* (safe/damaged/lost/returned) and nothing else. No liability computation, no automatic compensation/refund figure — those stay human decisions, exactly like `JobOrder.rejection_reason`/`cancellation_reason` already record a fact without the system ever computing a consequence from it.

## 8. Payment Handling

**Current — no gap, no change needed.** Verified structurally: `JobOrderController::pay()`, `applyDiscount()`, `rejectPayment()`, `updatePayment()` are entirely separate actions from `update()` (the method that changes `status`). Nothing in the codebase ties a `Payment` row, `balance`, or `payment_status` to the job's production `status` — they are independent columns/tables that happen to live on the same `JobOrder` row. **Setting a job to `on_hold` cannot touch payment data, because no code path connects them.** The business rule — "a fire must never reset or invalidate existing payments" — is already structurally guaranteed by the current architecture, not something this workflow needs to add.

## 9. Appointment Handling

**Current:** `AppointmentController::destroy()` (owner/manager only) already requires a `reason` and supports an optional `block_rebooking` flag — this is the exact per-appointment action a scoped emergency cancellation needs, already built. `StoreSpecialHour` (`is_closed`, `start_date`, `end_date`, `announcement_message`) already exists and is already checked by both `AppointmentController::fallsOnAnnouncedClosure()` and `PublicBookingController::submit()` to **block new bookings** on an announced closed date — but it does not touch appointments that already exist before the closure was announced.

**Gap:** there's no bulk action — cancelling multiple existing appointments today means calling `destroy()` once per appointment.

**Target:**

```
STORE-WIDE   → Owner/Manager cancels/reschedules every upcoming appointment for the store
               (reuses destroy() as-is; a bulk wrapper is a convenience, not a new mechanism)
PRODUCTION-ONLY → Owner/Manager reviews only the appointments actually tied to affected production
               (e.g. a Fitting appointment for a job that's now on_hold) — everything else
               (Consultation, Pickup for unaffected orders) continues untouched, exactly as the
               requirement states: "do not automatically cancel every appointment."
```

No automatic cascade is proposed here either — same reasoning as Section 5: the system doesn't infer which appointments are "affected," Owner/Branch Manager decides, then applies the existing per-appointment cancel action.

## 10. Customer Notifications

**Current:** the notification system is comprehensive and already fires from controller actions on both appointment and job-order status changes (`AppointmentStatusNotification`, and the job-order equivalents) — reusable as-is; no structural gap.

**Target — two new notification bodies, same existing delivery mechanism:**

```
Affected ongoing order:
  "Your order is temporarily on hold due to an emergency affecting the shop's production
   operations. Your payment and order records remain recorded. We will notify you once
   further action is available."

Store-wide closure:
  "Your appointment/order is affected by a temporary store closure due to an emergency.
   We will notify you once operations can resume."

Material status update:
  Customer is told their material's status changed — not the internal incident detail behind it.
```

This is two new `Notification` classes following the exact pattern every other one in the codebase already uses — no new infrastructure.

## 11. Subscription Handling

**Current:** `store_subscriptions.status` is a **real database `ENUM('trial','active','expired','cancelled')`** — unlike `job_orders.status`/`appointments.status`, this column was *not* included in the earlier string-conversion migration, so it's still schema-enforced. `SubscriptionController` has no pause/resume concept at all: `ends_at` is set once, statically, at `subscribe()` time (`now()->addDays($days)`); nothing computes or restores a paused duration anywhere in the codebase.

**This is the one place in the whole document that genuinely needs a schema migration** — every other change proposed here is a nullable column on an already-string-typed column.

**Target:**

```
Active
  ↓ (store-wide emergency, Admin-approved only)
Emergency Hold — remaining validity frozen, emergency days don't consume subscription time
  ↓ (reopening approved)
Active — resumed with the paused days restored
```

**Minimal recommended change:**

1. Convert `store_subscriptions.status` from `ENUM` to a plain `string`, the same way `job_orders.status`/`appointments.status`/`staff_profiles.role` already were — add `emergency_hold` as a value with no further migrations ever needed for future statuses either, matching the codebase's own established precedent.
2. Add one nullable timestamp: `StoreSubscription.emergency_hold_started_at`.
3. On hold: `status = 'emergency_hold'`, stamp `emergency_hold_started_at = now()`.
4. On resume: `heldDays = emergency_hold_started_at→now()`, `ends_at = ends_at->addDays(heldDays)`, `status = 'active'`, clear the timestamp.

No new billing system, no branch-level subscription concept (explicitly not proposed, per the constraint) — this extends the existing single `store_subscriptions` row per store with the smallest possible mechanism to freeze and restore a validity window.

**Explicitly unaffected:** production-only emergencies never touch this section at all — `Store` stays `Active`, `StoreSubscription` stays `active`, nothing here executes.

## 12. Admin Responsibilities

**Current:** `Admin/StoreController::approve()`/`reject()` already establishes the exact pattern needed — an admin-gated review-and-decide action on a store-scoped record. No equivalent exists yet for a subscription-hold request or a reopening request.

**Target:**

```
OWNER / BRANCH MANAGER: report the emergency (create Incident), specify scope, manage which
   orders/appointments are affected, assess customer material condition, request reopening.

SYSTEM ADMIN: review a store-wide Incident when a subscription hold is requested, approve/reject
   the Emergency Hold, approve reopening (mirroring the existing Store approve/reject pattern —
   two new, narrow admin actions, not a new admin subsystem).

ADMIN NEVER manually recreates Job Orders, payments, customer records, or measurements — the
system preserves the existing rows throughout; there is nothing for Admin to reconstruct.
```

## 13. Recovery

**Target:**

```
PRODUCTION-ONLY:
  Production area recovered → review affected JobOrders → adjust due dates if needed →
  resolve customer_material_status where set → status: on_hold → previous_status (Section 6) →
  notify affected customers.  Store was Active throughout; nothing to restore there.

STORE-WIDE:
  Owner/Manager requests reopening → Admin approves (if a subscription hold was granted) →
  Store visibility restored (StoreSpecialHour's closed window ended/edited) →
  Subscription: Emergency Hold → Active, validity restored (Section 11) →
  Affected orders reviewed individually — continue / adjust / settle / cancel as applicable,
  never reset to Pending → Incident.resolved_at stamped.
```

## 14. Current Implementation

| Entity                           | Current state                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Incident / Emergency record      | **Does not exist** — confirmed, zero references anywhere in the codebase                                                 |
| `JobOrder.status = 'on_hold'`  | Real, shipping today, with`hold_reason` (free text) and `held_at` (auto-managed timestamp)                                  |
| `JobOrder.previous_status`     | **Does not exist** — the one real functional gap this document found                                                     |
| Payment independence from status | Structurally guaranteed already — no code path connects them                                                                   |
| `JobOrder.material_source`     | Real (`store_supplied`/`customer_supplied`) — correct existing anchor for material questions                               |
| `OrderMaterial`                | Real, but tracks cost attribution, not condition/safety — not reusable for this purpose as-is                                  |
| `Appointment::destroy()`       | Real, reason-required, per-appointment, owner/manager only — no bulk variant                                                   |
| `StoreSpecialHour`             | Real — blocks*new* bookings on an announced closed date; does not touch existing appointments; requires a bounded date range |
| `Store.is_hidden`              | Real, owner-togglable, no cascade to orders/appointments/subscription                                                           |
| `StoreSubscription.status`     | Real**DB enum** (`trial/active/expired/cancelled`) — not yet converted to a free string like other status columns      |
| Subscription pause/resume        | **Does not exist** — `ends_at` is set once and never adjusted afterward                                                |
| Admin approve/reject pattern     | Real (`Admin/StoreController`) — reusable shape, but nothing subscription-hold-specific exists yet                           |
| Notifications                    | Real, comprehensive, reusable delivery mechanism                                                                                |
| Audit logging                    | Real, reusable for incident-driven actions                                                                                      |

## 15. Target Workflow

Exactly the business rules supplied (Sections 2–13 above) — restated as the one governing distinction:

```
EMERGENCY SCOPE  ≠  STORE STATUS  ≠  SUBSCRIPTION STATUS  ≠  ORDER STATUS
```

A store-wide fire moves all four. A production-area fire moves only Order Status, for the specific orders Owner/Branch Manager identifies as actually affected — Store Status and Subscription Status never move at all.

## 16. Exact Gaps

1. No `Incident`/emergency entity exists at all.
2. `JobOrder` has no `previous_status` — `on_hold` can't currently resume to where it left off automatically.
3. No condition/status field for customer-supplied material exists on any entity.
4. No bulk appointment-cancellation action — only per-appointment `destroy()`.
5. `store_subscriptions.status` is still a real DB enum, unlike every other status column in the system.
6. No subscription pause/resume mechanism — `ends_at` is static.
7. No Admin action for reviewing/approving a subscription hold or an emergency reopening.

**Not gaps — verified already correct, no change needed:** payment/measurement/order-history preservation under `on_hold` (Section 8); `on_hold` already not resetting other fields on the row (Section 6); the existing `StoreSpecialHour`/`is_hidden`/notification/audit-log infrastructure, all directly reusable.

## 17. Minimal Recommended Changes

One new table, three new nullable columns, one column-type conversion, two new narrow Admin actions, two new Notification classes. Nothing else.

```
NEW TABLE
  incidents  — store_id, incident_type, occurred_at, affected_scope, description,
               evidence_path (nullable), created_by, resolved_at (nullable)

NEW COLUMNS (nullable, no default-value risk to existing rows)
  job_orders.previous_status            string, nullable
  job_orders.customer_material_status   string, nullable  (safe | damaged | lost | returned)
  store_subscriptions.emergency_hold_started_at   timestamp, nullable

COLUMN TYPE CHANGE
  store_subscriptions.status: ENUM → string, matching the existing precedent set by
  job_orders/appointments/staff_profiles — do this once, add 'emergency_hold' as a value,
  and no future subscription-status addition ever needs a migration again either.

NEW ADMIN ACTIONS (mirroring Admin/StoreController::approve()/reject())
  approve/reject an Emergency Subscription Hold request
  approve a store reopening request

NEW NOTIFICATIONS (same delivery mechanism as every existing one)
  order-on-hold-due-to-emergency
  store-closed-due-to-emergency

REUSED AS-IS, NO CHANGE
  JobOrder.status='on_hold' + hold_reason + held_at
  JobOrder.material_source
  Appointment::destroy() (reason + block_rebooking)
  StoreSpecialHour (customer-facing closed banner + new-booking block)
  Store.is_hidden
  Payment/balance/measurement architecture (already independent of status, by construction)
  Existing notification and audit-log infrastructure
```

No inventory system, no branch-level subscription model, and no additional emergency-specific modules beyond the single `incidents` table above.
