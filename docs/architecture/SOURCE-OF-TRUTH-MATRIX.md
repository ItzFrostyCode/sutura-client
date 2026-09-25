# Source-of-Truth Matrix

Built from a direct read of every Eloquent model in `sutura-server/app/Models/` and its migration + controller role-gates. Not the example table from the planning prompt — verified against the actual repository. 30 models total: 26 matched the seed list used to start the audit, 4 were found that weren't on it (`OrderMaterial`, `RecentlyViewed`, `ServiceReview`, `SubscriptionEvent`), and 5 were renamed from an earlier "Shop" naming to "Store" (`ShopBranch→StoreBranch`, `ShopPost→StorePost`, `ShopReview→StoreReview`, `ShopSpecialHour→StoreSpecialHour`, `ShopSubscription→StoreSubscription`).

Domain assignments below reflect actual usage, not a forced fit to any role.

| Data / Model | Domain | Created By | Managed By | Customer | Staff | Owner | Admin |
|---|---|---|---|:---:|:---:|:---:|:---:|
| `User` | Core/Shared (auth) | Self-registration (any role), Owner (creates Staff), or system (shadow walk-in) | Self (own profile) | ✓ own | ✓ own | ✓ own + roster | ✓ (approval context only) |
| `Role` | Core/Shared | Seeded | — | via pivot | via pivot | via pivot | via pivot |
| `StaffProfile` | Store/Branch domain | Owner/Branch Manager | Owner/Branch Manager; self (`is_available`) | — | ✓ own | ✓ | — |
| `Store` | Store/Branch domain | Owner | Owner (profile); **Admin** (`status`/`approved_at`/`approved_by`/`rejection_reason` only) | ✓ read | ✓ read | ✓ | ✓ (approval fields only) |
| `StoreBranch` | Store/Branch domain | Owner | Owner only (branch_manager excluded) | ✓ read | ✓ read | ✓ | — |
| `StoreSubscription` | Financial/Platform domain | System, on Owner's `subscribe()` | Owner (subscribe/change), system (renewal/expiry) | — | — | ✓ | ✓ |
| `SubscriptionPlan` | Platform/Admin domain | **Admin only** | No update/destroy route exists at all | (tier display only) | — | ✓ read | ✓ |
| `SubscriptionEvent` | Platform/Admin domain | System-derived (append-only) | Never updated | — | — | ✓ own store | ✓ |
| `Service` | Store domain | Owner (branch_manager excluded from write) | Owner only | ✓ read | ✓ read (picker) | ✓ | — |
| `ServicePackage` | Store domain | Owner only | Owner only | ✓ read | ✓ read | ✓ | — |
| `ServicePricing` | Store domain | Owner only | Owner only | ✓ read | ✓ read | ✓ | — |
| `ServiceReview` | Customer/Store domain | Customer | Customer (own) | ✓ | — | ✓ read | — |
| `CatalogItem` | Store domain | Owner only | Owner only | ✓ read | ✓ read | ✓ | — |
| `CatalogImage` | Store domain | Owner only | Owner only | ✓ read | — | ✓ | — |
| `CatalogItemReview` | Customer/Store domain | Customer | Customer (own), Owner (`reply` field) | ✓ | — | ✓ | — |
| `CatalogItemSave` | Customer domain | Customer | Customer (own) | ✓ | — | — | — |
| `CatalogRecommendation` | Store domain | System/Owner-derived | — | ✓ read | — | — | — |
| `CatalogOrder` | Operations domain | **Staff only** (walk-in/RTW sale, never customer-created) | Owner/Manager (discount, verify-payment) | ✓ own read | ✓ | ✓ | — |
| `StorePost` | Store domain | Owner only | Owner only | ✓ read | — | ✓ | — |
| `StoreReview` | Customer/Store domain | Customer | Customer (own), Owner (`reply`) | ✓ | — | ✓ | — |
| `StoreSpecialHour` | Store domain | Owner only | Owner only | ✓ read (closure banners) | ✓ read | ✓ | — |
| `Appointment` | Operations domain | Customer (public booking), Owner/Manager (walk-in), or **Staff** (follow-up, narrow) | Owner/Manager (full); Staff (`checked_in_at` + 2 status transitions); Customer (self-cancel only) | ✓ own | ✓ | ✓ | — |
| `JobOrder` | Operations domain | Owner/Manager, or Customer (repair-request path only) | Owner/Manager (broad); Staff (status — no code-level restriction, documented not fixed) | ✓ own | ✓ | ✓ | — (public tracking_code, no login) |
| `JobOrderStaff` (pivot) | Operations domain | Owner/Manager (`assignStaff`) | Owner/Manager; system stamps `completed_at` | — | ✓ own assignments | ✓ | — |
| `Measurement` | Customer/Measurement domain | Staff or Owner | Staff/Owner — **fork-on-edit only**, never mutates a past version | ✓ own read | ✓ (incl. unclaimed guests) | ✓ | — |
| `OrderMaterial` | Operations domain | Staff (`logged_by_staff_id`) | Staff/Owner | — | ✓ | ✓ | — |
| `Payment` | Financial/Operations domain | **Owner/Manager only** — Staff has no write access | Owner/Manager | ✓ own read | — (removed from UI this session) | ✓ | — |
| `AuditLog` | Platform/Shared domain | System (logged inside Owner/Manager-triggered actions) | Never (append-only) | — | — | ✓ owner only | — |
| `SupportTicket` | Platform/Admin domain | Any authenticated user, or Owner/Manager specifically | Owner/Manager (`close`), Admin (`updateStatus`) | ✓ own | — | ✓ own store | ✓ all |
| `SupportTicketReply` | Platform/Admin domain | Submitter, Owner/Manager, or Admin | — | as parent | as parent | as parent | as parent |
| `RecentlyViewed` | Customer domain | Customer (auto-logged) | System (upsert, no duplicates) | ✓ own | — | — | — |

## Critical finding: no standalone Store Size Chart entity

`size_chart_image_url` / `size_chart_columns` / `size_chart_rows` exist as columns on **both** `CatalogItem` and `Service` individually — there is no separate shop-level table representing one shared, reusable size-chart reference. `Measurement` (customer_id-keyed, actual body values) is a completely separate table with **no FK relationship** to either size-chart field set. See `docs/modules/OWNER-BRANCH-MODULE.md` for the full writeup — this is the one confirmed gap for the next implementation phase.

## Admin's actual authority (confirmed narrow)

Verified via `routes/api.php`'s `role:admin` group: store approve/reject, subscription-plan create/list (no update/destroy), support-ticket reply/status. **No Admin routes exist for Service, CatalogItem, Appointment, JobOrder, Measurement, or Payment** — Admin has zero business-data authority over those; platform governance only.
