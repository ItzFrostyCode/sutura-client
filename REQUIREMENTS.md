# SUTURA — Requirements

## Summary

SUTURA is a web-based tailoring shop tracker system that bridges the gap between traditional
tailoring businesses and tech-savvy consumers in Davao City. It is a centralized, subscription-
based platform where tailoring shop owners register their businesses, manage storefronts, track
garment production in real time, and connect with customers through map-based discovery and
automated order tracking.

The system serves four primary user roles — System Administrator, Shop Owner, Tailoring Staff,
and Customer — each with a dedicated, role-appropriate interface. Shop owners subscribe to tiered
plans (Basic, Pro, Premium) to unlock visibility and feature limits. Customers discover verified
shops by garment specialization and location, book appointments, and monitor their order progress
from placement to pickup.

It should feel like a real product from the first screen: quick to navigate, satisfying to use,
and clearly capable. It ships pre-loaded with a realistic workspace so every feature is on display
the moment it starts.

## The Product

### User Roles and Access Boundaries

- **System Administrator** — Platform-level governance. Approves shop registrations, manages
  subscription tiers, monitors platform-wide analytics, audits system activity, and oversees
  all tenant accounts.
- **Shop Owner** — Business-level management. Configures digital storefronts, manages service
  catalogs and apparel specializations, sets itemized pricing, handles appointments, controls
  public visibility, manages staff accounts, and monitors shop analytics.
- **Tailoring Staff** — Workshop-level execution. Records customer body measurements, updates
  garment production stages, manages fitting schedules, and views assigned production queues.
- **Customer** — Consumer-facing discovery and tracking. Searches for tailoring shops by garment
  type and location, views interactive maps, reads verified reviews, books appointments, places
  orders, and tracks real-time garment production progress with automated notifications.

### Authentication and Onboarding

- Separate login portals for each role, routed after a unified landing page.
- Shop owners must complete a pre-verification process: submit registration, select a
  subscription plan, pay, and await administrator approval before gaining dashboard access.
- Upon approval, the system sends temporary credentials via SMS/email; the shop owner logs in
  and changes their password.
- Rejected applications trigger an automatic refund and a rejection notice.
- Role-Based Access Control (RBAC) strictly governs every route, API endpoint, and UI element.

### Shop Discovery and Map-Based Navigation

- A public marketplace where customers search for tailoring services by specific garment type
  (Filipiniana, Barong Tagalog, Uniforms, Wedding Gowns, Suits, Alterations, etc.).
- Filter by area, specialization, and real-time branch availability.
- Interactive map interface displaying pinned geolocation coordinates of verified tailoring
  shops within Davao City, powered by an external mapping API.
- Complete storefront profiles: services, itemized pricing, gallery, operating hours, branch
  locations, and verified customer reviews.
- Route directions to selected shop branches.

### Tailoring Shop Dashboard (Storefront Management)

- Shop owners configure their digital profile: shop name, description, contact details, logo,
  banner, operating hours, and geographic coordinates.
- Manage service catalogs: add, edit, remove services with base pricing and garment type tags.
- Declare apparel specializations: Filipiniana, Barong, Uniforms, Wedding Gowns, Suits,
  Alterations, and custom categories.
- Set itemized pricing configurations per service.
- Handle customer appointment schedules: view, approve, reschedule.
- Control public platform visibility: Public, Hidden, or Featured (depending on subscription tier).
- Manage multiple branches based on the selected subscription plan.

### Order Tracking and Measurement Module

- Customers place orders online or through appointment-based intake.
- Tailoring staff record and retrieve digital customer measurements stored as structured data
  (JSON-structured body dimensions: Chest, Waist, Hip, Inseam, Shoulder, Sleeve, Length, etc.).
- Multi-stage garment production tracking with real-time status updates:
  1. Order Received
  2. Measurement Taken
  3. Downpayment Verified
  4. Pattern Making
  5. Fabric Cutting
  6. Sewing In Progress
  7. Embroidery / Logo Application
  8. Quality Check
  9. Pressing / Ironing
  10. Ready for Fitting
  11. Alterations (if needed)
  12. Ready for Pickup
  13. Claimed / Completed
- Automated SMS/email notifications triggered at each stage transition.
- Customers monitor order progress, view measurement history, and check order details from their
  dashboard.
- Shop owners review order feasibility, approve or reject orders, allocate materials and labor,
  and assign orders to tailoring staff.

### Appointment Booking Module

- Customers browse shops, check availability, and book appointments for measurements or fittings.
- Input: personal info, preferred date/time, purpose, and measurement details.
- System validates timeslot availability and routes the request to the shop owner.
- Shop owner approves, suggests a reschedule, or cancels with a logged reason.
- Automated SMS confirmation upon approval; reschedule and cancellation notices via SMS.
- Prevents double-booking and schedule conflicts.

### Subscription and Account Management

- Tiered subscription plans: Basic, Pro, and Premium.
- Each tier enforces feature boundaries: number of branches, staff accounts, visibility level,
  and analytics depth.
- Shop owners select a plan during registration; payment triggers pending activation.
- Administrator verifies business credentials before authorizing account access.
- Subscription lifecycle tracking: start date, end date, renewal, expiration, cancellation.
- Role-based staff account creation: shop owners add staff and assign roles with proper access
  control boundaries.

### Interactive Analytics Dashboard

- **For System Administrators:** real-time visual reports on subscription activity, total
  registered shops, platform revenue trends, pending verifications, and system performance.
- **For Shop Owners:** monthly sales revenue, outstanding customer balances, individual staff
  productivity, order completion rates, and appointment analytics.
- Data-driven reporting with interactive charts and performance metrics.

### Administrative Dashboard

- Review and approve/reject tailoring shop verification requests.
- Validate custom apparel categories submitted by shops.
- Verify branch map locations.
- Oversee active shop profiles and subscription compliance.
- Manage platform-wide user accounts and subscription tiers.
- Monitor platform activity through audit logs and real-time analytics.
- Handle support tickets from shop owners and staff.

### Notifications and Communication

- Real-time notification feeds for each role.
- Automated SMS/email notifications for: appointment confirmations, order stage transitions,
  subscription reminders, approval/rejection notices, and payment confirmations.
- Internal support ticketing for platform issues and feature requests.

### Search

- Quick-find search across page titles, shop names, services, and garment types.
- Live filtering as the user types.

## Seed Data

On first launch the app is fully populated with a realistic workspace that reads like a real
local tailoring ecosystem in Davao City:

- **Verified Shops:** 5–8 fully configured tailoring shops with complete profiles, services,
  pricing, gallery images, branch coordinates, and reviews.
- **Apparel Specializations:** Filipiniana, Barong Tagalog, School Uniforms (Elementary, JHS,
  SHS, College), Lab Gowns, Scrub Suits, Corporate Wear, Wedding Gowns, Suits, Alterations.
- **Subscription Tiers:** Pre-configured Basic, Pro, and Premium plans with defined feature
  limits and pricing.
- **Sample Orders:** 10–15 realistic job orders across different production stages, linked to
  customer profiles with saved measurements.
- **Appointments:** Scheduled and completed appointments demonstrating the full booking workflow.
- **Staff Accounts:** Tailoring staff profiles linked to shops with assigned roles.
- **Customer Accounts:** Pre-registered customer accounts with order history and saved
  measurements.
- **Analytics Data:** Historical sales and subscription data to populate dashboard charts.

Together the seed exercises every user role, every module, all production stages, subscription
flows, and map-based discovery. The seed grows with the phases below, so no feature ships empty.

## High-level Technical Guidance

Just enough direction to keep things on track — specific choices are left to the Coding Agent.

- A **full-stack web application** written in **TypeScript**.
- **Frontend:** **Next.js** with **React** and **TypeScript**, styled with **Tailwind CSS** for a
  fully responsive interface across desktop, tablet, and mobile browsers. **Zustand** for
  lightweight client-side state management.
- **Backend:** **Laravel (PHP)** exposing **RESTful APIs** for all server-side operations:
  business logic, authentication, RBAC, data processing, and real-time synchronization.
- **Database:** **PostgreSQL** hosted on **Supabase** as the primary relational database. All
  structured data — user profiles, shop records, measurements, job orders, appointments,
  payments, subscriptions, and audit logs — lives here.
- **Image Storage:** **Cloudflare R2** for all image assets: shop logos, banners, gallery
  photos, portfolio images, and garment progress photos.
- **Map Integration:** External mapping API (e.g., Google Maps API or Mapbox) for geolocation
  pinning, branch display, and route directions.
- **Notifications:** Third-party SMS/email gateway (e.g., Twilio, SendGrid, or PH-local
  providers) for automated alerts.
- **Deployment:** Frontend hosted on **Vercel**; Laravel backend deployed on **Railway** or
  **Render**.
- **Development Environment:** Visual Studio Code; GitHub for version control; Postman for API
  testing; Figma for UI wireframes and prototypes.
- **Starts with one documented command**; requires a stable internet connection for all
  functionalities.
- **Prefer popular, well-supported libraries over custom code** — mapping, drag-and-drop,
  date-picking, image uploading, and charting are all areas where mature libraries beat
  hand-rolled work.
- End-to-end tests drive the real app in a real browser. The choice of tooling is the Coding
  Agent's.
- Keep the implementation simple and conventional. Library, data, and structure choices are the
  Coding Agent's call, as long as the requirements and success criteria are met.

## Not in Scope

Deliberately left out to keep this buildable in one pass. Do not build these:

- No native mobile application — the system is fully responsive web-only.
- No offline data processing or background synchronization — a stable internet connection is
  required for all functionalities.
- No hardware integration: automated body-scanning devices, RFID tags, or digital measuring
  tools. All measurements are manually encoded.
- No native third-party payment gateway integration for direct fund transfers — the payment
  module tracks transaction details and deposits only. External financial reconciliation is
  outside the scope.
- No predictive analytics, AI-driven forecasting, or advanced business intelligence in the
  reporting module.
- No inventory tracking, material stock monitoring, or purchase order management.
- No supplier-related processes, fabric procurement, or material stock logistics.
- No employee payroll management including salary calculations or attendance-based wage
  distribution.
- No tax filing automation or business permit validation.
- No logistics, courier routing, or physical delivery management — all garment handovers and
  pickups are handled directly between shop and customer.
- No file uploads other than images (logos, banners, gallery, portfolio) stored on Cloudflare R2.
- No trash or restore for deleted records — deletion is permanent, behind a confirmation.
- No version history and no undo across sessions.
- No import or export of data.

## Look and Feel

Applies to the whole app:

- Make it **bold and impressive** — it should look designed on purpose. This is a product to show
  off, and first impressions matter.
- Palette: warm tailoring-inspired tones — **amber/gold (#ecad0a)**, **deep navy (#1a2a4a)**,
  **soft cream (#faf8f5)**, and **accent teal (#209dd7)** — over clean grays. Both light and
  dark themes draw from the same palette; dark mode is a first-class theme, equally considered.
- Avoid the tells of generated design: overuse of gradients, purple-dominated backgrounds, and
  thin accent borders down one side of cards or panels.
- The customer-facing marketplace should feel clean, trustworthy, and locally rooted — like a
  digital directory built specifically for Davao City's tailoring community.
- The shop owner and staff dashboards should feel productive and organized — clear data cards,
  intuitive sidebar navigation, and high-contrast status indicators.
- The admin dashboard should feel authoritative and precise — dark theme option, structured
  tables, real-time metrics, and audit transparency.
- Beyond these rules, layout and visual style are the Coding Agent's call.

## Phases and Success Criteria

Build in these phases, in order. **Do not start a phase until every success criterion of the
previous phase is demonstrably met** — each criterion must be something you can show working, not
just assert.

Every phase closes the same loop: its unit tests pass, its end-to-end tests pass against the real
app in a real browser, and the new features have been used in the running app with screenshots
taken and inspected. Unit tests accompany every phase on both frontend and backend, building
toward the coverage target verified in the Final Quality Gate.

---

### Phase 1 — Running Skeleton, Auth, and Role-Based Portals

**Features**

- The app starts with one documented command and opens in a browser as SUTURA, with a landing
  page offering entry points: Browse as Guest, Login as Customer, Login as Shop Owner, and
  Login as Admin.
- Separate authentication flows for all four roles, each routing to its dedicated dashboard.
- PostgreSQL (Supabase) schema initialized with all core tables: users, shops, staff profiles,
  customer profiles, subscription plans, shop subscriptions, services, appointments,
  measurements, job orders, payments, feedback, and audit logs.
- Cloudflare R2 bucket configured for image asset storage.
- Seed: an initial set of users across all four roles, subscription tiers, and 3–4 verified
  shops with complete profiles.
- The end-to-end test harness runs against the real app in a browser.

**Success Criteria**

1. One documented command starts the app; opening the given URL shows the SUTURA landing page
   with all entry options.
2. Users can log in as Admin, Shop Owner, Staff, or Customer and are routed to the correct
   dashboard based on their role.
3. Shop owner registration flow works: fill form, select subscription plan, submit for approval.
4. The admin can view pending registrations in a list and approve or reject them.
5. Approved shop owners receive temporary credentials and can log in; rejected applicants
   receive a rejection notice.
6. Changes survive a browser refresh and a full app restart.
7. Unit tests for user authentication, role-based routing, and registration approval pass.
8. At least one end-to-end test starts the real app in a browser, logs in as each role, and
   verifies dashboard access.

---

### Phase 2 — Shop Discovery, Map Interface, and Public Marketplace

**Features**

- Public marketplace accessible to guests and logged-in customers.
- Search and filter shops by garment type, area, and specialization.
- Interactive map displaying verified shop pins with geolocation coordinates from the database.
- Complete shop profile pages: services, pricing, gallery (images served from Cloudflare R2),
  operating hours, branches, and reviews.
- Route directions to selected branches via external mapping API.
- Seed extended with 5–8 fully configured shops, complete with gallery images, branch
  coordinates, services, and sample reviews.

**Success Criteria**

1. A guest or customer can open the marketplace, search for "Barong Tagalog," and see filtered
   results of verified shops offering that specialization.
2. The map interface renders shop pins at correct Davao City coordinates; clicking a pin opens
   the shop profile.
3. Shop profile pages display all details: services with pricing, gallery images loaded from
   Cloudflare R2, operating hours, and customer reviews.
4. The directions feature generates a navigable route from the user's location to the selected
   shop branch.
5. Filters combine correctly (e.g., "Filipiniana" + "Buhangin District" returns only matching
   shops).
6. Changes and new data survive a refresh.
7. Unit tests for search, filtering, and map coordinate retrieval pass.
8. End-to-end tests cover searching, filtering, viewing a shop profile, and opening the map —
   and pass.

---

### Phase 3 — Tailoring Shop Dashboard and Storefront Management

**Features**

- Shop Owner dashboard with KPI cards: Total Earnings, Total Orders, Active Appointments,
  Total Customers, and a sales analytics graph.
- Storefront configuration: update shop profile (name, description, contact, logo, banner,
  operating hours, coordinates), manage service catalogs, set itemized pricing, declare apparel
  specializations.
- Branch management: add, edit, remove branches (limited by subscription tier).
- Visibility control: toggle shop status between Public, Hidden, and Featured.
- Appointment management: view incoming requests, approve, reschedule, or cancel with reason.
- Gallery management: upload portfolio photos to Cloudflare R2, organize by category.
- Seed extended so at least two shops have rich storefronts with multiple services, branches,
  and gallery images.

**Success Criteria**

1. A shop owner can log in and see a dashboard with KPI cards and a sales graph populated with
   realistic data.
2. The owner can update their shop profile, upload a logo and banner to Cloudflare R2, and see
   the changes reflected immediately in the public marketplace.
3. The owner can add a new service with a garment type tag and base price; it appears in the
   public shop profile.
4. The owner can add a new branch with address and coordinates; it appears on the map (if the
   shop is Public).
5. The owner can toggle visibility; a Hidden shop disappears from the public marketplace and map.
6. The owner can view, approve, and reschedule appointment requests; approved appointments
   trigger an automated notification.
7. Changes survive a refresh and restart.
8. Unit tests for shop profile CRUD, service management, branch management, and visibility
   toggling pass.
9. End-to-end tests cover dashboard load, profile update, service creation, and appointment
   approval — and pass.

---

### Phase 4 — Order Tracking and Measurement Module

**Features**

- Customers place orders online: select garment type, input measurements or reference saved
  ones, and submit.
- Appointment-based order intake: staff create job orders directly from scheduled fittings.
- Tailoring staff record digital customer measurements as structured JSON (Chest, Waist, Hip,
  Inseam, Shoulder, Sleeve, Length, etc.) linked to customer profiles.
- Multi-stage production tracking: all 13 stages from Order Received to Claimed/Completed.
- Staff update order status at each production stage; updates sync in real time.
- Automated SMS/email notifications triggered at key stage transitions (e.g., Ready for Fitting,
  Ready for Pickup).
- Shop owner reviews order feasibility, approves or rejects, allocates to staff, and monitors
  progress.
- Customer dashboard shows active orders, progress tracker with percentage, stage history with
  timestamps, and measurement records.
- Payment tracking: downpayment (50%) and balance due, with status indicators.
- Seed extended with 10–15 realistic job orders across various stages, linked to customer
  profiles with saved measurements.

**Success Criteria**

1. A customer can place an order online, select a garment type, and input measurements; the
   order appears as "Pending" in their dashboard.
2. A tailoring staff member can log in, view their production queue, and update an order from
   "Fabric Cutting" to "Sewing In Progress"; the customer sees the update in real time.
3. An automated notification is sent to the customer when the order reaches "Ready for Fitting."
4. The shop owner can review a pending order, approve it, and assign it to a staff member.
5. The customer dashboard displays a progress bar, stage history with timestamps, and current
   status for each active order.
6. Payment status is tracked: DP verified shows a checkmark, balance due shows the amount and
   due date.
7. Staff can record and retrieve saved measurements for returning customers.
8. Changes survive a refresh and restart.
9. Unit tests for order creation, status transitions, measurement CRUD, and notification
   triggers pass.
10. End-to-end tests cover placing an order, staff updating status, customer viewing progress,
    and receiving a notification — and pass.

---

### Phase 5 — Subscription, Staff Management, and Appointments

**Features**

- Full subscription tier management: Basic, Pro, Premium with enforced feature limits
  (branches, staff accounts, visibility, analytics).
- Shop owner can create staff accounts, assign roles (e.g., Master Tailor, Sewer, Fitter),
  and deactivate staff.
- Subscription lifecycle tracking: active, expired, cancelled statuses with start/end dates.
- Admin can modify subscription tiers, pricing, and feature limits.
- Complete appointment booking workflow: customer books, system validates availability, shop
  owner approves/reschedules/cancels, automated SMS confirmations.
- Calendar view for shop owners and staff to visualize scheduled appointments and fittings.
- Seed extended with staff accounts linked to shops, active subscriptions across all tiers,
  and a full appointment calendar.

**Success Criteria**

1. A shop owner on the Basic plan cannot add more branches than their tier allows; attempting
   to do so shows a clear upgrade prompt.
2. The shop owner can add a new staff account with a designated role; the staff member can log
   in and access only their permitted modules.
3. The admin can view all active subscriptions, filter by tier, and modify plan pricing or
   feature limits.
4. A customer can book an appointment for a fitting; the shop owner receives the request,
  approves it, and the customer receives an SMS confirmation.
5. The shop owner can view a calendar of all appointments, filter by staff member, and
  reschedule with an automated notice to the customer.
6. Expired subscriptions automatically downgrade shop visibility to Hidden until renewed.
7. Changes survive a refresh and restart.
8. Unit tests for subscription enforcement, staff CRUD, appointment booking flow, and calendar
   logic pass.
9. End-to-end tests cover tier limit enforcement, staff creation, appointment booking and
   approval, and subscription expiry handling — and pass.

---

### Phase 6 — Admin Dashboard, Analytics, and Audit

**Features**

- Admin dashboard with high-level KPIs: Total Users, Total Shops, Active Subscriptions,
  Platform Revenue, Pending Verifications, and a Recent Sales graph.
- Shop registration verification module: structured list of pending shops with credential
  review and one-click approve/reject.
- Tailoring shops management module: complete directory with audit tools, access tier
  adjustments, and visibility overrides.
- Subscription tier management: view and edit plan parameters, monitor cash flow trends.
- Accounts and system auditing: full user directory, audit trail log with action types,
  descriptions, timestamps, and responsible users.
- Interactive analytics for admins: subscription activity, platform revenue trends,
  shop registration rates.
- Interactive analytics for shop owners: monthly sales, outstanding balances, staff
  productivity, order completion rates.
- Support ticket terminal: view, filter, and resolve issues submitted by shop owners and staff.
- Seed extended with historical analytics data, audit logs, and sample support tickets.

**Success Criteria**

1. The admin dashboard displays all KPI cards and an interactive sales graph with realistic
   seeded data.
2. The admin can open a pending shop registration, review submitted details and documents,
   and click Approve or Reject; the shop owner receives the corresponding notification.
3. The audit log shows a chronological record of all platform actions with user, action type,
   description, and timestamp.
4. The admin can adjust a shop's subscription tier or toggle its visibility as a governance
   action; the change is logged in the audit trail.
5. Shop owners can view their own analytics dashboard with monthly sales charts, staff
   productivity metrics, and outstanding balance summaries.
6. The support ticket terminal lists open tickets with severity, submitter, and status; the
   admin can mark tickets as resolved.
7. All analytics charts render correctly and update when underlying data changes.
8. Changes survive a refresh and restart.
9. Unit tests for analytics aggregation, audit logging, ticket management, and admin actions
   pass.
10. End-to-end tests cover admin dashboard load, shop approval workflow, audit log viewing,
    and analytics chart rendering — and pass.

---

### Phase 7 — Notifications, Search, and Polish

**Features**

- Real-time notification feeds for all four roles, showing time-stamped alerts for relevant
  events (new orders, stage updates, appointment changes, subscription reminders, approvals).
- Global search: quick-find across shop names, services, garment types, and customer orders.
- Light mode and dark mode toggle, persisted across sessions.
- Responsive design validation: all dashboards and the marketplace are usable on mobile,
  tablet, and desktop.
- Image optimization: all gallery, logo, and banner images served efficiently from Cloudflare R2
  with proper caching.
- Loading states, empty states, and error handling across all screens.
- The seed grown into the full showcase workspace.

**Success Criteria**

1. A shop owner receives a real-time notification when a customer places a new order; clicking
   the notification navigates to the order detail page.
2. A customer receives a notification when their order status changes; the notification appears
   in their dashboard feed with a timestamp.
3. The global search returns live results across shops, services, and orders as the user types;
   selecting a result navigates directly to it.
4. The theme toggle switches the entire app between light and dark mode; the choice survives
   a restart; every screen is presentable in both themes.
5. The marketplace and customer dashboard are fully functional and visually correct on a
   mobile browser viewport.
6. All images load correctly from Cloudflare R2 with no broken links.
7. Every screen has appropriate loading and empty states; no raw error messages are exposed
   to users.
8. Unit tests for notification delivery, search indexing, and theme persistence pass.
9. End-to-end tests cover notification reception, search and navigation, and theme toggling
   — and pass.

---

### Phase 8 — Final Quality Gate

**Work**

- A look-and-feel pass over the whole app in both themes.
- The full unit and end-to-end suites, with coverage measured.
- A complete walkthrough of the running app in a real browser, exercising every feature across
  all four user roles.
- An adversarial review of the finished product.

**Success Criteria**

1. The full unit test suites pass with statement coverage of at least 80% on both frontend and
   backend, reported by the test command.
2. The full end-to-end suite passes against the running app.
3. The running app has been driven end to end in a real browser, exercising every feature in
   this document across all four roles, with screenshots of every screen in both themes,
   visually inspected. No errors appear in the browser console during the walkthrough.
4. An adversarial review has been carried out: the running product was used in unscripted,
   hostile ways to try to break it — bad input, odd sequences, edge cases, role boundary
   violations. Every finding is recorded with steps to reproduce, and every recorded finding
   is either fixed or rejected with a written reason.
5. After the last fix, the full unit and end-to-end suites were rerun and pass.
6. The look-and-feel rules are met, in both themes, and none of the avoid-list appears anywhere.

## Final Success Criteria

The project is complete, and the Coding Agent may stop, when **all** of the following are true:

- A non-technical person can start the app with a single documented command and use it in a
  browser.
- All four user roles (Admin, Shop Owner, Staff, Customer) can authenticate and access their
  dedicated dashboards with correct RBAC enforcement.
- Shop discovery, map-based navigation, storefront management, order tracking with multi-stage
  production monitoring, appointment booking, subscription management, analytics, and search all
  work as described above, and every change persists across refresh and restart.
- Automated notifications (SMS/email) trigger correctly at stage transitions and appointment
  events.
- Images (logos, banners, gallery, portfolio) are stored on and served from Cloudflare R2
  without broken links.
- The app ships fully populated with the seed workspace, so it looks alive on first launch.
- The look-and-feel rules are met and none of the avoid-list appears anywhere.
- All unit tests pass with at least 80% statement coverage on frontend and backend, and the full
  end-to-end suite passes.
- The adversarial review record exists, every finding in it is fixed or rejected with a written
  reason, and all suites pass on the final build.
- **Most importantly: the product has been validated by using it end to end in a real browser —
  clicking through every feature as a real user would, in both themes, across all four roles,
  visually inspecting every screen. Passing tests is necessary but NOT sufficient; the Coding
  Agent must confirm the running product works and looks right, not merely that the suites are
  green.**
