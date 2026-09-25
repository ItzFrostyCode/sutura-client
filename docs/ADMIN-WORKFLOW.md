# ADMIN WORKFLOW

> **This is a documentation scaffold, not a finalized Admin specification.** It was created to give the System Admin developer a structured starting point — every `CURRENT` claim below is verified directly against the running code (same standard as `CUSTOMER-WORKFLOW.md`/`STAFF-WORKFLOW.md`); every `TARGET` claim is limited strictly to what an already-approved document (`EMERGENCY-WORKFLOW.md`) explicitly decided; everything else is marked `GAP` or left as an open `[TEAM DECISION]` for the System Admin developer to fill in after inspecting the codebase themselves. No business rule not already evidenced or already decided is assumed here. No code was modified in producing this document.

---

## 1. Role Definition

**Current, verified:** `admin` is a `User` row with the `admin` `Role` attached — no dedicated admin profile entity exists (same pattern as every other role in this system). Route-level enforcement is `role:admin` middleware on a single `Route::prefix('admin')` group in `routes/api.php` — nothing else in the codebase checks for the admin role.

**Boundary, distinguished against the other three roles (evidenced, not assumed):**

| Role | What it owns |
|---|---|
| **System Admin** | Platform-level: approving shop registrations, defining subscription plan tiers, reading/replying to support tickets. Confirmed to be the *only* role with `role:admin` gated routes. |
| **Shop Owner / Branch Manager** | Everything inside one store: profile, catalog, staff, branches, appointments (confirm/reschedule/cancel), payments, discounts, analytics. Confirmed extensively across `CUSTOMER-WORKFLOW.md` §21, `PAYMENT-WORKFLOW.md`, `STAFF-WORKFLOW.md` §23. |
| **Staff** | Day-to-day execution inside one store — see `STAFF-WORKFLOW.md` in full. |
| **Customer / Guest** | Discovery, booking, ordering, tracking — see `CUSTOMER-WORKFLOW.md` in full. |

Admin has **zero overlap** with store-internal operations in the current codebase — every admin route acts on records that span or precede a store's own operation (approval happens before a store can operate at all; subscription plans are platform-wide definitions; tickets are cross-store). This document does not extend that boundary beyond what's evidenced.

## 2. System Admin Entry / Authentication

**Current, verified:**
- Authentication: same mechanism as every role — `POST /auth/login` (Sanctum bearer token), no admin-specific login endpoint.
- Authorization: `role:admin` middleware, checked per-route, identical mechanism to `role:store_owner`/`role:staff` elsewhere.
- Accessible routes: exactly the `Route::prefix('admin')` group (Section 15 lists every one).
- **Admin dashboard access: none.** A repository-wide search of `sutura-client/src/app` for any admin-named route returns nothing — there is no `/admin` page, layout, or nav entry anywhere in the frontend. An admin user, today, has a valid login and a valid token, but no page in the product that consumes their role.

**GAP:** the entire frontend surface for Admin. This is not a partial gap — zero pages exist.

## 3. Admin Dashboard

| | CURRENT | TARGET | GAP | Dependency |
|---|---|---|---|---|
| Dashboard existence | None — confirmed | `[TEAM DECISION]` | Total | — |
| What it would show | N/A | `[TEAM DECISION]` | — | Sections 4–14 below are the candidate data sources, all already real on the backend where noted |

This section is intentionally left for the System Admin developer — the backend building blocks that exist (Sections 4, 8, 13) are documented below so a dashboard can be designed from real data, not guessed.

## 4. Shop Registration / Approval

**Current, verified, full and complete — this is the one Admin workflow that actually works end-to-end on the backend:**

```
Owner registers a store → StoreController::store() → Store row created, status = 'pending'
   ↓
Admin: GET /admin/stores (AdminStoreController::index) — paginated, filterable by `status`
   ↓
Admin: PUT /admin/stores/{store}/approve → status='approved', approved_at=now(), approved_by=admin's own id
   OR
Admin: PUT /admin/stores/{store}/reject → status='rejected', rejection_reason required (validated)
   ↓
Store.status now gates public visibility — StoreController::publicIndex() only returns status='approved' stores
```

`Store.status` enum (as a plain string, not DB-enforced): `pending`, `approved`, `rejected`, `suspended`. **Do not invent approval stages beyond these** — this is the complete set defined in the schema.

**GAP, verified:** `suspended` is a real, valid status value in the migration/model — but **no controller anywhere in the codebase ever sets it**. There is no suspend action, no route, no button. A store can only ever be `pending`, `approved`, or `rejected` through the actual application today.

**GAP:** no "reconsideration"/reopening-after-rejection path exists — a rejected store has no documented way back to `pending` in the current code. Whether that's intended (rejection is final, owner must re-register) or missing is `[TEAM DECISION]`.

**Frontend: none.** Every action above is backend-only, reachable today only via direct API calls (e.g. Postman), not through any Admin UI.

## 5. Shop / Store Management

**Current, verified:** Admin's only write access to `Store` is the `approve`/`reject` pair above (Section 4). Admin's `index` (`AdminStoreController::index`) returns the full `Store` list with `owner` eager-loaded, filterable by `status` — this is read access, not a management surface (no edit, no visibility toggle, no branch access).

**Explicitly NOT Admin's, evidenced:** `is_hidden`, `is_featured`, branch CRUD, operating hours, pricing, staff — all owner-only, confirmed in `routes/api.php`'s owner-only route groups. Admin cannot currently touch any of these for any store.

**GAP relative to Objective 1's literal wording** (per the original SUTURA audit — cited here as prior evidence, not re-derived): the objective names "oversee platform-wide activity and system performance" and implies broader store oversight than approve/reject alone provides. What that broader oversight should concretely be is `[TEAM DECISION]`.

## 6. Apparel Category / Specialization Validation

**Current: does not exist. This is a hard GAP, verified precisely.** An `apparel_specializations` table was created in migration `2026_06_13_185411_create_apparel_specializations_table.php`, then **fully dropped** in a later migration (`2026_07_06_135552_drop_apparel_specialization_from_service_pricing_and_apparel_specializations_table.php`) — no model, no controller, no route was ever built against it, and none exists today. Categories/specializations today are free-text JSON the shop owner sets unilaterally on `Store.specializations` and `Service.category`/`categories` — with **zero admin validation or approval step of any kind**.

**Explicitly marking this as a GAP, not inventing a fix:** whether validation should be a pre-approval gate, a post-hoc moderation queue, a fixed taxonomy Admin curates, or something else entirely is `[TEAM DECISION]` — see Section 21.

## 7. Branch / Map Verification

**Current: does not exist.** `StoreBranch` has a `status` field, but it defaults to `'active'` and is used for open/closed scheduling, not admin verification — confirmed no verification-specific field exists on the model, and no admin route ever touches `StoreBranch` (`routes/api.php`'s admin group has exactly 3 resource areas: stores, subscription-plans, tickets — branches are not among them).

**Distinguishing store verification from branch verification, precisely, since this is easy to conflate:** `Store.status='approved'` is the *only* verification gate the system enforces today, and it applies once, to the whole store — every branch under an approved store is implicitly treated as verified by inheritance, because nothing checks branches independently. There is no per-branch "this specific location's coordinates have been confirmed" concept anywhere in the code.

**Relationship to Customer map/search (evidenced, from `CUSTOMER-JOURNEY-TARGET.md` §2):** `StoreController::publicIndex()` — the endpoint both `/search` and `/map` call — filters on `Store.status='approved'` and `is_hidden=false` only. It does not and cannot check branch-level verification, because no such field exists to check.

**GAP:** whether Objective 4's "verified... branches" wording requires a real per-branch mechanism, or whether store-level approval is an accepted interpretation, is `[TEAM DECISION]` — flagged, not resolved, in the original SUTURA audit too.

## 8. Subscription Monitoring

**Current, verified:**
- `Admin/SubscriptionPlanController`: `index()` (list active plans) and `store()` (create a new plan — name, description, price_monthly, price_yearly, max_staff, max_services, max_appointments_per_month, features). **No `update()` or `destroy()` exists** — a plan, once created, cannot currently be edited or deactivated through the API.
- Admin has **no visibility into which stores are on which plan, MRR, or platform-wide subscription activity** — the only subscription-activity reporting that exists (`AnalyticsController::subscriptionActivity`) is store-scoped and **owner-only** (confirmed in the original audit and unchanged since).
- Basic/Pro/Premium: real `SubscriptionPlan` rows exist and are seeded; `StoreSubscription.status` is a genuine DB `ENUM('trial','active','expired','cancelled')` — not yet converted to a plain string the way `job_orders.status`/`appointments.status` already were (this asymmetry is documented in `EMERGENCY-WORKFLOW.md` §11).
- No renewal/expiry admin action exists — `RemindExpiringSubscriptions` (a scheduled command) notifies the *store owner*, not Admin, and does nothing Admin-facing.

**Do NOT invent payment gateway or money-movement functionality** — confirmed consistent with the rest of the system: SUTURA tracks subscription status/validity, it does not process a payment for a plan anywhere in the code (`StoreController::store()`'s own comment says the Premium auto-assignment is "In production this would be gated behind a real payment step").

**GAP:** platform-wide subscription monitoring (who's on what plan, expiring-soon list, MRR) — none of it exists for Admin today. What exactly Admin needs to see is `[TEAM DECISION]`.

## 9. Emergency / Subscription Hold

Reference: `docs/EMERGENCY-WORKFLOW.md` — **do not redesign it here.** Restating only the Admin-side responsibilities that document already established as target (not yet built):

- Review a store-wide `Incident` when a subscription hold is requested (`EMERGENCY-WORKFLOW.md` §11–12).
- Approve/reject the Emergency Hold — proposed to mirror `AdminStoreController::approve()`/`reject()`'s exact existing shape, a new but structurally familiar action.
- Approve a reopening request once recovery is confirmed (§13).
- Subscription validity preservation on hold/resume is a `StoreSubscription`-level mechanism (§11) — **Admin's role is the approval gate, not the mechanism itself.**

**Current:** none of this exists — no `Incident` entity, no hold status, no admin approval route. `EMERGENCY-WORKFLOW.md` §17 already itemizes the minimal schema/route additions this depends on (an `incidents` table, `StoreSubscription.emergency_hold_started_at`, the enum→string conversion) — this document does not repeat or re-decide that list, only points to it.

## 10. Platform-Wide Activity Monitoring

**Current, verified:** `AuditLog` is a real, working polymorphic log (`store_id`, `user_id`, `action`, `model_type`/`model_id`, `payload`, `ip_address`) — but the only route that reads it (`AuditLogController::index`) is `role:store_owner` only, scoped to `$store->auditLogs()`. **There is no cross-store, platform-wide activity feed anywhere in the code.** "Platform-wide activity" as a concept has no current implementation — every activity record that exists is trapped behind a single store's own owner.

**TARGET:** not decided by any approved document. `[TEAM DECISION]` — see Section 21.

**GAP:** total, at the route/controller level. The underlying `AuditLog` table itself is reusable (Section 13) — building a platform-wide view would query the same table with the store-scope removed for an admin-gated route, not require a second logging system.

## 11. System Performance / Platform Health

**Current: does not exist.** No health-check endpoint, no error-rate tracking, no performance metric, no uptime monitor anywhere in either repo — confirmed by the original SUTURA audit and unchanged since.

**Do not invent observability infrastructure** — this is explicitly named in the task instructions as something not to assume. Whether this is genuinely in scope for a capstone system (vs. an infrastructure concern outside the application layer) is `[TEAM DECISION]`.

## 12. Platform Analytics / Reports

**Current, verified:** `AnalyticsController` has **zero admin-gated methods** — confirmed by grepping the controller for any admin role check; every method (`index`, `branchComparison`, `staffProductivity`, `subscriptionActivity`) is store-scoped and owner/branch-manager gated.

**Distinguishing Admin analytics from Shop Owner analytics, precisely (this distinction matters — do not conflate them):**

| | Shop Owner Analytics (current, real) | Admin Analytics (current) |
|---|---|---|
| Revenue | Per-store, discount-aware formula, date-ranged | **Does not exist** |
| Subscription activity | Per-store usage/events | **Does not exist** |
| Productivity | Per-store staff/branch comparison | **Does not exist** |
| Platform-wide aggregation across all stores | N/A (not its job) | **Does not exist** |

Every Admin-facing reporting requirement named in the approved objectives (subscription activity, platform-wide activity, cross-shop productivity, revenue-related reporting, system usage) is a **GAP**, not a partial implementation — nothing here should be assumed built.

## 13. Audit Logs

**Current, verified:** `AuditLog` model — `store_id`, `user_id` (the acting user), `action` (string, e.g. `discount_applied`, `appointment_rescheduled`), `model_type`/`model_id` (polymorphic target), `payload` (JSON), `ip_address`. Written from numerous owner/staff-facing actions across the codebase (discounts, staff removal, deletions, reschedules — documented extensively in the backend's own history).

**What Admin can currently see: nothing.** The only read route (`AuditLogController::index`) is owner-gated, store-scoped. Admin has no access to this table at all today.

**Do not create a second audit-log system** — if Admin needs platform-wide activity visibility (Section 10), the existing `AuditLog` table is the correct source; a cross-store admin route reading the same table (no store filter) is the evidenced, minimal path — not a new logging mechanism.

## 14. Admin Notifications

**Current, verified:** the notification system itself (database + email channel, per-action and proactive-digest patterns) is comprehensive and reusable — established fact from every prior workflow document in this series. **No notification currently targets Admin specifically** — every existing `Notification` class addresses a store owner, staff member, or customer. `SupportTicketReplyNotification` fires toward the ticket's `submittedBy` (the store owner), not toward Admin when a *new* ticket comes in — confirmed by reading `SupportTicketAdminController::reply()` directly; there is no equivalent "notify Admin of a new ticket" trigger anywhere.

**GAP:** Admin has no in-app signal today that a new store registration, a new support ticket, or (once built) a new emergency-hold request is waiting for them — they would have to poll `GET /admin/stores`/`GET /admin/tickets` manually. Whether and how to notify Admin is `[TEAM DECISION]` — the mechanism to reuse, once decided, already exists.

## 15. Administrative Actions

Every admin-gated action that exists in the codebase today, in full — this is the complete set, not a sample:

```
TRIGGER                 Owner submits store registration (status=pending)
ADMIN ACTION             GET /admin/stores → reviews → PUT /admin/stores/{store}/approve
SYSTEM RECORD UPDATE     Store.status='approved', approved_at=now(), approved_by=admin.id
RESULT                   Store becomes publicly discoverable (StoreController::publicIndex)
NEXT STEP                Owner can now operate normally — appointments, orders, catalog, etc.
```

```
TRIGGER                 Owner submits store registration
ADMIN ACTION             PUT /admin/stores/{store}/reject  { rejection_reason: required }
SYSTEM RECORD UPDATE     Store.status='rejected', rejection_reason set
RESULT                   Store never appears in public discovery
NEXT STEP                GAP — no documented reconsideration path (Section 4)
```

```
TRIGGER                 Admin decides a new subscription tier is needed
ADMIN ACTION             POST /admin/subscription-plans { name, price_monthly, price_yearly, max_staff, max_services, max_appointments_per_month, features }
SYSTEM RECORD UPDATE     New SubscriptionPlan row, slug auto-generated
RESULT                   Plan becomes selectable by store owners at /subscriptions/plans
NEXT STEP                GAP — no way to later edit or deactivate this plan (Section 8)
```

```
TRIGGER                 A store owner or customer's ticket needs admin attention
ADMIN ACTION             GET /admin/tickets (filterable by status/priority) → GET /admin/tickets/{id}
                          → POST /admin/tickets/{id}/reply  OR  PUT /admin/tickets/{id}/status
SYSTEM RECORD UPDATE     SupportTicketReply created; first admin reply auto-moves ticket open→in_progress
                          and self-assigns it (assigned_to = admin.id); status update supports
                          open/in_progress/resolved/closed, stamping resolved_at on 'resolved'
RESULT                   submittedBy (store owner) is notified of the reply
NEXT STEP                GAP — the reply/status change is invisible to Admin's own team unless they
                          reopen the ticket list themselves; no admin frontend exists to do any of this
                          through a UI today (confirmed by a comment in the controller's own source)
```

No other admin-gated action exists in the codebase. This list is exhaustive as of this document's writing.

## 16. Cross-Role Dependencies

### Customer
- Store approval (Section 4) directly gates whether a store is discoverable at all — the single biggest Admin→Customer dependency, and it's real and working today.
- Nothing else Admin currently does reaches the Customer module — no apparel-category validation, no branch verification, no platform analytics touch anything a customer sees.
- Once built (target, not current): an Admin-approved Emergency Hold would indirectly affect Customer-visible store availability, via the same `StoreSpecialHour`/visibility mechanism `EMERGENCY-WORKFLOW.md` already specifies — not a new Customer-facing mechanism.

### Staff
No current or target dependency identified. Nothing in any reviewed document ties an Admin action to a Staff-facing behavior change.

### Owner / Branch Manager
- Store approval/rejection (Section 4) is the one hard current dependency — an owner cannot operate at all until Admin approves.
- Subscription plan definitions (Section 8) constrain what an owner can select at `/subscriptions/plans` — Admin defines the menu, Owner picks from it.
- Support tickets (Section 15) are an Owner→Admin channel today; Admin's reply reaches the owner via the existing notification mechanism.
- Emergency Subscription Hold approval (Section 9, target) — an owner's reopening/hold request is blocked pending Admin's decision, per `EMERGENCY-WORKFLOW.md`.

This document does not propose changes to Staff or Owner modules — only names where Admin's existing or target actions touch them.

## 17. Data / Database Relationships

| Table/Model | Admin-relevant FK/relationship | Ownership | Admin read/write |
|---|---|---|---|
| `Store` | `owner_id → users.id`, `approved_by → users.id` | Owner-created | Admin: read (index), write (`status`, `approved_at`, `approved_by`, `rejection_reason`) only |
| `SubscriptionPlan` | — (standalone) | Platform-level, no owning store | Admin: read + create only (no update/delete — Section 8) |
| `StoreSubscription` | `store_id → stores.id`, `plan_id → subscription_plans.id` | Store-owned | Admin: **no current access at all** — not even read |
| `SupportTicket` | `store_id → stores.id` (nullable-shaped by ticket origin), `user_id → users.id` (submitter), `assigned_to → users.id` | Cross-store by nature | Admin: full read/reply/status-update |
| `SupportTicketReply` | `ticket_id`, `user_id`, `is_admin_reply` | Belongs to a ticket | Admin: create (reply) |
| `AuditLog` | `store_id`, `user_id`, polymorphic `model_type`/`model_id` | Store-scoped | Admin: **no current access** (Section 13) |
| `StoreBranch` | `store_id → stores.id` | Store-owned | Admin: **no current access at all** (Section 7) |

**No new entities are proposed in this document** — every table above already exists; the gaps documented (Sections 6, 7, 10, 11, 12) are about missing *routes/controllers* reading these or (for apparel categories) a table that was deliberately removed, not about missing tables Admin would need created for it.

## 18. API / Frontend Relationship

| | Exists | Missing |
|---|---|---|
| **Frontend pages** | None | Everything — confirmed zero `/admin` routes anywhere in `sutura-client/src/app` |
| **API endpoints** | `GET/PUT /admin/stores*`, `GET/POST /admin/subscription-plans`, `GET/POST/PUT /admin/tickets*` (Section 15's full list) | Platform analytics, platform-wide audit log, branch verification, apparel-category validation, subscription monitoring, emergency-hold approval, admin notifications |
| **Controllers** | `Admin/StoreController`, `Admin/SubscriptionPlanController`, `Admin/SupportTicketAdminController` | Any admin analytics/monitoring controller |
| **Models** | `Store`, `SubscriptionPlan`, `SupportTicket`, `SupportTicketReply` (all pre-existing, shared with other roles) | None proposed |
| **Authorization** | Single `role:admin` middleware, uniformly applied | No finer-grained admin permission system exists (e.g. no distinction between a "support admin" and a "billing admin") — whether that's ever needed is `[TEAM DECISION]` |

## 19. Current vs Target Summary

| Area | CURRENT | TARGET | GAP | Dependency |
|---|---|---|---|---|
| Shop registration approval | Full backend (index/approve/reject) | Same, needs a frontend | No admin UI | None — backend is ready |
| Shop rejection reconsideration | Not supported | Not decided | Full | `[TEAM DECISION]` |
| Store suspension | Enum value exists, unused | Not decided | Full | `[TEAM DECISION]` |
| Apparel category validation | Entity dropped from schema | Not decided | Full | `[TEAM DECISION]` |
| Branch/map verification | No mechanism | Not decided | Full | `[TEAM DECISION]` |
| Subscription plan management | Create + list only | Not decided | No edit/deactivate | `[TEAM DECISION]` |
| Platform-wide subscription monitoring | None | Not decided | Full | `[TEAM DECISION]` |
| Emergency Hold approval | None | Decided in `EMERGENCY-WORKFLOW.md` §11–12 | Full — not built | `incidents` table, `StoreSubscription` schema additions (see that doc's §17) |
| Platform-wide activity monitoring | `AuditLog` exists, store-scoped only | Not decided | Cross-store route | `AuditLog` table (reusable as-is) |
| System performance/health | None | Not decided | Full | Out-of-repo infra question, `[TEAM DECISION]` |
| Platform/admin analytics | None | Not decided | Full | `[TEAM DECISION]` |
| Audit log (admin view) | Store-owner-only today | Not decided | Cross-store route | Same table as above |
| Admin notifications | Mechanism exists, unused for Admin | Not decided | Full | Existing `Notification` infrastructure |
| Support ticket handling | Full backend (index/show/reply/status) | Same, needs a frontend | No admin UI | None — backend is ready |

## 20. Admin Workflow Scenarios

**Shop registration approval** (fully supported today, backend-only):
```
Owner submits registration → status=pending → Admin reviews via GET /admin/stores
→ approve → store publicly discoverable
```

**Shop rejection** (fully supported today, backend-only):
```
Owner submits registration → Admin reviews → reject with required reason
→ store never publicly discoverable → GAP: no documented next step for the owner
```

**Expired subscription** — GAP: no admin action exists for this scenario at all today. `RemindExpiringSubscriptions` notifies the owner, not Admin, and nothing changes `Store` or `StoreSubscription` state automatically or via an admin action on expiry.

**Store-wide emergency requiring Admin review** — target only, per `EMERGENCY-WORKFLOW.md`:
```
Owner reports store-wide Incident → requests Emergency Subscription Hold
→ Admin reviews → approves/rejects → (if approved) StoreSubscription paused
→ Owner requests reopening → Admin approves → subscription resumes, validity restored
```
Not built. Referenced, not redesigned, per this document's own constraint.

**Branch/location verification** — GAP: no scenario currently executes, because no mechanism exists (Section 7). Not fabricated here.

**Platform-wide monitoring** — GAP: no scenario currently executes, because no admin-facing view of cross-store data exists anywhere (Sections 10, 12).

## 21. Questions / Decisions for the System Admin Developer

- Shop approval criteria (what should be checked before approving, beyond what the form already collects): **[TEAM DECISION]**
- Should `suspended` ever be reachable, and by what trigger: **[TEAM DECISION]**
- Rejected-store reconsideration path — allow re-review, or require a fresh registration: **[TEAM DECISION]**
- Apparel/category validation mechanism — what replaces the dropped `apparel_specializations` entity, if anything: **[TEAM DECISION]**
- Branch verification authority — per-branch field, or accept store-level approval as sufficient: **[TEAM DECISION]**
- Subscription plan lifecycle — should plans be editable/deactivatable, not just created: **[TEAM DECISION]**
- Platform-wide subscription monitoring scope — what exactly Admin needs to see: **[TEAM DECISION]**
- Emergency Hold approval process — **[TEAM DECISION / SEE `EMERGENCY-WORKFLOW.md`]**
- Platform health monitoring scope — is this in scope for the capstone at all: **[TEAM DECISION]**
- Admin analytics scope — which of the Section 12 gaps are actually required by the defense committee vs. optional: **[TEAM DECISION]**
- Admin notification triggers — new registration, new ticket, emergency-hold request, or some subset: **[TEAM DECISION]**
- Whether a single `admin` role is sufficient long-term, or finer-grained admin permissions are ever needed: **[TEAM DECISION]**

## 22. Implementation Notes

*(Left for the System Admin developer to fill in, using the same discipline as the Customer Implementation Review: KEEP / MODIFY / ADD / REMOVE / OPTIONAL / OUT OF SCOPE, each classification tied to evidence or an approved decision, never to "would be nice.")*

**KEEP:**

**MODIFY:**

**ADD:**

**REMOVE:**

**OPTIONAL:**

**OUT OF SCOPE:**

## 23. Final Admin Workflow

*(Left for the System Admin developer to write, once Sections 1–22 are validated against their own inspection of the codebase and the team's decisions on Section 21's open questions. Use the same sequential format as every other workflow document in this series:)*

```
TRIGGER
→ ADMIN ACTION
→ SYSTEM UPDATE
→ AFFECTED ROLE/SYSTEM
→ NEXT STEP
```
