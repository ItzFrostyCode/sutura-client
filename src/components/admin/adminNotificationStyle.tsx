import { CreditCard, FileCheck2, LifeBuoy, MapPin, Shirt, Sparkles, Store } from 'lucide-react';
import type { AdminNotificationItem } from '@/store/useAdminNotificationStore';

/** One icon + accent per admin alert category, shared by the bell and the toasts. */
export function AdminCategoryIcon({ category, size = 16 }: { readonly category: string; readonly size?: number }) {
  switch (category) {
    case 'applications':
      return <Store size={size} className="text-amber-700" aria-hidden="true" />;
    case 'branches':
      return <MapPin size={size} className="text-sky-700" aria-hidden="true" />;
    case 'upgrades':
      return <CreditCard size={size} className="text-emerald-700" aria-hidden="true" />;
    case 'subscriptions':
      return <Sparkles size={size} className="text-purple-700" aria-hidden="true" />;
    case 'apparel':
      return <Shirt size={size} className="text-indigo-700" aria-hidden="true" />;
    case 'support':
      return <LifeBuoy size={size} className="text-rose-700" aria-hidden="true" />;
    default:
      return <FileCheck2 size={size} className="text-taupe" aria-hidden="true" />;
  }
}

export function adminCategoryBg(category: string): string {
  switch (category) {
    case 'applications':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'branches':
      return 'bg-sky-500/10 border-sky-500/20';
    case 'upgrades':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'subscriptions':
      return 'bg-purple-500/10 border-purple-500/20';
    case 'apparel':
      return 'bg-indigo-500/10 border-indigo-500/20';
    case 'support':
      return 'bg-rose-500/10 border-rose-500/20';
    default:
      return 'bg-sunken border-line';
  }
}

const SEVERITY_BADGE: Record<NonNullable<AdminNotificationItem['severity']>, string> = {
  amber: 'bg-amber-500/10 text-amber-900 border-amber-500/25',
  blue: 'bg-sky-500/10 text-sky-900 border-sky-500/25',
  emerald: 'bg-emerald-500/10 text-emerald-900 border-emerald-500/25',
  purple: 'bg-purple-500/10 text-purple-900 border-purple-500/25',
  indigo: 'bg-indigo-500/10 text-indigo-900 border-indigo-500/25',
  rose: 'bg-rose-500/10 text-rose-900 border-rose-500/25',
};

export function adminSeverityBadge(severity: AdminNotificationItem['severity']): string {
  return severity ? SEVERITY_BADGE[severity] : 'bg-sunken text-ink-body border-line';
}
