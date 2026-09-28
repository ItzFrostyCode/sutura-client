@AGENTS.md

# SUTURA — Web-Based Tailoring Shop Tracker System

Capstone project, BSIT, STI College Davao. Team: Joshua Wayman A. Arabejo, Jossua A. Bongo (Leader), Renalyn C. Bulotano, Clareynz June A. Masudog. Adviser: Jessiel Chris D. Hilot. **Defense/deployment deadline: first week of October 2026.**

This is the Next.js frontend. The backend lives in the sibling `sutura-server` repo (Laravel) — same thesis, separate git history.

## Git workflow — branch per module, not direct commits to `main` (as of 2026-08-12)

**Do not commit or push directly to `main` anymore.** Up through 2026-08-12 all of Joshua's Shop Owner Module work landed straight on `main` (that history stays as-is — don't rewrite it) — the team has since switched to a branch-per-module workflow so `main` stays stable while all four people work in this same repo concurrently. If you're an AI agent picking up work here, check which branch you're on (`git branch --show-current`) before committing:

| Branch | Module | Owner |
|---|---|---|
| `feature/customer-module` | Customer Module | Bulotano, Renalyn C. |
| `feature/admin-module` | Administrative System Module | Bongo, Jossua A. |
| `feature/shop-owner-module` | Shop Owner Module | Arabejo, Joshua Wayman A. |
| `feature/staff-module` | Tailoring Staff Module | Masudog, Clareynz June A. |

> [!NOTE]
> **Real task division vs. the formal table above:** the branch-per-module table reflects the formal/academic per-person accountability structure, not the actual hands-on development split. In practice, **Joshua Wayman A. Arabejo develops all three of Shop Owner, Customer Module, and Staff Module himself** (full-stack, AI-assisted) — Renalyn C. Bulotano's real role is documentation/wording for the thesis papers, and Clareynz June A. Masudog's real role is finance/logistics (Claude AI subscription costs, printing/bond-paper for defense materials), not module development. Jossua A. Bongo (leader) develops System Admin. When working across `customer-module` or `staff-module` content/code in this project, treat it as Joshua's own active scope — don't withhold edits on "this is a teammate's module" grounds.

All four already exist on `origin` (both this repo and `sutura-server`), branched from `main` as of 2026-08-12. Workflow:
1. `git checkout <your feature branch>` — never work directly on `main`.
2. Commit normally as work progresses.
3. `git push origin <your feature branch>` — never `git push origin main` directly.
4. Merge into `main` via a Pull Request on GitHub once a module's work is ready for review, not by pushing straight to `main`.
5. Periodically merge `main` into your branch (`git merge main`) to pick up other members' merged work and avoid a large stale diff later.

If a task doesn't obviously belong to one of the four modules above, ask the user which branch to use rather than guessing or defaulting to `main`.

## What SUTURA actually is

A subscription-tiered (Basic/Pro/Premium), multi-branch platform connecting Davao City tailoring shops with customers. It solves two problems at once: customers can't find a shop that does their specific garment (Barong Tagalog, Filipiniana, school uniforms, etc.), and shop owners currently track orders manually — a physical job ticket pinned to a fabric bundle, vague "on going pa po" replies to "sa na po ba?" messages, no real visibility until pickup day.

## The four roles

- **System Admin** — approves/rejects shop registrations, validates apparel categories, verifies branch map locations, manages subscription tier definitions, monitors platform-wide activity.
- **Shop Owner** — configures storefront, service catalog, itemized pricing, branches, staff accounts, appointment schedules; views sales/productivity analytics.
- **Tailoring Staff / Branch Manager** — shares the *same* `/dashboard` as the owner, just role-gated. There is **no separate staff portal** — one was deliberately removed earlier in the project; don't rebuild it. Branch managers get owner-adjacent permissions scoped to their branch.
- **Customer** — discovers shops by garment type + location on a map, books appointments, places orders, tracks production in real time.

## Explicitly OUT of scope (per the approved thesis Limitations section)

Don't add these even if a groupmate, an interview doc, or a "wouldn't it be cool if" idea suggests them — they were deliberately excluded when the proposal was approved:

- Hardware integration (body scanners, RFID, digital measuring tools) — measurements are always manually encoded by staff.
- Offline mode / background sync — the system requires an active internet connection, full stop.
- Native third-party payment gateway integration — the system tracks payment/deposit status and amounts; it does not move money itself.
- Predictive analytics, AI-driven forecasting, or advanced BI — reporting is descriptive/real-time only.
- Inventory, fabric/material stock monitoring, purchase orders — completely outside the system boundary.
- Payroll, attendance-based wage calculation, utility-cost tracking.
- Tax filing automation, business permit validation.
- Logistics, courier routing, physical delivery/handover management.
- **Rental lifecycle management** (available → reserved → rented → returned → inspection → cleaning). This shows up in the interview research for "Fashion Shop" businesses (`Tailorshop,Sublimationshop,FashionShop.txt`), but was never part of SUTURA's approved scope. If it comes up, name it as scope creep.

## Order/production tracking — what's REAL vs what's in the research docs

The approved thesis paper and the interview docs describe idealized 13–19-stage customer-facing trackers per business type (tailoring/sublimation/fashion). **The actually implemented tracking is a real, multi-stage pipeline of its own — the "3-Phase Tailoring Tracker" — not the simple 5-stage version older docs may still describe.** From `sutura-server/app/Models/JobOrder.php` (`JobOrder::STATUSES`):

- `status` enum: `pending → design → pattern_making (or mass_cutting_printing) → cutting → sewing → ready_for_fitting → final_adjustments → qc_ironing → ready_for_pickup → completed`, with `cancelled`, `rejected`, and `on_hold` reachable from most points. `mass_cutting_printing` is the Bulk Order Override for jobs with a Team Roster/Size Sheet — see `jobHelpers.tsx`'s `columnsForJobs()`, which only shows whichever of the two is relevant. The Kanban board (`JobKanbanBoard.tsx`) renders all of these as columns.
- `payment_status` enum: `unpaid → partial → paid`.
- Staff-facing production stages (`JobOrder::STAFF_STAGES`): `design, pattern_making, cutting, sewing, qc_ironing` — assigned per-stage via a pivot table, so a staff member can have multiple open rows on the *same* job order. Any "how many active jobs" count must dedupe by job order id, not count pivot rows — this exact bug shipped (Staff List showed inflated counts) and is now fixed in the backend's `StaffController`.
- `tracking_code` — a public, no-login order-status lookup by code, matching how a courier tracking number works. Frontend built: `/track` (code entry, linked from the Package icon in `PublicNav.tsx`) → `/track/[code]` (live `OrderTrackingView` stepper).

When asked to add/change tracking stages, check the model/migration in `sutura-server` first — don't copy a stage table straight out of the research docs without reconciling it against the real enum.

## What's already built vs. genuinely missing

Check `GroupTasks.md` directly before trusting this — it goes stale fast, but as of the last sync:

The Shop Owner dashboard (`/dashboard`) is **fully built and heavily polished**: Jobs, Appointments, Catalog, Services (Packages is a tab inside Services now, not its own nav item), Payments, Staff, Reports, Branches, Billing. Don't rebuild this area — check the systems below before assuming something's missing rather than just not yet found.

- **Staff Profile page** (`dashboard/staff/[id]`) — mirrors the Customer profile page's shape (header card + stat cards + content, no tab-heavy history log). The Staff List table itself is deliberately lean (4 columns: Staff/Workload/Status/Actions) with Role/Status/Workload/Branch filter dropdowns — everything else lives on the profile page. Staff have a `bio` and `profile_picture` now (set via Account Settings' avatar upload, owner-only visible, never shown to customers).
- **`SearchInput`** (`components/shared/SearchInput.tsx`) — the one search-box style every list toolbar should use (bg-[#FAF6F3] + border, no nested box-in-a-box). Already applied to all 8 list toolbars (Appointments, Payments, Jobs, Orders, Customers, Catalog, Packages, Staff, Services). Use it for any new list page instead of hand-rolling another search input.
- **Home (`/dashboard`) respects the branch selector** — it used to deliberately ignore it (showing branch data on the shop's whole-business overview page read as confusing); now the header selector shows there too and `dashboard/page.tsx` actually passes `branch_id` to its `/analytics` and `/jobs` calls.
- **Print pages** (`app/print/jobs/[id]/{ticket,receipt}`) — established house style: black/white only, zero boxed sections (hairline divider rules only), sharp corners, no icons/emoji. Follow this for any future print work in this project.
- **Catalog price sort** — the Sort dropdown on `/dashboard/catalog` (Default / High to Low / Low to High) is applied client-side in `filteredItems`'s `.sort()`, same pattern as the page's existing search/category/color/size filters (Catalog's fetch has no pagination cap, so client-side is safe). The backend also accepts `?sort=price_desc|price_asc` on the catalog endpoint if a future page needs server-side sort instead.
- **Department taxonomy + owner-facing category dropdowns (2026-09-27)** — `catalogCategories.ts` exports `CATALOG_GARMENT_CATEGORIES`/`CATALOG_DEPARTMENTS`, mirroring `CatalogItem::GARMENT_CATEGORIES`/`DEPARTMENTS` on the backend. `BasicInfoSection.tsx`'s Garment Type field is a `<select>` from these now, not free text, plus a new Department (men/women/wedding/office) field — both flow into the header nav's MEN/WOMEN/WEDDING/OFFICE filters via `?department=` on the search page (`useSearchData.ts` was reading `department` into state but never actually sending it to the API before this).
- **Save/heart parity for Catalog items AND Services (2026-09-27)** — both the Catalog item detail page and the Service detail page now have a working heart button + saved count. Services previously had zero save/heart support at all (`ServiceSave`, mirroring the older `CatalogItemSave`); Catalog items had a working backend but no customer-facing button anywhere until this session. New `Services > Analytics` tab (`ServiceAnalyticsView`/`ServiceTopPerformersChart`) mirrors the existing Catalog analytics tab (KPI cards + revenue-ranked top-performers chart).
- **Booking wizard → real detail page parity (2026-09-28)** — the Review step's Design Reference / Selected Service cards now link out to the actual catalog-item/service detail page ("View full design/service details") before the customer confirms, and the owner-facing appointment view links a Service to that same public page — so what gets reviewed pre-confirmation is literally the same page as what was posted, not an abbreviated re-summary of it.
- **Customer travel-buffer + Early-Arrival Accommodation (2026-09-28)** — see `sutura-server/CLAUDE.md`'s "Appointment scheduling rules" section for the backend rules. Frontend-visible bits: the public booking form's conflict error now says "leave at least 30 minutes between appointments" instead of a generic overlap message, and the owner/staff Appointment view modal shows an "Arrived Early" callout with Accommodate Now / Ask Customer to Wait actions whenever `arrival_status === 'early'`.

## Known bug pattern: capped-list counts drifting from reality (recurred 7+ times)

Watch for this shape in any new dashboard count/badge: a widget deriving its number by filtering an already-fetched, **capped** array (`per_page: 200`, a `.slice()`, etc.) instead of reading a dedicated count field the backend computed independently. It looks correct in dev (small dataset) and silently undercounts once real data grows past the cap — no error, just a wrong number. Fixed this session in: `NotificationBell.tsx`'s unread badge (now reads `res.data.unread_count`, not `notifications.filter(...).length`), `dashboard/page.tsx`'s Home alert widgets (now read `completed_unpaid_jobs`/`pending_dp_jobs_list`/`due_today_jobs`/`due_this_week_jobs` and their `_count` siblings straight from `/analytics`, no more local `allJobs` derivation), `useJobs.ts`'s tab badges (`walkInCount`/`onlineCount`/`pendingReviewCount` now come from the backend response, not `jobs.filter(...).length`), and `usePayments.ts`'s Job Balances tab (`unpaid_only=1` param replaces a client-side `.filter()` downstream of a `per_page: 500` fetch). If you add a new count anywhere, ask "is this array capped?" before deriving a total from it — if yes, get the backend to return the total separately.

## Home dashboard's nav-vs-permission mismatch (2026-09-28)

Same bug class as the nav-audit fixes documented above (Catalog/Services, Branches, Staff) but on `dashboard/page.tsx` itself: its "Online Staff" widget gated its `GET /stores/{store}/staff` fetch on `isStoreOwner` alone, even though that route is actually shared by `store_owner` and `branch_manager` (`role:store_owner,branch_manager,staff` in `sutura-server/routes/api.php`) — a branch manager's Home never showed who was online on their own team despite being fully permitted to see that same roster on the Staff page. Fixed by gating on `canViewAnalytics` (`isStoreOwner || branch_manager`) instead, matching the same permission tier already used for the `/analytics` fetch.

A second, more consequential gap on the same page: Financial Snapshot (Outstanding Balance, Today's Revenue), Action Queue, Today's Agenda, and the performance Charts are all sourced from one `GET /analytics` call, which is `role:store_owner,branch_manager`-only — a plain `staff` account can never call it. The page used to render all of those sections unconditionally regardless of role, so a staff account landing on Home just saw ₱0.00/empty everywhere instead of the sections being hidden — silently contradicting this doc's own role table ("staff ... cannot ... see owner-only financials"). Fixed by wrapping that whole block in `{canViewAnalytics && (...)}` with a plain-staff fallback (a simple "Welcome back" quick-links card to Orders/Appointments/Customers) when it's `false`. If you add a new Home widget, check whether its data comes from `/analytics` or another owner/manager-only endpoint before assuming every role should see it rendered.

## Orders nav's nav-vs-permission mismatch for staff (2026-09-28)

Same bug class as the Home dashboard fix above, but the other direction: the Jobs list/detail pages showed **fully working-looking buttons for actions staff can't actually perform**, rather than hiding data staff can't fetch. `POST /jobs` (create), `POST /jobs/{id}/reject`, `POST /jobs/{id}/restore`, and `DELETE /jobs/{id}` are all `role:store_owner,branch_manager`-only in `sutura-server/routes/api.php` (grouped with `pay`/`discount` as supervisory actions), but none of the four had any frontend gating — a plain `staff` account would see "Create Job Order," "Quick Walk-in," the trash/restore icon, the per-card "Reject" button on pending jobs, and the job detail page's Delete button all rendered normally, then get a 403 on submit. Fixed by gating each behind `isOwnerOrManager` (`JobsPageHeader.tsx`, `JobKanbanBoard.tsx`, `JobDetailHeader.tsx` via a new `canDelete` prop) — "Approve" on a pending job stays available to staff since it's a plain `PUT .../jobs/{id}` status update they're already permitted to make (same route staff uses to progress any job's stage), only "Reject" needed gating. If you add a new job-order action, check which of the two route groups (`role:store_owner,branch_manager,staff` shared group vs. the `role:store_owner,branch_manager` "Owner & Branch Manager Access" group further down `routes/api.php`) it lives in before wiring its button unconditionally.

## Staff nav's nav-vs-permission mismatches (2026-09-28)

Three separate bugs found on the Staff page/profile, all in `StaffController::staffManagerCrudDenied()`'s territory ("only the shop owner can promote to branch manager or touch another branch manager's account"):

1. **`StaffListView` never forwarded its own `canManage` prop.** Both `StaffMemberCard` and `StaffMemberRow` default `canManage = true` internally, and the two render call sites (`filteredStaff.map(...)` for the mobile card view and the desktop table) never actually passed the prop down — so every role reaching `/dashboard/staff`, including plain `staff`, saw fully clickable Edit/Delete buttons on every roster row regardless of the page's `canManageStaff` check. This is the same shape as the earlier `JobsPageHeader`/`JobKanbanBoard` bugs (a button rendered without any gate at all, not a wrong gate) — always check that a `canManage`-style prop is actually threaded all the way to where the button renders, not just declared on the top-level component.
2. **No per-row branch-manager guardrail.** Even after (1) is fixed, a branch_manager viewer's `canManage=true` would still show Edit/Delete on *another* branch manager's row, which 403s per `staffManagerCrudDenied()`. Fixed by computing `canManage && (isStoreOwner || !member.is_branch_manager)` per row.
3. **`StaffFormModal`'s "Grant Branch Manager Authority" checkbox had no gating at all** — a branch_manager opening Add Staff or Edit Staff could check it, and the backend would 403 the whole request outright. Now gated to a new `isStoreOwner` prop.
4. **Staff profile page's `canEdit` had an illegitimate "viewing your own profile" self-edit clause.** `PUT .../staff/{id}` is `role:store_owner,branch_manager`-only with zero staff self-service path (self-service fields go through `ProfileController` on Account Settings instead) — so a staff member's own "Edit" button on their own profile always 403'd. Removed the self clause; also excludes a branch manager from editing their own or another branch manager's record via the same rule as (2). Note `StaffController::show()` already 403s a cross-branch view entirely, so no separate branch check was needed here.

## Services nav's nav-vs-permission mismatches + orphaned Special Hours component (2026-09-28)

- **Services page had zero role gating anywhere.** "Add Service," "Add Package," "View deleted services" (restore), and every row's Edit/Duplicate/Set Sale Price/Delete rendered unconditionally to any role — but the Services nav is shown to plain staff too (they need read access to populate a service picker on jobs/appointments), and `store`/`update`/`updateSale`/`restore`/`destroy` on both Services and Service Packages are `role:store_owner,branch_manager`-only on the backend. Gated all of it behind a new `isOwnerOrManager` check threaded into `ServiceListView`/`ServicePackageListView` as a `canManage` prop.
- **The Analytics tab leaked owner-only financials to staff.** `total_revenue` is embedded in every service object returned by the staff-accessible `GET /services` (see `sutura-server/CLAUDE.md`'s `ServiceController::index()` note), and the Services module's Analytics tab (revenue-ranked top performers) had no gating at all — directly against the documented role model ("staff ... cannot see owner-only financials"). The tab is now hidden from anyone who isn't `isOwnerOrManager` in `ServicesModuleTabs`, with the same guard on the page's tab-content render.
- **`SpecialHoursAnnouncementCard.tsx` was a fully-built, fully-wired-to-the-backend component that nothing in the app ever rendered** — no import anywhere outside its own file. There was no Special Hours & Announcements UI at all, despite the backend (`role:store_owner`-only `special-hours` endpoints) being complete. Same "backend built, no consumer" shape as the avatar-upload/toggle-availability gaps found earlier. Wired it into `StoreHoursTab.tsx` (the storefront's Hours tab, shown when the logged-in owner views their own store), gated behind the page's existing `isOwnerViewingOwnStore` flag. If you build a component against an existing API and it isn't rendered from any page within the same session, treat that as a red flag worth checking before moving on — it's the same failure mode every time.

## Catalog Designs read-scope backend fix (2026-09-28)

Found while checking Support's route group in `routes/api.php`: `GET /catalog` (the Catalog Designs list) was left `role:store_owner`-only even though Catalog's own write actions already grant `branch_manager` access, and the nav shows Catalog Designs to `isStoreOwner||isBranchManager`. A branch manager could create/edit/delete catalog items but the page's own list fetch 403'd for them — fixed on the backend (see `sutura-server/CLAUDE.md`). No frontend change needed; `dashboard/catalog/page.tsx` already just calls `GET /stores/{id}/catalog` with no gating of its own, which is correct now that the route matches the nav.

## Notifications and Support nav (2026-09-28)

- **Notifications** — checked and confirmed already correct: `NotificationController`'s routes sit under plain `auth:sanctum` with no role restriction, and every operation (`index`, `show`, `markAsRead`, `bulkDelete`, etc.) is inherently self-scoped through `$request->user()->notifications()`/`unreadNotifications()` — no role check is needed since a user can only ever touch their own notifications. No changes made.
- **Support — real mismatch found.** The Help & Support drawer (`HelpPanel.tsx`, opened from the header's `?` button shown to every role) linked "Support tickets," the bottom "Contact support" CTA, and "Audit log" to every role with no gating at all — but `SupportTicketController`'s dashboard routes and `GET /audit-logs` are both `role:store_owner`-only on the backend (per this doc's own "Catalog + Service management" note: "Audit Log ... and Support Tickets stay store_owner-only — none of those are shown to branch managers in the nav"). The sidebar's own "Audit Log" item already respects this (`isStoreOwner`-gated), but this second, separate entry point into the same pages didn't. A branch manager or staff account got a 403 submitting a ticket, or a silently-empty "No audit log entries yet." page. Threaded `isStoreOwner` into `HelpPanel` and hid all three; "Welcome guide" and "System news" stay universal since they carry no backend permission at all.

## Customer module responsive + UX overhaul, Phase 1 (2026-09-28)

First phase of a full-app responsive redesign, scoped to the Customer module per the owner's explicit request (`docs/DEVICE-BREAKPOINTS.md` is the breakpoint reference driving this work). Shop Owner/Staff dashboard, Admin, and the rest of Customer-facing pages (homepage/search/storefront shell beyond what's already on the 600px system) are follow-up phases, not done yet.

- **Booking wizard now has a real visual progress stepper** (`store/[store_id]/book/page.tsx`) instead of a plain "Step X of Y" text pill — reuses `StatusStepper` (already proven on `OrderTrackingView`) rather than inventing a second stepper style. Also fixed `BookingActionBar`'s bottom CTA to widen to `lg:max-w-5xl` (matching the page's own content-wrapper breakpoint) instead of staying capped at the mobile 599px width once the `lg:` two-column layout (with `BookingDesktopSummary` alongside) is active.
- **`OrderTrackingView` (shared by `/account/orders/[id]` and public `/track/[code]`) had zero responsive treatment and two different effective widths** depending on which page embedded it (`AccountLayout`'s `max-w-7xl` vs. `/track`'s page-level `max-w-2xl`). Now owns its own `md:max-w-3xl` and switches to a two-column layout at 768px+ (order info + stepper left, appointments sticky right) instead of a single-column stack at every width. `/account/orders` list cards moved from a single-column stack to a responsive grid (up to 3 cols) for the same reason — a full-width card row inside a wide account shell just wasted space.
- **`register/page.tsx` had zero width containment at all** (`px-[10px]` fixed, no `max-w`) — now matches `login/page.tsx`'s existing centered `max-w-md` card pattern at `md:+`.
- Corrected a stale claim in `DEVICE-BREAKPOINTS.md` itself: §3.A said PublicNav/WebHoverNav switches at `lg:`(1024px); the actual code switches at `md:`(768px).
- **Scope adjustment found mid-implementation**: the plan considered applying the 600px two-column field-split system (from catalog/service detail pages) inside the booking wizard's Step 2/3 forms. Skipped after checking the actual container — that step's content column is capped at `max-w-xl` (576px) all the way up to the `lg:` (1024px) two-column breakpoint, so there's no extra width between 600–1024px to split fields into; forcing it would only cram inputs into unnecessarily narrow columns. Don't re-attempt this without first confirming the container actually widens in that range.

## Shop Owner dashboard nav shell responsiveness check (2026-09-28)

Targeted check of the dashboard's nav shell only (`dashboard/layout.tsx` + `components/shell/*`), not a full audit of every dashboard page's internal layout — the shell itself was already solidly built: sticky header, `lg:`-gated desktop rail vs. an off-canvas mobile drawer (`w-72 max-w-[85vw]`), `HeaderBreadcrumbs` hidden below `sm:` with `truncate`/`min-w-0` throughout so it can never overflow into the header's icon row, and both `StoreSwitcher`'s and `AccountHeaderMenu`'s dropdown panels positioned (`right-0`/`left-0` with fixed widths well under 320px) so they can't clip off-screen even on the narrowest phones. One real bug found and fixed: the outer shell used `h-screen` (100vh) instead of `h-dvh` — on mobile Safari/Chrome, `100vh` is taller than the actually-visible viewport while the address bar is showing, clipping the bottom of this fixed-height app-shell (sidebar/drawer, sticky header, internally-scrolling `<main>`) until the page scrolls once. Matches the `min-h-dvh` pattern already used on customer-facing pages. Per CLAUDE.md's own "desktop-first for the shop floor" principle, a deeper responsive pass on individual dashboard pages' internal layouts (Jobs, Appointments, Payments, etc.) is a separate, larger follow-up, not done here.

## Dependency security scan (2026-08-13)

`npm audit` found 5 high-severity advisories, all inside `next`'s own bundled/transitive deps (`postcss`, `sharp`) plus `axios`/`brace-expansion`/`js-yaml`. Fixed by bumping the exact-pinned `next`/`eslint-config-next` from `16.2.9` → `16.3.0` in `package.json` (a minor version bump, not major) followed by `npm audit fix` (no `--force` needed once `next` was current) — `npm audit` now reports zero. **The version bump surfaced a real, pre-existing bug**: Next 16.3 enforces at build time that any page calling `useSearchParams()` must be wrapped in `<Suspense>` — `reset-password/page.tsx` and `print/jobs/[id]/receipt/page.tsx` weren't, and the former actually failed `npm run build`. Both fixed by extracting the page body into an inner component and wrapping it in `<Suspense>` from the default export, matching the pattern already used in `dashboard/jobs/page.tsx`. **If you add a new page using `useSearchParams()`, wrap it in `Suspense` from the start** — the build won't catch it if the route has a dynamic segment (like `print/jobs/[id]/...`), only fully-static routes fail loudly.

## Mobile-responsive patterns established this session

- A `flex flex-wrap` tab/pill bar that overflows its bordered container on narrow screens → switch to `flex items-center overflow-x-auto` on the wrapper with `shrink-0 whitespace-nowrap` on each tab button (fixed on Appointments' status tabs and the Jobs list tab bar).
- A `grid-cols-1 lg:grid-cols-3` list+detail split that stacks the detail/action panel *below* a tall list on mobile, making action buttons unreachable without scrolling past everything → use Tailwind `order-1`/`order-2` on the two panels plus `lg:order-none` to restore normal DOM order on desktop (fixed on Payments' Receipts tab).
- A skeleton loading state using a fixed `grid-cols-3` (or similar) that doesn't collapse on mobile even though the real content below it does → always give skeleton grids the same responsive breakpoints as the real grid they stand in for (fixed on Branches).

**Customer-facing "My Orders" tracker (`/account/orders`, `/account/orders/[id]`) and cross-shop discovery search (`/search`) are both built** — verified directly against the code on 2026-09-19, after this doc and `GroupTasks.md` were found to still describe them as missing well after they'd shipped. Don't trust either doc's "genuinely missing" framing without checking the real routes first — that's exactly the mistake that happened here.

Two remaining open tasks (not re-verified as of 2026-09-19 — check the code before trusting these too):
1. **Masudog** — a "My Assigned Jobs" filter tab for staff (backend already supports `?assigned_staff_id=X` on the jobs endpoint).
2. **Bongo** — System Admin dashboard has zero frontend pages, though the backend API is already fully built (`/admin/shops`, `/admin/subscription-plans`, `/admin/tickets`).

## UX principles — what "right" looks like here

Grounded in real shop-owner/customer interviews (`Tailorshop,Sublimationshop,FashionShop.txt`), not guesses:

- **Mobile-first for customers, desktop-first for the shop floor.** The approved thesis UI design splits this explicitly: Shop Owner/Staff/Admin dashboards are desktop-oriented and data-dense with sidebar nav; the customer-facing side is a mobile-responsive card layout. Don't port a data-dense dashboard pattern onto customer-facing pages, and don't try to cram shop-floor data density into a phone screen.
- **Minimize clicks — for both sides.** A real shop owner or staff member is running the shop *and* the software between customers/fittings; every extra tap during a fitting is a real cost. Favor single-tap stage updates over multi-step wizards, inline edits over separate edit pages, and batch actions for bulk orders (e.g. a school's uniform batch, a team's jersey set).
- **Every customer-facing order view should answer 3 questions without extra taps** (these are literally the questions real customers ask, per the interviews): *Ano ang ginatahi?* (what's being made — garment, fabric, size, qty), *Saan na ang order ko?* (what stage, right now), *Magkano na ang nabayad at magkano pa?* (payment status). A visible progress indicator (stepper/progress bar with timestamps) beats a bare status word — see the ASCII dashboard mockups in `Tailorshop,Sublimationshop,FashionShop.txt` §G for the shape customers expect.
- **Multi-branch is a first-class dimension, not an afterthought.** A shop owner with multiple branches needs to filter by branch everywhere — jobs, staff, appointments, analytics — not just on a dedicated branches page. `ShopBranch` model and `/branches` route already exist; when adding a new list/dashboard view, check whether it needs a branch filter too.
- **Staff notifications matter operationally**, not just as a nice-to-have: staff should get an in-app ping the moment they're assigned to a production stage (built recently per `GroupTasks.md` — verify it still fires end-to-end before building more on top of it).

## Tech stack — thesis paper vs. current reality (don't cite the paper blindly)

| Layer | Approved thesis paper says | Actual current team decision |
|---|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Zustand | Same — matches |
| Backend | Laravel (PHP), RESTful API | Same — matches |
| Database | MySQL hosted on **PlanetScale** | **Real local MySQL 8.4 (Homebrew, not XAMPP)** right now; migrating to **Supabase (Postgres)** around mid-September 2026 — see `DEADLINE.md`. PlanetScale was the original paper's plan and was superseded. |
| File storage | not specified in the paper | **Cloudflare R2** (planned at migration time) |
| Deploy | Vercel (frontend) + Railway or Render (backend) | Vercel (frontend) + **Railway** (backend) — Render was dropped |

When touching deployment or DB config, trust `DEADLINE.md` over the paper — the paper is frozen at proposal-approval time, `DEADLINE.md` reflects what the team actually decided since.

## Data model — paper ERD vs. actual code (they've diverged)

The approved thesis ERD/class diagrams describe `customer_profile`, `tailoring_staff_profile`, and a unified `feedback` table as dedicated entities. **The real implementation differs**: there is no separate `CustomerProfile` model — customers are `User` records with a `customer` `Role`; staff use `StaffProfile`; and feedback is split into `ShopReview` + `CatalogItemReview` rather than one unified table. When reasoning about the schema, trust `sutura-server/app/Models/` over the paper's diagrams.

## Reference docs in this repo

- **`TASK_DIVISION.md` and `REQUIREMENTS.md`** — team module ownership and the fuller functional spec. **Module 3, "Shop Owner Module," owned by Joshua Wayman A. Arabejo**, is the one that governs work in this repo's `/dashboard/*` (owner-facing) area — check it before assuming something belongs to (or is missing from) this scope rather than Customer (Renalyn)/Staff (Masudog)/Admin (Bongo) module work. Goes stale relative to shipped code fast — trust the actual routes/pages over it when they conflict, but check it first for *whose* scope something is.
- `BUILD_RULES.md` — an earlier, never-actually-adopted multi-agent build methodology (orchestrator/frontend-dev/backend-dev/qa/adversary roles, `DEFECTS.md`/`ADVERSARIAL_REVIEW.md` ledgers). No such role split or ledger has ever been used in this project's real history — treat as an unused planning artifact, not a live process to follow. Kept for provenance since it's paired with (and references) `REQUIREMENTS.md`.
- `Title&Objectives.md`, `suturathesisapproved.txt` — the full approved capstone proposal: objectives, scope & limitations, RRL/RRS, methodology, use-case/BPMN/ERD narrative descriptions, and per-dashboard UI design intent (Admin, Shop Owner, Staff, Customer).
- `Tailorshop,Sublimationshop,FashionShop.txt` — the polished, synthesized interview-derived business analysis (workflows, pain points, proposed tracking stages, ASCII dashboard mockups) covering 3 business types. Tailoring-shop findings are directly in scope; sublimation/fashion findings (incl. rental) are market-research context only, not adopted scope. `docs/research/Complete Business Tailor Shops.txt` is the earlier raw-data-extraction draft this was synthesized from — archived there, kept for provenance, not meant to be read as authoritative (it predates and is superseded by the file above).
- `GroupTasks.md` — current task ownership, checked against real code, not assumptions.
- `DEADLINE.md` — deployment timeline and the MySQL → Postgres migration plan, including a known bug to fix in `FileUploadController.php` when switching off local disk storage.
- `ShopOwnerSubscription.md` — actor/entity breakdown for Shop Owner responsibilities.
- `Activity-Diagram.md`, `BPMN.md`, `Sequence-Diagram.md`, `Usecase-Diagram.md` — supplementary design diagrams (Sequence-Diagram.md has real renderable Mermaid syntax). **Same caveat as the ERD above applies**: these capture the *originally proposed* design approved at proposal defense — treat them as design intent/reference, not as a live spec. Where they conflict with the actual code (e.g. class/entity names, stage counts), the code wins. Don't regenerate features straight from these diagrams without checking `app/Models/` and the routes first.
