'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { useAdminNotificationStore } from '@/store/useAdminNotificationStore';
import { ADMIN_NAV, isActiveAdminPath } from './adminNav';
import SignOutConfirmModal from './SignOutConfirmModal';
import AdminNotificationBell from './AdminNotificationBell';
import SuturaLogo from '@/components/brand/SuturaLogo';

/**
 * System Admin console frame: session guard + dark rail. The dark rail is
 * deliberate — the owner dashboard is light, so an admin always knows which
 * workspace they're acting in. Desktop-first like the owner dashboard;
 * below lg the rail becomes a drawer.
 */
export default function AdminShell({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, hydrated, hydrate, clear } = useAdminAuthStore();
  const { counts, fetchNotifications } = useAdminNotificationStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    // Re-validate the stored token once per load; adminApi's interceptor
    // sends a revoked or non-admin token back to the login screen.
    adminApi.get('/auth/me').then((res) => {
      const roles: { name: string }[] = res.data.data.user.roles ?? [];
      if (!roles.some((r) => r.name === 'admin')) {
        clear();
        router.replace('/admin/login');
      }
    }).catch(() => undefined);

    void fetchNotifications();
  }, [hydrated, token, router, clear, fetchNotifications]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  const signOut = async () => {
    await adminApi.post('/auth/logout').catch(() => undefined);
    clear();
    router.replace('/admin/login');
  };

  if (!hydrated || !token) return null;

  const currentNav = ADMIN_NAV.find((item) => isActiveAdminPath(pathname, item.path));
  const sectionTitle = currentNav?.name ?? (pathname.startsWith('/admin/notifications') ? 'Notifications' : 'Admin');

  const rail = (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <SuturaLogo tone="dark" className="h-8" />
      </div>
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Admin navigation">
        {ADMIN_NAV.map(({ name, path, icon: Icon, badgeKey }) => {
          const active = isActiveAdminPath(pathname, path);
          const badgeCount = badgeKey ? counts[badgeKey] : 0;
          return (
            <Link key={path} href={path} aria-current={active ? 'page' : undefined}
              className={`mx-3 my-0.5 flex min-h-11 items-center gap-3 px-3 text-sm transition-colors rounded-lg ${active ? 'bg-white/10 font-semibold text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'}`}>
              <Icon size={18} className={active ? 'text-taupe' : ''} />
              <span className="truncate">{name}</span>
              {badgeCount > 0 && (
                <span
                  className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-taupe/20 text-taupe border border-taupe/35"
                  title={`${badgeCount} waiting`}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold">{user?.name ?? 'System Admin'}</p>
        <p className="truncate text-xs text-white/50">{user?.email}</p>
        <button type="button" onClick={() => { setDrawerOpen(false); setConfirmSignOut(true); }} className="mt-3 flex min-h-11 w-full items-center gap-2 text-sm text-white/70 hover:text-white">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <aside className="hidden lg:block lg:w-60 lg:shrink-0 lg:sticky lg:top-0 lg:h-dvh">{rail}</aside>

      {/* Mobile Header Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-ink px-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="btn-icon-mobile">
            <Menu size={22} />
          </button>
          <SuturaLogo tone="dark" className="h-7" />
        </div>
        <AdminNotificationBell variant="dark" />
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="relative h-full w-72 max-w-[85vw]">
            {rail}
            <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="btn-icon-mobile absolute right-1 top-2 text-white">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <SignOutConfirmModal isOpen={confirmSignOut} onClose={() => setConfirmSignOut(false)} onConfirm={signOut} />

      {/* Main Content Area with Desktop Sticky Header */}
      <div className="flex-1 min-w-0 flex flex-col min-h-dvh">
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-line bg-surface/90 backdrop-blur-md px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <span className="text-ink font-bold">{sectionTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <AdminNotificationBell variant="light" />
            <div className="flex items-center gap-3 pl-4 border-l border-line">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white font-bold text-xs shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-ink leading-tight">{user?.name ?? 'System Admin'}</p>
                <p className="text-[11px] text-ink-muted leading-tight">System Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
