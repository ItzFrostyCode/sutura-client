import type { ReactNode } from 'react';
import OrderSummaryCard from '@/components/shared/orderTracking/OrderSummaryCard';
import OrderAppointmentsCard from '@/components/shared/orderTracking/OrderAppointmentsCard';
import OrderStageTracker from '@/components/shared/orderTracking/OrderStageTracker';
import type { OrderProgress } from '@/components/shared/orderTracking/orderProgress';
import { TERMINAL_STATUSES, getCustomerPhase } from '@/components/shared/orderTracking/orderPhases';
import OrderBatchesCard from '@/components/shared/orderTracking/OrderBatchesCard';
import type { BatchSummary } from '@/components/jobs/batches/batchTypes';

export interface TrackedAppointment {
  id: number;
  appointment_type: string;
  status: string;
  scheduled_at: string;
  checked_in_at?: string | null;
  duration_minutes: number | null;
  service_name: string | null;
  branch: { name: string; address: string | null; city: string | null; is_main?: boolean } | null;
}

/** What the customer sees of the ordering flow (customer-safe: no costs, tailors or internal notes). */
export interface QuotationFlow {
  quotation_status: 'estimate' | 'final' | null;
  breakdown: {
    base_price: number;
    quantity_adjustment: number;
    additional_charges: { label: string; amount: number }[];
    customer_provided_deduction: { label: string; amount: number }[];
    total: number;
  } | null;
  needs_approval: boolean;
  /** What the customer last answered: accepted, changes_requested or declined. */
  decision?: 'accepted' | 'changes_requested' | 'declined' | null;
  valid_until?: string | null;
  expired?: boolean;
  terms_text?: string;
  terms_locked?: boolean;
  approved_at: string | null;
  confirmed_at: string | null;
  required_deposit: number;
  policy: string | null;
  waiting_for_materials: boolean;
}

export interface TrackedOrder {
  order_number: string;
  tracking_code?: string | null;
  status: string;
  /** Five plain stages and one sentence, built by the server. */
  progress?: OrderProgress;
  /** Set when the order was split into batches (people paying at different times). A guest sees only this batch. */
  batch?: BatchSummary | null;
  /** Number of people, for a group order. */
  people_count?: number | null;
  garment_category: string | null;
  quantity?: number;
  catalog_item_name?: string | null;
  service_name: string | null;
  is_rush: boolean;
  due_date: string | null;
  // Time-of-day refinement on top of due_date — mainly meaningful for
  // same-day repair ETAs ("ready at 3:00 PM"), additive, not a replacement.
  estimated_ready_at?: string | null;
  // Which production pipeline to draw (server-derived, same signal as the
  // shop's Kanban). Absent on older responses — buildStages() then infers
  // repair from the status alone.
  pipeline?: 'custom' | 'bulk' | 'repair';
  total_amount: number;
  balance: number;
  payment_status: string;
  // Sum of GCash/PayMaya payments submitted but not yet verified by the
  // shop — never reflected in balance/payment_status until confirmed.
  pending_payment_amount?: number;
  store_branch_id?: number | null;
  payment_policy?: 'none' | 'full' | 'deposit' | 'custom' | null;
  payment_policy_percent?: number | null;
  required_deposit?: number;
  fitting_requirement?: 'none' | 'optional' | 'required' | null;
  measurement_requirement?: 'none' | 'existing' | 'shop' | null;
  id?: number;
  created_at: string;
  updated_at?: string | null;
  // The customer's own original repair request — kept separate from any
  // staff-authored operational notes, never shown mixed together.
  repair_note?: string | null;
  customer_material_status?: 'safe' | 'damaged' | 'lost' | 'returned' | null;
  progress_photos?: string[] | null;
  // Best-effort real per-stage timestamps (see myOrderDetail's own comment)
  // — only present from /my-orders/{id}, not the guest /track lookup, so a
  // stage with no tracked data (or the guest view entirely) just shows no
  // date/time line rather than a wrong one.
  stage_timestamps?: Record<string, string | null>;
  // Appointments linked to this job (job_order_id) — 0..N, may include ones
  // scheduled before the job existed. Customer-safe subset only.
  appointments?: TrackedAppointment[];
  // Every payment on the order and the shop's decision (only from /my-orders/{id}, never the guest tracker).
  payments?: import('@/components/account/orders/OrderPaymentsCard').OrderPayment[];
  // Present only for orders that use the ordering flow, and only on /my-orders (never the guest tracker).
  quotation_flow?: QuotationFlow | null;
  store: { name: string; slug: string; logo_path: string | null } | null;
}

interface OrderTrackingViewProps {
  readonly order: TrackedOrder;
  /** 'vertical' on the signed-in order page (every step readable on a phone); 'horizontal' for the compact guest tracker. */
  readonly stepperLayout?: 'horizontal' | 'vertical';
  /** Above the order summary, in the order's column (the quotation to approve). */
  readonly before?: ReactNode;
  /** The side column's first card ("Pay for this order"), above the related appointments. Pass null when there is none. */
  readonly aside?: ReactNode;
}

export default function OrderTrackingView({ order, stepperLayout = 'vertical', before, aside }: OrderTrackingViewProps) {
  const phase = order.status in TERMINAL_STATUSES ? null : getCustomerPhase(order.status);
  const hasAppointments = !!order.appointments && order.appointments.length > 0;
  const hasSide = !!aside || hasAppointments;
  return (
    // Phone: one column — the order, its progress, then payment and appointments under it.
    // From md (768px), when there is something for the side: the order on the left (3/5); payment on top of the right
    // column (2/5), the related appointments under it. Nothing for the side: the order keeps the full width.
    <div className={`md:mx-auto md:max-w-3xl ${hasSide ? 'md:grid md:grid-cols-5 md:items-start md:gap-4' : ''}`}>
      <div className={`space-y-4 ${hasSide ? 'md:col-span-3' : ''}`}>
        {before}
        <OrderSummaryCard order={order} phase={phase} />
        <OrderStageTracker order={order} layout={stepperLayout} />
        {order.batch && <OrderBatchesCard batch={order.batch} signedIn={!!order.id} />}
      </div>

      {hasSide && (
        <div className="mt-4 space-y-4 md:sticky md:top-4 md:col-span-2 md:mt-0">
          {aside}
          {hasAppointments && <OrderAppointmentsCard appointments={order.appointments!} shopName={order.store?.name ?? null} />}
        </div>
      )}
    </div>
  );
}
