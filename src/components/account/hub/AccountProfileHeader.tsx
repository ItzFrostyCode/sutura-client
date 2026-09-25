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

// No back arrow — PublicNav's own hamburger/logo already sits above this
// (the Me hub is /account's root, not a drill-down), so a back button here
// was redundant.
export default function AccountProfileHeader({ user }: Readonly<AccountProfileHeaderProps>) {
  return (
    <header className="-mx-4 sm:-mx-6 -mt-4 bg-surface border-b border-line flex items-center gap-2 px-3 sm:px-4 h-[52px] sm:h-[56px] mb-4">
      <Link
        href="/account/settings/account"
        aria-label="My Profile"
        className="w-9 h-9 rounded-full bg-sunken overflow-hidden relative shrink-0"
      >
        {user.profile_picture ? (
          <Image
            src={getMediaUrl(user.profile_picture)}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UserIcon size={16} className="text-ink-faint" />
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1 pl-1">
        <p className="mobile-h4 text-ink font-semibold truncate leading-tight">{user.name}</p>
        <p className="mobile-caption text-ink-muted truncate font-normal">{user.email}</p>
      </div>

      <Link
        href="/account/settings"
        aria-label="Manage Account"
        className="btn-icon-mobile text-ink-muted hover:text-ink touch-target-48"
      >
        <Settings size={22} />
      </Link>
    </header>
  );
}
