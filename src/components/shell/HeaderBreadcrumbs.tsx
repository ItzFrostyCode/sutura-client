'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home, Calendar, CreditCard, Scissors, Users,
  ShoppingBag, Package, UserCog, LayoutDashboard,
  Building2, ScrollText, Settings, ChevronRight,
  HelpCircle, Star, Ruler, Sparkles, type LucideIcon
} from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

export default function HeaderBreadcrumbs({ pathname: propPathname }: { readonly pathname: string }) {
  const [currentPath, setCurrentPath] = useState(propPathname);

  useEffect(() => {
    setCurrentPath(propPathname);
  }, [propPathname]);

  useEffect(() => {
    const handleUrlChange = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('sutura-tab-change', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('sutura-tab-change', handleUrlChange);
    };
  }, []);

  const pathname = currentPath;

  if (!pathname || pathname === '/dashboard') {
    return (
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted pl-1">
        <Home size={13} className="text-taupe shrink-0" />
        <span className="font-semibold text-ink">Overview</span>
      </div>
    );
  }

  // Determine segments based on route
  const segments: BreadcrumbSegment[] = [];

  if (pathname.startsWith('/dashboard/appointments')) {
    segments.push({ label: 'Appointments', href: '/dashboard/appointments', icon: Calendar });
  } else if (pathname.startsWith('/dashboard/payments')) {
    segments.push({ label: 'Collect Payments', href: '/dashboard/payments', icon: CreditCard });
  } else if (pathname.startsWith('/dashboard/jobs') || pathname.startsWith('/dashboard/orders')) {
    segments.push({ label: 'Orders', href: '/dashboard/jobs', icon: Scissors });
    if (pathname === '/dashboard/jobs/new') {
      segments.push({ label: 'New Job Order' });
    } else if (pathname.match(/\/dashboard\/jobs\/\d+/)) {
      segments.push({ label: 'Job Details' });
    } else if (pathname.startsWith('/dashboard/orders') || (typeof window !== 'undefined' && window.location.search.includes('tab=showroom_sales'))) {
      segments.push({ label: 'Showroom Orders' });
    } else {
      segments.push({ label: 'Custom Jobs' });
    }
  } else if (pathname.startsWith('/dashboard/customers')) {
    segments.push({ label: 'Client Book', href: '/dashboard/customers', icon: Users });
    if (pathname.match(/\/dashboard\/customers\/\d+/)) {
      segments.push({ label: 'Customer Profile' });
    }
  } else if (pathname.startsWith('/dashboard/catalog')) {
    segments.push({ label: 'Showroom', href: '/dashboard/catalog', icon: Sparkles });
    if (pathname === '/dashboard/catalog') {
      segments.push({ label: 'Designs' });
    } else if (pathname === '/dashboard/catalog/new') {
      segments.push({ label: 'New Design Item' });
    } else if (pathname === '/dashboard/catalog/analytics') {
      segments.push({ label: 'Analytics' });
    } else if (pathname === '/dashboard/catalog/reviews') {
      segments.push({ label: 'Reviews' });
    } else if (pathname.endsWith('/edit')) {
      segments.push({ label: 'Edit Item' });
    } else if (pathname.match(/\/dashboard\/catalog\/\d+/)) {
      segments.push({ label: 'Item Details' });
    }
  } else if (pathname.startsWith('/dashboard/services') || pathname.startsWith('/dashboard/service-packages')) {
    segments.push({ label: 'Services', href: '/dashboard/services', icon: Package });
    if (pathname.startsWith('/dashboard/service-packages')) {
      segments.push({ label: 'Packages' });
    }
  } else if (pathname.startsWith('/dashboard/staff')) {
    segments.push({ label: 'Staff', href: '/dashboard/staff', icon: UserCog });
    if (pathname.match(/\/dashboard\/staff\/\d+/)) {
      segments.push({ label: 'Staff Profile' });
    }
  } else if (pathname.startsWith('/dashboard/reports')) {
    segments.push({ label: 'Reports & Insights', href: '/dashboard/reports', icon: LayoutDashboard });
  } else if (pathname.startsWith('/dashboard/branches')) {
    segments.push({ label: 'Shop Branches', href: '/dashboard/branches', icon: Building2 });
  } else if (pathname.startsWith('/dashboard/audit-log')) {
    segments.push({ label: 'Audit Log', href: '/dashboard/audit-log', icon: ScrollText });
  } else if (pathname.startsWith('/dashboard/account-settings') || pathname.startsWith('/dashboard/profile')) {
    segments.push({ label: 'Settings', href: '/dashboard/account-settings', icon: Settings });
  } else if (pathname.startsWith('/dashboard/billing')) {
    segments.push({ label: 'Billing & Plans', href: '/dashboard/billing', icon: CreditCard });
  } else if (pathname.startsWith('/dashboard/support')) {
    segments.push({ label: 'Support Desk', href: '/dashboard/support', icon: HelpCircle });
  } else if (pathname.startsWith('/dashboard/reviews')) {
    segments.push({ label: 'Reviews', href: '/dashboard/reviews', icon: Star });
  } else if (pathname.startsWith('/dashboard/measurements')) {
    segments.push({ label: 'Client Book', href: '/dashboard/customers', icon: Users });
    segments.push({ label: 'Measurements', icon: Ruler });
  } else {
    // Fallback for custom dashboard routes
    const slug = pathname.replace('/dashboard/', '').replaceAll('-', ' ');
    const title = slug.charAt(0).toUpperCase() + slug.slice(1);
    segments.push({ label: title, href: pathname });
  }

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-ink-muted min-w-0 pl-1">
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const Icon = seg.icon;

        return (
          <React.Fragment key={seg.label}>
            {idx > 0 && <ChevronRight size={11} className="text-ink-faint shrink-0" />}
            
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              {Icon && <Icon size={13} className={isLast ? 'text-taupe shrink-0' : 'text-ink-faint shrink-0'} />}
              
              {!isLast && seg.href ? (
                <Link
                  href={seg.href}
                  className="font-medium text-ink-muted hover:text-ink transition-colors truncate"
                >
                  {seg.label}
                </Link>
              ) : (
                <span className="font-semibold text-ink truncate">
                  {seg.label}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
