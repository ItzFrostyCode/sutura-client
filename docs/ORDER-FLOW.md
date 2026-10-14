# Ordering flow — what is built (branch `feature/ordering-flow`)

Source: the "Final Workflow Specification" (3 flows), 2026-10-10. Scope rules: [`PRD.md`](PRD.md). Code wins over this file.

| Flow | State |
| --- | --- |
| 1. Appointment & consultation | **Not changed.** Appointments already have an `outcome` and "Create Job"; Bongo's appointment flow replaces this part, so only the hand-off (an approved appointment → an order) is used. |
| 2. Customer decision → production started | **Built.** |
| 3. Production → QC → fitting → handover → completed | **Built** (sequence, corrections, partial handover, completion rules). |
| Scenarios B (change request) and D (follow-up order), due-date log, workload view | B and the due-date log are built; **D (linked follow-up order) and a full workload view are not.** |

## Decisions (2026-10-10)

- **Scope audit:** per-order materials (supplier, cost, "to buy", supplier recovery) were built first, then **removed** — they break the thesis Limitations (no inventory, material stock, purchase orders or supplier/procurement processes). Materials are now a **ready / waiting** yes/no with a note, plus an assessment of the customer's own fabric. See `PRD.md` difference 5.
- **Tailors:** owner/manager *plan* tailors (`job_order_assignees`); the automatic stage attribution (`job_order_staff`) is untouched.
- Only orders created **after** this change use the flow (`job_orders.uses_confirmation_flow`). Older orders and repairs behave as before.
- Side fix: `job_orders.material_source` defaulted to the invalid `shop_supplied`; the default and old rows are now `store_supplied`.

## The sequence (Kanban columns, left to right)

| Band | Status key | Label |
| --- | --- | --- |
| Set up | `pending` · `confirmed` · `awaiting_materials` | Pending · Confirmed · Awaiting Materials |
| In production | `design` · `pattern_making` / `mass_cutting_printing` · `cutting` · `sewing` | the shop's internal tasks (the customer just sees "In Production") |
| Quality check | `qc_ironing` | Quality Check |
| Fitting & collection | `ready_for_pickup` · `ready_for_fitting` · `final_adjustments` | Ready for Final Fitting / Collection · Customer Fitting / Inspection · Adjustment / Correction |
| Handover | `balance_handover` · `completed` | Balance Payment & Handover · Completed |

Paths: A) production → QC → ready → handover → completed. B) …→ ready → **fitting** → handover. C) QC or fitting fails → **correction** → back to QC → ready → fitting again if needed → handover. Fitting is skipped when the order's fitting requirement is `none`.

## Gates (single source: `app/Support/OrderReadiness.php`)

| To do this | The server requires |
| --- | --- |
| Make the quotation **final** | price, completion date, specs approved, measurements verified (unless not needed), the customer's own fabric assessed *suitable* (when they bring it) |
| **Confirm** | final quotation, specs approved, customer approval, deposit **verified** |
| **Start production** (`confirmed` → first task) | materials marked ready, measurements verified, a tailor planned |
| → **Ready for Final Fitting / Collection** | quality check recorded as passed, no open correction |
| → **Customer Fitting / Inspection** | QC passed, fitting needed (not `none`), coming from Ready |
| → **Adjustment / Correction** | at least one open correction (a QC defect, a fitting issue, or a customer change) |
| Adjustment → **Quality Check** | every correction done |
| → **Balance Payment & Handover** | QC passed, no open correction, and if a fitting is *required* it was passed |
| Record a **handover** | status is Balance Payment & Handover **and the balance is paid** |
| → **Completed** | every garment handed over, no open correction, balance 0 |

Moving back to production, QC or correction starts a new round, so QC and the fitting have to be passed again. A saved quotation that changes the total or date clears an earlier approval. A customer **change request** is quoted and approved first; approving adds its price to the total and balance, and a new completion date is written to the audit log with the reason. After production has started, a higher total does not re-lock the deposit gate.

## Who can do what

| Action | Owner / branch manager | Staff | Customer |
| --- | --- | --- | --- |
| Approve specs, verify measurements, materials ready/waiting, assess the customer's fabric, record approval at the counter | ✔ | ✔ | — |
| Quality check, record corrections, resolve them, record handover, move stages | ✔ | ✔ (no prices) | — |
| Quotation, plan tailors, confirm, quote/approve/cancel a change, refund | ✔ | — | — |
| Approve quotation + policy online | — | — | ✔ (`My Orders`) |

## API (all under `/api/v1/stores/{store}/jobs/{job}/…`)

`readiness` · `specs/approve` · `measurements/verify` · `materials` (`state: ready|waiting`) · `customer-items` · `quotation` (PUT) · `quotation/approve` · `assignees` · `confirm` · `quality-check` (`result: pass|fail`) · `corrections` (POST, PUT `{id}`, `{id}/resolve`, `{id}/approve`, `{id}/cancel`) · `handovers` · `refund-suggestion` · `refunds` · `refunds/{id}/mark-refunded`, plus `POST /my-orders/{job}/approve-quotation`. Stage moves use the normal `PUT …/jobs/{job}` `{status}`; the dashboard chains "record result, then move" into one tap.

## Customer view and notices

The customer sees one status: Pending → Confirmed → In Production → Quality Check → Ready for Fitting / Collection → (Fitting / Inspection) → Payment & Handover → Completed, with *Adjustment / Correction* shown only while something is being corrected. They are emailed when work starts and when the order is **Ready** (quality check passed; fitting or collection; balance; settle and take home in one visit), not for each internal task, the fitting or the handover. Internal tasks, assignments and notes stay shop-only.

## Cancellation refund

Suggested = paid − "spent, cannot recover" (an amount the owner types, with a note). Changing the suggestion needs a reason. It is **recorded only** — SUTURA never moves money — and does not change revenue figures yet.

## Kanban UI

Ported from the `Order/` prototype in React + Tailwind (`src/components/jobs/kanban/*`): lifted card while dragging, drop slot, WIP limits that refuse a drop (`kanbanConfig.ts` → `WIP_LIMITS`; "Move to…" and Approve are not limited), collapsible columns, swimlanes by department, phase bands, phone stage pills. Touch uses "Move to…" instead of dragging.

## Try it (Thread & Needle, `maria.cruz@gmail.com` / `password`)

14 demo orders, one per column, Pending through Balance Payment & Handover. Customer side: `liza.fernandez@example.com`. After pulling: `php artisan migrate`.

## Known issues

- ESLint cannot run in this repo (typescript-eslint does not support TypeScript 7); `npx tsc --noEmit` is the check.
- Not browser-checked: the new delivery panel at phone width, and the staff / branch-manager views (API-tested only).

## Shared files edited (likely merge conflicts with Bongo)

Server: `JobOrderController` (several small hunks in `update()`), `JobOrder`, `Store`, `routes/api.php`, `AnalyticsController` (3 status lists), `JobOrderTrackingController`, `JobStatusUpdatedNotification`, `OrderReadyNotification`, `SmsTemplates`, `StaffOverviewController`, `UpdateStoreRequest`. Client: `jobHelpers`, `useJobs`, `useJobDetail`, `JobsPageToolbar` and `JobKanbanBoard` (rewritten), `JobProductionTimeline`, `jobs/page.tsx`, job detail page + tab nav, `OrderTrackingView`, `ordersTypes`, `accountTypes`, account order page, staff Home cards, `reportHelpers`, `DashboardCharts`, `useSettings`, `BookingFlowEditForm`, `globals.css`. Everything else is new files and additive migrations (3).
