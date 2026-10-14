'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Info, Map as MapIcon, User } from 'lucide-react';

import { usesBottomNav } from './bottomNavPaths';

interface PublicBottomNavProps {
  readonly accountHref: string;
}

/**
 * Discover, Map, About, Profile as icons only (Notifications sits at the top, beside Order Tracking), in a solid rounded bar that floats above the bottom edge,
 * at every screen size. Drawn on <body> so a transformed parent can't move it.
 */
export default function PublicBottomNav({ accountHref }: PublicBottomNavProps) {
  const pathname = usePathname() ?? '/';
  const [mounted, setMounted] = useState(false);
  const visible = usesBottomNav(pathname);

  useEffect(() => setMounted(true), []);
  // /search is a fixed-height screen that already leaves room for the bar, so it must not get extra padding.
  const padsPage = visible && pathname !== '/search';
  useEffect(() => {
    if (!padsPage) return;
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, [padsPage]);

  if (!mounted || !visible) return null;

  const items = [
    { label: 'Discover', href: '/', Icon: Compass, active: pathname === '/' || pathname.startsWith('/categories') },
    { label: 'Map', href: '/search', Icon: MapIcon, active: pathname.startsWith('/search') },
    { label: 'About', href: '/about', Icon: Info, active: pathname === '/about' },
    { label: 'Profile', href: accountHref, Icon: User, active: pathname.startsWith('/account') },
  ];

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      <nav
        aria-label="Main"
        className="pointer-events-auto flex h-14 w-full max-w-[var(--col-w)] items-center rounded-full border border-line bg-surface px-2 shadow-[0_4px_20px_rgba(45,42,38,0.14)]"
      >
        {items.map(({ label, href, Icon, active }) => (
          <Link
            key={label}
            href={href}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className="flex h-12 min-w-0 flex-1 items-center justify-center transition-opacity active:opacity-60"
          >
            <span className={`relative flex h-10 w-14 items-center justify-center rounded-full transition-colors ${active ? 'bg-taupe/20 text-taupe-dark' : 'text-ink-muted'}`}>
              <Icon size={26} strokeWidth={active ? 2.25 : 1.75} />
            </span>
          </Link>
        ))}
      </nav>
    </div>,
    document.body,
  );
}
