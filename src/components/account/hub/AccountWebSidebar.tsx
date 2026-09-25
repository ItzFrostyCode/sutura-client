'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Calendar,
  Bell,
  Ruler,
  Star,
  Clock,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';

interface AccountWebSidebarProps {
  user: {
    name: string;
    email: string;
    profile_picture?: string | null;
  };
}

// Same grouping as /account/settings' own SECTIONS list — flattened into
// one group here (Shopee's "My Account" groups Profile/Banks & Cards/
// Addresses/etc. together the same way), so a desktop visitor never has to
// pass through the settings hub page at all to reach a specific setting.
const SETTINGS_CHILDREN = [
  { href: '/account/settings/account', label: 'Profile' },
  { href: '/account/settings/location', label: 'My Location' },
  { href: '/account/settings/orders', label: 'Order Settings' },
  { href: '/account/settings/notifications', label: 'Notification Settings' },
  { href: '/account/settings/support', label: 'Support Ticket' },
  { href: '/account/settings/guide', label: 'Welcome Guide' },
  { href: '/account/settings/about', label: 'About' },
];

const TOP_LINKS = [
  { href: '/account', label: 'Dashboard Overview', icon: LayoutDashboard },
];

const MID_LINKS = [
  { href: '/account/orders', label: 'My Job Orders', icon: Package },
  { href: '/account/appointments', label: 'Appointments & Fittings', icon: Calendar },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/measurements', label: 'My Measurements', icon: Ruler },
  { href: '/account/ratings', label: 'My Ratings', icon: Star },
  { href: '/account/recently-viewed', label: 'Recently Viewed', icon: Clock },
];

function isPathActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountWebSidebar({ user }: Readonly<AccountWebSidebarProps>) {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const settingsSectionActive = pathname.startsWith('/account/settings');

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
      isActive ? 'bg-taupe text-white' : 'text-ink-body hover:bg-sunken hover:text-ink'
    }`;

  return (
    <aside className="w-64 shrink-0 bg-surface border border-line sticky top-20 self-start space-y-6 p-5">
      {/* Profile summary — links straight to Account Settings > Profile */}
      <Link
        href="/account/settings/account"
        className="flex items-center gap-3.5 pb-4 border-b border-line hover:opacity-80 transition-opacity cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-sunken overflow-hidden relative shrink-0 border border-line">
          {user.profile_picture ? (
            <Image
              src={getMediaUrl(user.profile_picture)}
              alt={user.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-faint">
              <UserIcon size={20} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink truncate leading-snug">{user.name}</p>
          <p className="text-xs text-ink-muted truncate font-normal">{user.email}</p>
          <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-sunken text-taupe">
            Customer
          </span>
        </div>
      </Link>

      {/* Navigation items */}
      <nav className="space-y-1" aria-label="Account navigation">
        {TOP_LINKS.map((item) => {
          const isActive = isPathActive(pathname, item.href, true);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={navItemClass(isActive)}>
              <Icon size={16} className={isActive ? 'text-white' : 'text-taupe'} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Account Settings group — children only expand while a settings
            route is active, matching the reference's contextual accordion
            (other groups collapse to just their label when not active). */}
        <Link
          href="/account/settings"
          className={navItemClass(pathname === '/account/settings')}
        >
          <Settings size={16} className={settingsSectionActive ? 'text-white' : 'text-taupe'} />
          <span>Account Settings</span>
        </Link>
        {settingsSectionActive && (
          <div className="ml-4 pl-3 border-l border-line space-y-0.5">
            {SETTINGS_CHILDREN.map((child) => {
              const isActive = isPathActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isActive ? 'text-taupe font-bold' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}

        {MID_LINKS.map((item) => {
          const isActive = isPathActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={navItemClass(isActive)}>
              <Icon size={16} className={isActive ? 'text-white' : 'text-taupe'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-danger hover:bg-danger/5 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
