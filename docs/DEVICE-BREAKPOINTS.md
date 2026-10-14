# SUTURA Device & Pixel-Width Reference

> Web-based, not native — every "device" below is a viewport-width bucket, not an actual OS/hardware check. This doc exists so new pages/components reuse the same pixel divisions instead of inventing ad-hoc breakpoints (the exact mistake this doc's own history had to walk back from — see §4).

---

## 1. Device Pixel Divisions (real-device reference)

Six zones, two divisions each. This is the *full* real-world reference — §2 explains which of these boundaries actually deserve a CSS breakpoint versus which are just useful context.

### 📱 Mobile

**Division 1 — 320px–414px (Standard Phones, Portrait)**

| Width | Devices |
|---|---|
| 320px | iPhone SE (1st Gen) |
| 360px | Samsung Galaxy (S10–S22, A-Series), Huawei P30/P40, Xiaomi Redmi |
| 375px | iPhone X, 11 Pro, 12 Mini, 13 Mini, iPhone SE (2nd/3rd Gen) |
| 384px | Google Pixel 4, 4a |
| 390px | iPhone 12, 12 Pro, 13, 13 Pro, 14 |
| 393px | iPhone 15, 15 Pro, 16, 16 Pro; Pixel 5, 6; Galaxy S23, S24 |
| 412px | Galaxy Note series, Ultra series (S20 Ultra–S24 Ultra); Pixel Pro models |
| 414px | iPhone 11, 11 Pro Max, XR, XS Max, 7 Plus, 8 Plus |

**Division 2 — 415px–599px (Max Phones, Folds & Landscape)**

| Width | Devices |
|---|---|
| 428px | iPhone 13 Pro Max, 14 Plus |
| 430px | iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus, 16 Pro Max |
| 440–480px | Wider Android gaming phones (ASUS ROG Phone), large Motorola/OnePlus devices |
| 480–599px | Almost any phone in landscape; foldables (e.g. Galaxy Z Fold with the main screen closed) |

### 📑 Tablet

**Division 1 — 600px–768px (Small Tablets, Portrait)**

| Width | Devices |
|---|---|
| 600px | Amazon Fire 7, older 7" Android tablets |
| 744px | iPad Mini (6th & 7th Gen / A17 Pro) |
| 753px | Google Pixel Tablet |
| 768px | iPad base model (1st–9th Gen), iPad Mini (1st–5th Gen), iPad Air (1st/2nd Gen), all portrait |

**Division 2 — 769px–1024px (Large Tablets & Landscape)**

| Width | Devices |
|---|---|
| 800px | Galaxy Tab A/S-Series (e.g. Tab S7/S8) portrait |
| 810px | iPad 9th Gen, portrait |
| 820px | iPad 10th Gen, iPad Air (11", M2/M3/8th Gen), portrait |
| 834px | iPad Pro 11" (M1–M4), portrait |
| 1024px | Almost all standard iPads/iPad Mini in landscape; iPad Pro 12.9"/13" (M4) portrait |

### 💻 Desktop

**Division 1 — 1025px–1440px (Laptops & Small Desktops)**

| Width | Devices |
|---|---|
| 1024/1280px | Older/standard laptops, Chromebooks, standard Windows laptops (1280×800 or 1366×768 physical, but 1280px CSS width) |
| 1440px | MacBook Air 13"/15", MacBook Pro 14", most modern ultrabooks (Dell XPS, Asus Zenbook) |

**Division 2 — 1441px+ (Large Desktops, iMacs & 4K Monitors)**

| Width | Devices |
|---|---|
| 1536px | Larger Windows laptops' common resolution |
| 1728px | MacBook Pro 16" |
| 1920px | Standard desktop monitors / Full HD — the single biggest chunk of real desktop web traffic |
| 2048–2560px+ | iMac 24", 2K/4K monitors, ultra-wide gaming displays |

---

## 2. How This Maps to CSS

**Don't write a media query per device or even per pixel value above — that's ~25 breakpoints, which is not a design system, it's noise.** The table in §1 exists so you know *what's out there*, not so every row gets its own `min-[Npx]:`. What actually deserves a CSS breakpoint is the **boundary between two divisions where the *layout itself* needs to change** — and only once a real screenshot shows it's needed (see §4's "earned, not guessed" rule).

The division boundaries above, rounded to the nearest clean value:

| Boundary | Rounds to | Matches |
|---|---|---|
| 320 → 415 (mobile div 1 → 2) | `375px` | Already used — `min-[375px]:` in the 600px system (§3.B) |
| 415 → 600 (mobile → tablet) | `415px` or `600px` | `600px` is what's actually implemented — see §3.B for why 600 won over the phone/tablet boundary itself |
| 600 → 769 (tablet div 1 → 2) | `768px` | Tailwind's stock `md:` |
| 769 → 1025 (tablet → desktop) | `1024px` | Tailwind's stock `lg:` — already used by PublicNav (§3.A) |
| 1025 → 1441 (desktop div 1 → 2) | `1440px` | **Not implemented anywhere yet** — no page currently changes layout at this width. Don't add `min-[1440px]:` speculatively; only if a real wide-desktop layout problem shows up. |

1px differences (769 vs 768, 1025 vs 1024, 1441 vs 1440) are not meaningful — these are `min-width` fence-posts, not exact device-matching, so always round to the clean Tailwind-adjacent number.

---

## 3. What's Actually Implemented (as of 2026-09-25)

Two **independent** breakpoint systems exist side by side — don't conflate them:

### A. PublicNav and the bottom navigation — Tailwind's stock `sm:` (640px)
Rewritten 2026-10-11 (customer landing + navigation rework).
- **Main pages** (`src/components/shared/publicNav/bottomNavPaths.ts`: `/`, `/search`, `/categories`, `/notifications`, `/track`, `/account`, `/about`) have **no header bar at any screen size**. The SUTURA name and the Order Tracking icon sit at the top of the page content (`publicNav/PageBrandRow.tsx`, placed in each page's main panel; at the top of the search panel on `/search`). Navigation is the bottom bar `publicNav/PublicBottomNav.tsx`: icons only (no text), a solid pill-shaped bar floating 12px above the bottom edge (plus the safe area) with a soft shadow, 56px tall, max 480px wide and centered; the active icon is tinted and sits on a soft round highlight: Discover / Map / Alerts (Notifications) / About / Profile. It is bounded to 599px and centered (AGENTS.md rule for fixed bars), so on a desktop it is a centered bar, not a full-width one. It is drawn on `<body>` through a portal, so a transformed parent cannot move it.
- **Every other public page** (login, register, account sub-pages, tracking result) keeps `PublicNav`'s header; the storefront profile (`/store/[slug]`) has **no site header** for customers any more (its hero has its own Back arrow; the owner's own view keeps the Dashboard bar): logo left, Order Tracking / Notifications / Profile right, and from 640px Discover / Map / About centered (`publicNav/PublicTopLinks.tsx`).
- The pages listed above get bottom padding from `body.has-bottom-nav` (globals.css), except `/search`, a full-screen page (`100dvh`, never scrolls): the map fills the whole screen and ONE panel holds the search (location, then ONE full-width search bar with the filter icon inside it — **Open / Closed lives in the filter pop-up**, there is no separate Open chip and no Stores / Catalog / Services buttons; links such as the landing's Categories or Services still open `?tab=catalog` / `?tab=services` lists) and the **shops** in their original look (`SearchStoresTab`: logo with open dot, NEAREST · km and rating, name, tags, then the carousel of designs or services with rating and price). An up / down chevron icon on each shop drops that carousel (hidden by default in the panel); tapping the shop itself opens its profile in the panel. From **1024px** the panel is a floating card on the left; **below 1024px (tablet and phone) it becomes a draggable bottom sheet automatically** (peek / half / full; heights come from the list in `useBottomSheet`: **peek** = search block + one whole shop + the top of the next, **half** = two whole shops + the top of a third, so a person who does not know the list scrolls can see there is more; tune `ROW_PX` / `SLIVER_PX` there). The map has four buttons (my location, zoom in, zoom out, X / hamburger) and, while a shop is open or a route is drawn, a card at the top; below 1024px they must never overlap or leave the screen, so: the buttons are a column when the map showing above the sheet is tall enough for them (236px) and one **row** when it is not, and `useBottomSheet(…, reserveTop)` keeps peek and half from growing so tall that the top card plus that row no longer fit (only full height covers the map). The shop rows in the list no longer show specialization tags; they are still on the shop's own profile (About), sharing one column with the map buttons and the bar (`--col-w`, 640px max). The map buttons (my location, zoom in, zoom out) are at the bottom right, and below 1024px a brown round button under them is an X that hides the panel and turns into a hamburger that brings it back. Tapping a shop (its row or its pin) opens it **inside the same panel** (`ShopDetail`): the shop's name and address are at the top with one Back (‹) to the list — never a stack of pages — and under them is the real storefront page, `/store/[slug]?embed=1`, in an iframe, so it is exactly the storefront layout (`StoreHeroHeader` with `embedded` leaves out its own Back arrow, name and address line, and the owner bar is hidden). Because it is an iframe, the page lays itself out for the panel's width (phone layout in the desktop side card). Below 1024px the opened shop makes the sheet half height at least; the icon-only Expand / Make-smaller button at the sheet's top right corner goes full height and back to half. The **Get Directions** card (`ShopDirectionsCard`: km away, estimated walk / bike / drive, and the button) floats over the **map**, not inside the panel: top right on desktop, across the top of the map on tablet / phone (hidden while the sheet is full height). It shares one spot with the Active navigation card (`MapTopCard`), so once a route is drawn the Active navigation card takes its place and the route's details and Cancel appear only once. Get Directions draws the road route on the map (`useRouteTo` asks OpenStreetMap's community routing servers, `routing.openstreetmap.de`, for the car, bike and foot routes from the saved location; the person's coordinates go to that third-party server, and a busy production site should self-host OSRM or use a paid provider) and shows the **Active navigation** card (`ActiveNavigationCard`: shop and Cancel on top, the shop name with its km, then the walk / bike / car times (slowest to fastest, like the Get Directions card) on ONE row that never wraps — on a very narrow screen that row scrolls sideways instead) in that same spot, where on tablet / phone the sheet drops to its lowest height. The route stays until Cancel or arrival. In development the storefront iframe would show a second round "N" (Next's dev button, one per page); `?embed=1` hides the iframe's copy with `nextjs-portal{display:none}` — production has no such button. **Live navigation** (`useNavigation`, `useLivePosition`, `routeProgress`): once a route is drawn the browser's GPS (`watchPosition`) moves the "You" dot along it; the road behind the dot is dropped and the card's km / minutes count down; the map glides to keep the dot in view until the person drags the map (the my-location button follows again); if they leave the road (over 80 m, a confident reading) the route is drawn again from where they are, at most every 15 s; within 40 m of the shop the trip ends with an "arrived" message. The "You" dot has a flat, translucent **beam** (`YouMarker`) showing which way the person faces, as in Google Maps: from the phone's **compass** (`useCompassHeading`; Android uses the absolute orientation sensor, iPhone `webkitCompassHeading` after a one-time permission that must be asked from a tap — my-location and Get Directions do that) and, above about 7 km/h (bike, motorbike, car), from the GPS **direction of travel**, so a phone on a handlebar or dashboard still points right. The beam is turned directly on the marker's element instead of rebuilding the icon, and is hidden on a laptop (no compass) or until the sensor answers; it assumes the phone is held in portrait. The GPS is on **only during a route** — never while just browsing — and the live position is separate from the saved location, so the shop list is not refetched and the map is not refitted while moving. Readings are passed on at most once a second and only after 5 m of movement. Geolocation needs HTTPS (or localhost): a phone opening the dev server by its LAN address (`http://192.168…`) gets no GPS. Desktop positions are a static Wi-Fi guess, so the dot only moves on a phone, or in Chrome DevTools → Sensors → Location. The list stays mounted while a shop is open, so Back returns to the same scroll position. The "You" marker is a plain blue dot with a "You" label. The bar floats over the map (`--bottom-nav-space` in globals.css is the room it takes). **Map** points to `/search`: search and map are one screen (`components/search/map/*`); `/map` only remains as the "choose a place" picker (`?select=1`) and redirects everything else to `/search`.
- **Notifications, Facebook style**: the bell sits in the SUTURA row beside Order Tracking (with the red unread count; it left the bottom bar, which is now Discover · Map · About · Profile). Tapping it drops the panel down under it (`NotificationsPopover` → `InboxPanel compact`): title with a ⋯ menu (Mark all as read, Notification settings, Open Notifications, Clear read — asks first), All / Unread, **New** (unread, with *See all*) then **Today / Yesterday / Earlier**, at most 8 rows and *See previous notifications* to the full page. Each row: the shop's picture with a small badge for the kind, **shop**: what happened, the shop's sentence, the date or order number, the age (coloured while unread) and a dot. `/notifications` shows the same panel with every row. The previous card version below is replaced.
- **Notifications (`/notifications`)**: grouped Today / Yesterday / Earlier; every notification is the same structured card (kind and sent time, headline, labelled facts — Shop, Schedule as a full date, Order, Amount, By — the shop's sentence, and a *View …* strip; always one column, at most 672px wide), All / Unread chips, *Mark all read* at the top and *Clear read notifications* at the bottom (asks first in a `ConfirmDialog`, saying how many go); one tap on a row opens it and marks it read (no per-row menu). **My Measurements** is read order by order (`/my-measurements` now returns each version's `job_orders`, linked by `job_orders.measurement_id`), then the profiles no order has used yet. Account Settings no longer has About (the bottom bar has it) or Order Settings (never built); both pages were deleted.
- **One frame for the whole profile**: every page inside `/account/*` uses the bottom-navigation layout too (`usesBottomNav`: bottom bar with Profile lit, no header bar), so opening Settings, Orders, etc. from the profile does not change the margins. On a phone the page's own back row (`AccountHeader`) sits exactly where the profile's SUTURA row sits (16px from the top, a 32px row, 8px under it, so the first card starts at the same height); side margins are the same `mobile-screen-margins`. From 768px the back row is hidden and the SUTURA row shows instead (the sidebar is the navigation). Anything fixed to the bottom of a profile page must sit above the bar (`bottom-[var(--bottom-nav-space)]`).
- **Me hub, Account Settings and the customer account lists (`/account`, `/account/settings`, `orders`, `appointments`, `measurements`) use iOS grouped lists and soft cards**: `card-soft` groups (`HubGroup`) of rows (`HubRow`: a plain icon with no background, title, optional value line, and a › that says it opens something) with **no divider lines**; the lists use soft `card-soft` cards without borders or square corners, `FilterChips` (dark chosen chip) instead of underlined tabs, and `EmptyState`; Saved Items, Ratings and Recently Viewed use a full-width iOS segmented control (`SegmentedTabs`) and the shared `ServiceMiniCard`; History uses the same grouped rows (`HistoryRow`); the settings pages (About, Guide, Text messages, Support list and ticket thread, Become a store owner, the Coming-soon shell), the desktop sidebar, the payment dialog, the reschedule modal and the vertical order stepper are softened the same way (the horizontal stepper is shared with the shop's dashboard and was left alone); the order and appointment **detail** pages are soft cards too (`shared/orderTracking/*`, `QuotationApprovalCard`, `PayForOrder`, `AppointmentDetail*`), and every store logo in an order or appointment has a thin stroke (`border-line-strong`); the profile card opens the profile (avatar and name) and has a **gear** that opens the account settings; Job Orders are three widget-like tiles (icon + count + label); the appointments List / Calendar switch is an iOS segmented control (`ApptViewToggle`). **My Location** in the settings shows the current saved address (and district) with › and opens the real `/location` screen (`?returnTo=/account/settings`); `/account/settings/location` only redirects there (it used to be a stale "coming soon" page).
- **My location (`/location`) and "focus on me"**: the screen is a back arrow + one search bar, then Current location, Choose on map, Home address and Recent places — no Recent / Suggested switch (the Suggested list and its landmarks were deleted). **Back** on `/location` and on Choose on map goes to the page that opened it (`returnTo`, a fixed place that always works; the map's `returnTo` is `/location?returnTo=…` so the chain is kept), else the **last real page the person was on** (`LastPageTracker` in the root layout keeps it in `sessionStorage`, skipping detours: `/location`, `/map`, `/login`, `/register`), else `/` — never browser history, because with `/location` opened plainly the previous history entry was the map and the map's Back led straight back (a loop); choosing a place `router.replace`s the chooser away so it is not left in the history. Under `/account/settings` the arrow in `AccountHeader` always goes to the parent screen (profile → settings → one setting): a history "back" there used to land on `/location` or the map the person had just used, and from there Back led straight back to Settings — a loop that looked like Back doing nothing. Every "my location" action works like Google Maps: it centres on the place and **zooms in** to street level (`lib/mapFocus.ts`, `FOCUS_ZOOM` 16) and never zooms out — a map already closer keeps its zoom; with a panel or sheet in the way the place is put in the middle of the part still showing. Choosing a place on `/location` (or pressing my-location on the search map) opens/keeps the map held on that place (`?focus=me` / `focusMe` → `DiscoveryMap focusUser`, which switches the fit-to-all-pins off) until the person drags the map. Before this, a changed location refit the map to every pin and zoomed it out. **Choose on map (`/map?select=1&returnTo=…&continueTo=…`, and the pop-up picker used by the home address, branch and shop forms) shows no shops at all**: only the map, a pin fixed in the middle (moving the map chooses the place), a search pill (Back + field, a short list of matches), a my-location button the same three map buttons as the search map (my location, + and −) and a card with the address and one *Choose this location* button; zooming — wheel, trackpad pinch, fingers, double tap and the + / − buttons — goes around the pin (`scrollWheelZoom` / `touchZoom` `'center'`), so only dragging changes the chosen place (`components/map/ChooseLocationScreen`, `useChooseLocation`). It opens on the saved place at street level (Davao City when none), Back goes to where the person came from, choosing goes on to `continueTo` (same-site paths only) and a `/search` destination opens held on the place. Browsing shops on a map is `/search`; every other `/map` link redirects there. The old store-map code (filter, sidebar, store list, selected-store card) was deleted.
- The old hamburger drawer and Men/Women/Kids/Services mega-menu (`NavMenuDrawer.tsx`, `WebHoverNav.tsx`, `navData.ts`) are no longer rendered; the files are still in the repo. Garment and service browsing starts from the landing page's Categories row and `/categories`.
- AGENTS.md says the tablet top navigation starts at 600px; the code uses Tailwind `sm` (640px) everywhere else (`MobileFrame`, `.mobile-screen-margins`).

### B. Catalog Item Detail & Service Detail pages — a custom 600px system
Built this session (`src/app/store/[store_id]/catalog/[item_id]/page.tsx`, `src/app/store/[store_id]/service/[service_id]/page.tsx`, and their shared component patterns). Uses Tailwind v4 arbitrary variants (`min-[375px]:`, `min-[600px]:`) instead of the stock `sm`/`md` because neither lined up with where this specific two-column layout needed to switch:

| Range | `<main>` horizontal padding | Layout | Header |
|---|---|---|---|
| 320–374px | `px-0` (0, full-bleed) | Single column, full-bleed hero image | `position: fixed` floating overlay header, dark/transparent circular icon buttons |
| 375–599px | `min-[375px]:px-6` (24px) | Single column, hero image has a margin (no longer full-bleed) | Same fixed floating header, same 24px inset |
| 600–767px | `min-[600px]:px-[10px]` (10px) | **Two-column activates here** (`min-[600px]:grid min-[600px]:grid-cols-12`, image `col-span-7` / info `col-span-5`), narrow `gap-2.5` gutter, hero image switches to a fixed `h-[560px]` box | Switches to the normal in-flow `sticky top-0` desktop-style bar (`CatalogDesktopHeader`/its Service-page equivalent) |
| 768px+ | `md:px-8` (32px) | Same two-column grid, wider `md:gap-10` gutter, hero image switches `object-cover` → `md:object-contain` (shows the whole image, no crop) | Same sticky desktop bar |

**Why 600px and not `md`'s 768px**: a 600–767px screen showing the tall single-column mobile layout (hero image filling the whole viewport, price/title/details below the fold) read as broken — the two-column split needed to kick in earlier than Tailwind's stock `md`. This was arrived at after several iterations this session; earlier attempts that tried to keep the 768px cutover and only patch symptoms (header alone, image alone) kept resurfacing new mismatches until every piece — header, image, grid, action buttons, `<main>` padding — was moved onto the same 600px switch point together. **If you build a new detail/profile page with this same image-left/info-right shape, reuse this exact 600px system rather than re-deriving your own** — copy the class strings from `CatalogHeroGallery.tsx`/the catalog/service page shells, don't approximate them.

### Mobile hero image sizing (both pages)
`aspect-square` below 600px (was `aspect-3/4` originally — changed because the taller portrait crop filled the entire first screen, pushing everything else below the fold before a customer could see it). Fixed `h-[560px]` at 600px+.

### Mobile header: `fixed`, not `sticky`
A `position: sticky` + `marginBottom: -52` overlap trick was tried first (to float the header over the image) and found broken — it collapsed the header's own shrink-wrapped parent `<div>` down to ~0px of extra height, leaving `sticky` nothing to actually stick within, so it scrolled away instead of staying pinned. Fixed by switching to `position: fixed` outright. If you ever see a header meant to float over a hero image "not following" on scroll, check for this exact pattern first.

---

## 4. Guidance for New Pages

- **Reusing the image-left/info-right detail-page shape** (a catalog design, a service, anything similar in the future): copy §3.B's 600px system wholesale. Don't invent a new cutover point per page — that's exactly how this session ended up iterating the same bug across three different pages before consolidating.
- **A brand-new layout shape** that doesn't fit the detail-page pattern: default to stock Tailwind breakpoints (`sm`/`md`/`lg`) unless you hit a concrete visual break at some in-between width — only reach for an arbitrary `min-[Npx]:` variant when a real screenshot shows stock breakpoints don't line up, the same way §3.B's 600px value was earned, not guessed upfront.
- Keep margin/padding on **one shared ancestor** (usually `<main>`) and let children inherit it, instead of each section hand-tuning its own `mx-*`/`px-*` override — every case this session where a component had its own margin override independent of its parent's padding eventually drifted out of sync and had to be un-done.
