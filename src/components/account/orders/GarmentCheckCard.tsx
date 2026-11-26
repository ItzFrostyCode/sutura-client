'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, MapPin } from 'lucide-react';
import api from '@/lib/axios';
import { peso } from '@/components/service-order/orderMath';

export interface GarmentCheckInfo {
  state: 'waiting_for_garment' | 'as_described' | 'needs_answer' | 'accepted' | 'declined';
  note: string | null;
  photos: string[];
  lines: { label: string; amount: number }[];
  total: number | null;
  previous_total: number | null;
}
export interface DropOffInfo {
  name: string; address: string | null; landmark: string | null; operating_hours: string | null; contact_number: string | null;
  latitude?: number | null; longitude?: number | null;
}

/**
 * Work on the customer's own garment: where to bring it, then the shop's check of what it received. When the garment
 * turned out different from the request, the new price is shown like a receipt and nothing starts until they answer.
 */
export default function GarmentCheckCard({ orderId, check, dropOff, onAnswered }: Readonly<{
  orderId: number; check: GarmentCheckInfo; dropOff: DropOffInfo | null | undefined; onAnswered: () => void;
}>) {
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState('');

  const answer = async (decision: 'accept' | 'decline') => {
    setBusy(decision);
    setError('');
    try {
      await api.post(`/my-orders/${orderId}/garment-check-decision`, { decision });
      onAnswered();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Your answer didn't go through. Try again.");
    } finally {
      setBusy(null);
    }
  };

  if (check.state === 'as_described' || check.state === 'accepted') {
    return (
      <section className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
        <p className="mobile-body-sm text-ink-body">
          {check.state === 'accepted' ? 'You accepted the new price. The shop is working on it.' : 'The shop received your garment. It matches your request and is in line for work.'}
        </p>
      </section>
    );
  }
  if (check.state === 'declined') return null;

  if (check.state === 'waiting_for_garment') {
    return (
      <section aria-labelledby="drop-off" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 id="drop-off" className="mobile-h4 text-ink">Bring your garment to the shop</h2>
        <p className="mobile-body-sm mt-1 text-ink-muted">
          The shop checks it first. If it is different from what you wrote, you see the new price here and choose to go ahead or not.
        </p>
        {dropOff && (
          <div className="mt-3 flex gap-3 rounded-xl bg-sunken p-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
            <div className="mobile-body-sm min-w-0 break-words text-ink-body">
              <p className="font-semibold text-ink">{dropOff.name}</p>
              {dropOff.address && <p>{dropOff.address}</p>}
              {dropOff.landmark && <p className="text-ink-muted">Near {dropOff.landmark}</p>}
              {dropOff.operating_hours && <p className="text-ink-muted">Open {dropOff.operating_hours}</p>}
              {dropOff.contact_number && <p className="text-ink-muted">{dropOff.contact_number}</p>}
            </div>
          </div>
        )}
      </section>
    );
  }

  // needs_answer: the garment differs from the request.
  return (
    <section aria-labelledby="garment-diff" className="rounded-2xl border border-ink bg-surface p-4 sm:p-5">
      <h2 id="garment-diff" className="mobile-h4 text-ink">Your garment is different from the request</h2>
      {check.note && <p className="mobile-body-sm mt-1 break-words text-ink-body">{check.note}</p>}
      <dl className="mt-3 divide-y divide-line">
        {check.lines.map((l, i) => (
          <div key={`${l.label}-${i}`} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="mobile-body-sm min-w-0 break-words text-ink-body">1 × {l.label}</dt>
            <dd className="shrink-0 tabular-nums text-base text-ink">{peso(l.amount)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-base font-semibold text-ink">New total</dt>
          <dd className="shrink-0 tabular-nums text-xl font-bold text-ink">{peso(check.total ?? 0)}</dd>
        </div>
        {check.previous_total !== null && (
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="mobile-body-sm text-ink-muted">Your request was</dt>
            <dd className="mobile-body-sm shrink-0 tabular-nums text-ink-muted">{peso(check.previous_total)}</dd>
          </div>
        )}
      </dl>
      <p className="mobile-caption mt-2 text-ink-muted">Nothing is done to your garment until you answer. You pay at pick-up.</p>
      {error && <p role="alert" className="mobile-body-sm mt-3 text-rose-700">{error}</p>}
      <div className="mt-4 flex flex-col gap-3 min-[481px]:flex-row">
        <button type="button" onClick={() => answer('accept')} disabled={busy !== null}
          className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-base font-semibold text-white disabled:opacity-60">
          {busy === 'accept' && <Loader2 size={18} className="animate-spin" aria-hidden />}Accept and go ahead
        </button>
        <button type="button" onClick={() => answer('decline')} disabled={busy !== null}
          className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-line px-4 text-base font-semibold text-ink disabled:opacity-60">
          {busy === 'decline' && <Loader2 size={18} className="animate-spin" aria-hidden />}Decline, I&apos;ll take it back
        </button>
      </div>
    </section>
  );
}
