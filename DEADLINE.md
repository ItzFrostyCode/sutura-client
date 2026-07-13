# Deployment Plan — When & How to Switch Off XAMPP

## Deadline

**Thesis defense / deployment deadline: first week of October 2026.**

Concrete timeline based on that date:

| When | What |
|---|---|
| **Now → end of August 2026** | Keep building features on XAMPP/MySQL as normal. No deployment work needed. |
| **Anytime in that window (optional, low priority)** | Register free Supabase/Railway/Cloudflare accounts; do one test migration dry-run against a free Supabase project, just to catch any MySQL→Postgres surprises early while there's no pressure. |
| **~September 15, 2026** | Start the real switch: set up Railway + Supabase + Cloudflare R2 for real, apply the code changes below, test thoroughly. |
| **Late September 2026** | Final testing + rehearse the demo on the actual deployed version, not localhost. |
| **First week of October 2026** | Defense / deadline. |

## Current Status

**Local development stays exactly as-is.** Keep using XAMPP + MySQL for day-to-day feature work. No code changes are needed right now — this document just records the plan so the whole team (not just whoever read the chat) knows what's decided and what's still pending.

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

- `.env`: `DB_CONNECTION=mysql` → `pgsql`, point to Supabase host/credentials.
- **Test search/filter features after switching** — MySQL and Postgres handle case-sensitivity in `LIKE` queries slightly differently; customer/job/appointment search needs a re-check.
- Install `league/flysystem-aws-s3-v3` (not installed yet) and switch the 4 upload endpoints in `FileUploadController.php` from the local `'public'` disk to the already-configured `'s3'` disk, pointed at Cloudflare R2 credentials.
- Fix a latent bug found during review: `FileUploadController::store()` builds the returned URL as `config('app.url') . Storage::url($path)` — this only works for the local disk. Once on S3/R2, `Storage::url()` already returns a full absolute URL, so this needs to become just `Storage::url($path)` or it'll double-prefix and break image links.
- Create `config/cors.php` — doesn't exist yet. Not needed today since frontend and backend are on the same machine, but required the moment they're on separate domains (Vercel + Railway).
- **Nothing to change**: Auth (already Sanctum Bearer tokens, not cookie/session — cross-domain-friendly by default), Queue (`QUEUE_CONNECTION=sync`, no worker needed), Session (`SESSION_DRIVER=database`, survives container restarts).

## Costs (checked live, July 2026 — re-verify before committing money)

- **Railway**: Free plan $0 (with $1 usage credit) or Hobby $5/mo (with $5 usage credit, overage billed separately). Realistic estimate for this app's traffic: roughly **$5–8/month** if run 24/7.
- **Supabase**: has a free tier — **free projects pause after ~7 days of inactivity**, so remember to open/ping the project before defense day so it isn't asleep during the demo.
- **Cloudflare R2**: free up to 10GB storage, **no egress/bandwidth fees** (unlike AWS S3).
- **Vercel**: free tier covers the frontend.

## Do NOT transfer the XAMPP data

The current XAMPP/MySQL database only holds demo/seed data (from `LocalTestSeeder`) — there is no real customer data to preserve. It also can't be transferred directly even if we wanted to: MySQL and Postgres dump formats aren't compatible without a conversion tool.

Instead, once Supabase is set up: just run `php artisan migrate --seed` fresh against it. That regenerates the exact same demo dataset directly in Postgres — no export/import needed.
