'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Info, Map as MapIcon, MessageCircleQuestion, User } from 'lucide-react';

import { AUTH_PATHS, usesBottomNav } from './bottomNavPaths';
import { usePublicNav } from './usePublicNav';

interface PublicBottomNavProps {
  readonly accountHref?: string;
}

/**
 * Discover, Map, Ask SUTURA, About, Profile — icon + label (Notifications sits at the top, beside Order Tracking), in a dark brown
 * rounded bar that floats above the bottom edge, at every screen size. The active tab: white icon on a brown circle,
 * white label; the others: soft beige.
 *
 * Hosted persistently in RootLayout so its DOM node stays in the exact same position across page transitions.
 */
export default function PublicBottomNav({ accountHref: propAccountHref }: PublicBottomNavProps = {}) {
  const pathname = usePathname() ?? '/';
  const [mounted, setMounted] = useState(false);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const visible = usesBottomNav(pathname) && !isIframe;
  const { accountHref } = usePublicNav();

  useEffect(() => setMounted(true), []);

  // /search is a fixed-height screen that already leaves room for the bar, so it must not get extra padding.
  const padsPage = visible && pathname !== '/search';
  useEffect(() => {
    if (!padsPage || isIframe) return;
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, [padsPage, isIframe]);

  if (!mounted || !visible || isIframe) return null;

  const targetAccountHref = propAccountHref || accountHref || '/account';

  const items = [
    {
      label: 'Discover',
      href: '/',
      Icon: Compass,
      active:
        pathname === '/' ||
        pathname.startsWith('/categories') ||
        pathname.startsWith('/shops') ||
        pathname.startsWith('/stores'),
    },
    {
      label: 'Map',
      href: '/search',
      Icon: MapIcon,
      active: pathname.startsWith('/search') || pathname.startsWith('/map'),
    },
    {
      label: 'Ask SUTURA',
      short: 'Ask',
      href: '/ask',
      Icon: MessageCircleQuestion,
      active: pathname === '/ask',
    },
    {
      label: 'About',
      href: '/about',
      Icon: Info,
      active: pathname === '/about',
    },
    {
      label: 'Profile',
      href: targetAccountHref,
      Icon: User,
      active: pathname.startsWith('/account') || AUTH_PATHS.includes(pathname),
    },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label="Main"
        className="pointer-events-auto flex h-16 w-full max-w-[var(--col-w)] items-center rounded-full bg-nav-bar px-2 shadow-[0_6px_24px_rgba(45,42,38,0.28)]"
      >
        {items.map(({ label, short, href, Icon, active }) => (
          <Link
            key={label}
            href={href}
            aria-label={short ? label : undefined}
            aria-current={active ? 'page' : undefined}
            className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-70 ${
              active ? 'text-white' : 'text-nav-inactive hover:text-white'
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                active ? 'bg-taupe-dark' : ''
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            </span>
            <span
              className={`whitespace-nowrap text-[11px] leading-none ${
                active ? 'font-semibold' : 'font-medium'
              }`}
            >
              {short ? (
                <>
                  <span className="max-[359px]:hidden">{label}</span>
                  <span className="min-[360px]:hidden">{short}</span>
                </>
              ) : (
                label
              )}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
