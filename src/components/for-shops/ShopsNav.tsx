import Link from 'next/link';
import SuturaLogo from '@/components/brand/SuturaLogo';
import ShopsContainer from './ShopsContainer';
import { SECTION_LINKS, SIGN_IN_HREF, TRIAL_HREF } from './shopsLinks';

/** Frosted sticky header: logo (back to the main site), section links from tablet up, and the two actions. Same container as every section. */
export default function ShopsNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <ShopsContainer className="flex h-[52px] items-center justify-between gap-3 sm:h-[60px]">
        <Link href="/" aria-label="SUTURA home" className="flex min-h-11 shrink-0 items-center">
          <SuturaLogo className="h-7 w-auto text-espresso sm:h-8" />
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-1 sm:flex">
          {SECTION_LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="tablet-nav-link flex min-h-11 items-center rounded-lg px-3 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink">
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href={SIGN_IN_HREF} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink transition-colors hover:bg-sunken">
            Sign in
          </Link>
          <Link href={TRIAL_HREF} className="flex min-h-11 items-center rounded-[10px] bg-ink px-4 text-sm font-semibold text-white transition-transform hover:bg-espresso active:scale-[0.98]">
            <span className="sm:hidden">Free trial</span>
            <span className="hidden sm:inline">Start free trial</span>
          </Link>
        </div>
      </ShopsContainer>
    </header>
  );
}
