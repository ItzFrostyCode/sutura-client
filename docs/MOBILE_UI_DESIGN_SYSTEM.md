# 📱 Mobile UI Design System Specs Sheet (320px – 599px)

**Baseline Design Canvas**: 320px width  
**Max Mobile Frame**: 599px width  
**Grid System**: 8px Linear Grid  
**Typography Scale**: "The Anti-AI Bold" Scale  

---

## 1. Typography Hierarchy & Weights (The "Anti-AI Bold" Scale)

**Core Rule**: High-contrast visual hierarchy. Long texts must stay Regular to preserve readability. AI models tend to bold every single element—enforce crisp contrast instead.

### 👑 Titles & Headings
| Element | Font Size | Font Weight | Line Height | Usage | Utility Class |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero Title** | 36px–40px | Bold (700) or Black (900) | 1.1–1.2 (40px–48px) | Oversized banner text, hero section | `.mobile-hero-title` |
| **H1 (Main Page Title)** | 28px–32px | Bold (700) | 1.2 (34px–38px) | **Strictly ONE per screen view** | `.mobile-h1` |
| **H2 (Section Header)** | 22px–24px | **Semi-Bold (600)** | 1.3 (28px–32px) | Breaks down major blocks. *Never Bold (700)* | `.mobile-h2` |
| **H3 (Sub-section / Card Title)** | 18px–20px | Medium (500) or Semi-Bold (600) | 1.4 (26px–28px) | Names of items or card grid units | `.mobile-h3` |
| **H4 (Small Group Title / Headers)** | 16px | Semi-Bold (600) | 1.4 (22px) | Section rows, tiny modal headers | `.mobile-h4` |

### 📖 Body Content & Meta (The Readability Zone — Strictly Unbolded)
| Element | Font Size | Font Weight | Line Height | Usage | Utility Class |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Body Large** | 18px | Regular (400) | 1.5 (26px–28px) | Lead paragraphs, featured excerpts | `.mobile-body-lg` |
| **Body Medium** | 16px | Regular (400) | 1.5 (24px) | Default reading standard for descriptions | `.mobile-body-md` |
| **Body Small** | 14px | Regular (400) | 1.4 (20px) | Secondary context, hints, timestamps | `.mobile-body-sm` |
| **Caption / Footnote** | 11px–12px | Regular (400) | 1.3 (16px) | Metadata, fine print, micro-labels | `.mobile-caption` |
| **Overline / Eyebrow Text** | 11px–12px | Semi-Bold (600) or Bold (700) | 1.3 (16px) | Category tags above titles. **UPPERCASE**, tracking +0.08em–0.12em | `.mobile-overline` |

> [!IMPORTANT]
> **Anti-Slop Golden Rule**: Never use Medium (500), Semi-Bold (600), or Bold (700) for multiline reading body text, descriptions, reviews, or metadata. Keep body text at Regular (400).

---

## 2. Interactive & Clickable Components

### 🎯 Touch Targets & Tap Areas (Human-Finger Physics)
- **Minimum Tap Target**: `44px × 44px` (Strict Minimum — `.touch-target-44`)
- **Ideal Tap Target**: `48px × 48px` (Recommended Standard — `.touch-target-48`)
- **Icon-Only Buttons** (Nav back, search, close 'X', bookmark, notifications):
  - Visual icon size: 20px to 24px
  - Touch bounding box: 48px × 48px (12px to 14px padding around icon — `.btn-icon-mobile`)

### 🔘 Button Standards (Heights & Typographic Weights)
- **Primary Action Button** (Submit, Checkout, Book, Confirm):
  - Height: 48px to 56px (**52px Microsoft Fluent standard sweet spot**)
  - Typography: 16px | Semi-Bold (600)
  - Radius: 8px (subtle modern) or 9999px (pill) — `.btn-primary-mobile`
- **Secondary / Outline Button**:
  - Height: 48px to 56px (52px sweet spot)
  - Typography: 16px | Medium (500)
  - Border: 1px or 1.5px — `.btn-secondary-mobile`
- **Text / Link Button**:
  - Bounding box: Minimum 44px height (Padding: 12px vertical)
  - Typography: 14px to 16px | Medium (500) — `.btn-text-mobile`
- **Form Input Fields** (Textboxes, dropdowns, datepickers):
  - Height: 48px to 56px (52px sweet spot)
  - Typography: 16px Regular (400) (`.form-input-mobile`)
  - **CRITICAL iOS Rule**: Font size must be `>= 16px` on mobile (< 640px) to prevent iOS Safari auto-zooming.
- **List Items / Menu Navigation Rows** (Vertical Stack):
  - Height: 56px to 72px per row — `.mobile-nav-row`
  - Typography: 16px | Regular (400) or Medium (500)

---

## 3. Spacing, Layout Margins & Padding

### 📏 The 8-Point Linear Grid (Strict Math Only: 4, 8, 12, 16, 24, 32, 40, 48, 64)
- **Screen Margins (Side Gutters)** (`.mobile-screen-margins`):
  - `16px` (320px – 480px width)
  - `24px` (481px – 599px width)
- **Vertical Spacing Rhythm**:
  - Headline to Paragraph: `8px` or `12px` (`.space-headline-para`)
  - Paragraph to Paragraph: `16px` (`.space-para-para`)
  - Section to Section: `32px` or `40px`
  - Content Block to CTA Button: `24px` to `32px` (`.space-block-cta`)
  - Bottom Safe Area: `calc(16px/24px + env(safe-area-inset-bottom))`
- **Component Spacing**:
  - Horizontal Button-to-Button Gap: `12px` minimum (`.gap-btn-mobile`)
  - Card Inner Padding: `16px`
  - List Item Vertical Gap: `8px` to `12px`
  - Badge / Tag Padding: `4px` vertical, `8px` horizontal

---

## 4. Overlay & Container Bounds (Desktop & Mobile Consistency)

- **Mobile Preview Shell**: `max-w-[599px] mx-auto border-x border-line`.
- **Fixed Bottom Bars & Sheets**:
  - Docked to bottom with `fixed bottom-0 left-0 right-0 max-w-[599px] mx-auto border-t border-x border-line`.
  - Ensures overlays do not stretch unconstrained across desktop monitors.

---

## 5. Architectural & Code Health Standards

1. **Modular Component Limit**: Keep individual component files under **100–150 lines**. Extract card items, filter chips, action bars, and modal sub-views into dedicated sub-components.
2. **Hook Separation**: Extract stateful logic, data fetching, and query parameter handling into custom hooks (`useXData.ts`).
3. **Route Consolidation**: Never build redundant standalone directory pages (e.g. separate `/services` or `/catalog` standalone lists) when a unified multi-tab search/discovery system exists (`/search?tab=...`).
4. **Never Shrink Buttons Below 44px/48px**: If horizontal space is constrained on 320px screens, stack buttons vertically rather than reducing their touch targets.
