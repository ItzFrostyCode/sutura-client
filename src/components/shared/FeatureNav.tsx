'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Info, MapPin, MessageCircleQuestion, type LucideIcon } from 'lucide-react';

// SUTURA's customer shortcuts (Map, Discover, Ask SUTURA, About), as a
// floating cream bar centred at the bottom of the screen on every screen
// size (after tarakape.cc). Pages keep content clear of it with --fnav-h
// (globals.css).
const FEATURES: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Map', href: '/map', icon: MapPin },
  // Every apparel category and service (what the header's MEN/WOMEN/KIDS/
  // SERVICES menus used to hold). Track Order lives in the header icons.
  { label: 'Discover', href: '/categories', icon: Compass },
  { label: 'Ask SUTURA', href: '/ask', icon: MessageCircleQuestion },
  // The About section on the landing page (HomeAboutSection, id="about").
  { label: 'About', href: '/#about', icon: Info },
];

const isActive = (pathname: string, href: string) => !href.includes('#') && (pathname === href || pathname.startsWith(`${href}/`));

/** Fixed bottom bar, so it can render anywhere in the tree. */
export default function FeatureNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      aria-label="SUTURA features"
      // Below drawers (z-55) and modals (z-50) so it never covers them. The
      // full-width strip ignores clicks; only the card itself takes them.
      className="feature-nav-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="pointer-events-auto grid h-16 w-full max-w-md grid-cols-4 rounded-3xl border border-line bg-[#FFFCF7]/95 px-2 shadow-[0_8px_30px_rgba(45,42,38,0.14)] backdrop-blur-sm">
        {FEATURES.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] leading-tight transition-[color,transform] duration-200 ease-out active:scale-95 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe sm:text-xs ${
                  active ? 'font-semibold text-[#5A3E2B]' : 'font-medium text-[#866B5E] hover:text-[#5A3E2B]'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.75} aria-hidden="true" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
