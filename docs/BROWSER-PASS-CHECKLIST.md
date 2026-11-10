# Browser-pass checklist (pre-defense sweep, 2026-11-06)

Everything listed in the build log as "Not browser-checked" collapses into this one pass. The server is green (tests + a clean Vercel build), so this is purely the visual/interaction check a human does in a real browser.

## Setup
- `cd sutura-server && npm install --no-audit --no-fund && composer install && php artisan serve` (API on 8000).
- `cd sutura-client && npm run dev` (on 3000). Seed the demo accounts if needed (`LocalTestSeeder`; `password` for all demo logins — see `docs/TEST-ACCOUNTS.md`).
- DevTools device bar at **320 / 375** (phone), **768 / 1024** (tablet), **1440** (desktop). Screenshot at 320 and 768 for the record.

## Accounts to test (from `LocalTestSeeder`)
- **admin** — Bongo (`miguel.manager` is branch manager; admin is the system admin demo account)
- **store_owner** — Juan del Cruz's owner shop owner demo
- **branch_manager** — `miguel.manager@sutura.com`
- **staff** — `juan.delacruz@sutura.com` (must stay plain staff)
- **customer** — `booking.tester1@sutura.com` / `booking.tester2@sutura.com` (no-appointment customers)

## Pass items (each = log in as the role, hit the screen at the width, confirm no clipping / wrong data / dead button)
- [ ] **Dashboard theme (espresso)** — 1440: KPI band, Action Queue, Today's Agenda, Charts. 375: shop switcher + bell + account not pushed off-screen.
- [ ] **Appointments** list (table 768+, cards 320/375), detail stepper, calendar (`PhoneCalendar` 320/375, `MonthBoard` 768+), KPI 2×2 on phone, filter capsules 1/3.
- [ ] **Booking wizard** (customer) — Details → Schedule → Review at 320/375; calendar + Notes counter; single-service rule (a second need is a second appointment).
- [ ] **Customer Sizing step** (team list cards on phone, table on desktop) + the customer online order form steps 2 & 4.
- [ ] **Jobs board (P1–P7)** — 1440 and 375; per-column one button; stage switch keeps scroll position.
- [ ] **Payments / Receipts / Statements** — `DeckReceiptViewer` buttons fit at 320; Statements export (Premium); Job Balances "unpaid only" tab.
- [ ] **Catalog + Services editor** — grid list, step-by-step create, detail `EditableBox` pencil; branch manager is read-only (staff sees read-only).
- [ ] **Search / Map / Directions** (public) — 320/375/768: bottom sheet grab handle, shop header, Book/Directions, route tab switch; desktop map buttons (zoom only).
- [ ] **`/for-shops` landing** + **`/signup/shop` → `/signup/verify` → `/onboarding`** funnel at 320/768/1440; terms reader.
- [ ] **Admin portal** (`/admin/*`) — branches queue verify/reject, subscription plans, tickets, system-health.
- [ ] **SMS review** (`/dashboard/sms`) — test-mode banner, drafts, allow-list send.
- [ ] **Public tracker** (`/track/[code]`) with a real tracking code — no order numbers work by design.

## Sign-off
Tick each box. Anything that clips, shows the wrong role's data, or 403s on a rendered button = a real defect to fix before the mock defense. Keep the 320/768 screenshots in the defense folder.
