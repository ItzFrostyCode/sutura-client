# Customer Module Audit — 2026-11-17

**Scope:** every customer/guest-facing surface of `sutura-client` + `sutura-server` (Joshua's dev repos).
**Excluded (named, not reviewed):** ordering wizard, appointment/booking flow, staff `/dashboard/*`, admin `/admin/*`, billing, `/print/*`.
**Method:** three read-only code audits (pages+UX, hooks+API layer, backend). All `file:line` claims verified against code, not docs — per the code-beats-docs rule.

---

## 1. VERDICT

**"Very good?" — yes, with a punch list.** Architecture and backend are genuinely above average: shared-login storage is careful, rate-limit layering is real, tenant isolation holds, PII minimization on public endpoints is done. The customer *flows* (location gate, search/map, track, guest hub, account hub) are well-built and internally consistent.

The weak spots are concentrated in three places:

1. **One visibility bug on the backend:** pending/suspended/hidden shops stay reachable by slug on the store sub-routes (catalog, services, posts, reviews, payment-methods, booking-settings). Highest-priority fix.
2. **The 600px detail system (catalog/service detail + their ratings/report/photo/size-guide pages) has drifted from the project's own design system** — H1s at 14–24px, H2 at 12px/700, tap targets under 44px, arbitrary spacing (`px-[10px]`, `gap-[5px]`).
3. **Scale violations in your own §3 rules:** a 1,046-line mega-hook (`useStoreStorefront`) and ~16 other files over 150 lines; several pages with fetch logic inlined instead of hooks; silent `.catch(() => [])` turning network errors into "no results".

Fix the Critical list below and this module is demo-ready.

---

## 2. FRONTEND — PAGE INVENTORY (sutura-client/src/app)

### Public / discovery (guest-viewable)
| Route | Purpose |
|---|---|
| `/` | Discover landing: hero search + filters, track-code strip, categories, premium spotlight, near-shops, districts, how-it-works, shop CTA |
| `/search` | Unified Search+Map screen (`?tab=`, `?view=`, `?store=`; list/map switch, district chips, directions) |
| `/map` | "Choose on map" picker; other queries redirect to `/search` |
| `/location` | Saved-location manager: GPS, choose-on-map, home, recents |
| `/categories` | Garment/service categories: visual grid + A–Z directory + search box |
| `/shops` | All-shops directory: search, pagination, open-now, near-me |
| `/stores` | Legacy redirect → `/shops` |
| `/services` | Redirect → `/search?tab=services` (route-consolidation rule §3) |
| `/about` | About SUTURA + full "how it works" |
| `/ask` | "Ask SUTURA": tap-to-answer over live data; signed-in only, buttons-only by design |
| `/track` | Guest order tracking by code (thesis feature) |
| `/track/[code]` | Legacy deep-link shim → `/track?code=` |
| `/notifications` | Customer inbox: All/Unread, day groups, guest state; desktop sidebar ≥768px |
| `/profile/[id]` | Public customer profile stub (avatar + name + Report) — declared stub |
| `/terms`, `/privacy` | Legal docs with audience accordion |
| `/for-shops` | Shop-owner marketing + live pricing (free 14-day trial) |
| `/signup/shop` | Shop sign-up (email-verify-first) |
| `/signup/verify` | Email confirmation screen |
| `/onboarding` | Shop onboarding wizard (owner-side) |

### Auth
| Route | Purpose |
|---|---|
| `/login` | One login, all roles; portal switch, `?add=1` second account, `?redirect=` |
| `/register` | Customer sign-up (`?as=store_owner` → `/signup/shop`) |
| `/register/store` | Legacy → `/signup/shop` |
| `/forgot-password`, `/reset-password` | Token reset, shared sign-up rules |
| `/auth/google/callback` | Google exchange + safe redirect |

### Customer "Me" hub (signed-in customer)
| Route | Purpose |
|---|---|
| `/account` | Hub: guest version (rows → `/login`) or profile header + quick tiles; chevron drill-downs; desktop `AccountWebSidebar` |
| `/account/orders` | My Job Orders: status chips, linked-order groups |
| `/account/orders/[id]` | Order detail: 5-stage tracker, quotation approval, pay, claims, 15s live refresh |
| `/account/appointments`(+`/[id]`) | Appointment management (booking-adjacent — excluded from critique) |
| `/account/history` | Unified orders+appointments+measurements+shops |
| `/account/measurements` | Measurement sheets per order/profile, search |
| `/account/saved`, `/account/ratings`, `/account/recently-viewed` | Three near-identical 3-tab pages (Shops/Services/Designs) |
| `/account/settings` + `{account,notifications,support,support/new,support/[id],guide,location,become-store-owner}` | Settings hub + drill-downs; `location` redirects to `/location` |

### Public store pages
| Route | Purpose |
|---|---|
| `/store` | Redirect → `/shops` |
| `/store/[store_id]` | Unified storefront: hero + Services/About/Hours/Locations/Work/Reviews tabs + rating modal; owner view swaps in `StoreOwnerTopBar` + edit/delete modals |
| `/store/[store_id]/catalog` | Redirect → `?tab=catalog` |
| `/store/[store_id]/catalog/[item_id]` | Design detail (600px system, gallery, variants, quantity, Book CTA) |
| `.../catalog/[item_id]/{photo,ratings,report,size-guide}` | Full-screen photo viewer, View-All ratings, 2-step report, size guide |
| `.../service/[service_id]` (+`/ratings`) | Service detail mirroring the catalog system |
| `.../portfolio` (+`/[item_id]`) | Legacy redirects → catalog |

### Excluded (naming only)
`store/[id]/order` (4-step order wizard), `store/[id]/book` (3-step booking wizard), `store/[id]/request`, `store/[id]/repair-request`, `account/appointments/*`.

**Dead-link check:** every static href and template link in customer code resolves; legacy routes are deliberate redirect shims. One gap: `/account/history` is missing from the desktop sidebar's MID_LINKS (only reachable via the hub row).

## 3. FRONTEND — NAVIGATION GRAPH

- **Chrome (one persisted set, `RootLayout`):** `PublicBottomNav` — Discover · Map (via `lastSearchHref()`, remembers where you left off) · Track (guest `/track`, customer `/account/orders`, shop `/dashboard/jobs`) · Profile (with unread badge). 56px items, `aria-current`, safe-area. Hidden ≥1024px where `PublicNav` header takes over (44px icon actions).
- **Top bar (`MobileFrame` → `PublicTopBar`):** location strip (discover pages only), upcoming-appointment strip, brand row + bell + Log in. One mounted node across transitions.
- **Guest path:** `/` → LocationGate → hero search/filter sheet → `/search` → `StoreCard` → `/store/[slug]` → tab → detail → Book/Order (excluded) / Report / Ratings / Size guide. Bell/Profile → `/account` guest hub (every row → `/login?redirect=…`).
- **Customer path:** `/account` hub → chevron drill-downs (real-history back with in-app fallback); desktop sidebar; notification deep-links to orders/appointments.
- **Shop owner on public site:** `ShopRouteGuard` + `usesCustomerNavOn` strips customer nav on own store, shows `StoreOwnerTopBar`.

## 4. HOOKS / STORES / API LAYER INVENTORY (sutura-client/src)

### API layer (`lib/`)
| File | Purpose |
|---|---|
| `axios.ts` | Single instance; Bearer from `authToken()`; 401 late-guard (clears only if sent token still matches) + `/login?redirect=` on protected routes only |
| `authStorage.ts` | localStorage `sutura_auth` shared-login; `clearAuth(token)` token-gated; `migrateOldAuth()` |
| `savedAccounts.ts` | `sutura_accounts` (max 3) for account switcher; `forgetAllAccounts` logs each out server-side |
| `apiError.ts` | `getErrorMessage` — real Laravel 422 field message, not the generic |
| `checkEmail.ts` | `isEmailTaken()` → `/auth/check-email`, fail-open by design |
| `shopIntent.ts` | Persists /for-shops CTA intent across the email-verify tab hop |
| `customerLocation.ts` | localStorage fixes + history; `getBestPosition` (watch-based, early stop 30 m / 6 s window) |
| `geocoding.ts` | Photon → Nominatim → raw-coords cascade |
| `recentSearches.ts` / `lastSearch.ts` / `lastPage.ts` | Recent searches (cross-tab sync) / where Map re-opens / where Back leads |
| `storeStatus.ts` / `mapFocus.ts` / `leafletSafe.ts` / `media.ts` | Open-now, map fit, Leaflet guard, media URLs |
| `AuthHydrator.tsx` | Post-mount hydrate + `/auth/me` re-validate + storage-event cross-tab sync (same-token = in-place, different = reload) |

### Zustand stores
`useAuthStore` (the one browser login), `useRequestedItemsStore` (ordering — excluded), `useConfirmStore`, `useLoginModalStore`, `useAdminAuthStore` (out of scope).

### Feature hooks (customer-facing)
| Area | Hooks |
|---|---|
| Search/map | `useSearchData` (396), `useSearchResults` (173), `useSearchMap`, `useBottomSheet`, `useRouteTo`, `useNavigation`, `useLivePosition` (**dead — zero consumers**) |
| Directory | `useStoreDirectory` (107) |
| Guest track | `useTrackLookup` (70) |
| Claims | `useOrderClaims` (55) |
| Account hub | `useAccountHub` (91), `useAccountHistory`, `usePayForOrder` (59), `useAccountDetail`, `useLiveRefresh` (24) |
| Shop signup | `useOwnerSignup` (147), `VerifyEmailScreen` (inline POST), `useShopPlans` |
| Storefront | `useStoreStorefront` (**1,046 lines**), `useCatalogItemDetail` (320) |
| Home/landing | `useDiscoverData`, `useHomeLocation`, `useLocationGate`, `useCompassHeading` |
| Location pages | `useLocationPageState`, `useSavedLocation`, `useChooseLocation` (323), `useDirections`, `useLocationPickerState` |
| Nav/roles | `useTrackOrderLink`, `useAccountSwitch` (45), `useShopAccount`, `useShopRole`, `useGuestGatedHref` (**no-op vestige, imported by ~17 files**) |
| UI primitives | `useCloseOnDesktop`, `useMediaQuery`, `useMouseScroll`, `useScrollLock`, `useEmbedded`, `useCanGoBack` |
| Lib helpers | `garmentTaxonomy`, `fabricHelper`, `designPricing`, `formatTurnaround`, `types/publicCatalog` |

## 5. BACKEND ROUTES INVENTORY (sutura-server, all under v1)

**Public auth (throttled):** `/auth/register` (6/min), `/auth/check-email` (15), `/auth/login` (6, rejects admin/shop roles, pending-signup `Hash::check` gate), `/auth/forgot-password` + `/reset-password` (enumeration-safe, revokes other tokens), Google OAuth (stateless Socialite; 10-min state; `email_verified` gate; one-time 64-char exchange code, 2-min TTL), `/auth/admin/login` (5/min).

**Shop signup:** `POST /store-applications` (5/min; unusable random-password owner + pending store + private-disk docs), `GET /store-applications/status` (**no throttle — see M2**), `GET /public/subscription-plans`, `POST /owner-signups` (6/min, email-first), `POST /owner-signups/verify` (creates user+role at verify, claims shadow account), `GET /owner-signups/{pollToken}` (60/min), `POST …/resend` (6/min), `POST /owner/store-application` (role-gated, one-shop-per-owner, 14-day Basic-only trial).

**Guest tracking:** `GET /track/{trackingCode}` (20/min; 8-char unique `tracking_code`; returns stage + updated_on only — no money/staff fields).

**Public discovery/catalog:** `/public/stores` (Davao scope, taxonomy + open-now Asia/Manila + Haversine, paginated), `/public/catalog-items` + `/public/services` (paginate 48), `/public/stores/{store:slug}` (404 unless approved && !is_hidden; column-restricted owner load), sub-routes `/services`, `/payment-methods`, `/posts`, `/reviews`, `/catalog/{store:slug}` (+ item show, view POST), `/booking-settings`, `/appointments`, public receipt/reference-image upload (throttled), `/public/users/{id}` (id/name/picture only).

**Authed customer (all `auth:sanctum` + 300/min; money/claim/ticket writes on 12/min sensitive-writes):** `/auth/me`, `/auth/logout`, full notifications suite (15s file-cache; per-item read/unread/bulk/clear), saves + ratings + reports on catalog/services/stores (owner/staff self-review blocked; verified-customer rule), `/my-orders` (+detail, 404 on ownership mismatch), claims index/store/escalate/respond (row-lock, 3-day window, once-per-declined escalation, refunds hidden from plain staff), `/my-measurements` (mutates on GET — see M4), `my-catalog-reviews` / `my-store-reviews` / `my-service-reviews` / `my-saved-*` / `my-recently-viewed` / `/my-tickets` (+reply, re-opens resolved), profile personal/text-messages/password/availability/upload.

**Excluded (naming only):** `POST /stores/{slug}/{repair-requests|bulk-orders|made-to-order|order-requests|service-orders}`, `POST /my-orders/{id}/payments`, quotation approve/decision, `POST /catalog/{slug}/book`, `my-appointments` GET/DELETE/PUT-reschedule, all owner/staff jobs/appointments routes.

**Schema notes (migrations verified):** `users.google_id` unique; `stores.owner_id` (no `user_id`); `store_branches.verification_status` with `StoreBranch::live()`; `pending_owner_signups` token_hash/poll_token unique; `order_claims` refund fields + indexes `[store_id,status]`, `job_order_id`; `store_saves` unique `[store_id,user_id]`; `recently_viewed` unique per user+viewable; `job_orders.tracking_code` unique + backfilled 2026-08-11; slug route binding with numeric fallback (`Store::resolveRouteBinding`).

---

## 6. ISSUES (consolidated, ranked)

### CRITICAL — ALL 7 FIXED 2026-11-17 (uncommitted; see resolution block below the table)
| # | Layer | Issue | Location | Fix |
|---|---|---|---|---|
| C1 | Backend | **Store sub-routes skip the visibility gate** — only `publicProfile`/`publicIndex` check `approved && !is_hidden`; a pending/rejected/suspended/hidden shop's catalog, services, posts, reviews, payment-methods, booking-settings, item show + view POST stay reachable by slug | `sutura-server/routes/api.php:111–116, 633–646` + the five controllers | Add `where('status','approved')->where('is_hidden',false)` (or reuse the 404 gate) in each sub-route query |
| C2 | Frontend | **Undefined Tailwind token `bg-surface-sunken`** — spotlight prev/next + content panels render with no background (tokens are `surface`/`sunken`) | `sutura-client/src/components/home/HomeFeaturedSpotlight.tsx:170,197,333` | `bg-sunken` |
| C3 | Frontend | **Triple-nested `ToastProvider`** — root layout + `store/layout` + `account/layout` each mount one; two fixed toast stacks at different positions | `sutura-client/src/app/layout.tsx:44`, `app/store/layout.tsx:11`, `app/account/layout.tsx:84` | Drop the two layout-level providers |
| C4 | Frontend | **Catalog detail double fetch + double view-count POST** — effect depends on `user`, which hydrates post-mount, so every visit re-fires item fetch + `POST …/view` + `POST /recently-viewed` | `sutura-client/src/components/store-catalog-detail/hooks/useCatalogItemDetail.ts:82` (POSTs at :73, :75) | Fetch on `[storeId, itemId]`; move view POSTs to a guarded post-hydrate effect |
| C5 | Frontend | **"Featured" shops capped at 20** — landing fetches `per_page=20` then filters `is_featured` client-side; shops past row 20 never appear | `sutura-client/src/components/home/useDiscoverData.ts:30–31` | Flag-filtered endpoint or unfiltered featured list |
| C6 | Frontend | **Account counts capped at 100** — hub status counts + Customer History aggregate from `per_page=100` lists; drift silently at ~100+ records | `sutura-client/src/components/account/hub/useAccountHub.ts:19–27`, `app/account/orders/page.tsx:36`, `account/history/useAccountHistory.ts:33–34` | Server-side count fields / uncapped aggregation |
| C7 | Backend | **Unthrottled, unauthenticated `GET /store-applications/status`** leaks application existence, status, rejection_reason, login_email by email/store_id | `sutura-server/routes/api.php:96`, `StoreApplicationController.php:52–86` | Per-IP throttle bucket like the other public routes |

**Resolution (2026-11-17, fixed by Sonnet agents; not committed; leader repos untouched):**
- **C1** — new `Store::isPubliclyVisible()` (status=approved && !is_hidden), applied as the first line of all 8 public sub-route handlers (`CatalogController@index/show`, `CatalogInteractionController@incrementViews`, `ServiceController@publicIndex`, `PaymentMethodController@publicIndex`, `StorePostController@publicIndex`, `StoreReviewController@publicIndex`, `PublicBookingController@getSettings/getAppointments`) → 404, not 403; `publicProfile` refactored onto the same method; authenticated owner/staff endpoints unchanged.
- **C2** — `bg-surface-sunken` → `bg-sunken` (3 occurrences, HomeFeaturedSpotlight.tsx; only file using it).
- **C3** — nested `ToastProvider`s removed from `store/layout.tsx` + `account/layout.tsx`; root provider untouched (provider takes no config, so plain delete was safe). ⚠ A 4th nested provider at `dashboard/layout.tsx:434` has the same bug — outside this scope, still open.
- **C4** — `useCatalogItemDetail`: item fetch now `[storeId, itemId]` only; recently-viewed POST moved to a separate hydrated once-per-item effect; guest behavior (view POST yes, recently-viewed no) preserved.
- **C5** — `GET /public/stores?featured=1` added; server filters on **live Premium subscription** (`Store::scopeLivePremium()`, same value the response's `is_featured` reports) rather than the stale stored `is_featured` column. Frontend requests `per_page=8&featured=1` and auto-falls back to the old per_page=20+filter path when the running server ignores the flag.
- **C6** — `/my-orders` now returns top-level `total` + camelCase `status_counts` (`inProduction`/`readyForPickup`/`completed`, bucket definitions mirrored from the client's `orderPhases.ts` and computed independently of the capped list); `/my-appointments` + `/my-measurements` add top-level `total`. Frontend (hub tiles, orders filter badges, Customer History group titles) prefers the server numbers, falls back to capped-list derivation when absent — works against old and new servers.
- **C7** — `throttle:20,1,store-application-status` on `GET /store-applications/status`, matching sibling bucket style.

**Verification:** client `npx tsc --noEmit` clean (repo-wide ESLint is pre-existing-broken: `typescript@7.0.2` pin vs `typescript-eslint` 8.70 hard-throws — see §8 note 2); server `php -l` clean on all 13 changed files + full Feature suite 288 passed / 1375 assertions (in-memory SQLite).

## 8. OPEN NOTES (new, from the fix pass)

1. **4th nested `ToastProvider`** — `sutura-client/src/app/dashboard/layout.tsx:434`, same bug as C3, one-line fix, dashboard-side.
2. **Repo-wide ESLint broken** — `typescript@7.0.2` pin vs `typescript-eslint` 8.70 (via eslint-config-next) throws "does not support TS 7" at config load; `npm run lint` crashes on any file. Fix: MS side-by-side setup (`npm i -D typescript@^6` alongside) or unpin.
3. **`featured=1` semantics decision** — server filters on live-Premium, not the stored `is_featured` column. If the stored column was intended, that's a one-line change in `Store::scopeLivePremium()`.

### MAJOR

**Frontend — design-system drift (the 600px detail system + scattered):**
- M1. **Tap targets under 44px** on store sub-page sticky bars (`p-1`/`w-9 h-9` back buttons): report `report/page.tsx:63`, size-guide `size-guide/page.tsx:41`, both ratings pages `:105–107`/`:119`, photo `photo/page.tsx:51`, `profile/[id]:38,48`; plus `InboxPanel` All/Unread tabs `h-9` (:65), Ask "Start over" `min-h-10` (:61), ratings star-filter chips ≈30px, owner-only `StoreHeroHeader` controls `min-h-[36px]`/`w-9 h-9` (:382,497,530,557). The `AccountHeader` pattern (32px visual + `before:-inset` hit expansion) already exists — reuse it.
- M2. **H1/H2 type-scale violations:** H1 at `text-sm font-bold` (14px) on both ratings pages `:114`/`:123`; product H1s at 20px/600 (`CatalogProductInfo.tsx:39`, `ServiceProductInfo.tsx:43`); `StoreHeroHeader.tsx:567` 24px; Ask H1 `text-2xl/3xl`; `TrackResultCard.tsx:15` an **h2 styled at H1 scale**; "Main Categories" h2 at `text-xs font-bold` (`categories/page.tsx:47` — the two things H2 may never be); `SearchShowroomTab.tsx:52` h2 `text-base font-bold`; `StoreServicesTab.tsx:214,223` + `ServiceCategoryPage.tsx:41` h2 at H3 scale; `AboutContent.tsx:30` + `HomeHowItWorks.tsx:26` h2/h3 at H4 scale; `CatalogItemCard.tsx:142` card H3 at 13px.
- M3. **Off the 8-point grid:** `px-[10px]`/`py-[14px]` across the detail system (`catalog/[item_id]/page.tsx:107`, `service/[service_id]/page.tsx:304,471`, `CatalogDesktopHeader.tsx:42`, all four sub-pages, copied into `repair-request/page.tsx:166` and dashboard pages); `gap-[5px]` in the three account grids (`ratings:57`, `saved:55`, `recently-viewed:64`); `gap-[3px]` `LocationLine.tsx:22`; `py-3.5`/`px-3.5` (`catalog/[item_id]/page.tsx:145`, `authStyles.ts`); `LegalAccordion.tsx:34,38` `sm:text-[17px]`.
- M4. **Silent network failure = "no results"** — every catch collapses to `[]` with no error state: `useSearchResults.ts:84,136,165`, `useStoreDirectory.ts:73`, `useDiscoverData.ts:33–41` (landing shows "No shops found" on a 500), `useAccountHub.ts:21–27`. Add a failed state + retry (search page and `/shops` already handle errors — home doesn't).
- M5. **Logic inlined in pages/components instead of hooks (§3):** `account/orders/page.tsx:33–45` (no `useMyOrders`), `account/settings/support/new/page.tsx:37–54`, `catalog/[item_id]/report/page.tsx` (145 lines), `StoreHeroHeader.tsx:218–281` (banner/logo upload+save), `SearchNoResults.tsx:37–46`, `VerifyEmailScreen.tsx:13–22`.
- M6. **Files over 100–150 lines (§3):** `useStoreStorefront.ts` (1,046 — 9 parallel requests on mount, several `.catch(() => {})` with no error/loading: services :484, posts :549, catalog :558–560, my-review :420; split per tab), `StoreHeroHeader.tsx` (738, mixes owner edit/delete into customer hero), `DiscoveryMap.tsx` (434), `CatalogGridView.tsx` (399), `useSearchData.ts` (396), `SearchStoresTab.tsx` (392), `HomeFeaturedSpotlight.tsx` (377), `SearchMapView.tsx` (348), `ChooseLocationScreen.tsx` (320), `CatalogRatingsSection.tsx` (295), `StoreServicesTab.tsx` (244), `StoreLocationsTab.tsx` (241), `SearchServicesTab.tsx` (227), `ShopDetail.tsx` (218), `FilterChips.tsx` (210), `service/[service_id]/page.tsx` (573 — biggest customer page), `store-catalog-detail` detail page (237).
- M7. **Modal/sheet width inconsistency:** `Modal.tsx:101` keeps `max-w-[599px]` on tablet (spec: expand to `max-w-2xl`/680px); `AccountEditSheet`/`AddRequestedItemModal` do `sm:max-w-2xl`; `RatingModal.tsx:67` invents a third shell (`max-w-[400px] w-[calc(100%-32px)]`); sheets miss the spec's `border-x` on mobile.
- M8. **Dead code:** `useLivePosition.ts` (full live-GPS hook, zero consumers — `useNavigation.ts:41–42` hardcodes `course: null`); `useGuestGatedHref.ts` (no-op, ~17 imports).
- M9. **Duplicate `/auth/me`** — `useStoreStorefront.ts:585–596` re-fetches when user is null but token exists; `AuthHydrator` already does this on every load.
- M10. **Signup inbox polling ignores tab visibility** — `useOwnerSignup.ts:74` 3 s `setInterval` runs in background tabs all session; `useLiveRefresh` is the right tool; also never stops on `expired`.
- M11. **eslint-disabled dep arrays** hiding stale-state risk — `useSearchResults.ts:92,140,169` read closure `c` with hand-maintained arrays; destructure fields in, drop the disables.
- M12. **Type holes in the customer data path:** `useAccountDetail.ts:36` gender cast hides `null`; `ServiceRow.tsx:120–125` + `fabricHelper.ts:41` `as any`; `useOwnerSignup.ts:62,113` hand-rolled casts vs the codebase's `axios.isAxiosError`/`getErrorMessage`; `savedAccounts.ts:70–84` + `useTrackLookup.ts:49` unvalidated response reads.
- M13. **Geolocation inconsistency:** `useStoreDirectory.ts:44–58` near-me doesn't save the fix (re-asks GPS on every revisit) while search + map do save.
- M14. **`useStoreStorefront` re-fetches services on any URL-param change** (dep `searchParams`, :485) — broader than the `?service_id` deep-link intent.
- M15. **Leftover shells / visual flashes:** empty sticky divs (`categories/page.tsx:22`, `shops/page.tsx:42`), `bg-white` loading fallbacks on `account/orders/page.tsx:18` + `account/appointments/[id]/page.tsx:60` (site canvas is `bg-canvas`), `store/layout.tsx` paints white under a `bg-canvas` site.
- M16. **Desktop sidebar omits My History** — `AccountWebSidebar.tsx` MID_LINKS; home "Shops near you" stays a carousel at tablet (spec §2B: 2–3-col grid at 600px+).

**Backend:**
- M17. **N+1 in every "my-\*" list** — per-row `loadCount`/`loadAvg`: `CatalogInteractionController.php:146–147,186–187`, `StoreReviewController.php:121–122`, `ServiceReviewController.php:152–153,201–202`, `StoreSaveController.php:59–60`, `RecentlyViewedController.php:88–90` → `withCount`/`withAvg`.
- M18. **`GET /my-measurements` mutates** — backfill loop (`Store::find` per store + `JobMeasurementSync::syncForCustomer`) inside the read, `MeasurementController.php:59–67`; move to write paths or a scheduler.
- M19. **Tracking lookup defeats its own index** — `orWhereRaw("REPLACE(REPLACE(tracking_code,'-',''),' ','') = ?")` forces a scan on every public hit, `JobOrderTrackingController.php:306–308`; input is already normalized 8-char — strip caller input and OR two exact matches.

### MINOR (condensed)
Frontend: `.mobile-h1` clamps to 26px min below the 28px floor (`globals.css:545`); arbitrary `min-[375px]`/`min-[360px]` breakpoints; stock `bg-amber-50`/`bg-emerald-50` in `QuotationApprovalCard` (palette outlier next to `card-soft`); generic "Profile" H1 on `/profile/[id]` (declared stub, fine); guest hub routes "Support Ticket" to login (copy tweak).

Backend: `login()` pending-signup `Hash::check` is an oracle (`AuthController.php:118–127` — return generic 422); duplicate legacy numeric route pairs for store reviews (`routes/api.php:166–174` — delete the numeric variants); `updatePersonal` omits SafeLink on social_links + PhoneNumber normalization; `PublicBookingController` writes phone via `forceFill` unnormalized and uses plain `url` on links; notification preferences store unvalidated payload in `Cache::forever`; `markAllAsRead` lazy-loads all unread; `User::hasRole` N+1s in role loops; `OwnerSignupController::issue` resend can clobber a verified row's state; **dead check** `$store->user_id` in `StoreReviewController.php:18` (column doesn't exist — always null); stale docblock on `publicProfile` (`StoreController.php:98–105`); `report` + ticket-reply have no sensitive-writes throttle inside the 300/min bucket; `StoreSaveController@toggle` has no self-store guard; `RecentlyViewedController@store` accepts any id/type with no existence check; guest `TrackResultCard` shows a snapshot with no live refresh (order detail has 15s `useLiveRefresh`).

---

## 7. STRENGTHS (what's genuinely very good)

**Frontend**
1. **Auth storage layer** — token-gated `clearAuth(token)` (late 401 from an old tab can't kill the newer login), `AuthHydrator` same-token in-place vs. different-token reload cross-tab sync, `forgetAllAccounts` server-side logout of every remembered account, all localStorage reads try/catch-guarded (private-browsing safe).
2. **Persistent chrome** — one mounted bottom nav + top bar; `lastSearchHref()` returns Map to exactly where you left it; `--topbar-h` ResizeObserver trick keeps the thumb position stable.
3. **`LocationGate`** — a real state machine (pinpointing/finding/permission/denied/too-far) with 52px buttons, Skip escape hatch, `aria-live` status.
4. **Four states on home near-shops** — skeleton / populated / location-off with actions / filtered-empty with per-filter-dimension reset.
5. **Track UX** — submit never greys out (message + focus return), `useTrackLookup` canonical 404/429/network messages, legacy deep-link shim.
6. **`getBestPosition`** — watch-based best-accuracy GPS fix (maxAge 0, 30 m early stop, approximate-fix surfacing) for the "first reading is stale" problem.
7. **Routing resilience** — OSM car/bike/foot with AbortController + `Promise.allSettled` fallbacks; silent re-route keeps the old line on screen; Photon→Nominatim→raw cascade.
8. **Cache invalidation after mutations** — claims `act()` reloads; ratings patch the aggregate in place; bookmark/save are optimistic with server correction.
9. **`useLiveRefresh`** — visibility-aware 15 s polling, stops on closed orders, pauses off-tab on the bell.
10. **Hit-area craft where visual size is constrained** — `AccountHeader` 32px visual → 48px via `before:-inset-2`, `FilterChips` 36px → 44px; the pattern just needs to be applied to the detail system (M1).
11. **Honest code** — comments explain the *why*; redirects are deliberate shims; one token set for all auth forms (`authStyles.ts`).

**Backend**
1. **No critical security class reached** — tenant isolation holds: every `my-*` read filters to the authenticated customer and answers mismatch with 404 not 403.
2. **Rate-limit layering** — per-route public buckets, 300/min authed, 12/min sensitive-writes on money/claim/ticket paths.
3. **Email-first shop signup done right** — account + role only at verify; SHA-256-hashed link tokens; unique poll tokens; verify claims the shadow account (closes guest-booking impersonation).
4. **Guest tracking minimization** — 8-char unique code, backfilled; public response is stage + updated_on only.
5. **PII minimization on public endpoints** — column-restricted eager loads, `makeHidden` of revenue fields for non-owners.
6. **Claims integrity** — 3-day window with clear reasons, row-lock on one-claim-per-window, once-per-declined escalation, refunds hidden from plain staff.
7. **Admin approval gate** — unusable random password until changed (`must_change_password` + `CheckRole` gate), trial Basic-only with `trial_ends_at`, temp credentials emailed exactly once.
8. **Google OAuth hygiene** — one-time 2-min exchange code keeps the token out of URLs; `google_id` link prevents later email-reuse impersonation.
9. **Consistent `{success, message, data}` error shape** + deliberate abort-message pass-through; `EmailAvailability` rule shared across register/check-email/owner-signup so they can never disagree.

---

*Generated from three read-only audits on 2026-11-17. Ordering/appointment flows, staff and admin modules not covered — re-run this audit after fixing the Critical list, and when those flows get built out.*
