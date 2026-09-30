import { Banknote, CreditCard, FileCheck2, LayoutDashboard, LifeBuoy, ScrollText, Store, Users, type LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

// sutura2's admin views, mapped onto this app. Apparel Categories and
// Branch Map Validation aren't here: specializations now come from the
// fixed canonical taxonomy (nothing free-text to approve), and branches are
// pinned on a map by the owner rather than queued for admin validation.
export const ADMIN_NAV: AdminNavItem[] = [
  { name: 'Overview', path: '/admin', icon: LayoutDashboard },
  { name: 'Applications', path: '/admin/applications', icon: FileCheck2 },
  { name: 'Stores', path: '/admin/stores', icon: Store },
  { name: 'Accounts', path: '/admin/accounts', icon: Users },
  { name: 'Plans', path: '/admin/plans', icon: CreditCard },
  { name: 'Plan Payments', path: '/admin/upgrades', icon: Banknote },
  { name: 'Support', path: '/admin/tickets', icon: LifeBuoy },
  { name: 'Activity Log', path: '/admin/activity', icon: ScrollText },
];

export const isActiveAdminPath = (pathname: string, path: string) =>
  path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);
