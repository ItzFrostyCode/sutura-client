# Plan — ordering flow for Friday: booking → consultation → production order (online and walk-in)

Status: **coded 2026-10-21 (not committed, screens not browser-checked)** — what was built and what was left out is at the end of this file (fifth version, 2026-10-20). Code beats this file. Scope: a **tailoring shop** (sewing, alteration, repair). No printing, sublimation or embroidery step. Nothing on the `PRD.md` out-of-scope list (no payment gateway, no inventory, no logistics).

## Dates and rules for this work

| When | What |
|---|---|
| **Fri 2026-10-23** | The adviser checks the **ordering flow** and decides whether it can be deployed. Everything in "Friday" below must work by then. |
| 2nd week of Nov | Mock defense |
| Mon 2026-11-16 | Exam |
| Fri 2026-11-20 | Final defense |

- **No commits** until the coding in this plan is done **and** the owner (Joshua) has checked it and says so.
- Claude does not open the browser: after each step Claude lists the screens and widths to check; the owner checks them.
- Shop dashboards are **desktop-first** (`PRD.md`); customer screens follow the mobile / tablet spec in `AGENTS.md`.

## The flow this serves

**Online:** customer books → shop approves → customer arrives → consultation → production (job) order → price → customer accepts → deposit → production → quality check → fitting if needed → handover → completed.
**Walk-in:** customer at the counter → consultation now (no booking, name optional) → the same from production order on. A quick repair may skip the consultation and go straight to a production order.

## Decisions already made

| Question | Answer |
|---|---|
| Size of an order | By **how many people**: 1 = Solo (no people list), 2 = Duo, 3 = Trio, 4–9 = "N people", a **group order** from the service's minimum (usually 10; the line is the service's own minimum when above 1, otherwise 10). 2+ people get the people list (name, style, measurements). |
| Service / design rules | **Defaults, not walls.** Shown as "usually …"; the owner / branch manager can override on an order with a reason. The minimum quantity is a warning, never a block. |
| Payment of a group | (1) a trusted leader pays everything at pick-up; (2) the leader takes the garments and collects from the group → release with balance due; (3) everyone pays separately → split into batches (**after Friday**). |
| Discount | Manual, owner / branch manager only (already built). |
| Design approval | No proof system. The shop records "Design approved by the customer" with a note. |
| Combos, feasibility field, production steps | No combos (removed 2026-10-16); feasibility dropped (accept / decline with reason exists); production steps unchanged. |

## What the code already does (checked 2026-10-20)

- The order of steps already fits: specs approved → measurements verified → price final → customer accepts → deposit → authorize → production (`OrderQuotation::finalizeBlockers`, `OrderReadiness::startBlockers`).
- Appointment ↔ order are linked both ways (`appointments.job_order_id`, `job_orders.appointment_id`); Done offers Create Job Order; staff may open an order for a walk-in without an appointment.
- Creating a visit needs a customer (`customer_id` required); the form is titled "Schedule Walk-in Appointment".
- The Create Job Order recap shows the customer's note and the shop's fitting note, **not** the notes typed during the visit (`visit_notes`), and nothing is copied onto the order.
- The minimum quantity **blocks** in `JobOrderController::store`, the customer's bulk order and online booking. Measurement and fitting rules are copied onto the order with no way to change them there (only the deposit has an override, the deposit waiver).
- A team order is stored with `quantity` 1 while the handover counts `quantity`.

## Friday — must work by Thursday night (in this order)

| # | Step | Server | Screens | State |
|---|---|---|---|---|
| F1 | **Trusted customer** | Done: migration `2026_10_20_190000`, `PUT /customers/{id}/trusted` (owner / branch manager), new orders of a trusted customer start with no downpayment + a `deposit_waived` audit entry (so "require it again" works). To do: test with a rolled-back order and role checks. | Toggle on the customer page (owner / manager), "Trusted" chip in the list, a line in Create Job Order: "Trusted customer: no deposit, the full amount is paid at pick-up". | server done |
| F2 | **Consultation first + design source + notes onto the order** | "Start consultation" makes a visit that starts now; the customer is optional (a placeholder walk-in customer, renamed later). Fields: service / design, number of people, **design source** (`shop_design` · `customer_ready` · `customer_redo` · `none`, with file / link), fabric, notes (`visit_notes`) saved as they type. Create Job Order: the recap shows `visit_notes`; the notes, answers and design source are **copied onto the order** ("Consultation notes"); "This is an existing customer" moves the consultation to the real customer and removes an empty placeholder. Booking: "I have my own design" + link / photos. | Appointments: "Start consultation" and "Schedule a visit" buttons; consultation screen = visit detail with notes first; order page and work ticket: a "Consultation notes" block with the design source. | |
| F3 | **Order rules are defaults** | Minimum quantity → warning (owner / manager continue; the shop confirms online requests anyway); keep the guard that stops a single-piece order on a bulk service, pointing to the bulk form. Per-order override of measurements (shop · customer gives them · not needed), fitting (required · optional · none), payment (deposit % · full · at pick-up), with a reason in the audit log; replaces the separate deposit-waiver button and keeps its log format. | Services / designs worded "Usually …"; booking and Create Job Order show the warning + "Continue anyway"; order page: an "Order rules" card (service value beside the order's). | |
| F4 | **Number of people** | The people list decides the size (1 = solo, 2+ = list). For orders created **after this change**, size and handover count the people, not `quantity`; older orders keep counting `quantity` (no order has a roster today). Size label derived (solo · duo · trio · "N people" · group). | Create Job Order asks "How many people?" first; the label on the order and the board; handover and tracker show "x of N people". | |
| F5 | **Release with balance due** *(if time Thursday)* | Owner / manager release on the handover: who took it, how many people / pieces, note, optional "pay by" date. The order stays open ("Handed over · balance due"); Completed still needs balance 0. Audit entry. | A link under the handover button (not a second filled button); "balance to collect" on the board; tracker: "Picked up · balance ₱… still to pay". | |
| F6 | **Friday check** | HTTP walkthrough with rollback of both flows (online and walk-in) end to end, and the role checks (customer, owner, branch manager, staff). List the migrations to run on deploy (`2026_10_20_090000`, `_120000`, `_150000`, `_170000`, `_190000` + any new). Check the new migrations for MySQL-only syntax, because deployment targets Supabase (Postgres). Update `STATUS.md`, `ORDER-FLOW.md`, `PRD.md`. | A screen checklist for the owner. | |

## After Friday (before the mock defense)

| # | Step | Notes |
|---|---|---|
| L1 | **Order page header: one main button + "⋯ More"** | Earlier if the current header overlaps when the adviser looks at it. Desktop first; a bottom action bar on phones. |
| L2 | **Styles** | A select-type column with options in both places: the service's `roster_fields` (customer bulk form) and the shop's team table; counts on the order ("12 polo · 5 with jacket"). |
| L3 | **Split into batches + overall totals** | Largest step (money moves). Rules below. Until then a second batch can be made with the existing "New follow-up order". |
| L4 | **Discount reason** | Optional note with the discount; on the receipt and in the audit log. |

### Rules for splitting into batches (L3)

- 2 or more people only. A payer becomes a **linked order** (`parent_order_id` + `batch_no`, suffix `…-B`), with its own total, deposit or full, due date, handover and tracking code; planned tailors copied; no "new order" alerts.
- The customer stays the leader; each part shows "Paid by [name]"; My Orders groups the batches.
- Only unpaid people move out; payments never move; blocked if verified payments would exceed the new total.
- Price of a part: equal share per person, editable; discount shared in proportion; the parts add up to the original.
- If the customer already accepted the price, the parts copy the acceptance and locked terms, with a quotation version "Split into batches" (the answer is not voided).
- Overall totals are worked out from the linked orders (Total, Discount, Grand total, Paid, Balance, one row per batch; cancelled ones drop out); they gate nothing. A guest code sees only its own batch; staff see no prices.

## What was built (2026-10-21) and what was left out

Built: F1 trusted customer · F2 consultation first + design source + notes onto the order + booking choice · F3 order rules (minimum warning, per-order rules with reason) · F4 number of people · F5 release with balance due · L1 order header "More" menu · L2 styles · L3 split into batches + overall totals + customer / guest views · L4 discount reason on the receipt. API paths were tested over HTTP (data removed afterwards); no screen was opened in a browser.

Left out on purpose: the **customer-facing bulk form** does not render service roster columns (so the Styles dropdown is shop-side only); a **bottom action bar on phones** (the stage actions stay in the Steps tab); an **overdue-balance list** (the board card shows the pay-by date in red instead); **automatic reminders**; "Feasibility" (dropped); grouping batches under one heading in the customer's My Orders list (each batch is its own order, linked on its page).

Update 2026-10-21 (later): **staff can start a consultation** for a customer who is here now (`POST /appointments/consultation`, always starts now, no name needed, they do not pick the handler). Scheduling a visit for later stays with the owner and branch managers.
