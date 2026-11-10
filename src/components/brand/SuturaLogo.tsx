import { BRAND_LOCKUP_WIDTH, BRAND_WORDMARK } from './brandPaths';
import SuturaMark, { type MarkDetail, type MarkTone } from './SuturaMark';

interface SuturaLogoProps {
  /** Set the height (e.g. `h-7`); the width follows. The needle, thread and wordmark take `currentColor`. */
  readonly className?: string;
  /** 'small' under 48px tall (headers, footer), 'full' from 48px. */
  readonly detail?: MarkDetail;
  /** 'dark' lightens the pin for a dark background (pair it with `text-white`). */
  readonly tone?: MarkTone;
}

/** The full SUTURA logo: the Tailor Pin beside the wordmark (same drawing as public/brand/logo.svg). Label the link. */
export default function SuturaLogo({ className = '', detail = 'small', tone = 'light' }: SuturaLogoProps) {
  return (
    <svg viewBox={`0 0 ${BRAND_LOCKUP_WIDTH} 100`} className={className} aria-hidden focusable="false">
      <SuturaMark x="0" y="0" width="100" height="100" detail={detail} tone={tone} />
      <path fill="currentColor" transform="translate(112 0)" d={BRAND_WORDMARK} />
    </svg>
  );
}
