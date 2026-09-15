'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';

const LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/map', label: 'Map' },
  { href: '/track', label: 'Track Order' },
];

/**
 * Shared header for the public discovery surfaces (Search, Map, Track) —
 * shop/[shop_id]/page.tsx hand-rolls its own version of this same bar; this
 * one exists so Search/Map/Track don't each repeat that a third time.
 */
export default function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line bg-surface sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/search" className="flex items-center gap-2">
          <BrandLogo iconOnly className="w-8 h-8" />
          <span className="font-serif font-bold text-lg tracking-tight text-ink">SUTURA</span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-taupe bg-sunken' : 'text-ink-muted hover:text-ink hover:bg-sunken'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    </nav>
  );
}
