# Module 2: Shop Owner

**Owner:** Arabejo, Joshua Wayman A.

## Objectives it answers

> **Tailoring Shop Dashboard** for storefront management, the shop owner will configure their digital profile, manage service catalogs and apparel specializations, set itemized pricing, handle appointment schedules, and control their public platform visibility.

> **Subscription and Account Management** … the tailoring shop will register on the system, select from Basic, Pro, and Premium subscription plans, manage role-based staff access, and maintain active subscription validity for continued platform visibility.

> **Interactive Analytics Dashboard** … shop owners can track monthly sales performance, outstanding customer balances, individual staff productivity, and order completion rates.

## Roles inside a shop

| Role | Can do |
|---|---|
| **Shop Owner** | Everything, including staff, services, catalog, billing and settings. |
| **Branch Manager** | Owner-like day-to-day control: create job orders, record payments, discounts, assign staff, appointments, analytics. Cannot manage staff accounts, services or billing. |
| **Staff** | Production work. See [3-STAFF-MODULE.md](3-STAFF-MODULE.md). |

All three use the **same `/dashboard`**, with menus and actions hidden by role. There is no separate staff portal.

## What the owner manages

| Area | What it does |
|---|---|
| **Home** | Alerts: completed-but-unpaid jobs, pending downpayments, due today, due this week. Respects the branch selector. |
| **Jobs** | Kanban board and list (Walk-in / Online / Pending review tabs). Job detail: production stages, staff assignment, pickup info, financials, cut sheet with the customer's reference photos (tap to view full screen). |
| **Appointments** | Confirm, reschedule, cancel, complete. Walk-ins are confirmed instantly. |
| **Catalog** | Catalog designs: photos, price, color, fabric, sizes, size chart, linked Service. |
| **Services** | Service title, description, categories, **pricing options**, minimum order quantity, service type. **Packages** tab for optional bundles. |
| **Payments** | Record payments, discounts, reject a bad payment, job balances. |
| **Staff** | Add staff, roles, profile, availability (limited by plan). |
| **Branches** | Multiple branches with map pins (Premium plan). |
| **Reports** | Revenue, outstanding balances, completion, staff productivity, branch comparison, unclaimed pickups. |
| **Billing** | Plan, upgrade/downgrade, billing history. |
| **Settings** | Profile, social links, hours, closures/special hours, booking policy, booking questions, max appointments per day, fitting limit and fee. |
| **Print** | Work ticket and receipt in black-and-white, ink-saving layout. |
| **Audit log** | Who deleted, restored, discounted, rescheduled, and so on. |

## Service vs Catalog Design (common confusion)

- **Service** = a **kind of work** the shop does ("Barong Tailoring", "Alteration", "Sublimation Printing"). It holds the pricing options, service type, and minimum quantity.
- **Catalog Design** = a **specific example** customers can browse (e.g. "Traditional Ivory Barong, Formal Fit"), with its own photo, color, fabric and price. It usually links to one Service.
- The customer's button on a Catalog Design is **inherited from its Service**: a bulk-type Service shows **Bulk Order**, anything else shows **Book a Fitting**. Only two buttons exist, however many categories (Men, Women, Wedding, Office…) the shop adds.
- Optional combos (Barong + Embroidery) are **Service Packages**.
- Rush, fabric source and downpayment are set **on the order**, not on the Service.

## The production pipeline (what the customer tracks)

`pending → design → pattern making (or mass cutting/printing for bulk) → cutting → sewing → ready for fitting → final adjustments → QC/ironing → ready for pickup → completed`

Plus `on hold`, `cancelled`, `rejected`. Repairs use a short pipeline: `queued → in repair → QC check → ready for pickup`.

- **Ready for Fitting** automatically creates a fitting appointment.
- **Final Adjustments** loops back to fitting if needed. After the shop's **fitting limit**, each extra fitting adds the **fitting fee** to the balance.
- **Ready for Pickup** notifies the customer. Orders left unclaimed for 14+ days are flagged.

## Money rules

- **"No DP, No Layout, No Cut":** a job can't enter pattern making or any later production stage until **50%** is paid. **Repairs are exempt by default** (paid at pickup); the owner can require it with "Require 50% downpayment for repairs" in Settings → Booking Flow.
- **Fitting limit:** the shop sets a free-fitting count, then chooses what happens after it — **charge a fee** (default), or **don't allow more fittings** (the job can't return to Ready for Fitting; it has to move forward to QC/Ironing or Ready for Pickup instead).
- **Collected amount = total − balance − discount.** A discount lowers the balance, never the total, so it's never counted as cash received.
- **Warn, don't block:** if a GCash/bank reference number was already used on another payment at the shop, the system shows a warning but doesn't block it. A person judges it.

## Subscription rules

- The plan limits the number of staff and branches (multiple branches are Premium-only).
- **Downgrading is blocked** if current staff or branches would exceed the new plan's limit.
- Customer bookings and orders are **never** blocked by plan quotas; that would hurt the shop's real business.
- **Expired subscription:** the store is hidden from customers until renewal, with reminders sent beforehand.

## Deliberately out of scope (removed or never built)

| Item | Why |
|---|---|
| Materials log (fabric quantity × cost) | Removed 2026-09-27. Too close to excluded material-stock tracking. |
| Outsourcing to a partner shop | Removed 2026-09-27. Maps to no objective; edges into logistics and expense tracking. |
| Per-staff revenue | Removed 2026-09-27. Money per person reads as a commission/payroll basis. |
| Inventory, payroll, utilities, tax | Thesis Limitations. |
| Delivery | Pickup only. |

## Likely panel questions

**Q: How does the owner control public visibility?**
A: Through the store visibility setting, subscription status (expired = hidden), and per-item pause. An admin can also hide a listing if it breaks the platform rules.

**Q: Why can't a job start without a downpayment?**
A: It's the shop's real policy ("No DP, No Layout, No Cut"). Fabric isn't cut until 50% is paid, so the shop doesn't lose material on abandoned orders. Pending and design stages are exempt because no material is used yet.

**Q: Isn't staff productivity basically payroll?**
A: No. It shows work output only: jobs handled, completed, completion rate, and rework rounds. No pay, rates or money per person are computed. The thesis scope explicitly includes "individual staff productivity."

**Q: How is revenue computed?**
A: Total amount minus remaining balance minus discount, so discounts and unpaid balances are never counted as income.

**Q: What if a customer pays with a reference number that was already used?**
A: The system warns the shop but lets a person decide, because legitimate collisions can happen.

**Q: What happens when my subscription expires?**
A: The store is hidden from customers until renewal. Existing orders and data stay. Reminders go out before expiry.

## Known gaps (be honest if asked)

- **Branches share one catalog and one service list.** Separate catalogs managed per branch by Branch Managers are not built.
- **Size-count bulk orders** (no names) have no "pieces finished" counter; named rosters do have a per-person checkbox.

## Thesis paper vs system

- The paper's ERD has `order_material`. The system doesn't (removed on purpose).
- The paper describes "Assign to Tailor" as one action. The system assigns staff **per production stage**, and several tailors can share one stage.
