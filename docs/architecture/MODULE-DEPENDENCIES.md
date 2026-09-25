# Module Dependencies & Implementation Boundaries

## Implementation boundary table

| Area | Status | Notes |
|---|---|---|
| Customer/Guest | **APPROVED BASELINE / FUNCTIONALLY ACCEPTED** | Do not redesign or add speculative features. A genuine integration issue discovered later may still warrant a fix. |
| Staff | **IMPLEMENTED / REVIEW PENDING** | Backend + workflow decisions reviewed and approved. Frontend UI not yet personally reviewed by the user — see `docs/modules/STAFF-MODULE.md` for the per-feature `[IMPLEMENTED — NOT YET PERSONALLY REVIEWED]` labels. |
| Owner/Branch | **PARTIALLY IMPLEMENTED (pre-existing) / NEXT-PHASE GAPS DOCUMENTED** | The Owner dashboard itself is a large, real, pre-existing implementation (predates this engagement). What's genuinely unbuilt: Store Size Chart configuration, and — pending the user's decision — the Payment Part B redesign. Do not implement either until this documentation is approved. |
| System Admin | **BACKEND PARTIAL / FRONTEND NOT IMPLEMENTED** | Confirmed via direct code re-verification, not repetition of prior docs. Owned by a teammate — out of scope for this engagement's implementation work regardless. |

## Frozen / approved
Customer/Guest module (baseline, integration-safe, not redesign-safe).

## Implemented but review pending
Every Staff-facing frontend surface listed in `docs/modules/STAFF-MODULE.md` — the user has reviewed backend/workflow, not the UI.

## Deferred
- Store Size Chart (Owner-configured, shop-wide measurement reference)
- Payment Capture/Verification UI Part B (two-step, receipt archive) — proposed, needs explicit approval before it's treated as in-scope for the next phase
- `SubscriptionPlanController::update/destroy`
- Admin frontend (any of it) — not this engagement's responsibility

## Future
Everything under "Owner/Branch Pre-Implementation Checklist" in the workflow files, once approved.

## Not found
Standalone customer-facing "Designs" page, standalone "Pricing" page, Store Posts' frontend entry point (backend confirmed, frontend location unverified), Catalog Orders' Staff-facing frontend location (backend confirmed, frontend unverified).

## Needs architectural decision
See the "Architectural risks" list below — these are pre-existing conditions, not defects introduced by this documentation pass, but they materially affect how Owner/Branch implementation should be scoped.

---

## Architectural risks (confirmed, not fixed, need a decision before or during Owner/Branch work)

### 1. `store_owner` vs `branch_manager` permission mismatch
The frontend nav shows Branch Manager most of the same items as Owner (`isStoreOwner || isBranchManager` is the dominant gating pattern in `dashboard/layout.tsx`), but the backend restricts several of those same actions to `role:store_owner` only: Shop Profile edit, Branches write, Services write, Catalog write, Staff Management write, Billing, Audit Log, Reviews, Store Posts. A Branch Manager currently sees write UI in all of these that will 403 on submit. **This is pre-existing, not introduced by the current Staff-phase work.** Needs a decision: either intentionally narrow Branch Manager's nav to match their real backend authority, or intentionally widen their backend authority to match the nav — currently neither is true, the two have drifted apart.

### 2. Staff sees write-action UI it can't use (systemic)
Independent of #1: Services, Job Order delete/create/reassign, and Customer delete all render their write-action buttons unconditionally, relying entirely on the backend's 403 rather than not rendering the control for Staff. Confirmed not a security gap (the backend gate is correct everywhere checked) — a UX inconsistency. See `docs/modules/STAFF-MODULE.md`'s "Cross-cutting finding" section.

### 3. `super_admin` role referenced in frontend code, never seeded in backend
`dashboard/jobs/[id]/page.tsx` and `components/appointments/useAppointments.ts` both include `'super_admin'` in their owner-or-manager role-check arrays. No role named `super_admin` exists anywhere in the seeders — the real admin role is named `admin`. Dead/aspirational code, harmless today (an always-false branch), but worth cleaning up or deciding whether a `super_admin` tier is actually planned.

### 4. Store Size Chart placement risk
If implemented naively as "copy the shop's chart into every Measurement," it would violate the explicit "one shared source of truth, no duplication" rule this whole documentation effort exists to protect. The correct shape (per prior session guidance, restated here for continuity): Owner configures ONE reference; Staff reads from it and records ONLY the relevant subset into a `Measurement` row; the two remain structurally distinct and FK-linked, not copied.

### 5. `Service`/`CatalogItem` already have their own `size_chart_*` fields
A future shop-wide Store Size Chart will coexist with these pre-existing per-item chart fields. Not resolved here — flagging so the Owner/Branch implementation phase makes an explicit decision (deprecate, keep as per-item overrides, or leave entirely separate) rather than accidentally building a third, disconnected concept.

### 6. `Payment` model schema gap blocks Part B without a migration
The Payment-workflow target design (two-step capture→verify, receipt archive/download) requires new columns (`verified_by`, `verified_at`, `status`, `customer_id`, `receipt_filename`, `receipt_mime_type`) that do not exist today. Implementing Part B is not UI-only — it requires a schema change, explicitly flagged as such rather than silently assumed.

### 7. Stale backend comment
`routes/api.php`'s comment on `GET /track/{trackingCode}` says "Backend-only for now; no consuming page yet" — this is now false; `/track/[code]/page.tsx` exists and works. Not fixed (comment-only, out of this audit's scope), noted so whoever next touches that file isn't misled by it.
