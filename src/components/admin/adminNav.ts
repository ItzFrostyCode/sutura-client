import { Banknote, BarChart3, CreditCard, MapPin, FileCheck2, LayoutDashboard, LifeBuoy, ScrollText, Shirt, Store, Users, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badgeKey?: 'applications' | 'branches' | 'upgrades' | 'apparel' | 'tickets';
}

// sutura2's admin views, mapped onto this app. Apparel categories is the queue
// for apparel names a shop typed in itself (the fixed taxonomy needs no
// review). Branch locations is the map-validation queue: a branch an owner
// adds or moves waits here before it goes on the public map.
export const ADMIN_NAV: AdminNavItem[] = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { name: 'Applications', path: '/admin/applications', icon: FileCheck2, badgeKey: 'applications' },
  { name: 'Shops', path: '/admin/stores', icon: Store },
  { name: 'Branch locations', path: '/admin/branches', icon: MapPin, badgeKey: 'branches' },
  { name: 'Apparel categories', path: '/admin/apparel', icon: Shirt, badgeKey: 'apparel' },
  { name: 'Accounts', path: '/admin/accounts', icon: Users },
  { name: 'Plans', path: '/admin/plans', icon: CreditCard },
  { name: 'Plan Payments', path: '/admin/upgrades', icon: Banknote, badgeKey: 'upgrades' },
  { name: 'Support', path: '/admin/tickets', icon: LifeBuoy, badgeKey: 'tickets' },
  { name: 'Activity Log', path: '/admin/activity', icon: ScrollText },
];

export const isActiveAdminPath = (pathname: string, path: string) =>
  path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);
