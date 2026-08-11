# Deployment Plan — When & How to Switch Off XAMPP

## Deadline

**Thesis defense / deployment deadline: first week of October 2026.**

Concrete timeline based on that date:

| When | What |
|---|---|
| **Now → end of August 2026** | Keep building features on local MySQL as normal. No deployment work needed. |
| **Anytime in that window (optional, low priority)** | Register free Supabase/Railway/Cloudflare accounts; do one test migration dry-run against a free Supabase project, just to catch any MySQL→Postgres surprises early while there's no pressure. **Already done once, 2026-07-23** — see "Dry run already completed" below. |
| **~September 15, 2026** | Start the real switch: set up Railway + Supabase + Cloudflare R2 for real, apply the code changes below, test thoroughly. |
| **Late September 2026** | Final testing + rehearse the demo on the actual deployed version, not localhost. |
| **First week of October 2026** | Defense / deadline. |

## Current Status

**Local development stays exactly as-is.** Keep using local MySQL for day-to-day feature work — note this is now a **real local MySQL 8.4 install (Homebrew), not XAMPP** (switched since this doc was first written, matches the thesis paper's own "MySQL" tech stack line more literally). No code changes are needed right now — this document just records the plan so the whole team (not just whoever read the chat) knows what's decided and what's still pending.

**Tech stack locked in for the real deployment** (when the time comes):

| Layer | Choice |
|---|---|
| Frontend hosting | Vercel (Next.js) |
| Backend compute (runs the Laravel/PHP code) | Railway |
| Database | Supabase (managed **Postgres** — not MySQL) |
| Photo/file storage | Cloudflare R2 |

All four have free or cheap tiers, and all support deploying straight from GitHub.

---

## What to do RIGHT NOW

- [ ] Nothing urgent. Keep building and testing features locally on XAMPP/MySQL as usual.
- [ ] **(Optional, zero cost)** Create free accounts on Supabase, Railway, and Cloudflare ahead of time — just registering, no setup required yet. Gets everyone familiar with the dashboards before it actually matters.
- [ ] **(Optional, recommended)** Do **one low-stakes test migration** now, while there's no deadline pressure: spin up a free Supabase project and run `php artisan migrate:fresh --seed` against it once, just to see if anything breaks. This catches MySQL→Postgres surprises (see "Known risks" below) early instead of two weeks before the defense.

---

## When to actually switch (any ONE of these is the trigger)

1. **2–3 weeks before the thesis defense/demo date** — enough buffer to fix anything that comes up.
2. **When the app needs to be reachable by someone outside your own machine** — panelists, the adviser, or groupmates who need to see the same live data (XAMPP is localhost-only, nobody else can open it).
3. **When core features are done and stable** — safer to switch database engines once things aren't changing daily.

Do **not** switch earlier than necessary — every day spent on MySQL/XAMPP is a day without deployment-specific bugs to chase.

---

## What the switch actually involves (already scoped — ask for a redo of this if it's stale)

**Dry run already completed (2026-07-23)** against a disposable Supabase + R2 project — most of this list is done already, not just scoped:

- `.env`: `DB_CONNECTION=mysql` → `pgsql`, point to Supabase host/credentials. **Not yet applied to the real dev config** — the dry run used a throwaway test project, deliberately deferred to the real September switch.
- **Search/filter case-sensitivity — already found and fixed, not just a risk to test for.** `CatalogController::index()`'s search used to silently return zero results on Postgres for any non-exact-case term (verified: `"gown"` found 0 of 10 real matches on MySQL vs Postgres). Fixed with `whereRaw('LOWER(name) LIKE ?', ...)`. Same pattern now used for any new user-typed search field.
- `league/flysystem-aws-s3-v3` — **installed**, not pending.
- The `FileUploadController::store()` double-prefixed-URL bug — **already fixed**, and generalized: both `FileUploadController` and `ProfileController` now use a single `private const UPLOAD_DISK = 'public'` constant referenced by both the `store()` and `Storage::disk(...)->url()` calls, instead of a bare `Storage::url($path)` call that silently resolves against the wrong disk. **Don't reintroduce a bare `Storage::url()` call or hardcode `'public'`/`'s3'` in a second place** — this exact bug shipped twice (once in each controller) from that drift.
- A related bug also found and fixed: `varchar(255)` columns storing image/file URLs are too narrow for real cloud storage URLs (domain + bucket + encoded filename routinely exceeds 255 chars) — Postgres rejects the write outright. Widened all of them (`shops.logo_path`, `catalog_images.image_url`, several others) to `TEXT`. **Any new URL/path column should be `TEXT` from the start.**
- Create `config/cors.php` — still doesn't exist. Not needed today since frontend and backend are on the same machine, but required the moment they're on separate domains (Vercel + Railway). Still the one real item on this list not yet done.
- **Nothing to change**: Auth (already Sanctum Bearer tokens, not cookie/session — cross-domain-friendly by default), Queue (`QUEUE_CONNECTION=sync`, no worker needed), Session (`SESSION_DRIVER=database`, survives container restarts).
- The actual disk switch (`UPLOAD_DISK` constant from `'public'` to `'s3'`, and pointing `.env`'s `DB_*` at the real production Supabase project) is still deliberately deferred to the real September migration — everything above was verified against disposable test infrastructure, not wired into the app's actual default config yet.

## Costs (checked live, July 2026 — re-verify before committing money)

- **Railway**: Free plan $0 (with $1 usage credit) or Hobby $5/mo (with $5 usage credit, overage billed separately). Realistic estimate for this app's traffic: roughly **$5–8/month** if run 24/7.
- **Supabase**: has a free tier — **free projects pause after ~7 days of inactivity**, so remember to open/ping the project before defense day so it isn't asleep during the demo.
- **Cloudflare R2**: free up to 10GB storage, **no egress/bandwidth fees** (unlike AWS S3).
- **Vercel**: free tier covers the frontend.

## Do NOT transfer the XAMPP data

The current XAMPP/MySQL database only holds demo/seed data (from `LocalTestSeeder`) — there is no real customer data to preserve. It also can't be transferred directly even if we wanted to: MySQL and Postgres dump formats aren't compatible without a conversion tool.

Instead, once Supabase is set up: just run `php artisan migrate --seed` fresh against it. That regenerates the exact same demo dataset directly in Postgres — no export/import needed.
