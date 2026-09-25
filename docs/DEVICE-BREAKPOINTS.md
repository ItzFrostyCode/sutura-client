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

### A. PublicNav / WebHoverNav department nav — Tailwind's stock `lg:` (1024px)
`src/components/shared/publicNav/WebHoverNav.tsx` — hamburger menu below 1024px, inline MEN/WOMEN/WEDDING/OFFICE/DISCOVER nav at 1024px+. This predates the work below and was left as-is (stock Tailwind `sm`/`lg`, no arbitrary values).

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
