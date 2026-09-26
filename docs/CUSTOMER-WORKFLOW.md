SUTURA Customer Module Workflow

> Source of truth for how the Customer Module actually behaves, derived directly from the running code (`sutura-server/app/Models`, `app/Http/Controllers/Api/V1/*`, `routes/api.php`) and the completed Scope & Implementation Audit. This is a **workflow definition**, not an audit — it does not re-score the seven objectives, and it does not propose new features. Where the current behavior has a genuine open question, it's marked `AMBIGUITY` and given the smallest thesis-aligned resolution, never a redesign.
>
> **Two companion documents extend this one — read them alongside, don't duplicate them here:** `docs/PAYMENT-WORKFLOW.md` (current + target payment capture/verification contract) and `docs/CUSTOMER-JOURNEY-TARGET.md` (the reconciled end-to-end target journey — search→shop→appointment/order→payment→production→history — approved 2026-09-24 as the foundation Staff and Owner module documents must inherit from). Sections below marked `TARGET` are decisions to build toward, sourced from that reconciliation; everything else remains the as-verified current implementation this document has always been.

---

## 1. Purpose

Define, precisely and sequentially, how data moves when a Customer acts: what gets written, which entity owns it, what status it starts in, who is authorized to act on it next, and how the result gets back to the Customer. This document is the contract the future Staff Module and Shop Owner Module documents must consume — it is written so a developer can trace any Customer action to the exact backend record it touches without guessing.

## 2. Customer Module Responsibility

**Responsible for:**

- Presenting shop discovery, shop profiles, catalogs, and services to anyone (guest or logged-in).
- Collecting a booking or order request and handing it to the backend as a real record — never as data the customer has to relay to staff themselves.
- Letting a logged-in (or code-holding) customer read back the status of their own appointments, orders, and measurements.
- Managing the customer's own identity: registration, login, profile fields, password.

**Not responsible for — and does not attempt:**

- Recording or editing measurements (staff-only, Section 9).
- Deciding appointment confirmation, job order acceptance, staff assignment, or production stage (staff/owner-only).
- Processing payments (the system tracks payment status/balance; it does not move money — out of scope platform-wide, not just for this module).

**Authentication requirements, by action:**

| Action                                                                      | Requires login?                                                |
| --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Browse/search shops, view shop profile, catalog, services, pricing, reviews | No                                                             |
| Book an appointment                                                         | **Backend: No** (`POST /catalog/{slug}/book` sits outside `auth:sanctum` — a guest submission is still technically accepted). **Current frontend: Yes** — `/store/[store_id]/book` gates on `useAuthStore().hydrated && !user` and immediately redirects to `/login` (or `/register`) before the customer can enter any appointment details; see `[CURRENT]` Section 7.0. The Section 16 shadow-account path remains true of the API, but is no longer reachable through the customer-facing UI as of this pass. |
| View/cancel*my* appointments                                              | Yes                                                            |
| Place a direct order (repair / bulk / made-to-order)                        | Yes (any authenticated role — see`AMBIGUITY 2`, Section 19) |
| Track an order by tracking code                                             | No                                                             |
| View*my* orders (cross-store list)                                        | Yes                                                            |
| View*my* measurements                                                     | Yes                                                            |
| Report a catalog item / leave a review / save an item                       | Yes                                                            |
| Register / log in                                                           | N/A — this is the action itself                               |

**Records created vs. reads:**

- **Creates a persistent record:** guest/registered appointment booking, direct order (repair/bulk/made-to-order), review submission, catalog-item report (→ `SupportTicket`), registration.
- **Read-only:** shop discovery/search/map, shop profile, catalog/service browsing, order tracking (both logged-in and by-code), measurement viewing, appointment list/detail viewing.

## 3. Customer Identity and Account States

There is exactly one table, `users`. "Guest," "walk-in," and "registered" are not different tables — they are different values of two fields on the same row: `password_set_at` and whether the email is a real one or a system-generated `walkin_<timestamp>_<random>@sutura.com` placeholder.

| State                                        | How it's created                                                                                                                                                                                                                      | `password_set_at` | Role attached?                                                    | Can log in?                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| **1. Guest**                           | No row exists yet — this is "before" any interaction.                                                                                                                                                                                | —                  | —                                                                | —                                                             |
| **2. Shadow / guest-booking customer** | `PublicBookingController::submit()` — booking a public appointment with just a name/email. Matched by email if a row already exists.                                                                                               | `NULL`            | `customer` (attached automatically)                             | No — random unknown password, no token issued at booking time |
| **3. Walk-in CRM record**              | `CustomerController::store()` — staff/owner manually adding a customer, in person, with no email. Gets a synthetic `walkin_*@sutura.com` address; matched first by real email, then by phone **scoped to that one store**. | `NULL`            | **None** — this path does not attach the `customer` Role | No                                                             |
| **4. Registered customer**             | `AuthController::register()` — a fresh signup, or claiming an existing state-2/3 row.                                                                                                                                              | Set to`now()`     | `customer`                                                      | Yes                                                            |

**When an email is required:** always, at the schema level (`users.email` is unique) — but the *customer* never has to supply one for a walk-in visit (state 3 synthesizes one) or can supply one and let a guest booking (state 2) create the row automatically.

**What happens when a guest books:** `PublicBookingController::submit()` looks up `users` by the submitted email; if none exists, it creates one with a random 16-character password and attaches the `customer` Role. No token is returned — the guest is never "logged in" as a result of booking (see `AMBIGUITY 1`, Section 19).

**What happens when a walk-in has no email:** `CustomerController::store()` first tries to match an existing customer of *that store* by phone number (checking the CRM pivot, job orders, and appointments — not just one of them) before minting a new synthetic-email row, specifically to stop the same repeat walk-in from fragmenting into multiple "customers" every visit.

**How historical records are preserved across states:** because states 2–4 are all the same `users` row, nothing needs to be "migrated" when a shadow account is claimed — every `Appointment`, `JobOrder`, and `Measurement` already points at `customer_id`, which never changes.

**How an unclaimed customer becomes registered (the claim flow):** in `AuthController::register()` —

1. If a row with the submitted email already exists **and** has `password_set_at` set → registration is rejected ("already registered, log in instead").
2. If a row with the submitted email exists **and** `password_set_at` is `NULL` → that row is claimed: name/email/password/phone are overwritten, `password_set_at` is stamped, and the response says *"your previous booking history is now linked to this account."*
3. If no email match exists but the submitted **phone** matches an unclaimed `walkin_*@sutura.com` row → that row is claimed the same way.
4. Otherwise → a brand-new row is created.

This is the one and only merge mechanism. It is intentionally scoped (a phone match never crosses into a different store's stranger — see the `CustomerController::store` note above) and it is not re-derived here; it is exactly what Section 8 of the completed audit already established as correct.

## 4. Customer Entry Points

| Entry point                   | Page                                                      | Backend call                                                                                                  | Auth |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---- |
| Shop discovery / map / search | `/search`, `/map`, `/stores`                        | `GET /public/stores`                                                                                        | No   |
| Shop profile                  | `/store/[store_id]`                                     | `GET /public/stores/{slug}` (+ services, packages, posts, reviews)                                          | No   |
| Catalog / portfolio browsing  | `/store/[store_id]/catalog`                             | `GET /catalog/{slug}`, `GET /catalog/{slug}/{item}`                                                       | No   |
| Appointment booking           | `/store/[store_id]/book`                                | `GET /catalog/{slug}/booking-settings`, `GET /catalog/{slug}/appointments`, `POST /catalog/{slug}/book` | **Yes at the frontend** (API itself: No) — see Section 7.0 |
| Repair/alteration request     | `/store/[store_id]/repair-request`                      | `GET /public/stores/{slug}/services`, `POST /stores/{slug}/repair-requests`                               | Yes  |
| Bulk order                    | (catalog item action)                                     | `POST /stores/{slug}/bulk-orders`                                                                           | Yes  |
| Made-to-order                 | (catalog item action)                                     | `POST /stores/{slug}/made-to-order`                                                                         | Yes  |
| Order tracking (logged-in)    | `/account/orders`, `/account/orders/[id]`             | `GET /my-orders`, `GET /my-orders/{id}`                                                                   | Yes  |
| Order tracking (no login)     | `/track`, `/track/[code]`                             | `GET /track/{trackingCode}`                                                                                 | No   |
| Appointment tracking          | `/account/appointments`, `/account/appointments/[id]` | `GET /my-appointments`, `GET /my-appointments/{id}`                                                       | Yes  |
| Cancel own appointment        | (from appointment detail)                                 | `DELETE /my-appointments/{id}`                                                                              | Yes  |
| Measurement viewing           | `/account/measurements`                                 | `GET /my-measurements`                                                                                      | Yes  |
| Registration / login          | `/register`, `/login`                                 | `POST /auth/register`, `POST /auth/login`                                                                 | N/A  |
| Profile settings              | `/account/settings/*`                                   | `PUT /profile/personal`, `PUT /profile/password`, `POST /profile/upload`                                | Yes  |
| Report a catalog item         | (catalog item ⋯ menu)                                    | `POST /stores/{slug}/catalog/{item}/report`                                                                 | Yes  |
| Reviews                       | (store/catalog item/service pages)                        | `POST /stores/{slug}/reviews`, `.../catalog/{item}/reviews`, `.../services/{service}/reviews`           | Yes  |

All confirmed by direct inspection of the corresponding page/hook and its `api.*` call — not assumed from the route list alone.

## 5. Shop Discovery Workflow

```
CUSTOMER ACTION      Search / filter (garment, specialization, district, open-now) or open the map
DATA SUBMITTED       q, specialization, district, open_now, min_price/max_price (query params)
API / BACKEND        GET /public/stores  (StoreController::publicIndex)
DATABASE ENTITY      stores (+ joins: store_branches, services, catalog_items)
INITIAL STATUS       n/a — read-only; only status='approved' AND is_hidden=false rows are returned, hard-scoped to Davao
WHO CAN SEE IT       Anyone (guest)
WHO ACTS NEXT        Customer — selects a result
NEXT SYSTEM ACTION   Navigate to shop profile
WHAT CUSTOMER SEES   A filtered list/map of shops with distance, specialization match, open-now state
```

## 6. Shop Profile and Service Selection

```
CUSTOMER ACTION      Open a shop from discovery
DATA SUBMITTED       {slug} in the URL
API / BACKEND        GET /public/stores/{slug}, .../services, .../service-packages, .../posts, .../reviews
DATABASE ENTITY      stores, services, service_pricing, service_packages, store_posts, store_reviews
INITIAL STATUS       n/a — read-only
WHO CAN SEE IT       Anyone
WHO ACTS NEXT        Customer — chooses Book Appointment / Repair Request / Bulk Order / Made-to-Order
NEXT SYSTEM ACTION   Route to the chosen action's own workflow (Sections 7–8)
WHAT CUSTOMER SEES   Storefront, itemized pricing, ratings, completed-work posts
```

**[CURRENT] Back navigation** — the Shop Profile hero banner (`StoreHeroHeader.tsx`) now has a floating Back button (top-left, overlaid on the cover image, all breakpoints) calling `router.back()` — real browser-history back, so a customer arriving from `/search` (with their query still intact), `/map`, a Catalog Item, or anywhere else returns to that exact prior state rather than a hardcoded destination.

**[CURRENT] Color-family filtering and Model/Fabric presentation** — `catalog_items.color` (real column) now has data populated for all seeded items (`CatalogItemsSeeder.php`), fixing what was previously a data-completeness gap (most items had no color value, so any color filter returned zero results — not a missing feature, a seeding gap). This now powers:

- **Multi-select color filtering** grouped into named families (White & Neutrals, Black & Grays, Blues, Reds & Burgundies, Pinks & Peaches, Greens, Yellows & Golds, Purples, Browns & Earth Tones — `src/lib/colorFamilies.ts`), available on `/search`, `/search?tab=showroom`, and the Shop Profile's Catalog tab (`ColorFamilyFilterSection.tsx`, reused in both `PortfolioFilterSheet.tsx` and the search filter sidebars/drawers). Selections join into one comma-separated `color` query value; each selected color renders as its own removable chip (`Color: White ×`).
- **Backend OR-matching on multiple colors**: `CatalogController::publicShowroom()` splits `?color=White,Ivory,Sky Blue` on commas and matches any of them via `LOWER(color) LIKE` (`orWhere` chain) — a real query change, not client-side-only filtering. The Shop Profile Catalog tab's own client-side filter (`StoreCatalogTab.tsx`, unpaginated fetch, same rationale as its existing filters) mirrors the same any-of-selected-colors logic.
- **Model/Fabric viewing toggle** (`ModelFabricToggle.tsx`, a shared component now used from the Catalog Item detail gallery, Search Showroom, and Nearby Stores' catalog rail) switches between the garment photo and its fabric swatch photo.
- **Color and fabric name display** on the Catalog Item detail page (`CatalogProductInfo.tsx`, via `getColorHex()`/`getFabricLabel()` in `fabricHelper.ts`) — a color swatch pill (e.g. a dot + "Ivory") and a fabric-name pill (e.g. "Fabric: Piña Cocoon Weave") next to price/title.
- No new database table or column — `catalog_items.color`/`fabric_image_url`/`material` are pre-existing columns; this pass populated and surfaced them, it didn't add new schema.

## 7. Appointment Workflow

### 7.0 [CURRENT] Entry, authentication gate, and the 3-step frontend

`/store/[store_id]/book` (`useBookingWizard.ts`) is a **client-side-gated, authenticated-only** flow today, layered on top of a backend that itself still accepts anonymous submissions unchanged (7.1's table below is still the real API contract). The gate lives once, on the wizard page itself, not duplicated on every "Book Appointment" link (Shop Profile hero, Catalog Item detail, Service detail, Map, `/account/appointments` "book again", etc.) — whichever page linked here, the wizard checks auth on mount:

```
Any "Book Appointment" entry point (Shop Profile / Catalog Item / Service Detail / Map / ...)
        ↓
/store/[store_id]/book?<context params>
        ↓
useAuthStore().hydrated?  → no  → show loading spinner, wait
        ↓ yes
user present?  → no  → router.replace('/login?redirect=' + this exact URL incl. all context params)
        ↓ yes
Wizard Step 1 renders
```

- **Login** (`/login`) already supported an optional `?redirect=` param before this pass (used for other gated actions app-wide) — a customer-role login now sends them to `redirectPath || '/'`, so arriving via the booking gate lands them back on Step 1 with every original query param (`ref`, `ref_price`, `service_id`, `branch`, `ref_type`, `package_id`, …) intact. **Normal login (no `redirect` param) still goes to `/`, unchanged.**
- **Register** (`/register`) does not auto-authenticate (unchanged — see Section 3/16). It now reads the same `redirect` param and, only when one is present, forwards to `/login?registered=true&redirect=<it>` instead of the plain customer default (`/`), so the customer still has to actually log in once to obtain a session, then lands back on Step 1. **Normal signup (no `redirect` param) still goes to `/`, unchanged** — this is the one behavior this pass deliberately did NOT touch for the non-booking case, matching the explicit instruction that only the appointment-triggered path changes.
- Login's own "Create an Account" link forwards its current `redirect` value into `/register?redirect=...` so choosing to sign up instead of logging in doesn't drop the booking context.
- **No backend change was made to support this** — `PublicBookingController::submit()` and its `auth:sanctum`-free route are exactly as documented in 7.1; the gate is a frontend routing decision only, and `handleSubmit` still sends `name`/`email` from the resolved `user` object as it always could.

### 7.1 Full lifecycle

```
Appointment::STATUSES     = pending, confirmed, in_progress, completed, cancelled, no_show
Appointment::TRANSITIONS  = pending     → {confirmed, cancelled}
                            confirmed   → {in_progress, cancelled, no_show}
                            in_progress → {completed, cancelled}
                            completed / cancelled / no_show are terminal
```

| Who                              | Can create                                                                | Can confirm | Can reschedule               | Can cancel                                                            | Can mark in_progress/completed                       |
| -------------------------------- | ------------------------------------------------------------------------- | ----------- | ---------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| **Guest**                  | Yes — public booking,`status='pending'`, `intake_channel='online'`   | No          | No                           | No                                                                    | No                                                   |
| **Customer (logged in)**   | Same public booking path                                                  | No          | No                           | Own only, no reason required (`cancelMine`), never blocks rebooking | No                                                   |
| **Staff**                  | No                                                                        | No          | No                           | No                                                                    | Yes — the*only* two transitions staff are allowed |
| **Branch Manager / Owner** | Yes — internal booking, auto-`confirmed`, `intake_channel='walk_in'` | Yes         | Yes (pending/confirmed only) | Yes — reason required, may block rebooking                           | Yes                                                  |

### 7.2 Sequential flows

**Guest / Customer books online:**

```
CUSTOMER ACTION      Fill booking form (type, date/time, service if required, contact info, payment proof if non-cash)
DATA SUBMITTED       name, email, phone, appointment_type, scheduled_at, service_id?, payment_method, payment_receipt_path?
API / BACKEND        POST /catalog/{slug}/book  (PublicBookingController::submit)
DATABASE ENTITY      appointments (+ users, created if new — Section 3, State 2)
INITIAL STATUS       pending, intake_channel = online
WHO CAN SEE IT       Store owner/branch_manager/staff (store-scoped index); the customer, once logged in, via /my-appointments
WHO ACTS NEXT        Owner or branch_manager — confirm or reject(cancel)
NEXT SYSTEM ACTION   AppointmentBookedNotification → store owner
WHAT CUSTOMER SEES   "Booked, awaiting confirmation" (immediately); status updates only if/when they check /account/appointments while logged in
```

**Walk-in, staff/owner-entered:**

```
CUSTOMER ACTION      Physically present at the shop
DATA SUBMITTED       Same shape, entered by staff/owner
API / BACKEND        POST /stores/{store}/appointments  (AppointmentController::store, role: store_owner/branch_manager)
DATABASE ENTITY      appointments
INITIAL STATUS       confirmed (auto), intake_channel = walk_in
WHO CAN SEE IT       Store roles; the customer if the identity resolves to their own logged-in account
WHO ACTS NEXT        Any overlapping *pending* online request is auto-preempted (marked rescheduled, customer notified)
NEXT SYSTEM ACTION   —
WHAT CUSTOMER SEES   Nothing automatically unless they separately check — this is an in-person transaction
```

**Cancellation (customer-initiated):**

```
CUSTOMER ACTION      Tap Cancel on their own appointment
API / BACKEND        DELETE /my-appointments/{id}  (AppointmentController::cancelMine)
RESULT               status → cancelled. No reason stored. rebooking_blocked never set.
```

**Cancellation (store-initiated):**

```
STAFF/OWNER ACTION   Cancel on the customer's behalf
API / BACKEND        DELETE /stores/{store}/appointments/{id}  (AppointmentController::destroy, owner/manager only)
RESULT               status → cancelled, cancellation_reason required, rebooking_blocked optional
CUSTOMER SEES        AppointmentStatusNotification with the reason
```

**Reschedule (store-initiated only — customers cannot reschedule directly):**

```
Only pending/confirmed can move; re-checked against closures and conflicts; old time stamped into notes;
reminder flag reset so the new time gets its own reminder.
```

### 7.3 Direct answers

1. **Can an appointment exist without a Job Order?** Yes — most do, indefinitely, for consultation/measurement/pickup types that never convert.
2. **Can a Job Order exist without an appointment?** Yes — all three customer self-service order types (Section 8) create a `JobOrder` with zero appointment involved.
3. **Is an appointment automatically converted into an order?** No. Conversion is a manual staff/owner action: `JobOrderController::store` accepts an optional `appointment_id`.
4. **Can an existing order be linked to an appointment?** Yes, at job-order creation time only, via that same optional field — reference images, reference link, and garment category carry over from the appointment onto the job.
5. **What happens when an appointment is completed?** `status → completed`; type-specific rules apply (`fitting` and `pickup` types require a `job_order_id` already set to complete); an optional `outcome` and `fitting_notes` can be recorded, the latter copied onto the linked job order's notes so production staff see it without opening the appointment record.
6. **Can a Job Order have more than one appointment?** Yes, structurally, today — `JobOrder hasMany Appointment` already permits 0, 1, or many rows against the same `job_order_id`; nothing schema-side forces exactly one. What's missing is a customer-visible grouped view of them — see 7.4 (TARGET).

### 7.4 TARGET — Appointment as a visit, not a mandatory single first step

> Full detail and rationale: `docs/CUSTOMER-JOURNEY-TARGET.md`, Sections 4–5. Summarized here so this document stays the single place a developer checks for Customer Module behavior.

**Target model:** `Appointment` = a scheduled customer visit related to a tailoring transaction — not a required first step, and not capped at one per job. **Correction:** appointments are not born under a Job Order — the first one typically happens *before* a Job Order exists (a consultation leads to the job, not the reverse). The accurate shape:

```
Appointment 1 — Consultation / Measurement   (created first; no Job Order exists yet)
        ↓
Job Order created
        ↓
Appointment 1 may then be linked to it (appointment_id, set at Job Order creation — 7.3 item 4)
        ↓
Additional appointments created afterward, each independent, each optionally linked to the same job:
   ├── Fitting        (may be auto-created when the JobOrder reaches ready_for_fitting)
   ├── Adjustment
   └── Pickup
```

**Rule to carry forward:** appointments are independent scheduled-visit records that may optionally be linked to a Job Order, not sub-records that live "under" one — full rationale: `docs/CUSTOMER-JOURNEY-TARGET.md` §4.

**RBAC change (the one real target change to 7.1's table):**

|                                          | Current (7.1)             | Target                                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create internal/follow-up appointment    | Owner/Branch Manager only | **+ Staff**, for operational follow-ups only, via a narrow scoped action (not the existing owner/manager `store()` route, which also carries fields like payment method Staff should not touch) |
| Customer creates a follow-up appointment | Never                     | **Still never** — this stays Staff/Owner-only under the target too, matching the realistic "staff tells the customer a date verbally, then logs it" flow                                         |

**Backend gap this depends on:** `JobOrderTrackingController::myOrderDetail()` does not currently return the job's linked appointments — verified against its actual response shape (Section 12 below). Target: add an `appointments` key to that response so the grouped view above is possible without a separate lookup.

### 7.5 [CURRENT] The 3-step frontend wizard, step by step

Steps were restructured this pass around one rule: **nothing already known gets asked twice.** Because Section 7.0's gate guarantees `user` is always present by the time Step 1 renders, and because a Catalog Item/Service entry point already carries its own context, the wizard only ever asks for what it genuinely doesn't yet know.

```
STEP 1 — Purpose only
  BookingTypeSelector (consultation/measurement/fitting/alteration/pickup)
  + a collapsible "Booking Policy" blurb (storeSettings.booking_policy), if the store set one

STEP 2 — Branch, Schedule & Relevant Details
  Service picker         — ONLY if hasServiceContext is false (below)
  Material/Fabric choice — ONLY for consultation/measurement (Section 7.5.3)
  Branch selector        — store-scoped only (storeSettings.branches; never cross-shop)
  Date & Time            — InteractiveCalendar, real availability/conflict data
  Relevant Details:
    - Contact Number (editable, seeded from user.phone — name/email are NOT
      re-asked, they're read from the authenticated account)
    - Notes (free text, ≤120 chars)
    - Owner's custom booking_questions (dynamic, store-configured)
    - Payment method + reference/receipt — ONLY if store.fitting_fee > 0

STEP 3 — Review (read-only, no new inputs)
  Design/Service context card  → [Change] returns to Step 1
  Schedule card (branch+date+time+purpose) → [Edit] returns to Step 2
  Contact (read-only: name/email from account, phone from Step 2)
  Material / existing-order-reference / notes / owner-question answers (read-only, shown only if filled)
  "What to Bring" (Section 7.5.4) — shown only when material = customer-supplied
  Payment method (read-only) — shown only if the store charges a fee
  [Book Appointment] submit
```

`BookingDesktopSummary` mirrors the same fields as a persistent `lg:`-breakpoint sidebar during Steps 1-2 (hidden on Step 3, where the main column already is the summary) — same information architecture, not a second source of truth.

#### 7.5.1 Visit purpose is no longer a universal 5-option list

`availableBookingTypes` (in `useBookingWizard.ts`) filters `Appointment::TYPES` before Step 1 ever renders it:

- If the customer arrived with a Catalog Item/design reference (`ref` param set): **Pickup and Alteration are hidden** — neither makes sense against a design that doesn't exist as a physical garment yet.
- Otherwise (no design reference): **Pickup and Fitting are hidden by default** — both only make sense against an already-existing order/garment, not a first visit. A link/button ("Already have an order or appointment with this shop?") reveals them on demand (`hasExistingOrder` toggle). A deep link carrying `ref_type=fitting` or `ref_type=pickup` (e.g. a link sent by staff) sets this toggle on automatically.
- This is presentation-layer filtering only — `Appointment::TYPES` itself is unchanged on the backend; no new type was added or removed.

#### 7.5.2 Catalog Item / Service context suppresses the Service picker

`needsServicePicker` is gated on `hasServiceContext = !!serviceIdParam`, **not** on whether that service happens to still resolve against the public services list. Concretely:

- A Catalog Item's detail page (`useCatalogItemDetail.ts`) already appends `&service_id={item.service.id}` to its "Book Appointment" href whenever `item.service` (the `catalog_items.service_id` FK) is set — this was already true before this pass.
- `useBookingWizard.ts` now trusts that param unconditionally: if it's present, the Service picker never renders, even if that exact service is later filtered out of `booking-settings`'s public list (e.g. deactivated) — the customer isn't asked to pick a different one just because of that edge case.
- **The picker only reappears when the entry point genuinely carried no service_id at all** — a Catalog Item with no linked Service, a direct Shop-Profile-first booking, etc. This matches the explicit rule: only ask when there's genuinely no context, never re-ask when there is.
- The selected Service/Catalog Item stays visible throughout (via `BookingReferenceCard` on Steps 1-2, `BookingReferenceSummary` on Step 3, and `BookingDesktopSummary` on desktop) — never re-collected.

#### 7.5.3 Material/Fabric — a structured choice, not a new backend field

`BookingMaterialSelector` (Step 2, consultation/measurement only) offers exactly two radio options — **"I'll bring my own fabric/sample"** (with an optional free-text description) or **"I'll use the shop's material"**. No fabric inventory, SKU, supplier, or technical classification exists or was added. The choice is encoded into the existing free-text `notes` column at submit time using the same bracket-tag convention already used for design-reference/package-inquiry context (e.g. `[Material: Customer will bring own fabric/sample — Cotton fabric]`) — **no new database column, no new API field.**

#### 7.5.4 "What to Bring" and pending vs. accepted state

- Immediately after submission, `BookingSuccessState` shows **"Appointment Request Sent — Waiting for [store] to confirm your slot"** (never "Confirmed" — the row is created `pending`, matching 7.1's `Appointment::STATUSES`) alongside the real purpose/branch(+distance)/date/time just submitted, plus a "What to Bring: ✓ Your fabric/sample" card when material = customer-supplied. This is rendered directly from in-memory wizard state (the customer's own submission), not re-fetched.
- **Not yet implemented:** the `/account/appointments/[id]` detail page (the "Accepted" view once the store confirms) does not re-parse the `[Material: ...]` tag out of `notes` to re-surface "What to Bring" later — a customer would need to re-read the free-text notes on that page today. This is a genuine, current gap, not solved by this pass; flagged here rather than claimed done.

#### 7.5.5 Service/Catalog pricing labels (frontend-only, no new pricing model)

`src/lib/servicePricing.ts` (`getServicePriceLabel()`) is the one place price-label wording is decided, applied everywhere a bare `Service.base_price` is shown in the booking flow (BookingServicePicker's dropdown, BookingReferenceSummary, BookingDesktopSummary):

- `base_price === null` (a real, existing-nullable column — `services.base_price` is `decimal(10,2) nullable`) → **"Price depends on requirements"**. This is a genuinely quote-based service in the current data model, not a fabricated label.
- `base_price` set → **"Starting at ₱X"** — never "Total" or "Final Price". The Job Order remains the only place a real final transaction amount is computed (Section 8.1); this pass introduced no quotation engine.
- A **specific Catalog Item's** own price (`CatalogItem.price`) is shown as a plain `₱X,XXX` figure, unchanged — it is a specific offering's specific price, not a "starting" figure, and the two are never shown as contradicting each other for the same context (Service context = "Starting at…", Catalog Item context = the exact price).
- **Not implemented:** quantity-tiered pricing (e.g. "₱500/piece for 1-9, ₱450/piece for 10-24"). `Service.min_order_qty` exists (bulk-order minimum-quantity validation, Section 8) but there is no per-tier price table anywhere in the schema — this pass deliberately did not fabricate one. Bulk/quantity capture, where it exists at all, remains at the JobOrder self-service level (Section 8), not inside the Appointment form.

## 8. Direct Order Workflow

> **TARGET note:** the three paths below all assume a specific `service_id`/`catalog_item_id` at submission. The target journey (`docs/CUSTOMER-JOURNEY-TARGET.md` §3) adds a third case — a customer with no specific design in mind — which is **not** a new order type: it routes to the existing `consultation` Appointment type instead (Path C below), reusing 7.1's mechanism rather than adding a new backend entity.
>
> - **Path A — specific catalog item selected** → Made-to-Order (as documented below).
> - **Path B — general garment/service, no specific item** → target: route to a Consultation appointment (7.4), same as Path C.
> - **Path C — customer needs to talk it through first** → Consultation appointment, already fully supported today.

Three customer self-service paths exist, all under `auth:sanctum` (any authenticated role — `AMBIGUITY 2`, Section 19), all creating a `JobOrder` directly with **no appointment required**:

```
CUSTOMER ACTION      Submit a Repair/Alteration request
DATA SUBMITTED       service_id, garment_description, pre_existing_damage_notes, pricing_ids[], reference_images[]
API / BACKEND        POST /stores/{slug}/repair-requests  (JobOrderController::customerRepairRequest)
VALIDATION           Service must exist and carry the alteration_repair type; all pricing_ids must belong to it
DATABASE ENTITY      job_orders
INITIAL STATUS       pending, payment_status = unpaid, intake_channel = online, garment_category = 'alteration_repair'
WHO CAN SEE IT       Store owner/staff (index/show, store-scoped) and the customer (/my-orders, /track/{code})
WHO ACTS NEXT        Owner/staff — move through the production pipeline (Section 8.1) or rejectOrder()
NEXT SYSTEM ACTION   NewJobOrderNotification → store owner
WHAT CUSTOMER SEES   order_number + tracking_code immediately; live status via /my-orders or /track
```

```
CUSTOMER ACTION      Submit a Bulk/Team order off a catalog item
DATA SUBMITTED       catalog_item_id, organization_name?, roster[] (name?, size — up to 500 rows)
API / BACKEND        POST /stores/{slug}/bulk-orders  (JobOrderController::customerBulkOrder)
VALIDATION           Item must have a linked bulk_sublimation-typed Service; roster count must meet min_order_qty
DATABASE ENTITY      job_orders (custom_order_data.team_roster holds the full roster)
INITIAL STATUS       pending, payment_status = unpaid, total_amount = item price × roster count
WHO ACTS NEXT        Owner/staff — pipeline auto-detects bulk (isBulkOrder()) and swaps pattern_making for mass_cutting_printing
```

```
CUSTOMER ACTION      Submit a Made-to-Order for a single showroom item
DATA SUBMITTED       catalog_item_id, size?
API / BACKEND        POST /stores/{slug}/made-to-order  (JobOrderController::customerMadeToOrder)
VALIDATION           Item must have a linked Service that is NOT bulk_sublimation-typed (that's Bulk Order's job)
DATABASE ENTITY      job_orders
INITIAL STATUS       pending, payment_status = unpaid, total_amount = item price
```

### 8.1 Production pipeline (owner/staff side, for context)

```
JobOrder::STATUSES = pending → design → pattern_making (or mass_cutting_printing for bulk)
                    → cutting → sewing → ready_for_fitting → final_adjustments
                    → qc_ironing → ready_for_pickup → completed
                    (cancelled / rejected / on_hold reachable from most points)
```

`ready_for_fitting` auto-creates a Fitting appointment for the customer — the one automatic Order→Appointment link in the system. No other transition creates an appointment (`AMBIGUITY 5`, Section 19, re: pickup).

Staff may only move `status` within allowed transitions and cannot delete/reassign/reject/apply discounts — those remain owner/branch_manager actions. A 50% down-payment gate blocks entry into any production-committing stage (`JobOrder::STAGES_REQUIRING_DOWNPAYMENT`).

### 8.2 What the Customer never does here

Approve their own order, assign staff, change production status, or apply a discount. The customer's only actions after submission are: read status (Section 12) and, informally, contact the shop — there is no "customer requests cancellation of a JobOrder" endpoint analogous to `cancelMine()` for appointments.

## 9. Measurement Workflow

```
CUSTOMER ACTION      None — the customer never initiates this on their own
STAFF/OWNER ACTION   Records measurements during a fitting/consultation visit
API / BACKEND        POST /stores/{store}/measurements  (MeasurementController::store, role: store_owner/branch_manager/staff)
DATABASE ENTITY      measurements — { store_id, customer_id, source, profile_name, version=1, metrics (freeform JSON), notes }
```

- **Can Customer create measurements?** No — no customer-facing write endpoint exists.
- **Can Customer edit measurements?** No.
- **Who officially records them?** Store staff, branch_manager, or owner only.
- **Who creates a new version?** The same three roles, via `update()` — which never mutates the existing row. It stamps `superseded_at = now()` on the current row and inserts a new row with `version + 1`. A superseded row is explicitly read-only (attempting to edit one returns `422`).
- **How does the Customer view measurements?** `GET /my-measurements` (`MeasurementController::myMeasurements`) — every version of every profile they have across every store, filtered strictly to `customer_id = self`, read-only.
- **How does a Job Order reference a measurement?** `job_orders.measurement_id` is a single nullable FK to one specific `measurements` row, picked by staff at job-creation time (not automatic).
- **What happens when measurements are updated later?** The old version becomes permanently readable but frozen; any `JobOrder` already pointing at that exact version keeps pointing at it — it is never silently repointed to the new version.
- **Does an old Job Order retain the exact measurement version used at that time?** Yes — this is the specific guarantee the versioning design exists to provide.
- **Structure:** confirmed still `profile_name` (free text) + dynamic `metrics` (freeform JSON) — there is no garment-type or service foreign key on `Measurement`. This is existing, deliberate behavior (see the completed audit, Phase 7) and is documented here as-is, not treated as something to fix.

## 10. Customer → Staff/Owner Data Flow

```
Customer books appointment
        ↓
appointments row created (pending/online or confirmed/walk_in)
        ↓
Staff/Owner retrieves it via GET /stores/{store}/appointments (store-scoped index)
        ↓
Owner/branch_manager confirms, reschedules, or cancels; staff may only progress in_progress→completed
        ↓
Customer sees the update via GET /my-appointments (if logged in) or is notified directly (walk-in)
```

```
Customer creates a direct order (repair / bulk / made-to-order)
        ↓
job_orders row created, status=pending
        ↓
Owner/branch_manager assigns staff per production stage (job_order_staff pivot)
        ↓
Staff updates status within allowed transitions
        ↓
Customer tracks via GET /my-orders or GET /track/{code} — same underlying row, two read paths
```

```
Customer needs to be measured
        ↓
Staff records the Measurement during the visit (not something the customer submits)
        ↓
New version stored; old versions preserved read-only
        ↓
Customer can view their own measurement history via GET /my-measurements
        ↓
Staff optionally attaches a specific measurement_id when creating the JobOrder for this customer
```

No step above requires the customer to manually relay data staff could otherwise retrieve — every handoff is "customer submits → row exists → staff queries the row," never "customer downloads/copies data → staff re-enters it."

## 11. Staff/Owner → Customer Data Flow

```
Appointment:  pending → confirmed              → AppointmentStatusNotification → customer sees it in /account/appointments
Order:        pending → design → … → completed → JobStatusUpdatedNotification-style flow → customer sees it in /account/orders or /track
Measurement:  recorded/new version              → no push notification — customer must check /account/measurements
Order:        → ready_for_pickup                → ready_for_pickup_at stamped, customer notified; pickup itself is coordinated outside the system (Section 19, AMBIGUITY 5)
```

All of these read the exact same row the staff/owner action just wrote — there is no separate "customer view" copy of any status field anywhere in the schema.

## 12. Order Tracking Workflow

Two independent read paths onto the **same** `job_orders` row, both served by `JobOrderTrackingController`:

|                  | `myOrders()` / `myOrderDetail()`                                                                                                                                                                                                           | `show()` (public, by code)                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Auth             | Required (`auth:sanctum`)                                                                                                                                                                                                                    | None                                                                               |
| Scope            | `customer_id = current user`                                                                                                                                                                                                                 | Any order matched by`tracking_code` or `order_number` (dash/space-insensitive) |
| Consumed by      | `/account/orders`, `/account/orders/[id]`                                                                                                                                                                                                  | `/track`, `/track/[code]`                                                      |
| Fields returned  | Same safe subset both ways: order_number, tracking_code, status, garment_category, item/service name, is_rush, due_date, total_amount, balance, payment_status, progress_photos, per-stage timestamps                                          | identical                                                                          |
| Stage timestamps | Best-effort, assembled from`job_order_staff.assigned_at` per stage (no dedicated stage-history table) — stages with nothing tracked (`mass_cutting_printing`, `ready_for_fitting`, `completed`) are left `null` rather than guessed | identical                                                                          |

Neither path exposes staff assignments, internal notes, or payment records — only the fields a customer is meant to see.

**TARGET — two levels of tracking detail, and grouped appointments.** Staff/Owner keep the full granular pipeline; the customer sees a collapsed phase derived from the same real `status` value, never an invented one (full rationale: `docs/CUSTOMER-JOURNEY-TARGET.md` §8):

| Internal`JobOrder.status`                                                        | Customer-facing phase                         |
| ---------------------------------------------------------------------------------- | --------------------------------------------- |
| `pending`                                                                        | Order Received                                |
| `design`, `pattern_making`, `mass_cutting_printing`, `cutting`, `sewing` | In Production                                 |
| `ready_for_fitting`, `final_adjustments`                                       | Fitting / Adjustment                          |
| `qc_ironing`                                                                     | Finalizing                                    |
| `ready_for_pickup`                                                               | Ready for Pickup                              |
| `completed`                                                                      | Completed                                     |
| `on_hold`, `cancelled`, `rejected`                                           | Shown as-is — exceptions are never collapsed |

This is a presentation-layer mapping only — no backend status changes. Separately, target also adds the job's linked `appointments` to `myOrderDetail()`'s response (7.4) so the customer's order-detail screen can show "Appointment 1/2/3/4" grouped under the job, not just as separate rows in `/account/appointments`.

## 13. Customer Screen Flow

| Screen                               | Purpose                   | Customer input                           | Backend call                                                       | Result                               | Next                                      |
| ------------------------------------ | ------------------------- | ---------------------------------------- | ------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------- |
| `/search`, `/map`                | Shop Discovery            | search/filter terms                      | `GET /public/stores`                                             | Filtered list/map                    | Select shop                               |
| `/store/[id]`                      | Shop Profile              | —                                       | `GET /public/stores/{slug}` (+services/packages/posts/reviews)   | Full profile                         | Catalog / Book / Order                    |
| `/store/[id]/catalog`              | Browse items              | filter/sort                              | `GET /catalog/{slug}`, `.../{item}`                            | Item detail                          | Bulk / Made-to-Order                      |
| `/store/[id]/book`                 | Book appointment          | purpose/branch/date/time/details (Section 7.5) | `GET booking-settings`, `POST .../book`                        | Appointment created (pending/online) | Track via account or wait to be contacted. **Not logged in? Redirected to `/login` first (Section 7.0) — see the Identity row below.** |
| `/store/[id]/repair-request`       | Repair order              | garment desc/damage notes/pricing/images | `POST .../repair-requests`                                       | JobOrder created                     | `/account/orders`                       |
| `/account/orders`, `/[id]`       | Track orders              | —                                       | `GET /my-orders(+/{id})`                                         | Live status                          | Repeat until completed                    |
| `/track`, `/track/[code]`        | Track orders (guest)      | code or order number                     | `GET /track/{code}`                                              | Live status, no login                | Repeat                                    |
| `/account/appointments`, `/[id]` | Track/cancel appointments | — / cancel                              | `GET /my-appointments(+/{id})`, `DELETE /my-appointments/{id}` | Status / cancellation                | Rebook if needed                          |
| `/account/measurements`            | View measurements         | —                                       | `GET /my-measurements`                                           | Versioned read-only list             | Informational only                        |
| `/register`, `/login`            | Identity                  | credentials                              | `POST /auth/register` \| `/auth/login`                         | Token + unlocked history             | **Normal (no `?redirect=`): `/` (landing page), for both login and signup — not `/account/*`.** With a `?redirect=` param (set automatically by the booking gate, Section 7.0): that URL instead. Register itself never auto-authenticates either way — it always continues to `/login` next (`?registered=true`, plus `&redirect=...` when one was carried in). |
| `/account/settings/*`              | Manage profile            | personal info/password/avatar            | `PUT /profile/*`, `POST /profile/upload`                       | Profile updated                      | —                                        |

## 14. Entity / Source-of-Truth Matrix

| Data              | Source of truth                   | Created by                                                                                                                                                              | Updated by                                                                        | Read by                                                     | Customer access                                                                                 |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| User (identity)   | `users`                         | Self (register) / system (guest booking) / staff-owner (walk-in CRM add)                                                                                                | Self (profile settings) / self (claim-on-register) / staff-owner (CRM edit)       | Self, store staff/owner (own customers only), admin (no UI) | Read/update own profile only                                                                    |
| Appointment       | `appointments`                  | Customer (public booking, any auth state) / owner-manager (internal walk-in)                                                                                            | Owner-manager (full) / staff (status only, 2 transitions) / customer (cancel own) | Store roles (store-scoped) + owning customer                | Read own; cancel own; no edit/confirm                                                           |
| JobOrder          | `job_orders`                    | Owner/staff/manager (full form) OR customer (3 self-service types)                                                                                                      | Owner-manager (full) + staff (status/production within allowed transitions)       | Store roles + owning customer                               | Read own (2 paths); create via 3 self-service types                                             |
| Measurement       | `measurements`                  | Staff/owner/manager only                                                                                                                                                | Same (creates new version, never mutates)                                         | Store roles + owning customer (read-only)                   | Read own, own rows only, all stores                                                             |
| Service / Pricing | `services`, `service_pricing` | Owner only                                                                                                                                                              | Owner only                                                                        | Everyone (public)                                           | Read-only                                                                                       |
| Store             | `stores`                        | Owner (register)                                                                                                                                                        | Owner (profile) + admin (status)                                                  | Public (if approved+visible) + owner (own) + admin (all)    | Read-only public profile                                                                        |
| Payment           | `payments`                      | Owner/manager                                                                                                                                                           | Owner/manager (verify/reject)                                                     | Store roles                                                 | None directly — only the rolled-up`payment_status`/`balance` on their Appointment/JobOrder |
| Notification      | `notifications`                 | System, on controller actions                                                                                                                                           | The addressed user (read/delete)                                                  | The addressed user only                                     | Own notifications only                                                                          |
| SupportTicket     | `support_tickets`               | Owner (`SupportTicketController::store`, billing/problem/general/update_request) OR customer (`CatalogInteractionController::report`, `product_report` type only) | Admin (reply/status — no frontend yet) / customer (reply to own)                 | Admin (no UI) + ticket owner via`/my-tickets`             | Read/reply to own; create only via "Report This Product"                                        |

## 15. Status Lifecycle Reference

```
Appointment  pending → confirmed → in_progress → completed
                  ↘        ↘            ↘
                 cancelled  cancelled    cancelled
                            no_show

JobOrder     pending → design → pattern_making|mass_cutting_printing → cutting → sewing
                  → ready_for_fitting → final_adjustments → qc_ironing
                  → ready_for_pickup → completed
             (cancelled / rejected / on_hold reachable from most points)

payment_status (Appointment & JobOrder)   unpaid|pending → partial → paid

Store.status   pending → approved | rejected | suspended
```

## 16. Guest / Shadow Account Flow

```
Guest fills out public booking form (name, email, ...)
        ↓
PublicBookingController::submit()
        ↓
users row found by email, or created (password_set_at = NULL, random password, customer Role attached)
        ↓
appointments row created, customer_id = that user's id, status=pending, intake_channel=online
        ↓
No token issued — the guest's browser session is NOT authenticated as this user
        ↓
[Later] The same person registers at /register with the same email
        ↓
AuthController::register() finds the unclaimed row (password_set_at IS NULL) and claims it in place —
name/email/password overwritten, password_set_at stamped, customer_id-linked history untouched
        ↓
Customer logs in and immediately sees their prior booking under /account/appointments
```

The walk-in CRM path (`CustomerController::store`) follows the identical claim mechanism, keyed by phone instead of email when no real email was ever on file (Section 3).

## 17. End-to-End Customer Journey

```
DISCOVERY (guest or logged-in)
   │  GET /public/stores
   ↓
SHOP PROFILE / CATALOG
   │  GET /public/stores/{slug}, /catalog/{slug}
   ↓
CUSTOMER CHOOSES ACTION
   │
   ├── APPOINTMENT (no login required) — an independent record, NOT a JobOrder
   │      │  POST /catalog/{slug}/book
   │      ↓
   │   Appointment (pending/online, shadow account created if new)
   │      │  Owner/Branch Manager only: confirm, reschedule, or store-side cancel (reason required)
   │      │  Customer: may cancel their own (no reason required) — cannot confirm/reschedule
   │      ↓
   │   Once confirmed, Staff performs only the two allowed transitions: in_progress → completed
   │      │
   │      ↓ (stays independent UNLESS an owner/staff member explicitly attaches
   │      │  appointment_id when creating a JobOrder — this never happens automatically)
   │   Optionally linked to a JobOrder afterward — the appointment itself never becomes one
   │
   └── DIRECT ORDER (login required) — created independently, no appointment involved
          │  POST /stores/{slug}/repair-requests | /bulk-orders | /made-to-order
          ↓
       JobOrder (pending, appointment_id = null unless explicitly linked)
          │  Owner assigns staff per stage
          ↓
       Staff records/attaches Measurement (if not already on file)
          ↓
       Production pipeline (design → … → qc_ironing)
          │  ready_for_fitting AUTOMATICALLY creates a Fitting appointment
          │  (the one direction where the system creates a link on its own —
          │  JobOrder → Appointment, never the reverse)
          ↓
       ready_for_pickup → completed
          │
          ↓
       Customer tracks the entire way via /account/orders or /track/{code}
```

This is the smallest coherent shape the actual code supports: **Appointment and Direct Order are two separate, independently valid customer entry paths.** An appointment does not automatically become a JobOrder — a JobOrder may optionally be linked to one (by an explicit `appointment_id` staff supplies at order-creation time), and a JobOrder can just as validly exist with no appointment at all, which is in fact the default for all three self-service order types. The single automatic bridge between the two runs the other direction: a JobOrder entering `ready_for_fitting` automatically creates a Fitting appointment. Measurement remains a staff-owned side-table either path can reference. Nothing here forces every appointment through an order, or every order through an appointment, because the code doesn't either.

## 18. Workflow Rules

1. **One backend, one table per concept.** Customer, Appointment, JobOrder, and Measurement each have exactly one table; every role reads the same rows.
2. **No manual re-entry.** Every customer-submitted form becomes a database row staff query directly — never a value staff retype from something the customer sent them outside the system.
3. **Role-narrowest-wins.** Every route uses the smallest role set that can legitimately perform it (see `routes/api.php`'s own inline comments) — staff never get owner-only actions (discount, reject, delete, staff assignment).
4. **Versioned, not overwritten.** Measurement edits fork a new version; nothing in the Customer Module ever destructively overwrites a prior state a JobOrder might depend on.
5. **Guest-safe by construction.** Every guest-facing write (public booking) is scoped so a stranger can never see or modify another customer's data — verified by the ownership checks (`customer_id === $request->user()->id`) on every "my-*" endpoint.
6. **Linking is a staff decision, not a system guess.** Appointment↔JobOrder and JobOrder↔Measurement links are explicit fields staff choose to populate — the system never heuristically infers a match.

## 19. Resolved / Documented Ambiguities

**AMBIGUITY 1 — A guest who books an appointment has no self-service way back to it.**
*Actual behavior:* `PublicBookingController::submit()` never issues a Sanctum token. `/my-appointments`, `/my-appointments/{id}`, and `cancelMine()` all require `auth:sanctum`. Unlike `JobOrder`, `Appointment` has no public `tracking_code`.
*Why ambiguous:* a guest has no documented way to check status or cancel without first registering with the same email used at booking.
*Smallest resolution:* document it as the intended path — a guest who wants self-service must register with the booking email to claim the shadow account (Section 16); the store can otherwise always reach them directly. No code change implied by this document.

**AMBIGUITY 2 — Direct-order self-service endpoints aren't role-gated to `customer`.**
*Actual behavior:* `/stores/{store}/repair-requests`, `/bulk-orders`, `/made-to-order` sit under the bare `auth:sanctum` group in `routes/api.php`, with no `role:` middleware — any authenticated role, including `store_owner` or `staff` logged into their own account, can call them.
*Why ambiguous:* unclear if a shop owner acting as a customer of a *different* shop is intentional (plausible in real life) or unreviewed.
*Smallest resolution:* treat as intentional for this workflow document; flag as a one-line confirmation item for whoever next touches these routes — not a change made here.

**AMBIGUITY 3 — Appointment→JobOrder linkage is opt-in, never enforced.**
*Actual behavior:* `JobOrderController::store` accepts an optional `appointment_id`; nothing requires or auto-detects the link.
*Why ambiguous:* if staff forgets it, the appointment's `outcome` stays `null` forever even though it demonstrably converted, and conversion-rate reporting undercounts.
*Smallest resolution:* document linking as a staff responsibility at order-creation time (Section 8), not a system guarantee.

**AMBIGUITY 4 — Customer-side support-ticket creation doesn't live where the route naming suggests.**
*Actual behavior:* `POST /tickets` is owner-only (billing/problem/general/update_request types, Owner→Admin). A customer's *only* ticket-creation path is `CatalogInteractionController::report()` ("Report This Product" on a catalog item), which creates a `SupportTicket` with `type='product_report'` directly — a completely different controller than `SupportTicketController`.
*Why ambiguous:* a developer looking for "where does a customer file a ticket" would reasonably check `SupportTicketController::store` first and conclude customers can't create tickets at all.
*Smallest resolution:* documented explicitly here (Section 14) — no code change, just naming this dual entry point clearly for whoever builds the Admin ticket-reading UI next.

**AMBIGUITY 5 (minor) — Pickup has no auto-generated appointment, unlike Fitting.**
*Actual behavior:* only the `ready_for_fitting` transition auto-creates an appointment; `ready_for_pickup` does not.
*Why ambiguous:* the customer is notified "ready for pickup" but there's no system-tracked pickup appointment unless staff manually creates a `pickup`-type one via the normal internal booking flow.
*Smallest resolution:* document as existing asymmetric behavior — pickup coordination happens outside the appointment system unless staff opts to formalize it.

**Not an ambiguity (checked and closed):** `/dashboard/catalog` vs. `/dashboard/portfolio` initially looked like a duplicated feature. Direct inspection of the Portfolio route files shows they are legacy redirect stubs into Catalog's own Portfolio tab — one feature, not two.

**AMBIGUITY 6 — `myOrderDetail()` doesn't return the JobOrder's linked appointments.**
*Actual behavior:* verified against its response shape (Section 12) — order_number, tracking_code, status, garment_category, item/service name, is_rush, due_date, total_amount, balance, payment_status, progress_photos, stage timestamps, store. No `appointments` key.
*Why ambiguous:* the schema already supports multiple appointments per job (7.3, item 6), but a customer viewing their order detail page has no way to see them grouped there today — only as separate rows in `/account/appointments`.
*Resolution — TARGET, not yet built:* add `appointments` to that response (7.4, `docs/CUSTOMER-JOURNEY-TARGET.md` §5). This is the specific, smallest change the target's "Appointment 1/2/3/4 under Job #1042" view depends on.

## 20. Future Staff Module Dependency

The Staff Module document must build directly on this contract:

```
Customer creates Appointment  → Staff/Owner must query GET /stores/{store}/appointments (store-scoped index)
                               → Owner/manager confirms; staff may only move confirmed-derived in_progress→completed
                               → Customer must be able to observe the result via GET /my-appointments

Customer creates JobOrder     → Staff/Owner must query GET /stores/{store}/jobs
                               → Owner assigns staff per production stage (job_order_staff pivot)
                               → Staff updates status within JobOrder::STATUSES/allowed transitions only
                               → Customer must be able to observe the result via GET /my-orders or /track/{code}

Customer requires measurement → Staff records it via POST /stores/{store}/measurements
                               → New version stored, old versions frozen
                               → Staff optionally attaches measurement_id when creating/updating the JobOrder
                               → Customer must be able to read it back via GET /my-measurements
```

Staff Module work should assume all of the above already exists and is stable — it should build the staff-side retrieval/action UI against it, not re-derive the data model.

**TARGET additions Staff Module must also inherit (`docs/CUSTOMER-JOURNEY-TARGET.md` §4, §13; `docs/PAYMENT-WORKFLOW.md` Part B):**

```
Staff GAINS: creating operational follow-up appointments (7.4) — a narrow, purpose-built action
             (date/time/purpose/notes/job_order_id only), not the full owner/manager store() form.
Staff LOSES: verifyPayment() authority on Appointment/CatalogOrder — once the single-step
             Owner/Branch-Manager payment capture model ships, there is no separate "verify" action
             left for Staff to perform; recording and verifying become one Owner/Manager-only step.
```

## 21. Future Owner Module Dependency

The Owner Module document must additionally account for everything Staff does, plus the owner-only supervisory layer this document already establishes as out of Staff's reach:

```
Owner-only actions on Customer-originated records:
  - Confirm/reject/reschedule an Appointment (Section 7)
  - Reject a JobOrder, apply a discount, reject a payment, assign staff (Section 8.1)
  - Read the Admin-facing SupportTicket a customer's product report generated (Section 14) — no frontend exists for this yet; that gap belongs to the Admin Module, not Owner, but Owner is where the ticket is *created* on the general/billing side
  - Approve their own Store's registration status — this is Admin, not Owner, and remains the one boundary Owner Module work must never cross
```

Owner Module work should treat Sections 7, 8, 9, and 14 of this document as its required inputs — every Owner-facing screen for appointments, orders, and measurements reads or writes exactly the rows this document already defines, never a parallel copy.

**TARGET additions Owner/Branch Manager Module must also inherit:**

```
Owner/Branch Manager GAINS: sole payment-capture/recording authority across ALL THREE entities
             (Appointment, CatalogOrder, JobOrder) via one unified capture SCREEN — not just
             JobOrder as today (Section 5). Recording and verifying collapse into one action.
             This is one consistent capture ACTION across three genuinely different payment
             shapes, not a merged data model: JobOrder keeps its running Payment ledger/balance,
             Appointment and CatalogOrder each stay a single flat payment declaration with no
             ledger. Do not assume "every payment = a JobOrder balance" — see
             `docs/CUSTOMER-JOURNEY-TARGET.md` §7 and `docs/PAYMENT-WORKFLOW.md` §3.
Owner/Branch Manager KEEPS: appointment confirm/reschedule/store-cancel (7.1), the 50% down-payment
             gate and completion-balance rule as constraints to surface, not reimplement, and every
             owner-only action already listed above.
```

Full detail: `docs/CUSTOMER-JOURNEY-TARGET.md` §13, `docs/PAYMENT-WORKFLOW.md` Part B.

## 22. Customer History (TARGET)

> Not built today — no aggregate history screen exists; the customer's records are only reachable as three separate screens (`/account/orders`, `/account/appointments`, `/account/measurements`). Full rationale: `docs/CUSTOMER-JOURNEY-TARGET.md` §10.

```
CUSTOMER
   ↓
HISTORY (new frontend screen only — no new table, no duplicated data)
   ├── Appointments    ← GET /my-appointments   (existing, unchanged)
   ├── Measurements    ← GET /my-measurements   (existing, unchanged)
   ├── Job Orders      ← GET /my-orders         (existing, unchanged)
   ├── Payment/balance ← already embedded in the JobOrder/Appointment payloads above
   └── Associated shops← already embedded (store name/slug/logo on each of the above)
```

This is purely a frontend aggregation of the three existing read endpoints — the only backend dependency it has is Section 7.4/19's `appointments`-on-`myOrderDetail()` addition, if the History view wants to show appointments grouped under their job order rather than as a flat list.
