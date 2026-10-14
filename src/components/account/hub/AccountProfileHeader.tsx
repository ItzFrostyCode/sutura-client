'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Settings, User as UserIcon } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

interface AccountProfileHeaderProps {
  user: {
    name: string;
    email: string;
    profile_picture?: string | null;
  };
}

// A soft profile card: the avatar and name open the profile (name, email, photo); the gear opens the account settings
// (My Location, notifications, support…). No back arrow — this is the Me hub's root, not a drill-down.
export default function AccountProfileHeader({ user }: Readonly<AccountProfileHeaderProps>) {
  return (
    <div className="card-soft flex items-center gap-1 p-3 pr-2">
      <Link href="/account/settings/account" aria-label="My Profile" className="flex min-w-0 flex-1 items-center gap-3 transition-opacity active:opacity-80">
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-line-strong bg-sunken">
          {user.profile_picture ? (
            <Image src={getMediaUrl(user.profile_picture)} alt="" fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <UserIcon size={24} className="text-ink-faint" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mobile-h4 block truncate text-ink">{user.name}</span>
          <span className="mobile-caption block truncate text-ink-muted">{user.email}</span>
        </span>
      </Link>

      <Link href="/account/settings" aria-label="Account settings" className="btn-icon-mobile touch-target-48 text-ink-muted transition-opacity hover:text-ink active:opacity-70">
        <Settings size={22} />
      </Link>
    </div>
  );
}
