import { Calendar, CreditCard, Info, MessageCircle, Package, Scissors, Star, Store, XCircle, type LucideIcon } from 'lucide-react';

/** What a notification is about, as a short label with its icon and colour — the first thing read on the card. */
export interface Kind { readonly label: string; readonly Icon: LucideIcon; readonly tone: string; readonly action: string }

export function kindOf(type?: string): Kind {
  if (type?.startsWith('appointment_')) return { label: 'Appointment', Icon: Calendar, tone: 'bg-blue-50 text-blue-700', action: 'View appointment' };
  if (type === 'order_ready') return { label: 'Order ready', Icon: Package, tone: 'bg-sage/10 text-sage', action: 'View order' };
  if (type?.startsWith('job_')) return { label: 'Order', Icon: Scissors, tone: 'bg-taupe/10 text-taupe-dark', action: 'View order' };
  if (type === 'customer_payment_rejected') return { label: 'Payment', Icon: XCircle, tone: 'bg-danger/10 text-danger', action: 'View order' };
  if (type?.includes('payment')) return { label: 'Payment', Icon: CreditCard, tone: 'bg-emerald-50 text-emerald-700', action: 'View payment' };
  if (type === 'catalog_item_review_reply') return { label: 'Review reply', Icon: Star, tone: 'bg-amber-50 text-amber-700', action: 'View design' };
  if (type === 'support_ticket_reply') return { label: 'Support', Icon: MessageCircle, tone: 'bg-sunken text-ink-muted', action: 'View ticket' };
  if (type?.startsWith('store_')) return { label: 'Store', Icon: Store, tone: 'bg-sunken text-ink-muted', action: 'View details' };
  return { label: 'Update', Icon: Info, tone: 'bg-sunken text-ink-muted', action: 'View details' };
}

/** "Sat, Oct 4, 2026 · 11:35 AM" — a full date, so the reader never has to work out which day "in 3 days" was. */
export function fullDateTime(value: string): string {
  const d = new Date(value);
  return `${d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}`;
}

/** When it was sent: the time for today, "Yesterday · 9:20 AM", else the date and time. */
export function sentAt(value: string): string {
  const d = new Date(value);
  const time = d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d >= today) return time;
  if (d.getTime() >= today.getTime() - 86400000) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · ${time}`;
}

export interface NotifData {
  type?: string;
  title?: string;
  message?: string;
  action_url?: string;
  store?: { id: number; name: string; slug: string; logo_path: string | null } | null;
  // Who did it (a staff member or the owner) — only on appointment and job-order notifications; shown before the shop logo.
  actor?: { id: number; name: string; profile_picture: string | null } | null;
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  created_at: string;
  read_at: string | null;
  data: NotifData;
}

/** Today / Yesterday / Earlier, newest first — the way a phone's notification list reads. */
export function groupByDay(list: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = startOfToday.getTime() - 24 * 60 * 60 * 1000;
  const groups = [
    { label: 'Today', items: [] as AppNotification[] },
    { label: 'Yesterday', items: [] as AppNotification[] },
    { label: 'Earlier', items: [] as AppNotification[] },
  ];
  [...list]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .forEach((n) => {
      const t = new Date(n.created_at).getTime();
      groups[t >= startOfToday.getTime() ? 0 : t >= startOfYesterday ? 1 : 2].items.push(n);
    });
  return groups.filter((g) => g.items.length > 0);
}

/** Facebook-style age: "Just now", "5m", "3h", "2d", then the date. */
export function ageOf(value: string): string {
  const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h`;
  if (mins < 60 * 24 * 7) return `${Math.floor(mins / (60 * 24))}d`;
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

/** New (everything unread) first, then what was read, by day: Today / Yesterday / Earlier — as Facebook lists them. */
export function sectionsOf(list: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const unread = list.filter((n) => !n.read_at).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const read = groupByDay(list.filter((n) => n.read_at));
  return [...(unread.length ? [{ label: 'New', items: unread }] : []), ...read];
}

