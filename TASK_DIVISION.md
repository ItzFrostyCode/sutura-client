# SUTURA — Task Division by Team Member

> **Reference:** SUTURA: A Web-Based Tailoring Shop Tracker System  
> **Capstone Team:** Arabejo, Bongo, Bulotano, Masudog  
> **Institution:** STI College Davao — BS Information Technology  
> **Date:** May 2026

This document maps each team member to their primary development module based on the thesis
functional model, use case diagrams, BPMN workflows, and UI prototypes. Each member owns one
user-role module end to end: frontend UI, backend API, database schema, and integration with
the shared platform services.



## Team Assignments

| Team Member | Assigned Module | User Role | Thesis Reference |
|---|---|---|---|
| **Bulotano, Renalyn C.** | Customer Module | Customer / Consumer | Use Case Diagram Figure 5 (Page 63), Customer Dashboard UI (Page 60), Customer Storyboard Part 2 |
| **Bongo, Jossua A.** | Administrative System Module | System Administrator | Use Case Diagram Figure 2 (Page 61), Admin Dashboard UI (Page 60), Admin Storyboard Part 4 |
| **Arabejo, Joshua Wayman A.** | Shop Owner Module | Shop Owner / Tenant | Use Case Diagram Figure 4 (Page 62), Shop Owner Dashboard UI (Page 60), Shop Owner Storyboard Part 3 |
| **Masudog, Clareynz June A.** | Tailoring Staff Module | Tailoring Staff | Use Case Diagram Figure 3 (Page 63), Tailoring Staff Dashboard UI (Page 60), Staff Storyboard |

---

## Module 1 — Customer Module
**Owner:** Bulotano, Renalyn C.

### Thesis Basis
- **Use Case Diagram (Figure 5, Page 63):** Customer actor with Login, Search and Filter Shop,
  View Map Interface (Google Maps API), Book Appointment, and Track Order.
- **BPMN (Figure 13, Page 68):** Shop Discovery and Search — customer searches, filters,
  selects shop profile, places order or books appointment.
- **BPMN (Figure 14, Page 68):** Map-Based Interface — customer opens map, views pins,
  gets directions, navigates to shop.
- **Activity Diagram (Figure 19, Page 72):** Shop Discovery and Search workflow.
- **Activity Diagram (Figure 20, Page 73):** Map-Based Interface workflow.
- **Sequence Diagram (Figure 26, Page 80):** Shop Discovery and Search — Customer →
  Marketplace UI → SUTURA System → Database.
- **Sequence Diagram (Figure 27, Page 81):** Map-Based Interface — Customer → Map Interface UI
  → SUTURA System → Database.
- **UI Prototypes (Pages 60, 70–75):** Customer Dashboard, Customer Orders, Customer
  Measurements, Saved Shops, Notifications, Customer Account.
- **Storyboard Part 2 (Page 123):** Marketplace Discovery, Shop Profile and Consultation,
  Map-Based Interface, Customer Orders and Measurements.

### Owned Features

#### A. Public Marketplace & Shop Discovery
- Landing page with entry options (Browse as Guest, Login as Customer, Login as Shop Owner,
  Login as Admin).
- Search bar with live filtering across shop names, services, and garment types.
- Garment-based filtering: Filipiniana, Barong Tagalog, Uniforms, Wedding Gowns, Suits,
  Alterations, Lab Gowns, Scrub Suits, Corporate Wear, etc.
- Location-based filtering by Davao City district/area.
- Specialization tag filtering.
- Shop cards displaying: shop name, rating, specialization tags, starting price, branch count.

#### B. Interactive Map Interface
- Map canvas displaying pinned geolocation coordinates of verified shops.
- Click-to-open shop profile from map pins.
- Filter map pins by area and specialization.
- Route directions to selected shop branch (Google Maps API integration).
- Customer location pin (red) vs. shop pins (black) per thesis storyboard.

#### C. Shop Profile & Consultation
- Complete shop profile page: services, itemized pricing, gallery (Cloudflare R2), operating
  hours, branch locations, verified reviews.
- Save/bookmark shops to "Saved Shops" list.
- Request consultation or book appointment directly from profile.
- View shop ratings and read customer feedback.

#### D. Customer Dashboard
- KPI cards: Active Orders, Scheduled Appointments, Saved Shops.
- Active orders list with progress indicators.
- Appointment history and upcoming bookings.
- Saved measurements repository (view-only; measurements are recorded by staff).
- Notification feed for order updates and appointment confirmations.
- Account settings: profile update, password change.

#### E. Order Placement & Tracking
- Online order creation: select garment type, choose service, input or reference saved
  measurements, submit.
- Order detail view: order number, shop name, garment type, quantity, total cost, DP paid,
  balance due, estimated pickup date.
- Real-time progress tracker: 13-stage production pipeline with percentage bar and timestamped
  stage history.
- Measurement history view: JSON-structured body dimensions per order.
- Payment status tracking: downpayment verified, balance pending.

#### F. Appointment Booking
- Browse shops and check availability.
- Book appointment: input personal info, preferred date/time, purpose (measurement/fitting),
  measurement details.
- View appointment status: Pending, Confirmed, Rescheduled, Cancelled.
- Receive automated SMS/email confirmations and reschedule notices.

### API Endpoints Owned
```
GET    /api/shops                    — list/search shops
GET    /api/shops/:id                — shop profile detail
GET    /api/shops/:id/services       — shop services
GET    /api/shops/:id/reviews        — shop reviews
GET    /api/shops/map                — shops with coordinates for map
POST   /api/orders                   — create customer order
GET    /api/orders                   — list customer orders
GET    /api/orders/:id               — order detail with progress
GET    /api/appointments             — list customer appointments
POST   /api/appointments             — book appointment
PATCH  /api/appointments/:id         — reschedule/cancel
GET    /api/customer/measurements    — view saved measurements
GET    /api/customer/notifications   — customer notification feed
GET    /api/customer/saved-shops     — saved shops list
POST   /api/customer/saved-shops     — save a shop
```

### Database Tables Primarily Used
- `shops`, `services`, `shop_reviews`, `job_orders`, `appointments`, `measurements`,
  `customer_profiles`, `payments`, `notifications`

### Shared Dependencies
- **Map API** (Google Maps / Mapbox) — coordinate rendering and directions.
- **Cloudflare R2** — shop gallery images, banners, logos.
- **Notification Service** — SMS/email gateway for order and appointment alerts.

---

## Module 2 — Administrative System Module
**Owner:** Bongo, Jossua A.

### Thesis Basis
- **Use Case Diagram (Figure 2, Page 61):** Admin actor with Login, Monitor Subscription,
  Manage Accounts (includes Manage Plan), Manage Registration.
- **BPMN (Figure 11, Page 67):** Administrative Module — admin logs in, chooses Accounts,
  Plans, Registration, or Monitor paths.
- **BPMN (Figure 12, Page 68):** Subscription and Account Management — Shop Owner registers,
  System creates pending profile, Admin verifies credentials, approves/rejects, System sends
  credentials or refund.
- **Activity Diagram (Figure 17, Page 70):** Administrative Module activity flow.
- **Activity Diagram (Figure 18, Page 71):** Subscription and Account Management onboarding.
- **Sequence Diagram (Figure 24, Page 78):** Administrative Dashboard — Admin → Dashboard UI
  → SUTURA System → Database (pending registrations, approval/rejection).
- **Sequence Diagram (Figure 30, Page 84):** Interactive Analytics Dashboard — Admin/Shop Owner
  → Analytics UI → SUTURA System → Database.
- **UI Prototypes (Pages 60, 64–69):** Admin Dashboard, Admin Shops, Subscription, Accounts,
  Reports, System Overview, Settings.
- **Storyboard Part 4 (Page 123):** Administrative Dashboard — shop approvals, subscription
  monitoring, account management, platform activity.

### Owned Features

#### A. Admin Dashboard & Overview
- High-level KPI cards: Total Users, Total Shops, Active Subscriptions, Platform Revenue,
  Pending Verifications.
- Interactive Recent Sales graph (subscription revenue over time).
- Real-time list of Pending Shop Verifications with quick-action buttons.
- Platform activity overview: new registrations, subscription transactions, support tickets.

#### B. Shop Registration Verification
- Structured list of pending shop registrations: shop identity, owner name, location,
  submission date, status.
- Deep-dive into shop details: business credentials, submitted documents, apparel categories,
  branch locations.
- One-click Approve or Reject with reason logging.
- On approval: system auto-activates shop, initializes workspace, sends temporary credentials
  via SMS/email.
- On rejection: system logs refusal, processes refund, sends rejection notice.

#### C. Tailoring Shops Management
- Complete operational directory: shop IDs, names, verification statuses, subscription tiers.
- Direct management tools: adjust access tiers, audit merchant profiles, toggle visibility
  (Public/Hidden/Featured).
- Governance actions: suspend shop for rule breaches, force visibility changes.
- All actions logged to audit trail.

#### D. Subscription Tier Management
- View and edit tier parameters: Basic, Pro, Premium.
- Per-tier configuration: plan name, billing cycle, price, feature limits (branch count,
  staff count, visibility level, analytics depth).
- Monitor active subscriptions: filter by tier, status, expiration date.
- Track commercial cash flow trends and renewal rates.
- Handle plan modifications and billing resets.

#### E. Accounts & System Auditing
- Full platform user directory: all participants, roles, emails, account statuses.
- Audit Trail log screen: log ID, responsible user, action type, description, timestamp.
- Filter and search audit logs by user, action type, date range.
- Export audit data (if scope permits).

#### F. Interactive Analytics (Admin View)
- Subscription activity charts: new sign-ups, renewals, cancellations over time.
- Platform revenue trends: monthly recurring revenue, total collected.
- Total registered shops growth chart.
- Shop registration approval rate metrics.
- Platform performance: uptime, API response times, error rates.

#### G. Support Ticket Terminal
- List all open tickets from shop owners and staff.
- Filter by severity, submitter, status.
- View ticket details and thread.
- Mark tickets as resolved with resolution notes.
- Escalation workflow for critical issues.

### API Endpoints Owned
```
GET    /api/admin/dashboard          — admin KPIs and overview
GET    /api/admin/shops/pending      — pending verifications
POST   /api/admin/shops/:id/approve  — approve shop registration
POST   /api/admin/shops/:id/reject   — reject shop registration
GET    /api/admin/shops              — all shops directory
PATCH  /api/admin/shops/:id/status   — update shop status/visibility
GET    /api/admin/subscriptions      — subscription management
PATCH  /api/admin/subscriptions/:id  — modify subscription tier
GET    /api/admin/accounts           — all user accounts
GET    /api/admin/audit-logs         — system audit trail
GET    /api/admin/analytics          — platform-wide analytics
GET    /api/admin/tickets            — support tickets
PATCH  /api/admin/tickets/:id        — resolve/update ticket
```

### Database Tables Primarily Used
- `users`, `shops`, `shop_subscriptions`, `subscription_plans`, `audit_logs`, `payments`

### Shared Dependencies
- **Notification Service** — credential SMS/email dispatch, rejection notices.
- **Payment Tracking** — refund processing log (no direct gateway integration per thesis scope).
- **RBAC Middleware** — admin-only route guards.

---

## Module 3 — Shop Owner Module
**Owner:** Arabejo, Joshua Wayman A.

### Thesis Basis
- **Use Case Diagram (Figure 4, Page 62):** Shop Owner actor with Login, Manage Shop Profile,
  Manage Staff Account (includes Manage Role), View Dashboard Analytics.
- **Use Case Diagram (Figure 6, Page 64):** Subscription and Account Management — Shop Owner
  registers, selects plan, creates staff accounts, assigns roles.
- **Use Case Diagram (Figure 10, Page 67):** Appointment Module — Shop Owner manages schedule,
  authorizes appointments, triggers SMS notifications.
- **BPMN (Figure 12, Page 68):** Subscription onboarding — Shop Owner fills form, selects plan,
  submits; Admin verifies; System activates.
- **BPMN (Figure 16, Page 69):** Appointment Booking — Customer books, System validates,
  Shop Owner reviews, approves/reschedules, SMS sent.
- **Activity Diagram (Figure 23, Page 77):** Tailoring Shop Management — owner configures
  profile, services, pricing, schedules, visibility, specializations.
- **Sequence Diagram (Figure 25, Page 79):** Subscription and Account Management — Shop Owner
  → Registration UI → SUTURA System → Database.
- **Sequence Diagram (Figure 28, Page 82):** Tailoring Shop Dashboard — Shop Owner → Dashboard
  UI → SUTURA System → Database.
- **UI Prototypes (Pages 60, 54–62):** Shop Owner Dashboard, Orders, Appointments, Staff
  Management, Sales Report, Service Gallery, Branches, Measurements, Notifications, Settings.
- **Storyboard Part 3 (Page 123):** Shop Owner Dashboard — operations, services, appointments,
  staff, sales, branches, measurements.

### Owned Features

#### A. Shop Owner Dashboard
- KPI cards: Total Earnings, Total Orders, Active Appointments, Total Customers.
- Interactive sales analytics graph: historical revenue over time.
- Production queue overview: orders by status (Pending, In Progress, Ready, Completed).
- Appointment calendar view: upcoming fittings and consultations.
- Real-time notification feed: new orders, appointment requests, payment confirmations.

#### B. Storefront Configuration
- Digital profile setup: shop name, description, contact number, email, address.
- Logo and banner upload to Cloudflare R2.
- Operating hours configuration (per branch).
- Geographic coordinates for map pinning (validated by admin).
- Shop visibility toggle: Public, Hidden, Featured (tier-dependent).
- Gallery management: upload portfolio photos, categorize by garment type.

#### C. Service Catalog Management
- Add, edit, remove services: service name, description, base price, garment type tag.
- Garment type tags: Filipiniana, Barong, Uniforms, Wedding Gowns, Suits, Alterations,
  Lab Gowns, Scrub Suits, Corporate Wear, etc.
- Itemized pricing configuration per service.
- Service visibility on public marketplace.

#### D. Apparel Specialization Declaration
- Declare specializations from a validated list (admin-approved categories).
- Request custom apparel categories for admin validation.
- Specialization badges displayed on shop profile and search results.

#### E. Branch Management
- Add, edit, remove shop branches (limited by subscription tier).
- Each branch: name, address, contact, operating hours, coordinates.
- Main branch vs. other branches distinction.
- Branch availability status.

#### F. Appointment Management
- View incoming appointment requests with customer details, purpose, date/time.
- Approve, reschedule, or cancel appointments with reason logging.
- Calendar view of all scheduled appointments.
- Automated SMS confirmation upon approval; reschedule notice via SMS.
- Prevent double-booking logic.

#### G. Order Assignment & Production Tracking
- Master order log: view all orders with filters by status, date, customer.
- Review order feasibility: approve or reject with reason.
- Allocate materials and labor upon approval.
- Assign orders to specific tailoring staff members.
- Monitor order progress across all 13 production stages.
- View customer measurement details per order.

#### H. Staff Management
- Create staff accounts: name, role, contact, credentials.
- Assign roles: Master Tailor, Sewer, Fitter, etc.
- Deactivate or remove staff accounts.
- View staff list with roles and contact metadata.
- Staff productivity tracking (linked to Masudog's module).

#### I. Analytics (Shop Owner View)
- Monthly sales revenue chart.
- Outstanding customer balances summary.
- Individual staff productivity metrics.
- Order completion rates.
- Appointment analytics: bookings vs. cancellations.

#### J. Subscription Management
- View current subscription tier and feature limits.
- Upgrade/downgrade plan (triggers new billing cycle).
- View subscription history: start date, end date, renewals.
- Expiration alerts and renewal prompts.

### API Endpoints Owned (as originally proposed — see real routes below)
```
GET    /api/owner/dashboard          — shop owner KPIs
PATCH  /api/owner/profile            — update shop profile
POST   /api/owner/logo               — upload logo to R2
POST   /api/owner/banner             — upload banner to R2
GET    /api/owner/services           — list shop services
POST   /api/owner/services           — create service
PATCH  /api/owner/services/:id       — update service
DELETE /api/owner/services/:id       — delete service
GET    /api/owner/branches           — list branches
POST   /api/owner/branches           — add branch
PATCH  /api/owner/branches/:id       — update branch
DELETE /api/owner/branches/:id       — delete branch
GET    /api/owner/appointments       — list appointments
PATCH  /api/owner/appointments/:id   — approve/reschedule/cancel
GET    /api/owner/orders             — list shop orders
PATCH  /api/owner/orders/:id         — approve/reject/assign
GET    /api/owner/staff              — list staff
POST   /api/owner/staff              — create staff account
PATCH  /api/owner/staff/:id          — update staff role/status
DELETE /api/owner/staff/:id          — remove staff
GET    /api/owner/analytics          — shop-level analytics
GET    /api/owner/subscription       — current subscription
PATCH  /api/owner/subscription       — change plan
POST   /api/owner/gallery            — upload gallery images to R2
```

### Database Tables Primarily Used (as originally proposed — see real names below)
- `shops`, `services`, `shop_branches`, `appointments`, `job_orders`, `tailoring_staff_profiles`,
  `shop_subscriptions`, `subscription_plans`, `payments`

### Shared Dependencies
- **Cloudflare R2** — logo, banner, gallery image uploads and serving. (Not switched on yet in
  local dev — see "Current Implementation Status" below; local uploads currently serve from the
  `public` disk, R2 is planned at the ~mid-September Postgres migration.)
- **Map API** — branch coordinate validation and display.
- **Notification Service** — appointment confirmations, order assignment alerts. (Built out far
  beyond this — see below.)
- **Tier Enforcement Middleware** — branch count, staff count, visibility limits per plan.

---

### Current Implementation Status (checked against real code, not the proposal — see this repo's own `CLAUDE.md` and `../sutura-server/CLAUDE.md` for the living version of this)

The endpoint list and table names above are the **originally proposed** shape — actual routes are RESTful under `/api/v1/shops/{shop}/...` (see `sutura-server/routes/api.php`), not the flat `/api/owner/*` paths shown. Real table names: `shops`, `services`, `service_packages`, `shop_branches`, `appointments`, `job_orders`, `job_order_staff`, `staff_profiles` (not `tailoring_staff_profiles`), `shop_subscriptions`, `subscription_plans`, `payments`, `catalog_orders`, `catalog_items`, `audit_logs`. Per-feature reality check:

- **A. Dashboard** — done, and beyond the proposal: KPI cards, revenue chart, production queue, appointment calendar, real-time notification feed all exist. Home also now respects the header's branch selector (a shop-wide overview didn't originally scope by branch; changed per owner request).
- **B. Storefront Configuration** — done. Shop visibility (Public/Hidden/Featured, tier-gated) works. Logo/banner/gallery upload works on the local `public` disk today (R2 switch is the one deferred migration item, see `DEADLINE.md`).
- **C. Service Catalog Management** — done, plus a full Service Packages sub-feature (combo pricing) — merged into the Services page as a tab rather than being its own nav item.
- **D. Apparel Specialization Declaration** — the owner-facing "declare from a list" half is built (`shops.specializations`). The "request a custom category for admin validation" half has **no submission flow built** — there's no admin frontend at all yet (Bongo's module), so nothing to request into.
- **E. Branch Management** — done. Multi-branch is Premium-plan-gated (a shop can have at most 1 branch below Premium).
- **F. Appointment Management** — done: approve/reschedule/cancel with reason logging, calendar view, double-booking prevention (including a confirm-time re-check race-condition fix), reschedule-aware reminder resets. **SMS confirmations were never built** — the actual notification channels are in-app (database) + email, not SMS; this diverged from the proposal early and stayed that way.
- **G. Order Assignment & Production Tracking** — done, and far more granular than "13 production stages": the real pipeline is a 14-status "3-Phase Tailoring Tracker" (see `JobOrder::STATUSES` in `../sutura-server/CLAUDE.md`) with per-stage staff assignment, a 50% downpayment gate, rush/outsourcing handling, a Bulk Order Override for team-roster jobs, tracking-code lookup (backend/DB only, no page), and an aging alert for unclaimed pickups.
- **H. Staff Management** — done, and reworked into a dedicated Staff Profile page (bio, avatar, availability status) rather than a flat list — the list itself was deliberately cut down to 4 columns with filter dropdowns after it got too crowded.
- **I. Analytics** — done: revenue, outstanding balances, staff productivity, completion rates, booking conversion, customer ratings, branch comparison. A real, shipped bug worth knowing about: a discount reduces `job_orders.balance` directly, never `total_amount` — any revenue figure must be `total_amount - balance - discount_amount`, not `total_amount - balance`, or a discount silently counts as cash collected. This bug shipped across ~11 surfaces before being fully fixed.
- **J. Subscription Management** — done: view/upgrade/downgrade, billing history, expiry auto-hide + renewal notifications. A downgrade that would leave current staff/branch usage over the new plan's limit is now blocked (added after the original proposal — the proposal never specified this edge case). Appointment/order creation is **deliberately never hard-gated** on a subscription quota, even though `subscription_plans.max_appointments_per_month` exists as a real per-tier value — that would block real customer bookings, not just an owner mistake, and was tried and explicitly reverted.

---

## Module 4 — Tailoring Staff Module
**Owner:** Masudog, Clareynz June A.

### Thesis Basis
- **Use Case Diagram (Figure 3, Page 63):** Tailoring Staff actor with Login, Manage Measurement,
  Manage Progress (includes Update Status).
- **Use Case Diagram (Figure 9, Page 66):** Order Tracking and Measurement Module — Tailoring
  Staff executes Manage Body Measurement, Fabricate Custom Garment, Quality Assurance Check,
  Perform Tailoring Adjustments, Update Tracking Status.
- **BPMN (Figure 15, Page 69):** Order Tracking and Measurement — Customer places order,
  Staff takes measurements, Shop Owner allocates, Staff fabricates, QC check, status updates,
  fitting, alterations, final payment, completion.
- **Activity Diagram (Figure 21, Page 75):** Order Tracking and Measurement — four lanes:
  Customer, System, Tailoring Staff, Shop Owner.
- **Sequence Diagram (Figure 29, Page 83):** Order Tracking and Measurement — Customer,
  Tailoring Staff, Shop Owner → Order Tracking UI → SUTURA System → Database.
- **UI Prototypes (Pages 60, 46–52):** Tailoring Staff Dashboard, Production & Orders,
  Fittings & Quality Control, Customer Profiles, Support, Notifications, Staff Profile.
- **Storyboard Part 1 (Page 123):** Entry & Access — login and authentication.

### Owned Features

#### A. Tailoring Staff Dashboard
- Minimalist, task-focused layout with high-contrast data cards.
- KPI cards: Orders in Production, Quality Checks Needed, Pending Fittings.
- "My Production Queue": chronological list of assigned orders with urgency flags.
- Order type badges: Filipiniana, Barong, Formal Suit, Uniform, etc.
- Quick-action buttons for common tasks.

#### B. Customer Measurement Management
- View customer profiles with contact details and order history.
- Record digital body measurements as structured JSON:
  - Chest, Waist, Hip, Inseam, Shoulder, Sleeve, Length
  - Additional fields: Neck, Armhole, Wrist, Thigh, Knee, Ankle
- Update existing measurements for returning customers.
- Measurement status indicators: Finalized vs. Pending Fitting.
- Link measurements to specific job orders.
- View measurement history per customer.

#### C. Production & Order Tracking
- View assigned orders with full details: garment type, measurements, due date, special
  instructions.
- Update garment production stage via dropdown or quick-action buttons:
  1. Order Received → 2. Measurement Taken → 3. Downpayment Verified → 4. Pattern Making →
  5. Fabric Cutting → 6. Sewing In Progress → 7. Embroidery/Logo → 8. Quality Check →
  9. Pressing/Ironing → 10. Ready for Fitting → 11. Alterations → 12. Ready for Pickup →
  13. Claimed/Completed
- Stage update triggers real-time sync and automated customer notification.
- Add production notes per stage (e.g., "fabric shortage, delayed 1 day").
- View order timeline with timestamped stage history.
- Flag urgent or rush orders with visual indicators.

#### D. Fittings & Quality Control
- View scheduled fitting appointments: customer name, date/time, garment, status.
- Mark fittings as Pending or Completed.
- Record fitting feedback: adjustments needed, fit satisfaction.
- Trigger alteration workflow if customer requests changes.
- Quality check checklist: stitch integrity, fit accuracy, finish quality, measurement match.
- Pass/fail QC with notes; failed items routed back for adjustments.

#### E. Real-Time Notifications
- Instant alerts for: New Order Assignments, Fitting Schedule Updates, Stage Change Requests
  from Shop Owner, Urgent Order Flags.
- Notification feed with timestamps and action links.
- Mark notifications as read/unread.

#### F. Account & Support
- View personal profile: name, role, shop branch, contact info.
- Secure password update.
- Internal support ticketing: report platform issues or suggest tracking modifications to
  system administrators.
- View support ticket status and responses.

### API Endpoints Owned
```
GET    /api/staff/dashboard          — staff KPIs and production queue
GET    /api/staff/orders             — assigned orders
PATCH  /api/staff/orders/:id/status  — update production stage
GET    /api/staff/orders/:id         — order detail with measurements
GET    /api/staff/measurements       — list customer measurements
POST   /api/staff/measurements       — record new measurements
PATCH  /api/staff/measurements/:id   — update measurements
GET    /api/staff/fittings           — scheduled fittings
PATCH  /api/staff/fittings/:id       — mark fitting complete/add notes
POST   /api/staff/qc-check           — submit quality check result
GET    /api/staff/notifications      — staff notification feed
PATCH  /api/staff/notifications/:id  — mark notification read
GET    /api/staff/profile            — staff profile
PATCH  /api/staff/profile            — update profile/password
POST   /api/staff/tickets            — submit support ticket
```

### Database Tables Primarily Used
- `tailoring_staff_profiles`, `job_orders`, `measurements`, `customer_profiles`, `appointments`,
  `notifications`

### Shared Dependencies
- **Notification Service** — stage update alerts to customers, fitting reminders.
- **Real-Time Sync** — WebSocket or polling for instant status updates visible to customers.

---

## Cross-Module Integration Points

### Shared Platform Services (All Members Contribute To)

| Service | Owner | Used By |
|---|---|---|
| **Authentication & RBAC** | Bongo (Admin) + All | All modules |
| **PostgreSQL (Supabase) Schema** | All (coordinated) | All modules |
| **Cloudflare R2 Image Storage** | All (coordinated) | Renalyn (gallery), Joshua (logo/banner/gallery) |
| **Map API Integration** | Renalyn (Customer) + Joshua (Shop Owner) | Customer map, shop branch coordinates |
| **Notification Service (SMS/Email)** | Bongo (Admin) + All | Order alerts, appointment confirmations, approvals |
| **Audit Logging** | Bongo (Admin) | All admin actions logged |
| **Search Indexing** | Renalyn (Customer) | Shop search, global quick-find |
| **Analytics Aggregation** | Bongo (Admin) + Joshua (Shop Owner) | Admin platform analytics, shop owner sales reports |

### Data Flow Between Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUTURA PLATFORM                                   │
├─────────────┬─────────────┬─────────────┬─────────────────────────────────┤
│  CUSTOMER   │   ADMIN     │ SHOP OWNER  │     TAILORING STAFF             │
│  (Renalyn)  │  (Bongo)    │  (Joshua)   │      (Masudog)                  │
├─────────────┼─────────────┼─────────────┼─────────────────────────────────┤
│ Search shops│ Approve shop│ Configure   │ Record measurements             │
│ View on map │ Manage tiers│ storefront  │ Update production stages        │
│ Book appt   │ Audit logs  │ Manage      │ Manage fittings                 │
│ Place order │ Platform    │ services    │ Quality checks                  │
│ Track order │ analytics   │ Manage      │                                 │
│             │ Support     │ branches    │                                 │
│             │ tickets     │ Handle      │                                 │
│             │             │ appointments│                                 │
│             │             │ Assign staff│                                 │
│             │             │ to orders   │                                 │
│             │             │ View sales  │                                 │
│             │             │ analytics   │                                 │
├─────────────┴─────────────┴─────────────┴─────────────────────────────────┤
│                         SHARED SERVICES                                     │
│  PostgreSQL (Supabase) │ Cloudflare R2 │ Map API │ SMS/Email │ Auth/RBAC   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Critical Handoff Points

1. **Shop Registration Flow:**
   - Joshua (Shop Owner) builds the registration form.
   - Bongo (Admin) builds the verification and approval workflow.
   - Renalyn (Customer) ensures approved shops appear in search results.

2. **Order Lifecycle:**
   - Renalyn (Customer) builds order placement UI.
   - Joshua (Shop Owner) builds order review, approval, and assignment.
   - Masudog (Tailoring Staff) builds stage updates and measurement recording.
   - Renalyn (Customer) builds the progress tracker that displays Masudog's updates.

3. **Appointment Booking:**
   - Renalyn (Customer) builds the booking form.
   - Joshua (Shop Owner) builds the approval/reschedule workflow.
   - Masudog (Tailoring Staff) views approved appointments for fittings.

4. **Subscription Enforcement:**
   - Bongo (Admin) defines tier parameters and manages plans.
   - Joshua (Shop Owner) implements tier-gated features (branch limits, staff limits).
   - All modules respect tier boundaries via shared middleware.

5. **Notifications:**
   - Bongo (Admin) configures the notification service infrastructure.
   - All modules trigger notifications at their respective events.
   - All modules display notification feeds in their dashboards.

---

## Development Workflow

### Phase Ownership

| Phase | Primary Owner(s) | Supporting |
|---|---|---|
| Phase 1 — Auth & Role Portals | Bongo (Admin auth) | All (login flows) |
| Phase 2 — Shop Discovery & Map | Renalyn (Customer) | Joshua (shop data) |
| Phase 3 — Shop Owner Dashboard | Joshua (Shop Owner) | Bongo (subscription) |
| Phase 4 — Order Tracking | Masudog (Staff) | Renalyn (customer view), Joshua (owner view) |
| Phase 5 — Subscription & Staff | Bongo (subscription) + Joshua (staff) | All |
| Phase 6 — Admin & Analytics | Bongo (Admin) | Joshua (shop analytics) |
| Phase 7 — Notifications & Search | Renalyn (search) | All (notification feeds) |
| Phase 8 — Final Quality Gate | All (joint responsibility) | — |

### Code Collaboration Rules

1. **API Contract First:** Backend-dev defines API contracts (endpoints, request/response
   shapes) before frontend-dev implements UI. Document in shared `API_CONTRACTS.md`.
2. **Database Schema Coordination:** All schema changes go through a shared migration file.
   No member modifies the schema unilaterally.
3. **Shared Components:** Reusable UI components (buttons, cards, tables, modals) live in a
   shared `components/` directory. Any member can use them; modifications require consensus.
4. **Image Assets:** All uploads go through the shared Cloudflare R2 service module. No local
   image storage.
5. **Testing:** Each member writes unit tests for their module's API endpoints and UI
   components. QA writes end-to-end tests across modules.
6. **Git Workflow:** Feature branches per module. Pull requests require at least one review
   from another module owner before merge.

---

## Thesis Alignment Checklist

| Thesis Component | Owner | Status |
|---|---|---|
| Use Case Diagram — Admin (Fig 2) | Bongo | ⬜ |
| Use Case Diagram — Staff (Fig 3) | Masudog | ⬜ |
| Use Case Diagram — Shop Owner (Fig 4) | Joshua | ⬜ |
| Use Case Diagram — Customer (Fig 5) | Renalyn | ⬜ |
| Use Case Diagram — Subscription (Fig 6) | Bongo + Joshua | ⬜ |
| Use Case Diagram — Shop Discovery (Fig 7) | Renalyn | ⬜ |
| Use Case Diagram — Map Interface (Fig 8) | Renalyn | ⬜ |
| Use Case Diagram — Order Tracking (Fig 9) | Masudog + Renalyn + Joshua | ⬜ |
| Use Case Diagram — Appointment (Fig 10) | Renalyn + Joshua | ⬜ |
| BPMN — Admin (Fig 11) | Bongo | ⬜ |
| BPMN — Subscription (Fig 12) | Bongo | ⬜ |
| BPMN — Shop Discovery (Fig 13) | Renalyn | ⬜ |
| BPMN — Map Interface (Fig 14) | Renalyn | ⬜ |
| BPMN — Order Tracking (Fig 15) | Masudog | ⬜ |
| BPMN — Appointment (Fig 16) | Renalyn + Joshua | ⬜ |
| Activity — Admin (Fig 17) | Bongo | ⬜ |
| Activity — Subscription (Fig 18) | Bongo | ⬜ |
| Activity — Shop Discovery (Fig 19) | Renalyn | ⬜ |
| Activity — Map Interface (Fig 20) | Renalyn | ⬜ |
| Activity — Order Tracking (Fig 21) | Masudog | ⬜ |
| Activity — Appointment (Fig 22) | Renalyn + Joshua | ⬜ |
| Activity — Shop Management (Fig 23) | Joshua | ⬜ |
| Sequence — Admin Dashboard (Fig 24) | Bongo | ⬜ |
| Sequence — Subscription (Fig 25) | Bongo | ⬜ |
| Sequence — Shop Discovery (Fig 26) | Renalyn | ⬜ |
| Sequence — Map Interface (Fig 27) | Renalyn | ⬜ |
| Sequence — Shop Dashboard (Fig 28) | Joshua | ⬜ |
| Sequence — Order Tracking (Fig 29) | Masudog | ⬜ |
| Sequence — Analytics (Fig 30) | Bongo + Joshua | ⬜ |
| Domain — Admin (Fig 31) | Bongo | ⬜ |
| Domain — Subscription (Fig 32) | Bongo | ⬜ |
| Domain — Order Tracking (Fig 33) | Masudog | ⬜ |
| Domain — Appointment (Fig 34) | Renalyn + Joshua | ⬜ |
| ERD — Admin (Fig 35) | Bongo | ⬜ |
| ERD — Subscription (Fig 36) | Bongo | ⬜ |
| ERD — Order Tracking (Fig 37) | Masudog | ⬜ |
| ERD — Appointment (Fig 38) | Renalyn + Joshua | ⬜ |
| Class — Admin (Fig 39) | Bongo | ⬜ |
| Class — Subscription (Fig 40) | Bongo | ⬜ |
| Class — Order Tracking (Fig 41) | Masudog | ⬜ |
| Class — Appointment (Fig 42) | Renalyn + Joshua | ⬜ |
| Database Schema (Fig 43) | All (shared) | ⬜ |
| UI — Tailoring Staff Dashboard | Masudog | ⬜ |
| UI — Shop Owner Dashboard | Joshua | ⬜ |
| UI — Admin Dashboard | Bongo | ⬜ |
| UI — Customer Dashboard | Renalyn | ⬜ |
| Storyboard — Entry & Access | All | ⬜ |
| Storyboard — Customer Module | Renalyn | ⬜ |
| Storyboard — Shop Owner Module | Joshua | ⬜ |
| Storyboard — Admin Module | Bongo | ⬜ |
| Storyboard — Analytics & Reporting | Bongo + Joshua | ⬜ |
| Data Dictionary (14 tables) | All (shared) | ⬜ |
| Gantt Chart / Calendar | All (shared) | ⬜ |
