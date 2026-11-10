# Admin Module — Authoritative Reference (thesis-defense version)

> **Single source of truth for the System Admin module (2026-11-07).** This file supersedes the older
> `docs/ADMIN-WORKFLOW.md` "scaffold / zero admin UI" framing and the stale "Known gaps" list in
> `docs/reviewer/4-ADMIN-MODULE.md`. Where a doc and the code disagree, the code wins:
> **`sutura-server/routes/api.php` (the `Route::prefix('admin')->middleware('role:admin')` group),
> `sutura-client/src/app/admin/*`, and `sutura-client/src/components/admin/*`.** Every claim below is
> checked against those, not against the thesis paper.

---

## 1. Who the System Admin is (thesis basis)

The system supports **four** primary roles: *system administrator, tailoring shop owners, tailoring
staff, and customers* (`Title&Objectives.md`, Scope §"The system supports four primary user roles…").
The System Admin is the **platform-level** role: it acts on records that span or precede any one
shop's operation. It has **zero** write access to a shop's operating data (services, catalog,
appointments, job orders, measurements, payments) — that boundary is what makes the admin role safe
and defensible (§5).

The admin module answers **two** thesis objectives (quoted verbatim; never paraphrase these in the
defense):

> **Objective — Administrative Dashboard:** "Administrative Dashboard for subscription monitoring,
> the system administrator will manage tailoring shop registration approvals, validate apparel
> categories, verify branch map locations, and oversee platform-wide activity and system
> performance."

> **Objective — Interactive Analytics (admin side):** "…the system administrator and tailoring shop
> owners will generate real-time visual reports on subscription activity, monthly sales revenue,
> outstanding customer balances, and individual shop productivity."

The Scope & Limitations section states the admin's concrete job (quoted verbatim):

> "The system includes an Administrative Dashboard that enables system administrators to review and
> approve tailoring shop verification requests before system access is granted, oversee active shop
> profiles, and validate custom apparel categories. It also monitors tier-based subscription billing,
> verifies submitted branch map locations, and generates real-time platform performance reports."

> "Administrators can monitor subscription activity, total registered shops, and platform revenue
> trends…"

**This is the lens for the whole module:** every admin capability below is traceable to one of these
sentences. The panelist's likely question is not "does it work?" but **"which objective is this for,
and is it in scope?"** — §2 answers that per feature, §4 draws the in/out-of-scope line, §6 is the
Q&A.

---

## 2. Traceability — every admin capability → thesis clause

The admin portal has **11 sections** (`src/components/admin/adminNav.ts`). Each maps to real routes
(`routes/api.php`) and to the thesis clause it satisfies. **Class** matters: *Objective-mandated* =
named in an Objective or the Scope statement; *Supporting governance* = consistent with "oversee
platform-wide activity" but **not** a separate thesis objective — say so plainly so a panelist cannot
catch a contradiction.

| # | Section (UI) | UI path | Real route(s) under `/admin` | Controller | Thesis anchor | Class |
|---|---|---|---|---|---|---|
| 1 | **Overview** | `/admin` | `GET /dashboard` · `GET /system-health` | `AdminDashboardController::overview` / `::systemHealth` | Obj — "oversee … system performance"; Scope — "generates real-time platform performance reports" | Objective-mandated |
| 2 | **Reports** | `/admin/reports` | `GET /reports/subscriptions` · `GET /reports/subscriptions/plans/{plan}/stores` · `GET /reports/revenue` | `AdminDashboardController::subscriptionReport` / `::planStores` / `::revenueReport` | Obj 7 — "reports on subscription activity"; Scope — "Administrators can monitor subscription activity, total registered shops, and platform revenue trends" | Objective-mandated |
| 3 | **Applications** | `/admin/applications` | `GET /store-applications` · `/{store}` · `/{store}/documents/{document}` · `PUT /{store}/approve` · `PUT /{store}/reject` · `POST /{store}/reissue-credentials` | `AdminStoreApplicationController` | Obj 1 — "manage tailoring shop registration approvals"; Scope — "review and approve … verification requests before system access is granted" | Objective-mandated |
| 4 | **Stores** | `/admin/stores` | `GET /stores` · `PUT /{store}/approve` · `PUT /{store}/reject` · `PUT /{store}/hide` · `PUT /{store}/unhide` | `AdminStoreController` (approve/reject) · `ModerationController` (hide/unhide) | Obj 1 — "oversee active shop profiles" (approve/reject); moderation = governance extension | Objective-mandated (approve/reject) + Supporting (hide/unhide) |
| 5 | **Branch locations** | `/admin/branches` | `GET /branches` · `PUT /branches/{branch}/verify` · `PUT /branches/{branch}/reject` | `Admin\BranchVerificationController` | Obj 1 — "verify branch map locations"; Obj (Map) — "registered and verified tailoring shops"; Scope — "verifies submitted branch map locations" | Objective-mandated |
| 6 | **Apparel categories** | `/admin/apparel` | `GET /apparel-types` · `PUT /apparel-types/{apparelType}/approve` · `PUT /apparel-types/{apparelType}/reject` | `Admin\ApparelTypeController` | Obj 1 — "validate apparel categories"; Scope — "validate custom apparel categories" | Objective-mandated |
| 7 | **Accounts** | `/admin/accounts` | `GET /accounts` · `PUT /accounts/{user}/suspend` · `PUT /accounts/{user}/reactivate` | `AdminAccountController` | Not a standalone objective — platform oversight under Obj 1 "oversee platform-wide activity" | **Supporting governance** |
| 8 | **Plans** | `/admin/plans` | `GET /subscription-plans` · `POST /subscription-plans` · `PUT /subscription-plans/{plan}` | `Admin\SubscriptionPlanController` | Obj 1 — "subscription monitoring"; Obj 2 — "select from Basic, Pro, and Premium subscription plans" (the admin owns the tier *definitions*) | Objective-mandated |
| 9 | **Plan Payments** | `/admin/upgrades` | `GET /upgrade-requests` · `GET /upgrade-requests/{request}/receipt` · `POST /upgrade-requests/{request}/approve` · `POST /upgrade-requests/{request}/reject` | `AdminSubscriptionUpgradeRequestController` | Obj 2 — "maintain active subscription validity for continued platform visibility"; Scope — "monitors tier-based subscription billing." **No payment gateway (out of scope, §4): this tracks a submitted receipt + a validity decision, it does not move money.** | Objective-mandated (billing monitoring) |
| 10 | **Support** | `/admin/tickets` | `GET /tickets` · `GET /tickets/{ticket}` · `POST /tickets/{ticket}/reply` · `PUT /tickets/{ticket}/status` | `SupportTicketAdminController` | Not a standalone objective — the cross-role support channel; oversight under Obj 1 "oversee platform-wide activity." `submitted_by_role` shows who filed (Owner / Branch manager / Staff). | **Supporting governance** |
| 11 | **Activity Log** | `/admin/activity` | `GET /audit-logs` | `AdminAuditLogController` | Obj 1 — "oversee platform-wide activity"; Scope — "oversee active shop profiles" / "platform performance reports" | Objective-mandated |

**Post-moderation** lives on the Stores / catalog surface (§4 above) and is the "Report this product"
escalation path, manual only: `POST /admin/catalog-items/{id}/warn` → `PUT /admin/catalog-items/{id}/hide`
/ `unhide` → `PUT /admin/stores/{id}/hide` / `unhide`. **Class: Supporting governance** — it is the
platform-side mirror of the owner's "control their public platform visibility" objective. It is
deliberately **manual and human-judged** (no AI / keyword scanning), which keeps it inside scope.

> **Precision note (don't over-claim):** the **hide / unhide a whole shop** actions are wired into the
> **Stores** section's UI. The **warn / hide / unhide a single catalog design** routes exist on the
> backend (`ModerationController`) but currently have **no admin UI button** — a backend-only surface.
> In the defense, present the shop-level takedown as the built UI path; do not claim a screen for the
> per-design actions.

> **Controller names in the table are the route-level aliases** exactly as written in `routes/api.php`
> (that's what to grep for). The actual files under `sutura-server/app/Http/Controllers/Api/V1/Admin/`
> mostly drop the `Admin` prefix — e.g. `AdminDashboardController` → `DashboardController`,
> `AdminStoreApplicationController` → `StoreApplicationController`, `AdminAccountController` →
> `AccountController`. `ModerationController`, `SupportTicketAdminController` and `AdminAuthController`
> keep their names.

---

## 3. What is actually implemented (correcting the old "gap" claims)

The earlier docs claimed several of these were missing. They are **all built now** — verified against
routes + code (not the paper):

- **The admin frontend is built** — a real 11-section portal under `src/app/admin`
  (`/admin` Overview, Reports, Applications, Stores, Branch locations, Apparel categories, Accounts,
  Plans, Plan Payments, Support, Activity Log) plus a dedicated `/admin/login`. The old "zero admin
  UI / Bongo's missing piece is the entire admin frontend" note is **out of date**.
- **Branch map-verification is real** (`store_branches.verification_status` =
  `pending | verified | rejected`, + `verified_at/by`, `verification_note`; `StoreBranch::live()`
  = `status=active AND verified`, which every public branch query uses). A new or moved branch drops
  back to `pending` and stays off the public map until the admin verifies it; approving a shop verifies
  its pending main branch. This satisfies "verify branch map locations" end-to-end.
- **Apparel-category validation is real** — `/admin/apparel-types` is the moderation queue for apparel
  names a shop typed in itself. It manages the `CustomApparelType` model (`custom_apparel_types` table,
  status `pending | approved | rejected`, normalized labels): a design using an unapproved name waits
  there before going public. The *fixed* canonical taxonomy
  (`CanonicalTaxonomy::storeSpecializations()`, a PHP array) needs no review — the queue only sees
  shop-typed custom names.
- **Platform analytics endpoints are real** — subscription report, stores-per-plan, and platform
  revenue (`/admin/reports/*`).
- **Subscription plans can be updated** — `PUT /admin/subscription-plans/{plan}` exists (not just
  create).
- **A platform-wide audit-log screen is real** — `GET /admin/audit-logs`.
- **System health / performance snapshot is real** — `GET /admin/system-health`.
- **Account suspend/reactivate is real** — `PUT /admin/accounts/{user}/suspend|reactivate`.

## 4. In-scope vs out-of-scope (draw the line so nothing contradicts the thesis)

**Objective-mandated** (a panelist can point to the clause): registration approvals (Applications +
Stores approve/reject), apparel-category validation, branch-map verification, subscription
monitoring/plan definitions (Plans), platform reports — subscription activity, registered shops,
revenue (Reports), platform-wide activity + system performance (Overview, Activity Log), and
subscription-billing/validity monitoring (Plan Payments).

**Supporting governance** (honest label, not a separate objective): account suspend/reactivate,
post-moderation (warn/hide/unhide a design or a shop), and support-ticket resolution. Frame each as
"under Objective 1's 'oversee platform-wide activity and system performance'," never as its own
objective.

**Hard out-of-scope** (the thesis Limitations are explicit; if raised, name it scope creep):

- **No payment gateway.** SUTURA tracks payment/deposit *status* and accepts an uploaded
  *receipt*; it does not move money. So "Plan Payments" is receipt + validity review, and there is no
  "automatic refund on rejection" (reword the paper to "mark as refunded" if it promises one).
- **No AI / content scanning / penalty points.** Moderation is always a human decision from a
  customer report.
- **No predictive analytics / BI.** Reports are descriptive and real-time only.
- **No cross-shop operating-data access.** Admin never reads or writes a shop's services, catalog,
  appointments, job orders, measurements, or payments.

## 5. Security & role boundary

- **Separate admin session.** The portal uses its own axios client (`src/lib/adminApi.ts`) with the
  token in `sessionStorage` (cleared on browser close) — signing in as admin never makes the storefront
  think a customer is signed in, and vice-versa.
- **Dedicated admin login:** `POST /auth/admin/login` (rate-limited `throttle:5,1,admin-login`),
  separate from the customer/staff `/auth/login`.
- **Authorization:** every `/admin/*` route sits behind `middleware('role:admin')` — a single,
  uniform gate; no finer-grained admin permissions exist.
- **Demo admin:** `admin@sutura.com` / `password` (see `docs/TEST-ACCOUNTS.md`).
- **Boundary:** the admin group only reaches platform-governance routes (approvals, verification,
  moderation, plans, tickets, audit, accounts). No admin route writes a store's per-order or
  per-appointment record, and no admin route reaches the Customer or Staff data paths.

## 6. Likely panel questions (with the defensible answer)

- **"Which objective is the admin module for?"** → Objective 1 (Administrative Dashboard) plus the
  admin side of Objective 7 (analytics). Every section in §2 is anchored to one of those clauses.
- **"Does a pending shop get blocked from everything?"** → Currently approval gates **public
  visibility** (search, map, public profile). An unapproved owner can still log in to their dashboard
  — **if the paper says "before gaining any access to the system," reword it to "before appearing on
  the public marketplace."** This is a genuine open item; state it honestly rather than over-claim.
- **"How are bad listings handled?"** → Listings go live; a customer reports; the admin warns, hides
  the design, or hides the shop (manual, human-judged). An admin takedown uses a separate lock the
  owner's visibility toggle and a subscription renewal can't clear.
- **"Do you auto-detect bad content?"** → No — that would need AI/scanning, which is out of scope.
- **"Can a hidden shop unhide itself?"** → No; only the admin can restore.
- **"How do you verify branch locations?"** → `verification_status` queue: a new/moved branch is
  `pending` and stays off the public map until verified (`StoreBranch::live()`).
- **"How do you monitor subscriptions?"** → Plans defined in *Plans*; upgrade requests + receipts in
  *Plan Payments*; the cross-shop view in *Reports* (activity, per-plan stores, revenue).
- **"Is there a payment gateway?"** → No, by design. SUTURA records a receipt and a validity decision;
  money moves outside the system.

## 7. Verification status (what's proven vs not)

- **Proven:** the full server suite is green (`php artisan test` = 260/0, 1218 assertions, on SQLite
  and Postgres); the admin routes exist and are exercised by the API click-through (`/admin/system-health`
  and `/admin/branches` returned 200 against the seeded Postgres DB).
- **Built but not yet browser-verified:** the visual in-browser pass over the 11 admin screens
  (open `src/app/admin` routes in a browser against the seeded DB). "Builds & type-checks clean" ≠
  "visually verified" — that pass is still open; see `docs/BROWSER-PASS-CHECKLIST.md`.

## 8. Where to look

- Route/section map (this file, §2) is the reference; `docs/workflows/OWNER-TO-ADMIN-WORKFLOW.md`
  is the boundary/owner-side companion.
- `docs/reviewer/4-ADMIN-MODULE.md` — Bongo's module review + the paper-vs-system notes (its
  "Known gaps" list is being corrected to match this file).
- `docs/TEST-ACCOUNTS.md` — the demo admin credential.
