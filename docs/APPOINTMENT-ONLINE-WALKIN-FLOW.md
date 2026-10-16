# Appointment flow — Online vs Walk-in (practical, real-world)

Written 2026-09-30 from a code audit (not from older docs). Two channels, kept separate on purpose:

- **Online** — the customer books from the site; it stays **pending** until the shop accepts.
- **Walk-in** — the customer is physically at the shop; the owner/branch manager enters it and it is **confirmed** right away.

Source files: `sutura-client/src/components/booking/**` (wizard), `sutura-server/app/Http/Controllers/Api/V1/PublicBookingController.php` (online submit), `AppointmentController.php` (walk-in create, confirm, reschedule), `app/Models/Appointment.php` (conflict + preemption rules).

---

## 1. ONLINE — three entry points, one wizard

```
A. Store Profile ──────────────┐   (branch chosen by the customer's location)
B. Service Detail ─────────────┼──► [Login / Sign up if needed] ──► Step 1 ──► Step 2 ──► Step 3 ──► Book
C. Catalog Design Detail ──────┘        context is kept in the URL
```

| Step | What the customer does | Built today |
|---|---|---|
| **Login** | Required: the booking goes on the signed-in account (the API is behind `auth:sanctum`). Returns to Step 1 with the design/service/branch intact (`?redirect=`). | Yes (`useBookingWizard.ts` auth gate) |
| **Step 1 — Visit** | Picks **Service** or **Shop** (pre-picked and locked when they came from a service, design or combo), reads the visit note and the booking policy, picks the **purpose**. | Yes (`BookingStep1Policy.tsx`). **Shop**: Consultation / Measurement / Other (with a note). **Service**: the purpose follows the service (Alteration for Alterations & Repairs, otherwise Consultation / Measurement). Fitting and Pickup are never offered: only a Production Order makes them (`kind = production`). |
| **Step 2 — Selections + date/time** | Branch (nearest preselected, "Change branch"), service **only if none is known yet**, material (own fabric or shop's), date + time, notes, the store's questions, **the service's own questions** (Services → Booking Form; required ones block Next), no payment: the first payment is the Production Order's deposit. | Yes (`BookingStep2Schedule.tsx`). No second service picker when a design or service is already the context. |
| **Step 3 — View** | Read-only summary, each block has Edit → back to the right step. | Yes (`BookingStep3Review.tsx`) |
| **Result** | Appointment is created **pending**, owner is notified. | Yes |

**Per-design settings:** none. The per-design "Appointment Configuration" was removed on 2026-09-30 (code, API and the `appointment_config` column). From a design the customer gets Consultation (30 min) or Measurement (60 min). One duration table lives on the server (`Appointment::TYPE_DEFAULT_DURATIONS`) for online and walk-in; the form does not send durations.

**Combo packages:** "Book this package" (`?package_id=`) is saved as `service_package_id` on the appointment; the package's category decides the purpose (Alteration for Alterations & Repairs, otherwise Consultation / Measurement). The job order created from it keeps the package and uses the bundle price — one order for the whole set.

**Service questions → job order:** answers to a service's questions are saved on the appointment (`answers`) and pre-fill the job order's custom fields when the shop creates the job from that appointment.

---

## 2. WALK-IN vs a waiting online request

```
Online request (pending)  ── waits for the shop ──►  Accept ─► confirmed
        ▲
        │  same branch, overlapping time
Walk-in arrives at the counter ─► owner enters it ─► confirmed at once
```

What the code does now (`Appointment::preemptByWalkIn`):

0. **The owner chooses each time (2026-10-16).** The first save of a walk-in over a waiting online request is refused with `409 code = pending_online_request` and the list of clashing requests. The shop dialog then sends `on_conflict`: `serve_walkin_reschedule_online` (steps 1 to 3 below happen) or `other_time` (nothing is saved; the form goes back to pick another time). A **confirmed** booking is never displaced (`409 code = slot_taken`). Staff (not owner or manager) cannot decide: they get the clash reported.
1. When the owner chooses to serve the walk-in, it **takes the slot** ("who is physically there first").
2. Every **pending** online request that overlaps is **stamped** `[Walk-in Priority] … Reschedule required.`, flagged `outcome = rescheduled`, and the customer gets a notification: *"Your slot was claimed by an in-store walk-in… choose an alternative time."*
3. The online request **stays pending** — it is not cancelled. The customer keeps waiting for the shop's answer.
4. The same happens when the owner **accepts** another request for that time: the other overlapping pending ones are preempted the same way.
5. The owner **cannot confirm** a pending request whose slot is already taken (409 "Please reschedule before confirming").

---

## 3. AFTER THE SHOP ACCEPTS — staff and customer talk

Real-world: once accepted, staff and the customer talk about **that appointment** (usually Messenger/SMS), the customer sends photos or links, and staff writes the measurements down on the phone.

| Need | Today | Gap |
|---|---|---|
| Staff sees what to prepare | Reference images/link, notes, material ("bring own fabric"), design + size/color, service — all in the appointment view. | none |
| Customer contact for the conversation | Email is shown; phone only if the customer gave one. | No one-tap **Call / SMS / copy** on the appointment. |
| Staff attaches an image or link for the customer | Only the **customer** can add reference images/link (at booking). | Staff cannot add a reference link/image to a confirmed appointment. |
| Staff records measurements on the phone | Only offered **after the appointment is completed** ("Record Measurements" → Measurements page). | Not reachable from a **confirmed** appointment; should be usable at any point after acceptance, on mobile. |

---

## 4. GAPS FOUND → BUILT (2026-09-30)

1. **Preempted customer stuck** → the customer's appointment now has **Pick a new time** (pending only; same closure / taken-slot / daily-cap / 30-minute travel-buffer rules as booking). Endpoint: `PUT /my-appointments/{id}/reschedule`. The walk-in banner and the flag clear once they move. The store is notified.
2. **Owner could not see the conflict** → the list, cards and calendar show an amber **Needs new time** badge (pending + `outcome = rescheduled`), and those requests sort to the top.
3. **Staff could not attach after accepting** → confirmed / in-progress appointments have **Share with the customer** (one link + up to 6 photos). New columns `appointments.shared_link`, `shared_images`. The customer sees it under **From the store** and is notified.
4. **Measurement only after completion** → **Record measurements** on any confirmed / in-progress appointment; opens the customer's measurement form and returns to the appointments page after saving.
5. **Contact** → **Call / SMS / Copy** (phone, or email when there is no phone) on pending, confirmed and in-progress appointments.

Still open (needs the owner's decision): who talks to the customer and takes the measurements (an "Assigned to" already exists on appointments), and the bulk vs. solo sizing rules.

Not touched by this document: order/payment flows, staff production stages.
