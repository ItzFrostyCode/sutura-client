# SUTURA — Architecture & Conventions

> Verified against the code on **2026-10-29** (`composer.lock`, `package.json`, `routes/api.php`, `bootstrap/app.php`, `CheckRole`, `routes/console.php`, `app/Models`). Code wins over this file. Scope and roles: [`PRD.md`](PRD.md). What's done/open: [`STATUS.md`](STATUS.md).

## Repos

| Path | What | Git |
| --- | --- | --- |
| `sutura-server/` | Laravel API | own repo |
| `sutura-client/` | Next.js app (+ all shared docs in `docs/`) | own repo |
| `SUTURA/` (parent) | Workspace folder, `AGENTS.md`, loose thesis files | **not a repo** |

Branch-per-module workflow and "real vs. formal" ownership: see `CLAUDE.md` in each repo. On 2026-10-29 both repos were on `feat/ordering-discover-support-combined` (the combined ordering + discover + support-ticket release branch, in step with its `origin`, working tree clean). `main` is PR-only.

## Stack (installed versions, not the thesis paper's)

| Layer | Actual |
| --- | --- |
| Backend | Laravel **12.69.2**, Sanctum 4.3.3, PHP `^8.2` (`composer.json`) — `README.md` says "Laravel 13 / PHP 8.3+": that is wrong |
| Frontend | Next.js `^16.3.5` (App Router), React `^19.3`, TypeScript, Tailwind `^4.3`, Zustand `^5`, Axios `^1.20`, Leaflet (maps), lucide-react |
| Dev DB | Local **MySQL 8.4** (Homebrew). Never point local dev at Supabase — Sydney region, 3–5 s per request |
| Deploy target | Vercel (client) + Railway (API) + Supabase **Postgres** + Cloudflare R2 (files, backups). Steps: `DEPLOYMENT-RAILWAY-SUPABASE.md`, `LEADER-GO-LIVE-STEPS.md` |

Next.js here has breaking changes vs. older versions — read `node_modules/next/dist/docs/` before writing framework code (see `sutura-client/AGENTS.md`).

## Client ↔ API contract

- Base URL: `NEXT_PUBLIC_API_URL`, default `http://127.0.0.1:8000/api/v1`. All routes live under `/api/v1`.
- One Axios instance: `src/lib/axios.ts`. It adds `Authorization: Bearer <token>` from `sessionStorage['sutura_token']`.
- On **401**: it clears `sutura_token/user/store/staff` and redirects to `/login?redirect=…` **only** from `/dashboard*` and `/account/*` — public pages (`/`, `/search`, `/store/*`, `/map`) stay open to guests.
- Auth state: Zustand — `src/store/useAuthStore.ts`, `useAdminAuthStore.ts`, `useLoginModalStore.ts`.
- Error text for the UI: `getErrorMessage()` in `src/lib/apiError.ts` (first field error → `message` → fallback).

### Response & error shapes (what the code actually does)

| Case | Shape |
| --- | --- |
| Success | `{ "success": true, "data": … }` (convention across controllers; not every endpoint, check the controller) |
| Validation (422) | Laravel default: `{ "message": …, "errors": { field: [msgs] } }` |
| Deliberate `abort(400/401/403/409/422/429, 'msg')` | `{ "success": false, "message": "msg" }` — message is user-facing, shown as-is |
| 404 / 405 / 5xx | Generic message only; no stack trace, route names or SQL leak (`bootstrap/app.php`) |
| Machine codes | A few responses add `code`: `password_change_required` (403, from `CheckRole`), `plan_required` (403, from `PlanGate`) |

There is **no unified `error.code` envelope** (the idea in `backend.md` was never implemented). Don't assume one — branch on HTTP status, `errors`, or the specific `code` values above.

## Auth

- Sanctum **Bearer tokens** (not cookies). Tokens expire after 7 days (`SANCTUM_TOKEN_EXPIRATION`); changing the password revokes other sessions.
- Public login `POST /auth/login` (refuses admin accounts), separate `POST /auth/admin/login`. Shop owner logins are issued by the admin on application approval with a temporary password; `must_change_password` blocks every role-gated route with `password_change_required` until `PUT /profile/password`.
- Throttles: per-route on auth (6/min, admin 5/min), plus named limiters `authed` (300/min), `uploads`, `sensitive-writes` (`AppServiceProvider`). Put new upload/payment/ticket endpoints under them.

## Authorization & tenant isolation

Role strings: `admin`, `store_owner`, `branch_manager`, `staff`, `customer` (`RoleSeeder`). Older docs that say `shop_owner` are stale.

1. **`CheckRole` middleware** (`role:a,b,c`) does two things: the user has one of the roles, **and** belongs to the `{store}` in the URL. Admin routes skip the store check. This is the cross-shop isolation boundary — keep new shop routes inside these groups.
2. **Route groups under `stores/{store}`**: shared (`store_owner,branch_manager,staff`) → owner+manager → owner-only. Pick the narrowest group; the comments in `routes/api.php` explain why each action sits where it does. As of 2026-10-22 (`PLAN-roles-branches.md`): `POST /jobs` and every quote / confirm / cancel / pay / split / rules route is **owner+manager**; the shared group holds production moves, quality check, corrections, handover record, progress photos, appointments, consultations, customers, walk-in catalog orders and **read-only** services; services and catalog designs are **written by the owner only**.
3. **Branch scoping lives in controllers**, because middleware can't say "only your branch": `App\Support\BranchPin` (pins a branch manager/staff to `staffProfile->store_branch_id`), `JobOrderController::branchAccessDenied()`, `StaffController::staffManagerCrudDenied()`, `StoreBranchController::branchManagerCrudDenied()`. `StoreServiceRequest::authorize()` is a second, independent gate on service writes (owner only). `App\Support\StaffJobUpdateGuard` limits a plain staff `PUT /jobs/{id}` to notes, completion photo and production-stage moves (else 403).
3a. **Money is hidden from staff in the API**, not just the UI: `JobOrder::mayRevealMoney()` / `hideMoney()` strip `MONEY_FIELDS` (`total_amount`, `balance`, `discount_amount`, `rush_fee`, `quotation`), payments, refunds and quotation versions from job and customer responses for plain staff, and send `has_balance` instead. Add any new money field to that list.
4. **Plan gating**: `App\Support\PlanGate` (`basic < pro < premium`) returns `403 plan_required` server-side. Use it for anything a higher plan unlocks.
5. Public routes bind `{store:slug}`; owner routes bind the numeric `{store}`. Mixing them 404s.

### Route map (shape, not a full list)

| Prefix / group | Audience |
| --- | --- |
| `/public/*`, `/catalog/{slug}/…`, `/track/{trackingCode}` | Anyone (some throttled) |
| `/auth/*`, `/store-applications` | Public auth + "open a shop" application |
| `/my-orders`, `/my-appointments`, `/my-measurements`, `/my-*`, `/notifications`, `/profile/*` | Any signed-in user, self-scoped |
| `/stores/{store}/…` shared / owner+manager / owner-only | Shop roles via `CheckRole` |
| `/admin/*` | `role:admin` |

Authoritative list: `php artisan route:list` (never edit this table to match — regenerate).

## Data model — no hand-written schema doc

A schema doc rots on every migration, so there isn't one. Read the source of truth:

- `sutura-server/database/migrations/` (231 files) and `app/Models/` (42 models: `Store`, `StoreBranch`, `StaffProfile`, `Appointment`, `AppointmentItem`, `JobOrder`, `JobOrderStaff`, `JobOrderAssignee`, `JobOrderAssigneeEvent`, `OrderQuotationVersion`, `OrderCorrection`, `OrderHandover`, `OrderRefund`, `Measurement`, `Payment`, `PaymentMethod`, `Service`, `ServicePricing`, `CatalogItem`, `CatalogOrder`, `CustomApparelType`, `SubscriptionPlan`, `StoreSubscription`, `SmsMessage`, `SupportTicket`, `AuditLog`, …). There is **no** `ServicePackage` / `ServicePackageReview` any more (combo packages dropped 2026-10-16).
- Shared logic lives in `app/Support/` (e.g. `OrderFlowPresenter`, `OrderReadiness`, `OrderRequirements`, `OrderBatches`, `OrderQuotation`, `ProductionLine`, `WalkInCustomer`, `DataSnapshot`, `BranchPin`, `PlanGate`, `CanonicalTaxonomy`, `SearchIntent`). Read the support class before changing an order rule.
- **Pending migration:** `2026_10_29_120000_add_covers_and_sold_as_to_service_pricing` (checked with `php artisan migrate:status` on the dev DB, 2026-10-29). Everything older has run there; the leader still has to run it on his machine / production.
- Inspect live structure with `php artisan model:show Store` and `php artisan db:table job_orders` (read-only).
- State machines and rules live as **constants on models** — read them before adding business logic: `JobOrder::STATUSES`, `STAFF_STAGES`, `STAGES_REQUIRING_DOWNPAYMENT`, `MATERIAL_SOURCES` (`store_supplied` | `customer_supplied`), `Appointment::REJECTION_REASONS`, `Appointment::CUSTOMER_TRAVEL_BUFFER_MINUTES`, `CanonicalTaxonomy`.
- Job order `status` values (`JobOrder::STATUSES`): `pending → confirmed → awaiting_materials → design → pattern_making | mass_cutting_printing → cutting → sewing → qc_ironing → ready_for_pickup → ready_for_fitting → final_adjustments → balance_handover → completed` (flow order from the model's own comment; `ready_for_fitting` keeps its older meaning on older orders), plus `cancelled`, `rejected`, `on_hold`, and repair-only `queued`, `in_repair`, `qc_check`. The board shows them as columns **Request → Confirmed (Getting ready) → Being made → Ready (Hand over) → Done**, each ending in one button (`PLAN-job-board-flow.md`). Production moves go through `/jobs/{id}/production/{next,back,hold,resume}`; the generic `PUT /jobs/{id}` refuses stage jumps (`OrderReadiness::productionJumpError`). `PRODUCTION_TASKS` and `STAFF_STAGES` are different lists. `payment_status`: `unpaid → partial → paid`.

## Rules that have bitten this project

- **Capped-list counts**: never derive a badge/total by filtering a paginated or `per_page`-capped array. Return a separate `->count()` from the backend. Recurred 7+ times.
- **Revenue/paid math**: `total_amount - balance - discount_amount`, never `total_amount - balance` (a discount would count as cash).
- **Staff workload counts**: `COUNT(DISTINCT job_order_id)`, not pivot rows (one row per stage).
- **Combo packages no longer exist** (dropped 2026-10-16). One order is one service or design. A visit with several services makes linked orders (`group_kind = 'set'`, `parent_order_id`, suffix `-B`, `-C`); a team order split between payers makes batches (`batch_no`, `paid_by_name`); a follow-up/free-fix order uses `follow_up_of_id`. Don't overload `parent_order_id` for follow-ups.
- **Order requirements are snapshotted**: `OrderRequirements::resolve()` (design → service → store) is copied onto the job at creation (`measurement_requirement`, `fitting_requirement`, `payment_policy`). Changing a service later never changes existing orders; only `PUT /jobs/{id}/rules` does, with a reason.
- **Garments vs people**: handover and the completion gate count garments (`JobOrder::garmentCount()`), not wearers; `people_count` is wearers, `pieces_count` is garments.
- **A design has no price of its own** — it costs its service's price (`catalog_items.pricing_mode` null/`same`), the service's price + `extra_charge` (`extra`), or a quotation (`quote`). Read `pricing` from the API (`App\Support\DesignPricing`, client `lib/designPricing.ts`); never show or charge `catalog_items.price` for a design that has a service (that column is only for a design with no service). Service prices are starting prices; the confirmed price is the order's quotation.
- **Garments are 2 levels, services are 4** — Garment Category → Garment (`CanonicalTaxonomy::GARMENT_CATEGORIES` / `GARMENTS`), and Custom Tailoring & Garment Making / Uniform, Jersey & Teamwear / Alterations & Repairs / Garment Customization & Embroidery (`SERVICE_GROUPS`, each with `capabilities`). No gender or top/bottom level. An old 4-level slug still in the data resolves through `LEGACY_GARMENT_SLUGS` — match garments with `CatalogItem::scopeOfGarment(s)`, never `garment_type = ?`, and keep `knownGarmentSlugs()` old + new (an unknown slug makes the design a custom name waiting for admin approval). A service's order types (`service_types`) are worked out on save (`Service::deriveOrderTypes`), not ticked. Search goes through `App\Support\SearchIntent`. The client copy `src/lib/garmentTaxonomy.ts` is generated: `node scripts/gen-garment-taxonomy.mjs`.
- **Postgres portability**: search with `whereRaw('LOWER(col) LIKE ?', …)`; URL/path columns are `TEXT`, not `string()`; use the single `UPLOAD_DISK` constant, never bare `Storage::url()`.
- **Fillable**: a column missing from the model's fillable list silently fails to save (shipped 3×).
- **`Cache::remember`**: store plain arrays/scalars, never Collections or models.
- **Link fields** go through `App\Rules\SafeLink` (server) and `safeHref()` (client).

## Scheduled jobs (`routes/console.php` — needs the scheduler running)

| Command | When |
| --- | --- |
| `app:backup-database` | daily (uploads to `BACKUP_DISK`, e.g. R2) |
| `app:expire-subscriptions`, `app:remind-expiring-subscriptions` | daily |
| `app:notify-overdue-jobs`, `app:notify-unclaimed-pickups`, `app:notify-jobs-on-hold` | daily 08:00 |
| `app:remind-upcoming-appointments` | hourly |
| `app:expire-unanswered-appointments` | hourly (online request nobody answered before its time → cancelled, customer told) |
| `app:close-stale-visits` | hourly (approved + never arrived 24 h after it ended → no-show; started + never closed → consultation done) |

Manual (not scheduled): `app:snapshot-export` / `app:snapshot-import` move all data + uploaded files to another computer (`database/snapshot/README.md`); `migrate:fresh --seed` loads that snapshot by default (`SEED_FROM=demo` for the older generated demo shop).

## Verification commands

| Change | Run |
| --- | --- |
| Client code | `npx tsc --noEmit` (required by `AGENTS.md`), then ESLint if touched |
| Backend routes/auth | `php artisan route:list`, then real HTTP (`php artisan serve` + `curl`) — not repeated `$kernel->handle()` in one process (reuses the first user) |
| Refresh demo data | **`php artisan db:seed` is NOT safe to re-run.** Since 2026-10-21 it loads the saved snapshot (`SnapshotSeeder`), which **deletes every row in every table** (`DataSnapshot::import`) and restores the data as it was when `app:snapshot-export` last ran. On 2026-10-29 at 12:26 this replaced 7 days of real work (the Sakuragi orders ORD-0001…0011 and everything else). Before any `db:seed` / `migrate:fresh` / `app:snapshot-import`: run `php artisan app:snapshot-export` into a safe folder (or `mysqldump sutura`) first. Use `SEED_FROM=demo` only on a throwaway database. |

`php artisan test` now runs on in-memory SQLite (`phpunit.xml`: `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) and ran repeatedly on 2026-10-29 without touching the dev DB. It was once run against the dev DB before that setting, so still run it only when the owner OKs it. **Baseline: 20 failed / 215 passed — the same 20 fail on the last commit** (list in `STATUS.md`); compare by test name, not count.

**Do not run** `npm run build` while `next dev` is running (corrupts the shared `.next` cache).

Accounts for manual testing: [`TEST-ACCOUNTS.md`](TEST-ACCOUNTS.md) (password `password`, use the email as the key).
