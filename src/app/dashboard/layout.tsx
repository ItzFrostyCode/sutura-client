'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare,
  LayoutDashboard, Scissors, UserCog, Package, Users, Building2,
  Calendar, Home, CreditCard,
  Sparkles, ScrollText, X, HelpCircle, LayoutGrid, PanelLeft, ChevronDown,
} from 'lucide-react';
import { Inter } from 'next/font/google';
import api from '@/lib/axios';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';
import BrandLogo from '@/components/BrandLogo';
import { ToastProvider } from '@/context/ToastContext';
import { BranchProvider } from '@/context/BranchContext';
import WhatsNewTour, { hasSeenLatestWhatsNew } from '@/components/WhatsNewTour';
import StoreSwitcher from '@/components/shell/StoreSwitcher';
import StoreBranchPanel from '@/components/shell/StoreBranchPanel';
import SidebarControl, { type SidebarMode } from '@/components/shell/SidebarControl';
import HelpPanel from '@/components/shell/HelpPanel';
import HeaderBreadcrumbs from '@/components/shell/HeaderBreadcrumbs';
import StoreApplicationGate from '@/components/dashboard/StoreApplicationGate';
import ChangePasswordGate from '@/components/dashboard/ChangePasswordGate';
import { withRedirect } from '@/lib/authRedirect';

const SIDEBAR_KEY = 'sutura.sidebar';

// DESIGN.md (Espresso Atelier) is set in Inter, regular / medium / semi-bold.
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });

function DashboardLayoutContent({ children }: { readonly children: React.ReactNode }) {
  const { user, isAuthenticated, logout, setAuth, token, staffProfile, store } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // The dashboard's own palette and type: on <body>, so modals and menus (which are portaled out of this tree) get them too.
  useEffect(() => {
    const classes = ['theme-espresso', inter.variable];
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, []);

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
  // The shop menu replaces the rail's navigation while it is open.
  const [shopOpen, setShopOpen] = useState(false);
  const closeShop = useCallback(() => setShopOpen(false), []);
  // Shop Management and Reports & Activity fold away; the choice is remembered on this device.
  const [foldedGroups, setFoldedGroups] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('sutura_nav_folded') ?? '[]'); } catch { return []; }
  });
  const toggleGroup = (title: string) => setFoldedGroups(prev => {
    const next = prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title];
    try { localStorage.setItem('sutura_nav_folded', JSON.stringify(next)); } catch { /* not saved */ }
    return next;
  });

  const changeSidebarMode = (mode: SidebarMode) => {
    localStorage.setItem(SIDEBAR_KEY, mode);
    setSidebarMode(mode);
  };

  // What the rail actually shows right now: hover mode is narrow until
  // pointed at, then widens without changing the stored preference.
  let railExpanded = sidebarMode === 'expanded';
  if (sidebarMode === 'hover') railExpanded = railHovered;

  // Close mobile drawer on route change (deferred to avoid synchronous setState in effect)
  useEffect(() => {
    const timer = setTimeout(() => setDrawerOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!token && !isAuthenticated) {
      // replace: Back from the sign-in page must not land here again (that would loop back to sign-in).
      router.replace(withRedirect('/login', pathname, 'as=store'));
      return;
    }

    // Always synchronize with /auth/me on load so the logged in account
    // (name, role, branch, profile) accurately reflects the active session
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data?.success) {
            const { user: freshUser, store: freshStore, staff_profile } = res.data.data;
            const activeStore = freshStore || staff_profile?.store;
            setAuth(freshUser, token, activeStore, staff_profile);
          }
        })
        .catch(err => {
          if (err.response?.status === 401) {
            logout();
            router.replace(withRedirect('/login', pathname, 'as=store'));
          }
        });
    }
  }, [token, isAuthenticated, router, setAuth, logout]);

  const roleNames = user?.roles?.map(r => r.name) || [];
  const isStoreOwner = roleNames.includes('store_owner');
  const isBranchManager = roleNames.includes('branch_manager') || Boolean(staffProfile?.is_branch_manager);
  const isStaff = roleNames.includes('staff') || Boolean(staffProfile);
  const canViewAnalytics = isStoreOwner || isBranchManager;

  // What's New tour — owner-only. See WhatsNewTour for the localStorage
  // dismissal contract; dismissedThisSession forces the one real state
  // transition needed to re-derive autoShowTour after a close.
  const [manualShowTour, setManualShowTour] = useState(false);
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const autoShowTour = !dismissedThisSession && mounted && isAuthenticated && isStoreOwner && !hasSeenLatestWhatsNew();
  const showTour = manualShowTour || autoShowTour;
  const closeTour = () => {
    setDismissedThisSession(true);
    setManualShowTour(false);
  };

  if (!mounted || !isAuthenticated) return null;

  // Admin-issued shop logins start with a temporary password; the API
  // refuses store-scoped calls until it's replaced.
  if (user?.must_change_password && token) {
    return (
      <ChangePasswordGate
        loginEmail={user.email}
        onChanged={() => setAuth({ ...user, must_change_password: false }, token, store ?? undefined, staffProfile ?? undefined)}
        onLogout={() => { logout(); router.replace('/login?as=store'); }}
      />
    );
  }

  // A new shop stays pending until a System Admin approves its application
  // (/admin/applications). Its owner waits here instead of the workspace.
  if (isStoreOwner && store && store.status !== 'approved') {
    return <StoreApplicationGate store={store} onLogout={() => { logout(); router.replace('/login?as=store'); }} />;
  }

  // Grouped by how the shop is used: the day's work, then the shop's setup, then the reports.
  const NAV_GROUPS: { title: string; collapsible?: boolean; items: { name: string; path: string; icon: React.ElementType }[] }[] = [
    {
      title: 'Daily Work',
      items: [
        { name: 'Home', path: '/dashboard', icon: Home },
        { name: 'Appointments', path: '/dashboard/appointments', icon: Calendar },
        { name: 'Orders', path: '/dashboard/jobs', icon: Scissors },
        { name: 'Customers', path: '/dashboard/customers', icon: Users },
        // Payment capture/verification is Owner/Branch-Manager-exclusive
        // under the finalized target (PAYMENT-WORKFLOW.md Part B) — Staff's
        // role narrows to reading payment_status/balance elsewhere (job
        // detail, appointment detail), never acting on it here.
        ...((isStoreOwner || isBranchManager) ? [{ name: 'Payments', path: '/dashboard/payments', icon: CreditCard }] : []),
        // Texts wait for the shop to check the number and wording before they are sent.
        ...((isStoreOwner || isBranchManager) ? [{ name: 'SMS', path: '/dashboard/sms', icon: MessageSquare }] : []),
      ],
    },
    {
      title: 'Shop Management',
      collapsible: true,
      items: [
        ...((isStoreOwner || isBranchManager || isStaff) ? [{ name: 'Services', path: '/dashboard/services', icon: Package }] : []),
        ...((isStoreOwner || isBranchManager || isStaff) ? [{ name: 'Staffs', path: '/dashboard/staff', icon: UserCog }] : []),
        ...((isStoreOwner || isBranchManager) ? [{ name: 'Branches', path: '/dashboard/branches', icon: Building2 }] : []),
      ],
    },
    {
      title: 'Reports & Activity',
      collapsible: true,
      items: [
        ...(canViewAnalytics ? [{ name: 'Reports & Insights', path: '/dashboard/reports', icon: LayoutDashboard }] : []),
        ...(isStoreOwner ? [{ name: 'Audit Log', path: '/dashboard/audit-log', icon: ScrollText }] : []),
      ],
    },
  ];

  const isActivePath = (path: string) =>
    pathname === path ||
    (path !== '/dashboard' && pathname.startsWith(path)) ||
    // Designs live inside Services now: their pages keep Services lit in the menu.
    (path === '/dashboard/services' && pathname.startsWith('/dashboard/catalog'));

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
        {NAV_GROUPS.filter(g => g.items.length > 0).map((group, gi) => {
          // A group folds only in the wide rail, and never hides the page the user is on.
          const folded = showLabel && group.collapsible && foldedGroups.includes(group.title) && !group.items.some(i => isActivePath(i.path));
          return (
            <div key={group.title}>
              {showLabel ? (
                group.collapsible ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    aria-expanded={!folded}
                    className="mb-1.5 flex min-h-8 w-full cursor-pointer items-center justify-between px-6 text-eyebrow select-none hover:text-ink"
                  >
                    <span>{group.title}</span>
                    <ChevronDown size={14} className={`transition-transform ${folded ? '-rotate-90' : ''}`} />
                  </button>
                ) : (
                  <h3 className="px-6 mb-1.5 text-eyebrow select-none">{group.title}</h3>
                )
              ) : (
                gi > 0 && <div className="mx-4 mb-3 border-t border-line" aria-hidden />
              )}
              {!folded && (
                <div className="space-y-0.5">
                  {group.items.map(item => <React.Fragment key={item.path}>{renderNavItem(item, showLabel)}</React.Fragment>)}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    // h-dvh, not h-screen — on mobile Safari/Chrome, h-screen's 100vh is
    // taller than the actually-visible viewport while the browser's address
    // bar is showing, clipping the bottom of this fixed-height app-shell
    // (sidebar/drawer, sticky header) until the page is scrolled once.
    // Matches the min-h-dvh pattern already used on customer-facing pages.
    <div className="h-dvh bg-canvas flex flex-col overflow-hidden print:h-auto print:overflow-visible">
      {/* ── Header: Aligned 1:1 with desktop rail width (Cloudflare-style) ── */}
      <header className="print:hidden h-16 bg-surface border-b border-line flex items-center sticky top-0 z-50">
        {/* Left Box: 100% matched to rail width (w-60 / w-16) with vertical border-r */}
        <div
          className={`h-full flex items-center px-3 sm:px-3.5 gap-2 min-w-0 flex-1 lg:flex-none lg:shrink-0 transition-[width] duration-200 ease-out lg:border-r border-line ${
            railExpanded ? 'w-auto lg:w-60' : 'w-auto lg:w-16 lg:justify-center'
          }`}
        >
          {/* With the rail collapsed, pointing at the logo swaps it for the expand icon. */}
          <div className="group relative shrink-0">
            <Link
              href="/dashboard"
              aria-label="SUTURA home"
              className={`flex items-center hover:opacity-90 transition-opacity ${railExpanded ? '' : 'lg:group-hover:opacity-0'}`}
            >
              <BrandLogo iconOnly={true} />
            </Link>
            {!railExpanded && (
              <button
                type="button"
                onClick={() => changeSidebarMode('expanded')}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="absolute inset-0 hidden lg:flex items-center justify-center rounded-lg bg-sunken text-ink opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <PanelLeft size={20} />
              </button>
            )}
          </div>

          <div className={`flex items-center min-w-0 flex-1 ${railExpanded ? 'block' : 'lg:hidden'}`}>
            <StoreSwitcher open={shopOpen} onToggle={() => setShopOpen(o => !o)} />
          </div>
          {railExpanded && (
            <div className="hidden lg:block shrink-0">
              <SidebarControl mode={sidebarMode} onChange={changeSidebarMode} />
            </div>
          )}
        </div>

        {/* Right Main Header Area: Breadcrumbs over main workspace, tools on right */}
        <div className="h-full flex shrink-0 items-center justify-between gap-3 pr-3 sm:pr-4 lg:min-w-0 lg:flex-1 lg:px-6">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <HeaderBreadcrumbs pathname={pathname} />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 3x3 Grid Navigation Launcher (left of Help) */}
            <button
              type="button"
              aria-label="Open navigation"
              title="Navigation Menu"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-line text-ink-body hover:bg-line-strong transition-colors cursor-pointer shrink-0"
            >
              <LayoutGrid size={17} />
            </button>

            {/* Help & Support Button with circular background */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Help and support"
              title="Help & Support"
              className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition-colors cursor-pointer shrink-0 ${
                helpOpen
                  ? 'bg-sunken text-ink ring-2 ring-taupe/40'
                  : 'bg-line text-ink-body hover:bg-line-strong'
              }`}
            >
              <HelpCircle size={17} />
            </button>

            {isStoreOwner && (
              <button
                type="button"
                onClick={() => setManualShowTour(true)}
                title="What's New"
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-line text-ink-body hover:bg-line-strong transition-colors cursor-pointer shrink-0"
              >
                <Sparkles size={17} />
              </button>
            )}
            <AccountHeaderMenu />
          </div>
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

        {/* Shop menu: covers the rail at the rail's width (full width of a phone drawer on small screens). */}
        {shopOpen && (
          <>
            <button type="button" aria-label="Close shop menu" onClick={closeShop} className="fixed inset-0 z-30 border-none bg-ink/30 p-0 lg:hidden" />
            <div className="absolute inset-y-0 left-0 z-40 w-72 max-w-[85vw] border-r border-line bg-surface lg:w-60">
              <StoreBranchPanel onClose={closeShop} />
            </div>
          </>
        )}

        {/* Mobile drawer */}
        {drawerOpen && (
          <>
            {/* Above the header (z-50), so while the menu is open the bell and the profile cannot be tapped through it. */}
            <button
              type="button"
              className="fixed inset-0 bg-ink/40 z-[60] lg:hidden border-none p-0"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-[70] w-72 max-w-[85vw] bg-surface border-r border-line overflow-y-auto lg:hidden animate-rise">
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
        <main data-scroll-root className="flex-1 overflow-y-auto bg-canvas print:p-0 print:overflow-visible print:bg-white">
          <div className="p-4 print:p-0">
            {children}
          </div>
        </main>
      </div>

      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} isStoreOwner={isStoreOwner} />

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
