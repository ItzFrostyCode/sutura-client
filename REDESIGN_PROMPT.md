# SUTURA — Complete Shop Owner Dashboard UI Redesign Brief

> Paste this whole file as your opening prompt in a fresh session.

---

## THE TASK

Completely redesign the **UI/UX** of the SUTURA Shop Owner dashboard — from scratch, as one coherent design system. Not a cleanup pass, not a class-tidying pass: a real redesign of layout, hierarchy, spacing, typography, and navigation.

**Do not stop until every page listed below is redesigned.** Work continuously. Do not ask "should I continue?" — continue.

---

## HARD RULES

**Never do these:**
- ❌ Delete any file
- ❌ Remove any backend endpoint, column, model, or feature
- ❌ Invent fake/mock/placeholder data — every number on screen must come from a real API response
- ❌ Add drop shadows (`shadow-*`) or glassmorphism (`backdrop-blur`) anywhere
- ❌ Change the color palette
- ❌ Touch anything outside the Shop Owner Module (no Customer portal, no Admin frontend)

**Allowed:**
- ✅ Add backend endpoints/fields **if** the UI genuinely needs data that doesn't exist yet, and it's in-scope, logical, and real-world practical
- ✅ Fix bugs and data-consistency issues you find
- ✅ Restructure frontend components freely
- ✅ Add new frontend components/files

### Build NEW markup — do not reuse the old UI

This is a redesign **from zero**, not an edit pass on the existing design.

- **Do not** copy the current JSX/Tailwind and tweak its classes. Write new markup.
- **Do** read the existing components — but only to extract: what data fields exist, what API calls are made, what states/props/handlers/business rules are needed, what edge cases are handled.
- Then throw the old layout away and build the component fresh against the new design system.
- If a new version ends up looking like the old one, that's a failure — re-do it.

Concretely: keep the *logic and data wiring*, replace the *entire presentation layer*.

---

## PROJECT CONTEXT

**What it is:** A web-based tracking system for Davao City tailoring shops. Replaces a paper job-ticket + Facebook Messenger workflow with a real digital production pipeline. Subscription-tiered (Basic/Pro/Premium), multi-branch. Capstone thesis project — defense first week of October 2026.

**Who uses this dashboard:** A shop owner (or branch manager/staff, role-gated) running production *while* using the software — often mid-fitting, standing at a workbench. Every extra tap costs real time. Desktop-first for data density, but must work on a phone on the shop floor.

**Stack:**
- Frontend: `sutura-client/` — Next.js 16.3, React 19, TypeScript, Tailwind CSS v4, Zustand, lucide-react, recharts, react-leaflet
- Backend: `sutura-server/` — Laravel API, MySQL 8.4
- Run: backend `php artisan serve` (:8000), frontend `npm run dev` (:3000)
- Login: `owner@sutura.com` / `password`

**Read first:** `CLAUDE.md` (both repos), `PRODUCT.md` (client repo).

---

## COLOR PALETTE — LOCKED, DO NOT CHANGE

```
#FAF6F3   app background (warm cream)
#FFFFFF   card / surface
#EBE6E0   border, divider
#F0EAE3   hover fill, subtle surface
#D1C7BD   hover border

#2D2A26   primary text (headings)
#524A44   body text
#827A73   secondary / muted text
#A8A19A   tertiary / hint text

#9A8073   TAUPE — primary accent (Tailwind token: `taupe`)
#91756A   taupe hover (token: `taupe-hover`)

#B26959   danger / destructive / overdue
#7A8B76   success / sage / paid
#E41E3F   unread notification dot only
```

One accent color per surface. `#B26959` is reserved strictly for negative/warning states — never decorative.

---

## LAYOUT ARCHITECTURE (the owner explicitly wants this)

### Header — keep this structure, it's confirmed good
- **Left:** logo + wordmark
- **Right:** notification bell + profile menu
- Branch selector stays accessible (must be visible on mobile too, not hidden below `md:`)

### Sidebar — this is the main structural change requested
- **Collapsible**: expands to full labels ↔ collapses to icons-only
- Collapsed state must free up real horizontal space for content
- Icon-only mode needs tooltips on hover
- Collapse state should persist (localStorage)
- On mobile: off-canvas drawer, not a squeezed sidebar

### Navigation items — the owner is satisfied with this list and grouping. Preserve it.

```
MAIN OPERATIONS
  Home
  Appointments
  Collect Payments

WORKROOM
  Custom Jobs
  Customers

SHOWROOM
  Design Catalog
  Services

STAFF & PERFORMANCE
  Staff
  Reports & Insights
  Branches
  Audit Log

(bottom, pinned)
  Help & Support
```

Reached via the header, not the sidebar: **Notifications**, **My Storefront**, **Billing & Plans**, **Account Settings**.

---

## RESPONSIVE SPEC — MANDATORY

Must work correctly at **every** one of these widths. 320px is the hard floor — nothing may overflow horizontally.

| Width | Target |
|---|---|
| **320px** | Smallest phone. No horizontal scroll, ever. Sidebar off-canvas. |
| 375px | Typical phone |
| 768px | Tablet |
| 1024px | Small laptop |
| 1440px | Desktop |

Rules:
- Data tables → card lists on mobile, never a squeezed table or sideways scroll of the whole page
- Wide content (tables, charts) scrolls inside its **own** `overflow-x-auto` container — the page body never scrolls sideways
- Tab bars use `overflow-x-auto` with `shrink-0 whitespace-nowrap` children — never `flex-wrap` inside a bordered pill
- Skeleton loaders must use the **same responsive breakpoints** as the real content they stand in for
- In list+detail splits, the action panel must not be pushed below a long list on mobile (use Tailwind `order-*`)
- Touch targets ≥ 44px

---

## OVERLAYS, MODALS & SHEETS — REBUILD THESE PROPERLY

**Current state (all wrong for mobile):** there are **28 modal components**. 25 import the shared `src/components/Modal.tsx`; 9 hand-roll their own `fixed inset-0` overlay. The shared one is a centered popup at *every* screen size — `p-4` outer padding, `rounded-2xl`, `max-h-[90vh]`, backdrop visible around all four edges. On a 320–430px phone that's a cramped floating box with the page showing through behind it.

### Required behavior

| | Desktop (≥ `md`) | Mobile (< `md`) |
|---|---|---|
| Position | Centered popup | **Full screen** |
| Insets | `p-4`, max-width, `max-h-[90vh]` | `inset-0`, **zero padding** |
| Corners | `rounded-2xl` | **Square** — no radius |
| Backdrop | Visible, dimmed | **Not visible at all** — modal covers 100% |
| Height | Fits content | `100dvh` (**`dvh`, not `vh`** — `vh` is wrong under mobile browser chrome) |
| Header | Title + ✕ | **Sticky top**, title + ✕, always reachable |
| Footer | Inline actions | **Sticky bottom** action bar, never scrolled off |
| Body | Scrolls | Scrolls **between** the sticky header and footer only |

### Also required
- Lock background scroll while open (and restore on close)
- Respect iOS safe areas on the sticky footer: `padding-bottom: env(safe-area-inset-bottom)`
- Focus trap; `Esc` closes; backdrop click closes (desktop) — but a full-screen mobile modal has no backdrop to click, so the ✕ must always be visible
- Return focus to the trigger on close
- **The sticky-footer rule is not cosmetic:** a real bug this session had Approve/Reject buttons pushed off-screen below a long list on mobile. Primary actions must always be reachable without scrolling.

### Build ONE primitive, then migrate all 28
Create a single `<Modal>` (plus a `<ConfirmDialog>` variant for the small destructive ones) that implements all of the above, and route **every** modal through it. Kill all 9 hand-rolled overlays. Two of these need a variant:
- `CatalogPreviewModal`, `OrderReceiptModal` → image/document-heavy, full-bleed on mobile
- `ServiceDeleteModal`, `StaffDeleteModal`, `CustomerDeleteModal`, `BranchDeleteModal`, `CatalogDeleteModal`, `ServiceTrashModal`, `JobTrashModal` → small confirm dialogs, may stay centered on mobile but must be comfortably sized and thumb-reachable

### Other overlays — same principle
- **Notification panel** — dropdown on desktop → full-screen sheet on mobile
- **Profile / account menu** — dropdown → bottom sheet on mobile
- **Branch selector** — dropdown → bottom sheet on mobile
- **Filter / sort dropdowns** — native `<select>` or bottom sheet on mobile; never a tiny floating menu
- **Toasts** — must not cover a sticky bottom action bar
- **What's New tour** — currently covers the whole page and blocks interaction; make it dismissible and non-blocking

---

## PAGES TO REDESIGN — ALL OF THEM

1. **Home** (`/dashboard`) — greeting, needs-attention alerts, financial snapshot, at-a-glance stats, today's agenda, quick actions, staff online, recent reviews, business performance charts
2. **Appointments** — calendar view + table view, status tabs, filters
3. **Collect Payments** — 3 tabs: GCash/Bank receipts, job balances, catalog orders
4. **Custom Jobs** — kanban pipeline board, list tabs, job detail page (tabbed: Overview/Production/Staff/Fulfillment/Financials)
5. **Customers** — client list, customer detail (tabs: overview, measurements, jobs, appointments, history)
6. **Design Catalog** — item grid, filters/sort, item detail, plus sub-tabs (Walk-in Orders, Analytics, Reviews)
7. **Services** — services + packages tabs
8. **Staff** — staff list, staff profile page
9. **Reports & Insights** — KPI cards, charts, branch comparison, staff productivity, outstanding balances, unclaimed pickups
10. **Branches** — card view + map view (Leaflet)
11. **Audit Log** — paginated table
12. **Help & Support** — ticket list + threaded detail
13. **Notifications** — dropdown panel
14. **My Storefront** (`/shop/[shop_id]`) — public shop profile, owner-editable
15. **Billing & Plans** — current plan, usage, plan cards, comparison table
16. **Account Settings** — personal info, security, notifications tabs

Also the shared shell: sidebar, header, modals, toasts, empty states, loading skeletons, form inputs, tables, tabs, badges, buttons.

---

## DESIGN DIRECTION

Load and follow these installed skills (they're in `.claude/skills/`):
- **`minimalist-ui`** — warm monochrome, typographic contrast, flat bento grids, no gradients, no heavy shadows. This is closest to the intended taste.
- **`redesign-existing-projects`** — audits current design and identifies generic AI patterns to eliminate
- **`design-taste-frontend`** — anti-slop, audit-first on redesigns

Aesthetic: **clean, simple, modern, real.** Warm and tactile (it's a tailoring business), not cold corporate SaaS. Flat surfaces, borders instead of shadows, generous whitespace, strong typographic hierarchy.

---

## ANTI-PATTERNS — these are the exact failures that made previous attempts read as "not redesigned"

1. **Uniform grids of identical cards.** A row of 8 same-size, same-weight stat cards is the #1 tell of generic AI design. Every screen needs a clear focal point — the one number or object the user opened that page to see — at genuinely larger visual weight than its neighbors.
2. **Removing `shadow-sm` is not a redesign.** Layout, hierarchy, spacing, and typography must actually change.
3. **Duplicate content.** A real bug found this session: "Due Today / Due This Week" rendered twice on Home from two different components. Check for repeats.
4. **Two near-identical labels stacked.** "Today's Revenue" hero directly above "Total Revenue" card reads as a mistake. Differentiate or remove.
5. **State that renders as its own opposite.** Real bug found: an "Unlimited" usage bar rendered as a *full amber bar* — visually identical to "maxed out, warning." Check that every state actually communicates what it means.
6. **Inconsistent section headers.** Pick one pattern (e.g. small uppercase taupe eyebrow + heading + sub) and apply it to every section on every page.

---

## VERIFICATION LOOP — THIS IS NOT OPTIONAL

**You cannot judge a redesign you have not looked at.** Describing CSS is not verification. Set this up before you write design code, and re-run it after every page.

Chromium is already cached at `~/Library/Caches/ms-playwright/`.

```bash
mkdir -p /tmp/shots && cd /tmp/shots && npm init -y && npm install playwright
```

```js
// /tmp/shots/shot.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:3000/login');
await page.fill('input[type="email"]', 'owner@sutura.com');
await page.fill('input[type="password"]', 'password');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2000);

// The "What's New" tour modal covers the page — dismiss it
async function dismissTour() {
  const x = page.locator('button:has(svg.lucide-x)').first();
  for (let i = 0; i < 3; i++) {
    if (!(await x.isVisible().catch(() => false))) break;
    await x.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

const routes = [['home','/dashboard'], ['jobs','/dashboard/jobs'] /* ...all pages... */];
for (const [w, width] of [['sm',320], ['md',768], ['lg',1440]]) {
  await page.setViewportSize({ width, height: 1200 });
  for (const [name, path] of routes) {
    await page.goto(`http://localhost:3000${path}`);
    await page.waitForTimeout(1200);
    await dismissTour();
    await page.screenshot({ path: `/tmp/shots/${name}-${w}.png`, fullPage: true });
  }
}
await browser.close();
```

Then **actually Read the PNG files** and look at them. Fix what you see. Repeat.

Screenshot every page at **320px, 768px, and 1440px** before declaring it done.

### Modals must be screenshotted OPEN, at 320px

A closed modal proves nothing. Click it open and capture it — this is the only way to verify the full-screen behavior actually works:

```js
await page.setViewportSize({ width: 320, height: 700 });
await page.goto('http://localhost:3000/dashboard/jobs');
await dismissTour();
await page.getByRole('button', { name: /quick walk-in/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/shots/modal-quickjob-320.png', fullPage: true });
```

Look for: page content visible behind it (fail), rounded corners (fail), gaps at the screen edges (fail), action button below the fold (fail).

---

## PER-PAGE DEFINITION OF DONE

- [ ] `npx tsc --noEmit` clean
- [ ] `npx eslint <changed files>` — no new errors
- [ ] `npm run build` passes
- [ ] Screenshotted and visually inspected at 320 / 768 / 1440
- [ ] No horizontal overflow at 320px
- [ ] **Every modal on the page opened and screenshotted at 320px** — confirm it is genuinely full-screen with no page visible behind it, and its primary action button is reachable without scrolling
- [ ] Every number traced to a real API field (no invented data)
- [ ] Has a clear visual focal point — not a uniform card grid
- [ ] Markup is newly written, not the old JSX with new classes
- [ ] Section headers match the app-wide pattern

---

## SUGGESTED ORDER

1. Design system foundation first — spacing scale, type scale, shared primitives (Button, Card, Badge, EmptyState, StatTile, PageHeader, Table, Tabs, Input)
2. App shell — collapsible sidebar + header + mobile drawer
3. Home (proves the system)
4. Then every remaining page, one at a time, screenshot-verified

Build the primitives once and reuse them everywhere — consistency across pages matters more than any single clever screen.
