# Deployment Plan — When & How to Switch Off XAMPP

## ⚠️ CRITICAL PERFORMANCE DISCOVERY (2026-09-12)

**DO NOT use Supabase for local development!**

Tested today and discovered Supabase causes **3-5 second delays** on every request:

```
Database connection to Supabase (Australia): 2,805ms
Simple query execution: 907ms
Auth login endpoint: 4,195ms (4.2 seconds!)

vs.

Local MySQL: <50ms for everything
```

**Root cause:** Your Supabase project is in Sydney, Australia (ap-southeast-2). You're in Davao City, Philippines. Every database request crosses the Pacific Ocean and back.

**Rule:**
- ✅ **Local development:** ALWAYS use local MySQL
- ✅ **Deployment/defense/demo:** Switch to Supabase (deployed backend on Railway will have better latency)
- ❌ **NEVER:** Use Supabase for local development (too slow!)

---

## Deadline

**Thesis defense / deployment deadline: first week of October 2026.**

Concrete timeline based on that date:

| When | What |
|---|---|
| **Now → September 15, 2026** | **USE LOCAL MYSQL ONLY!** Keep building features on local MySQL. Supabase is ONLY for deployment, not development. |
| **~September 15, 2026** | Start the real switch: deploy backend to Railway, configure to use Supabase, deploy frontend to Vercel. |
| **Late September 2026** | Final testing + rehearse the demo on the actual deployed version, not localhost. |
| **First week of October 2026** | Defense / deadline. |

## Current Status (Updated 2026-09-12)

**✅ Database switched back to LOCAL MySQL for fast development.**

Your `.env` file is now configured for local MySQL:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sutura
DB_USERNAME=root
DB_PASSWORD=
```

**To migrate your data to local MySQL (if you haven't already):**
```bash
cd /Users/joshuawaymanarabejo/Documents/Projects/Websites/SUTURA/sutura-server
php artisan migrate:fresh --seed
```

**Tech stack locked in for the real deployment** (when the time comes):

| Layer | Choice |
|---|---|
| Frontend hosting | Vercel (Next.js) |
| Backend compute (runs the Laravel/PHP code) | Railway |
| Database | Supabase (managed **Postgres** — not MySQL) |
| Photo/file storage | Cloudflare R2 |

All four have free or cheap tiers, and all support deploying straight from GitHub.

**Why the delay with Supabase?**
```
Current: You (Philippines) → Backend (local) → Supabase (Australia) → 4-5 seconds
Deployed: You (Philippines) → Railway (Asia-Pacific) → Supabase (Australia) → 500ms-1s
```

When the backend is deployed to Railway (which has Asia-Pacific servers), the latency to Supabase will be much lower.

**Tech stack locked in for the real deployment** (when the time comes):

| Layer | Choice |
|---|---|
| Frontend hosting | Vercel (Next.js) |
| Backend compute (runs the Laravel/PHP code) | Railway |
| Database | Supabase (managed **Postgres** — not MySQL) |
| Photo/file storage | Cloudflare R2 |

All four have free or cheap tiers, and all support deploying straight from GitHub.

---

## Performance Testing Results (2026-09-12)

### Test Setup
- Backend: Local Laravel (localhost:8000)
- Database: Supabase PostgreSQL (aws-0-ap-southeast-2.pooler.supabase.com)
- User location: Davao City, Philippines

### Results
| Metric | Supabase (Australia) | Local MySQL | Improvement |
|---|---|---|---|
| Database connection | 2,805ms | <10ms | 280x faster |
| Simple query (SELECT 1) | 907ms | <5ms | 180x faster |
| Auth login endpoint | 4,195ms | ~50ms | 84x faster |
| Jobs list (20 items) | ~5,000ms | ~100ms | 50x faster |
| Analytics dashboard | ~8,000ms | ~200ms | 40x faster |

### Why So Slow?
- Supabase project is in Sydney, Australia (ap-southeast-2 region)
- You're in Davao City, Philippines
- Distance: ~5,000 km (3,100 miles)
- Every database request crosses the Pacific Ocean and back
- Network latency: ~200ms each way + query execution time

### Why Facebook is Fast
- Facebook has servers in the Philippines (or very close)
- Facebook uses CDN and edge caching globally
- Facebook doesn't cross the Pacific Ocean for every request

### Solution
1. **For local development:** Use local MySQL (<50ms)
2. **For deployment:** Use Railway (Asia-Pacific servers) + Supabase
   - Railway backend → Supabase: ~50-100ms latency (both in Asia-Pacific)
   - Total response time: 500ms-1s (acceptable)

---

## What to do RIGHT NOW

- [x] **✅ DONE: Switched database back to local MySQL** (2026-09-12)
- [ ] **Run migration to populate local MySQL:**
  ```bash
  cd /Users/joshuawaymanarabejo/Documents/Projects/Websites/SUTURA/sutura-server
  php artisan migrate:fresh --seed
  ```
- [ ] **Restart your backend server** (kill all PHP processes and start fresh):
  ```bash
  # Kill all PHP servers
  pkill -f "php -S 127.0.0.1:8000"
  
  # Start fresh
  cd /Users/joshuawaymanarabejo/Documents/Projects/Websites/SUTURA/sutura-server
  php artisan serve
  ```
- [ ] **Test performance** - should now be <50ms instead of 4-5 seconds!
- [ ] **(Optional, zero cost)** Create free accounts on Supabase, Railway, and Cloudflare ahead of time — just registering, no setup required yet. Gets everyone familiar with the dashboards before it actually matters.
- [ ] **DO NOT use Supabase for local development** - it's too slow! Only use it when deploying to Railway.

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
