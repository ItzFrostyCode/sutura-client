import Link from 'next/link';
import Image from 'next/image';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';
import { getMediaUrl } from '@/lib/media';
import {
  Clock, Palette, Printer, Ruler, Scissors, Shirt, Wrench, Sparkles, Package, Flag,
  Ban, AlertCircle, PauseCircle, CalendarDays, Wallet, Store, CalendarClock, Wrench as NoteIcon,
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
  catalog_item_name?: string | null;
  service_name: string | null;
  is_rush: boolean;
  due_date: string | null;
  // Time-of-day refinement on top of due_date — mainly meaningful for
  // same-day repair ETAs ("ready at 3:00 PM"), additive, not a replacement.
  estimated_ready_at?: string | null;
  total_amount: number;
  balance: number;
  payment_status: string;
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
  design: 'In Production',
  pattern_making: 'In Production',
  mass_cutting_printing: 'In Production',
  cutting: 'In Production',
  sewing: 'In Production',
  in_repair: 'In Production',
  ready_for_fitting: 'Fitting / Adjustment',
  final_adjustments: 'Fitting / Adjustment',
  qc_ironing: 'Finalizing',
  qc_check: 'Finalizing',
  ready_for_pickup: 'Ready for Pickup',
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
export function buildStages(status: string, timestamps?: Record<string, string | null>): StepperStage[] {
  const stages: StepperStage[] = [
    { key: 'pending', label: 'Pending', Icon: Clock },
    { key: 'design', label: 'Design', Icon: Palette },
    status === 'mass_cutting_printing'
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
  if (!timestamps) return stages;
  return stages.map((s) => ({ ...s, timestamp: timestamps[s.key] ?? null }));
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
  const itemName = order.catalog_item_name ?? order.service_name ?? order.garment_category ?? 'Garment';
  const phase = order.status in TERMINAL_STATUSES ? null : getCustomerPhase(order.status);
  const hasMaterialNote = order.customer_material_status && order.customer_material_status !== 'safe';

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-line p-4">
        <div className="flex gap-3 mb-2">
          <div className="w-[52px] h-[52px] rounded-full bg-sunken overflow-hidden relative shrink-0 border border-line">
            {order.store?.logo_path ? (
              <Image
                src={getMediaUrl(order.store.logo_path)}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store size={20} className="text-ink-faint" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              {order.store?.slug ? (
                <Link href={`/store/${order.store.slug}`} className="mobile-overline text-taupe hover:text-taupe-hover py-1 inline-flex items-center">
                  {order.store.name}
                </Link>
              ) : (
                <p className="mobile-overline text-taupe">Order</p>
              )}
              {order.is_rush && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20 shrink-0">
                  Rush
                </span>
              )}
            </div>
            <h3 className="mobile-h3 font-semibold text-ink">{order.order_number}</h3>
          </div>
        </div>

        {phase && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-taupe/10 text-taupe border border-taupe/20 mb-2">
            {phase}
          </span>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mobile-body-sm text-ink font-normal">
            <Shirt size={16} className="text-ink-faint shrink-0" />
            <span>{itemName}</span>
          </div>
          {order.due_date && (
            <div className="flex items-center gap-2 mobile-body-sm text-ink-muted font-normal">
              <CalendarDays size={16} className="text-ink-faint shrink-0" />
              Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          {order.estimated_ready_at && (
            <div className="flex items-center gap-2 mobile-body-sm text-ink-muted font-normal">
              <CalendarClock size={16} className="text-ink-faint shrink-0" />
              Estimated ready {new Date(order.estimated_ready_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
          <div className="flex items-center gap-2 mobile-body-sm text-ink-muted font-normal">
            <Wallet size={16} className="text-ink-faint shrink-0" />
            ₱{order.balance.toLocaleString()} balance of ₱{order.total_amount.toLocaleString()} ({order.payment_status})
          </div>
        </div>

        {order.repair_note && (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="flex items-center gap-2 mobile-caption font-semibold text-ink-muted mb-1">
              <NoteIcon size={14} className="text-ink-faint" />
              Repair request
            </div>
            <p className="mobile-body-sm text-ink font-normal">&ldquo;{order.repair_note}&rdquo;</p>
          </div>
        )}

        {hasMaterialNote && (
          <div className="mt-3 pt-3 border-t border-line mobile-body-sm">
            <span className="font-semibold text-ink">Your material: </span>
            <span className="text-ink-muted capitalize">{order.customer_material_status}</span>
          </div>
        )}

        {order.tracking_code && (
          <div className="mt-3 pt-3 border-t border-line mobile-caption text-ink-faint">
            Tracking code: <span className="font-mono font-medium text-ink-muted">{order.tracking_code}</span>
          </div>
        )}
      </div>

      <div className="bg-surface border border-line p-4">
        {order.status in TERMINAL_STATUSES ? (
          (() => {
            const t = TERMINAL_STATUSES[order.status];
            const TIcon = t.Icon;
            return (
              <div className={`flex items-center gap-3 px-4 py-3 border ${t.tone}`}>
                <TIcon size={20} />
                <span className="text-sm font-semibold">{t.label}</span>
              </div>
            );
          })()
        ) : (
          <StatusStepper stages={buildStages(order.status, order.stage_timestamps)} currentKey={order.status} layout={stepperLayout} />
        )}
      </div>

      {order.appointments && order.appointments.length > 0 && (
        <div className="bg-surface border border-line p-4">
          <h4 className="mobile-caption font-semibold text-ink-muted mb-2">
            Related appointment{order.appointments.length > 1 ? 's' : ''}
          </h4>
          <div className="space-y-2">
            {order.appointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 py-2 border-t border-line first:border-t-0 first:pt-0">
                <CalendarClock size={16} className="text-ink-faint shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="mobile-body-sm text-ink font-medium capitalize">
                    {appt.appointment_type}
                    {appt.service_name ? ` — ${appt.service_name}` : ''}
                  </p>
                  <p className="mobile-caption text-ink-muted font-normal">
                    {new Date(appt.scheduled_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    {appt.branch?.name ? ` · ${appt.branch.name}` : ''}
                  </p>
                </div>
                <span className="mobile-caption font-semibold text-ink-muted capitalize shrink-0">
                  {appt.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
