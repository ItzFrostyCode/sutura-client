import type { OrderProgress } from '@/components/shared/orderTracking/orderProgress';
import { IN_PRODUCTION, READY_FOR_PICKUP, getPhaseMeta } from '@/components/shared/orderTracking/orderPhases';

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
  /** Linked orders: the first order of the group, this one's place in it, and the kind ('batch' | 'set'). */
  parent_order_id?: number | null;
  batch_no?: number | null;
  group_kind?: 'batch' | 'set' | null;
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

/** One badge vocabulary for every order list: the leader's approved customer phases (see orderPhases.ts). */
export { getPhaseMeta };

/** True while an order is still open: not finished and not closed. */
export function isActiveOrder(order: Pick<MyOrder, 'status'>): boolean {
  return !['completed', 'cancelled', 'rejected'].includes(order.status);
}

/** The approved Job Orders tabs. The My Profile tiles link to ?tab=production / pickup / completed. */
export const TABS: { key: string; label: string; match: (order: MyOrder) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'production', label: 'In Production', match: (o) => IN_PRODUCTION.has(o.status) },
  { key: 'pickup', label: 'Ready for Pickup', match: (o) => READY_FOR_PICKUP.has(o.status) },
  { key: 'completed', label: 'Completed', match: (o) => o.status === 'completed' },
  { key: 'cancelled', label: 'Cancelled', match: (o) => o.status === 'cancelled' || o.status === 'rejected' },
];
