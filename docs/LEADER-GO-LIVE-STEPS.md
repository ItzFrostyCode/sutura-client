# Go-live steps — for the team leader

Plain, in order. Do not skip ahead: each step says **how to know it worked** and **what to do if it did not**.
Details and variable tables are in [`DEPLOYMENT-RAILWAY-SUPABASE.md`](DEPLOYMENT-RAILWAY-SUPABASE.md); account logins are in [`TEST-ACCOUNTS.md`](TEST-ACCOUNTS.md).

**What goes where**

| Part | Service | Cost note |
|---|---|---|
| Website (Next.js) | **Vercel** | free tier |
| API (Laravel / PHP) | **Railway** (Supabase cannot run PHP) | about ₱300–450 / month |
| Database | **Supabase** (Postgres) | free tier — *pauses after about 7 days of no use* |
| Photos, receipts, documents, backups | **Cloudflare R2** | free up to 10 GB |

Who does what: **the leader** creates the accounts and pastes the settings; **Joshua** fixes any code error that shows up.

---

## Step 0 — Before touching any hosting (Joshua, ~30 min)

1. `git pull` both repos on `main`. Run the app locally (`HowToOpen.md`).
2. Click through the new screens once, logged in as `maria.cruz@gmail.com`: **Payments → Statements**, **Text Messages**, **Payments → Payment Methods**, a service's **Requirements** box; as `juan.delacruz@sutura.com` (staff): **Home**, **Create Job** on an appointment; as `jose.rizal@gmail.com`: **Pay for this order**.
3. Check at phone width (320–599 px) — these screens have only been type-checked, not seen in a browser yet.

**Done when:** nothing looks broken. Report anything odd to Joshua *before* going on.

---

## Step 1 — Cloudflare R2: a place for files (leader, ~15 min)

Railway forgets every uploaded file when it redeploys, so files must live outside it.

1. Create a Cloudflare account → **R2** → create **two buckets**: `sutura-uploads` (turn on public access / a public domain) and `sutura-private` (leave **private**).
2. Create one R2 **API token** with read + write on both buckets. Write down: Access Key ID, Secret, and the **S3 endpoint** (`https://<account-id>.r2.cloudflarestorage.com`).

**Done when:** you have the key, the secret, the endpoint and the public URL of `sutura-uploads`.
**If it fails:** nothing is deployed yet, so nothing is lost — ask Joshua.

---

## Step 2 — Supabase: the database (leader, ~15 min) — and a dry run

1. Create a Supabase project. Pick the region closest to your Railway region. Save the **database password**.
2. In *Connect*, copy the **Session pooler** details (host, port **5432**, user `postgres.<ref>`, database `postgres`). Use the session pooler, not the transaction one.
3. **Dry run from a laptop** (slow from Davao — that is only distance, not a problem): in `sutura-server/.env` put the Supabase values (`DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT=5432`, `DB_DATABASE=postgres`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SSLMODE=require`) and run:
   ```
   MAIL_MAILER=log php artisan migrate:fresh --seed --force
   ```
   Then start the app and click: **Find a shop → "Open now"**, **near me / distance**, **rating filter**, **Catalog → sort by distance / top sales**, login as owner, book an appointment.
4. **Put `.env` back to local MySQL afterwards.** Never develop against Supabase (3–5 s per request).

**Done when:** the migrate finishes with no error and the clicks above work.
**If it fails:** copy the exact error text to Joshua. The code was reviewed for Postgres but **never run on a real Postgres yet** — this step is exactly where a surprise would show up, which is why it is done on a throwaway project first.

---

## Step 3 — Railway: the API (leader, ~30 min)

1. New project → **Deploy from GitHub** → `sutura-server`, branch `main`.
2. Add the variables (full list in `DEPLOYMENT-RAILWAY-SUPABASE.md` §1):
   - `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` (run `php artisan key:generate --show` locally and paste it), `APP_URL` = the Railway URL.
   - `FRONTEND_URL` — leave a placeholder for now; set the real Vercel URL in Step 4.
   - Database: the Supabase values from Step 2.
   - Files: `UPLOAD_DISK=s3`, `PRIVATE_DISK=s3_private`, `BACKUP_DISK=s3_private`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION=auto`, `AWS_ENDPOINT`, `AWS_USE_PATH_STYLE_ENDPOINT=true`, `AWS_BUCKET=sutura-uploads`, `AWS_URL` (public domain), `AWS_PRIVATE_BUCKET=sutura-private`.
   - Email (confirmations, password reset, shop approval): real `MAIL_*` SMTP settings.
   - Text messages: leave `SMS_DRIVER=log` (**test mode — nothing is delivered**).
3. Deploy command: `php artisan migrate --force`. Health check path: `/up`.
4. **Second service** from the same repo, start command `php artisan schedule:work` — this runs the daily jobs (subscription expiry, reminders, the 24-hour backup). Without it none of them run.
5. One-time demo data: add `ALLOW_DEMO_SEED=true`, open the Railway shell, run `php artisan db:seed --force`, then **remove `ALLOW_DEMO_SEED`**.

**Done when:** `https://<railway-url>/up` answers OK and `https://<railway-url>/api/v1/public/stores` returns the demo shop.
**If it fails:** open the Railway *deploy logs* and send the last 30 lines to Joshua.

---

## Step 4 — Vercel: the website (leader, ~10 min)

1. Import `sutura-client` from GitHub, branch `main`. Framework: Next.js.
2. One variable: `NEXT_PUBLIC_API_URL=https://<railway-url>/api/v1`. Deploy.
3. Copy the Vercel URL → go back to Railway → set `FRONTEND_URL` to it → redeploy the API. (This is what allows the website to talk to the API.)

**Done when:** the Vercel site opens the landing page *with shops listed*.
**If it fails:** shops missing or "network error" almost always means `NEXT_PUBLIC_API_URL` has a typo or `FRONTEND_URL` was not updated.

---

## Step 5 — Check everything on the *live* site (leader + Joshua, ~30 min)

Use the accounts in `TEST-ACCOUNTS.md` (password `password`).

| As | Do this | You should see |
|---|---|---|
| Customer `jose.rizal@gmail.com` | open **My Orders → ORD-0002** | the stages, the balance, **Pay for this order** |
| Customer | **upload a photo / payment proof** | it shows; **redeploy Railway; it is still there** (proves R2 works) |
| Owner `maria.cruz@gmail.com` | **Payments → Statements** → *All time* → *All receipts (ZIP)* | a ZIP with receipt images + `statement.csv` |
| Owner | **Text Messages** | drafts, a "Test mode" banner |
| Staff `juan.delacruz@sutura.com` | **Home**, then **Create Job** on a confirmed appointment | numbers + queue; the form has no discount/downpayment |
| Admin `admin@sutura.com` at `/admin/login` | open a shop application and its documents | the documents open (proves the private bucket works) |
| Admin `admin@sutura.com` | **Branch locations** → open the pin of the waiting branch → **Verify** | the owner's branch loses its "Awaiting location check" note and appears in search |
| Anyone | tracking page with a real tracking code | the order status |
| Railway shell | `php artisan app:backup-database` | a new file in the `sutura-private` bucket under `backups/` |

**If a step fails:** note the page, what you clicked, and the error → Joshua.

---

## Step 6 — The week of the defense

- [ ] Open the Supabase project every few days (free projects sleep after about 7 days idle). Open it the day before the demo.
- [ ] Open **Admin → Branch locations** and verify every real branch (a new or moved branch stays off the map until you do; approving a shop verifies its main branch automatically).
- [ ] Change the admin password. Make sure `ALLOW_DEMO_SEED` is **not** set.
- [ ] Log in once as each role on the live site.
- [ ] **Security updates** (on a branch, not the day before): `npm audit fix` in `sutura-client` (Next.js has an advisory in a feature we do not use) and `composer update league/commonmark` in `sutura-server` when a patched version is installable. Re-run Step 5 afterwards.
- [ ] Real text messages are **optional**: they need an SMS provider account. Without it the system shows every text as "sent (test)". To try one for real: `SMS_DRIVER=semaphore`, `SEMAPHORE_API_KEY`, and put **only your own number** in `SMS_TEST_ALLOWLIST`.

---

## If something goes wrong

| Symptom | Likely cause |
|---|---|
| Website loads but no shops | `NEXT_PUBLIC_API_URL` wrong, or `FRONTEND_URL` not set on Railway |
| Logging in fails with a network/CORS error | `FRONTEND_URL` does not exactly match the Vercel URL (no trailing slash) |
| Photos disappear after a deploy | `UPLOAD_DISK` is not `s3` / the R2 variables are wrong |
| Admin cannot open shop documents | `PRIVATE_DISK` / `AWS_PRIVATE_BUCKET` missing |
| No emails | `MAIL_*` not set (the app still works; confirmations stay in-app only) |
| Backup command says `pg_dump failed` | the Railway image needs the `postgresql-client` package — ask Joshua |
| Reminders / expiry / backups never run | the second Railway service (`schedule:work`) is not running |
| Everything slow | Railway and Supabase are in different regions |
| Statements ZIP says "Premium" | the demo shop is on the Pro plan — switch it to Premium in *Billing* |

Roll back: in Railway/Vercel, redeploy the previous deployment. The database is not changed by a redeploy.
