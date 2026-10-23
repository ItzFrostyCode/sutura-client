# Ordering flow — what is built (branch `feature/ordering-flow`)

Source: the "Final Workflow Specification" (3 flows), 2026-10-10. Scope rules: [`PRD.md`](PRD.md). Code wins over this file.

| Flow | State |
| --- | --- |
| 1. Appointment & consultation | **Not changed.** Appointments already have an `outcome` and "Create Job"; Bongo's appointment flow replaces this part, so only the hand-off (an approved appointment → an order) is used. |
| 2. Customer decision → production started | **Built.** |
| 3. Production → QC → fitting → handover → completed | **Built** (sequence, corrections, partial handover, completion rules). |
| Scenarios B (change request) and D (follow-up order), due-date log, workload view | **Built** (Scenario B change requests, Scenario D linked follow-up orders via `newFollowUpOrderHref`, due-date log, and staff workload views). |

## Update 2026-10-21 — consultation first, order rules, people, release, batches

Details and endpoints: [`STATUS.md`](STATUS.md) ("Consultation first, order rules, batches"). Code beats this note.

- **Before the order:** a consultation starts only once the shop knows who it is (a customer the shop has, or a new name + mobile number; a number the shop already knows reuses that customer). The walk-in account's placeholder `walkin_…` email is never shown. What was said (`visit_notes`), how many people and where the design comes from (`design_source`: shop's · customer's finished · customer's to redo · none) are copied onto the order as "Consultation notes" and shown on the order and the work ticket.
- **Gates are unchanged in order:** specs approved → measurements verified → price final → customer accepts → deposit → authorize → production. Measuring after the design is approved needs no new lock. Service rules (measurements, fitting, payment, minimum quantity) are the order's **starting values**; the owner / branch manager can change them for one order with a reason (`order_rules_changed`). The minimum quantity only warns.
- **Handover and completion:** a group order counts its people (`people_count`), not `quantity`. A handover needs the balance paid unless the owner / branch manager **releases with a balance due**; the order then stays in Balance Payment & Handover and **Completed needs the balance at 0**.
- **Batches:** a group order can be split before production into linked orders (one per payer). Each part has its own total, deposit, due date, handover and tracking code; the overall figures are worked out from the parts.

## Update 2026-10-16 — simple sequence (pre-production steps, five plain stages)

Spec: `SUTURA/chatgpt Reply to  your executive summary.md`. Code beats this note.

- **A request has six saved steps** (`App\Support\OrderPreProduction`, shown on the order's Steps tab): request accepted · details & sizes (specs, measurements, the customer's own items, pieces/people/sizes edited inline) · price sent · customer answer · deposit · order confirmed (**Confirm order** appears only when 1–5 are done). Nothing extra is stored; coming back lands on the first unfinished step. Once confirmed, the Steps tab shows **Getting ready** instead: materials ready, tailor assigned, **Start production** (first task `pattern_making`, `mass_cutting_printing` for a bulk order, `in_repair` for a repair — never `design`; the server refuses any other first move).
- **Online request without an appointment:** `POST /stores/{slug}/order-requests` (client `/store/{slug}/request`). It waits as `pending` until the owner/manager accepts it (`POST …/jobs/{job}/accept-request`); nothing is paid or started.
- **Quotation versions:** every save of the quotation adds a row in `order_quotation_versions` (who, why, total, terms). A change after the price was sent needs a reason. The proposed **payment terms** (deposit %, full, or pay on pick-up) and a **valid-until** date travel with the price; the customer sees them before answering and they lock when the customer agrees. Changing price, date or terms after that voids the answer.
- **Customer decision:** `POST /my-orders/{id}/decision` with `accept | changes | decline`. Decline closes the order as `cancelled` with reason `quotation_declined` (only if nothing was paid). The customer cannot send payment proof before accepting.
- **Authorization:** confirming records `production_authorized_at/by`; production cannot start without it. Only the owner or a branch manager can confirm or cancel an order on the flow, and a completed / cancelled / rejected flow order can no longer change status.
- **Tailor changes** are kept in `job_order_assignee_events` (from, to, reason, by); a reason is required once work has started.
- **Customer view:** one server-built `progress` (`App\Support\OrderProgress`): Request · Confirmed · Being made · Ready · Done, plus one plain sentence and the next action. Same for signed-in customers and guests (`/track/{code}`, no action shown). Fitting, adjustments and the internal tasks are notes inside a stage, never extra stages; the bar never moves backwards.
- **Shop view:** Orders page = the same five stages, oldest order on top with its place in line and received date; a one-tap "Next" for the cutting/sewing tasks. Order page = three tabs: Steps, Details, Payments.
- **Texts and notices:** new in-app/email notices for request accepted, price ready, price changed (`OrderUpdateNotification`); the optional text "price is ready" is off by default; the "ready" text now says what to bring (balance, full payment, or nothing). Texts still go through the shop's outbox, so the shop reviews and sends.
- **Not done / open:** see section 7 of the spec (who accepts online requests beyond owner/manager, quote expiry reminders, legacy order mapping, receipt numbers). Internal statuses were not changed.

## Update 2026-10-16 — Create Job Order form simplified

`/dashboard/jobs/new` (`components/jobs/JobCreateForm.tsx` + `form/*`) is five plain steps: **Customer → What is being made → Details → Who works on it → Price and date.** Code beats this note.

- **Same lists the customer searches by:** one garment search box (`form/GarmentStep.tsx`) built from `lib/garmentTaxonomy` plus any name typed on a shop's designs, the shop's own garments first; then only the services that work on it (`garment_types`; empty = any garment only for Alterations / Customization). A design (optional) fills in its service, price, days and photo and is filtered by the same garment.
- **Derived, not asked:** repair flow (condition notes) from an alteration service, team list from a bulk service, measurements hidden when the service says none are needed. The old three-way "From a Design / Made to Order / Alteration" switch is gone.
- **Staff step** (owner / branch manager): staff whose Skills (Staff page) mention the garment, its category or the service are listed first as "Skilled in …".
- **Price and date are suggestions** (service or design price × quantity, service turnaround) until typed over; total = price + rush fee − discount. An empty price saves a zero-total order to be quoted in Order Steps (it now starts `unpaid`, not `paid`).
- **Saved on the order:** `custom_order_data.garment_type` (readable name), `.garment` (slug), `.garment_group`; the old `garment_category` is still filled where a match exists (barong, gown, suit, filipiniana, uniform, alteration_repair) so the work ticket and reports keep working.

**Orders board (2026-10-16):** the five stages are tinted full-height lanes with a count pill; a summary strip (active, waiting on you, due in 2 days, overdue, balance to collect — owner/manager only) is worked out from the loaded orders and hidden when there are none; the Request lane lists real appointments that took place but have no order yet ("Ready to write up"), each opening Create Job Order pre-filled (`board/WaitingAppointments.tsx`).

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
| **Start production** (`confirmed` → first task only: `JobOrder::firstProductionTask()`) | materials marked ready, measurements verified, a tailor planned, production authorized, **deposit still met** (a change approved after confirming can raise the total) |
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
