'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { ToastProvider } from '@/context/ToastContext';
import api from '@/lib/axios';

// A thin auth-guard shell — one hydration-guard/redirect/refetch bootstrap
// shared by every /account/* page. No persistent sidebar nav anymore (that
// was a desktop pattern); `/account` itself is now the real "Me" hub page
// (profile header + Job Orders/Appointments/Measurements cards, Shopee-Me-
// tab shaped but built on SUTURA's real concepts), and every other
// /account/* page is a drill-down reached from a card there, with its own
// local back button — standard mobile-app hub-and-drill-down navigation,
// not a permanent side nav.
//
// No PublicNav here — a search bar makes no sense above a profile/settings
// screen. The hub's own profile card (avatar/name/email + settings icon)
// is the real header for this whole section; every sub-page brings its own
// back-arrow title bar.
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
            const { user: freshUser, shop, staff_profile } = res.data.data;
            setAuth(freshUser, token, shop, staff_profile);
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
  // this, a shop_owner/staff/branch_manager/admin account landing here sees
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

  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-canvas">
        <main className="flex-1 flex flex-col w-full mx-auto px-[10px] py-[10px]">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
