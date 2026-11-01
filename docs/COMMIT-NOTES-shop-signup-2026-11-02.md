# Commit notes: shop landing, email-first signup, onboarding, Terms (2026-11-02)

Copy-paste file for Bongo. It lists everything added or changed in this round, in both repos,
with commit messages ready to paste. Plain text on purpose.

Repos: `sutura-client` (Next.js) and `sutura-server` (Laravel). Both are on branch
`feat/ordering-discover-support-combined`. Nothing is committed yet.
Suggested: commit to a new branch in each repo (main is PR-only), push, open one PR per repo.

```bash
git -C sutura-server checkout -b feat/shop-signup-trial
git -C sutura-client checkout -b feat/shop-signup-trial
```

---

## 1. What this round does (short)

1. New public page `/for-shops`: overview/landing page for shop owners (hero, product, customer view,
   how it starts, pricing from the live plans, FAQ, dark espresso footer).
2. New 14-day FREE TRIAL on the Basic plan (no payment, no receipt). Starts when the admin approves the shop.
3. Shop owners now sign up EMAIL FIRST: email + agree to Terms, password, then a confirmation link.
   No account exists until the link is opened. The waiting tab updates by itself.
4. After the first sign-in an owner with no shop goes to `/onboarding` (3-step application wizard:
   identity, business verification with documents and plan/trial, submitted for review).
5. Admin approval no longer issues a `@sutura.shop` login for owners who signed up with their own email.
6. New `/terms` and `/privacy` pages (one shared reader: key points, "who is reading" picker, search, sections).
7. Auth screens unified: `/login`, `/register`, `/signup/shop`, `/signup/verify`, `/onboarding` share one style.
8. Fixes found on the way (see section 6).

---

## 2. After pulling: what Bongo must do

1. Pull both repos.
2. Run the new migration (additive, creates one table):
   `php artisan migrate`
   - New: `2026_11_02_100000_create_pending_owner_signups_table`
   - Also still pending on some machines: `2026_10_29_120000_add_covers_and_sold_as_to_service_pricing`
   - Do NOT run `php artisan db:seed` (it wipes data) and do not run `php artisan test` on the dev DB.
3. `.env` (server):
   - `MAIL_MAILER=smtp` to really send the confirmation email (it is `log` by default, then the link is written to
     `storage/logs/laravel.log`).
   - `FRONTEND_URL` must be the real site URL. In production it MUST start with `https://`
     (the confirmation link is built from it; the server logs a warning if it is not https).
4. Restart `php artisan serve` and `next dev`. No `npm install` needed (no new packages).

---

## 3. Pages (client) and API endpoints (server)

### New pages (client)

- `/for-shops` shop-owner landing page
- `/signup/shop` email-first shop signup (accepts `?trial=1` or `?plan=<slug>&cycle=monthly|yearly`)
- `/signup/verify?token=...` page the emailed button opens (creates the account)
- `/onboarding` application wizard for a signed-in owner without a shop
- `/terms` (accepts `?for=owners` or `?for=customers`) and `/privacy`

### Changed pages (client)

- `/login` (Customer | Shop tabs now keep the URL in step: `/login` and `/login?as=store`)
- `/register` (Customer | Shop tabs, Terms checkbox, 16px inputs, autocomplete)
- `/register/store` now just redirects to `/signup/shop` (query kept)
- `/` (Discover) has a new last section "Run a tailoring shop in Davao City?" linking to `/for-shops`
- `/dashboard` sends an owner with no shop to `/onboarding`
- `/admin/applications/[id]` approve modal (see section 5)

### New API endpoints (server), all under `/api/v1`

- `POST /owner-signups` body: email, password, password_confirmation, accept_terms. Stores a pending signup and emails the link.
- `GET  /owner-signups/{pollToken}` returns status `pending|verified|expired` and `resend_in`.
- `POST /owner-signups/{pollToken}/resend` 60-second cooldown, sends a fresh link (old link stops working).
- `POST /owner-signups/verify` body: token. Creates the `users` row (role `store_owner`, `email_verified_at` set).
- `POST /owner/store-application` (auth + role store_owner) submits the shop for the signed-in owner. One shop per owner.

### Changed API behavior

- `POST /auth/login`: if the email has an unconfirmed owner signup and the password matches the one chosen,
  returns `403 { code: "email_unconfirmed", message: "Please confirm your email first..." }`.
  Wrong password still gets the generic "Incorrect email or password."
- `POST /store-applications` and the new owner endpoint accept `billing_cycle = "trial"`
  (Basic plan only, no `payment_method`, no `payment_receipt`, `quoted_price` 0).
- `GET /admin/store-applications/{store}` now also returns `issues_login` (false when the owner has a confirmed email).
- `PUT /admin/store-applications/{store}/approve`: for owners with a confirmed email it issues NO shop login and
  returns `credentials: null`. For a trial it creates the subscription as `status = trial`, no billing cycle,
  `ends_at` and `trial_ends_at` = now + 14 days.

---

## 4. Files ADDED

### sutura-server

- `database/migrations/2026_11_02_100000_create_pending_owner_signups_table.php` table `pending_owner_signups`
- `app/Models/PendingOwnerSignup.php` (link lifetime 24 h, resend cooldown 60 s, terms version constant)
- `app/Http/Controllers/Api/V1/OwnerSignupController.php` signup, status, resend, verify
- `app/Notifications/ConfirmOwnerEmailNotification.php` the "Confirm my email" mail (sent to an on-demand address)
- `app/Http/Requests/Auth/OwnerStoreApplicationRequest.php` same rules as the public application, minus `email`

### sutura-client: lib and styles

- `src/lib/shopIntent.ts` remembers what was clicked on the landing page (trial / plan / cycle); forgiving parser
  (`?trial=1?` still counts)
- `src/components/auth/authStyles.ts` the one set of form/button classes for all auth screens

### sutura-client: landing (`src/app/for-shops/page.tsx` and `src/components/for-shops/`)

- `ShopsContainer.tsx` one width/margin for header and all sections
- `ShopsNav.tsx`, `ShopsHero.tsx`, `OrderRecordMock.tsx`, `ShopsProduct.tsx`, `JobBoardMock.tsx`,
  `FeatureRows.tsx`, `SectionHead.tsx`, `ShopsCustomers.tsx`, `CustomerPhones.tsx`, `PhoneMock.tsx`,
  `ShopsSteps.tsx`, `ShopsPricing.tsx`, `PlanCard.tsx`, `useShopPlans.ts` (reads `/public/subscription-plans`),
  `ShopsFaq.tsx`, `faqData.ts`, `ShopsFooter.tsx`, `shopsLinks.ts`
- `src/components/home/HomeShopOwnerCta.tsx` the new last section on Discover

### sutura-client: signup (`src/app/signup/shop/page.tsx`, `src/app/signup/verify/page.tsx`, `src/components/shop-auth/`)

- `AuthShell.tsx` shared card frame, `AccountTypeTabs.tsx` Customer | Shop switch, `StitchSteps.tsx` stitch progress line
- `SignupFlow.tsx`, `useOwnerSignup.ts` (polling, resend countdown, survives a refresh)
- `SignupEmailStep.tsx`, `SignupPasswordStep.tsx`, `SignupInboxStep.tsx`, `VerifiedView.tsx`, `VerifyEmailScreen.tsx`
- `TermsConsent.tsx`, `DisabledHint.tsx`, `IntentChip.tsx`, `PasswordChecklist.tsx`, `WhatYouNeed.tsx`

### sutura-client: onboarding (`src/app/onboarding/page.tsx`, `src/components/onboarding/`)

- `OnboardingWizard.tsx`, `OnboardingShell.tsx`, `IdentityStep.tsx`, `BusinessSteps.tsx`,
  `OnboardingSubmitted.tsx`, `VerificationNotice.tsx` (amber "In progress" notice: automatic ID/face check not built)
- `src/components/store-application/TrialChoice.tsx` Free trial | Choose a plan switch inside the plan step

### sutura-client: legal (`src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, `src/components/legal/`)

- `LegalDocument.tsx` (shared reader), `TermsDocument.tsx`, `PrivacyDocument.tsx`, `LegalShell.tsx`,
  `KeyPoints.tsx`, `AudiencePicker.tsx`, `LegalToolbar.tsx`, `LegalAccordion.tsx`, `LegalContents.tsx`,
  `useLegalReader.ts`, `legalTypes.ts`, `termsData.ts`, `privacyData.ts`

### sutura-client: docs

- `docs/COMMIT-NOTES-shop-signup-2026-11-02.md` (this file)

---

## 5. Files CHANGED

### sutura-server

- `routes/api.php` adds the four `/owner-signups` routes (public, throttled) and `POST /owner/store-application`
- `app/Http/Controllers/Api/V1/StoreApplicationController.php` `store()` and new `storeForOwner()` share one
  `submit()`; `createApplication()` can use an existing owner; trial handling (Basic only, no receipt)
- `app/Http/Requests/Auth/StoreApplicationRequest.php` `billing_cycle` accepts `trial`; payment method and receipt are
  `required_unless` trial
- `app/Models/StoreApplication.php` constant `TRIAL_DAYS = 14`
- `app/Http/Controllers/Api/V1/Admin/StoreApplicationController.php`
  - approve: no login issued when `email_verified_at` is set; trial subscription; `issues_login` in `show()`
  - FIX: added the missing `use App\Models\SubscriptionPlan;` (approving any application with a plan returned 500)
- `app/Http/Controllers/Api/V1/AuthController.php` login returns `email_unconfirmed` for an unconfirmed signup
- `app/Notifications/StoreApplicationStatusNotification.php` uses `config('app.frontend_url')` instead of `env()`

### sutura-client

- Auth: `components/auth/LoginForm.tsx` (shared styles, `onPortalChange`, Shop CTA to `/signup/shop`, new owner with no shop
  goes to `/onboarding`), `LoginPortalSwitch.tsx` (rounded, sentence case), `AuthBrand.tsx` (compact on phones, `tagline` prop),
  `ShopRouteGuard.tsx` (allows `/onboarding`, `/terms`, `/privacy` for signed-in shop accounts)
- Pages: `app/login/page.tsx` (tabs update the URL), `app/register/page.tsx` (tabs, consent, 16px inputs, autocomplete,
  `role="alert"`), `app/register/store/page.tsx` (now a redirect), `app/page.tsx` (adds the shop-owner section),
  `app/dashboard/layout.tsx` (owner without a shop goes to `/onboarding`)
- Application steps: `store-application/useStoreApplication.ts` (`signedInOwner` mode posts to `/owner/store-application`,
  trial, reads the saved intent), `PlanStep.tsx` (Free trial option), `ApplicationFields.tsx` (shared styles),
  `ApplicationSubmitted.tsx` (wording no longer mentions a payment receipt)
- Admin (Bongo's module, small): `admin/applications/ApproveModal.tsx` (new `issuesLogin` prop: no login field and
  button says "Approve" when the owner already has a login), `useApplicationDetail.ts` (reads `issues_login`),
  `app/admin/applications/[id]/page.tsx` (passes it), `ApplicationSummary.tsx` (shows "Free trial · 14 days", hides
  "Paid via" for trials)
- Home: `components/home/HomeFooter.tsx` ("Open a shop" link goes to `/for-shops`)
- Docs: `docs/STATUS.md` (notes for all of the above)

---

## 6. Fixes made on the way

- Admin approve returned 500 for any application that had a plan (missing `SubscriptionPlan` import). Fixed.
- `/register` inputs were 15px (iOS Safari zoomed in); now 16px. Password fields had no `autocomplete`; added.
- Email links and the approval email no longer depend on `env()` (null when config is cached).
- Sign-in before confirming the email used to say "Incorrect email or password"; now says to confirm the email first.

---

## 7. Behavior Bongo should know (admin side)

- Two kinds of applicants now exist:
  - Old public form (`POST /store-applications`): admin issues a `@sutura.shop` login on approve (unchanged).
  - New email-first owners: they already have their own login (their email). Approve issues nothing and just emails them.
- A trial application has no receipt and no payment method. The Documents list simply has no "Payment receipt" tile.
- When a trial ends, the existing `app:expire-subscriptions` command expires it and hides the shop (unchanged command).
- A new owner can sign in before approval and sees the existing "application pending" screen in the dashboard.

---

## 8. How to test (by hand)

1. Open `/for-shops`, click "Start free trial" (lands on `/signup/shop?trial=1`, chip shows "Free trial").
2. Enter an email, tick the Terms box, Continue. Set a password (8+ chars, upper and lower case, a number, a symbol). Create Account.
3. "Check your inbox" appears. Open the link from the email (or from `storage/logs/laravel.log` when `MAIL_MAILER=log`).
   A new tab shows "Email verified"; the first tab flips to "Email verified" within a few seconds.
4. Sign in at `/login?as=store` with that email. You land on `/onboarding`. Fill identity, shop, documents, choose Free trial. Submit.
5. In `/admin`, open the application. The approve button says "Approve" (no login field). Approve it.
6. Sign in again as the owner. The dashboard opens; the subscription shows a trial ending in 14 days.
7. Try signing in between steps 3 and 4 with the password chosen: you get "Please confirm your email first".

---

## 9. Not done / drafts (be honest in review)

- Not checked in a browser by the AI, and the server test suite was not run. Server changes were checked with a
  rolled-back script against the real API (signup, status, verify, login, owner application, trial approve).
- Terms and Privacy text are DRAFTS adapted from another site. Placeholders left on purpose:
  `[Company name]`, `[Business address]`, `[Contact email]`. The "payments are not refunded" and
  "courts of Davao City" lines need the team's confirmation.
- No Google sign-in or sign-up (removed from the UI, no OAuth set up).
- Automatic ID and face verification is not built. The wizard shows an amber "In progress" notice and the SUTURA team
  checks documents by hand.
- ESLint cannot run (typescript-eslint does not support TS 7); `npx tsc --noEmit` passes.
- Other notifications still read `env('FRONTEND_URL')` directly (not changed in this round).

---

## 10. Do NOT include in this commit (already modified before this round, not part of this work)

- `HowToOpen.md`
- `docs/ORDER-FLOW.md`
- `.deep-copilot/` (untracked folder)

Stage the files by name, not with `git add -A`.

---

## 11. Ready-to-paste commit messages

### sutura-server
```text
feat(auth): email-first shop owner signup, owner store application and 14-day free trial

- Add pending_owner_signups table, PendingOwnerSignup model and OwnerSignupController:
  POST /owner-signups, GET /owner-signups/{pollToken}, POST /owner-signups/{pollToken}/resend,
  POST /owner-signups/verify. The users row is created only when the emailed link is opened.
- Add ConfirmOwnerEmailNotification (24 h link, 60 s resend cooldown); the link is built from
  config('app.frontend_url') and a warning is logged if it is not https in production.
- Add POST /owner/store-application (role store_owner) for a signed-in owner; OwnerStoreApplicationRequest
  drops the email field. StoreApplicationController::submit() is shared with the public form.
- Free trial: billing_cycle "trial" (Basic plan only, no payment method or receipt, price 0).
  Approving creates a subscription with status "trial", no cycle, ends_at/trial_ends_at = +14 days.
- Admin approve: no @sutura.shop login is issued for owners with a confirmed email; show() returns issues_login.
- Login returns 403 email_unconfirmed when the email has an unconfirmed signup and the password matches.
- Fix: Admin\StoreApplicationController was missing the SubscriptionPlan import (approve returned 500).
- StoreApplicationStatusNotification uses config('app.frontend_url') instead of env().

Run: php artisan migrate (adds pending_owner_signups). Set MAIL_MAILER=smtp to send real emails.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

### sutura-client
```text
feat(shop): /for-shops landing, email-first signup, onboarding wizard, Terms and unified auth styles

- Add /for-shops (hero, product, customer view, steps, live pricing, FAQ, dark footer) and a
  "Run a tailoring shop" section at the bottom of Discover.
- Add /signup/shop (email + Terms, password, check inbox), /signup/verify, and /onboarding
  (identity, business verification with documents and plan or free trial, submitted for review).
  The waiting tab polls and updates by itself once the link is opened.
- Free trial option in the plan step; the landing page choice is remembered (shopIntent) and shown as a chip.
- Add /terms and /privacy with a shared reader (key points, audience picker, search, sections, contents).
- Unify auth styles (authStyles.ts) across /login, /register, /signup/shop and the application steps;
  Customer | Shop tabs on /login (keeps the URL in step) and /register; 16px inputs, autocomplete, role="alert",
  Terms checkbox, disabled-button hints, compact brand block on phones.
- /register/store redirects to /signup/shop; owners without a shop are sent to /onboarding;
  ShopRouteGuard allows /onboarding, /terms and /privacy.
- Admin approve modal: no shop-login field when the owner already has a login (issues_login).
- docs: STATUS.md and COMMIT-NOTES-shop-signup-2026-11-02.md.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

---

## 12. Ready-to-paste PR descriptions

### sutura-server PR
```text
## What
Email-first shop owner signup, an owner-side store application, and a 14-day free trial (Basic).

## Run after merging
php artisan migrate   (new table: pending_owner_signups)
.env: MAIL_MAILER=smtp, FRONTEND_URL=https://<site> in production

## Notes for the admin module
- Approve issues no shop login for owners who confirmed their own email (credentials: null).
- Trial applications have no receipt or payment method.
- Also fixes a 500 on approve (missing SubscriptionPlan import).

Not covered: the server test suite was not run; checked with a rolled-back script against the real API.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### sutura-client PR
```text
## What
/for-shops landing, email-first signup (/signup/shop, /signup/verify), /onboarding wizard,
/terms and /privacy, free-trial option, and one shared style for all auth screens.

## Check by hand
Follow "How to test" in docs/COMMIT-NOTES-shop-signup-2026-11-02.md (7 steps, about 5 minutes).

## Notes
- Terms/Privacy text is a draft with placeholders ([Company name], [Business address], [Contact email]).
- No Google sign-in. ID/face verification is not built (amber "In progress" notice).
- Needs the sutura-server PR (new endpoints and migration).
- `npx tsc --noEmit` passes; ESLint cannot run on TS 7.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
