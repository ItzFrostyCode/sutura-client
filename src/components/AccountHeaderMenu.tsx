'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { ArrowLeftRight, ChevronDown, Eye, LayoutDashboard, Receipt, UserCog, User as UserIcon, LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { getMediaUrl } from '@/lib/media';
import { roleLabel } from '@/components/staff/staffHelpers';
import { useAccountSwitch } from '@/hooks/useAccountSwitch';
import { isShopAccount } from '@/lib/savedAccounts';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { PLAN_TONE } from '@/components/admin/ui/PlanPill';

// The account-menu cluster (bell + profile dropdown) from the dashboard
// header, extracted so the storefront page can show the exact same thing for
// the owner instead of a second, differently-built header. The dashboard's
// own Premium Plan badge and branch switcher are deliberately left out here —
// both are dashboard-data-scoping concepts with no meaning on a public page.
export default function AccountHeaderMenu() {
  const { user, store, staffProfile, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isStoreOwner = user?.roles?.some(r => r.name === 'store_owner');
  const roleDisplay = staffProfile?.role
    ? roleLabel(staffProfile.role)
    : (user?.roles?.[0]?.name ? roleLabel(user.roles[0].name) : 'Shop Owner');

  // This menu renders both in the dashboard header and (reused, per the
  // comment above) on the owner's own public storefront page. "My
  // Storefront" linking to the storefront is pointless when you're already
  // standing on it — flip it to "My Management" pointing back at the
  // dashboard instead, whenever we're currently on a /store/ route.
  const isOnStorefront = pathname?.startsWith('/store/') ?? false;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  // Accounts kept by "Log in as Shop Owner" (e.g. the owner's Gmail customer account): back in one tap.
  const { others, switchTo, switching } = useAccountSwitch();
  const { tier, loading: tierLoading } = useSubscriptionTier();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      logout();
      router.replace('/login'); // signed out: Back must not reopen the dashboard
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
      <NotificationBell />

      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          aria-expanded={isProfileOpen}
          aria-haspopup="true"
          aria-label="Account menu"
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors cursor-pointer"
        >
          {user?.profile_picture && !photoFailed ? (
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(user.profile_picture)} alt={user.name ?? 'Profile'} onError={() => setPhotoFailed(true)} className="h-full w-full object-cover" />
            </div>
          ) : (
            // No photo yet: the same sunken avatar treatment as the /account sidebar — a person icon, not a text initial.
            <div className="w-10 h-10 rounded-full bg-sunken border border-line-strong flex items-center justify-center">
              <UserIcon size={16} className="text-ink-faint" />
            </div>
          )}
          {/* A solid grey disc: the translucent hairline colour went dark over the photo. */}
          <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-gray-200 rounded-full border-[1.5px] border-white flex items-center justify-center text-ink-body">
            <ChevronDown size={12} strokeWidth={3} />
          </div>
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-3 w-64 max-w-[calc(100vw-1rem)] bg-white rounded-xl border border-line py-2 z-50 shadow-lg">
            <div className="px-4 py-3 border-b border-line mb-2">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm font-semibold text-ink truncate">{user?.name}</p>
                {store?.id && !tierLoading && (
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PLAN_TONE[tier] ?? PLAN_TONE.basic}`}>
                    {tier}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted truncate font-medium mt-0.5">{roleDisplay}</p>
            </div>

            {isOnStorefront ? (
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
                <LayoutDashboard size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">My Management</span>
              </Link>
            ) : (
              <Link href={store?.slug ? `/store/${store.slug}` : '/dashboard/profile'} className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
                <Eye size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">My Store Profile</span>
              </Link>
            )}

            {isStoreOwner && (
              <Link href="/dashboard/billing" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
                <Receipt size={16} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">Billing &amp; Plans</span>
                {!tierLoading && tier !== 'premium' && (
                  <span className="shrink-0 rounded-full border border-taupe/30 bg-taupe/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-taupe-dark">
                    Upgrade
                  </span>
                )}
              </Link>
            )}
            <Link href="/dashboard/account-settings" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
              <UserCog size={16} /> Account Settings
            </Link>
            {others.map((a) => (
              <button
                key={a.user.id}
                type="button"
                disabled={switching}
                onClick={() => void switchTo(a)}
                className="w-full flex items-start gap-3 px-4 py-2.5 text-left text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors disabled:opacity-60"
              >
                <ArrowLeftRight size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block">{isShopAccount(a) ? 'Switch to shop account' : 'Switch to customer account'}</span>
                  <span className="block truncate text-xs text-ink-muted">{a.user.name}</span>
                </span>
              </button>
            ))}
            <div className="h-px bg-line my-1"></div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-danger hover:bg-sunken transition-colors text-left"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
