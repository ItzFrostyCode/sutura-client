import type React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';
import CopyTrackingButton from '@/components/shared/CopyTrackingButton';
import { getMediaUrl } from '@/lib/media';
import {
  Clock, Palette, Printer, Ruler, Scissors, Shirt, Wrench, Sparkles, Package, Flag,
  Ban, AlertCircle, PauseCircle, Store, CalendarClock, Wrench as NoteIcon,
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
  /** Ready for Fitting: visit the shop by this date (YYYY-MM-DD). */
  fitting_visit_by?: string | null;
  /** The shop's "come in within N days" setting. */
  fitting_visit_days?: number | null;
  /** The shop's Ready-for-Fitting message, already filled in. */
  fitting_message?: string | null;
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
  /** How the customer chose to be measured (shop = "have the shop measure me"). /my-orders only. */
  measurement_source?: 'own' | 'saved' | 'shop' | null;
  /** The visit the shop booked to measure them; null until booked. /my-orders only. */
  measurement_visit?: { scheduled_at: string; status: string } | null;
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
  production: 'In Production',
  design: 'In Production',
  pattern_making: 'In Production',
  mass_cutting_printing: 'In Production',
  cutting: 'In Production',
  sewing: 'In Production',
  in_repair: 'In Production',
  quality_check: 'Quality Check',
  ready_for_fitting: 'Ready for Fitting',
  adjustments: 'Adjustments',
  final_adjustments: 'Adjustments',
  qc_ironing: 'Quality Check',
  qc_check: 'Quality Check',
  ready_for_pickup: 'Ready for Pickup',
  completed: 'Completed',
};

/** Exceptions are shown as-is (their own TERMINAL_STATUSES label below), never collapsed into a phase. */
export function getCustomerPhase(status: string): string | null {
  return CUSTOMER_PHASE_STATUS_MAP[status] ?? null;
}

// Order Tracking Stepper Stages
const REPAIR_STATUSES = new Set(['queued', 'in_repair', 'qc_check']);
const FITTING_STATUSES = new Set(['ready_for_fitting', 'final_adjustments', 'adjustments']);
const GRANULAR_STATUSES = new Set([
  'design',
  'pattern_making',
  'mass_cutting_printing',
  'cutting',
  'sewing',
  'final_adjustments',
  'qc_ironing',
]);

export function buildStages(
  status: string,
  timestamps?: Record<string, string | null>,
  pipeline?: TrackedOrder['pipeline'],
): StepperStage[] {
  const withTimestamps = (list: StepperStage[]) =>
    timestamps ? list.map((s) => ({ ...s, timestamp: timestamps[s.key] ?? null })) : list;

  // 1. Repair Override: pending → queued → in repair → QC check → ready → completed
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

  // 2. Granular sub-stages (legacy or detailed view if active status is one of them)
  const hasGranularTimestamps = timestamps && (timestamps.design || timestamps.cutting || timestamps.sewing);
  if (GRANULAR_STATUSES.has(status) || (hasGranularTimestamps && !['production', 'quality_check', 'adjustments'].includes(status))) {
    const granularStages: StepperStage[] = [
      { key: 'pending', label: 'Pending', Icon: Clock },
      { key: 'design', label: 'Design', Icon: Palette },
      (pipeline === 'bulk' || status === 'mass_cutting_printing')
        ? { key: 'mass_cutting_printing', label: 'Mass Cutting & Printing', Icon: Printer }
        : { key: 'pattern_making', label: 'Pattern Making', Icon: Ruler },
      { key: 'cutting', label: 'Cutting', Icon: Scissors },
      { key: 'sewing', label: 'Sewing / Assembly', Icon: Shirt },
      { key: 'ready_for_fitting', label: 'Ready for Fitting', Icon: Ruler },
      { key: 'final_adjustments', label: 'Final Adjustments', Icon: Wrench },
      { key: 'qc_ironing', label: 'QC & Ironing', Icon: Sparkles },
      { key: 'ready_for_pickup', label: 'Ready', Icon: Package },
      { key: 'completed', label: 'Completed', Icon: Flag },
    ];

    if (pipeline === 'bulk' && !FITTING_STATUSES.has(status)) {
      return withTimestamps(granularStages.filter((s) => !FITTING_STATUSES.has(s.key)));
    }
    return withTimestamps(granularStages);
  }

  // 3. Main Tailoring Pipeline: Production → Quality Check → Ready for Fitting → Adjustments → Completed
  return withTimestamps([
    { key: 'pending', label: 'Order Intake', Icon: Clock },
    { key: 'production', label: 'Production', Icon: Scissors },
    { key: 'quality_check', label: 'Quality Check', Icon: Sparkles },
    { key: 'ready_for_fitting', label: 'Ready for Fitting', Icon: Ruler },
    { key: 'adjustments', label: 'Adjustments', Icon: Wrench },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', Icon: Package },
    { key: 'completed', label: 'Completed', Icon: Flag },
  ]);
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
  /** Optional extra card(s) stacked inside the right summary column (e.g. OrderClaimsSection). */
  readonly asideExtra?: React.ReactNode;
}

const PHASE_BADGE_TONE: Record<string, string> = {
  'Order Received': 'text-ink-muted bg-sunken border-line',
  'In Production': 'text-taupe bg-taupe/10 border-taupe/20',
  'Quality Check': 'text-taupe bg-taupe/10 border-taupe/20',
  'Ready for Fitting': 'text-taupe bg-taupe/10 border-taupe/20',
  Adjustments: 'text-taupe bg-taupe/10 border-taupe/20',
  'Ready for Pickup': 'text-sage bg-sage/10 border-sage/20',
  Completed: 'text-sage bg-sage/10 border-sage/20',
};

export default function OrderTrackingView({ order, stepperLayout = 'horizontal', asideExtra }: OrderTrackingViewProps) {
  const itemName = order.catalog_item_name ?? order.service_package?.name ?? order.service_name ?? order.garment_category ?? 'Garment';
  const isTerminal = order.status in TERMINAL_STATUSES;
  const phase = isTerminal ? null : getCustomerPhase(order.status);
  const terminalMeta = isTerminal ? TERMINAL_STATUSES[order.status] : null;
  const hasMaterialNote = order.customer_material_status && order.customer_material_status !== 'safe';
  const isPaid = order.balance <= 0 || order.payment_status === 'paid';
  const hasRightColumn = (order.appointments && order.appointments.length > 0) || Boolean(asideExtra);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Order Summary Card */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        {/* Header: store + order number + status pill */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-sunken border border-line overflow-hidden relative shrink-0 flex items-center justify-center">
              {order.store?.logo_path ? (
                <Image
                  src={getMediaUrl(order.store.logo_path)}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <Store size={18} className="text-ink-faint" />
              )}
            </div>

            <div className="min-w-0">
              {order.store?.slug ? (
                <Link
                  href={`/store/${order.store.slug}`}
                  className="text-xs font-medium text-ink-muted hover:text-taupe transition-colors truncate block"
                >
                  {order.store.name}
                </Link>
              ) : (
                <p className="text-xs font-medium text-ink-muted">Order</p>
              )}
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-ink tabular-nums">
                  {order.order_number}
                </h2>
                {order.is_rush && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20 shrink-0">
                    Rush
                  </span>
                )}
              </div>
            </div>
          </div>

          {terminalMeta ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${terminalMeta.tone}`}>
              {terminalMeta.label}
            </span>
          ) : phase ? (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${PHASE_BADGE_TONE[phase] ?? 'text-taupe bg-taupe/10 border-taupe/20'}`}>
              {phase}
            </span>
          ) : null}
        </div>

        {/* Contextual alert banners */}
        {(order.status === 'ready_for_fitting' || (
          order.measurement_source === 'shop'
          && order.measurement_visit?.status !== 'completed'
          && !['completed', 'cancelled', 'rejected'].includes(order.status)
        )) && (
          <div className="px-4 sm:px-5 pb-4 space-y-2.5">
            {order.status === 'ready_for_fitting' && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-ink space-y-1">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Ruler size={15} />
                  <span>Ready for Fitting</span>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {order.fitting_message
                    || `Your garment is ready for fitting. Please visit our tailoring shop within ${order.fitting_visit_days ?? 7} days.`}
                </p>
              </div>
            )}

            {order.measurement_source === 'shop'
              && order.measurement_visit?.status !== 'completed'
              && !['completed', 'cancelled', 'rejected'].includes(order.status) && (
              <div className="p-3.5 rounded-xl bg-taupe/10 border border-taupe/25 text-ink space-y-1">
                <div className="flex items-center gap-2 text-taupe-dark font-bold text-xs uppercase tracking-wider">
                  <Ruler size={15} aria-hidden="true" />
                  <span>Measurement visit</span>
                </div>
                <p className="text-xs text-ink-body leading-relaxed">
                  {order.measurement_visit
                    ? <>Please come to the shop on <strong className="font-semibold text-ink">{new Date(order.measurement_visit.scheduled_at).toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })}</strong> so they can take your measurements.</>
                    : 'Waiting for the shop to set your measurement visit. You\'ll be notified once it\'s booked.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3-Column Summary Strip: ITEM / DUE / PAYMENT */}
        <div className="px-4 sm:px-5 py-4 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1.5">Item</p>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-sunken border border-line overflow-hidden relative shrink-0 flex items-center justify-center">
                {order.store?.logo_path ? (
                  <Image
                    src={getMediaUrl(order.store.logo_path)}
                    alt={itemName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Shirt size={18} className="text-ink-faint" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink leading-snug">
                  {itemName}
                  {(order.quantity ?? 1) > 1 && (
                    <span className="text-ink-muted font-medium tabular-nums"> × {order.quantity}</span>
                  )}
                </p>
                {order.service_package && (order.service_package.services?.length ?? 0) > 0 && (
                  <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">
                    Includes {order.service_package.services!.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1.5">Due</p>
            {order.due_date ? (
              <p className="text-sm font-semibold text-ink tabular-nums">
                {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-sm font-medium text-ink-muted">No due date set</p>
            )}
            {order.estimated_ready_at && (
              <p className="text-xs text-ink-muted mt-0.5 tabular-nums">
                Est. ready {new Date(order.estimated_ready_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1.5">Payment</p>
            <p className="text-sm font-semibold text-ink tabular-nums">
              {isPaid ? (
                <>Fully paid · ₱{order.total_amount.toLocaleString()}</>
              ) : (
                <>₱{order.balance.toLocaleString()} left of ₱{order.total_amount.toLocaleString()}</>
              )}
            </p>
            {!!order.pending_payment_amount && order.pending_payment_amount > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5 tabular-nums">
                ₱{order.pending_payment_amount.toLocaleString()} pending verification
              </p>
            )}
          </div>
        </div>

        {(order.repair_note || hasMaterialNote) && (
          <div className="px-4 sm:px-5 py-3.5 border-t border-line space-y-2">
            {order.repair_note && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted mb-0.5">
                  <NoteIcon size={13} className="text-ink-faint" />
                  <span>Repair request</span>
                </div>
                <p className="text-sm text-ink">&ldquo;{order.repair_note}&rdquo;</p>
              </div>
            )}
            {hasMaterialNote && (
              <p className="text-xs text-ink-muted">
                <span className="font-semibold text-ink">Your material: </span>
                <span className="capitalize">{order.customer_material_status}</span>
              </p>
            )}
          </div>
        )}

        {order.tracking_code && (
          <div className="px-4 sm:px-5 py-3 border-t border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 text-xs">
              <span className="text-ink-muted shrink-0">Tracking code</span>
              <span className="font-mono font-semibold text-ink truncate">{order.tracking_code}</span>
            </div>
            <CopyTrackingButton code={order.tracking_code} />
          </div>
        )}
      </div>

      {/* Bottom 2-Column Section: Progress left, Visit + Extra (Claims) right */}
      <div className={hasRightColumn ? 'grid grid-cols-1 lg:grid-cols-12 gap-4 items-start' : 'space-y-4'}>
        <div className={`bg-surface border border-line rounded-2xl p-4 sm:p-5 ${hasRightColumn ? 'lg:col-span-7' : ''}`}>
          <h3 className="text-sm font-bold text-ink mb-4">Progress</h3>
          {isTerminal ? (
            (() => {
              const t = TERMINAL_STATUSES[order.status];
              const TIcon = t.Icon;
              return (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${t.tone}`}>
                  <TIcon size={18} />
                  <span className="text-sm font-semibold">{t.label}</span>
                </div>
              );
            })()
          ) : (
            <StatusStepper
              stages={buildStages(order.status, order.stage_timestamps, order.pipeline)}
              currentKey={order.status}
              layout={stepperLayout}
            />
          )}
        </div>

        {hasRightColumn && (
          <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-20">
            {order.appointments && order.appointments.length > 0 && (
              <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5">
                <h3 className="text-sm font-bold text-ink mb-3">
                  {order.appointments.length > 1 ? 'Visits' : 'Visit'}
                </h3>
                <div className="divide-y divide-line">
                  {order.appointments.map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CalendarClock size={16} className="text-ink-faint shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink capitalize truncate">
                            {appt.appointment_type}
                            {appt.service_name ? ` — ${appt.service_name}` : ''}
                          </p>
                          <p className="text-xs text-ink-muted truncate tabular-nums">
                            {new Date(appt.scheduled_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            {appt.branch?.name ? ` · ${appt.branch.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sunken text-ink-muted border border-line capitalize shrink-0">
                        {appt.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {asideExtra}
          </div>
        )}
      </div>
    </div>
  );
}
