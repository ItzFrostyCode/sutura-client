# SUTURA logo — asset manifest (2026-10-15)

## The mark: "S-Tape & Needle"

An S-shaped measuring tape (ticks along the inside of each curve, a twist in the spine, metal tips with a rivet hole)
with a needle through its top and a thread that runs down the right side to a small bow. Wordmark: **Playfair Display
Bold**, tracked +0.03em and outlined (no font loads with the logo).

**Source.** The design is the owner's own concept board, made with Google Gemini (`concept-reference.png` is the
enlarged crop). It was **traced by hand into vector** — a centre line laid over the crop, then the tape, ticks, tips,
needle and thread rebuilt as SVG and checked in 3 overlay passes. No auto-tracer and no image model was used for the
files themselves; the drawing still follows the Gemini concept, so its provenance is that concept.

Colours (from `src/app/globals.css`): outline/needle/thread espresso `#4A3428`, tape taupe `#9A8073`, twist strip
`#806556`, on dark the lines turn `#F3ECE6`; background tile cream `#FAF6F3`.

**One drawing everywhere** (owner, 2026-10-15: the tab, header and sign-in must match). Two weights only, picked by
size: **full** from 48px; **small** under 48px — the same tape, tips, needle, thread and bow with heavier lines, minus
the ticks, rivet holes and twist strip, which are under a pixel there (`qa-sheet.png`). The one-colour version is solid
below full size.

## Files

| Asset | Where | Backend | Model | Date | License | Commercial use | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Concept board (reference only) | `docs/brand/concept-reference.png` | Google Gemini (owner-made) | not recorded — the owner should note which | 2026-10-14 | Google's Gemini terms | **verify** | owner's prompt (not kept here) |
| `logo.svg` (symbol + wordmark) | `public/brand/` | none | hand-traced SVG | 2026-10-15 | project | verify (follows the concept) | `scripts/brand/assets.js` + `tapeMark.js` |
| `logo-on-dark.svg`, `logo-mono.svg`, `logo-icon.svg` | `public/brand/` | none | hand-traced SVG | 2026-10-15 | project | verify | same |
| `favicon.svg` = `src/app/icon.svg` | both | none | hand-traced SVG | 2026-10-15 | project | verify | same |
| `apple-touch-icon.png` = `src/app/apple-icon.png` (180×180) | both | none | rendered from the SVG | 2026-10-15 | project | verify | same |
| `src/app/favicon.ico` (16/32/48) | `src/app/` | none | rendered from the SVG | 2026-10-15 | project | verify | same |
| Wordmark outlines | every lockup | none | Playfair Display Bold, Google Fonts | 2026-10-15 | [SIL OFL 1.1](https://openfontlicense.org) | yes (OFL allows logos) | `scripts/brand/wordpath.js` |
| `qa-sheet.png` | `docs/brand/` | none | rendered | 2026-10-15 | project | n/a | `assets.js` |
| Round 1 (Seam S + 3 rivals, replaced) | `docs/brand/round-1/` | none | hand-authored SVG | 2026-10-14 | project | n/a (record) | — |

"Verify" is honest, not a red flag: Google says it does not claim ownership of what you generate, but a logo built from
an AI concept should have that checked before anyone files it as a trademark. For a thesis defense it is fine to use.

In the app the logo is drawn by `src/components/brand/SuturaMark.tsx` (symbol) and `SuturaLogo.tsx` (symbol + wordmark)
from `suturaMarkup.ts`, which `assets.js` generates from the same geometry. In-app copies paint the gap round the needle
in the page colour (`halo` prop / `--sutura-halo`) instead of a mask, so the logo can appear many times on a page.

## Rebuild

`node scripts/brand/assets.js <out-dir> src/components/brand/suturaMarkup.ts` writes every file above, the in-app
markup and `qa-sheet.png` (needs only `sharp`). The wordmark: `node scripts/brand/wordpath.js
<PlayfairDisplay-Bold.ttf> SUTURA 100 0.03 > scripts/brand/word.json` (needs `opentype.js`).

## Checked

Rendered at true pixels with librsvg (via `sharp`), not a browser: the symbol at 16, 24, 32, 48, 128, 512px on light
`#FAF6F3`, dark `#231B16` and one colour on white; the tab tile at 16–48px on light and dark tab bars; the lockup at 26,
32, 48 and 96px; the 180px Apple icon; the spinning pin's face; the header and sign-in blocks. Overlay of the traced
vector on the concept: 3 passes (tape width, tick placement, needle gap, bow). Not checked: each browser's choice
between `favicon.ico` and `icon.svg` (same design).
