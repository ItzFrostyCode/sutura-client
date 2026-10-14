import type { CSSProperties, SVGProps } from 'react';
import { MARK_FULL, MARK_SMALL, MARK_VIEWBOX } from './suturaMarkup';

export type MarkDetail = 'full' | 'small';

interface SuturaMarkProps extends Omit<SVGProps<SVGSVGElement>, 'dangerouslySetInnerHTML'> {
  /** The same drawing at two weights: 'full' from 48px, 'small' under 48px (heavier lines, no ticks) — docs/brand/qa-sheet.png. */
  readonly detail?: MarkDetail;
  /** The colour behind the mark, used for the gap round the needle (defaults to the page cream). */
  readonly halo?: string;
}

const MARKUP: Record<MarkDetail, string> = { full: MARK_FULL, small: MARK_SMALL };

/**
 * The SUTURA symbol — an S-shaped measuring tape with a needle and thread (docs/brand/MANIFEST.md). Square box.
 * The markup is our own generated constant (scripts/brand/assets.js), never user input. Works nested in another SVG.
 */
export default function SuturaMark({ detail = 'full', halo, style, ...svg }: SuturaMarkProps) {
  const vars = halo ? ({ ...style, '--sutura-halo': halo } as CSSProperties) : style;
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      aria-hidden
      focusable="false"
      style={vars}
      {...svg}
      dangerouslySetInnerHTML={{ __html: MARKUP[detail] }}
    />
  );
}
