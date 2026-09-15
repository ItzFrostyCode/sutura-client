'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';
import {
  Clock, Palette, Printer, Ruler, Scissors, Shirt, Wrench, Sparkles, Package, Flag,
  AlertCircle, Ban, PauseCircle, CalendarDays, Wallet,
} from 'lucide-react';

interface TrackedOrder {
  order_number: string;
  status: string;
  garment_category: string | null;
  service_name: string | null;
  is_rush: boolean;
  due_date: string | null;
  total_amount: number;
  balance: number;
  payment_status: string;
  created_at: string;
  progress_photos: string[] | null;
  shop: { name: string; slug: string; logo_path: string | null } | null;
}

// Mirrors JobProductionTimeline.tsx's STAGES exactly — the real, current
// JobOrder::STATUSES pipeline, not the idealized thesis-narrative version.
// The tracking response carries only a single `status`, no timeline[], so
// this static ordering (client-side, per the build plan) is what drives the
// stepper.
function buildStages(status: string): StepperStage[] {
  return [
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
}

const TERMINAL_STATUSES: Record<string, { label: string; Icon: typeof Ban; tone: string }> = {
  cancelled: { label: 'Cancelled', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
  rejected: { label: 'Rejected', Icon: AlertCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  on_hold: { label: 'On Hold', Icon: PauseCircle, tone: 'text-ink-muted bg-sunken border-line' },
};

export default function TrackResultPage({ params }: Readonly<{ params: Promise<{ code: string }> }>) {
  const { code } = use(params);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setNotFound(false);
    api.get(`/track/${encodeURIComponent(code)}`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10">
        {loading && (
          <div className="text-center py-16 text-sm text-ink-muted">Looking up your order…</div>
        )}

        {!loading && notFound && (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center">
            <AlertCircle size={28} className="text-danger mx-auto mb-3" />
            <h1 className="text-base font-bold text-ink mb-1">No order found</h1>
            <p className="text-sm text-ink-muted mb-6">
              No order found for tracking code <span className="font-mono font-semibold">{code}</span>. Double-check the code and try again.
            </p>
            <Link href="/track" className="text-sm font-medium text-taupe hover:text-taupe-hover">
              Try another code
            </Link>
          </div>
        )}

        {!loading && !notFound && order && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-taupe">
                  {order.shop?.name ?? 'Order'}
                </p>
                <h1 className="text-display text-xl text-ink">{order.order_number}</h1>
              </div>
              {order.is_rush && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-danger/10 text-danger border border-danger/20">
                  Rush
                </span>
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
                <StatusStepper stages={buildStages(order.status)} currentKey={order.status} />
              )}
            </div>

            <div className="bg-surface border border-line rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-ink">
                <Shirt size={15} className="text-ink-faint" />
                <span className="font-medium">{order.service_name ?? order.garment_category ?? 'Garment'}</span>
              </div>
              {order.due_date && (
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <CalendarDays size={15} className="text-ink-faint" />
                  Due {new Date(order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Wallet size={15} className="text-ink-faint" />
                ₱{order.balance.toLocaleString()} balance of ₱{order.total_amount.toLocaleString()} ({order.payment_status})
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
