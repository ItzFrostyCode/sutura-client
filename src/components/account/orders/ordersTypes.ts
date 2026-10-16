import { Clock, BadgeCheck, Shirt, Package, Flag, Ban, PauseCircle, type LucideIcon } from 'lucide-react';
import { type OrderProgress, progressLabel } from '@/components/shared/orderTracking/orderProgress';

export interface MyOrder {
  id: number;
  order_number: string;
  tracking_code: string;
  status: string;
  /** Five plain stages and one sentence, built by the server. */
  progress?: OrderProgress;
  garment_category: string | null;
  catalog_item_name: string | null;
  service_name: string | null;
  quantity?: number;
  is_rush: boolean;
  due_date: string | null;
  total_amount: number;
  balance: number;
  payment_status: string;
  // Sum of GCash/PayMaya payments submitted but not yet verified by the
  // shop — never reflected in balance/payment_status until confirmed.
  pending_payment_amount?: number;
  created_at: string;
  store: { name: string; slug: string; logo_path: string | null } | null;
}

interface PhaseMeta {
  label: string;
  Icon: LucideIcon;
  tone: string;
}

const STAGE_META: Record<string, { Icon: LucideIcon; tone: string }> = {
  request: { Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  confirmed: { Icon: BadgeCheck, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  making: { Icon: Shirt, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  ready: { Icon: Package, tone: 'text-sage bg-sage/10 border-sage/20' },
  done: { Icon: Flag, tone: 'text-sage bg-sage/10 border-sage/20' },
};

const CLOSED_TONE = 'text-danger bg-danger/10 border-danger/20';

/** Used only where a page has just the status (no progress from the server): the same five stages, coarsely. */
const STAGE_OF_STATUS: Record<string, string> = {
  pending: 'request', confirmed: 'confirmed', awaiting_materials: 'confirmed', queued: 'confirmed',
  ready_for_pickup: 'ready', balance_handover: 'ready', completed: 'done',
};
const STAGE_LABEL: Record<string, string> = { request: 'Request', confirmed: 'Confirmed', making: 'Being made', ready: 'Ready', done: 'Done' };

/** Label, icon and colour for the small badge on an order. Pass `progress` whenever the page has it. */
export function getPhaseMeta(status: string, progress?: OrderProgress | null): PhaseMeta {
  if (progress) {
    if (progress.closed) return { label: progressLabel(progress) ?? 'Closed', Icon: Ban, tone: CLOSED_TONE };
    if (progress.on_hold) return { label: 'On hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' };
    const key = progress.current ?? 'request';
    return { label: progressLabel(progress) ?? STAGE_LABEL[key], ...STAGE_META[key] };
  }
  if (status === 'cancelled' || status === 'rejected') return { label: status === 'cancelled' ? 'Cancelled' : 'Not accepted', Icon: Ban, tone: CLOSED_TONE };
  if (status === 'on_hold') return { label: 'On hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' };
  const key = STAGE_OF_STATUS[status] ?? 'making';
  return { label: STAGE_LABEL[key], ...STAGE_META[key] };
}

/** True while an order is still open: not finished and not closed. */
export function isActiveOrder(order: Pick<MyOrder, 'status' | 'progress'>): boolean {
  if (order.progress) return !order.progress.closed && order.progress.current !== 'done';
  return !['completed', 'cancelled', 'rejected'].includes(order.status);
}

export const TABS: { key: string; label: string; match: (order: MyOrder) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'active', label: 'In progress', match: (o) => isActiveOrder(o) },
  { key: 'completed', label: 'Done', match: (o) => o.status === 'completed' },
  { key: 'cancelled', label: 'Closed', match: (o) => o.status === 'cancelled' || o.status === 'rejected' },
];
