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
- `tracking_code` — a public, no-login order-status lookup by code (backend/DB only, no frontend page built yet, matches how a courier tracking number works). Don't build a page for it unless explicitly asked.

When asked to add/change tracking stages, check the model/migration in `sutura-server` first — don't copy a stage table straight out of the research docs without reconciling it against the real enum.

## What's already built vs. genuinely missing

Check `GroupTasks.md` directly before trusting this — it goes stale fast, but as of the last sync:

The Shop Owner dashboard (`/dashboard`) is **fully built and heavily polished**: Jobs, Appointments, Catalog, Services (Packages is a tab inside Services now, not its own nav item), Payments, Staff, Reports, Branches, Billing. Don't rebuild this area — check the systems below before assuming something's missing rather than just not yet found.

- **Staff Profile page** (`dashboard/staff/[id]`) — mirrors the Customer profile page's shape (header card + stat cards + content, no tab-heavy history log). The Staff List table itself is deliberately lean (4 columns: Staff/Workload/Status/Actions) with Role/Status/Workload/Branch filter dropdowns — everything else lives on the profile page. Staff have a `bio` and `profile_picture` now (set via Account Settings' avatar upload, owner-only visible, never shown to customers).
- **`SearchInput`** (`components/shared/SearchInput.tsx`) — the one search-box style every list toolbar should use (bg-[#FAF6F3] + border, no nested box-in-a-box). Already applied to all 8 list toolbars (Appointments, Payments, Jobs, Orders, Customers, Catalog, Packages, Staff, Services). Use it for any new list page instead of hand-rolling another search input.
- **Home (`/dashboard`) respects the branch selector** — it used to deliberately ignore it (showing branch data on the shop's whole-business overview page read as confusing); now the header selector shows there too and `dashboard/page.tsx` actually passes `branch_id` to its `/analytics` and `/jobs` calls.
- **Print pages** (`app/print/jobs/[id]/{ticket,receipt}`) — established house style: black/white only, zero boxed sections (hairline divider rules only), sharp corners, no icons/emoji. Follow this for any future print work in this project.
- **Catalog price sort** — the Sort dropdown on `/dashboard/catalog` (Default / High to Low / Low to High) is applied client-side in `filteredItems`'s `.sort()`, same pattern as the page's existing search/category/color/size filters (Catalog's fetch has no pagination cap, so client-side is safe). The backend also accepts `?sort=price_desc|price_asc` on the catalog endpoint if a future page needs server-side sort instead.

## Known bug pattern: capped-list counts drifting from reality (recurred 7+ times)

Watch for this shape in any new dashboard count/badge: a widget deriving its number by filtering an already-fetched, **capped** array (`per_page: 200`, a `.slice()`, etc.) instead of reading a dedicated count field the backend computed independently. It looks correct in dev (small dataset) and silently undercounts once real data grows past the cap — no error, just a wrong number. Fixed this session in: `NotificationBell.tsx`'s unread badge (now reads `res.data.unread_count`, not `notifications.filter(...).length`), `dashboard/page.tsx`'s Home alert widgets (now read `completed_unpaid_jobs`/`pending_dp_jobs_list`/`due_today_jobs`/`due_this_week_jobs` and their `_count` siblings straight from `/analytics`, no more local `allJobs` derivation), `useJobs.ts`'s tab badges (`walkInCount`/`onlineCount`/`pendingReviewCount` now come from the backend response, not `jobs.filter(...).length`), and `usePayments.ts`'s Job Balances tab (`unpaid_only=1` param replaces a client-side `.filter()` downstream of a `per_page: 500` fetch). If you add a new count anywhere, ask "is this array capped?" before deriving a total from it — if yes, get the backend to return the total separately.

## Dependency security scan (2026-08-13)

`npm audit` found 5 high-severity advisories, all inside `next`'s own bundled/transitive deps (`postcss`, `sharp`) plus `axios`/`brace-expansion`/`js-yaml`. Fixed by bumping the exact-pinned `next`/`eslint-config-next` from `16.2.9` → `16.3.0` in `package.json` (a minor version bump, not major) followed by `npm audit fix` (no `--force` needed once `next` was current) — `npm audit` now reports zero. **The version bump surfaced a real, pre-existing bug**: Next 16.3 enforces at build time that any page calling `useSearchParams()` must be wrapped in `<Suspense>` — `reset-password/page.tsx` and `print/jobs/[id]/receipt/page.tsx` weren't, and the former actually failed `npm run build`. Both fixed by extracting the page body into an inner component and wrapping it in `<Suspense>` from the default export, matching the pattern already used in `dashboard/jobs/page.tsx`. **If you add a new page using `useSearchParams()`, wrap it in `Suspense` from the start** — the build won't catch it if the route has a dynamic segment (like `print/jobs/[id]/...`), only fully-static routes fail loudly.

## Mobile-responsive patterns established this session

- A `flex flex-wrap` tab/pill bar that overflows its bordered container on narrow screens → switch to `flex items-center overflow-x-auto` on the wrapper with `shrink-0 whitespace-nowrap` on each tab button (fixed on Appointments' status tabs and the Jobs list tab bar).
- A `grid-cols-1 lg:grid-cols-3` list+detail split that stacks the detail/action panel *below* a tall list on mobile, making action buttons unreachable without scrolling past everything → use Tailwind `order-1`/`order-2` on the two panels plus `lg:order-none` to restore normal DOM order on desktop (fixed on Payments' Receipts tab).
- A skeleton loading state using a fixed `grid-cols-3` (or similar) that doesn't collapse on mobile even though the real content below it does → always give skeleton grids the same responsive breakpoints as the real grid they stand in for (fixed on Branches).

Three genuinely open tasks:
1. **Renalyn** — customer-facing "My Orders" tracker page (backend already supports filtering by `customer_id` via `JobOrderController::index`) + cross-shop search/discovery by garment specialization (the thesis's own core discovery feature — no page exists for this yet at all).
2. **Masudog** — a "My Assigned Jobs" filter tab for staff (backend already supports `?assigned_staff_id=X` on the jobs endpoint).
3. **Bongo** — System Admin dashboard has zero frontend pages, though the backend API is already fully built (`/admin/shops`, `/admin/subscription-plans`, `/admin/tickets`).

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
