import Link from 'next/link';
import SuturaMark from '@/components/brand/SuturaMark';
import { BRAND_WORDMARK, BRAND_WORDMARK_VIEWBOX } from '@/components/brand/brandPaths';

/** The logo block at the top of Sign In and Create Account: the Tailor Pin, the wordmark, and a customer's four steps. */
export default function AuthBrand({ className = '', tagline = 'Find · Fit · Track · Pick Up' }: Readonly<{ className?: string; tagline?: string }>) {
  return (
    <Link href="/" aria-label="SUTURA home" className={`mx-auto flex w-fit flex-col items-center text-espresso ${className}`}>
      <SuturaMark className="h-12 w-12 sm:h-20 sm:w-20" />
      {/* Wordmark alone (box of the outlined letters), same drawing as in the header logo. */}
      <svg viewBox={BRAND_WORDMARK_VIEWBOX} className="mt-2 h-5 w-auto sm:mt-3 sm:h-7" aria-hidden focusable="false">
        <path fill="currentColor" d={BRAND_WORDMARK} />
      </svg>
      <span className="mobile-overline mt-1.5 text-taupe-dark sm:mt-2">{tagline}</span>
    </Link>
  );
}
