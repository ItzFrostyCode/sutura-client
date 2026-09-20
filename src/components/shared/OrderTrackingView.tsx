import Link from 'next/link';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';
import {
  Clock, Palette, Printer, Ruler, Scissors, Shirt, Wrench, Sparkles, Package, Flag,
  Ban, AlertCircle, PauseCircle, CalendarDays, Wallet,
} from 'lucide-react';

export interface TrackedOrder {
  order_number: string;
  tracking_code?: string | null;
  status: string;
  garment_category: string | null;
  catalog_item_name?: string | null;
  service_name: string | null;
  is_rush: boolean;
  due_date: string | null;
  total_amount: number;
  balance: number;
  payment_status: string;
  created_at: string;
  progress_photos?: string[] | null;
  // Best-effort real per-stage timestamps (see myOrderDetail's own comment)
  // — only present from /my-orders/{id}, not the guest /track lookup, so a
  // stage with no tracked data (or the guest view entirely) just shows no
  // date/time line rather than a wrong one.
  stage_timestamps?: Record<string, string | null>;
  shop: { name: string; slug: string; logo_path: string | null } | null;
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

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          {order.shop?.slug ? (
            <Link href={`/shop/${order.shop.slug}`} className="text-xs font-semibold uppercase tracking-widest text-taupe hover:text-taupe-hover">
              {order.shop.name}
            </Link>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-widest text-taupe">Order</p>
          )}
          {order.is_rush && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20 shrink-0">
              Rush
            </span>
          )}
        </div>
        <h1 className="text-display text-lg text-ink mb-2">{order.order_number}</h1>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-ink">
            <Shirt size={14} className="text-ink-faint shrink-0" />
            <span className="font-medium">{itemName}</span>
          </div>
          {order.due_date && (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <CalendarDays size={14} className="text-ink-faint shrink-0" />
              Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Wallet size={14} className="text-ink-faint shrink-0" />
            ₱{order.balance.toLocaleString()} balance of ₱{order.total_amount.toLocaleString()} ({order.payment_status})
          </div>
        </div>

        {order.tracking_code && (
          <div className="mt-2.5 pt-2.5 border-t border-line text-xs text-ink-faint">
            Tracking code: <span className="font-mono font-semibold text-ink-muted">{order.tracking_code}</span>
          </div>
        )}
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6">
        {order.status in TERMINAL_STATUSES ? (
          (() => {
            const t = TERMINAL_STATUSES[order.status];
            const TIcon = t.Icon;
            return (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${t.tone}`}>
                <TIcon size={20} />
                <span className="text-sm font-semibold">{t.label}</span>
              </div>
            );
          })()
        ) : (
          <StatusStepper stages={buildStages(order.status, order.stage_timestamps)} currentKey={order.status} layout={stepperLayout} />
        )}
      </div>
    </div>
  );
}
