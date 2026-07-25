'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Scissors, UserCog, Package, Settings, Users, Building2, Calendar, ShoppingBag, Grip, ChevronDown, LifeBuoy, Home, CreditCard, MapPin, Sparkles } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';
import BrandLogo from '@/components/BrandLogo';
import { ToastProvider } from '@/context/ToastContext';
import { BranchProvider, useBranch } from '@/context/BranchContext';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import WhatsNewTour, { hasSeenLatestWhatsNew } from '@/components/WhatsNewTour';

function DashboardLayoutContent({ children }: { readonly children: React.ReactNode }) {
  const { user, isAuthenticated, logout, setAuth, token, shop } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);
  const { tier: subscriptionTier } = useSubscriptionTier();

  if (pathname !== prevPathname) {
    setIsSidebarOpen(false);
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

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setIsBranchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleName = user?.roles?.[0]?.name;

  // Owner-only for now — these features (customer notes, shop settings) are
  // mostly owner-facing edits, matching the rest of this dashboard's
  // owner-first scope. Derived directly during render (not via an effect +
  // setState, which would trigger a needless cascading render) — dismissing
  // the tour writes to localStorage, so this naturally re-evaluates to false
  // on the next render without any extra state to track it. The header
  // sparkle button lets it be replayed any time after that via manualShowTour.
  const [manualShowTour, setManualShowTour] = useState(false);
  const autoShowTour = mounted && isAuthenticated && roleName === 'shop_owner' && !hasSeenLatestWhatsNew();
  const showTour = manualShowTour || autoShowTour;

  if (!mounted || !isAuthenticated) return null;

  // Staff and branch managers share this same dashboard — there's no separate
  // staff portal. What they can see/do here is scoped down by the API (and a
  // handful of role checks below/in individual pages), not by a different route.
  const isShopOwner = roleName === 'shop_owner';
  // Matches the backend's role:shop_owner,branch_manager gate on GET /analytics
  // — plain staff can't hit that endpoint, so Reports & Insights would just 403.
  const canViewAnalytics = isShopOwner || roleName === 'branch_manager';

  const NAV_GROUPS = [
    {
      title: 'Main Operations',
      items: [
        { name: 'Home',           path: '/dashboard',             icon: Home },
        { name: 'Appointments',   path: '/dashboard/appointments',icon: Calendar },
        { name: 'Collect Payments',path: '/dashboard/payments',    icon: CreditCard },
      ]
    },
    {
      // Measurements always belong to a customer, so it isn't a useful
      // standalone starting point — reach it via a customer's own profile
      // (or the "All Measurements" shortcut on the Customers page) instead
      // of a co-equal sidebar tab.
      title: 'Workroom',
      items: [
        { name: 'Custom Jobs',   path: '/dashboard/jobs',        icon: Scissors },
        { name: 'Customers',     path: '/dashboard/customers',   icon: Users },
      ]
    },
    {
      // Ready-to-Wear is folded into Design Catalog as a tab (see the catalog page).
      // "Our Expertise" was merged into Services — a service's category/type IS
      // the shop's declared expertise, so it no longer needs a separate tab.
      // Design Catalog and Services are both shop_owner-only on the backend
      // (not even branch_manager) — hidden here to match, otherwise
      // staff/branch managers see a link that 403s the moment they click it.
      title: 'Showroom',
      items: [
        ...(isShopOwner ? [{ name: 'Design Catalog', path: '/dashboard/catalog', icon: ShoppingBag }] : []),
        ...(isShopOwner ? [{ name: 'Services', path: '/dashboard/services', icon: Package }] : []),
      ]
    },
    {
      // "Team" is avoided here on purpose — the app also uses "Team Name"/"Team
      // Roster" for bulk sports-jersey job orders, so labeling staff as a "Team"
      // reads as if it belongs to that same sports/esports context.
      // Branches lives here too, not in its own single-item group — staff are
      // assigned per branch and Reports & Insights already compares performance
      // across branches, so it's a closer fit than standing alone.
      // Staff management is shop_owner-only on the backend (not even
      // branch_manager) — hidden here to match.
      title: 'Staff & Performance',
      items: [
        ...(isShopOwner ? [{ name: 'Staff', path: '/dashboard/staff', icon: UserCog }] : []),
        ...(canViewAnalytics ? [{ name: 'Reports & Insights', path: '/dashboard/reports', icon: LayoutDashboard }] : []),
        ...(isShopOwner ? [{ name: 'Branches', path: '/dashboard/branches', icon: Building2 }] : []),
      ]
    },
    // Billing & Plans and Account Settings live in the profile dropdown (top-right
    // avatar menu) instead — keeping them here too was a duplicate entry point.
  ];

  const getNavItemClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    return `flex items-center gap-3 px-4 py-2.5 mx-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-[#F0EAE3] text-[#2D2A26]' 
        : 'text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26]'
    }`;
  };

  return (
    <div className="h-screen bg-[#FAF6F3] flex flex-col overflow-hidden print:h-auto print:overflow-visible">
      {/* Top Navigation Bar */}
      <header className="print:hidden h-[64px] bg-white border-b border-[#EBE6E0] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center">
            <BrandLogo />
          </Link>
          <Link
            href="/dashboard/billing"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-linear-to-r from-[#9A8073] to-[#8A7063] text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm"
          >
            <Sparkles size={10} />
            {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan Activated
          </Link>
          {shop?.id && branches.length > 0 && (
            <div className="relative hidden md:block animate-fade-in" ref={branchRef}>
              <button 
                onClick={() => setIsBranchOpen(!isBranchOpen)}
                className="flex items-center gap-2 bg-[#FAF6F3] border border-[#EBE6E0] px-3.5 py-1.5 rounded-xl hover:bg-[#F0EAE3] transition-colors cursor-pointer text-[13px] font-medium text-[#2D2A26] focus:outline-none"
              >
                <Building2 size={14} className="text-[#827A73]" />
                <span>
                  {selectedBranchId === null 
                    ? 'All Branches' 
                    : (branches.find(b => b.id === selectedBranchId)?.name || 'All Branches')}
                </span>
                <ChevronDown size={12} className={`text-[#827A73] transition-transform duration-200 ${isBranchOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBranchOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-2 z-50 border border-[#EBE6E0] animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-[#EBE6E0] mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A19A]">Switch Location</p>
                  </div>

                  {/* All Branches Option */}
                  <button
                    onClick={() => {
                      setSelectedBranchId(null);
                      setIsBranchOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-[#F0EAE3] transition-colors text-left ${
                      selectedBranchId === null ? 'text-[#2D2A26] font-semibold bg-[#FAF6F3]' : 'text-[#524A44]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 size={14} className="text-[#827A73]" />
                      <span>All Branches</span>
                    </div>
                    {selectedBranchId === null && (
                      <span className="w-1.5 h-1.5 bg-[#9A8073] rounded-full" />
                    )}
                  </button>

                  {/* Individual Branches */}
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setIsBranchOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-[#F0EAE3] transition-colors text-left ${
                        selectedBranchId === b.id ? 'text-[#2D2A26] font-semibold bg-[#FAF6F3]' : 'text-[#524A44]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin size={14} className="text-[#827A73]" />
                        <span className="truncate max-w-[150px]">{b.name}</span>
                      </div>
                      {selectedBranchId === b.id && (
                        <span className="w-1.5 h-1.5 bg-[#9A8073] rounded-full" />
                      )}
                    </button>
                  ))}

                  <div className="h-px bg-[#EBE6E0] my-1"></div>

                  {/* Manage Branches Link */}
                  <Link
                    href="/dashboard/branches"
                    onClick={() => setIsBranchOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#9A8073] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors font-medium"
                  >
                    <Settings size={14} />
                    <span>Manage Branches</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Menu Toggle (Grid Icon) */}
          <button 
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-[#EBE6E0] text-[#524A44] hover:bg-[#D1C7BD] transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Grip size={20} fill="currentColor" />
          </button>

          {isShopOwner && (
            <button
              type="button"
              onClick={() => setManualShowTour(true)}
              title="What's New"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full text-[#9A8073] hover:bg-[#FAF6F3] transition-colors cursor-pointer"
            >
              <Sparkles size={17} />
            </button>
          )}

          <AccountHeaderMenu />
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative print:overflow-visible print:block">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
        <button
            type="button"
            className="absolute inset-0 bg-black/20 z-30 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`print:hidden absolute inset-y-0 left-0 z-40 w-[280px] bg-[#FAF6F3] overflow-y-auto transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="py-4 flex flex-col justify-between h-full">
            <div className="space-y-6">
              {NAV_GROUPS.filter((group) => group.items.length > 0).map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <h3 className="px-7 text-[10px] font-bold uppercase tracking-wider text-[#A8A19A] select-none">
                    {group.title}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <Link key={item.path} href={item.path} className={getNavItemClass(item.path)}>
                        <item.icon size={18} className={pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)) ? 'text-[#9A8073]' : 'text-[#827A73]'} />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Help & Support Footer inside sidebar */}
            <div className="pt-4 border-t border-[#EBE6E0] mt-6 mb-4">
              <Link href="/dashboard/support" className={getNavItemClass('/dashboard/support')}>
                <LifeBuoy size={18} className={pathname === '/dashboard/support' ? 'text-[#9A8073]' : 'text-[#827A73]'} />
                Help & Support
              </Link>
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#FAF6F3] print:p-0 print:overflow-visible print:bg-white">
          <div className="max-w-[1400px] mx-auto print:max-w-none">
             {children}
          </div>
        </main>
      </div>

      {showTour && <WhatsNewTour onClose={() => setManualShowTour(false)} />}
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
