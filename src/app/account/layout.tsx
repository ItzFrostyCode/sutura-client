'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ToastProvider } from '@/context/ToastContext';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import AccountWebSidebar from '@/components/account/hub/AccountWebSidebar';

// A thin auth-guard shell — one hydration-guard/redirect/refetch bootstrap
// shared by every /account/* page. PublicNav sits above all of it, same as
// /search, store profile, and /track.
//
// Desktop/tablet (md+): a persistent left sidebar (Shopee "My Account"
// pattern — profile summary + grouped nav) lives HERE in the layout so it
// stays put across every /account/* route instead of each page rebuilding
// it; only the content pane on the right swaps. Below md: no sidebar —
// `/account` itself is the real "Me" hub (profile header + quick cards),
// and every other /account/* page is a drill-down with its own local back
// button (AccountHeader) — standard mobile hub-and-drill-down nav.
export default function AccountLayout({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token, hydrated, setAuth, logout } = useAuthStore();
  // Guest Mode: the Me hub itself (exactly /account) is the one /account/*
  // route a guest is allowed to see — it renders its own guest-mode menu
  // (see account/page.tsx) where every item routes to /login on tap. Every
  // other /account/* sub-route (orders, appointments, settings, …) still
  // hard-gates below, same as before.
  const isGuestViewableRoute = pathname === '/account';

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      if (!isGuestViewableRoute) router.replace('/login');
    } else if (!user && token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const { user: freshUser, store, staff_profile } = res.data.data;
            setAuth(freshUser, token, store, staff_profile);
          }
        })
        .catch((err) => {
          if (err?.response?.status === 401) {
            logout();
            router.replace('/login');
          }
        });
    }
  }, [hydrated, isAuthenticated, user, token, router, setAuth, logout, isGuestViewableRoute]);

  // This hub is customer turf — Job Orders/Appointments/Measurements are
  // customer concepts, and every non-customer role already has its own real
  // home (/dashboard, plus dashboard/account-settings for profile). Without
  // this, a store_owner/staff/branch_manager/admin account landing here sees
  // an empty customer shell and their OWN real notifications — which
  // correctly deep-link into /dashboard, not a bug, just the wrong page to
  // be looking at as that role.
  useEffect(() => {
    if (!hydrated || !user) return;
    const isCustomer = user.roles?.some((r) => r.name === 'customer') ?? false;
    if (!isCustomer) router.replace('/dashboard');
  }, [hydrated, user, router]);

  if (!hydrated) {
    // Guest-viewable route (exactly /account): render immediately — the
    // GuestAccountHub has no auth-dependent data, so the blank-screen flash
    // before hydration is unnecessary and was making it look like nothing
    // happened when tapping the Me icon as a guest.
    if (!isGuestViewableRoute) return null;
  } else if (!isAuthenticated) {
    if (!isGuestViewableRoute) return null;
  } else {
    if (!user) return null;
    if (!(user.roles?.some((r) => r.name === 'customer') ?? false)) return null;
  }

  const showSidebar = hydrated && isAuthenticated && !!user;

  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-canvas">
        <PublicNav />
        <main className="flex-1 w-full max-w-7xl mx-auto mobile-screen-margins py-4 md:py-6">
          {showSidebar ? (
            <div className="flex flex-col md:flex-row md:items-start md:gap-8">
              <div className="hidden md:block">
                <AccountWebSidebar user={user} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">{children}</div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </ToastProvider>
  );
}
