# Go-live checklist — Vercel (frontend) + Hostinger VPS (Laravel API) + Supabase (Postgres) + Cloudflare R2 (files + durable DB backups) + Semaphore (live SMS)

> **Supersedes the old Railway target (2026-11-06).** The backend now runs on a **Hostinger Cloud VPS**, not Railway. CI/CD is not part of this stack — the "semaphore" here is the **SMS provider** (`semaphore.co`, a Philippine gateway, `SMS_DRIVER=semaphore` in `config/sms.php`), not the Semaphore CI/CD platform. Frontend stays on Vercel; the database is Supabase (Postgres only — it does not run PHP); files and the daily DB dump go to Cloudflare R2.
>
> Never point your **local** dev at Supabase (the project is far from Davao — every request adds latency). Local dev keeps its MySQL `.env`; production VPS uses the Supabase Postgres `.env` (template: `sutura-server/.env.production.example`).

## What I verified on 2026-11-06 (the pre-defense sweep)

| Proof | How | Result |
|---|---|---|
| Frontend builds for Vercel | `npm run build` in `sutura-client` | **PASS** — clean production build, full route table, no `useSearchParams`/Suspense or other build errors |
| Client type-check | `npx tsc --noEmit` | **PASS** — exit 0, zero errors |
| Server suite | `php artisan test` (in-memory SQLite) | **PASS** — 260 / 0, 1218 assertions |
| R2 durable storage | `PUT`/`GET`/`DELETE` round-trip on the `s3` disk → bucket `sutura-test` | **PASS** — write, read-back, and cleanup all confirmed. This is the target the daily `app:backup-database` off-server dump and every `UPLOAD_DISK=s3` upload reach |
| Postgres (Supabase substrate) | `migrate:fresh` + `db:seed` + full suite against a live Postgres engine | **PASS** — run 2026-11-06 against a local Postgres 16: all 236 migrations + the 444-row snapshot seed + the **full 260-test suite (1218 assertions)** all green. This surfaced and fixed a real bug: `DataSnapshot::import()` (used by `db:seed`) failed on Postgres because it inserts in manifest order with FK checks still enforced (Postgres has no `FOREIGN_KEY_CHECKS=0`). Now fixed (see "Postgres snapshot-import fix" below) and re-verified on both Postgres and MySQL. A fully-seeded Postgres DB `sutura_pg_proof` is left on the local engine for click-through |
| Functional API click-through on Postgres | `sutura-smoke.sh` against the seeded `sutura_pg_proof` via a Postgres-pointed `php artisan serve` | **PASS** — 5-role login (admin/owner/manager/staff/customer all 200), Postgres-specific public discovery (`?open_now`, distance sort, `?min_rating`, `?q=`), admin health/branches, owner store/jobs/analytics/receipts, manager + staff views, customer `/my-orders`, **and the DSD-02 customer-booking gate**: `POST /catalog/thread-needle/book` → **201**, wrote `appointments.id=12` + `appointment_items.id=5` to Postgres, and the owner's `GET /stores/1/appointments` then returned that new appointment (gate holds both directions). Note: this is an API-level functional pass, **not** the visual browser pass in `BROWSER-PASS-CHECKLIST.md` — the rendered Vercel pages still need a real browser + the team's hosted creds |
| Frontend boots & serves (production build) | `next build` with `NEXT_PUBLIC_API_URL` → the Postgres smoke API, then `next start`, curl every key route | **PASS (re-verified 2026-11-07)** — the production build serves `/`, `/search`, `/shops`, `/track`, `/login`, `/register`, `/store/1`, `/store/1/book`, `/dashboard`, and the dynamic data route `/track/HIST6VEM` (a real Postgres tracking code) all **HTTP 200 with real HTML shells** (no error markers); the baked-in API URL `127.0.0.1:8090` is confirmed in the served client chunk, so the app is wired to the Postgres API. This proves the app **boots and serves** — it is still not the *visual* in-browser data pass (hydration / rendered pages) |

## 0. Supabase dry run against a throwaway project (do this first, ~15 min)

1. Create a free Supabase project. Region: nearest to the VPS / your location.
2. In a scratch env (never your committed `.env`), set:
   ```
   DB_CONNECTION=pgsql
   DB_HOST=<Session pooler host from Supabase → Connect>   # e.g. aws-0-ap-southeast-1.pooler.supabase.com
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres.<project-ref>
   DB_PASSWORD=<database password>
   DB_SSLMODE=require
   ```
   Use the **session** pooler (5432). The transaction pooler (6543) breaks Laravel's prepared statements.
3. One-liner proof. Two ways to get a Postgres engine:
   - **Docker** (portable, isolated):
     ```
     docker run -d --name sutura-pg -e POSTGRES_DB=postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB2=sutura -e POSTGRES_USER2=sutura -e POSTGRES_PASSWORD2=sutura -p 5433:5432 postgres:16-alpine
     ```
   - **Local Homebrew Postgres 16** (already running on this dev box as user `joshuawaymanarabejo` at `127.0.0.1:5432` — the sweep used this, no Docker).
   Then migrate + seed into a **throwaway** database (never your dev `sutura`):
   ```
   psql -h 127.0.0.1 -U joshuawaymanarabejo -d postgres -c "CREATE DATABASE sutura_pg_proof;"
   cd sutura-server && DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=5432 DB_DATABASE=sutura_pg_proof DB_USERNAME=joshuawaymanarabejo DB_PASSWORD= \
   php artisan migrate:fresh --seed --force
   ```
4. Full suite on Postgres (no separate `phpunit.pg.xml` needed — `phpunit.xml` pins `DB_*` without `force=`, so shell env wins):
   ```
   DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_PORT=5432 DB_DATABASE=sutura_pg_tests DB_USERNAME=joshuawaymanarabejo DB_PASSWORD= \
   php artisan test   # → 260 / 0, 1218 assertions (RefreshDatabase migrates the pg DB per class)
   ```
   `pg_dump`-style: install `postgresql-client` on the VPS so `app:backup-database` can dump.
5. Click through against it: login as each role, booking, jobs, payments, **Find a shop → "Open now"**, **near me / distance**, **rating filter**, **Catalog → sort by distance / top sales**.

## 1. Hostinger Cloud VPS (Laravel API)

Root-access VPS. Install PHP (8.3 for Laravel 11/12), Composer, nginx + php-fpm, `postgresql-client`, git, node (only if you build the client here — you don't; Vercel does).

- Check out `sutura-server` at `$SUTURA_HOME` (e.g. `/home/deploy/sutura-server` or `/var/www/sutura-server`).
- `.env` = `sutura-server/.env.production.example` with your real secrets filled (Supabase DSN, R2 `AWS_*`, SMTP, Semaphore SMS). `APP_ENV=production`, `APP_DEBUG=false`.
- Deploy:
  ```
  composer install --no-dev --optimize-autoloader
  php artisan config:cache && php artisan route:cache && php artisan view:cache
  php artisan migrate --force          # run on schema changes; skip on a no-op redeploy
  php artisan storage:link
  ```
- **nginx → php-fpm** document root = `$SUTURA_HOME/public` (never the repo root). Enable `Content-Disposition` to be sent (it's already in `config/cors.php`).
- **Scheduler (cron, fires the 9 `app:*` commands incl. the daily R2 backup):**
  ```
  * * * * * cd $SUTURA_HOME && php artisan schedule:run >> /var/log/sutura-scheduler.log 2>&1
  ```
  `app:backup-database` runs daily via that scheduler and uploads the dump to `BACKUP_DISK` (set to `s3` = R2 so it survives a VPS rebuild) and prunes older dumps by `backup.retention_days`.
- **Queue:** the app is designed around `QUEUE_CONNECTION=sync` (notifications fire in-request). Keep it that way and the cron above is enough. If you switch to `database` queue, add a supervised worker: `php artisan queue:work --tries=3 --timeout=120` under a process manager.

### 1b. Text messages (Semaphore)

- **Test mode** (default, safe): `SMS_DRIVER=log` — nothing is delivered; outbox rows are marked `is_test`.
- **Live delivery:** `SMS_DRIVER=semaphore` + `SEMAPHORE_API_KEY` (+ optional `SEMAPHORE_SENDER_NAME`, and `SMS_DAILY_CAP`). The `semaphore` driver calls `https://api.semaphore.co/api/v4/messages`.
- Out of production, a real driver only texts numbers on `SMS_TEST_ALLOWLIST` — set it to your own numbers while verifying; never put real customer numbers in a test DB.

### 1c. Files & durable backups (R2)

- Set the R2 `AWS_*` variables (see `.env.production.example`) and: `UPLOAD_DISK=s3` (public photos/receipts, needs a public bucket + `AWS_URL`), `PRIVATE_DISK=s3_private` (shop docs, subscription receipts — a private bucket), `BACKUP_DISK=s3` (or `s3_private`) for the daily dump.
- **Security:** the R2 keys currently sitting in the dev `.env` are a full Cloudflare API token. On production use a **scoped R2 API token** (r2-object-read-write on the specific bucket), not a full account key, and rotate the one in the repo/dev.

## 2. Vercel (Next.js)

Project from the `sutura-client` repo. One variable: `NEXT_PUBLIC_API_URL=https://<hostinger-vps-url>/api/v1` (drives `lib/axios.ts`, `lib/media.ts`, `lib/adminApi.ts`). Also `CORS_ALLOWED_ORIGINS` on the VPS must include the Vercel origin (it's derived from `FRONTEND_URL`). Commit `package-lock.json` so Vercel builds the exact versions tested. `vercel.json` is optional (framework auto-detects Next.js).

## 3. Day before the defense

- Supabase free projects pause after ~7 days idle — re-open it.
- Log in once as each role (admin, owner, manager, staff, customer) on the **hosted** site.
- Check VPS logs for errors; open the tracking page with a real tracking code (order numbers no longer work there by design).
- Confirm the R2 `backups/` key list has a fresh dump; confirm one live SMS lands on your allow-listed number.

## What was checked for Postgres (code review + a live run on 2026-11-06)

- Migrations are driver-guarded where they use MySQL `MODIFY COLUMN … ENUM`; the rest use the schema builder. No MySQL-only syntax in the recent migrations (`after()` is ignored on Postgres).
- **Snapshot-import fix (found by the live run, 2026-11-06):** `DataSnapshot::import()` (what `db:seed` / `migrate:fresh --seed` use) used to insert tables in manifest (alphabetical) order with `Schema::disableForeignKeyConstraints()` around it. That switch is a **no-op on Postgres** (it has no `FOREIGN_KEY_CHECKS=0`), and the alphabetical order puts children before parents (`appointment_items` sorts before `appointments`; `job_orders` and `measurements` are a bidirectional FK cycle), so Postgres rejected the inserts. Fixed in `sutura-server/app/Support/DataSnapshot.php`: (1) `importOrder()` inserts in FK-dependency order (parents first) for every driver; (2) on Postgres it now **drops all public FK constraints before the load and re-adds them after** (round-trips all 125), which also lets the cycle load; (3) the sequence bump is guarded to integer serial PKs only (a UUID PK such as `notifications` has no sequence and `max(uuid)` doesn't exist on Postgres). Re-verified: `db:seed` loads the same 444 rows on both Postgres and MySQL, and the FK set is intact afterward.
- Fixed for Postgres earlier: "Open now" filter used MySQL-only JSON syntax (`->>'$.…'`); rating/distance filters used a select alias in `HAVING`; distance/top-sales sort used an alias in `ORDER BY`; the distance formula could `ACOS()` a value just over 1 (clamped now). User-typed search/filter uses `LOWER(...) LIKE` (portable; plain `LIKE` is not).
- URL/path columns that store cloud-storage URLs are `TEXT`, not `varchar(255)` (Postgres rejects over-length writes).
- All other raw SQL is standard (`LOWER() LIKE`, `COALESCE`, `SUM(CASE …)`, grouped `GROUP BY`).
