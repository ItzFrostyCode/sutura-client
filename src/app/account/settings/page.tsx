'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon, MapPin, ListChecks, Bell,
  LifeBuoy, BookOpen, Info, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import AccountHeader from '@/components/account/AccountHeader';

interface SettingsRow {
  label: string;
  Icon: typeof UserIcon;
  href: string;
}

// The grouped Account Settings menu — reached from the Me hub's gear icon.
// Every row is a real, navigable destination — "Account" edits real data;
// My Location/Order Settings/Notification Settings/Support Ticket land on
// an honest "coming soon" screen rather than faking a working feature (no
// backend for any of those four yet); Welcome Guide/About are real static
// content, no backend needed for either.
const SECTIONS: { title: string; rows: SettingsRow[] }[] = [
  {
    title: 'My Account',
    rows: [
      { label: 'Account', Icon: UserIcon, href: '/account/settings/account' },
      { label: 'My Location', Icon: MapPin, href: '/account/settings/location' },
    ],
  },
  {
    title: 'Settings',
    rows: [
      { label: 'Order Settings', Icon: ListChecks, href: '/account/settings/orders' },
      { label: 'Notification Settings', Icon: Bell, href: '/account/settings/notifications' },
    ],
  },
  {
    title: 'Support',
    rows: [
      { label: 'Support Ticket', Icon: LifeBuoy, href: '/account/settings/support' },
      { label: 'Welcome Guide', Icon: BookOpen, href: '/account/settings/guide' },
      { label: 'About', Icon: Info, href: '/account/settings/about' },
    ],
  },
];

export default function AccountSettingsMenuPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div>
      <AccountHeader title="Account Settings" backHref="/account" />

      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2 ml-1">{section.title}</p>
            <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
              {section.rows.map((row) => (
                <Link key={row.label} href={row.href} className="flex items-center gap-3 px-4 py-3.5">
                  <row.Icon size={17} className="text-ink-muted shrink-0" />
                  <span className="flex-1 text-sm text-ink truncate">{row.label}</span>
                  <ChevronRight size={15} className="text-ink-faint shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-line rounded-2xl text-sm font-semibold text-danger"
        >
          <LogOut size={16} /> Switch Account / Logout
        </button>
      </div>
    </div>
  );
}
