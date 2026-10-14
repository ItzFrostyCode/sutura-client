import type { CSSProperties } from 'react';
import { LOCKUP, MARK_FULL, MARK_SMALL, WORDMARK } from './suturaMarkup';
import type { MarkDetail } from './SuturaMark';

interface SuturaLogoProps {
  /** Set the height (e.g. `h-7`); the width follows. The wordmark takes `currentColor`. */
  readonly className?: string;
  /** 'small' under 48px tall (headers, footer), 'full' from 48px. */
  readonly detail?: MarkDetail;
  /** The colour behind the logo, for the gap round the needle (defaults to the page cream). */
  readonly halo?: string;
}

const MARKUP: Record<MarkDetail, string> = { full: MARK_FULL, small: MARK_SMALL };
const { box } = LOCKUP;

/** The full SUTURA logo: the tape-and-needle S beside the wordmark (same drawing as public/brand/logo.svg). Label the link. */
export default function SuturaLogo({ className = '', detail = 'small', halo }: SuturaLogoProps) {
  return (
    <svg
      viewBox={`0 0 ${LOCKUP.width} ${LOCKUP.height}`}
      className={className}
      style={halo ? ({ '--sutura-halo': halo } as CSSProperties) : undefined}
      aria-hidden
      focusable="false"
    >
      <svg width={LOCKUP.symbolWidth} height={LOCKUP.height} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} dangerouslySetInnerHTML={{ __html: MARKUP[detail] }} />
      <path fill="currentColor" transform={`translate(${LOCKUP.wordX} ${LOCKUP.baseline})`} d={WORDMARK} />
    </svg>
  );
}
