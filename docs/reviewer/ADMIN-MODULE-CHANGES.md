# Admin Module: Changes Made Outside Its Owner

**Admin module owner:** Bongo, Jossua A. · **Changes made by:** Arabejo, Joshua Wayman A. (AI-assisted), 2026-09-27

The Admin module is Bongo's. These backend changes were added while fixing Customer and Shop Owner flows that depend on the admin. This file lists exactly what was touched, so the module owner knows what exists, can review it, and can build the admin screens on top of it.

**No admin frontend was built.** Every change below is in `sutura-server` (the API). The one frontend change is a notification icon on the shop owner's side.

## Summary

| # | Change | Why it was needed | Commit (`sutura-server`) |
|---|---|---|---|
| 1 | Shop owner is notified when their registration is approved or rejected | Approve/reject sent no notice at all; an applicant had no way to find out | `f2c4b60` |
| 2 | Post-moderation: warn, hide a catalog design, hide a shop | Customers could report a listing, but the admin had no action to take on it | `e6c9e9e` |
| 3 | Pending/rejected shops are no longer publicly viewable by direct link | Search and map already hid them, but the shop profile page didn't | `d9457ee` |

## 1. Registration decision notifications

**What it does:** when the admin approves or rejects a shop, the owner gets an **in-app notification and an email**. A rejection includes the admin's reason.

**Files:** `app/Notifications/StoreApplicationStatusNotification.php` (new), `app/Http/Controllers/Api/V1/Admin/StoreController.php` (`approve()`, `reject()`). Frontend: `sutura-client/src/app/notifications/page.tsx` gets icons for `store_approved` / `store_rejected` (commit `73f6cd2`).

**Why email here but not elsewhere:** it's a rare, one-time, high-stakes event. Appointment updates were cut back to in-app only because per-status emails flooded inboxes.

| Check | Result |
|---|---|
| Objective | ✅ Administrative Dashboard: *"manage tailoring shop registration approvals."* |
| Scope | ✅ BPMN: registration review *"prompts the system to dispatch an automated SMS or email notification."* |
| Limitations | ✅ Email is a third-party service, covered by *"notification delivery depends on third-party services which may result in occasional delays."* |
| Difference from paper | The paper sends **temporary credentials** on approval. In SUTURA, owners register their own account, so approval sends a notice, not credentials. |

## 2. Post-moderation (warn → hide design → hide shop)

**What it does:** listings go live immediately. When a customer reports a catalog design, the admin can:

| Action | Endpoint | Body | Effect |
|---|---|---|---|
| Warn | `POST /api/v1/admin/catalog-items/{id}/warn` | `{ "reason": "..." }` | Owner asked to fix it (e.g. replace an image). **Stays visible.** |
| Hide design | `PUT /api/v1/admin/catalog-items/{id}/hide` | `{ "reason": "..." }` required | Hidden from customers. Owner can still edit it, but can't republish it. |
| Unhide design | `PUT /api/v1/admin/catalog-items/{id}/unhide` | — | Visible again. |
| Hide shop | `PUT /api/v1/admin/stores/{id}/hide` | `{ "reason": "..." }` required | Whole shop hidden from search, map and profile. |
| Unhide shop | `PUT /api/v1/admin/stores/{id}/unhide` | — | Admin lock lifted. Stays hidden only if the subscription is not active. |

Every action writes an **audit log** entry (`listing_warned`, `listing_hidden`, `listing_restored`, `store_hidden`, `store_restored`) and sends the owner a `ListingModerationNotification` (in-app + email) with the reason.

**How the lock works (important for the admin UI):** hiding sets the flag public pages already filter on (`catalog_items.is_active`, `stores.is_hidden`) plus a new **`admin_hidden_at`** and **`admin_hidden_reason`**. Those two are not mass-assignable; only the moderation endpoints set them. While `admin_hidden_at` is set:
- the owner's catalog edit form can't switch the design back on (edits still save);
- the owner's store visibility toggle can't unhide the shop;
- a subscription renewal can't unhide the shop.

**Report tickets now link to the item:** `support_tickets.catalog_item_id` (new column) is filled in by "Report this product," and `GET /api/v1/admin/tickets` and `/tickets/{id}` include `catalog_item` (`id`, `store_id`, `name`, `admin_hidden_at`). It is `null` for other ticket types.

**Files:** `app/Http/Controllers/Api/V1/Admin/ModerationController.php` (new), `app/Notifications/ListingModerationNotification.php` (new), `database/migrations/2026_09_27_130000_add_admin_moderation_fields.php` (new), `routes/api.php`, `app/Models/{Store,CatalogItem,SupportTicket}.php`, `app/Http/Controllers/Api/V1/{StoreController,CatalogController,SubscriptionController,CatalogInteractionController}.php`, `app/Http/Controllers/Api/V1/Admin/SupportTicketAdminController.php`.

**Tested:** 23 end-to-end API checks on a scratch database (report, warn, hide, owner-republish blocked, role checks, unhide, shop hide, renewal can't unhide, audit log) plus migration up/down/up.

| Check | Result |
|---|---|
| Objective | ✅ Administrative Dashboard: *"oversee platform-wide activity."* |
| Scope | ✅ Paper's Admin Dashboard UI: the admin can *"audit merchant profiles, or toggle baseline system visibility constraints if a storefront breaches service rules."* |
| Limitations | ✅ Manual only. No automated or AI content checks (reports are descriptive; no AI). No strike/penalty system. |

## 3. Approved-only public shop profile

**What it does:** `GET /public/stores/{slug}` now returns 404 to the public for a shop that isn't **approved**, the same rule search and map already used. The owner can still open their own profile.

**File:** `app/Http/Controllers/Api/V1/StoreController.php` (`publicProfile()`).

| Check | Result |
|---|---|
| Objective / Scope | ✅ *"This approach guarantees that only fully verified and legitimate tailoring establishments… appear on the public marketplace and interactive map interface."* |

## Not done (still the Admin module's to build)

1. **All admin screens:** shop approvals list, tickets inbox with the three moderation buttons, plans, dashboard.
2. **Approval gate on the owner dashboard.** The paper says owners get no dashboard access until approved; today approval only controls public visibility.
3. **Platform analytics endpoint:** total users, total shops, active subscriptions, platform revenue.
4. **Validate apparel categories** and **verify branch map locations** (both named in the objective).
5. **Edit/delete subscription plans** (only list and create exist).
6. **Admin-wide audit trail view** (audit logs exist per shop).
7. **Community Guidelines page**, if the terms mention "platform rules."

## Local setup

Pull `claude/festive-allen-3of2f6` in `sutura-server`, then run `php artisan migrate`. It adds `admin_hidden_at`/`admin_hidden_reason` on `stores` and `catalog_items`, and `catalog_item_id` on `support_tickets`.
