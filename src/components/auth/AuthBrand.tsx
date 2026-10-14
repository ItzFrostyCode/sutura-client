import Link from 'next/link';
import SuturaMark from '@/components/brand/SuturaMark';
import { WORDMARK, WORDMARK_VIEWBOX } from '@/components/brand/suturaMarkup';

/** The logo block at the top of Sign In and Create Account: the tape-and-needle S, the wordmark, and a customer's four steps. */
export default function AuthBrand({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <Link href="/" aria-label="SUTURA home" className={`mx-auto flex w-fit flex-col items-center text-espresso ${className}`}>
      <SuturaMark className="h-20 w-20" />
      {/* Wordmark alone (box of the outlined letters), same drawing as in the header logo. */}
      <svg viewBox={WORDMARK_VIEWBOX} className="mt-3 h-7 w-auto" aria-hidden focusable="false">
        <path fill="currentColor" d={WORDMARK} />
      </svg>
      <span className="mobile-overline mt-2 text-taupe-dark">Find · Fit · Track · Pick Up</span>
    </Link>
  );
}
