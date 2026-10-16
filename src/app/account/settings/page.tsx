'use client';

import { useRouter } from 'next/navigation';
import { User as UserIcon, MapPin, Bell, LifeBuoy, BookOpen, LogOut, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import AccountHeader from '@/components/account/AccountHeader';
import HubGroup from '@/components/account/hub/HubGroup';
import HubRow from '@/components/account/hub/HubRow';
import { useSavedLocation } from '@/components/location/hooks/useSavedLocation';

interface SettingsRow {
  label: string;
  Icon: LucideIcon;
  href: string;
}

// Rows with a real destination. "My Location" is built separately below: it shows where you are now and opens /location.
const SECTIONS: { title: string; rows: SettingsRow[] }[] = [
  {
    title: 'Settings',
    rows: [
      { label: 'Notification Settings', Icon: Bell, href: '/account/settings/notifications' },
    ],
  },
  {
    title: 'Support',
    rows: [
      { label: 'Support Ticket', Icon: LifeBuoy, href: '/account/settings/support' },
      { label: 'Welcome Guide', Icon: BookOpen, href: '/account/settings/guide' },
    ],
  },
];

export default function AccountSettingsMenuPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const location = useSavedLocation();
  // Where "My Location" returns to once a place is chosen.
  const locationHref = `/location?returnTo=${encodeURIComponent('/account/settings')}`;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div>
      <AccountHeader title="Account Settings" backHref="/account" />

      <div className="space-y-4">
        <HubGroup title="My Account">
          <HubRow href="/account/settings/account" Icon={UserIcon} title="Account" />
          <HubRow
            href={locationHref}
            Icon={MapPin}
            title="My Location"
            subtitle={location ? (location.address || 'Davao City') : 'Set your location'}
          />
        </HubGroup>

        {SECTIONS.map((section) => (
          <HubGroup key={section.title} title={section.title}>
            {section.rows.map((row) => <HubRow key={row.label} href={row.href} Icon={row.Icon} title={row.label} />)}
          </HubGroup>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="card-soft flex min-h-14 w-full items-center justify-center gap-2 px-4 text-sm font-semibold text-danger transition-opacity active:opacity-70"
        >
          <LogOut size={16} /> Switch Account / Logout
        </button>
      </div>
    </div>
  );
}
