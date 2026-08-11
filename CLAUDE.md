@AGENTS.md

# SUTURA — Web-Based Tailoring Shop Tracker System

Capstone project, BSIT, STI College Davao. Team: Joshua Wayman A. Arabejo, Jossua A. Bongo (Leader), Renalyn C. Bulotano, Clareynz June A. Masudog. Adviser: Jessiel Chris D. Hilot. **Defense/deployment deadline: first week of October 2026.**

This is the Next.js frontend. The backend lives in the sibling `sutura-server` repo (Laravel) — same thesis, separate git history.

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
