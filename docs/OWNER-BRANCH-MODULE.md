# Owner / Branch Manager Module

**This document mixes two categories that must not be conflated:**
1. **A large, pre-existing dashboard** that predates this engagement's thesis-workflow-alignment effort — real, built, functional. Marked `[CURRENTLY IMPLEMENTED]`.
2. **A short list of NEW target-state requirements** that came out of the recently-finalized workflow docs (`docs/PAYMENT-WORKFLOW.md`, `docs/STAFF-WORKFLOW.md`, etc.) that have **not** been built yet. Marked `[NOT CURRENTLY IMPLEMENTED]`.

Do not read "Owner/Branch has not been implemented" (the framing used to scope the *next development phase*) as "no Owner code exists" — that would be false and contradicted directly by the repository. What has genuinely not been implemented is specifically enumerated in sections 9–10 below.

This is documentation only — no Owner/Branch code was touched to produce it.

---

## Critical role-permission finding

`store_owner` and `branch_manager` are **not equal-permission roles**, despite the frontend nav mostly showing both the same items via `isStoreOwner || isBranchManager`. Three real backend role-gate groups exist in `routes/api.php`:
- `role:store_owner,branch_manager,staff` (shared, includes Staff)
- `role:store_owner,branch_manager` (owner + manager)
- `role:store_owner` (**owner only** — branch_manager excluded)

Several nav-visible areas (Catalog, Services *write*, Branches *write*, Billing, Reviews, Store Posts, Audit Log, deeper Analytics) are gated `role:store_owner` only on the backend. A Branch Manager sees the same write UI as an Owner in these areas but gets a 403 on submit. This is a real frontend/backend permission-surface mismatch — noted here, not fixed (outside this audit's scope).

## Feature Areas — `[CURRENTLY IMPLEMENTED]` unless marked otherwise

### Home / Analytics
- `/dashboard` (shared landing, content varies by role)
- `GET /analytics` — owner+manager. Deeper analytics (`/analytics/branches`, `/analytics/staff`, `/analytics/subscription`) — **owner only**
- Models: aggregated from `JobOrder`, `Payment`, `Appointment`, `StaffProfile`

### Shop Profile
- `/dashboard/profile` (header dropdown, not sidebar)
- `PUT /stores/{store}` — **owner only**. Branch Manager cannot edit shop profile.
- Model: `Store`

### Branches
- `/dashboard/branches`, nav-visible to owner+manager
- Read: shared. Write (`POST/PUT/DELETE`, `set-main`): **owner only**
- Model: `StoreBranch`

### Services
- `/dashboard/services`, nav-visible to owner+manager+staff
- Read: shared (staff needs it for pickers). Write (`POST/PUT/DELETE`, sale pricing, restore): **owner only**
- Service Packages (`/dashboard/service-packages` — still exists as a standalone route, no redirect, sidebar link removed per project convention, reachable via tab-in-Services or direct URL): full CRUD **owner only**
- Models: `Service`, `ServicePackage`, `ServicePricing`

### Catalog (Design Catalog)
- `/dashboard/catalog` (+ `/new`, `/[id]/edit`, `/analytics`, `/reviews`)
- `GET/POST/PUT/DELETE /catalog` — **owner only** (not even branch_manager)
- Catalog Item Reviews (reply/delete) — **owner only**
- Models: `CatalogItem`, `CatalogImage`, `CatalogItemReview`, `CatalogItemSave`
- `/dashboard/portfolio` is a legacy client redirect to `/dashboard/catalog` — not a separate feature. `/dashboard/orders` is a legacy server redirect to `/dashboard/jobs` — not a separate feature.

### Staff Management
- `/dashboard/staff` (+ `/[id]` profile)
- Read (list/detail): shared. Write (`POST/PUT/DELETE /staff`): **owner only** — branch_manager cannot hire/edit/remove staff despite nav visibility.
- Models: `StaffProfile`, `User` + `Role` pivot

### Appointments (Owner authority)
- `/dashboard/appointments` (shared page; Staff has a narrower action set — see `STAFF-MODULE.md`)
- Owner/manager-only: `POST /appointments` (full booking form), `DELETE`, `verify-payment`
- Shared (incl. staff): `GET`, generic `PUT` (status/reschedule), `complete`, `follow-up`
- Model: `Appointment`

### Job Orders (Owner authority)
- `/dashboard/jobs` (shared page; Staff has narrower actions)
- Owner/manager-only: `POST /jobs` (create), `pay`, `discount`, `reject` (order + payment), `updatePayment`, `assignStaff`, `notify-customer`, `restore`, `DELETE`
- Shared (incl. staff): `GET`, generic `PUT` (status/notes/ETA/material-status), progress-photos, roster-toggle, materials
- Models: `JobOrder`, `JobOrderStaff`, `Payment`

### Payments (Collect Payments page)
- `/dashboard/payments`, nav-visible **only** to owner+manager (Staff excluded this session)
- Backend: `pay`/`updatePayment`/`rejectPayment` (JobOrder), `verify-payment` (Appointment + CatalogOrder) — all owner/manager only
- Model: `Payment` (JobOrder-only — Appointment/CatalogOrder payment is flat fields on those tables directly, no join)
- **See the dedicated Payment Capture UI section below — this is Part A of the workflow only.**

### Reports / Analytics page
- `/dashboard/reports`, nav-visible to owner+manager
- `GET /analytics` (shared owner+manager) + owner-only deep-dive endpoints

### Billing / Subscription
- `/dashboard/billing` (header dropdown)
- `GET /subscriptions/plans`, `POST /stores/{store}/subscription` — **owner only**. Read-only current tier (`GET /subscription`) is shared (used for feature-gating checks).
- Models: `SubscriptionPlan` (definitions are Admin-owned, see `SYSTEM-ADMIN-MODULE.md`), `ShopSubscription`

### Audit Log
- `/dashboard/audit-log`, nav-visible **owner only** (not even branch_manager)
- `GET /audit-logs` — owner only
- Model: `AuditLog` (polymorphic)

### Reviews Management
- `/dashboard/reviews` client-redirects to `/store/{slug}?tab=reviews` (same UI the public storefront uses)
- `GET/PUT/DELETE /reviews` — owner only
- Model: `StoreReview`

### Store Posts
- Backend: full CRUD `/posts` — owner only. **No dedicated `/dashboard/posts` frontend route found** — likely managed from the storefront-editor context or Shop Profile page. Not independently verified; flag for a closer look if this specific screen matters.
- Model: `StorePost`

### Support Tickets (Store Owner → Admin)
- `/dashboard/support`
- `GET/POST /tickets`, reply, close — owner only
- Models: `SupportTicket`, `SupportTicketReply`

### Account Settings
- `/dashboard/account-settings` — shared across roles, self-adapts via an `isStaffOnly` prop rather than nav-gating

### Measurements (Owner/Manager view)
- `/dashboard/measurements` — shared gate (owner, manager, staff)
- **Same per-customer capture flow as Staff's** — Owner/Manager use the identical screen, not a separate one. No shop-wide chart here (see below).

---

## Store Size Chart — `[NOT CURRENTLY IMPLEMENTED]`

Confirmed via direct search of every model, controller, and migration for `size_chart`/`SizeChart`:
- `size_chart_image_url` / `size_chart_columns` / `size_chart_rows` exist **only** on `catalog_items` and `services` individually — each catalog item or service carries its own optional reference chart, configured independently.
- There is **no** `stores.size_chart_*` column, no `store_size_charts` table, no shop-wide/reusable entity anywhere in the schema.
- The `SizeChartEditor.tsx` shared frontend component (reused by Catalog/Services/Measurements/BulkRoster) is a generic grid-editing UI primitive — not itself the missing entity. In `MeasurementFormModal.tsx` it runs in `mode="single-row"`, which is structurally a flat customer-measurement capture form, not a size-chart table.

**Conclusion: a shop-wide, Owner-configured Store Size Chart — the kind Staff would reference across all customers/orders, independent of any single catalog item or service — does not exist in this codebase in any form.** This is the one explicitly-named target for the next implementation phase.

## Payment Capture/Verification UI (Part A vs Part B) — Part A only implemented

`app/Models/Payment.php` actual fillable fields: `job_order_id, amount, payment_method, reference, recorded_by, notes, receipt_path, rejected_at, rejected_reason, rejected_by`.

Compared against `docs/PAYMENT-WORKFLOW.md` Part B's target schema (`payment_id, job_order_id/appointment_id, customer_id, amount, payment_method, payment_date, reference_number, receipt_path, receipt_filename, receipt_mime_type, recorded_by, verified_by, verified_at, status`):

- No `verified_by` / `verified_at` / `status` — still single-step (Owner/Manager directly records via `recorded_by`; a reject flow exists but no separate two-step "capture then verify" state machine)
- No `customer_id` directly on `Payment` (derived through `job_order_id → JobOrder.customer_id`)
- No `receipt_filename` / `receipt_mime_type` — just `receipt_path`
- `Payment` is JobOrder-only. Appointment and CatalogOrder payments remain flat fields on those tables with their own `verifyPayment()` endpoints — never unified through the `Payment` model

**Conclusion: the current Owner/Manager payment UI (`JobCashierDesk.tsx`, `PaymentAuditLedger.tsx`, `FinancialDiscountForm.tsx`) is still the original Part A implementation.** The Part B target redesign — dedicated receipt-capture screen, archive/download, explicit two-step recorded→verified state — has not been built. Confirmed at the column level, not inferred from UI.

---

## Status classification summary

| Area | Status |
|---|---|
| Home/Analytics, Shop Profile, Branches, Services, Catalog, Staff Mgmt, Appointments, Job Orders, Payments (Part A), Reports, Billing, Audit Log, Reviews, Support Tickets, Account Settings, Measurements | `[CURRENTLY IMPLEMENTED]` (pre-existing) |
| Store Posts frontend entry point | `[CURRENTLY IMPLEMENTED]` backend, frontend location unverified |
| Store Size Chart | `[NOT CURRENTLY IMPLEMENTED]` — next-phase target |
| Payment Capture UI Part B (two-step verify, receipt archive) | `[NOT CURRENTLY IMPLEMENTED]` — proposed, needs the user's decision on whether it's in scope for this next phase or a separate one |
| Branch Manager write parity with nav visibility (Catalog/Services/Branches/Billing/Reviews/Posts/Audit Log/Staff) | Architectural risk, not a missing feature — see `MODULE-DEPENDENCIES.md` |

---

## Owner/Branch Pre-Implementation Checklist

**Planning artifact only — not authorization to implement any item.** To be used after this documentation is reviewed and approved.

```
[ ] Review Customer baseline (docs/modules/CUSTOMER-GUEST-MODULE.md)
[ ] Review Staff implementation (docs/modules/STAFF-MODULE.md)
[ ] Verify shared data contracts (docs/architecture/SHARED-DATA-CONTRACT.md)
[ ] Verify existing Shop/Store entities (this document, sections above)
[ ] Verify existing APIs (docs/architecture/CROSS-MODULE-DATA-FLOW.md)
[ ] Verify RBAC, including the store_owner/branch_manager mismatch
    (docs/architecture/MODULE-DEPENDENCIES.md, risk #1)
[ ] Verify Customer reflection points (docs/workflows/OWNER-TO-CUSTOMER-REFLECTION.md)
[ ] Decide: Store Size Chart schema shape (new table, FK to Measurement — not a copy)
[ ] Decide: fate of Service/CatalogItem's existing per-item size_chart_* fields
[ ] Decide: whether Payment Part B is in scope for this phase (schema change required)
[ ] Implement Owner Dashboard changes (only what's decided above)
[ ] Implement Store Size Chart
[ ] Validate Staff reflection (Staff reads the new chart, doesn't duplicate it)
[ ] Validate Customer reflection (no behavior change to approved baseline)
[ ] Validate Admin reflection (no admin route should need to change)
```

Items NOT on this checklist because they are pre-existing and already implemented (do not re-implement): Shop Profile, Services, Catalog, Staff Management, Appointment/Job Order authority, Payment capture (Part A), Analytics, Branches, Billing.
