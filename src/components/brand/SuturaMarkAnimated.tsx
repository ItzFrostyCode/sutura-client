import { useId } from 'react';
import { BRAND_NEEDLE, BRAND_NEEDLE_EYE, BRAND_PIN, BRAND_THREAD, BRAND_WORDMARK, BRAND_WORDMARK_VIEWBOX } from './brandPaths';
import { PIN_TONE } from './SuturaMark';

interface SuturaMarkAnimatedProps {
  /** Ripples spread from the pin's tip while true ("finding you"); off once the screen asks a question. */
  readonly locating?: boolean;
  /** Show the SUTURA wordmark under the mark. */
  readonly withWordmark?: boolean;
  readonly className?: string;
}

/**
 * The opening screen's logo: the Tailor Pin puts itself together once (pin drops → needle slides through → thread
 * stitches on → wordmark rises, ~1.2s), then pings while locating. The motion lives in globals.css (`.sutura-intro-*`);
 * visitors who ask for reduced motion get the finished logo. Decorative: the screen's text says what is happening.
 */
export default function SuturaMarkAnimated({ locating = false, withWordmark = true, className = '' }: SuturaMarkAnimatedProps) {
  const eyeId = `sutura-intro-eye-${useId().replace(/:/g, '')}`;

  return (
    <div className={`flex flex-col items-center text-espresso ${className}`} aria-hidden>
      {/* Extra room above (the drop) and below (the ripples) the 100×100 mark. */}
      <svg viewBox="0 -10 100 120" className="h-32 w-auto sm:h-36" focusable="false">
        <mask id={eyeId}>
          <rect x="0" y="-10" width="100" height="120" fill="#fff" />
          <path d={BRAND_NEEDLE_EYE} stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </mask>
        {locating && (
          <g fill="none" stroke={PIN_TONE.light} strokeWidth="1.2">
            <ellipse className="sutura-intro-ripple" cx="42" cy="97" rx="34" ry="8" />
            <ellipse className="sutura-intro-ripple" cx="42" cy="97" rx="34" ry="8" />
          </g>
        )}
        <ellipse className="sutura-intro-shadow" cx="42" cy="97" rx="12" ry="2.6" fill="currentColor" opacity="0.18" />
        <path className="sutura-intro-pin" fill={PIN_TONE.light} fillRule="evenodd" d={BRAND_PIN} />
        {/* The motion is on the wrapper so the needle's eye (the mask) slides in with it. */}
        <g className="sutura-intro-needle">
          <path fill="currentColor" mask={`url(#${eyeId})`} d={BRAND_NEEDLE} />
        </g>
        <path className="sutura-intro-thread" pathLength={1} fill="none" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" d={BRAND_THREAD} />
      </svg>
      {withWordmark && (
        <svg viewBox={BRAND_WORDMARK_VIEWBOX} className="sutura-intro-word mt-3 h-6 w-auto sm:h-7" focusable="false">
          <path fill="currentColor" d={BRAND_WORDMARK} />
        </svg>
      )}
    </div>
  );
}
