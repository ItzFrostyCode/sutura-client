import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SuturaLogo from '@/components/brand/SuturaLogo';
import ShopsContainer from './ShopsContainer';
import { APPLY_HREF, SECTION_LINKS, SIGN_IN_HREF, TRIAL_HREF } from './shopsLinks';

const footLink = 'flex min-h-11 items-center text-sm text-white/70 transition-colors hover:text-white';

/** Closing call to action and footer in one dark espresso block, on the same container as the rest of the page. */
export default function ShopsFooter() {
  return (
    <footer className="bg-espresso text-white">
      <ShopsContainer className="py-14 sm:py-16">
        <h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">Ready when your shop is.</h2>
        <p className="mobile-body-lg mt-3 max-w-xl text-white/75">Apply today. Once the team verifies your documents, the first 14 days are free.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href={TRIAL_HREF} className="btn-primary-mobile rounded-[10px] bg-amber-300 px-6 text-espresso transition-transform hover:bg-amber-200 active:scale-[0.98]">
            Start free trial <ArrowRight size={18} />
          </Link>
          <Link href={SIGN_IN_HREF} className="btn-secondary-mobile rounded-[10px] border border-white/25 px-6 text-white transition-colors hover:bg-white/10">Sign in</Link>
        </div>

        <div className="mt-12 grid gap-8 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <SuturaLogo halo="#2B1E1A" className="h-8 w-auto text-white" />
            <p className="mobile-body-sm mt-3 max-w-xs text-white/70">A web-based tailoring store tracker for Davao City.</p>
          </div>
          <div>
            <p className="mobile-overline text-white">On this page</p>
            <ul className="mt-2">{SECTION_LINKS.map((l) => <li key={l.href}><a href={l.href} className={footLink}>{l.label}</a></li>)}</ul>
          </div>
          <div>
            <p className="mobile-overline text-white">Account</p>
            <ul className="mt-2">
              <li><Link href={APPLY_HREF} className={footLink}>Open a shop</Link></li>
              <li><Link href={SIGN_IN_HREF} className={footLink}>Shop sign in</Link></li>
            </ul>
          </div>
          <div>
            <p className="mobile-overline text-white">For customers</p>
            <ul className="mt-2">
              <li><Link href="/" className={footLink}>Discover shops</Link></li>
              <li><Link href="/about" className={footLink}>About SUTURA</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/15 pt-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SUTURA. All rights reserved.</p>
          <a href="#top" className="flex min-h-11 items-center text-white/70 hover:text-white">Back to top ↑</a>
        </div>
      </ShopsContainer>
    </footer>
  );
}
