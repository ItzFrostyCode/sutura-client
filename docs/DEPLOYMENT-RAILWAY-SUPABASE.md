# Go-live checklist — Vercel (frontend) + Railway (Laravel) + Supabase (Postgres) + Cloudflare R2 (files)

Follows `DEADLINE.md`. **Supabase is only the database** (and could also hold files); it does not run PHP, so the Laravel API runs on Railway. Frontend on Vercel. Never point your *local* dev at Supabase (the project is in Sydney — every request is 3–5 s from Davao).

> Status 2026-10-01: the code was reviewed for Postgres compatibility (see "What was checked") but **not yet run against a real Postgres** — that needs a Supabase project, which could not be created from the development sandbox. Do step 0 before the real deployment.

## 0. Dry run on a throwaway Supabase project (do this first, ~15 min)

1. Create a free Supabase project (any name). Region: pick the closest to your Railway region.
2. In `sutura-server/.env` temporarily set (or export for one command):
   ```
   DB_CONNECTION=pgsql
   DB_HOST=<Session pooler host from Supabase → Connect>   # e.g. aws-0-ap-southeast-1.pooler.supabase.com
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres.<project-ref>
   DB_PASSWORD=<database password>
   DB_SSLMODE=require
   ```
   Use the **session** pooler (port 5432). The transaction pooler (6543) breaks Laravel's prepared statements unless extra settings are added.
3. `MAIL_MAILER=log php artisan migrate:fresh --seed --force` (this also needs `ALLOW_DEMO_SEED=true` if `APP_ENV=production`). Expect it to be slow from Davao — that is only latency.
4. Open the app against it and click through: login, booking, jobs, payments, **Find a shop → "Open now"**, **near me / distance**, **rating filter**, **Catalog → sort by distance / top sales**.
5. Send me any error text and I will fix it.

## 1. Railway (Laravel API)

Service from the `sutura-server` repo. Region: Asia-Pacific (Singapore). Variables:

| Variable | Value |
|---|---|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `php artisan key:generate --show` (keep it secret and **stable**) |
| `APP_URL` | the Railway URL, `https://…` |
| `FRONTEND_URL` | the Vercel URL, `https://…` (also drives CORS and reset-password links) |
| `DB_CONNECTION` `DB_HOST` `DB_PORT` `DB_DATABASE` `DB_USERNAME` `DB_PASSWORD` `DB_SSLMODE` | as in step 0 |
| `SANCTUM_TOKEN_EXPIRATION` | optional, minutes (default 10080 = 7 days) |
| `MAIL_*` | real SMTP credentials (otherwise reset-password and approval emails fail) |
| R2 / S3 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION=auto`, `AWS_BUCKET`, `AWS_ENDPOINT`, `AWS_USE_PATH_STYLE_ENDPOINT=true`, `AWS_URL` — and switch `UPLOAD_DISK` to `s3` (see `DEADLINE.md`) |

Deploy/release commands: `composer install --no-dev --optimize-autoloader`, then `php artisan migrate --force`, then `php artisan config:cache && php artisan route:cache`.

**Demo data for the defense.** In production `php artisan db:seed --force` creates roles and subscription plans only. To load the demo shop (accounts in `docs/TEST-ACCOUNTS.md`, all with password `password`) set `ALLOW_DEMO_SEED=true` for that single run, then remove it. Change the admin password afterwards and do not leave demo accounts on a real, public system.

### 1b. Scheduler, backups and text messages (Railway)

- **Scheduler.** The daily jobs (database backup, subscription expiry, reminders, overdue alerts) only run if something calls `php artisan schedule:run` every minute. On Railway add a second service from the same repo with the start command `php artisan schedule:work`.
- **Backups.** `app:backup-database` needs `pg_dump` (install `postgresql-client` in the image) and an off-server disk: set `BACKUP_DISK=s3` plus the R2 `AWS_*` variables. Without it the dump stays on the container's disk and disappears on every redeploy.
- **Text messages.** Leave `SMS_DRIVER=log` (test mode: nothing is delivered) until you have a provider account. To send for real: `SMS_DRIVER=semaphore`, `SEMAPHORE_API_KEY`, optionally `SEMAPHORE_SENDER_NAME`, and `SMS_DAILY_CAP`. Outside production a real driver only texts numbers on `SMS_TEST_ALLOWLIST` — set it to your own numbers while testing. Never put real customers' numbers in a test database.
- **Receipts.** Uploaded files are served from the `public` disk; when you switch uploads to R2 (`UPLOAD_DISK`), the Statements export reads them from the `s3` disk automatically.

## 2. Vercel (Next.js)

Project from the `sutura-client` repo. One variable: `NEXT_PUBLIC_API_URL=https://<railway-url>/api/v1`. Commit `package-lock.json` so Vercel builds the same versions you tested.

## 3. Day before the defense

- Open the Supabase project (free projects pause after about 7 days idle).
- Log in once as each role (admin, owner, manager, staff, customer) on the **hosted** site.
- Check the Railway logs for errors; check the tracking page with a real tracking code (order numbers no longer work there by design).

## What was checked (code review, no live Postgres yet)

- Migrations are driver-guarded where they use MySQL `MODIFY COLUMN … ENUM`; the rest use the schema builder.
- Fixed for Postgres on 2026-10-01: the "Open now" filter used MySQL-only JSON syntax (`->>'$.…'`); the rating and distance filters used a select alias inside `HAVING` (Postgres rejects that); sorting by distance / top sales used an alias inside an `ORDER BY` expression; the distance formula could hit `ACOS()` of a value just over 1 (an error on Postgres) — it is now clamped. The same change fixed a **MySQL** 500 on *Catalog → near me*.
- All other raw SQL is standard (`LOWER() LIKE`, `COALESCE`, `SUM(CASE …)`, `GROUP BY` with only grouped/aggregated columns).
- Compiled SQL for both MySQL and Postgres was inspected for the JSON-path filter; the discovery endpoints return identical results to before on MySQL.
