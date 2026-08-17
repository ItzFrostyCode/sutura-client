'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Scissors, UserCog, Package, Users, Building2,
  Calendar, ShoppingBag, Home, CreditCard,
  Sparkles, ScrollText, Menu, X, HelpCircle, LayoutGrid,
} from 'lucide-react';
import api from '@/lib/axios';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';
import BrandLogo from '@/components/BrandLogo';
import { ToastProvider } from '@/context/ToastContext';
import { BranchProvider } from '@/context/BranchContext';
import WhatsNewTour, { hasSeenLatestWhatsNew } from '@/components/WhatsNewTour';
import ShopSwitcher from '@/components/shell/ShopSwitcher';
import SidebarControl, { type SidebarMode } from '@/components/shell/SidebarControl';
import HelpPanel from '@/components/shell/HelpPanel';

const SIDEBAR_KEY = 'sutura.sidebar';

function DashboardLayoutContent({ children }: { readonly children: React.ReactNode }) {
  const { user, isAuthenticated, logout, setAuth, token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();

  // Mobile drawer (off-canvas, < lg)
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Desktop rail width, three modes, persisted. Layout renders nothing until
  // `mounted`, so reading localStorage in the initializer is hydration-safe.
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window === 'undefined') return 'expanded';
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved === 'collapsed' || saved === 'hover' ? saved : 'expanded';
  });
  const [railHovered, setRailHovered] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const changeSidebarMode = (mode: SidebarMode) => {
    localStorage.setItem(SIDEBAR_KEY, mode);
    setSidebarMode(mode);
  };

  // What the rail actually shows right now: hover mode is narrow until
  // pointed at, then widens without changing the stored preference.
  let railExpanded = sidebarMode === 'expanded';
  if (sidebarMode === 'hover') railExpanded = railHovered;

  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setDrawerOpen(false);
    setPrevPathname(pathname);
  }

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!user && token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const { user, shop, staff_profile } = res.data.data;
            let activeShop = shop;
            if ((user?.roles?.[0]?.name === 'staff' || user?.roles?.[0]?.name === 'branch_manager') && staff_profile?.shop) {
              activeShop = staff_profile.shop;
            }
            setAuth(user, token, activeShop, staff_profile);
          }
        })
        .catch(() => {
          logout();
          router.push('/login');
        });
    }
  }, [isAuthenticated, user, token, router, setAuth, logout]);

  const roleName = user?.roles?.[0]?.name;

  // What's New tour — owner-only. See WhatsNewTour for the localStorage
  // dismissal contract; dismissedThisSession forces the one real state
  // transition needed to re-derive autoShowTour after a close.
  const [manualShowTour, setManualShowTour] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const autoShowTour = !dismissedThisSession && mounted && isAuthenticated && roleName === 'shop_owner' && !hasSeenLatestWhatsNew();
  const showTour = manualShowTour || autoShowTour;
  const closeTour = () => {
    setDismissedThisSession(true);
    setManualShowTour(false);
  };

  if (!mounted || !isAuthenticated) return null;

  // Staff and branch managers share this dashboard — scoped by the API and
  // role checks, not by separate routes.
  const isShopOwner = roleName === 'shop_owner';
  const canViewAnalytics = isShopOwner || roleName === 'branch_manager';

  const NAV_GROUPS = [
    {
      title: 'Main Operations',
      items: [
        { name: 'Home', path: '/dashboard', icon: Home },
        { name: 'Appointments', path: '/dashboard/appointments', icon: Calendar },
        { name: 'Collect Payments', path: '/dashboard/payments', icon: CreditCard },
      ],
    },
    {
      title: 'Workroom',
      items: [
        { name: 'Custom Jobs', path: '/dashboard/jobs', icon: Scissors },
        { name: 'Customers', path: '/dashboard/customers', icon: Users },
      ],
    },
    {
      // Catalog/Services are shop_owner-only on the backend — hidden to match.
      title: 'Showroom',
      items: [
        ...(isShopOwner ? [{ name: 'Design Catalog', path: '/dashboard/catalog', icon: ShoppingBag }] : []),
        ...(isShopOwner ? [{ name: 'Services', path: '/dashboard/services', icon: Package }] : []),
      ],
    },
    {
      title: 'Staff & Performance',
      items: [
        ...(isShopOwner ? [{ name: 'Staff', path: '/dashboard/staff', icon: UserCog }] : []),
        ...(canViewAnalytics ? [{ name: 'Reports & Insights', path: '/dashboard/reports', icon: LayoutDashboard }] : []),
        ...(isShopOwner ? [{ name: 'Branches', path: '/dashboard/branches', icon: Building2 }] : []),
        ...(isShopOwner ? [{ name: 'Audit Log', path: '/dashboard/audit-log', icon: ScrollText }] : []),
      ],
    },
  ];

  const isActivePath = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

  /** One nav item, used by both the desktop rail and the mobile drawer.
   *  Collapsed mode drops the label and shows a tooltip instead — the
   *  active state stays legible as a taupe left rail + sunken fill. */
  const renderNavItem = (item: { name: string; path: string; icon: React.ElementType }, showLabel: boolean) => {
    const active = isActivePath(item.path);
    const Icon = item.icon;
    return (
      <Link
        href={item.path}
        title={showLabel ? undefined : item.name}
        className={`group relative flex items-center gap-3 rounded-lg text-[14px] transition-colors min-h-[42px]
          ${showLabel ? 'px-3 mx-3' : 'justify-center mx-2 px-0'}
          ${active ? 'bg-sunken text-ink font-semibold' : 'text-ink-muted font-medium hover:bg-canvas hover:text-ink'}`}
      >
        <Icon size={18} className={`shrink-0 ${active ? 'text-taupe' : 'text-ink-muted group-hover:text-ink-body'}`} />
        {showLabel && <span className="truncate">{item.name}</span>}
        {!showLabel && (
          <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-md bg-ink text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  /** Full nav column — group eyebrows in expanded mode, hairline separators
   *  between groups in collapsed mode. */
  const renderNavColumn = (showLabel: boolean) => (
    <div className="flex flex-col justify-between h-full py-4">
      <nav
        className={`flex-1 min-h-0 overflow-y-auto hide-scrollbar ${showLabel ? 'space-y-6' : 'space-y-3'}`}
        aria-label="Main navigation"
      >
        {NAV_GROUPS.filter(g => g.items.length > 0).map((group, gi) => (
          <div key={group.title}>
            {showLabel ? (
              <h3 className="px-6 mb-1.5 text-eyebrow select-none">{group.title}</h3>
            ) : (
              gi > 0 && <div className="mx-4 mb-3 border-t border-line" aria-hidden />
            )}
            <div className="space-y-0.5">
              {group.items.map(item => <React.Fragment key={item.path}>{renderNavItem(item, showLabel)}</React.Fragment>)}
            </div>
          </div>
        ))}
      </nav>

      {/* Help moved to the header's ? button (opens a side panel) — support
          is something you reach for from wherever you are, not a permanent
          nav destination. This slot now holds the rail width control. */}
      <div className={`pt-3 border-t border-line ${showLabel ? 'px-3' : 'px-2 flex justify-center'}`}>
        <SidebarControl mode={sidebarMode} onChange={changeSidebarMode} />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-canvas flex flex-col overflow-hidden print:h-auto print:overflow-visible">
      {/* ── Header: logo + shop name left · grid + help + bell + profile right ── */}
      <header className="print:hidden h-16 bg-surface border-b border-line flex items-center justify-between gap-3 px-4 lg:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            aria-label="SUTURA home"
            className="flex items-center shrink-0 hover:opacity-90 transition-opacity"
          >
            <BrandLogo />
          </Link>

          <div className="flex items-center min-w-0">
            <ShopSwitcher />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 3x3 Grid Navigation Launcher (left of Help) */}
          <button
            type="button"
            aria-label="Open navigation"
            title="Navigation Menu"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-line text-ink-body hover:bg-[#D1C7BD] transition-colors cursor-pointer shrink-0"
          >
            <LayoutGrid size={18} />
          </button>

          {/* Help & Support Button with circular background */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="Help and support"
            title="Help & Support"
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors cursor-pointer shrink-0 ${
              helpOpen
                ? 'bg-sunken text-ink ring-2 ring-taupe/40'
                : 'bg-line text-ink-body hover:bg-[#D1C7BD]'
            }`}
          >
            <HelpCircle size={18} />
          </button>

          {isShopOwner && (
            <button
              type="button"
              onClick={() => setManualShowTour(true)}
              title="What's New"
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-line text-ink-body hover:bg-[#D1C7BD] transition-colors cursor-pointer shrink-0"
            >
              <Sparkles size={18} />
            </button>
          )}
          <AccountHeaderMenu />
        </div>
      </header>

      {/* ── Body: rail + content ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative print:overflow-visible print:block">
        {/* Desktop rail — white surface against the cream canvas, collapsible. */}
        <aside
          onMouseEnter={() => sidebarMode === 'hover' && setRailHovered(true)}
          onMouseLeave={() => sidebarMode === 'hover' && setRailHovered(false)}
          className={`print:hidden hidden lg:block shrink-0 bg-surface border-r border-line transition-[width] duration-200 ease-out ${
            railExpanded ? 'w-60' : 'w-16'
          }`}
        >
          {renderNavColumn(railExpanded)}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 bg-ink/40 z-40 lg:hidden border-none p-0"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface border-r border-line overflow-y-auto lg:hidden animate-rise">
              <div className="h-16 flex items-center justify-between px-4 border-b border-line">
                <BrandLogo />
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center w-11 h-11 -mr-1 rounded-lg text-ink-body hover:bg-sunken transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              {renderNavColumn(true)}
            </aside>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-canvas print:p-0 print:overflow-visible print:bg-white">
          <div className="p-4 print:p-0">
            {children}
          </div>
        </main>
      </div>

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      {showTour && <WhatsNewTour onClose={closeTour} />}
    </div>
  );
}

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BranchProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </BranchProvider>
    </ToastProvider>
  );
}
