# SUTURA — Product Requirements (PRD)

> Distilled from the approved thesis (`suturathesisapproved.txt`, `Title&Objectives.md`) and checked against the code on **2026-10-29** (roles re-read from `routes/api.php`). If this file and the code disagree, **the code wins** — then fix this file. Full thesis-vs-code audit: [`THESIS-CROSS-CHECK.md`](THESIS-CROSS-CHECK.md).

**SUTURA: A Web-Based Tailoring Shop Tracker System** — BSIT capstone, STI College Davao. A subscription-tiered (Basic / Pro / Premium), multi-branch platform for tailoring shops in **Davao City**: customers find a shop by garment type and map location, book a fitting, and track production; shops run appointments, job orders, measurements, payments and analytics.

## Roles

Role strings are exactly what `RoleSeeder` creates and what `role:` middleware checks.

| Role | Who | Can (from `routes/api.php`) | Cannot |
| --- | --- | --- | --- |
| `admin` | System Admin (`/admin/login`) | Approve/reject shop applications, suspend/reactivate accounts, verify branch map pins, approve custom apparel types, manage plans + upgrade requests, support tickets (shop **and** customer), moderation (warn → hide design → hide shop), platform reports, system-health panel, platform audit log | — |
| `store_owner` | Shop owner | Everything for their own store(s): profile, branches, staff, **services + designs (only the owner writes these)**, payments, analytics (incl. branch comparison, staff productivity), audit log, special hours, posts, billing | Other stores' data |
| `branch_manager` | Manager of one branch | Staff (own branch, never promote to manager), **create and run job orders** (quote, confirm, cancel, split into batches, free-fix follow-ups), payment verify/reject/discount, appointments (schedule / start a consultation / reject / assign), mark a trusted customer, change one order's rules, release garments with a balance due, edit own branch, store `/analytics`, SMS, statements. Services and designs: **view only** | Edit services/designs, audit log, cross-branch analytics, billing, add/delete branches, special hours, posts |
| `staff` | Tailoring staff | Appointments (view/status/follow-up, **start a consultation for a customer who is here now** — name + mobile required), view and progress their branch's jobs (production Next/Back/Hold/Resume, quality check, "Needs a fix", fitting moves, record a handover, progress photos, production notes), measurements look-up, customers, walk-in catalog orders, services read-only, support tickets | **Create** job orders, quote/confirm/cancel/archive, pay / discount / verify / reject, mark trusted customers, change an order's rules, split an order, release garments with a balance due, schedule appointments for later, analytics. **The API never sends staff any money field** (`JobOrder::hideMoney()`: totals, balance, discount, rush fee, quotation, payments, refunds) |
| `customer` | Any signed-in user | My orders / appointments / measurements, book a consultation (the booking offers no *Measurement*), reviews (after a completed order or appointment), saves, support tickets (can file their own), notifications, send payment proof | Any role-gated shop-dashboard route (`role:` groups under `/stores/{store}/…`) |
| *guest* | No login | Browse/search/map, public storefronts, track an order by tracking code (`/track/{code}`), booking endpoint (throttled) | Everything else |

There is **no separate staff portal** — owner, manager and staff share `/dashboard`, gated by role. Do not rebuild one.

## Objectives (thesis, 7 bullets in `Title&Objectives.md`)

1. **Administrative Dashboard** — shop registration approvals, apparel-category validation, branch map-location verification, platform oversight.
2. **Subscription & Account Management** — Basic/Pro/Premium enrollment, role-based staff access, keep subscription valid for visibility.
3. **Shop Discovery & Search** — filter by garment type, location, specialization; full shop profiles.
4. **Map-Based Interface** — verified branches on a Davao City map, filter by area, directions.
5. **Tailoring Shop Dashboard** — profile, service catalog, itemized pricing, appointment schedule, public visibility.
6. **Order Tracking & Measurement** — staff record measurements and move production stages; customers follow progress from placement to pickup; automated notifications.
7. **Interactive Analytics** — admin: subscription activity, total shops, platform revenue; owner: monthly sales, outstanding balances, staff productivity, completion rates.

## Explicitly OUT of scope

From the thesis *Limitations of the Study* (lines 195–205 of `suturathesisapproved.txt`) plus later team decisions. If a request touches one of these, **name it as scope creep and stop** — do not build it.

| Out of scope | Source |
| --- | --- |
| Hardware integration (machinery, body scanners, RFID, digital measuring tools) — measurements are always typed in by authorized users | Thesis |
| Offline mode / background sync — internet is required | Thesis |
| Native payment-gateway integration; external reconciliation. Payments are **tracked** (customer pays outside SUTURA, sends proof, owner verifies) | Thesis |
| Predictive analytics, AI forecasting, advanced BI — reports are descriptive only (so no "forecasts" wording either) | Thesis |
| Utility-cost / equipment-maintenance tracking | Thesis |
| Payroll, salary or attendance-based wages | Thesis |
| Inventory, fabric/material stock monitoring, purchase orders, supplier and procurement processes — materials are only a ready / waiting check (see difference 5) | Thesis |
| Tax-filing automation, business-permit validation | Thesis |
| Logistics, courier routing, delivery management | Thesis |
| Rental lifecycle (available → rented → returned → cleaning) — appears in interview research only | Team decision |
| Per-order material lists (needed / bought / cost / supplier) — built 2026-10-10, **removed the same day** after an audit against the Limitations (also removed earlier on 2026-09-27) | Team decision |
| Per-staff revenue — productivity shows work output only (jobs, completion rate, rework), never money per person | Team decision |
| Subcontracting / outsourced jobs (`is_outsourced`, `partner_store_name`, `outsourcing_cost`) — removed 2026-09-27 | Team decision |
| Duplicate service, service sale price, service trash/restore, owner replies to design reviews, per-design appointment config — removed 2026-09-30 | Team decision |
| **Combo packages** (`ServicePackage`, `service_package_id`, package reviews) — built 2026-09-30, **dropped 2026-10-16** (`2026_10_16_300000_drop_combo_packages`). One order is for one service or design; "more than one service in a visit" is linked orders (`group_kind = set`), not a bundle price | Team decision |

## Intentional differences from the thesis (be ready to explain at defense)

1. Shared `/dashboard` instead of a dedicated staff portal.
2. Map is **Leaflet / OpenStreetMap**; "Directions" hands off to Google Maps (thesis shows Google Maps API).
3. No payment gateway: "Process Payment" / "automatic refund" become *record → verify → reconcile manually*.
4. Database: thesis says MySQL on PlanetScale; code runs MySQL locally and targets **Supabase (Postgres)** for deployment.
5. **Materials are a yes/no check, not a record.** The ordering flow asks "are the materials ready?" (ready / waiting, with a note) and, when the customer brings their own fabric, "is it suitable?" before the price is final. There is no material list, supplier, cost, stock or purchase record. Refunds use an amount the owner enters ("costs already spent that cannot be recovered"). Labor is attributed by stage plus optional planned tailors.
6. Appointment assignment and job-order production attribution are separate by design (attribution is automatic when staff move a job into a stage).
7. No `CustomerProfile` table (customers are `User` + `customer` role); feedback is split across `StoreReview`, `CatalogItemReview` and `ServiceReview` instead of one `feedback` table.
8. **Consultation first, then an order.** A visit (online booking or "Start consultation" at the counter) is its own record; an order is made from it (`job_orders.appointment_id`). Online customers book a consultation, not an order; the shop quotes and confirms. Measurements are recorded on the job order, not at the appointment.
9. **Order rules are the service's defaults**, snapshotted onto each order (measurement / fitting / payment policy), and the owner or branch manager can change them for one order with a reason (audit-logged). A "trusted customer" starts with no downpayment, but the balance is still collected before handover unless the shop releases the garments with a balance due.
10. **Group orders:** a team order can be split into linked batch orders (`parent_order_id`, one per payer); a completed order can have a follow-up (`follow_up_of_id`), including a ₱0 "shop's mistake" free fix.

## Working rules for AI agents

- Check this file's out-of-scope table before proposing any "nice to have".
- Match the **narrowest** role set that needs an endpoint; copy the reasoning comments already in `routes/api.php`.
- Customer-facing UI follows `AGENTS.md` (mobile 320–599 px, tablet 600–1023 px); shop dashboards are desktop-first.
