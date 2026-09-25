# SUTURA Payment Workflow

> Companion to `docs/CUSTOMER-WORKFLOW.md` (frozen source of truth for Customer Module behavior). This document formalizes exactly how payment data moves — who pays, who submits proof, who records/verifies it in the system, and how the system enforces payment-dependent production rules. It does not modify code and does not repeat the Scope & Implementation Audit.
>
> **This document has two parts, kept deliberately separate — do not blend them:**
>
> - **Part A — Current Implementation.** Every claim traces to a specific controller method, model field, or frontend component read directly from the repository. Nothing here is aspirational.
> - **Part B — Target Workflow.** The approved go-forward design (Owner/Branch-Manager-captured receipts, decided 2026-09-24), written as a specification for the next phase — **Customer Module implementation alignment** — not as something already built. Where Part B changes a behavior Part A documents as currently real, Part A is marked `⚠ SUPERSEDED BY PART B` rather than deleted, so the audit trail of what the code does *today* stays intact until the change actually ships.

---

# PART A — CURRENT IMPLEMENTATION (verified against code)

## 1. Purpose

Answer, precisely: **who collects money, who declares a payment happened, who verifies/records it in SUTURA, and how that verified state gates the rest of the workflow** — and specifically, *which exact screen the customer uses to submit payment proof, for each order path.* That last question was the one genuinely unresolved item flagged against the Customer Workflow document, and the answer turns out to differ sharply by path (Section 4).

## 2. The Four Actors — Restated Precisely

| Actor                                             | Role in payment                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer**                                | Pays the shop (cash in person, or GCash/PayMaya/bank transfer) and,**on exactly one path only** (Section 4), self-declares the method/reference/receipt at the moment of submission. On every other path, the customer pays with no system-facing declaration step at all. |
| **Shop (physical)**                         | Actually receives the money — this is a real-world event the system never touches (SUTURA tracks payment status/amounts; it does not move money, by explicit design — see the completed audit's "Explicitly OUT of scope" list).                                               |
| **Owner / Branch Manager**                  | The only roles that can**record a JobOrder payment from scratch** (`pay()`), correct a payment's metadata (`updatePayment()`), reject a payment (`rejectPayment()`), or apply a discount (`applyDiscount()`).                                                      |
| **Owner / Branch Manager / Staff** (shared) | Can**verify** a payment status the customer already self-declared, on Appointments and Catalog Orders only — a lighter, routine front-desk confirmation, not a financial recording action.                                                                                |
| **System**                                  | Derives`payment_status` and `balance` from the recorded amounts, and enforces the 50% down-payment gate purely off `JobOrder.balance` — never off a customer's self-declaration (Section 6).                                                                              |

This refines the original framing in one specific way: **payment authority is not uniformly "Owner/Branch Manager."** It splits by entity and by action:

- **Recording an actual JobOrder payment amount** (the real money ledger) — Owner/Branch Manager only. Staff is excluded.
- **Verifying a self-declared Appointment or CatalogOrder payment** (flipping `pending → paid/rejected`) — Owner, Branch Manager, **and Staff** all have this (`role:store_owner,branch_manager,staff` on both `verifyPayment` routes).

## 3. Payment Data, By Entity

| Entity           | Payment fields it owns                                                                                                        | Who writes them                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Appointment`  | `payment_method`, `payment_reference`, `payment_receipt_path`, `payment_status` (`pending/paid/rejected`)           | Customer sets all four at booking time (self-declared); Owner/Manager/Staff can only flip`payment_status` afterward via `verifyPayment`              |
| `CatalogOrder` | `payment_status`, `payment_method`, `payment_reference`, `payment_receipt_path`                                       | Staff (this entity is never customer-created — see Section 4.5); Owner/Manager/Staff verify via the same`verifyPayment` pattern                       |
| `JobOrder`     | `total_amount`, `balance`, `payment_status` (`unpaid/partial/paid`), `discount_amount`                              | **Never self-declared by the customer on any path.** Owner/Manager only, via `pay()`/`applyDiscount()`/`updatePayment()`/`rejectPayment()` |
| `Payment`      | `job_order_id`, `amount`, `payment_method`, `reference`, `recorded_by`, `receipt_path`, `rejected_at/reason/by` | One row per JobOrder payment event, created exclusively by Owner/Branch Manager (`recorded_by` is always their own user id — never the customer's)    |

`Payment` rows exist **only for `JobOrder`** — Appointments and CatalogOrders carry their payment state as flat fields on the record itself, with no line-item ledger, because they only ever hold a single deposit/fee, not a running balance across multiple installments the way a custom tailoring job does.

## 4. Customer Payment-Proof Submission — Exact Screen, Per Order Path

This is the question the Customer Workflow document left open. Verified directly against the frontend components and their real `api.*` calls, not assumed:

### 4.1 Appointment Booking — the *only* live path with a real payment-proof screen

> ⚠ **SUPERSEDED BY PART B.** The customer-self-upload behavior below is what the code does *today*. The approved go-forward decision (Part B, Section 15) moves receipt capture to Owner/Branch Manager instead — the customer will show proof in person/via chat, not upload it themselves. This subsection stays as-is because it is still an accurate description of the current build; treat it as the "before" state Part B's implementation checklist (Section 20) closes out.

```
SCREEN     /store/[store_id]/book → BookingStep3Review → BookingPaymentSection.tsx
CONDITION  Only rendered at all if the store's fitting_fee > 0 (a store with no
           reservation fee skips this step entirely — booking stays a free request)
INPUT      Method: Cash / GCash / PayMaya / Bank (button group)
           Non-cash → shows the store's own GCash/bank QR code + account details
           (SettingsBasicInfo-configured, not a hardcoded placeholder)
           → customer uploads a screenshot via handleReceiptUpload()
UPLOAD     POST /public/stores/{slug}/upload-receipt  → returns a receipt path
SUBMIT     POST /catalog/{slug}/book  { payment_method, payment_reference, payment_receipt_path, ... }
BACKEND    PublicBookingController::submit() — receipt is HARD-REQUIRED
           server-side for gcash/paymaya (422 if missing); appointment is created
           with payment_status = 'pending'
```

**Found issue — verified, not fixed:** the frontend offers a 4th method, **`bank`**, complete with its own QR/account-number display branch in `BookingPaymentSection.tsx`. The backend's validation, however, is `'payment_method' => ['nullable','string','in:cash,gcash,paymaya']` — `bank` is not in the accepted list. A customer who selects **Bank** and submits will fail server-side validation with a 422. This is a real, existing frontend/backend mismatch on the one screen this whole document is about — flagged here for the record, not silently patched (per standing instruction not to modify code yet).

### 4.2 Repair / Alteration Request — no payment-proof step exists

```
SCREEN     /store/[store_id]/repair-request
INPUT      Garment description, damage notes, pricing selections, reference images
BACKEND    JobOrderController::customerRepairRequest() — validated fields are
           service_id, garment_description, pre_existing_damage_notes, pricing_ids[],
           reference_images[]. No payment_method/reference/receipt field exists
           anywhere in this request or its validation.
RESULT     JobOrder created: payment_status = 'unpaid', balance = total_amount
```

Payment for a repair order happens entirely outside the system (in person, or by whatever channel the shop and customer arrange) and is recorded **afterward**, from scratch, by Owner/Branch Manager via `pay()` (Section 5.2) — there is no customer-facing step to attach here at all.

### 4.3 Made-to-Order — same pattern as Repair Request

```
SCREEN     Catalog item detail page → "Made to Order" action (useCatalogItemDetail.ts::handleMadeToOrder)
BACKEND    POST /stores/{slug}/made-to-order  { catalog_item_id, size? }
RESULT     JobOrder created: payment_status = 'unpaid', balance = total_amount
```

No payment field is collected on this screen either. Identical downstream handling to 4.2.

### 4.4 Bulk Order — backend exists, but there is currently no live customer screen at all

`JobOrderController::customerBulkOrder()` is a real, complete backend endpoint (`POST /stores/{slug}/bulk-orders`) and, like the other two direct-order paths, it has no payment fields in its own contract. However, a direct search of the entire client codebase found:

- No page or hook anywhere calls `/bulk-orders`.
- The one component built for a Team Roster UI, `src/components/shared/BulkRosterEditor.tsx`, is **imported nowhere** — it is orphaned, unused code.
- The Team Roster UI that *is* actually wired up lives inside `JobCreateForm.tsx` (`dashboard/jobs/new`) — the **staff/owner's own** job-creation form, not a customer-facing screen.

**Correction to the completed Scope & Implementation Audit:** that audit's Phase 11 described Bulk Order as "implemented — not a stub, not UI-only." That statement is accurate for the *backend* and for *staff-created* bulk jobs, but not for a customer self-service bulk order — no such screen currently exists to submit one, so there is nothing to document for customer payment-proof submission on this path today. Today, every bulk/team job order in the system is staff-authored from the start via the dashboard, which follows the same no-self-declaration, Owner/Branch-Manager-records-payment pattern as 4.2/4.3.

### 4.5 Ready-to-Wear (`CatalogOrder`) — never a customer-facing creation path

`CatalogOrder` (walk-in/RTW sales) has no customer-facing creation route at all — `POST /stores/{store}/catalog-orders` sits under the shared `store_owner,branch_manager,staff` role group, meaning staff record the sale themselves (typically at the counter), including whatever `payment_receipt_path` they choose to attach. There is no "customer screen" to describe here; it is not a self-service flow.

### 4.6 Summary table

| Path                             | Live customer screen?                              | Payment proof collected from customer?                | How payment eventually gets recorded                                                   |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Appointment booking              | Yes —`/store/[id]/book`                         | Yes (method/reference/receipt), required for non-cash | Self-declared, then Owner/Manager/Staff verify                                         |
| Repair Request                   | Yes —`/store/[id]/repair-request`               | **No**                                          | Owner/Manager records from scratch, post-hoc                                           |
| Made-to-Order                    | Yes — catalog item detail                         | **No**                                          | Owner/Manager records from scratch, post-hoc                                           |
| Bulk Order                       | **No live screen**                           | N/A                                                   | Staff creates the whole job order directly; Owner/Manager records payment the same way |
| Ready-to-Wear (`CatalogOrder`) | **No customer screen** (staff-only creation) | N/A (staff-entered at counter)                        | Owner/Manager/Staff verify the staff-entered declaration                               |

## 5. Two Distinct Authority Patterns

### 5.1 Declare-then-verify (Appointment, CatalogOrder)

```
Customer self-declares payment_method/reference/receipt (Appointment only — Section 4.1)
        ↓
payment_status = 'pending'
        ↓
Owner / Branch Manager / Staff review the receipt and call verifyPayment()
        ↓
payment_status → 'paid' or 'rejected'
        ↓
Customer notified (AppointmentPaymentStatusNotification / CatalogOrderPaymentStatusNotification)
```

This is a lightweight confirm-or-reject action on a single flat status field — no ledger, no amount tracking — which is why Staff is trusted with it alongside Owner/Manager.

### 5.2 Record-from-scratch (JobOrder)

```
Customer pays the shop in person for a JobOrder (no system-facing declaration exists for this entity)
        ↓
Owner / Branch Manager logs it: POST /stores/{store}/jobs/{jobOrder}/pay
        { amount, payment_method?, reference?, notes?, receipt_path? }
        ↓
Server-side, inside a locked DB transaction (JobOrderController::pay):
   - rejects if amount > current balance
   - balance -= amount ; payment_status recalculated ('paid' if balance <= 0, else 'partial')
   - a Payment row is created, recorded_by = the acting Owner/Manager's own id
        ↓
Duplicate-reference fraud check (Section 7) surfaces a non-blocking warning, never a hard block
        ↓
PaymentReceivedNotification → store owner (if someone other than the owner logged it)
        ↓
Customer sees the new balance/payment_status via /account/orders or /track/{code}
```

This is a real financial ledger action — amount-bearing, balance-mutating, audit-relevant — which is why it is restricted to Owner/Branch Manager and excludes Staff, consistent with how discounts, payment rejection, and payment-metadata correction are also Owner/Manager-only (`applyDiscount`, `rejectPayment`, `updatePayment`).

## 6. The 50% Down-Payment Gate — Exact Mechanism

```php
// JobOrderController::update()
$paidSoFar = $totalAmount - $jobOrder->balance;

if (in_array($newStatus, JobOrder::STAGES_REQUIRING_DOWNPAYMENT, true)
    && $totalAmount > 0
    && $paidSoFar < ($totalAmount * 0.5)) {
    → 422 "A 50% downpayment must be collected before production can start on this job."
}
```

This is the precise answer to "how does verified payment information gate production": the check is **pure arithmetic against `JobOrder.balance`** — it has no dependency on `payment_status` as a string, and no dependency on any customer self-declaration, because none exists for JobOrder. `balance` only ever moves when Owner/Branch Manager calls `pay()` or `applyDiscount()`. In other words: **the gate is enforced against money Owner/Branch Manager has actually logged, not against anything the customer submitted or claimed.**

`STAGES_REQUIRING_DOWNPAYMENT` = `pattern_making, mass_cutting_printing, cutting, sewing, ready_for_fitting, final_adjustments, qc_ironing, ready_for_pickup` — `pending` and `design` are exempt (no material is committed yet). A second, related gate exists on completion: `balance > 0` blocks `status → completed` ("no balance, no claim").

## 7. Fraud-Prevention: Duplicate Reference Check

Applies identically across all three real payment surfaces — `JobOrder` payments, `Appointment.payment_reference`, `CatalogOrder.payment_reference` (per the completed audit). On `JobOrderController::pay()`: if the submitted `reference` already appears on another of this store's job orders (and wasn't rejected), the response still succeeds but carries a `warning` string naming the colliding order number. **Non-blocking by design** — a human (Owner/Branch Manager) judges it, since legitimate reference-number collisions genuinely happen with some banks' formats. This is a deliberate "surface facts, don't hard-block" pattern, not an oversight.

## 8. Balance / Discount Arithmetic

Every revenue or "amount collected" figure in the system — analytics, customer detail totals, print receipts — must use:

```
collected = total_amount − balance − discount_amount
```

`applyDiscount()` reduces `balance` directly and adds to `discount_amount`; it never touches `total_amount`. Using `total_amount − balance` alone silently counts a discount as if it were cash collected — this exact bug shipped across ~11 surfaces historically (per the codebase's own ground-truth notes) before being fixed everywhere. Any future payment-related view must use the three-term formula from the start.

## 9. Status Lifecycle Reference

```
Appointment.payment_status   pending → paid | rejected      (declare-then-verify, Section 5.1)
CatalogOrder.payment_status  pending → paid | rejected      (declare-then-verify, Section 5.1)
JobOrder.payment_status      unpaid → partial → paid        (derived automatically from balance, Section 5.2)
JobOrder.balance             total_amount → … → 0           (only Owner/Branch Manager can move it)
Payment.rejected_at          null → timestamp                (Owner/Branch Manager only, via rejectPayment())
```

## 10. Source-of-Truth Matrix — Payment Data

| Data                             | Source of truth                                 | Created by                                  | Updated by                                                         | Read by                                                                                  | Customer access                      |
| -------------------------------- | ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| Appointment payment declaration  | `appointments` (flat fields)                  | Customer, at booking (Section 4.1 only)     | — (immutable once submitted)                                      | Store roles + owning customer                                                            | Submits once; reads own status after |
| Appointment payment verification | `appointments.payment_status`                 | —                                          | Owner / Branch Manager /**Staff**                            | Store roles + owning customer                                                            | Read-only                            |
| JobOrder payment ledger          | `payments` + `job_orders.balance`           | Owner / Branch Manager only                 | Owner / Branch Manager only (`updatePayment`, `rejectPayment`) | Store roles + owning customer (rolled-up balance/status only, never raw`Payment` rows) | Read-only rollup                     |
| CatalogOrder payment             | `catalog_orders` (flat fields)                | Staff (at sale entry — never the customer) | Owner / Branch Manager / Staff (`verifyPayment`)                 | Store roles + owning customer                                                            | Read-only                            |
| Discount                         | `job_orders.discount_amount` + `audit_logs` | Owner / Branch Manager only                 | —                                                                 | Store roles + owning customer (reflected in balance)                                     | Read-only                            |

## 11. What the Customer Actually Sees

- **`/account/appointments`, `/[id]`** — `payment_status`, `payment_method` (their own submitted values, echoed back for confirmation).
- **`/account/orders`, `/[id]`**, **`/track/[code]`** — `total_amount`, `balance`, `payment_status` (`unpaid/partial/paid`) — never the underlying `Payment` rows, `recorded_by`, or any rejection reasoning; those stay internal to the store.
- No screen anywhere shows the customer a running list of individual payments logged against their JobOrder — only the current rolled-up balance and status.

## 12. Found Issues (Documented, Not Fixed)

1. **`bank` payment method is offered on the booking UI but rejected by backend validation** (Section 4.1) — the only concrete, verified defect found while tracing this workflow.
2. **Repair Request and Made-to-Order collect zero payment information from the customer**, despite both creating a real financial obligation (`balance = total_amount`) immediately. This is consistent behavior across both paths, not a one-off gap — whether it should stay this way (payment is always negotiated in person/off-system for direct orders) or gain a declare-step like Appointment's is a product decision for the next phase, not something this document resolves on its own authority.
3. **Bulk Order has no live customer entry point at all** (Section 4.4) — nothing to align on payment-wise for this path until (or unless) a customer-facing screen is built; today it is staff-only from creation onward.

None of the three above are proposed as fixes here — they are named precisely so the next phase (Customer Module implementation alignment) can decide what to do with each deliberately, not by surprise.

## 13. Dependencies for Staff and Owner Workflow Documents

```
Staff Module must consume:
  - verifyPayment() on Appointment and CatalogOrder — Staff has this authority; document it as such,
    don't under-scope Staff's role here the way the informal framing did.
  - Staff does NOT get pay()/applyDiscount()/rejectPayment()/updatePayment() on JobOrder — these stay
    Owner/Branch Manager only in the Staff Module document too.

Owner Module must consume:
  - pay(), applyDiscount(), rejectPayment(), updatePayment() as the exclusive financial-recording layer
    for JobOrder.
  - The 50% down-payment and "no balance, no claim" gates (Section 6) as hard constraints the Owner
    Module's production-stage UI must surface and respect, not re-implement independently.
  - The duplicate-reference warning (Section 7) as a review prompt at the point of logging a payment,
    not a blocking rule.
```

---

# PART B — TARGET WORKFLOW: OWNER/BRANCH-MANAGER-CAPTURED RECEIPTS

> Decision date: 2026-09-24. This is the approved direction to build toward during Customer Module implementation alignment — a specification, not a report of what exists. Everything in this part is written in the imperative/future ("the customer shows," "the owner captures") to keep it visibly distinct from Part A's past-tense, code-verified statements.

## 14. Rationale

The current build (Part A, Section 4.1) asks the *customer* to photograph/screenshot their own receipt and upload it during booking — the only path in the whole system that works this way; every other order path (Sections 4.2–4.5) already has payment recorded entirely by the shop side. The approved change removes that one inconsistent exception: **the customer never uploads anything.** They pay, they show proof (a phone screenshot, a physical receipt) the same way they already would to any human cashier, and the Owner/Branch Manager — who is standing there or reviewing the claim — captures the image and records the transaction. This is a genuine simplification, not just a preference: it collapses Appointment/CatalogOrder's "declare-then-verify" pattern (Part A, Section 5.1) and JobOrder's "record-from-scratch" pattern (Section 5.2) into **one single pattern used everywhere** — Owner/Branch Manager is always the one who captures and records, for every entity, every time.

## 15. Target End-to-End Flow

```
CUSTOMER
   ↓  pays the shop (cash, GCash, PayMaya, bank transfer)
   ↓  shows payment proof — phone screenshot or physical receipt
   ↓  (no upload action, no form, on any screen)
OWNER / BRANCH MANAGER
   ↓  Take Photo OR Attach Image  (captures what the customer showed — a photo of their
   │  screen or receipt, not a file the customer transmitted)
   ↓  fills in: amount, payment method, payment date, reference number
   ↓  Save
PAYMENT RECORD  (Section 16 — expanded schema)
   ↓
payment_status → VERIFIED
   ↓
Balance recalculated  (same arithmetic as Part A, Section 6 — unaffected by this change)
   ↓
Order/Appointment production continues according to the existing payment-dependent rules
   (50% down-payment gate, "no balance no claim" — Part A, Section 6, carries over unchanged)
   ↓
STAFF simply consumes the result — sees whether the order can proceed; performs no payment action itself
   ↓
CUSTOMER sees the updated balance/status on their existing read-only screens (Part A, Section 11 — unchanged)
```

This mirrors — deliberately — the exact shape the user specified: recording *is* verifying under this model (there is no separate "customer declares, staff later confirms" gap to sit in a `pending` state at all). The moment Owner/Branch Manager captures and saves, the record is both recorded and verified in the same action, which is why the status is written as `VERIFIED` rather than the current `paid` — see Section 18 on whether `verified_by`/`verified_at` should ever diverge from `recorded_by`.

## 16. Target Payment Schema

The fields specified, reconciled against what exists today on the `payments` table (Part A, Section 3):

| Field                           | Status                                                                                    | Note                                                                                                                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payment_id`                  | Exists (`id`)                                                                           | —                                                                                                                                                                                                                                                                                           |
| `job_order_id`                | Exists                                                                                    | —                                                                                                                                                                                                                                                                                           |
| `appointment_id`              | **New**                                                                             | Today's`payments` table only ever belongs to a `JobOrder` — Appointments and CatalogOrders carry payment as flat fields with no row at all (Part A, Section 3). Unifying them under one `Payment` ledger means this table needs to be payable by more than one entity type.           |
| `customer_id`                 | **New**                                                                             | Not currently on`payments` — always derivable today via `job_order.customer_id`, but worth storing directly once a `Payment` can belong to more than one entity, so a query for "all payments by this customer" doesn't need to join through whichever parent table happens to apply. |
| `amount`                      | Exists                                                                                    | —                                                                                                                                                                                                                                                                                           |
| `payment_method`              | Exists                                                                                    | —                                                                                                                                                                                                                                                                                           |
| `payment_date`                | **New**                                                                             | Today this is implicit (`created_at`). Worth being explicit and separately editable, since Owner/Manager may be logging a payment collected earlier the same day, or backfilling one.                                                                                                      |
| `reference_number`            | Exists (`reference`)                                                                    | —                                                                                                                                                                                                                                                                                           |
| `receipt_path`                | Exists                                                                                    | —                                                                                                                                                                                                                                                                                           |
| `receipt_filename`            | **New**                                                                             | —                                                                                                                                                                                                                                                                                           |
| `receipt_mime_type`           | **New**                                                                             | —                                                                                                                                                                                                                                                                                           |
| `recorded_by`                 | Exists                                                                                    | Who captured/entered it.                                                                                                                                                                                                                                                                     |
| `verified_by`                 | **New**                                                                             | See Section 18 — only meaningful if recording and verifying are ever split into two separate actions.                                                                                                                                                                                       |
| `verified_at`                 | **New**                                                                             | Same caveat.                                                                                                                                                                                                                                                                                 |
| `status`                      | Exists as`payment_status` derived on the parent, not stored on `Payment` itself today | Under the target model, consider whether`status` belongs on the `Payment` row (per-transaction) in addition to the derived rollup on the parent record — the parent's `payment_status`/`balance` stay the customer-facing summary either way.                                       |
| `created_at` / `updated_at` | Exists                                                                                    | —                                                                                                                                                                                                                                                                                           |

**One open design question this document surfaces rather than resolves:** how `job_order_id`/`appointment_id` coexist on one table. Two honest options:

1. **Two nullable FK columns** (`job_order_id` nullable, `appointment_id` nullable, exactly one populated) — simplest to read, matches the field list as given.
2. **One polymorphic pair** (`payable_type` + `payable_id`) — this codebase already uses exactly this pattern for `AuditLog` (`model_type`/`model_id`), so it wouldn't be a new concept for whoever implements it, and it extends cleanly to `CatalogOrder` (and anything else that ever needs a payment ledger) without adding a third nullable column later.

This document recommends option 2 on precedent grounds (it's the pattern already proven in this exact codebase) but treats the final call as an implementation-phase decision, not something to lock in here.

## 17. Owner/Branch Manager Capture Screen (target)

```
Payment
₱1,500
GCash

[ 📷 Take Photo of Receipt ]     [ 🖼 Attach Receipt ]

Reference No.
[ 123456789 ]

Payment Date
[ Sept 24, 2026 ]

[ Save Payment ]
```

This becomes the **one** payment-entry surface for every entity (JobOrder, Appointment, CatalogOrder) — replacing today's three different shapes (Part A, Sections 4.1 and 5.1–5.2) with a single, consistent capture form. The system stores the photo of what the customer showed (a photo of their phone screen, or of a physical receipt) — not necessarily an original file transmitted by the customer, since under this model the customer never transmits a file at all.

## 18. Recorded-by vs. Verified-by

The field list keeps these separate on purpose, for accountability: `recorded_by` is whoever captured/entered the payment; `verified_by` is whoever confirmed it, *if* verification is ever a distinct second action. Two shapes this can take, both consistent with the field list as given — pick one during implementation:

- **Single-step (matches Section 15's flow as written):** Owner/Branch Manager captures and saves in one action → `recorded_by` and `verified_by` are set to the same user, at the same moment. `status` goes straight to `VERIFIED`. Simplest, matches "the moment Owner/Manager saves it, it's done."
- **Two-step (only worth building if a real need shows up):** e.g., Staff or a junior Branch Manager captures a walk-in payment, and the Owner separately confirms it later. This is *not* implied by anything in the current request — flagged only so the schema (which already separates the two fields) isn't mistaken for a firm decision to build a two-step approval flow. Default to single-step unless a concrete reason to split it emerges.

## 19. Receipt Access — Download, Individual View, and Archive

Retained exactly as specified:

**Individual receipt:**

```
Payment #1042
Sep 24, 2026
₱1,500
GCash

[ View Receipt ]
[ Download Receipt ]
```

**Date-filtered archive:**

```
From: September 1, 2026
To:   September 30, 2026

[Filter]

[ Download Payment Report ]
[ Download Receipt Archive ]
```

**Archive output shape:**

```
SUTURA_Payment_Receipts_Sep_2026.zip
  2026-09-02_Payment-1042.jpg
  2026-09-04_Payment-1047.jpg
  2026-09-15_Payment-1053.jpg
  2026-09-24_Payment-1061.jpg
```

Both the individual view/download and the archive are Owner/Branch Manager-facing (they're the ones who need to reconcile receipts against real bank/GCash statements) — this is not proposed as a customer-facing feature, consistent with Part A, Section 11 ("no screen anywhere shows the customer a running list of individual payments").

## 20. Implementation Gap Checklist (for Customer Module alignment — not done here)

Translating Sections 14–19 into concrete deltas from today's code, for the next phase to work from — **none of this is built by writing this document:**

1. **Schema:** extend `payments` to be payable by `JobOrder` and `Appointment` (and, for consistency, `CatalogOrder`) — via the two-nullable-FK or polymorphic approach (Section 16) — plus add `customer_id`, `payment_date`, `receipt_filename`, `receipt_mime_type`, `verified_by`, `verified_at`.
2. **Appointment/CatalogOrder:** retire the customer-self-declare fields' *write* path (`payment_method`/`payment_reference`/`payment_receipt_path` no longer accepted from `PublicBookingController::submit()` or any customer-facing form) in favor of an Owner/Branch-Manager-side capture action mirroring `JobOrderController::pay()`.
3. **Frontend, customer side:** remove `BookingPaymentSection.tsx`'s upload step from the booking wizard (Part A, Section 4.1) — this also retires the `bank`-payment-method mismatch bug (Part A, Section 4.1's found issue) by construction, since the customer no longer picks a method through that form at all.
4. **Frontend, owner side:** build the single capture screen (Section 17) as the one entry point for logging a payment against any of the three entities, plus the receipt view/download and date-filtered archive/ZIP export (Section 19).
5. **Staff Module:** staff's only remaining relationship to payment is *reading* the resulting `payment_status`/`balance` (Section 15's last two lines) — this removes Staff's current `verifyPayment()` authority on Appointment/CatalogOrder (Part A, Section 2) rather than adding to it, since recording now *is* verifying, done by Owner/Branch Manager in one step.
6. **Down-payment gate:** unaffected — it already reads `JobOrder.balance` (Part A, Section 6), which this change continues to update the same way, just via a unified capture form instead of `pay()`'s bespoke one.

This checklist is the handoff into the next phase (Customer Module implementation alignment) — it is deliberately a list of *deltas*, not a redesign of anything not touched by this decision.
