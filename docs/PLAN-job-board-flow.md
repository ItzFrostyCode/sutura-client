# Plan: Job board flow, column by column (2026-10-22)

One straight path per column, as few ways to move as possible. Each column has one job and ends with one button.
Build in this order: P1 → … → P7. Each phase must type-check (`npx tsc --noEmit`, `php -l`) before the next starts.

## Resolutions after the cross-check (these override the phase text below)

1. **P1 No order**: a dedicated endpoint `POST /appointments/{id}/no-order` (owner/manager/staff of that branch) that works on an `in_progress` or `completed` appointment with no job: sets outcome `no_order` + optional note, status `completed`. Add `no_order` everywhere outcomes are listed (Appointment::DONE_RESULTS, Store/UpdateAppointmentRequest, scopeAwaitingJob exclusion, client type + labels). "Consultation only" (outcome `completed`) correctly stays in the column — it means "visit done, order not made yet".
2. **P1 deposit**: appointments store no deposit amount, so the card says "Booking deposit paid" (+ method) without an amount.
3. **P3 Start production**: the first task becomes `pattern_making` (bulk `mass_cutting_printing`, repair `in_repair`), never `design`. That newly hits the deposit gate (`JobOrderController` ~1144) — correct: if the deposit is short (e.g. an approved change raised the total), Start shows "Deposit short by ₱X" + Collect (owner/manager). Confirmed also shows Measurements verified and Order confirmed as checks when they are not done (both are startBlockers).
4. **P4 status moves are instant** (Next, Back one step, Quality check passed, Needs a fix, Fixed, Hold, Resume): each calls the server at once — no draft + "Save Changes". Notes / photos / ETA keep draft + Save. Stage clicks on the timeline and the "Move to stage" list are removed.
5. **P4 Hold/Resume**: new nullable column `job_orders.status_before_hold` (migration — the owner runs `php artisan migrate`). Hold stores the current status there; Resume puts it back exactly and clears it. Held orders show only Resume.
6. **P4 Back one step**: no history needed — the line is fixed, so Back = the previous step in the line, allowed only before Quality check passed. The server refuses any other backward jump.
7. **P4/P5 Needs a fix**: Shop's mistake → correction kind `defect` (from QC) or `fitting_issue` (from fitting), `shop_fault = true`, free — staff may record it. Customer's request → kind `change_request` with an amount → customer approves → added to total and balance (existing `approveChange`) — **owner/manager only**; staff don't see that option.
8. **Cancel / hold for staff**: Cancel only in the "…" menu for owner/manager (server already 403s staff). Hold allowed for staff.
9. **Blocked buttons**: Confirm order, Start production, Waiting for materials and Back/Next must show their reason as visible text under the button (not only a hover title, which phones can't see); modal submit buttons follow the same rule (message above the button + focus the field).
10. **P6 free follow-up**: new nullable column `job_orders.follow_up_of_id` (migration; NOT `parent_order_id`, which means batch/group). Server store(): when `follow_up_of_id` + `shop_fault=true` are sent by owner/manager, create the order as `confirmed` at ₱0 and stamp quotation final ₱0, specs approved, customer approved (channel in person), terms none + locked, `confirmed_at`, `production_authorized_at`. P6 is built last.

Assumed decisions (change here if the owner says otherwise):
- A free fix after pick-up (shop's mistake) becomes a follow-up order that starts in **Confirmed** at ₱0 (no quotation, no approval).
- "Release with balance due" stays, owner / branch manager only.

## Rules for every phase

- No browser-native dialogs anywhere: never `window.alert/confirm/prompt`, never a `beforeunload` prompt. Results of create / update / delete show as an in-app toast (`useToast`); anything destructive or hard to undo asks first with `confirmDialog` (`@/store/useConfirmStore`); a notice that must be read uses `noticeDialog`.
- One primary button per card and per step. A button the user may not press is hidden, not shown disabled. A button that is visible but blocked says why next to it, never silently greyed.
- Permissions: owner + branch manager can do everything below; staff can do production steps (Next, Needs a fix, Hold/Resume, fitting, handover) but not prices, payments, discounts, confirm, release, cancel.
- The server is the source of truth: every rule below is enforced in `OrderReadiness::transitionError` / the flow endpoints, and the client only mirrors it.
- Every board card shows: order no. · rank, customer, item, one status pill, a facts line, due date, money (owner/manager), and the column's next button.

## PC Cancel & archive rules (owner, 2026-10-22)

- **Archive** only a closed order: status `cancelled` or `rejected`, and (kept rule) no payment records. Completed orders stay in Done. An ongoing order can never be archived — the "…" menu shows "Cancel this order" instead, and the server refuses with "An ongoing order can't be archived. Cancel it first, with the customer's agreement."
- **Cancel** (owner / branch manager, any status before completed): one server action `POST /jobs/{id}/cancel` with reason (JobOrder::CANCELLATION_REASONS), optional note, **how the customer agreed** (in person / text or chat / phone call / they cancelled online) and a required "The customer agreed to cancel this order" tick. Stored on the order + audit log. The generic status update no longer cancels; the timeline's cancel option goes away.
- The cancel form is an in-page panel on the order page (main panel), not a modal: reason, note, how they agreed, the tick, what was paid so far, "After cancelling you can record a refund (optional)." Buttons: Keep the order / Cancel the order (danger).
- **Refund is optional**, recorded only (SUTURA moves no money), three types picked automatically from the order, the owner can switch:
  1. **Full refund** — nothing bought yet and work not started.
  2. **Refund minus materials** — materials bought (marked ready), work not started: paid − material cost the owner enters.
  3. **Partial refund** — work started: paid − (materials + work done) the owner enters.
  Plus **No refund** (reason required). Built on the existing RefundCard / OrderRefundSuggestion (stages no_costs_yet / costs_incurred / production_started).

Built 2026-10-22: server OrderCancelController + `POST /jobs/{id}/cancel`, archive limited to cancelled/rejected, generic update refuses `cancelled`; client detail/CancelOrderPanel + useCancelOrder + CancelledNotice + cancelOptions, ui/RadioGroup, JobMoreMenu/JobDetailHeader/page menu rules, OrderReadinessTab, readiness/RefundCard + RefundForm + useRefundForm; timeline cancel option and CancellationReasonModal removed.

## P1 Consultation (appointments with no job order yet)

Job: record what was said at the visit, then decide.

| Item | Rule |
|---|---|
| Who is in the column | appointment `in_progress` or `completed`, no `job_order_id`, kind ≠ production, outcome not in no_show / cancelled / rescheduled / **no_order** |
| Card facts line | service (+ design), people · pieces, "Own fabric" if material_source = own, design source label, "Deposit ₱X" if a booking deposit was paid; time of visit |
| Missing warning | "Missing: pieces" when pieces_count empty; "Missing: design" when design_source empty and no catalog item |
| Button 1 (primary) | **Create Job Order** → `/dashboard/jobs/new` pre-filled (existing `newOrderHref`) |
| Button 2 | **No order** → confirmDialog "The customer did not go ahead with an order?" with an optional reason → sets outcome `no_order` (+ note) → card leaves the column → toast "Marked as no order." |
| Button 3 | **Book another visit** → existing FollowUpAppointmentModal pre-filled with this customer → toast on success; the card stays until it is turned into an order or marked no order |
| Server | add `no_order` to `Appointment::DONE_RESULTS` and the outcome validation; exclude it in `scopeAwaitingJob` |

## P2 Request (pending orders)

Job: agree on the order. Ends with **Confirm order**.

| # | Step | Done when | Button (who) |
|---|---|---|---|
| 1 | Request accepted | `shop_accepted_at` | Accept this request (owner/manager) |
| 2 | Details & sizes | specs approved, measurements verified (if needed), customer's own items assessed (if any), pieces/people/sizes set | **Edit pieces & sizes** (moves here from the Quotation window), Approve specs, Mark verified, Suitable / Not suitable |
| 3 | Price | quotation final and sent | Prepare quotation / Edit quotation |
| 4 | Customer answer | `customer_approved_at` | Record approval (in person) when final and waiting |
| 5 | Deposit | terms locked and deposit met | Collect deposit → Payments tab |
| 6 | Order confirmed | `confirmed_at` | **Confirm order** (owner/manager), shown only when 1–5 are done; otherwise the "Still needed" list |

- The Quotation window keeps pieces/people/sizes at the top as a read-only line with a **Change** link that opens the Details & sizes editor; the price still multiplies by pieces.
- Remove "Tailor assigned" and "Production authorized" from this list (server `OrderPreProduction`): tailors move to Confirmed; "Confirm order" is the authorization.
- Decline (owner/manager) stays on the card while pending.

Built 2026-10-22: server `OrderPreProduction` is now six steps (request · details · quotation · decision · payment · confirmed; `staff` and `start` removed); client `steps/stepExtras.tsx` + `steps/PiecesEditor.tsx` (inline Edit pieces & sizes, toast "Pieces and sizes saved."), `readiness/piecesSummary.ts`, `QuotationModal` (read-only summary + Change link), `steps/PreProductionList.tsx`, `readiness/PreStepsSection.tsx` ("Request — x of 6 done"), `useOrderReadiness.savePieces`.

## P3 Confirmed (confirmed / awaiting_materials / queued)

Job: get ready to cut. Ends with **Start production**.

| # | Step | Done when | Button |
|---|---|---|---|
| 1 | Materials ready | materials marked ready (shop's) / customer's fabric received and suitable | Materials are ready · Waiting for materials (note) |
| 2 | Tailor assigned | at least one assignee | Plan tailors / Change |
| → | Start production | 1 and 2 done (server `startBlockers`) | **Start production** → first task: Pattern (bulk: Mass cut; repair: Repair). Never "Design". |

- Card facts: "Deposit ₱X paid · Due Oct 26 · Start by Oct 23"; checks Materials ✓/Waiting, Tailor ✓/None.
- Start by = due date − service `estimated_days` (hide when unknown); red when today is past it.

Built 2026-10-22: server `JobOrder::firstProductionTask()`, `OrderReadiness::transitionError` (first move out of Confirmed must be that task), `startBlockers` gains a `deposit` blocker, `JobOrderController::index` adds `assignees_count`; client `readiness/GettingReadySection.tsx` + `ReadyStepRow` + `MaterialsStep` + `TailorStep` + `StartProduction`, `jobStage.firstTask`, `startBy.ts`, `board/ConfirmedFacts.tsx` in `BoardCard`.


## P4 Being made (production tasks, fixing, QC)

Job: make it. Ends with **Quality check passed**.

Line (same every time): Pattern (bulk: Mass cut) → Cutting → Sewing → Quality check. Repair: Repair → Quality check.

Only 3 ways to move:
1. **Next: {step}** (staff+). From Quality check the two buttons are **Quality check passed** (→ Ready) and **Needs a fix**.
2. **Needs a fix** (from Quality check, or from Ready's fitting): what needs fixing, which pieces/people, **whose reason** — Shop's mistake (free) or Customer's request (extra charge, customer approves; added to the balance once approved). → status Fixing (`final_adjustments`) → **Fixed — back to quality check**.
3. **Hold** (reason) → **Resume** returns to the same step (server already resumes from the real step).

Removed: clicking stages on the timeline, the "Move to stage" list (except nothing — Resume replaces it), moving back more than one step. **Undo** reverses only the last Next (one step back, same session/day, not past Quality check passed). Cancel only from the order's "…" menu (owner/manager, confirmDialog, refund card). "Customer wants a change" is a to-do on the order (a correction of kind change_request) and does not move the order.

Server: in production, accept only next / previous-one / qc / fixing / hold / resume; refuse every other jump with a plain message. Existing orders sitting in `design`: Next goes to Pattern.

Built 2026-10-22 — needs `php artisan migrate` (status_before_hold).

## P5 Ready (ready_for_pickup / ready_for_fitting / balance_handover)

Job: hand it over. Ends with **Done**.

| # | Step | When | Button |
|---|---|---|---|
| 1 | Customer told | automatic when QC passes (existing notification; 14-day unclaimed reminder exists) | — |
| 2 | Fitting | only if fitting_requirement ≠ none | **Start fitting** → **Fits** or **Needs a fix** (P4 path 2). Optional fitting also offers **Skip fitting** |
| 3 | Pay the balance | balance > 0 | **Collect ₱X** → Payments tab (owner/manager); staff see "Balance ₱X — owner or branch manager collects it" |
| 4 | Hand over | balance clear (or released) | **Hand over** (counts "4 of 20" for groups) → when all handed over and no open fix: **Complete the order** |

- Release with balance due: owner/manager only, needs a pay-by date, confirmDialog.
- Card: "Ready since Oct 22 · Fitting required · Balance ₱250 · 0 of 20 handed over" + the one next button.

Built 2026-10-22 (no migration; see the P5 Cross-check for files). Decided differently: the order no longer completes by itself after the last handover — **Complete the order** is always its own tap (the plan's step 4), so an issue can still be reported first.

## P6 Done (completed)

Read-only. Allowed: print receipt / statement, view. Not allowed: reopen, change price/payments/discount/stages.
Only way out: **New follow-up order** (existing, pre-filled, linked via its notes today):
- Shop's mistake → follow-up created **in Confirmed at ₱0** (server: create with `follow_up_of` + `shop_fault=true` → status confirmed, total 0, quotation final 0, approved, terms none).
- Customer's request or a repeat order → normal new order in Request.

Built 2026-10-22 — needs `php artisan migrate` (follow_up_of_id).

## P7 Cross-cutting

- Steps tab shows the current column's steps (Request 1–6, Confirmed 1–2 + Start, Being made line, Ready 1–4), the earlier columns folded with "done".
- Board cards per column as above; mobile tabs include Consultation.
- Docs: update `docs/STATUS.md` and this file's cross-check when a phase ships.

Built 2026-10-22

## Cross-check (filled by the cross-check pass)

Checked 2026-10-22 against the working tree (read only). `S:` = `sutura-server/`, `C:` = `sutura-client/src/components/`. Status: EXISTS = works as the plan says; PARTLY = exists but differs; MISSING = to build; CONFLICTS = code does what the plan forbids, or the plan contradicts a server rule. Line numbers drift: `S:app/Http/Controllers/Api/V1/JobOrderController.php` and `C:jobs/JobsPageHeader.tsx` were being edited by another session during this pass (the jobs page passes `onOpenTrash`, which the header no longer accepts: run `tsc` before building on it).

Note: the plan says "P0 → P1 …" but there is no P0 section.

Counts (exists / partly / missing / conflicts): Rules and assumed decisions 8 = 2 / 4 / 1 / 1 · P1 7 = 7 / 0 / 0 / 0 (built 2026-10-22) · P2 10 = built 2026-10-22 · P3 7 = built 2026-10-22 · P4 11 = 1 / 4 / 2 / 4 · P5 7 = built 2026-10-22 · P6 5 = built 2026-10-22 · P7 4 = built 2026-10-22.

### Rules for every phase and assumed decisions

| Plan item | Status | Evidence | What to change |
|---|---|---|---|
| R1a No browser-native dialogs | EXISTS | grep of `alert(`, `confirm(`, `prompt(`, `beforeunload` over `C:jobs`, `C:appointments`, `app/dashboard/jobs`, `app/dashboard/appointments`: no hits. Only native things: `window.print()` at `app/dashboard/jobs/[id]/page.tsx:144` ("Print work ticket") and the print pages; `beforeunload` exists only in `C:catalog/editable/useUnsavedChangesGuard.ts:26-35` (not in the job flow) | Keep. Decide if the print dialog counts; leaving the job page with an unsaved status draft has no guard at all (`JobDetailHeader.tsx:48`, `router.back()`) |
| R1b Toast for results, `confirmDialog` for destructive, `noticeDialog` for must-read | PARTLY | Toasts used everywhere (`useOrderReadiness.ts:49-54`). `confirmDialog` used only for: arrived (`useAppointments.ts:250`), didn't come (`appointments/page.tsx:282`), remove visit, progress photo, payment statement. Hard-to-undo job actions ask nothing or use a modal: Confirm order, Start production, cancel a correction (X, `CorrectionsList.tsx:51`), Release (`HandoverModal.tsx`), Decline (`JobRejectModal`), Hold/Cancel (own modals), "Consultation only" (inline `appointments/detail/ConfirmClose.tsx`). Follow-up modal shows its error inline (`FollowUpAppointmentModal.tsx:119`) | Add `confirmDialog` to Confirm order, Start production, cancel correction, Release, No order. Decide whether in-app modals with a reason field count as "asks first" |
| R2 One primary button; unavailable = hidden; blocked-but-visible says why next to it | CONFLICTS | Disabled with the reason only in a hover `title` (invisible on phones): Confirm order `readiness/StepAction.tsx:52`, Start production `:58`, "Waiting for materials" `readiness/MaterialsCard.tsx:77`, Prev/Next `detail/production/StageControls.tsx:33-34` (no reason at all), Save `:36`. Disabled with no message: `CorrectionModal.tsx:57` (text under 3 chars or amount empty), `HandoverModal.tsx:36` (quantity out of range), `ApproveChangeModal.tsx:32`, `TailorsModal.tsx:55`, `JobCashierDesk.tsx:122`, `FinancialDiscountForm.tsx:143`, `JobEditMeasurementModal.tsx:484`, `SplitOrderModal.tsx:53`, appointments: `AppointmentActionModals.tsx:345,400`, `RejectAppointmentDialog.tsx:56`, `VisitWizardChrome.tsx:29`. Visible to roles that cannot press them: "Cancel order…" and "Put on hold…" for staff (`TimelinePanel.tsx:89-90`; server 403 `JobOrderController.php:1113`); "Move to stage" includes Confirmed for staff | Sweep: hide for the role, or print the reason as a line next to the button. Busy-only `disabled={busy}` is fine |
| R3 Permissions (owner+manager all; staff production steps but not prices/payments/discount/confirm/release/cancel) | PARTLY | Server matches for confirm, cancel, release, pay, discount, accept request, quotation, assignees (`routes/api.php:316-354`, `OrderDeliveryController.php:254`, `JobOrderController.php:1113`). Staff CAN approve specs, verify measurements, assess customer items, set materials, record in-person approval, QC, corrections, handover (`routes/api.php:241-255`). Staff CANNOT add a `change_request` correction (`OrderDeliveryController.php:110-112`, 403) and CANNOT plan tailors. Plan lists "Start production" with staff-allowed production steps: server lets anyone move status (shared `PUT /jobs/{id}`) | Spell the staff list per action; hide "customer's request" option from staff; decide if staff may Start production |
| R4 Server is the source of truth (`OrderReadiness::transitionError` + flow endpoints; client mirrors) | PARTLY | Gates live in `S:app/Support/OrderReadiness.php:176-301`, but only for `gated()` orders (`:24-27`): repairs and old orders are not gated at all (`:178`), and `OrderDeliveryController::guard` 422s them (`:33-36`). Client duplicates rules: `STAGES_REQUIRING_DOWNPAYMENT` (`C:jobs/jobHelpers.tsx:68-74`), `depositMet` (`kanban/flowChip.ts:17`), hard-coded "50%" toast (`board/useJobsBoard.ts:224`), `nextTask` (`jobStage.ts:57-63`) | State what repairs/old orders do under P3-P5 (they skip Confirmed, corrections, handover) |
| R5 Every board card: order no. · rank, customer, item, one status pill, facts line, due, money, the column's next button | PARTLY | `board/BoardCard.tsx:46-80`: order no. + rank, customer, item + pcs, one pill (`flowChip` or `stageNote`), due or received, money (owner/manager), Next button only for Being made tasks (`nextTask`) plus Decline on pending. No facts line, no button for Request/Confirmed/Ready. `GET /jobs` loads no `assignees` (`index()`, `JobOrderController.php:576`) so a Tailor check needs a new `with`/`withExists` | See P2-P5 card rows |
| A1 Free fix after pick-up = follow-up order that starts in Confirmed at ₱0 | MISSING | No server path; see P6 | See P6 |
| A2 "Release with balance due" stays, owner/manager only | EXISTS | Server `OrderDeliveryController.php:253-256` (403 for staff); client button gated by `can_see_money` (`readiness/DeliveryActions.tsx:74-76`) | None |

### P1 Consultation

Built 2026-10-22. Status of every row: EXISTS. `S:` = `sutura-server/`, `C:` = `sutura-client/src/components/`.

| Plan item | Status | Where | Notes |
|---|---|---|---|
| Who is in the column | EXISTS | `S:app/Models/Appointment.php` `scopeAwaitingJob` now also excludes `no_order`; client `C:jobs/board/useWaitingAppointments.ts` (returns `{ waiting, remove }`) | "Consultation only" (outcome `completed`) stays in the column on purpose: visit done, order not made yet |
| Card facts line | EXISTS | `C:jobs/board/consultationInfo.ts` (`consultationFacts`), shown by `ConsultationFacts.tsx` in `ConsultationCard.tsx` and `AppointmentIntakeBanner.tsx` | Design source label (hidden when `none`), "{n} people" (2 or more), "{n} pcs", "Own fabric", "Booking deposit paid (method)" |
| "Deposit paid" | EXISTS | same file; `payment_status === 'paid'` | No amount: appointments store none (resolution 2) |
| Missing warning | EXISTS | `consultationMissing` in `consultationInfo.ts` | "Missing: pieces" (no `pieces_count` and no item quantity), "Missing: design" (no design source, or `none`, and no catalog design); both can show |
| Button 1 Create Job Order | EXISTS | `C:jobs/board/ConsultationActions.tsx` (primary, full width, `newOrderHref`) | |
| Button 2 No order | EXISTS | `ConsultationActions.tsx` + `useConsultationActions.ts` -> `POST /stores/{store}/appointments/{appointment}/no-order` (`AppointmentController::markNoOrder`, `S:routes/api.php` shared owner/manager/staff group) | The reason is asked inline in the card (Confirm no order / Cancel), because `confirmDialog` has no text input. Toast "Marked as no order."; the card leaves the lane through `remove`; the mobile tab count follows. Server: allowed on `in_progress` or `completed`, no job, not production, outcome empty or `completed`; else 422. Sets status `completed`, outcome `no_order`, appends "No order: {reason}" to `visit_notes`, audit `appointment_no_order`, customer is not messaged |
| Button 3 Book another visit | EXISTS | `ConsultationActions.tsx` opens `FollowUpAppointmentModal` with `presetCustomerId` / `presetCustomerName`; `POST /appointments/follow-up` | Toast "Follow-up visit booked."; the card stays. Errors show as `toast.error` |
| Server outcome lists | EXISTS | `Appointment::DONE_RESULTS`, `StoreAppointmentRequest`, `UpdateAppointmentRequest`; client `Appointment['outcome']` and `StatusBadge` ("No order") in `C:appointments/appointmentHelpers.tsx` | `complete()` also accepts `no_order` (from `in_progress`) through `DONE_RESULTS`; the dedicated endpoint is the one the board uses |

Hidden rules / small details (P1)
- `GET /appointments` for staff and branch managers is pinned to their branch and also returns visits with no branch (`AppointmentController.php:468-474`).
- `awaiting_job` ignores the 30-day list window (`:499`), so old unconverted visits never leave.
- Creating a job from a `pending` appointment is refused ("Approve the appointment first", `JobOrderController.php:891-893`); one job per appointment (`:898`).
- `complete()` with `converted_to_job` needs the job to exist first (`AppointmentController.php:1318-1320`).
- Customer must exist: follow-up needs `customer_id` or a job (`:880-888`); `waiting.filter(a => a.customer)` hides visits with no customer (`useWaitingAppointments.ts:19`).

### P2 Request

| Plan item | Status | Evidence | What to change |
|---|---|---|---|
| 1 Request accepted (owner/manager) | EXISTS | `steps/PreStepRow.tsx:25`; `OrderFlowController.php:172-189` (pending, owner/manager route `routes/api.php:349`). Saving any quotation also stamps `shop_accepted_at` (`:144-146`), so step 1 can be skipped by pricing | None; note the skip **Built:** unchanged (`steps/PreStepRow.tsx`). |
| 2 Details & sizes (specs, measurements, customer's items, pieces/people/sizes) | BUILT 2026-10-22 | Buttons exist: Approve specs, Mark verified, Suitable / Not suitable (`readiness/StepAction.tsx:29-39`); step done rule `S:OrderPreProduction.php:17-19`. Verify refuses when nothing is recorded (`OrderFlowController.php:72-78`). Pieces/people/sizes are NOT here: they are Step 1 of the quotation window (`readiness/QuotationWhatStep.tsx`, `useQuotationOrder.ts:36-49`) | See next row **Built:** `steps/stepExtras.tsx` (summary line, Edit pieces & sizes), `steps/PiecesEditor.tsx` (inline editor reusing `readiness/QuotationWhatStep.tsx`, `useQuotationOrder.ts`, `quotationSizes.ts`; `useOrderReadiness.savePieces`). |
| 3 Price (Prepare / Edit quotation) | EXISTS | `StepAction.tsx:43-44`, `QuotationModal.tsx`, `OrderFlowController.php:85-169` (pending only; final needs price, date, specs approved, measurements verified, suitable items: `OrderQuotation.php:44-64`) | None **Built:** unchanged. |
| 4 Customer answer: Record approval in person | EXISTS | `StepAction.tsx:45-47` (only when quotation is final and pending); `OrderFlowController.php:192-200,280-313` (needs `accepted_terms`, price not expired; staff allowed `routes/api.php:244`) | None **Built:** unchanged. |
| 5 Deposit: Collect deposit → Payments tab | EXISTS | `StepAction.tsx:48-49` (owner/manager only: `can_see_money` and `onGoToFinancials`); staff see no button and no explanation. Deposit rule `OrderReadiness.php:35-52` (verified money only; GCash/PayMaya wait for owner verification) | Show staff a line "owner or branch manager collects it" **Built:** staff line "The owner or branch manager collects the deposit." in `stepExtras.tsx`. |
| 6 Confirm order, shown only when 1-5 are done, else "Still needed" list | BUILT 2026-10-22 | Button is always shown to owner/manager on a pending order and disabled with a hover title when blocked (`StepAction.tsx:50-52`); the "Still needed" list already exists (`readiness/PreStepsSection.tsx:38-47`). Server: `OrderFlowController.php:315-338` + `confirmationBlockers` `OrderReadiness.php:122-141` (quotation final, specs approved, customer approved, deposit) | Hide the button until blockers are empty (list stays) **Built:** `stepExtras.tsx`: Confirm order only when steps 1-5 are done and no confirm blockers; else the "Still needed" list (visible text); staff see "The owner or branch manager confirms the order." |
| "Edit pieces & sizes" moves into Details & sizes | BUILT 2026-10-22 | Server already allows `quantity` while pending (`UpdateJobOrderRequest.php:41`, `JobOrderController.php:1243`). The editor is `useQuotationOrder.patch()` sent by `QuotationModal` before the quotation. Team orders are read-only there (`:14,32`) | New editor in the Details step reusing `useQuotationOrder`/`QuotationSizeCounts`; remove from the quotation window **Built:** see row 2. |
| Quotation window: read-only pieces line + Change link | BUILT 2026-10-22 | `OrderReadinessTab.tsx:94` passes `onGoToDetails`; the window shows editable fields | Replace by the read-only line **Built:** `readiness/QuotationModal.tsx` step 1 is a read-only `piecesSummary` line + Change link (closes the window, opens the editor via `OrderReadinessTab` `piecesOpen`); no order update before saving; price still multiplies by `jobPieces(job)`. |
| Remove "Tailor assigned" and "Production authorized" from the list | BUILT 2026-10-22 | Server steps `S:OrderPreProduction.php:45-46`; client mapping `steps/PreProductionList.tsx:21-23` puts Confirm order and Start production under the `start` step, tailor under `staff`. `production_authorized_at` is stamped by confirm (`OrderFlowController.php:329-331`) | Remove both steps server-side, move Confirm order into step 6, tailors into Confirmed. Keep `startBlockers` tailor + authorization (see P3) **Built:** `S:app/Support/OrderPreProduction.php` (six steps); `steps/PreProductionList.tsx` ITEMS; tailor / materials / start moved to `readiness/GettingReadySection.tsx`. |
| Decline stays on the card while pending (owner/manager) | EXISTS | `BoardCard.tsx:74-78`, `JobsTableView.tsx:239-247`; server `JobOrderController.php:2009-2038` (pending only, reason required) | The modal text says "moved to Cancelled" but the status is `rejected` (`JobRejectModal.tsx:29`) **Built:** unchanged. |

Hidden rules / small details (P2)
- Reject has no payment check: a pending order with a verified deposit can be rejected and there is no refund flow (refund card only for `cancelled`, `OrderFlowPresenter.php:35`). Customer decline is blocked once money was sent (`OrderFlowController.php:264`).
- A final quotation re-saved with a new total, date or terms clears the customer's approval (`OrderQuotation.php:94-117`); changing pieces after pricing does not touch the price until the quotation is saved again.
- Re-saving a sent quotation needs a reason (`OrderFlowController.php:129-134`), and "pay at pick-up" needs one (`:132`).
- Quotation valid-until blocks approval after it passes (`:285`).
- "Approve specs" and "Mark verified" are not status-guarded for verify (`verifyMeasurements`) and show on non-pending orders (`StepAction.tsx:32`).
- Deposit waiver endpoint (owner/manager, before production): `routes/api.php:337`; trusted customers start with policy none (`JobOrder.php` `booted()`); the plan does not mention either.
- Materials can be marked while still `pending` (`OrderFlowController.php:349`), and the Materials card is shown on pending orders (`OrderReadinessTab.tsx:80`).

### P3 Confirmed

| Plan item | Status | Evidence | What to change |
|---|---|---|---|
| Column = confirmed / awaiting_materials / queued | EXISTS | `jobStage.ts:20`. `queued` is a repair-only status; repairs are not gated (`OrderReadiness.php:24-27`) | Say what repairs do in this column **Built:** unchanged. |
| 1 Materials ready / Waiting for materials (note) | BUILT 2026-10-22 | Buttons exist (`readiness/MaterialsCard.tsx:76-77`, plus "Mark ready" `StepAction.tsx:40-42`); server `OrderFlowController.php:344-363`, `OrderReadiness.php:307-337` (confirmed <-> awaiting_materials; customer-fabric must be suitable). "Waiting" is disabled on pending with a hover-only reason. Card also appears during Request | Show the Materials card only from Confirmed **Built:** `readiness/MaterialsStep.tsx` inside Getting ready; `MaterialsCard` deleted; shown only from Confirmed. The customer's-own-fabric Suitable / Not suitable stays in Request step 2. |
| 2 Tailor assigned: Plan tailors / Change | EXISTS | `StepAction.tsx:53-55`, `TailorsModal`, `OrderFlowController.php:387-444` (owner/manager only, max 10, reason needed to remove someone after production started) | Staff cannot plan tailors: R3 **Built:** `readiness/TailorStep.tsx` (Plan tailors / Change -> `TailorsModal`); `TailorsCard` now shows only once work has started. |
| Start production → first task Pattern (bulk Mass cut, repair Repair), never Design | BUILT 2026-10-22 | Client sends `design`: `readiness/useOrderReadiness.ts:77-80`. Server accepts any of `PRODUCTION_TASKS` (`JobOrder.php:62`; `OrderReadiness.php:213`). Moving the start to `pattern_making` newly triggers the deposit gate because `production_started_at` is still empty (`JobOrderController.php:1144`, `depositAlreadyCleared` `:1143`): an approved change (raises total) or a discount can then block Start. Bulk signal must match server `isBulkOrder()` (`JobOrder.php`) and client `isBulkOrder` | Send `isBulkOrder ? mass_cutting_printing : pattern_making`; for repairs there is no Start button (not gated); optionally make the server reject `design` as a first task **Built:** `jobStage.firstTask` + `useOrderReadiness.startProduction(first)`; `S:JobOrder::firstProductionTask()`; `S:OrderReadiness::transitionError` refuses any other first task ("Production starts with {task}."). Repairs are not gated, so the repair case (`in_repair`) is defined but has no Start button. |
| Card facts: Deposit ₱X paid · Due · Start by; Materials ✓/Waiting, Tailor ✓/None | BUILT 2026-10-22 | Board pill only (`flowChip.ts:31`, `jobStage.ts:47-48`). Deposit paid = total - balance - discount (client has it); Tailor needs assignees in the list payload | Add `assignees` to the list `with`; build facts **Built:** `board/ConfirmedFacts.tsx` in `BoardCard.tsx`; list payload already carried `materials_verified_at`, `customer_items_assessment`, `material_source`; `S:JobOrderController::index` adds `assignees_count`. |
| Start by = due date - service `estimated_days` (hide when unknown; red when past) | BUILT 2026-10-22 | `service.estimated_days` is already in the list payload (`jobTypes.ts:89`, `index()` loads `service`); `estimated_days` null means "it depends" and there is an `estimated_days_max` | Build; hide when null **Built:** `startBy.ts` (hidden when due date or `estimated_days` is missing; red when today is past it); shown in Getting ready and on the card. |
| Start production allowed when 1 and 2 are done (server `startBlockers`) | BUILT 2026-10-22 | `OrderReadiness.php:144-163` also requires measurements verified (when needed) and production authorized (set by Confirm). From `awaiting_materials` the server replaces the materials blocker (`:217-221`). Button is disabled with a hover title (`StepAction.tsx:58`), list shown in "Still needed" | Keep the two hidden blockers in the "Still needed" text **Built:** `readiness/StartProduction.tsx`: reasons printed under the button; `startBlockers` gains a `deposit` blocker -> "Deposit short by ₱X" + Collect link (owner / manager). |

Hidden rules / small details (P3)
- Starting stamps `production_started_at` and sends the customer "work started" once (`JobOrderController.php:1263`, `$customerQuiet` `:1428`); the starter is recorded as the staff for that stage (`:1296-1328`; `design` and `pattern_making` are both staff stages).
- After production starts the deposit gate is skipped (`:1143`); approving a change request raises `total_amount`, so `depositMet` (live, `OrderReadiness.php:47-52`) can flip to false and the "Deposit" checklist item reopens.
- A change request is allowed in Confirmed/awaiting_materials (`OrderDeliveryController.php:113`) and blocks nothing until approved or cancelled except later moves.
- Rule edits (fitting/payment/measurement) are open to owner/manager until closed; payment rule only before production (`OrderRulesController.php:55`).

### P4 Being made

**Built 2026-10-22** (S: = sutura-server, C: = sutura-client/src/components/jobs). Every row of the table below is now EXISTS:
- Line and stepper: `S:app/Support/ProductionLine.php` (steps, next, previous, hold rules), `C:productionLine.ts` (client mirror), `C:detail/production/stages.ts` (read-only stepper: the line + Ready; `design` no longer listed), `C:jobStage.ts` (`nextTask` = the line's next; labels "Pattern making", "Quality check", "Fixing").
- Way 1 Next / Back: `S:app/Http/Controllers/Api/V1/OrderProductionController.php` (`POST jobs/{job}/production/next|back|hold|resume`, all call `JobOrderController::applyUpdate`, the extracted body of `update()`, so deposit gate, stamps, staff attribution, hold clock, notifications are the same code); `C:detail/production/StageControls.tsx` (Back, the one primary, "Quality check passed" + "Needs a fix" at QC, refusal shown as text), `C:readiness/useOrderReadiness.ts` (`productionNext/Back`, `hold`, `resume`, `chargedFix`, `error`), `C:detail/MobileActionBar.tsx`, `C:board/useJobsBoard.ts` (`advance` calls the new endpoint).
- Way 2 Needs a fix: `C:detail/production/NeedsFixPanel.tsx` (inline: what, pieces/people, whose reason; "Customer's request (charged)" only when `can_approve_change`, i.e. owner/manager). Shop's mistake = `failQuality` (defect, shop_fault true) then Fixing; customer's request = `change_request` with `additional_amount` (waits for approval, existing `approveChange` adds it to total and balance) then Fixing.
- Fixing: `C:detail/production/FixingPanel.tsx` (open fixes with "Fixed", "Waiting for the customer to approve ₱X", "Record approval", primary "Back to quality check" when none are open), `C:readiness/CorrectionsList.tsx`.
- Way 3 Hold/Resume: migration `S:database/migrations/2026_10_22_100000_add_status_before_hold_to_job_orders.php` (+ `$fillable`), `C:detail/production/HoldPanel.tsx` (inline, reason required), banner "On hold — {reason}" and the only button Resume in `C:detail/production/TimelinePanel.tsx`; `HoldReasonModal.tsx` deleted. Old holds with no saved step resume at the last staffed step, else the first task (`ProductionLine::resumeFallback`).
- Removed: stage clicks, "Move to stage", status as a page draft (`C:useJobDetail.ts` keeps notes, photos, completion photo, ETA, customer material status). Server: `OrderReadiness::productionJumpError` makes the generic `PUT /jobs/{id}` refuse every jump inside production ("Use Next or Back on the order page."), but still serves Quality check -> Ready / Fixing, Fixing -> Quality check, Ready/handover moves and starting production.
- Delivery panel: `C:readiness/DeliveryActions.tsx` and `DeliveryPanel.tsx` show the stage overview only until Ready (no duplicate buttons).
- Board card: `C:board/MakingFacts.tsx` ("Sewing · step 3 of 4 · Tailor: Ana · Due Oct 26", red when overdue), one "Next: {step}" button (none at Quality check, none on hold; the pill says "On hold"); `S:JobOrderController::index` now loads `assignees.user:id,name`.
- Orders that don't use the confirmation flow (legacy, `uses_confirmation_flow` false) and repairs (never gated, their quality-check endpoints refuse them) keep the same simple line; they have no pass/fix, so Next after Quality check goes to Ready for pick-up and then Completed (the completion rules still apply: balance paid, fitting rule), and a legacy order in Fixing goes Next to Quality check.
- Not done: Undo (the plan's old "Undo" is replaced by Back one step, resolution 6); "Customer wants a change" as a to-do still blocks QC pass while open (unchanged).

| Plan item | Status | Evidence | What to change |
|---|---|---|---|
| Column and line: Pattern (bulk Mass cut) → Cutting → Sewing → Quality check; Repair → QC | PARTLY | `jobStage.ts:15-25` puts every other status in `making` (design, pattern_making, mass_cutting_printing, cutting, sewing, qc_ironing, final_adjustments, in_repair, qc_check); `on_hold` follows `production_started_at` (`:18`); `ready_for_fitting` is `making` only for non-flow orders (`:23`). `nextTask` `:57-63`. Stepper still lists `design` (`detail/production/stages.ts:36`) | Drop `design` from the stepper for new orders; keep it in `nextTask` for old ones |
| Way 1 Next: {step} (staff and up); from QC two buttons "Quality check passed" and "Needs a fix" | PARTLY | Next on board cards/table rows and mobile bar (`BoardCard.tsx:69-73`, `detail/MobileActionBar.tsx`); the detail page has a second Prev/Next that only changes a draft (`StageControls.tsx:33-34`) and needs "Save changes" (`useJobDetail.ts:131-150`). Sewing → QC works on the board; QC pass/fail only on the order page: `readiness/DeliveryActions.tsx:33-39`. Pass = QC call then move to `ready_for_pickup` (`useOrderReadiness.ts:86`); labels are "Quality check passed" and "Found a problem". Repair `qc_check` has no Next | Remove the draft mechanism; add QC buttons to the card |
| Way 2 Needs a fix: what, pieces/people, whose reason (shop free / customer extra charge, customer approves, added to balance) | CONFLICTS | Modal has description, "Garments affected", tailor, target date and a "shop's mistake" checkbox (`readiness/CorrectionModal.tsx:34-45,84-89`). The checkbox is stored as `shop_fault` (`OrderDeliveryController.php:86,133`) but changes nothing financially. A charge exists only as a separate kind `change_request` ("Customer wants a change", `DeliveryPanel.tsx:42`): money roles only (`:110-112`, staff 403), status `awaiting_approval`, `additional_amount` required (`:122`), approval by owner/manager adds it to total and balance in one locked transaction and recomputes `payment_status` (`approveChange` `:204-236`; button `CorrectionsList.tsx:47-49`, `ApproveChangeModal.tsx:40`). It does not move the order. `shop_fault` and `additional_amount` are returned to the client (`OrderFlowPresenter.php:206,209`) | Decide: either make "customer's request" create a `change_request` (hide it from staff) and then move to Fixing, or add `additional_amount` + approval to `defect`/`fitting_issue` |
| Status Fixing (`final_adjustments`) → "Fixed — back to quality check" | PARTLY | Label "Adjusting" (`jobStage.ts:29`). Needs every correction marked Done first (`CorrectionsList.tsx:45`), then "Back to Quality Check" (`DeliveryActions.tsx:51-53`) -> `qc_ironing`; server refuses while corrections are open (`OrderReadiness.php:242`). Entering Fixing clears `qc_passed_at` and `fitting_passed_at` (`JobOrderController.php:1269`), counts `adjustment_count` (`:1354`) | One button "Fixed — back to quality check" that marks all done and moves |
| Way 3 Hold (reason) → Resume returns to the same step ("server already resumes from the real step") | CONFLICTS | Not true. `effectiveStatus` (`OrderReadiness.php:166-173`) only picks which gate set to apply; it returns `in_production` (not a real status) and the order's destination is free: from `on_hold` anything passes `strict=false` (`:177-186`), so a held "Ready" order can resume into Sewing. There is no stored previous status (no column; only `held_at` `JobOrderController.php:1376`, `hold_reason` optional `UpdateJobOrderRequest.php:115`). Client: hold is a local draft + Save (`TimelinePanel.tsx:99-103`); Resume = the "Move to stage" select (`:60-86`); `hold_reason` is not cleared on resume | Add `status_before_hold` (server), Resume button, require the reason on hold |
| Removed: stage clicks, "Move to stage" list, moving back more than one step | CONFLICTS | All still present: `TimelinePanel.tsx:55` (`onStageClick`), `:60-86`, `StageControls.tsx:33` (Prev). Server allows backward jumps: any production task from any non-after-QC status (`OrderReadiness.php:233-235`), `confirmed` from anywhere in production (`:191-201` returns null), `ready_for_pickup` from handover (`:244-249`) | Remove UI; add the strict table server-side |
| Undo: reverses only the last Next (one step back, same session/day, not past QC passed) | MISSING | No status history exists (`job_order_staff` keeps one row per stage; audit log has no status moves) | Needs a small status-change log |
| Cancel only from the order's "…" menu (owner/manager, confirmDialog, refund card) | CONFLICTS | "…" menu has Delete, not Cancel (`detail/JobMoreMenu.tsx:50-55`); "Cancel order…" sits in the timeline for all roles (`TimelinePanel.tsx:90`) and is a draft saved with "Save changes". Server: gated orders need a money role (`JobOrderController.php:1113`); `cancellation_reason` required (`UpdateJobOrderRequest.php:40`); the "Other" text is dropped (`CancellationReasonModal.tsx:41`); refund card exists (`readiness/RefundCard.tsx`, `OrderRefundController`, only when cancelled) | Move to the menu, hide for staff, confirmDialog, send the reason |
| "Customer wants a change" is a to-do (kind change_request), does not move the order | PARTLY | Kind and non-moving behaviour exist (`OrderDeliveryController.php:129-137`). But it blocks QC pass, Ready and Complete while open or awaiting approval (`OrderCorrection.php:20`, `OrderReadiness.php:229-297`, `OrderDeliveryController.php:67`), and the button is under "From production to handover" for owner/manager only (`DeliveryPanel.tsx:32,42`) | Show it as a to-do with a status; keep the block or make it explicit |
| Server: in production accept only next / previous-one / qc / fixing / hold / resume; plain message otherwise | MISSING | `transitionError` has no "previous one" or sequence check inside production (`OrderReadiness.php:233-235`); only the after-QC ones are protected (`AFTER_QC` `:22`) | Add a transition table, with plain messages |
| Existing orders in `design`: Next goes to Pattern | EXISTS | `jobStage.ts:60` (bulk goes to Mass cutting) | None |

Hidden rules / small details (P4)
- Corrections other than `change_request` can only be recorded from QC onward (`POST_PRODUCTION`, `OrderDeliveryController.php:25,116`); a failed QC needs a note (`:76`) and creates a `defect` with `shop_fault` default true (`:86`).
- QC pass needs no open corrections and status `qc_ironing` (`:54-69`); staff allowed. Passing does not notify the customer: the "ready" notification fires when the status becomes `ready_for_pickup` (`JobOrderController.php:1388`), chained by the client (`useOrderReadiness.ts:86`).
- Drafted status vs immediate actions: the readiness buttons call the API at once, the stepper only edits a draft; `refreshJob` keeps the draft (`useJobDetail.ts:93`), so a later Save can send a stale status back. The Save also sends `payment_status`/`balance`, which the server ignores (`UpdateJobOrderRequest.php:33-38`).
- A correction can be cancelled by owner/manager only (`routes/api.php:354`); staff can mark Done.
- Going back to `final_adjustments` from handover after garments were already handed over is allowed (`OrderReadiness.php:261-263`).
- Repairs and old orders skip all of this (not gated).

### P5 Ready

**Built 2026-10-22** (S: = sutura-server, C: = sutura-client/src/components/jobs). Every row of the table below is now EXISTS:
- Steps tab "Hand over" (Ready statuses only; the earlier columns are folded, the Work section is folded in Ready): `C:readiness/handover/HandOverSteps.tsx` (the four numbered rows, one primary at a time, "x of 4 done"), `handoverFacts.ts` (fitting state, balance, which step holds the primary), `FittingStep.tsx`, `BalanceStep.tsx`, `HandoverStep.tsx`. `C:readiness/DeliveryActions.tsx` now only renders these steps (Ready) and the completed note; `DeliveryPanel.tsx` titles itself "Hand over" in Ready and drops the stage circles there, so nothing repeats.
- Step 1 Customer told: shows "Customer told Oct 22" from `S:OrderFlowPresenter` delivery `ready_at` (= `ready_for_pickup_at`, stamped together with `OrderReadyNotification` in `JobOrderController::applyUpdate`), falling back to `qc_passed_at`. No button.
- Step 2 Fitting (only when `fitting_requirement` is not none): Start fitting, then Fits (to payment & handover) or Needs a fix; optional fitting also has Skip fitting; required cannot be skipped (server rule unchanged). "Needs a fix" reuses P4's `detail/production/NeedsFixPanel.tsx` (shop's mistake free for everyone; customer's request charged, owner/manager only) through `actions.fittingIssue` / `actions.chargedFix`, and the order goes to Fixing.
- Step 3 Pay the balance: owner/manager "Collect ₱X" (to the Payments tab), "₱X waiting to be verified" from the new `pending_verification` in the delivery payload (money roles only); staff read "The balance is not paid yet — the owner or branch manager collects it." (the server hides the amount from staff, so no ₱X).
- Step 4 Hand over: `HandoverPanel.tsx` inline (replaces the HandoverModal, deleted): count "4 of 20", received by, note. From Ready the order first moves to payment & handover quietly (`useOrderReadiness.recordHandover`), then the handover is recorded. When everything is out and no fix is open: Complete the order. "Needs a fix" (fitting_issue) is offered while the order is at payment & handover.
- Release with balance due: quiet link "Release with balance due…" (owner/manager only) opens the same inline panel with who took them and a pay-by date, both required, then `confirmDialog`; `S:OrderDeliveryController::recordHandover` now requires `pay_by` for a release with a balance.
- Board card: `C:board/ReadyFacts.tsx` ("Ready since Oct 22 · Fitting required · Balance ₱250 · 0 of 20 handed over · Due Oct 26") and `board/readyAction.ts` (Start fitting one tap, else Collect ₱X link to `/dashboard/jobs/{id}#payments` for owner/manager, else Hand over link, else Complete one tap; "Record the fitting" link while in the fitting); `useJobsBoard.moveTo`, `SimpleBoard`/`BoardCard` `onMove`. `S:JobOrderController::index` adds `handed_over_count` (withSum of handovers).
- CorrectionModal stays (it still serves "Customer wants a change"); its fitting-issue use is gone.

| Plan item | Status | Evidence | What to change |
|---|---|---|---|
| Column = ready_for_pickup / ready_for_fitting / balance_handover | EXISTS | `jobStage.ts:22-23`; delivery stage names `OrderFlowPresenter.php:15-18` (ready_for_pickup = "collection", ready_for_fitting = "fitting") | Do not confuse with old orders where `ready_for_fitting` means the fitting trigger (`JobOrder.php:220-227`) |
| 1 Customer told, automatic when QC passes; 14-day reminder exists | PARTLY | Notification fires on the status change to `ready_for_pickup`, every time it re-enters after a fix (`JobOrderController.php:1388`), together with `ready_for_pickup_at`. Reminder: `S:app/Console/Commands/NotifyUnclaimedPickups.php:22-26` notifies the OWNER only, only status `ready_for_pickup`, not the customer and not fitting/handover | Decide who is reminded |
| 2 Fitting (only if requirement is not none): Start fitting → Fits / Needs a fix; optional also Skip fitting | PARTLY | Buttons: "Customer arrived for fitting", "No fitting — go to payment & handover" (only when not `required`), "Fitting passed", "Fitting issue" (`DeliveryActions.tsx:40-48`). For `none` only "Customer is here — payment & handover" shows. Server: ready_for_fitting only if QC passed and requirement is not none (`OrderReadiness.php:251-259`); "Fits" = move to `balance_handover` stamping `fitting_passed_at` (`JobOrderController.php:1272`); `required` needs it or being in fitting (`OrderReadiness.php:275-277`). The auto fitting appointment is created on entering Ready (`:1414`, `JobOrder.php:233`), is never completed by the flow, and past the fitting limit adds a fee to total and balance (`JobOrder.php:240,264-266`, 'block' policy refuses the move `JobOrderController.php:1204`) | Rename; tell the user about the fee/block; close or hide the placeholder visit when fitting passes |
| 3 Pay the balance: Collect ₱X → Payments tab (owner/manager); staff see "Balance ₱X — owner or branch manager collects it" | PARTLY | `DeliveryActions.tsx:61-69`: owner/manager get "Collect balance" (no amount on the button); staff see no amount (server hides `balance` from staff `OrderFlowPresenter.php:227`) and no instruction | Add the amount and the staff sentence. Server hides money from staff, so the staff line cannot show ₱X |
| 4 Hand over (counts "4 of 20") → Complete the order | PARTLY | "Record handover" with partial quantity and "x of y" line (`DeliveryActions.tsx:57,70`, `HandoverModal.tsx`). The order completes automatically after the last handover when balance and corrections are clear (`useOrderReadiness.ts:93-103`), so "Complete the order" only shows for the leftover case (`DeliveryActions.tsx:71`). Server: handover only at `balance_handover` (`OrderDeliveryController.php:244`), `completed` needs balance 0, all garments (people count for groups) and no open corrections (`OrderReadiness.php:281-297`) | Rename to "Hand over"; decide whether the automatic completion stays |
| Release with balance due: owner/manager, needs a pay-by date, confirmDialog | PARTLY | Link "Release the garments with the balance due…" opens `HandoverModal release`; "Who took them" is required; pay-by date is optional in the modal (`HandoverModal.tsx:50`) and on the server (`OrderDeliveryController.php:262` nullable); no confirmDialog | Make `pay_by` required (modal + server), add confirmDialog |
| Card line: Ready since · Fitting required · Balance · "0 of 20 handed over" + one next button | MISSING | Card shows balance, "Picked up · ₱x due by …" for released orders (`BoardCard.tsx:40-41,64`); no ready-since, fitting, handover count (list payload has no handover sum), no next button | Add `handed_over` to the list payload; build the line |

Hidden rules / small details (P5)
- `ready_for_fitting` is refused when the requirement is `none` and refused unless the order came from `ready_for_pickup` (`OrderReadiness.php:255-259`); `balance_handover` from `final_adjustments` is refused (`:272-274`).
- Fitting requirement can be changed by owner/manager at any time before the order closes (`OrderRulesController.php:34-52`), including mid-fitting.
- Handover rows cannot exceed what remains (`OrderDeliveryController.php:265-270`); garment count uses `people_count` for group orders (`JobOrder.php:397`).
- Payment methods other than cash stay pending until verified, so the balance only drops on verification (`JobOrderController.php:1520-1560`); an unverified GCash payment keeps the order from completing.
- "Report an issue" at handover re-opens the order into Fixing (`DeliveryActions.tsx:72`); `fitting_issue` clears `fitting_passed_at` (`OrderDeliveryController.php:138`).

### P6 Done

| Plan item | Status | Evidence | What to change |
|---|---|---|---|
| Read-only: no reopen, no change of price/payments/discount/stages | PARTLY | Server closes gated orders (`OrderReadiness.php:182-184`), payment edits refused (`JobOrderController.php:1876`, `:1726`), pay/discount cannot exceed a zero balance. Not gated: repairs and old orders can still change status. `rejectPayment` still works on a completed order and reopens a balance (`JobOrderController.php:1905-1909`). UI still shows Prev/Next, hold, cancel and "Move to stage" on a completed order (`TimelinePanel.tsx:54-90`) | Hide stage controls when `completed`; decide about payment rejection **Built 2026-10-22:** `page.tsx` `readOnly = status === 'completed'` hides the header Save / Discard / "Saved" (`detail/JobDetailHeader.tsx`), notes, progress / completion photo upload and remove (`JobProductionTimeline.tsx`, `production/ProgressPhotos.tsx`, `production/CompletionPhoto.tsx`), the ETA and customer-material fields (`JobProductionAside.tsx`), the spec table, customization notes, team ticks and cut-sheet notes (`JobOverviewTab.tsx`, `spec/SpecReadOnly.tsx`, `JobRosterCard.tsx`, `JobCutSheetCard.tsx`), measurement editing (`JobMeasurementCard.tsx`), and every Request step button (`PreStepsSection` / `PreProductionList` / `PreStepRow` `readOnly`). Stage controls were already gone. Payment rejection on the server is unchanged (open). |
| Allowed: print receipt / statement, view | EXISTS | `printInPlace('/print/jobs/{id}/receipt')` in `financials/FinancialStatementSummary.tsx:46`, `PaymentItemRow.tsx:104`; only on the Payments tab (owner/manager) | Staff have no print on Done **Built 2026-10-22:** unchanged on purpose: print receipt / statement and photo viewing stay (owner / manager, Payments tab); staff still have "Print work ticket" in the menu. |
| Only way out: New follow-up order (existing, pre-filled, linked via notes) | EXISTS | `board/newOrderHref.ts:88-124` (customer, service, design, measurement, size, quantity, note "Follow-up to Order #…"); link in the "…" menu for owner/manager at any status (`detail/JobMoreMenu.tsx:48`, `[id]/page.tsx:148`) | Not limited to Done orders; staff do not get it **Built 2026-10-22:** the menu item shows on completed orders only (owner / branch manager) and opens `detail/FollowUpOrderPanel.tsx` (`useFollowUpOrder.ts`); `newFollowUpOrderHref` now also sends `follow_up_of=<id>`, which `form/useJobCreateForm.ts` -> `form/submitJobOrder.ts` sends as `follow_up_of_id`. |
| Shop's mistake → follow-up created in Confirmed at ₱0 (create with `follow_up_of` + `shop_fault=true`) | MISSING | No `follow_up_of`/`shop_fault` on job orders. `parent_order_id` already means "same group/batch" (`OrderBatches.php:47,159,239`; fillable `JobOrder.php:138`; `BatchSummaryCard`, quotation text "Batch n of m", tracker `JobOrderTrackingController.php:60`): reusing it would put follow-ups inside the batch cards. Creation is always `pending` with `uses_confirmation_flow` (`JobOrderController.php:813`); `StoreJobOrderRequest` requires `total_amount` and `balance` and takes no status. A Confirmed order also needs `quotation_status=final`, specs approved, customer approved, terms locked, `confirmed_at`, `production_authorized_at` (`OrderReadiness.php:122-163`, `OrderFlowController.php:288-331`) | New column (for example `follow_up_of_id`), server-side stamping of all of those, owner/manager only **Built 2026-10-22:** migration `S:database/migrations/2026_10_22_110000_add_follow_up_of_id_to_job_orders.php` (nullable FK, nullOnDelete, index); `JobOrder` `$fillable` + `followUpOf` / `followUps`; `StoreJobOrderRequest` accepts `follow_up_of_id` (same shop); `JobOrderController::show` loads `followUpOf` and `followUps` (with a `free_fix` flag) and `index` adds `last_handover_at`; `S:app/Http/Controllers/Api/V1/OrderFollowUpController.php` + `POST /stores/{store}/jobs/{jobOrder}/free-fix` (completed order only, owner / branch manager, audit `job_order_free_fix`) creates the order at ₱0 in Confirmed with the quotation written by `OrderQuotation::apply`; `JobOrderPurger` clears `follow_up_of_id`. Client: panel above, header chip in `detail/JobHeaderChips.tsx`, `readiness/FollowUpLinks.tsx`. Decided: the plan's wording "create with `follow_up_of` + `shop_fault=true` in `store()`" became its own endpoint (resolution 10 allowed either); there is no `shop_fault` field on orders. |
| Customer's request / repeat order → normal new order in Request | EXISTS | Same link; created `pending` (`JobOrderController.php:813`) | None **Built 2026-10-22:** the panel's **Create order** opens the same pre-filled form (`detail/FollowUpOrderPanel.tsx`). The Done board card is `board/DoneFacts.tsx` ("Handed over Oct 22 · Paid ₱X", money owner / manager only, no button) selected by `board/CardFacts.tsx`. |

Hidden rules / small details (P6)
- `completed` stamps staff stage completion (`JobOrderController.php:1363`).
- Archive (soft delete) is refused once any payment exists (`:2195`); a new `destroyPermanently` route is being added by the other session.

### P7 Cross-cutting

| Plan item | Status | Evidence | What to change |
|---|---|---|---|
| Steps tab shows the current column's steps, earlier columns folded with "done" | PARTLY | `readiness/OrderReadinessTab.tsx:64-90`: before start, the pre-steps are open; after start the delivery panel shows, pre-steps are folded in a `<details>` with "x of 7 completed" (`PreStepsSection.tsx:24-34`), Work and Materials cards sit beside. Confirmed 1-2 + Start are inside the 7-step list; Ready steps are the delivery panel, not a numbered 1-4 | Rebuild per column once the server steps change **Built 2026-10-22:** one rule: `readiness/stepsColumn.ts` names the order's column; `readiness/OrderReadinessTab.tsx` opens that column and folds every earlier one with its count through `readiness/ColumnFold.tsx` (Request via `PreStepsSection`, Getting ready via `FoldedColumns.GettingReadyFold`, Being made via `WorkSection`, Hand over via `FoldedColumns.HandOverFold` once completed). Request 6 of 6, Getting ready 2 of 2, Being made 4 of 4, Hand over 4 of 4. |
| Board cards per column as above | PARTLY | See R5 and P1-P5 card rows | **Built 2026-10-22:** every card is order no. · rank, customer, item, one status pill, facts, due, money, at most one button. `board/BoardCard.tsx` now delegates the facts to `board/CardFacts.tsx` (Request, `ConfirmedFacts`, `MakingFacts`, `ReadyFacts`, `DoneFacts`); `board/ConsultationCard.tsx` was reordered to the same shape (when, customer, item, status pill, facts, button). |
| Mobile tabs include Consultation | PARTLY | Tab exists only when at least one consultation is waiting (`board/SimpleBoard.tsx:41-48`); table view uses a banner, not a lane (`app/dashboard/jobs/page.tsx:57`); stage filter pills have no Consultation | Always show the tab (or say "empty") **Built 2026-10-22:** `board/SimpleBoard.tsx` always has the Consultation tab and lane (count 0 shows "No orders"); `board/BoardLane.tsx` `hideWhenEmptyOnWide` keeps an empty one off wide screens. |
| Docs: update `docs/STATUS.md` and this cross-check when a phase ships | MISSING | `docs/STATUS.md` has no entry for this plan | Add when P1 ships **Built 2026-10-22:** `docs/STATUS.md` has "Job board flow, column by column" with the two migrations to run (`status_before_hold`, already run; `follow_up_of_id`, new). |

### Server rules the plan does not mention but that block its buttons

- Status moves are one shared endpoint `PUT /jobs/{id}` (`JobOrderController.php:1069`); only `confirmed`/`cancelled` need a money role (`:1113`). Every other move is open to staff, so P4's "only these jumps" must be enforced in `transitionError`.
- Deposit gate applies on moves into any production status until `production_started_at` exists (`:1144`), using the order's own policy (none/full/percent).
- `awaiting_materials` can only be entered from `confirmed` (`OrderReadiness.php:203-205`); `confirmed` from `awaiting_materials` needs materials ready (`:197-199`).
- `final_adjustments` needs an open or awaiting correction (`:261-263`); leaving it for `qc_ironing` needs none open (`:242`).
- `ready_for_pickup` and `balance_handover` need `qc_passed_at` (`:245,266`); QC and fitting stamps are cleared when the order goes back into production, QC or Fixing (`JobOrderController.php:1269`).
- Entering `ready_for_pickup` again re-sends the "ready" notification, restarts the unclaimed clock and may add a fitting fee or be blocked by the shop's fitting limit policy (`:1204,1388,1414`).
- Held orders: gate set depends on `production_started_at`/`confirmed_at` only (`OrderReadiness.php:172`).
- Rejecting a pending order needs a reason and ignores payments (`JobOrderController.php:2019-2034`).
- Accepting a request is optional in practice (saving a quotation accepts it).
- Cancelling cancels the order's open fitting visits (`:1338-1346`); refunds are recorded separately and never move money (`OrderRefundController`).
- Branch scope: staff and branch managers pinned to a branch are refused on other branches' orders (`ChecksOrderAccess.php:23-29`); the list is also pinned (`JobOrderController.php:592`).
