import { useId } from 'react';
import {
  BRAND_LOCKUP_WIDTH, BRAND_NEEDLE, BRAND_NEEDLE_EYE, BRAND_PIN, BRAND_THREAD, BRAND_WORDMARK,
} from './brandPaths';

// The "Tailor Pin" brand mark: a location pin (finding local shops) threaded
// with a needle (the craft). Same drawing as public/images/logo*.svg, inline
// so it stays crisp at any size and needs no extra request.
const TONES = {
  light: { pin: '#8C6B5D', ink: '#3B2A21' }, // on cream / white
  dark: { pin: '#B8998A', ink: '#F5EFE8' },  // on dark brown
} as const;

export default function SuturaLogo({
  variant = 'lockup',
  tone = 'light',
  className = '',
  title = 'SUTURA',
}: {
  /** `lockup` = mark + SUTURA wordmark; `mark` = the pin icon only. */
  readonly variant?: 'lockup' | 'mark';
  readonly tone?: keyof typeof TONES;
  /** Size with a height class, e.g. `h-8` — width follows the artwork. */
  readonly className?: string;
  /** Accessible name; pass '' when a visible label already names it. */
  readonly title?: string;
}) {
  const eyeId = `sutura-eye-${useId().replace(/:/g, '')}`;
  const { pin, ink } = TONES[tone];
  const width = variant === 'lockup' ? BRAND_LOCKUP_WIDTH : 100;

  return (
    <svg
      viewBox={`0 0 ${width} 100`}
      className={`w-auto shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <mask id={eyeId}>
        <rect width="100" height="100" fill="#fff" />
        <path d={BRAND_NEEDLE_EYE} stroke="#000" strokeWidth="2" strokeLinecap="round" />
      </mask>
      <path fill={pin} fillRule="evenodd" d={BRAND_PIN} />
      <path fill={ink} mask={`url(#${eyeId})`} d={BRAND_NEEDLE} />
      <path fill="none" stroke={ink} strokeWidth="3.8" strokeLinecap="round" d={BRAND_THREAD} />
      {variant === 'lockup' && <path fill={ink} transform="translate(112 0)" d={BRAND_WORDMARK} />}
    </svg>
  );
}
