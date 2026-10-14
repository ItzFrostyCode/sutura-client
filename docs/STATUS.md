# SUTURA — Status (keep this short)

> **Last checked: 2026-10-10.** Items marked ✔ were re-verified against code that day (routes, pages, models, scheduler). Items marked *(10-02)* are carried over from [`THESIS-CROSS-CHECK.md`](THESIS-CROSS-CHECK.md) and **not** re-verified — confirm in code before relying on them. Update this file when something ships or a claim turns out wrong; don't let it grow into a changelog.

**Defense / deployment date:** `CLAUDE.md` and `DEADLINE.md` say "first week of October 2026". **TBC — confirm the real date and write it here.**

## Thesis coverage

| Objective | State |
| --- | --- |
| 1. Administrative Dashboard | 🟡 approvals, accounts, plans/upgrades, tickets, moderation, activity ✔; branch-location verification ✔ (`/admin/branches`); **custom apparel category approval ✔ still missing** (no admin route); **system-health panel ✔ still missing** (no admin route) |
| 2. Subscription & Accounts | ✅ plans, staff limits, expiry, roles; plan gating now server-side via `PlanGate` ✔ |
| 3–4. Discovery + Map | ✅ `/search`, `/map`, `/stores` ✔; reviews require a completed order/appointment *(10-02)* |
| 5. Shop Dashboard | ✅ |
| 6. Order Tracking & Measurement | ✅ `/account/orders`, `/track/[code]` ✔; email at stage changes; **SMS built but test-mode only** — no live provider account *(10-02)* |
| 7. Analytics | ✅ owner + admin reports ✔ |
| Limitations | ✅ all respected (see `PRD.md` out-of-scope table) |

## Ordering flow (2026-10-10, branch `feature/ordering-flow`)

Flows 2 and 3 of the workflow specification are built and API-tested; see [`ORDER-FLOW.md`](ORDER-FLOW.md). A scope audit the same day **removed** the per-order material/supplier/cost tracking (thesis Limitations). Still open: Scenario D (linked follow-up order), a workload view, and a browser check of the delivery panel on a phone.

## Open work, ranked

1. **Deployment proof** — Vercel + Railway + Supabase + R2 never run end-to-end. `DEPLOYMENT-RAILWAY-SUPABASE.md` (10-01): code reviewed for Postgres, **not yet run against a real Postgres**. Dry run on a throwaway Supabase project is step 0. *(unverified today — ask the leader whether any of it was done)*
2. **Durable backups** — `app:backup-database` ✔ exists and is scheduled daily; it only survives redeploys if `BACKUP_DISK` points at R2 and the scheduler is running.
3. **Admin: custom apparel category approval** (~½ day) — thesis Objective 1 says "validate apparel categories"; today categories are a fixed list in `CanonicalTaxonomy` plus an `others` free-text escape hatch.
4. **Admin: system-health panel** (2–3 h) — DB ping, last backup, error count; thesis says "system performance".
5. **Live SMS** — needs a provider account (Semaphore driver included, untested live). Defensible as "third-party dependent" per the Limitations if no provider is available.
6. **Usability testing (SUS)** — thesis non-functional requirement; nothing recorded yet *(10-02)*.
7. **Phone-width check** of the newest screens (Statements, Text Messages, Payment Methods, service Requirements box, staff Home) — `LEADER-GO-LIVE-STEPS.md` says these were only type-checked, not seen in a browser *(10-01)*.

## Documentation debt (found 2026-10-10 — all ✔ verified against code)

Nothing below has been edited yet except where noted. Each is a stale statement someone could copy into code.

| Where | Says | Code says |
| --- | --- | --- |
| `sutura-server/CLAUDE.md` (roles) | role string `shop_owner` | `store_owner` (`RoleSeeder`, every `role:` middleware) |
| `sutura-server/CLAUDE.md` ("Domain models") | `Shop`, `ShopBranch`, `ShopPost`, `ShopReview`, `ShopSpecialHour`, `ShopSubscription` | `Store*` equivalents (the Shop→Store rename); list also omits `PaymentMethod`, `SmsMessage`, `StoreApplication`, `SubscriptionEvent`, `SubscriptionUpgradeRequest`, `RecentlyViewed`, `ServiceReview`, `ServicePackageReview`, `ServiceSave` |
| `sutura-server/CLAUDE.md` | `MATERIAL_SOURCES` = `shop_supplied` | `store_supplied` |
| `sutura-server/CLAUDE.md` (job pipeline) | no repair statuses | `STATUSES` also has `queued`, `in_repair`, `qc_check` |
| `sutura-server/CLAUDE.md` | "`config/cors.php` still doesn't exist" | exists |
| `sutura-server/CLAUDE.md` | tracking code has "deliberately no frontend page" | `/track` and `/track/[code]` exist (client CLAUDE.md is right) |
| `sutura-client/CLAUDE.md` | "System Admin dashboard has zero frontend pages" | `/admin/*` has accounts, activity, applications, branches, login, plans, stores, tickets, upgrades |
| `sutura-server/GroupTasks.md` | Customer "My Orders", cross-shop search, admin UI are all "missing" | all exist — **the whole file is obsolete**; this file replaces it |
| `README.md` | "Laravel 13", "PHP 8.3+" | Laravel 12.69.2, `php ^8.2` |

**Size warning:** the two `CLAUDE.md` files are ~60 KB (client) and ~46 KB (server) and load into every session. Much of that is dated "mobile re-check" and bug-fix logs that no longer guide future work. Suggested (not done): move those logs into `docs/` and keep `CLAUDE.md` to rules + pointers.
