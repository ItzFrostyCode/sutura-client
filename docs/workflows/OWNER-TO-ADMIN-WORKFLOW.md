# System Admin ↔ Owner Boundary (the real admin portal)

What the **System Admin** role can actually do, mapped 1:1 to the routes that exist today in
`sutura-server/routes/api.php` (the `Route::prefix('admin')->middleware('role:admin')` group) and the
built admin portal's 11 sections. Only what the repo supports is documented — nothing invented.

> **Supersedes the earlier version of this file**, which described an older, smaller admin area and
> claimed several features were "not implemented / no admin frontend exists." All of those are now
> built: the admin portal has a real frontend, and the branch / apparel / audit / plan routes below
> all exist. The **route list in `routes/api.php` is the source of truth**; if a line here disagrees
> with it, the route list wins.

## Thesis basis (why each capability exists)

The System Admin module answers **Objective 1** ("Administrative Dashboard … manage tailoring shop
registration approvals, validate apparel categories, verify branch map locations, and oversee
platform-wide activity and system performance") and the **admin side of Objective 7** ("…generate
real-time visual reports on subscription activity…"). `docs/ADMIN-MODULE.md` is the **authoritative
reference** for the full capability → objective → in/out-of-scope traceability table and the panelist
Q&A. Short form of the mapping used above:

- **Objective-mandated** (a thesis clause names it): Applications + Stores approve/reject
  (*registration approvals*), Apparel categories (*validate apparel categories*), Branch locations
  (*verify branch map locations*), Plans (*subscription monitoring* / tier definitions), Reports
  (*subscription activity, registered shops, revenue*), Overview + Activity Log (*platform-wide
  activity + system performance*), Plan Payments (*subscription-billing monitoring — receipt +
  validity only, no payment gateway*).
- **Supporting governance** (consistent with "oversee platform-wide activity," **not** a separate
  objective — label it that way, don't over-claim): Accounts (suspend/reactivate), post-moderation
  (warn/hide a design or shop), and Support-ticket resolution.

This boundary doc maps each section to its **route**; `docs/ADMIN-MODULE.md` maps each route to its
**objective**. Read them together.

## Auth & role

- Admins sign in at **`POST /auth/admin/login`** (separate from the customer/staff `/auth/login`),
  rate-limited `throttle:5,1,admin-login`. Every `/admin/*` route sits behind `middleware('role:admin')`.
- Demo admin account: `admin@sutura.com` / `password` (see `docs/TEST-ACCOUNTS.md`).
- `role:admin` and `role:store_owner` / `role:branch_manager` / `role:staff` are **entirely separate**
  middleware groups gating **separate** route sets.

## The 11 admin sections → real routes

| Admin UI section | Real route(s) under `/admin` | What it does |
|---|---|---|
| **Overview** | `GET /admin/dashboard` | Platform overview (counts, activity). |
| | `GET /admin/system-health` | System health / uptime snapshot. |
| **Reports** | `GET /admin/reports/subscriptions` | Platform subscription report. |
| | `GET /admin/reports/subscriptions/plans/{plan}/stores` | Stores on a given plan. |
| | `GET /admin/reports/revenue` | Platform revenue report. |
| **Applications** | `GET /admin/store-applications` | Shop registration review queue (documents stream from the private disk through this controller only). |
| | `GET /admin/store-applications/{store}` | Application detail. |
| | `GET /admin/store-applications/{store}/documents/{document}` | One application document. |
| | `PUT /admin/store-applications/{store}/approve` · `.../reject` | Approve / reject the registration. |
| | `POST /admin/store-applications/{store}/reissue-credentials` | Reissue the owner's login credentials. |
| **Stores** | `GET /admin/stores` | All stores. |
| | `PUT /admin/stores/{store}/approve` · `.../reject` | Approve / reject a store. |
| | `PUT /admin/stores/{store}/hide` · `.../unhide` | Moderation: hide / restore the whole shop from the public map. |
| **Branch locations** | `GET /admin/branches` | Branch map-location verification queue. |
| | `PUT /admin/branches/{branch}/verify` · `.../reject` | Verify / reject a branch. A new or moved branch stays off the public map until verified. |
| **Apparel categories** | `GET /admin/apparel-types` | Typed-in apparel-name moderation queue. |
| | `PUT /admin/apparel-types/{apparelType}/approve` · `.../reject` | Approve / reject a typed-in apparel name before designs using it go public. |
| **Accounts** | `GET /admin/accounts` | All user accounts. |
| | `PUT /admin/accounts/{user}/suspend` · `.../reactivate` | Suspend / reactivate an account. |
| **Plans** | `GET /admin/subscription-plans` | List plan definitions. |
| | `POST /admin/subscription-plans` · `PUT /admin/subscription-plans/{plan}` | Create / update a plan. |
| **Plan Payments** | `GET /admin/upgrade-requests` | Subscription upgrade requests. |
| | `GET /admin/upgrade-requests/{request}/receipt` | The submitted payment receipt. |
| | `POST /admin/upgrade-requests/{request}/approve` · `.../reject` | Approve / reject an upgrade. |
| **Support** | `GET /admin/tickets` | Platform-wide support tickets (`submitted_by_role` shows who filed: Owner / Branch manager / Staff). |
| | `GET /admin/tickets/{ticket}` · `POST /admin/tickets/{ticket}/reply` · `PUT /admin/tickets/{ticket}/status` | Read / reply / change ticket status. |
| **Activity Log** | `GET /admin/audit-logs` | Platform-wide audit trail. |

### Post-moderation (lives inside the Stores / catalog surface)

- `POST /admin/catalog-items/{catalogItem}/warn` — warn on a "Report this product" ticket.
- `PUT /admin/catalog-items/{catalogItem}/hide` · `.../unhide` — hide / restore one catalog design.
- `PUT /admin/stores/{store}/hide` · `.../unhide` — hide / restore the whole shop.
- Escalation path is **manual only**: warn → hide one design → hide the shop.

## Owner → Customer / Staff (the downstream consumers)

Once a shop is approved and running, the owner runs day-to-day business for **their own** approved
store(s) only — zero visibility into other stores, zero platform-governance actions. Customers and
staff consume the owner's business data and **never** see or touch the admin platform layer
(no admin route, page, or data path reaches them). See:

- `docs/workflows/OWNER-TO-CUSTOMER-REFLECTION.md` — the customer-facing side of an owner's shop.
- `docs/workflows/OWNER-TO-STAFF-WORKFLOW.md` — the staff/branch-manager operating side.

## Boundary still clean (confirmed)

- **Admin cannot edit a store's operating data** (Service / CatalogItem / Appointment / JobOrder /
  Measurement / Payment). The admin group only reaches platform-governance routes (approvals,
  verification, moderation, plans, tickets, audit). No admin route writes to a store's
  per-order or per-appointment records.
- **Owner cannot do admin governance** (approve their own shop, define subscription tiers, verify
  branch maps, resolve platform tickets) — all of that is `role:admin`-only.
- The two are enforced by separate middleware groups, so there is no overlap to reconcile.
