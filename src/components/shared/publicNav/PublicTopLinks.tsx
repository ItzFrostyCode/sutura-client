'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrackOrderLink } from './useTrackOrderLink';
import { useEffect, useState } from 'react';
import { lastSearchHref } from '@/lib/lastSearch';

const startsWithAny = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/** Tablet and desktop: the same three jobs as the bottom bar (find, map, track), centered in the header. */
export default function PublicTopLinks() {
  const pathname = usePathname() ?? '/';
  const track = useTrackOrderLink();
  // Back to where the person left the Map (read after mount: the saved address lives in this tab's sessionStorage).
  const [mapHref, setMapHref] = useState('/search');
  useEffect(() => { setMapHref(lastSearchHref()); }, [pathname]);

  // Map is the combined search + map screen; Discover covers the browsing pages that hang off the landing page.
  const links = [
    { label: 'Discover', href: '/', active: pathname === '/' || startsWithAny(pathname, ['/categories', '/shops', '/stores']) },
    { label: 'Map', href: mapHref, active: startsWithAny(pathname, ['/search', '/map', '/location']) },
    { label: track.label, href: track.href, active: startsWithAny(pathname, ['/track', '/account/orders']) },
  ];

  return (
    <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 sm:flex">
      {links.map(({ label, href, active }) => (
        <Link
          key={label}
          href={href}
          aria-current={active ? 'page' : undefined}
          className={`flex min-h-11 items-center border-b-2 px-4 text-sm transition-colors ${
            active ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          {/* Each label keeps the width of its bold self (an invisible bold copy in the same grid cell), so the active
              label turning bold never nudges the centred row from page to page. */}
          <span className="grid">
            <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">{label}</span>
            <span className={`col-start-1 row-start-1 text-center ${active ? 'font-semibold' : ''}`}>{label}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
