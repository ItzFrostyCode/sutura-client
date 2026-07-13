# Group Task Assignments

Each section below is based on what's **actually already built** vs. **genuinely still missing** — checked directly against the real code, not assumed. Read the "Already Done" part first so nobody accidentally rebuilds something that exists.

**Scope reminder for everyone**: the Shop Owner dashboard (`/dashboard`) is already fully built (Jobs, Appointments, Catalog, Payments, Staff, Reports, Branches, Billing). None of the three tasks below should touch that area — they're each their own separate part of the system.

---

## Renalyn — Customer Portal: Custom Jobs + Design Catalog

### Already done (don't rebuild)
- Per-shop catalog browsing already works: `/shop/[shop_id]/catalog` (grid) and `/shop/[shop_id]/catalog/[item_id]` (item detail).
- The shop's public profile page already works: `/shop/[shop_id]` — Home/About/Services/Catalog/Hours/Locations/Work/Reviews tabs, with the shop's logo, description, ratings, etc.
- The customer-facing booking wizard already works: `/shop/[shop_id]/book`.

### Genuinely missing — this is the real task
1. **Custom Jobs (customer-side "My Orders")**: there is currently **no page at all** where a logged-in customer can see their own job orders' status. The backend already has everything needed (`JobOrder` has `customer_id`, and `JobOrderController::index` already supports filtering) — what's missing is a customer-facing read-only tracker page showing "here are my orders and what stage each one is at."
2. **Cross-shop search / discovery**: there is currently **no page at all** for a customer to search *across all shops* by garment specialization (e.g. "find a shop near me that does Barong Tagalog"). This is the thesis's own core discovery feature and is Renalyn's main build. The individual shop pages above are the destination once a shop is found — the search/discovery list itself doesn't exist yet.
3. Design Catalog items showing up as search results, and clicking through to "My Storefront" (the shop's public profile above) — this connects #2 (search) to the already-built shop profile page, it's the last step of the same flow, not a separate rebuild.

---

## Masudog — Staff Side

### Important correction first
There is **no separate Staff Portal** to build. Staff already log into the exact same shared dashboard as the Shop Owner (`/dashboard`), gated by role — the standalone staff dashboard was deliberately removed earlier in this project. Building a new separate system would conflict with this.

### Already done (don't rebuild)
- Staff already see the same Jobs/Appointments/Catalog views as the owner, just role-gated (branch-restricted for staff/branch managers; Owner-only sections like Multi-Stage Staff Assignment, Outsourcing, Rush, and Total Amount adjustments are visually marked "Owner/Manager Only").
- Staff now get an **in-app notification** the moment they're assigned to a production stage (Design/Pattern Making/Cutting/Sewing/QC & Ironing) — built and tested this week. Same notification bell everyone already uses.

### Genuinely missing — this is the real task
1. **"My Assigned Jobs" view**: right now a staff member sees the *whole* job list (filtered to their branch only) — there's no one-click way to filter down to "just the jobs assigned to me." The backend already supports this (`?assigned_staff_id=X` query param on the jobs endpoint) — the missing piece is just a frontend toggle/tab for it.
2. Verify/demo the new staff notification end-to-end as part of this task (assign a job → confirm the staff account sees the bell notification).

---

## Bongo (Leader) — Billing & Plans / System Admin

### Already done (don't rebuild)
- The Shop Owner's own `/dashboard/billing` page already fully works — Upgrade/Downgrade between Basic/Pro/Premium plans, real logic, 300+ lines, functioning today.

### Genuinely missing — this is the real task
The **System Admin dashboard has zero frontend pages** — none at all — even though the backend API for it is already fully built and working:
- `GET /admin/shops` + approve/reject endpoints (approving new shop registrations)
- `GET`/`POST /admin/subscription-plans` (managing what Basic/Pro/Premium actually include/cost)
- Support ticket management endpoints (`/admin/tickets`, reply, status updates)

So Bongo's real task is building the **admin-side UI** that consumes these already-working endpoints — shop approval queue, subscription plan editor, and a ticket inbox. This is the part that's "connected to Billing & Plans" — the admin is who actually configures what the plans are and approves who gets to have a shop at all.

---

## Why this split makes sense together

- Renalyn's search feature is how a customer *finds* a shop → lands on the shop profile (already built) → books or browses catalog (already built) → later checks "My Orders" (Renalyn builds this) to track it.
- Masudog's staff work only matters once a job actually exists and gets staffed — which now properly notifies them (built this week).
- Bongo's admin panel is what approves shops into existence and controls the subscription tiers in the first place — upstream of everything else.

Three genuinely separate, non-overlapping areas, each with real backend support already in place — nobody needs to wait on anybody else to start.
