# API security audit — 2026-10-01

Checked against the ten API-security mistake categories (Frontend, Access Control, Business Logic Abuse, External APIs, SSRF, Sensitive Data, Input Validation, Rate Limiting, API Inventory, Configuration), on the real code and a real database — not by reading alone.

**How it was tested.** A throwaway database with three shops (`migrate:fresh --seed` + `AdditionalStoresSeeder`), then live requests: every shop route that takes a second id was called with *shop 1's owner token* against *shop 2/3's ids* (IDOR sweep, 53 routes); customer-vs-customer, customer→shop/admin, owner→admin and anonymous calls; staff trying to change money fields; abusive payment/discount values; public responses scanned for sensitive fields. Then the regression suites (Phase 2–5, staff) were re-run on the dev DB: all pass.

## Result per category

| Category | Verdict | Detail |
|---|---|---|
| **Access control** | Solid | `CheckRole` checks the role **and** that the account belongs to the `{store}` in the URL. IDOR sweep: **0 of 53** nested routes returned another shop's data (the one 422 was validation before the controller's own 403, re-tested with a valid body → 403). Customers get 404 on other customers' orders, appointments, tickets, notifications and payments. Customers/owners are 403 on admin routes; anonymous is 401. |
| **Business logic abuse** | Solid | Staff `PUT /jobs/{id}` with `balance`, `payment_status`, `total_amount`, `discount_amount` changes nothing. Negative/zero/over-balance payments and discounts are refused. Balance above total refused on create. Payment/deposit gates, one-active-booking, appointment state machine all enforced server-side. |
| **SSRF** | **Fixed** | `GoogleMapsLinkResolver` allow-listed the first host but then **followed redirects to any host** (google.com has open redirects). Now: https only, no credentials/ports, redirects followed by hand and every hop must be an allowed Google host. It is the only outbound fetch in the app. |
| **External APIs** | OK | Only Google Maps (above). No other third-party calls from the server. |
| **Sensitive data** | **Fixed (3)** | (1) Public storefront returned the owner's **login email** and admin bookkeeping (`approved_by`, `rejection_reason`, `admin_hidden_reason`, `deleted_at`) — removed. (2) **`/track/ORD-0001` worked**: the sequential order number was accepted as a tracking code, so anyone could walk through other customers' orders (amount, balance, photos). Now only the random tracking code; new codes have 6 random characters (≈1 billion) instead of 4 (≈1 million). (3) `/public/users/{id}` listed the name/photo of **any** account by counting ids; now only reviewers and shop owners. Login/`me` responses carry no password hash or token; wrong password and unknown email give the same message. |
| **Input validation** | **Fixed (2)** | No `$guarded = []`; raw SQL is bound or server-derived; uploads validated by type + size and stored under random names; registration can only create `customer`. Gaps closed: shop `social_links` and job `reference_link` accepted `javascript:` links (rendered as `<a href>` publicly) → new `App\Rules\SafeLink` (http/https only); the client also passes user-supplied hrefs through `safeHref()` as a second layer. |
| **Rate limiting** | **Fixed** | Login, register, forgot/reset password, booking, tracking and store applications were already throttled. Added: 300/min per account on every signed-in route, and tight per-account limits (12–20/min) on uploads (including the two **anonymous** upload endpoints), payment proofs, support tickets, password change and the maps resolver. |
| **API inventory** | Clean | 218 API routes; 30 are unauthenticated and every one is intentional (login/register, public storefront reads, booking, tracking, public uploads). Removed a dead duplicate (`GET /stores/{store}/catalog` was registered twice; the later public one always won). |
| **Configuration** | **Fixed (4)** | Sanctum tokens **never expired** → now 7 days (`SANCTUM_TOKEN_EXPIRATION`). Added `config/cors.php` (production: only `FRONTEND_URL`; local: any origin so LAN phone testing works). Changing your password now signs out every *other* session. The demo seeders (accounts with password `password`, admin included) are **skipped when `APP_ENV=production`**. `.env`/`.env.local` are git-ignored; no secret in `NEXT_PUBLIC_*`. |
| **Frontend** | OK | No `dangerouslySetInnerHTML`/`eval`; the session token lives in `sessionStorage` (per tab); links open with `rel="noopener noreferrer"`; `?return=` redirects are restricted to `/dashboard/` paths. |

## Before going live (checklist)

1. `APP_ENV=production`, `APP_DEBUG=false`, `FRONTEND_URL=<the real site>`, HTTPS only.
2. Do **not** run the demo seeders — the guard skips them in production, but create the real admin account deliberately and give it a strong password.
3. `php artisan config:cache && php artisan route:cache`.
4. Move uploads off the local public disk (planned Cloudflare R2). Receipts are served by unguessable random file names, but anyone holding the link can open it.
5. Run the two dependency fixes below on a machine with network access.

## Not fixed here (needs network, or a decision)

- **`next` 16.3.5 — critical advisory GHSA-vcvr-r3jv-pc5j** (RCE in `next/og` `ImageResponse`). The app does not use `next/og`/`ImageResponse`, so it is not reachable today, but update anyway: `npm audit fix`, restart `next dev`, check the app once. (Could not be run in the sandbox: remote package fetches are disabled.)
- **`league/commonmark` ≤ 2.10.1** (medium + high, DoS / raw-HTML filter). Pulled in by Laravel for mail templates only — it never renders user input. Run `composer update league/commonmark` once a patched release is installable.
- The staff notification bell can lag by up to 15 s (the list is cached for 15 s); cosmetic.
- Payment receipts are on the public disk (item 4 above).
