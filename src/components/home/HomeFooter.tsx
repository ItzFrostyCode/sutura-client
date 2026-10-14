import Link from 'next/link';
import { MapPin } from 'lucide-react';
import SuturaLogo from '@/components/brand/SuturaLogo';

const COLUMNS = [
  { title: 'Discover', links: [{ href: '/search', label: 'Search stores' }, { href: '/search', label: 'Browse map' }, { href: '/track', label: 'Track an order' }] },
  { title: 'Account', links: [{ href: '/login', label: 'Log in' }, { href: '/register', label: 'Register a store' }] },
  { title: 'About', links: [{ href: '/about', label: 'About SUTURA' }] },
];

const link = 'mobile-body-sm flex min-h-[36px] items-center text-ink-muted transition-colors hover:text-ink';

/** Quiet light footer. `narrow` lines it up with the landing page's wider side margins. */
export default function HomeFooter({ narrow = false }: { readonly narrow?: boolean }) {
  return (
    <footer className="mt-16 border-t border-line">
      <div className={narrow ? 'mx-auto max-w-[960px] px-6 py-10 sm:px-12 lg:px-0' : 'mx-auto max-w-7xl py-10 mobile-screen-margins'}>
        <SuturaLogo className="h-8 w-auto text-espresso" />
        <p className="mobile-body-sm mb-8 mt-1.5 text-ink-muted">A web-based tailoring store tracker for Davao City.</p>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map(({ title, links }) => (
            <div key={title}>
              <p className="mobile-overline mb-2 text-ink">{title}</p>
              <ul>
                {links.map(({ href, label }) => (
                  <li key={label}><Link href={href} className={link}>{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-line pt-5 sm:flex-row sm:items-center">
          <p className="mobile-caption text-ink-faint">© {new Date().getFullYear()} SUTURA. All rights reserved.</p>
          <p className="mobile-caption flex items-center gap-1.5 text-ink-faint"><MapPin size={13} className="text-taupe" /> Davao City, Philippines</p>
        </div>
      </div>
    </footer>
  );
}
