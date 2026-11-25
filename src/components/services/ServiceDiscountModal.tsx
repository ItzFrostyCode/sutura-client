'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Tag } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import { INPUT_CLASS } from '@/components/store-application/ApplicationFields';
import { getActiveSale, saleDay, saleDayLabel } from '@/lib/salePricing';
import type { Service } from './serviceHelpers';

// Today and N days from now as Manila calendar dates (YYYY-MM-DD).
const manilaDay = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PRESETS = [3, 7, 14, 30];

/**
 * Services → Discount: a % off one service (every price tier) between two
 * dates (Manila days, both inclusive). Server: ServiceController::setDiscount.
 * Customers see the badge, the struck-out price and the end date until it ends.
 */
export default function ServiceDiscountModal({ isOpen, onClose, services, storeId, onSaved }: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  storeId: number | undefined;
  onSaved: () => void;
}>) {
  const toast = useToast();
  // Only priced services can be discounted.
  const priced = useMemo(() => services.filter((s) => s.base_price != null && Number(s.base_price) > 0), [services]);
  const [serviceId, setServiceId] = useState('');
  const [percent, setPercent] = useState('20');
  const [startsOn, setStartsOn] = useState(manilaDay());
  const [endsOn, setEndsOn] = useState(manilaDay(7));
  const [busy, setBusy] = useState<'save' | 'remove' | null>(null);

  // A discount already set on a service (running now, or starting later).
  const currentDiscount = (s: Service | null) => (s?.sale_percent && s.sale_ends_at && saleDay(s.sale_ends_at) >= manilaDay() ? s : null);
  // Picking a service loads its current discount, or the defaults (20%, the next 7 days).
  const pick = (id: string) => {
    setServiceId(id);
    const cur = currentDiscount(priced.find((s) => String(s.id) === id) ?? null);
    setPercent(cur ? String(cur.sale_percent) : '20');
    setStartsOn(cur?.sale_starts_at ? saleDay(cur.sale_starts_at) : manilaDay());
    setEndsOn(cur?.sale_ends_at ? saleDay(cur.sale_ends_at) : manilaDay(6));
  };

  useEffect(() => {
    if (isOpen) pick(priced[0] ? String(priced[0].id) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, priced]);

  const service = priced.find((s) => String(s.id) === serviceId) ?? null;
  const existing = currentDiscount(service);
  const running = existing && existing.base_price != null
    ? getActiveSale({ price: existing.base_price, sale_price: existing.sale_price, sale_starts_at: existing.sale_starts_at, sale_ends_at: existing.sale_ends_at })
    : null;

  const pct = Number(percent);
  const pctOk = Number.isInteger(pct) && pct >= 1 && pct <= 90;
  const datesOk = Boolean(startsOn && endsOn) && endsOn >= startsOn && endsOn >= manilaDay();
  const base = service ? Number(service.base_price) : 0;
  const discounted = pctOk ? Math.round(base * (100 - pct)) / 100 : null;
  const days = datesOk ? Math.round((Date.parse(endsOn) - Date.parse(startsOn)) / 86_400_000) + 1 : 0;

  const send = async (kind: 'save' | 'remove') => {
    if (!storeId || !service) return;
    setBusy(kind);
    try {
      const url = `/stores/${storeId}/services/${service.id}/discount`;
      const res = kind === 'save'
        ? await api.put(url, { percent: pct, starts_on: startsOn, ends_on: endsOn })
        : await api.delete(url);
      toast.success(res.data.message);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, kind === 'save' ? 'Could not save the discount.' : 'Could not remove the discount.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discount a service"
      maxWidth="max-w-lg"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {existing && (
            <button type="button" onClick={() => send('remove')} disabled={busy !== null}
              className="h-11 rounded-xl border border-danger/40 bg-white px-4 text-sm font-semibold text-danger hover:bg-danger/5 disabled:opacity-50 cursor-pointer sm:mr-auto">
              {busy === 'remove' ? 'Removing…' : 'Remove discount'}
            </button>
          )}
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-line-strong bg-white px-4 text-sm font-semibold text-ink hover:bg-canvas cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={() => send('save')} disabled={!service || !pctOk || !datesOk || busy !== null}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-taupe px-5 text-sm font-semibold text-white hover:bg-taupe-hover disabled:opacity-50 cursor-pointer">
            {busy === 'save' && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {existing ? 'Update discount' : 'Save discount'}
          </button>
        </div>
      }
    >
      {priced.length === 0 ? (
        <p className="text-sm text-ink-muted">Add a service with a price first. Only priced services can be discounted.</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div>
            <label htmlFor="discount-service" className="mb-1.5 block text-ink">Service<span className="text-danger">*</span></label>
            <select id="discount-service" value={serviceId} onChange={(e) => pick(e.target.value)} className={INPUT_CLASS}>
              {priced.map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {peso(Number(s.base_price))}{s.sale_percent ? ` (${s.sale_percent}% off set)` : ''}</option>
              ))}
            </select>
            {existing && (
              <p className="mt-1.5 text-xs text-rose-700">
                {running
                  ? `${existing.sale_percent}% off now, until ${existing.sale_ends_at ? saleDayLabel(existing.sale_ends_at) : 'its end date'}.`
                  : `${existing.sale_percent}% off starts ${existing.sale_starts_at ? saleDayLabel(existing.sale_starts_at) : 'later'}.`}{' '}
                Saving replaces it.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="discount-percent" className="mb-1.5 block text-ink">Discount<span className="text-danger">*</span></label>
            <div className="relative">
              <input id="discount-percent" type="number" inputMode="numeric" min={1} max={90} step={1} value={percent}
                onChange={(e) => setPercent(e.target.value.replace(/\D/g, '').slice(0, 2))} className={`${INPUT_CLASS} pr-10 tabular-nums`} />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">%</span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">1 to 90%. It comes off every price option of this service.</p>
          </div>

          <div>
            <p className="mb-1.5 text-ink">How long<span className="text-danger">*</span></p>
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Quick durations">
              {PRESETS.map((d) => (
                <button key={d} type="button" onClick={() => { setStartsOn(manilaDay()); setEndsOn(manilaDay(d - 1)); }}
                  className={`min-h-9 rounded-full border px-3.5 text-xs font-semibold cursor-pointer ${startsOn === manilaDay() && endsOn === manilaDay(d - 1) ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-ink-body hover:border-ink'}`}>
                  {d} days
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="discount-start" className="mb-1 block text-xs text-ink-muted">Starts</label>
                <input id="discount-start" type="date" min={manilaDay()} value={startsOn} onChange={(e) => setStartsOn(e.target.value)} className={INPUT_CLASS} />
              </div>
              <div>
                <label htmlFor="discount-end" className="mb-1 block text-xs text-ink-muted">Ends (last day)</label>
                <input id="discount-end" type="date" min={startsOn || manilaDay()} value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={INPUT_CLASS} />
              </div>
            </div>
            {!datesOk && <p className="mt-1.5 text-xs text-danger">The last day must be today or later, and not before the start.</p>}
          </div>

          {service && discounted !== null && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <Tag size={18} className="shrink-0 text-rose-600" aria-hidden="true" />
              <p className="text-ink">
                <span className="font-bold text-rose-600 tabular-nums">{peso(discounted)}</span>{' '}
                <span className="text-ink-faint line-through tabular-nums">{peso(base)}</span>
                <span className="block text-xs text-ink-muted">
                  Customers see {pct}% off{datesOk ? ` for ${days} ${days === 1 ? 'day' : 'days'}, through ${saleDayLabel(endsOn)}` : ''}. Then the price goes back to normal.
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
