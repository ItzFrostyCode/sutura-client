# Simple appointments — Online and Walk-in (steps)

Owner's decision, 2026-10-15 (Joshua; Bongo is out sick, Joshua takes this over). Tick a step only after its check ran.
Why: `docs/audits/appointment-workflow-real-life-audit.md`.

## The rule

- **Two kinds of appointment:** **Service** (for one of the shop's services, or a design or combo under it) and
  **Shop** (a general visit: Consultation, Measurement, or Other with a note).
- **Two channels, same flow:** **Online** (the customer books it; it waits for the shop's yes) and **Walk-in** (the
  shop enters it; it is already accepted). Same kinds, purposes, durations and visit steps for both.
- **The visit:** Customer arrived (one tap) → Done, with one result: **Proceed to Production Order**, **Consultation
  only**, or **Didn't come**.
- **Production is in the Production Order only.** Final measurements, quotation, the customer's approval, deposit
  (50% / full), fittings, pickup and production stages. **No payment at the appointment stage**: the first payment is
  the order's deposit after the customer accepts the final quotation, so a rejected booking never needs a refund.
- **Walk-in vs a waiting online request ("depende"):** the owner decides each time. The system shows the clash and the
  owner chooses: serve the walk-in and ask the online customer to move, or give the walk-in another time. A
  **confirmed** booking is never moved by a walk-in.

## Phase 1 — server

- [x] 1.1 `appointments.kind` (`service` | `shop` | `production`), additive migration, backfilled; reversible.
- [x] 1.2 One duration table on the server for both channels; the online form no longer sends its own durations.
- [x] 1.3 Purpose: a Service appointment's purpose follows the service (Alterations → bring the garment; Custom
  Tailoring → consultation & measurements; Uniform / Customization → consultation). A Shop appointment: Consultation,
  Measurement or Other. Fitting and Pickup can no longer be booked as appointments.
- [x] 1.4 Online booking needs a signed-in customer (uses the account, not a typed email).
- [x] 1.5 No payment taken with a new appointment (old records keep theirs).
- [x] 1.6 Walk-in vs pending online: the server reports the clash; the owner chooses (`on_conflict`).
- [x] 1.7 Accepting a booking notifies the customer (in-app, email, SMS) — the notice bug.
- [x] 1.8 A branch manager's walk-ins stay in their own branch.
- [x] 1.9 The visit: "Customer arrived" in one call; "Done" with the three results; one way to record a no-show.
- [x] 1.10 Creating the Production Order from an appointment closes the appointment (completed, converted).
- [x] 1.11 Fittings / pickups made by the Production Order are `kind = production` (not walk-ins), and a pending
  placeholder no longer blocks online customers' times.

## Phase 2 — customer booking (online)

- [x] 2.1 Step 1: Service or Shop (pre-picked when the customer came from a service, design or combo).
- [x] 2.2 No "I already have an order", Fitting, Pickup or payment step.
- [x] 2.3 The customer's own appointment page matches (kind, no payment parts for new bookings).

## Phase 3 — shop screens (walk-in + visit)

- [x] 3.1 Walk-in form: Service or Shop, same purposes, "Now" or a later time.
- [x] 3.2 The clash dialog for a waiting online request.
- [x] 3.3 Visit actions: Customer arrived → Done (three results); No-show.
- [x] 3.4 Labels: Service / Shop / Production on lists and calendar.

## Phase 4 — checks and docs

- [ ] 4.1 tsc, php -l, Pint before/after, API run-through inside a rolled-back transaction.
- [ ] 4.2 Update the audit, `APPOINTMENT-ONLINE-WALKIN-FLOW.md`, STATUS.
