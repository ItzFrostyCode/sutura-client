'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { ChevronDown, Eye, LayoutDashboard, Receipt, UserCog, LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

// The account-menu cluster (bell + profile dropdown) from the dashboard
// header, extracted so the storefront page can show the exact same thing for
// the owner instead of a second, differently-built header. The dashboard's
// own Premium Plan badge and branch switcher are deliberately left out here —
// both are dashboard-data-scoping concepts with no meaning on a public page.
export default function AccountHeaderMenu() {
  const { user, shop, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  // This menu renders both in the dashboard header and (reused, per the
  // comment above) on the owner's own public storefront page. "My
  // Storefront" linking to the storefront is pointless when you're already
  // standing on it — flip it to "My Management" pointing back at the
  // dashboard instead, whenever we're currently on a /shop/ route.
  const isOnStorefront = pathname?.startsWith('/shop/') ?? false;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <NotificationBell />

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-taupe flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-line rounded-full border-[1.5px] border-white flex items-center justify-center text-ink-body">
            <ChevronDown size={12} strokeWidth={3} />
          </div>
        </button>

        {isProfileOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl border border-line py-2 z-50">
            <div className="px-4 py-3 border-b border-line mb-2">
              <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
              <p className="text-xs text-ink-muted truncate">{user?.roles?.[0]?.name?.replace('_', ' ') || 'Shop Owner'}</p>
            </div>

            {isOnStorefront ? (
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
                <LayoutDashboard size={16} /> My Management
              </Link>
            ) : (
              <Link href={shop?.slug ? `/shop/${shop.slug}` : '/dashboard/profile'} className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
                <Eye size={16} /> My Storefront
              </Link>
            )}

            <Link href="/dashboard/billing" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
              <Receipt size={16} /> Billing & Plans
            </Link>
            <Link href="/dashboard/account-settings" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-ink-body hover:bg-sunken hover:text-ink transition-colors" onClick={() => setIsProfileOpen(false)}>
              <UserCog size={16} /> Account Settings
            </Link>
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
