import { useId, type SVGProps } from 'react';
import { BRAND_NEEDLE, BRAND_NEEDLE_EYE, BRAND_PIN, BRAND_THREAD } from './brandPaths';

export type MarkDetail = 'full' | 'small';
export type MarkTone = 'light' | 'dark';

/** The pin's own colour; the needle and thread take `currentColor` (e.g. `text-espresso`, `text-white`). */
export const PIN_TONE: Record<MarkTone, string> = {
  light: '#8C6B5D', // on cream / white
  dark: '#B8998A', // on dark brown
};

/** Thread weight: 'small' (under 48px) is heavier so it doesn't vanish in a header or a tab icon. */
export const THREAD_WIDTH: Record<MarkDetail, number> = { full: 3.8, small: 4.4 };

interface SuturaMarkProps extends SVGProps<SVGSVGElement> {
  readonly detail?: MarkDetail;
  readonly tone?: MarkTone;
}

/**
 * The SUTURA symbol, the "Tailor Pin": a location pin threaded with a needle. Square box (0 0 100 100).
 * Decorative by default; label the link or button around it. Works nested in another SVG (pass x/y/width/height).
 */
export default function SuturaMark({ detail = 'full', tone = 'light', ...svg }: SuturaMarkProps) {
  const eyeId = `sutura-eye-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...svg}>
      <mask id={eyeId}>
        <rect width="100" height="100" fill="#fff" />
        <path d={BRAND_NEEDLE_EYE} stroke="#000" strokeWidth="2" strokeLinecap="round" />
      </mask>
      <path fill={PIN_TONE[tone]} fillRule="evenodd" d={BRAND_PIN} />
      <path fill="currentColor" mask={`url(#${eyeId})`} d={BRAND_NEEDLE} />
      <path fill="none" stroke="currentColor" strokeWidth={THREAD_WIDTH[detail]} strokeLinecap="round" d={BRAND_THREAD} />
    </svg>
  );
}
