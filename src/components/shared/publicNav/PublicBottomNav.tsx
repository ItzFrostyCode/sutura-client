'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Map as MapIcon, Package, User } from 'lucide-react';

import { AUTH_PATHS, usesCustomerNavOn } from './bottomNavPaths';
import { useShopAccount } from '@/hooks/useShopAccount';
import { usePublicNav } from './usePublicNav';
import { useTrackOrderLink } from './useTrackOrderLink';
import { lastSearchHref } from '@/lib/lastSearch';

interface PublicBottomNavProps {
  readonly accountHref?: string;
}

/**
 * Discover, Map, Track, Profile — the customer's three thesis jobs (find a shop, see it on the map, follow the order)
 * plus their account. Icon + label in a dark brown rounded bar floating above the bottom edge, on phones and tablets;
 * from 1024px it is hidden and PublicNav's header carries the same links. Ask SUTURA and About live in the footer.
 *
 * Hosted persistently in RootLayout so its DOM node stays in the exact same position across page transitions.
 */
export default function PublicBottomNav({ accountHref: propAccountHref }: PublicBottomNavProps = {}) {
  const pathname = usePathname() ?? '/';
  const [mounted, setMounted] = useState(false);
  const [isEmbed, setIsEmbed] = useState(false);
  const { accountHref, unreadCount } = usePublicNav();
  const track = useTrackOrderLink();
  const { isShopAccount } = useShopAccount();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsEmbed(new URLSearchParams(window.location.search).get('embed') === '1');
    }
  }, [pathname]);

  const visible = usesCustomerNavOn(pathname, isShopAccount) && !isEmbed;

  // /search is a fixed-height screen that already leaves room for the bar, so it must not get extra padding.
  const padsPage = visible && pathname !== '/search';
  useEffect(() => {
    if (!padsPage) return;
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, [padsPage]);

  if (!mounted || !visible) return null;

  const targetAccountHref = propAccountHref || accountHref || '/account';
  const onTrack = pathname.startsWith('/track') || pathname.startsWith('/account/orders');

  const items = [
    {
      label: 'Discover',
      href: '/',
      Icon: Compass,
      active: pathname === '/' || pathname.startsWith('/categories') || pathname.startsWith('/shops') || pathname.startsWith('/stores') || pathname.startsWith('/store/'),
    },
    {
      label: 'Map',
      // Back to where the person left the Map (search, list / map, open shop), not a fresh one.
      href: lastSearchHref(),
      Icon: MapIcon,
      active: pathname.startsWith('/search') || pathname.startsWith('/map'),
    },
    {
      label: track.short,
      href: track.href,
      Icon: Package,
      active: onTrack,
    },
    {
      label: 'Profile',
      href: targetAccountHref,
      Icon: User,
      active: (pathname.startsWith('/account') && !onTrack) || AUTH_PATHS.includes(pathname),
      // The bell lives in Profile on a phone / tablet (no bell on the Map), so its unread count shows here.
      badge: unreadCount,
    },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 lg:hidden"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label="Main"
        className="pointer-events-auto flex h-16 w-full max-w-[var(--col-w)] items-center rounded-full bg-nav-bar px-2 shadow-[0_6px_24px_rgba(45,42,38,0.28)]"
      >
        {items.map(({ label, href, Icon, active, badge }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            aria-label={badge ? `${label}, ${badge} unread notification${badge > 1 ? 's' : ''}` : undefined}
            className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-70 ${
              active ? 'text-white' : 'text-nav-inactive hover:text-white'
            }`}
          >
            <span className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${active ? 'bg-taupe-dark' : ''}`}>
              <Icon size={21} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              {badge ? (
                <span aria-hidden className="absolute -right-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-nav-bar">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </span>
            <span className={`whitespace-nowrap text-xs leading-none ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
