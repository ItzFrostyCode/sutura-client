import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';
import OrderSummaryCard from '@/components/shared/orderTracking/OrderSummaryCard';
import OrderAppointmentsCard from '@/components/shared/orderTracking/OrderAppointmentsCard';
import {
  Clock, Palette, Ruler, Scissors, Shirt, Wrench, Sparkles, Package, Flag,
  Ban, AlertCircle, PauseCircle, Wallet, BadgeCheck,
} from 'lucide-react';

export interface TrackedAppointment {
  id: number;
  appointment_type: string;
  status: string;
  scheduled_at: string;
  checked_in_at?: string | null;
  duration_minutes: number | null;
  service_name: string | null;
  branch: { name: string; address: string | null; city: string | null } | null;
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
  garment_category: string | null;
  quantity?: number;
  catalog_item_name?: string | null;
  service_name: string | null;
  service_package?: { id: number; name: string; services?: string[] } | null;
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
  // Present only for orders that use the ordering flow, and only on /my-orders (never the guest tracker).
  quotation_flow?: QuotationFlow | null;
  store: { name: string; slug: string; logo_path: string | null } | null;
}

/**
 * Customer-facing presentation collapse of the full internal pipeline into
 * the approved 6 phases (CUSTOMER-WORKFLOW.md §12) — a label only, derived
 * from the same real `status` this file's own detailed stepper already
 * renders below it. Internal statuses are never renamed or removed; this is
 * purely an additional, simpler "where are we, roughly" answer for the
 * customer, shown alongside — not instead of — the full stepper.
 */
export const CUSTOMER_PHASE_STATUS_MAP: Record<string, string> = {
  pending: 'Order Received',
  queued: 'Order Received',
  confirmed: 'Order Confirmed',
  awaiting_materials: 'Order Confirmed',
  design: 'In Production',
  pattern_making: 'In Production',
  mass_cutting_printing: 'In Production',
  cutting: 'In Production',
  sewing: 'In Production',
  in_repair: 'In Production',
  ready_for_fitting: 'Fitting / Inspection',
  final_adjustments: 'Adjustment / Correction',
  qc_ironing: 'Quality Check',
  qc_check: 'Finalizing',
  ready_for_pickup: 'Ready for Fitting / Collection',
  balance_handover: 'Payment & Handover',
  completed: 'Completed',
};

/** Exceptions are shown as-is (their own TERMINAL_STATUSES label below), never collapsed into a phase. */
export function getCustomerPhase(status: string): string | null {
  return CUSTOMER_PHASE_STATUS_MAP[status] ?? null;
}

// Mirrors JobProductionTimeline.tsx's STAGES exactly — the real, current
// JobOrder::STATUSES pipeline, not the idealized thesis-narrative version.
// The tracking response carries only a single `status`, no timeline[], so
// this static ordering (client-side, per the build plan) is what drives the
// stepper. Shared by /track/[code] (guest, by tracking code) and
// /account/orders/[id] (authenticated, by order id) — one source of truth
// for what "order tracking" actually looks like, not two hand-copies that
// can quietly drift apart.
const REPAIR_STATUSES = new Set(['queued', 'in_repair', 'qc_check']);
const FITTING_STATUSES = new Set(['ready_for_fitting', 'final_adjustments']);

/** The customer sees one "In Production" step for the shop's internal tasks (design, pattern, cutting, sewing). */
export function flowStageKey(status: string): string {
  if (status === 'awaiting_materials') return 'confirmed';
  return ['design', 'pattern_making', 'mass_cutting_printing', 'cutting', 'sewing'].includes(status) ? 'in_production' : status;
}

function flowStages(status: string, fitting?: TrackedOrder['fitting_requirement']): StepperStage[] {
  return [
    { key: 'pending', label: 'Pending', Icon: Clock },
    { key: 'confirmed', label: 'Confirmed', Icon: BadgeCheck },
    { key: 'in_production', label: 'In Production', Icon: Scissors },
    { key: 'qc_ironing', label: 'Quality Check', Icon: Sparkles },
    { key: 'ready_for_pickup', label: 'Ready for Fitting / Collection', Icon: Package },
    ...(fitting !== 'none' ? [{ key: 'ready_for_fitting', label: 'Fitting / Inspection', Icon: Ruler }] : []),
    // Only shown when something is actually being corrected.
    ...(status === 'final_adjustments' ? [{ key: 'final_adjustments', label: 'Adjustment / Correction', Icon: Wrench }] : []),
    { key: 'balance_handover', label: 'Payment & Handover', Icon: Wallet },
    { key: 'completed', label: 'Completed', Icon: Flag },
  ];
}

export function buildStages(
  status: string,
  timestamps?: Record<string, string | null>,
  pipeline?: TrackedOrder['pipeline'],
  usesFlow = false,
  fitting?: TrackedOrder['fitting_requirement'],
): StepperStage[] {
  const withTimestamps = (list: StepperStage[]) =>
    timestamps ? list.map((s) => ({ ...s, timestamp: timestamps[s.key] ?? null })) : list;

  // Repair Override: pending → queued → in repair → QC check → ready. The
  // tailoring stages below have none of these keys, so a repair used to
  // render with no current step at all.
  if (pipeline === 'repair' || REPAIR_STATUSES.has(status)) {
    return withTimestamps([
      { key: 'pending', label: 'Pending', Icon: Clock },
      { key: 'queued', label: 'Queued', Icon: Clock },
      { key: 'in_repair', label: 'In Repair', Icon: Wrench },
      { key: 'qc_check', label: 'QC Check', Icon: Sparkles },
      { key: 'ready_for_pickup', label: 'Ready', Icon: Package },
      { key: 'completed', label: 'Completed', Icon: Flag },
    ]);
  }

  if (usesFlow) return withTimestamps(flowStages(status, fitting));

  const stages: StepperStage[] = [
    { key: 'pending', label: 'Pending', Icon: Clock },
    { key: 'design', label: 'Design', Icon: Palette },
    // A bulk (sublimation) order always uses Mass Cutting, never
    // Pattern Making — show that label from the very first render, not just
    // once the job actually reaches that exact status. Falls back to the
    // status check alone for an older response with no `pipeline` field.
    (pipeline === 'bulk' || status === 'mass_cutting_printing')
      ? { key: 'mass_cutting_printing', label: 'Mass Cutting', Icon: Scissors }
      : { key: 'pattern_making', label: 'Pattern Making', Icon: Ruler },
    { key: 'cutting', label: 'Cutting', Icon: Scissors },
    { key: 'sewing', label: 'Sewing / Assembly', Icon: Shirt },
    { key: 'ready_for_fitting', label: 'Ready for Fitting', Icon: Ruler },
    { key: 'final_adjustments', label: 'Final Adjustments', Icon: Wrench },
    { key: 'qc_ironing', label: 'QC & Ironing', Icon: Sparkles },
    { key: 'ready_for_pickup', label: 'Ready', Icon: Package },
    { key: 'completed', label: 'Completed', Icon: Flag },
  ];

  // Standard bulk orders skip fitting — hide those two steps so they don't
  // show as "done" when they never happened. A custom-bulk job that does get
  // a sample fitting keeps them (its status is then a fitting status).
  if (pipeline === 'bulk' && !FITTING_STATUSES.has(status)) {
    return withTimestamps(stages.filter((s) => !FITTING_STATUSES.has(s.key)));
  }
  return withTimestamps(stages);
}

export const TERMINAL_STATUSES: Record<string, { label: string; Icon: typeof Ban; tone: string }> = {
  cancelled: { label: 'Cancelled', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
  rejected: { label: 'Rejected', Icon: AlertCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  on_hold: { label: 'On Hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' },
};

interface OrderTrackingViewProps {
  readonly order: TrackedOrder;
  /** Forwarded to StatusStepper — 'horizontal' (default, /track's compact
   *  guest view) or 'vertical' (/account/orders/[id]'s customer view). */
  readonly stepperLayout?: 'horizontal' | 'vertical';
}

export default function OrderTrackingView({ order, stepperLayout = 'horizontal' }: OrderTrackingViewProps) {
  const terminal = TERMINAL_STATUSES[order.status];
  const phase = terminal ? null : getCustomerPhase(order.status);

  return (
    // Own max-width lives here, not on whichever page embeds this (/account/orders/[id] and /track/[code] used to render it at
    // two different widths). From md (768px) it is two columns: the order and its production stepper — the real "saan na ang
    // order ko?" answer — on the left, the related appointments as a sticky card on the right.
    <div className="md:mx-auto md:grid md:max-w-3xl md:grid-cols-5 md:items-start md:gap-4">
      <div className="space-y-3 md:col-span-3">
        <OrderSummaryCard order={order} phase={phase} />

        <div className="card-soft p-4">
          {terminal ? (
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${terminal.tone}`}>
              <terminal.Icon size={20} />
              <span className="text-sm font-semibold">{terminal.label}</span>
            </div>
          ) : (
            <StatusStepper stages={buildStages(order.status, order.stage_timestamps, order.pipeline, Boolean(order.quotation_flow), order.fitting_requirement)} currentKey={order.quotation_flow ? flowStageKey(order.status) : order.status} layout={stepperLayout} />
          )}
        </div>
      </div>

      {order.appointments && order.appointments.length > 0 && <OrderAppointmentsCard appointments={order.appointments} />}
    </div>
  );
}
