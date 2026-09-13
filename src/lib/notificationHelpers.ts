import {
  Package,
  Scissors,
  Calendar,
  CreditCard,
  UserCog,
  XCircle,
  AlertTriangle,
  PackageOpen,
  PauseCircle,
  Info,
  MessageSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NotifData {
  type?: string;
  title?: string;
  message?: string;
  action_url?: string;
  customer_name?: string;
  staff_name?: string;
  sender_name?: string;
  shop_name?: string;
  order_number?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  created_at: string;
  read_at: string | null;
  data: NotifData;
}

export interface NotificationSender {
  name: string;
  initial: string;
  initials: string;
  colorClass: string;
}

export function getSenderInfo(notif: AppNotification): NotificationSender {
  const data = notif.data || {};
  let rawName =
    data.customer_name ||
    data.staff_name ||
    data.sender_name ||
    data.shop_name;

  if (!rawName) {
    const type = data.type || '';
    if (type.startsWith('job_') || type === 'new_job_order') rawName = 'Order Operations';
    else if (type.startsWith('appointment_')) rawName = 'Appointment Desk';
    else if (type.startsWith('payment_')) rawName = 'Billing & Payments';
    else if (type.includes('review')) rawName = 'Customer Feedback';
    else rawName = 'SUTURA System';
  }

  const name = String(rawName).trim();
  const initial = name.charAt(0).toUpperCase() || 'S';

  return {
    name,
    initial,
    initials: initial,
    colorClass: 'bg-canvas border border-line text-taupe',
  };
}

export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function relativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDateTime(dateStr);
  } catch {
    return dateStr;
  }
}

export function relativeHoursAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) {
      const mins = Math.max(1, Math.floor(diff / 60000));
      return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    }
    if (hrs < 24) {
      return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } catch {
    return 'recently';
  }
}

export interface TypeConfig {
  icon: LucideIcon;
  bg: string;
  color: string;
  label: string;
}

export const TYPE_CONFIG: Record<string, TypeConfig> = {
  order_ready: {
    icon: Package,
    bg: 'bg-amber-50',
    color: 'text-amber-700',
    label: 'Order Ready',
  },
  new_job_order: {
    icon: Scissors,
    bg: 'bg-sunken',
    color: 'text-taupe',
    label: 'New Job',
  },
  appointment_booked: {
    icon: Calendar,
    bg: 'bg-blue-50',
    color: 'text-blue-700',
    label: 'Appointment',
  },
  payment_received: {
    icon: CreditCard,
    bg: 'bg-emerald-50',
    color: 'text-emerald-700',
    label: 'Payment Received',
  },
  new_catalog_order: {
    icon: Package,
    bg: 'bg-violet-50',
    color: 'text-violet-700',
    label: 'Catalog Order',
  },
  staff_assigned: {
    icon: UserCog,
    bg: 'bg-sunken',
    color: 'text-taupe',
    label: 'Staff Assigned',
  },
  payment_rejected: {
    icon: XCircle,
    bg: 'bg-red-50',
    color: 'text-red-700',
    label: 'Payment Rejected',
  },
  overdue_jobs_digest: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    color: 'text-amber-700',
    label: 'Overdue Jobs',
  },
  unclaimed_pickups_digest: {
    icon: PackageOpen,
    bg: 'bg-orange-50',
    color: 'text-orange-700',
    label: 'Unclaimed Pickups',
  },
  jobs_on_hold_digest: {
    icon: PauseCircle,
    bg: 'bg-amber-50',
    color: 'text-amber-700',
    label: 'Jobs On Hold',
  },
  subscription_expired: {
    icon: CreditCard,
    bg: 'bg-red-50',
    color: 'text-red-700',
    label: 'Subscription Notice',
  },
  customer_review: {
    icon: MessageSquare,
    bg: 'bg-emerald-50',
    color: 'text-emerald-700',
    label: 'Customer Review',
  },
  default: {
    icon: Info,
    bg: 'bg-sunken',
    color: 'text-ink-muted',
    label: 'Notification',
  },
};

export function getTypeConfig(type?: string): TypeConfig {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type];
  if (type?.startsWith('job_')) return TYPE_CONFIG.new_job_order;
  if (type?.startsWith('appointment_')) return TYPE_CONFIG.appointment_booked;
  return TYPE_CONFIG.default;
}

export function getActionLabel(notif: AppNotification): string {
  const data = notif.data || {};
  const type = data.type || '';
  if (data.action_url?.includes('/jobs')) return 'View Job Order';
  if (data.action_url?.includes('/appointments')) return 'View Appointment';
  if (data.action_url?.includes('/payments')) return 'View Payment';
  if (data.action_url?.includes('/catalog')) return 'View Catalog Item';
  if (data.action_url?.includes('/customers')) return 'View Customer';
  if (type.includes('payment')) return 'View Payment Details';
  if (type.includes('appointment')) return 'View Appointment';
  if (type.includes('job') || data.job_order_id) return 'View Job Order';
  return 'View Details';
}
