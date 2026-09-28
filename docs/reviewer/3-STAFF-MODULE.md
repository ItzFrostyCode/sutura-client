# Module 3: Tailoring Staff

**Formal owner:** Masudog, Clareynz June A. · **Built by:** Arabejo, Joshua Wayman A.

## Objective it answers

> **Order Tracking and Measurement Module** for real-time production monitoring, the tailoring staff will record and retrieve digital customer measurements, manage appointment-based order intake, and update garment production stages, while customers monitor their order progress from placement to pickup.

## Where staff work

Staff log in to the **same `/dashboard`** as the owner. Their menus and buttons are limited by role. There is no separate staff portal (one existed earlier and was removed).

## What staff can and can't do

| Staff CAN | Staff CANNOT |
|---|---|
| Add, view and update **measurements** | Create a new **job order** (owner/branch manager only, see gaps) |
| View job orders and **move them through production stages** | Record payments, apply discounts, reject payments |
| Upload **progress photos** | Assign or reassign staff |
| Tick off **roster pieces** as done on bulk orders | Delete or restore job orders |
| View and update **appointments**, mark them complete | View analytics/reports |
| Create a **follow-up appointment** (e.g. next fitting) | Manage services, catalog, staff accounts or billing |
| Record **walk-in ready-to-wear sales** | Create a new appointment from scratch (owner/manager only) |
| Look up and add **customers** | |
| View services, the staff list and branches | |

## Measurements

- One **measurement profile** per customer per garment purpose (e.g. "Wedding Barong"), with **versions**: a new version is kept each time it changes, so the history isn't lost.
- The chart is grouped into **Upper Body** (bust, chest, shoulder, neck, sleeve, back length) and **Lower Body** (waist, hips, inseam, thigh). Shops can add **custom fields** with their own names.
- The **full chart is shown while entering**, but after saving **only filled-in fields are displayed**.
- Customers can **view** their measurements but never edit them. Thesis: *"manually encoded by authorized users."*

## Production stages and staff assignment

Staff are assigned **per stage**: design, pattern making, cutting, sewing, QC/ironing.

| Real situation | How the system handles it |
|---|---|
| One tailor does everything on a custom order | The same person is assigned to every stage. |
| Five tailors sew the same batch at once | Several staff can be assigned to the same stage of one job. |
| Jersey batch with names | Each person on the roster has a done checkbox ("12/30 completed"). |
| Not everyone uses a phone at work | Any staff or owner account can update any job, so a floor lead can update for everyone in batches. |
| Some staff have no SUTURA account (plan limit) | The job's stage still moves forward; the customer only sees stages. Only named staff show in the productivity report. |

- **Ready for Fitting** automatically creates a fitting appointment for the customer.
- **QC/Ironing** is the quality check. Moving the job to **Ready for Pickup** notifies the customer.
- A **completion photo** can be added at QC. It's optional; a required-photo rule was tried and reverted at the shop owner's request.
- Staff get an **in-app notification** when they're assigned to a stage.

## Customer-supplied material (`customer_material_status`)

Shown only when the customer brought their own fabric. It's a record of **what happened to someone else's property** while the shop holds it.

| Value | Example |
|---|---|
| **Safe** | At the shop, fine, being worked on. The normal state. |
| **Damaged** | Stained, or cut wrong. |
| **Lost** | Missing, or mixed up with another order. |
| **Returned** | Given back unused (order cancelled, or not enough fabric). |

- It's set on the job's **Production tab** ("Customer's Material"). It starts as "Not tracked," so it's optional.
- The customer sees it on their tracker **only when it's not "Safe."**
- It **does not compute compensation or refunds**. That stays a human decision between shop and customer.
- It **does not count fabric**, so it's not inventory: one note about one customer's own item, like a claim stub.

**If asked:** "When a customer leaves their own fabric, the shop is responsible for it. This field records its condition and shows it to the customer if something goes wrong. It's for transparency and accountability; the system doesn't calculate liability."

## Staff productivity (what's measured)

Jobs handled, jobs completed, completion rate, and average **adjustment rounds** (how often work needed redoing). **No money per person**, so it can't be read as a pay or commission basis.

## Deliberately out of scope

- Payroll, wages, attendance.
- Materials usage logging (removed 2026-09-27).
- Hardware measuring tools.

## Likely panel questions

**Q: How does a staff member know what to work on?**
A: They get an in-app notification when assigned to a stage, and the job's cut sheet shows the design, the customer's reference photos (full screen on tap), measurements, fabric source and tailor notes. It also prints as a work ticket.

**Q: How are updates "real-time" for the customer?**
A: When staff change a stage, the customer's tracker shows the new stage the next time they open it, and key stages (fitting, ready for pickup) send a notification.

**Q: Why can't staff take payments?**
A: Money is a supervisory responsibility. Only the owner or branch manager records, discounts or rejects payments, which protects the shop from errors and fraud.

**Q: What if the tailor isn't comfortable with a phone?**
A: One person, like the floor lead or the owner, can update stages for the whole team. Assignment still records who did the work.

**Q: Why keep old measurement versions?**
A: Bodies change between orders. Keeping versions means a new order doesn't overwrite what was used on an earlier garment.

## Known gaps (be honest if asked)

- **Staff can't create job orders.** The thesis scope says *"tailoring staff can create job orders directly from scheduled fittings,"* but in the system only the owner or branch manager can. Either give staff this permission or reword the scope line before defense.
- **No "My Assigned Jobs" filter** for staff yet. The server already supports filtering jobs by assigned staff; the dashboard toggle isn't built.
- **No "pieces finished" counter** for bulk orders that only have size counts (no names).

## Thesis paper vs system

- The paper's use case says staff log in to "their dedicated portal." The system uses one shared dashboard with role limits.
- The paper's ERD has `TailoringStaffProfile`. The system uses `StaffProfile`.
- The paper lists "Accepted, Cutting, Stitching, Ready for Fitting." The system's stages are listed above.
