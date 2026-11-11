import Link from 'next/link';
import { MapPin } from 'lucide-react';
import SuturaLogo from '@/components/brand/SuturaLogo';
import { HOME_COLUMN } from './homeLayout';

const COLUMNS = [
  { title: 'Discover', links: [{ href: '/search', label: 'Search shops' }, { href: '/search?tab=store', label: 'Browse the map' }, { href: '/track', label: 'Track an order' }] },
  { title: 'Account', links: [{ href: '/login', label: 'Sign in' }, { href: '/register', label: 'Create an account' }, { href: '/for-shops', label: 'Register your shop' }] },
  { title: 'Help', links: [{ href: '/ask', label: 'Ask SUTURA' }, { href: '/about', label: 'About SUTURA' }, { href: '/terms', label: 'Terms' }, { href: '/privacy', label: 'Privacy' }] },
];

const link = 'mobile-body-sm flex min-h-11 items-center text-white/75 transition-colors hover:text-white';

/**
 * Dark footer, so the page has a clear end. Under 1024px the floating bottom bar sits over the page's last 88px: the
 * footer reaches into that room (negative margin + the same padding) so no cream strip shows under it.
 * Same 960px column as the top bar and the page content on every page that uses it.
 */
export default function HomeFooter() {
  return (
    <footer className="mt-16 bg-espresso text-white max-lg:-mb-[calc(88px+env(safe-area-inset-bottom))] max-lg:pb-[calc(88px+env(safe-area-inset-bottom))]">
      <div className={`${HOME_COLUMN} py-10`}>
        <SuturaLogo tone="dark" className="h-9 w-auto text-white" />
        <p className="mobile-body-sm mb-8 mt-2 text-white/75">A web-based tailoring shop tracker for Davao City.</p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
          {COLUMNS.map(({ title, links }) => (
            <nav key={title} aria-label={title}>
              <p className="mobile-overline mb-1 text-white">{title}</p>
              <ul>
                {links.map(({ href, label }) => (
                  <li key={label}><Link href={href} className={link}>{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/15 pt-5 sm:flex-row sm:items-center">
          <p className="mobile-caption text-white/70">© {new Date().getFullYear()} SUTURA. All rights reserved.</p>
          <p className="mobile-caption flex items-center gap-1.5 text-white/70"><MapPin size={13} aria-hidden /> Davao City, Philippines</p>
        </div>
      </div>
    </footer>
  );
}
