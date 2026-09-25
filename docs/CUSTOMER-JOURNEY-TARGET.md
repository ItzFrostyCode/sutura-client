# SUTURA Customer Journey — Target Reconciliation

> Third companion document, alongside `docs/CUSTOMER-WORKFLOW.md` (current + target contract) and `docs/PAYMENT-WORKFLOW.md` (current + target payment contract). This document is the detailed reconciliation between the two: it merges the verified current implementation, the approved payment target, and the intended real-world customer journey into one simplified target flow. Approved 2026-09-24 as the foundation for Customer Module implementation alignment, and as what Staff and Owner workflow documents must inherit from rather than re-deriving independently.
>
> As with `PAYMENT-WORKFLOW.md`, every **Current** claim traces to a specific controller/model/component already verified in this codebase. Every **Target** item is a decision to build toward, not a report of what exists.

---

## 1. Why this document exists

`CUSTOMER-WORKFLOW.md` froze what the code does today. `PAYMENT-WORKFLOW.md` froze the payment target. Neither, on its own, described the *end-to-end* customer experience the shop actually wants — a search that leads somewhere real, an appointment model that isn't a forced single first step, a production view the customer can actually read. This document is that reconciliation, and it is the one to update if the target journey itself ever changes — `CUSTOMER-WORKFLOW.md` should only ever gain short pointers into this document, not duplicate it.

## 2. Search, Location, and Map — already current, no change needed

```
Hero Search ("Barong Tagalog")
   ↓  router.push('/search?q=Barong Tagalog')
GET /public/stores?q=...[&lat=&lng=&sort_by=distance][&district=][&specialization=]
   ↓  StoreController::publicIndex — matches store name, specializations,
      services.category/name, catalog_items.name/garment_type/material/description
   ↓
ONE result set
   ├── /search  (list)   — useSearchData.ts
   └── /map     (map)    — useMapPage.ts
      both call the exact same endpoint with the exact same params
```

Confirmed directly: `useSearchData.ts`, `useMapPage.ts`, and `useStoreDirectory.ts` (`/stores`) all call `GET /public/stores`. Distance is a **real server-side Haversine calculation** (`sort_by=distance`, `radius_km`), not a placeholder. Geolocation is opt-in ("Near Me" / browser prompt), not automatic on load — keep it that way; an unprompted location request on load is worse UX than a visible affordance, and nothing in Objectives 3/4 requires automatic triggering.

**No target changes here.** Do not build a second search/recommendation system.

## 3. Shop → Service → Catalog / Consultation

```
SHOP PROFILE
   ↓
Services / Catalog (browse, no login required)
   ↓
CUSTOMER CHOOSES:
   ├── A. Specific catalog item   → context = that CatalogItem
   ├── B. General garment/service → context = the Service only, no specific item
   └── C. Not sure yet            → context = Consultation appointment
```

- **Path A** — current, end-to-end (Made-to-Order, `handleMadeToOrder`).
- **Path C** — current, end-to-end (the `consultation` appointment type already exists in `Appointment::TYPES`).
- **Path B — target.** No dedicated "general order, no design" entry point exists today; `customerRepairRequest`/`customerMadeToOrder` both require a specific `service_id`/`catalog_item_id`. **Resolution: route B and C to the same existing consultation-appointment mechanism** — no new backend entity. This is a frontend routing decision, not a new feature.

## 4. Appointment Model — target: a visit, not a mandatory first step

**Current:** `Appointment` and `JobOrder` are already independent entities (`hasMany`, optional `appointment_id`/`job_order_id` link both ways). The schema already permits **0, 1, or many** appointments against one JobOrder — nothing in the data model forces exactly one.

**Correction — appointments are not born under a Job Order.** An appointment is an independent scheduled-visit record from the moment it's created; a Job Order does not yet exist when the *first* one typically happens. The accurate shape is:

```
CUSTOMER
   ↓
Appointment 1 — Consultation / Measurement   (created first, no Job Order exists yet)
   ↓
Consultation / Measurement happens
   ↓
Job Order created
   ↓
Appointment 1 may then be linked to that Job Order (appointment_id, set at Job Order creation — 7.3 item 4)
   ↓
Additional appointments created afterward, each independently, each optionally linked to the same job:
   ├── Fitting        (may be auto-created when the JobOrder reaches ready_for_fitting)
   ├── Adjustment
   └── Pickup
```

**Rule to carry forward, precisely:** Appointments are independent scheduled-visit records that may optionally be linked to a Job Order — not sub-records that live "under" one. A Job Order may have zero, one, or many linked appointments, created at any point before, during, or after the Job Order exists; the earlier "JOB ORDER #1042 → Appointment 1/2/3/4" framing implied Appointment 1 was created *under* the job, which reverses the actual order of events for the most common case (consultation → job order, not job order → consultation). This is a **presentation/framing correction, not a schema change** — see Section 5's one real backend gap.

**Staff vs. Owner/Branch Manager (this is the one genuine RBAC change in the whole reconciliation):**

| Action                                      | Current                       | Target                                                                 |
| ------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| Create internal/follow-up appointment       | Owner/Branch Manager only     | **+ Staff**, for operational follow-ups only                     |
| Confirm / reschedule / store-side cancel    | Owner/Branch Manager only     | Unchanged — stays supervisory                                         |
| Status transitions (in_progress→completed) | Staff                         | Unchanged                                                              |
| Customer cancels own                        | Customer (no reason required) | Unchanged                                                              |
| Customer creates a follow-up appointment    | Never                         | **Still never** — this stays Staff/Owner-only in the target too |

Verbal-agreement flow this enables:

```
Staff: "Balik po kayo Friday 2PM."  →  Customer agrees verbally
        ↓
Staff or Owner/Branch Manager records the appointment (same shared appointments table)
        ↓
Customer Account shows it automatically; customer is notified
```

**Recommended implementation shape:** add `staff` to a *narrow, purpose-built* route (not the existing `store()` action, which also carries owner-only fields like payment method) — e.g. a "log a follow-up visit" action limited to date/time/purpose/notes/job_order_id, so Staff never incidentally gains fields it shouldn't touch.

## 5. The one real backend gap this reconciliation found

`JobOrderTrackingController::myOrderDetail()` does **not** currently return the JobOrder's linked appointments — verified directly against its response shape (order_number, tracking_code, status, garment_category, catalog_item_name, service_name, is_rush, due_date, total_amount, balance, payment_status, created_at, progress_photos, stage_timestamps, store — no `appointments` key). This is the only thing standing between "the schema already supports multiple appointments per job" and "the customer can actually see them grouped under their job." **Target: add `appointments` to that response.** This is the smallest possible change that unlocks Section 4's target view.

## 6. Measurement → Job Order — unchanged, no redesign

```
REQUEST → [optional] Appointment → [optional] Measurement → JobOrder → Production
```

Preserved exactly per `CUSTOMER-WORKFLOW.md` §6–9: Appointment and JobOrder stay separate; JobOrder never auto-becomes from an Appointment; Measurement stays staff-owned, versioned, immutable-on-edit, optionally pinned per JobOrder. **No entity merge.**

## 7. Payment — the 50% gate is correctly positioned

```
JobOrder created (total_amount established)
   ↓
Customer pays, shows proof — does NOT upload it [target, PAYMENT-WORKFLOW.md Part B]
   ↓
Owner/Branch Manager captures + records the payment
   ↓
balance recalculated
   ↓
paidSoFar ≥ 50% of total_amount?
   ├── NO  → gated production stages stay blocked (JobOrderController::update's existing check)
   └── YES → production may proceed
```

**Explicitly correct, and worth stating plainly:** the JobOrder is created *first*, with its full `total_amount`; the 50% gate is then checked purely against `JobOrder.balance` at the point production tries to advance — **not** "collect 50% before a JobOrder can even exist." The latter would leave no record to attach a pre-order payment to. This matches exactly what the current code already does (`JobOrderController::update`'s arithmetic check, unchanged by this reconciliation) — no change needed here beyond the payment-capture mechanism itself (`PAYMENT-WORKFLOW.md` §20).

At pickup: `balance > 0` → final payment recorded by Owner/Branch Manager → `balance = 0` → claim. `balance = 0` already → claim directly. Both paths unchanged from current behavior.

**Correction — do not let Staff/Owner documents assume "every payment = a JobOrder balance."** The diagram above describes the JobOrder path specifically, because that's where the 50% gate lives. The unified Owner/Branch Manager **capture mechanism** (`PAYMENT-WORKFLOW.md` Part B) is one consistent *action* across three genuinely different payment shapes — it does not collapse them into one data model:

| Entity           | Payment shape                                                                                                                                  | What "recorded" means here                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `JobOrder`     | Running ledger — a`Payment` row per event, `balance` decremented incrementally, can take several partial payments over the job's lifetime | The 50%-gate/completion-balance rules from this section apply*only* here |
| `Appointment`  | Single flat payment declaration (a reservation/fitting fee, one event)                                                                         | No running balance, no multi-payment ledger — verified once, done         |
| `CatalogOrder` | Single flat payment for one RTW sale                                                                                                           | Same single-event shape as Appointment, no ledger                          |

Staff and Owner Module documents must keep these three distinct when they describe "how payment is recorded" — the *screen* Owner/Branch Manager uses may look the same across all three (`PAYMENT-WORKFLOW.md` §17), but the underlying record it writes, and what "payment status" even means, differs by entity. `docs/PAYMENT-WORKFLOW.md` §3 already documents this distinction correctly; this note exists so it doesn't get flattened away when this journey document is summarized elsewhere.

## 8. Production tracking — two levels, not one

**Current:** every internal stage already gets a friendly label (`ordersTypes.ts`, `OrderTrackingView.tsx`) — but the customer still sees the full 10-stage pipeline as separate steps.

**Target — customer-facing collapse (derived from real `JobOrder::STATUSES`, nothing invented):**

| Internal status                                                                    | Customer-facing phase                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------ |
| `pending`                                                                        | Order Received                             |
| `design`, `pattern_making`, `mass_cutting_printing`, `cutting`, `sewing` | In Production                              |
| `ready_for_fitting`, `final_adjustments`                                       | Fitting / Adjustment                       |
| `qc_ironing`                                                                     | Finalizing                                 |
| `ready_for_pickup`                                                               | Ready for Pickup                           |
| `completed`                                                                      | Completed                                  |
| `on_hold`, `cancelled`, `rejected`                                           | Shown as-is — exceptions, never collapsed |

Presentation-layer only. Staff/Owner dashboards keep the full granular pipeline unchanged.

## 9. Path shapes — do not force one universal chain

```
Custom Barong:   Consultation → Measurement → JobOrder → 50% → Production → Fitting → Adjustment → Pickup
Repair:          Repair request → JobOrder → Payment → Repair → Pickup                 (no appointment, no measurement)
Standard Bulk:   Bulk order → Payment → Production → QC → Pickup                       (no fitting, no individual measurement)
Custom Bulk:     Bulk order → optional consultation/sample appointment → Production → Pickup
```

The routing rule stays intentionally simple — **do not build a rules engine**:

```
Specific catalog item?      → use it as context.
No specific item?           → use Service / Consultation as context.
Does the job need a visit?  → Appointment.
Does the job need measurement? → Measurement.
Does the job need fitting?  → Follow-up appointment.
```

That is the entire decision tree. Nothing more sophisticated is required or wanted.

## 10. Customer History — a read view, not a new table

```
CUSTOMER
   ↓
HISTORY (new frontend screen only)
   ├── Appointments    ← GET /my-appointments   (existing)
   ├── Measurements    ← GET /my-measurements   (existing)
   ├── Job Orders      ← GET /my-orders         (existing)
   ├── Payment/balance ← already embedded in the JobOrder/Appointment payloads above
   └── Associated shops← already embedded (store name/slug/logo on each of the above)
```

No backend change, no new table, no duplicated data. The only backend touch anywhere near this is Section 5's `appointments`-on-`myOrderDetail()` addition.

## 11. Bulk Order — one real frontend gap, separate from everything above

`JobOrderController::customerBulkOrder()` is a complete, real backend endpoint. Verified directly that **no frontend page or hook calls it** — `BulkRosterEditor.tsx` is unimported dead code; the only working Team Roster UI lives inside the staff/owner's own `dashboard/jobs/new`. **Target:** build the missing customer-facing screen for the "Standard Bulk" and "Custom Bulk" shapes in Section 9.

**Provisional — do not freeze "zero backend change" for this one.** The endpoint's current validation only covers `catalog_item_id`, `organization_name`, `store_branch_id`, and a `roster[]` of `{name, size}` — enough for the "Standard Bulk" shape. Whether it also covers everything "Custom Bulk" ultimately needs (an optional consultation/sample-approval step, richer per-item custom fields) has **not** been verified against a finished screen design, only against what exists today. Confirm this when the Bulk Customer UI is actually built, rather than assuming the backend is already sufficient — this is the one item in this document not to treat as settled.

## 12. Current vs. Target — consolidated

| Area                                     | Current                                                         | Target                                       | Change type                                                 |
| ---------------------------------------- | --------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| Search / Map / List                      | Real, unified, distance-aware                                   | Same                                         | None                                                        |
| Catalog selection                        | Optional                                                        | Same, explicit routing for "no design"       | Frontend only                                               |
| Appointment as mandatory first step      | Not enforced today either — already optional at the data level | Explicit, customer-visible: 0/1/many per job | Frontend + 1 endpoint field                                 |
| Appointment creator                      | Owner/Branch Manager only                                       | + Staff (scoped)                             | Backend RBAC                                                |
| Job appointments visible on order detail | No                                                              | Yes                                          | Backend field addition                                      |
| Payment capture                          | Customer self-uploads (Appointment only)                        | Owner/Branch Manager captures, all entities  | Schema + new screen (`PAYMENT-WORKFLOW.md` §20)          |
| 50% gate                                 | Correct already (JobOrder-first, gate on balance)               | Unchanged                                    | None                                                        |
| Production tracking (customer)           | Full 10-stage view                                              | Collapsed 6-phase view                       | Frontend only                                               |
| Customer History                         | Split across 3 screens                                          | One aggregate screen                         | Frontend only                                               |
| Bulk Order (customer)                    | No live screen                                                  | Built, following Section 9's two shapes      | Frontend +**provisional** backend confirmation (§11) |

## 13. Inheritance for Staff and Owner Module documents

Neither future document should re-derive any of the above independently — both inherit directly:

```
Staff Module inherits:
  - The target follow-up-appointment authority (Section 4) as its own scheduling capability.
  - No payment-recording authority anywhere (Section 7 / PAYMENT-WORKFLOW.md §20 narrows this further,
    removing Staff's current Appointment/CatalogOrder verify-payment authority once the single-step
    capture model ships).
  - Measurement recording and production-stage updates, unchanged from CUSTOMER-WORKFLOW.md §9/§20.

Owner/Branch Manager Module inherits:
  - Sole payment-capture/recording authority across all three entities (Section 7).
  - Appointment confirmation/reschedule/cancellation, unchanged.
  - The 50% gate and completion-balance rule as constraints its production UI must surface, not
    reimplement.
  - Everything CUSTOMER-WORKFLOW.md §21 already establishes as owner-only.
```
