import { Banknote, CreditCard, MapPin, FileCheck2, LayoutDashboard, LifeBuoy, ScrollText, Store, Users, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

// sutura2's admin views, mapped onto this app. Apparel Categories isn't here:
// specializations come from the fixed canonical taxonomy (nothing free-text
// to approve). Branch locations is the map-validation queue: a branch an owner
// adds or moves waits here before it goes on the public map.
export const ADMIN_NAV: AdminNavItem[] = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Applications', path: '/admin/applications', icon: FileCheck2 },
  { name: 'Stores', path: '/admin/stores', icon: Store },
  { name: 'Branch locations', path: '/admin/branches', icon: MapPin },
  { name: 'Accounts', path: '/admin/accounts', icon: Users },
  { name: 'Plans', path: '/admin/plans', icon: CreditCard },
  { name: 'Plan Payments', path: '/admin/upgrades', icon: Banknote },
  { name: 'Support', path: '/admin/tickets', icon: LifeBuoy },
  { name: 'Activity Log', path: '/admin/activity', icon: ScrollText },
];

export const isActiveAdminPath = (pathname: string, path: string) =>
  path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);
