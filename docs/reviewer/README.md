# SUTURA Defense Reviewer

A study guide for the capstone defense, split into one file per module. Each file explains what the module does in plain language, maps it to the thesis objectives, lists what is deliberately out of scope, and gives likely panel questions with suggested answers.

Checked against the actual code (not the thesis paper) on **2026-09-27**, branch `claude/festive-allen-3of2f6` in both repos. When the paper and the code disagree, the code is what the panel will see in the demo, so this reviewer follows the code and notes each difference.

| # | File | Module | Formal owner |
|---|---|---|---|
| 1 | [1-CUSTOMER-GUEST-MODULE.md](1-CUSTOMER-GUEST-MODULE.md) | Customer & Guest | Bulotano (built by Arabejo) |
| 2 | [2-SHOP-OWNER-MODULE.md](2-SHOP-OWNER-MODULE.md) | Shop Owner | Arabejo |
| 3 | [3-STAFF-MODULE.md](3-STAFF-MODULE.md) | Tailoring Staff | Masudog (built by Arabejo) |
| 4 | [4-ADMIN-MODULE.md](4-ADMIN-MODULE.md) | System Administrator | Bongo |

## The one-sentence pitch

SUTURA lets Davao City customers find a tailoring shop by garment type and location, book an appointment, and follow their garment through production to pickup, while the shop manages orders, staff, payments and reports in one dashboard.

## Objectives at a glance

| Objective (thesis) | Main module(s) |
|---|---|
| 1. Administrative Dashboard | Admin |
| 2. Subscription & Account Management | Shop Owner (register, plan, staff), Admin (approve, plans) |
| 3. Shop Discovery & Map-Based Navigation | Customer & Guest |
| 4. Tailoring Shop Dashboard (storefront) | Shop Owner |
| 5. Order Tracking & Measurement | Staff (record/update), Customer (monitor) |
| 6. Interactive Analytics Dashboard | Shop Owner (shop reports), Admin (platform reports) |

**Numbering trap:** the approved paper has these **6** objectives (Discovery and Map merged into one). The older `Title&Objectives.md` has **7** (Discovery and Map separate), and `TASK_DIVISION.md` and the panelist's feedback use that 7-number version, where "Objective 4" is the Map and "Objective 7" is Analytics. Always name the objective ("the Map-Based Navigation objective"), not just its number.

## Scope rules that apply to every module

These are the thesis Limitations. If a panelist suggests one of these, the answer is "deliberately out of scope."

- No hardware (body scanners, RFID). Measurements are typed in by authorized staff.
- No offline mode.
- No payment gateway. The system records payments and deposits; it never moves money.
- No predictive analytics or AI. Reports are descriptive only.
- No utility-cost tracking, no payroll or wage calculation.
- No inventory, material stock, or purchase orders.
- No tax filing or permit validation.
- No logistics, courier, or delivery. Pickup at the shop only.
- Rental (rent, return, inspect, clean) was never adopted into scope.

Features removed from the code on 2026-09-27 because they came too close to these limits: the per-order **materials log** (fabric quantity × cost), the **outsourcing** fields (subcontracting to a partner shop), and **per-staff revenue** in the productivity report.

## Fix these in the thesis paper before defense

These are errors in the paper itself, found during review. A panelist reading the paper beside the demo can catch them.

1. **Use-case numbering.** Two diagrams are both called "the third use case diagram" (Tailoring Staff and Shop Owner), no diagram is called "second," and the page numbers run 61 → 63 → 62 → 63.
2. **"Five specialized modules" lists four** (Data Model section): Administrative, Subscription and Account Management, Order Tracking and Measurement, Appointment.
3. **ORDER_MATERIAL table** (Data Dictionary #11, `logMaterialUsage()`) contradicts the Limitation that excludes material stock tracking. The code no longer has it; remove it from the ERD, class diagram and data dictionary.
4. **Payment Gateway API and "Issue Automatic Refund"** in the Order Tracking use case contradict the Limitation that excludes payment gateways. Reword as "record payment" and "mark as refunded."
5. **SMS notifications** are promised throughout (credentials, stage changes, appointment confirmations). The system sends in-app notifications, plus email only for shop registration decisions and moderation notices. Replace "SMS" with "in-app notification."
6. **CustomerProfile, TailoringStaffProfile and a single Feedback table** appear in the ERD. The real system uses `User` + role for customers, `StaffProfile` for staff, and separate review tables. Update the ERD or be ready to explain.
