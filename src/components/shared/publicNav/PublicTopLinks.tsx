'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const startsWithAny = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

// Map is the combined search + map screen; Discover covers the browsing pages that hang off the landing page.
const LINKS = [
  { label: 'Discover', href: '/', isActive: (p: string) => p === '/' || startsWithAny(p, ['/categories', '/shops', '/stores']) },
  { label: 'Map', href: '/search', isActive: (p: string) => startsWithAny(p, ['/search', '/map', '/location']) },
  { label: 'About', href: '/about', isActive: (p: string) => p === '/about' },
];

/** Tablet and desktop: the three main destinations, centered in the header. Phones use the bottom navigation. */
export default function PublicTopLinks() {
  const pathname = usePathname() ?? '/';

  return (
    <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 sm:flex">
      {LINKS.map(({ label, href, isActive }) => {
        const active = isActive(pathname);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center border-b-2 px-4 text-sm transition-colors ${
              active ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
