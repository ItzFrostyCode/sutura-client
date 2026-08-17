# SUTURA — Design System

The Shop Owner dashboard's visual system. Written during the full UI redesign;
keep new work consistent with it rather than inventing a parallel style.

Aesthetic: **warm editorial minimalism.** Flat surfaces, hairline borders,
generous whitespace, strong typographic contrast. It should feel like a
well-set document, not a colorful SaaS console.

---

## Color — tokenized, palette locked

Defined in `src/app/globals.css` as CSS variables and exposed as Tailwind
tokens. **Use the token, not the hex**, in all new markup.

| Token | Hex | Use |
| :--- | :--- | :--- |
| `bg-canvas` | `#FAF6F3` | app background |
| `bg-surface` | `#FFFFFF` | cards, rails, raised surfaces |
| `bg-sunken` | `#F0EAE3` | hover fill, wells, segmented controls |
| `border-line` | `#EBE6E0` | every hairline border and divider |
| `border-line-strong` | `#D1C7BD` | hover borders |
| `text-ink` | `#2D2A26` | headings, primary text |
| `text-ink-body` | `#524A44` | body copy |
| `text-ink-muted` | `#827A73` | secondary, labels |
| `text-ink-faint` | `#A8A19A` | hints, timestamps, placeholders |
| `bg-taupe` / `text-taupe` | `#9A8073` | the one brand accent |
| `taupe-hover` | `#91756A` | taupe hover |
| `text-danger` | `#B26959` | destructive, overdue, aging — **never decorative** |
| `text-sage` | `#7A8B76` | success, paid, positive |
| `alert` | `#E41E3F` | unread notification dot only |

### Rules

- One accent per surface. If everything is highlighted, nothing is.
- No `shadow-*`. Separation comes from borders and background steps.
- No `backdrop-blur`. No gradients. No pastel rainbows for categorical data.

---

## Typography

Two families, deliberately contrasted:

- **Outfit** (`font-sans`) — all UI, body, labels, buttons.
- **Playfair Display** — reserved for two jobs only, via helper classes:
  - `.text-display` — page titles and section headings
  - `.text-figure` — figures that matter (money, counts). Includes tabular
    lining numerals so columns align.

Using the serif anywhere else dilutes the contrast that carries the design.

Helper classes: `.text-eyebrow` (uppercase muted category label) and
`.text-eyebrow-accent` (same, taupe). Every page and major section opens with
one — it's the connective tissue across the app.

---

## Layout

- **Shell** (`app/dashboard/layout.tsx`): white rail on cream canvas.
  Collapses 240px ↔ 64px, persisted to `localStorage` under `sutura.sidebar`,
  toggled from the header. Icons-only mode shows hover tooltips. Below `lg`
  the rail becomes an off-canvas drawer.
- **Header**: logo left, notification bell + profile right (`AccountHeaderMenu`),
  branch selector always visible including mobile.
- **Page body**: `max-w-[1400px]`, padding `px-4 sm:px-6 lg:px-8`.

### Hierarchy rule (the important one)

Every screen needs **one focal element** — the number or object the user opened
that page to see — at clearly greater visual weight than its neighbours. On
Home and Payments that's a taupe-filled hero tile; on Reports it's Total
Revenue. A uniform grid of same-weight cards is the failure state this redesign
existed to fix.

Pick the focal figure by what's *always meaningful*, not what sounds important:
Home leads with Outstanding Balance rather than Today's Revenue, because the
latter reads ₱0.00 for most of a working day.

---

## Core components

| Component | Purpose |
| :--- | :--- |
| `shared/PageHeader` | eyebrow + display title + description + actions + optional flush tabs. Every page uses it. |
| `shared/StatBand` | flush, hairline-divided figure row. One surface, internal rules — not N floating cards. |
| `shared/Badge` | flat status pill; `neutral / success / danger / warning / accent`. |
| `shared/EmptyState` | icon + heading + subtext + CTA. |
| `shared/StatusStepper` | job-order stage progression. |
| `dashboard/ActionQueue` | Home's unified, priority-ordered attention list. |
| `Modal` | the one modal primitive — see below. |
| `ConfirmDialog` | small destructive confirmations. |

---

## Overlays

`Modal` is the single primitive; 25+ call sites route through it.

| Feature | Desktop (≥md) | Mobile (<md) |
| :--- | :--- | :--- |
| Position | centered panel | **full screen** |
| Insets | `p-4`, max-width honored | `inset-0`, no padding |
| Height | `max-h-[85vh]` | `100dvh` (**`dvh`, not `vh`**) |
| Corners | `rounded-xl` | square |
| Backdrop | visible, dimmed | not visible — panel covers everything |
| Header/footer | inline | **sticky**, action bar always reachable |

Also: body scroll lock, focus trap, `Esc` to close, focus returned to trigger,
`env(safe-area-inset-bottom)` on the sticky footer.

`.modal-panel` in `globals.css` neutralizes the desktop `max-w-*` prop below
`md` — without it, a `max-w-md` modal stays a 448px box on a 320px phone.

`ConfirmDialog` is the one overlay allowed to stay centered on mobile (a
two-button decision doesn't earn a full screen), bottom-anchored for thumb
reach.

---

## Responsive

Works 320 → 1440. **320px is a hard floor — nothing may overflow horizontally.**

- Tab strips: `overflow-x-auto hide-scrollbar` with `shrink-0 whitespace-nowrap`
  children. Never `flex-wrap` inside a bordered pill — it clips mid-word.
- Wide content scrolls inside its own container; the page body never does.
- Skeletons use the same breakpoints as the content they stand in for.
- Touch targets ≥ 44px.

---

## Motion

`.animate-rise` — 12px rise + fade, 350ms, `cubic-bezier(0.16, 1, 0.3, 1)`.
Stagger lists with `--index`. Transform and opacity only.
`prefers-reduced-motion` is honored globally in `globals.css`.

---

## Verification

Design changes are verified by **looking at them**, not by reading CSS.
Playwright + cached Chromium: log in as `owner@sutura.com` / `password`,
dismiss the What's New tour (`button:has(svg.lucide-x)`), screenshot at
320 / 768 / 1440, then read the PNGs. Modals must be screenshotted **open at
320px** — a closed modal proves nothing.

Also assert no overflow:

```js
await page.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth
); // must be 0
```
