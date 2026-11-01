# HANDOFF: shop signup, landing, Terms, map sheet, Discover (2026-11-02)

> Copy this whole file to Bongo. His AI can read it as-is.
> Branch in BOTH repos: `feat/shop-signup-trial` (client = `sutura-client`, server = `sutura-server`).
> Merge the SERVER PR first (the client calls the new endpoints), then the client PR.

## 0. What this is, in 6 lines
1. New shop-owner landing page `/for-shops` and a **14-day free trial** (Basic plan, no payment).
2. Shop owners now **sign up email-first**: email + Terms, password, confirmation link. The account only exists after the link is opened. Then sign in, then an onboarding wizard (`/onboarding`) submits the shop for admin review.
3. Admin approve issues **no `@sutura.shop` login** for owners who confirmed their own email.
4. New `/terms` and `/privacy` pages (drafts).
5. Auth screens (`/login`, `/register`, signup, onboarding) share one style; **email already registered stops the signup before the password**.
6. Customer Discover declutter and a new **map bottom sheet** (drag handle, Book Appointment + Directions, Directions mode with Drive/Bike/Walk).

## 1. After pulling (do these)
1. `php artisan migrate` (server). New table: `pending_owner_signups` (migration `2026_11_02_100000_create_pending_owner_signups_table`). `2026_10_29_120000_add_covers_and_sold_as_to_service_pricing` may also still be pending on your machine.
2. Server `.env`: `MAIL_MAILER=smtp` to really send the confirmation email (default is `log`: the link is then written to `storage/logs/laravel.log`). `FRONTEND_URL` = the real site URL; in production it MUST be `https://...` (the link is built from it; a warning is logged otherwise).
3. Restart `php artisan serve` and `next dev`. No `npm install` needed.
4. Do NOT run `php artisan db:seed` (it wipes data). Do not run `php artisan test` against the dev DB.

## 2. SERVER (`sutura-server`): all changes
New endpoints under `/api/v1` (all public unless noted):
- `POST /auth/check-email` body `{email}` -> `{success, data:{available:bool}}`. Throttle 15/min. Uses `App\Support\EmailAvailability::taken()` (same rule the signups enforce).
- `POST /owner-signups` body `{email, password, password_confirmation, accept_terms}`. Password rule = the site's `Password::defaults()` (8+, mixed case, number, symbol). Creates/updates a pending row, emails the link. 422 `errors.email` if the email is taken.
- `GET  /owner-signups/{pollToken}` -> `{status: pending|verified|expired, resend_in}` (the waiting page polls this every 3 s).
- `POST /owner-signups/{pollToken}/resend` (60 s cooldown; a new token, the old link stops working).
- `POST /owner-signups/verify` body `{token}`: creates the `users` row (role `store_owner`, `email_verified_at` set). Idempotent.
- `POST /owner/store-application` (auth + role `store_owner`): the signed-in owner submits shop, documents and plan. One shop per owner.

Changed behavior:
- `POST /auth/login`: if the email only has an UNCONFIRMED owner signup and the password matches the one chosen -> `403 {code:"email_unconfirmed", message:"Please confirm your email first..."}`. Wrong password still gets the generic message.
- `POST /store-applications` and the owner endpoint accept `billing_cycle="trial"` (Basic plan only; no `payment_method`, no `payment_receipt`; `quoted_price` 0).
- `GET /admin/store-applications/{store}` also returns `issues_login` (false when the owner has `email_verified_at`).
- `PUT /admin/store-applications/{store}/approve`: for a confirmed-email owner it issues NO login (`credentials: null`) and emails the normal approval notice. For a trial it creates the subscription `status="trial"`, `billing_cycle=null`, `ends_at`/`trial_ends_at` = now + 14 days (`StoreApplication::TRIAL_DAYS`). The existing `app:expire-subscriptions` command expires and hides it.
- BUG FIX: `Admin\StoreApplicationController` was missing `use App\Models\SubscriptionPlan;` (approving any application that had a plan returned 500).
- `StoreApplicationStatusNotification` and the confirmation link use `config('app.frontend_url')`, not `env()`.

Files (A = added, M = modified):
- A `app/Http/Controllers/Api/V1/OwnerSignupController.php`
- A `app/Http/Requests/Auth/OwnerStoreApplicationRequest.php`
- A `app/Models/PendingOwnerSignup.php`
- A `app/Notifications/ConfirmOwnerEmailNotification.php`
- A `app/Support/EmailAvailability.php`
- A `database/migrations/2026_11_02_100000_create_pending_owner_signups_table.php`
- M `app/Http/Controllers/Api/V1/Admin/StoreApplicationController.php`
- M `app/Http/Controllers/Api/V1/AuthController.php` (login message, `checkEmail`)
- M `app/Http/Controllers/Api/V1/StoreApplicationController.php` (`submit()`, `storeForOwner()`, trial)
- M `app/Http/Requests/Auth/StoreApplicationRequest.php` (`trial` cycle, conditional payment fields)
- M `app/Models/StoreApplication.php` (`TRIAL_DAYS`)
- M `app/Notifications/StoreApplicationStatusNotification.php`
- M `routes/api.php`

## 3. CLIENT (`sutura-client`): pages
New: `/for-shops`, `/signup/shop` (`?trial=1` or `?plan=<slug>&cycle=monthly|yearly`), `/signup/verify?token=`, `/onboarding`, `/terms` (`?for=owners|customers`), `/privacy`.
Changed: `/login` (Customer|Shop tabs keep the URL in step: `/login`, `/login?as=store`), `/register` (tabs, Terms checkbox, email check), `/forgot-password`, `/reset-password`, `/` (Discover), `/search` (map), `/register/store` (now only redirects to `/signup/shop`), `/dashboard` (an owner with no shop is sent to `/onboarding`), `/admin/applications/[id]` (approve modal).

## 4. CLIENT: files by feature
**Landing `/for-shops`** (`src/app/for-shops/page.tsx`, `src/components/for-shops/`): ShopsContainer, ShopsNav (logo goes to `/`), ShopsHero, OrderRecordMock, ShopsProduct, JobBoardMock, FeatureRows, SectionHead, ShopsCustomers, CustomerPhones, PhoneMock, ShopsSteps, ShopsPricing (live plans from `/public/subscription-plans`), PlanCard, useShopPlans, ShopsFaq, faqData, ShopsFooter, shopsLinks.

**Shop signup** (`src/app/signup/*`, `src/components/shop-auth/`): AuthShell, AccountTypeTabs, StitchSteps, SignupFlow, useOwnerSignup (poll, resend, survives refresh, email check), SignupEmailStep, SignupPasswordStep, SignupInboxStep, VerifiedView, VerifyEmailScreen (strips the token from the URL, `referrer: no-referrer`), TermsConsent, DisabledHint, IntentChip, PasswordChecklist, WhatYouNeed, ForShopsLink. Libs: `src/lib/shopIntent.ts` (remembers trial/plan click, forgiving parser: `?trial=1?` works), `src/lib/checkEmail.ts` (fails open).

**Onboarding wizard** (`src/app/onboarding/page.tsx`, `src/components/onboarding/`): OnboardingWizard, OnboardingShell, IdentityStep, BusinessSteps, OnboardingSubmitted, VerificationNotice (amber "In progress": automatic ID/face check is NOT built). Reuses `store-application/*` steps; `useStoreApplication({signedInOwner:true})` posts to `/owner/store-application`; new `TrialChoice.tsx`; `PlanStep`, `ApplicationFields`, `ApplicationSubmitted` updated.

**Legal** (`src/app/terms`, `src/app/privacy`, `src/components/legal/`): one shared reader: LegalDocument, TermsDocument, PrivacyDocument, LegalShell, KeyPoints, AudiencePicker, LegalToolbar (search), LegalAccordion, LegalContents, useLegalReader, termsData, privacyData, legalTypes.

**Shared auth style** (`src/components/auth/`): NEW `authStyles.ts`; M LoginForm, LoginModal, LoginPortalSwitch, AuthBrand (compact on phones), ShopRouteGuard (allows `/onboarding`, `/terms`, `/privacy`); M pages login, register, forgot-password, reset-password (all auth cards: `sm:rounded-2xl`).

**Discover** (`src/app/page.tsx`, `src/components/home/`): D HomeMapCta; NEW HomeStepsStrip (compact "How it works", full version stays on `/about`), ListMapToggle ("Shops near you": List | Map), HomeShopOwnerCta (slim bar -> `/for-shops`); M HeroSearch (one design at every size: input, filters, magnifier-only Search button; placeholder `SEARCH_PLACEHOLDER = "What do you need?"`), SearchPill (same placeholder), HomeNearShops, HomeSectionHeader (wraps), HomeFooter.

**Map** (`src/components/search/map/`, `src/components/search/types.ts`, `src/lib/storeStatus.ts`, `src/components/store-storefront/header/StoreHeroHeader.tsx`):
- NEW SheetHandle + rewritten useBottomSheet: ONE bottom sheet, drag/tap handle between peek, half, full.
- ShopDetail header: name, rating, Open/Closed, distance, then **Book Appointment** (main) and **Directions** (outline); "View store" link; NEW ShopQuickInfo (address, hours, tappable phone). `hoursLine()` and `formatClock()` added to `lib/storeStatus.ts`; `RelatedStore` type got `phone`, branch `contact_number`, `operating_hours`.
- Directions mode: NEW RouteTopCard (back, Your location -> shop, Drive/Bike/Walk tabs with minutes) and RouteSummary ("8 min (2.3 km)", "Arrive 2:37 AM", **Start** = opens Google Maps with the matching travel mode). `useRouteTo` now returns a line per mode (`lines`), `useNavigation` has `mode`/`setMode`. D ActiveNavigationCard, MapTopCard, ShopDirectionsCard.
- MapControls: zoom +/- only on desktop; phone/tablet keep only "my location"; the brown X is gone.
- The embedded storefront (`?embed=1`) hides name, rating, the Book/rate/bookmark row, Open/Closed and the key-details row (the sheet carries them).

**Admin (small, your module):** `admin/applications/ApproveModal.tsx` (new `issuesLogin` prop: no login field and the button says "Approve" when the owner already has a login), `useApplicationDetail.ts` (reads `issues_login`), `app/admin/applications/[id]/page.tsx`, `ApplicationSummary.tsx` ("Free trial · 14 days", hides "Paid via" for trials).

**Docs:** `docs/STATUS.md` (a note per change), this file, formatting-only edits in `docs/ORDER-FLOW.md` and `HowToOpen.md`.

## 5. Rules and gotchas
- Two kinds of applicants exist now: old public form (admin issues a `@sutura.shop` login) and email-first owners (their own email is the login). The discriminator is `users.email_verified_at`.
- A trial application has no receipt and no payment method; the admin Documents list simply has no receipt tile.
- `GET /auth/check-email` tells anyone whether an email has an account (the old sign-up error already did), hence the strict throttle.
- Seed caveat: 14 of 17 customers in the dev DB (seeded demo accounts, e.g. `jose.rizal@gmail.com`) have `password_set_at = NULL`, so they count as unclaimed guest accounts and `/register` can claim them. Real sign-ups always set it.
- Start in Directions opens Google Maps for turn-by-turn; SUTURA only draws the route (routing.openstreetmap.de).
- Sign in with the right tab: customers on the Customer tab, shop owners/managers/staff on the Shop tab (`/login?as=store`).

## 6. How to test (about 5 minutes, on a phone-width window too)
1. `/for-shops` -> "Start free trial" -> `/signup/shop?trial=1` (chip says "Free trial · 14 days · Basic").
2. Type an email that already has an account (e.g. `maria.cruz@gmail.com`): Continue stays blocked with "This email is already registered".
3. Use a new email, tick the Terms, set a password (8+, upper/lower, number, symbol). "Check your inbox" appears.
4. Open the link (email, or `storage/logs/laravel.log`). A new tab says "Email verified"; the first tab flips to the same within seconds.
5. Before step 4 only: sign in with that email and password -> "Please confirm your email first".
6. Sign in at `/login?as=store` -> `/onboarding`: identity, shop, documents, choose Free trial, submit.
7. `/admin` -> the application -> "Approve" (no login field) -> sign in again as the owner: dashboard opens; subscription is a trial ending in 14 days.
8. Map on a phone: open `/search?tab=store`, tap a pin, drag the handle (peek/half/full), tap Directions, switch Drive/Bike/Walk, tap Back.
9. Discover (`/`): hero search looks the same at 320px and on a laptop; "Shops near you" has List | Map.

## 7. Not done / drafts
- Not checked in a browser by the AI; the server test suite was not run (it can wipe the dev DB). Server logic was verified with rolled-back scripts and curl against the real API; the client with `npx tsc --noEmit` (ESLint cannot run on TS 7).
- Terms/Privacy are DRAFTS adapted from another site; placeholders `[Company name]`, `[Business address]`, `[Contact email]` remain. "Payments are not refunded" and "courts of Davao City" need the team's confirmation.
- No Google sign-in. No automatic ID/face verification (amber notice only).
- SECURITY (not fixed): `GET /public/stores` returns private fields to anyone (`bank_account_number`, `gcash_number`, `bank_name`, `sms_mode`, `rejection_reason`, `admin_hidden_reason`, `owner_id`, `approved_by`...). It should be limited to public fields. Check what the client really needs first.
- Rate and bookmark buttons of a shop are no longer in the map sheet (still on the full store page).
- Other notifications still read `env('FRONTEND_URL')` directly.

## 8. Commits (all on `feat/shop-signup-trial`)
- server: `082a693` signup, owner application, trial, login message; then check-email + EmailAvailability.
- client: `0bd7af9` landing, signup, onboarding, Terms, auth styles; `41cc4bd` docs formatting; then Discover, auth polish, map sheet and Directions, handoff.
