'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { peso } from '@/components/service-order/orderMath';
import type { Job } from '../jobTypes';

type Line = { label: string; amount: string };
type Check = { result?: string; decision?: string | null; total?: number; note?: string | null };

/** An online repair / alteration / embroidery request whose garment has not been checked yet (or waits for the customer). */
export function garmentCheckState(job: Job): 'check' | 'waiting' | null {
  const repair = job.garment_category === 'alteration_repair' || (job.service?.service_types ?? []).includes('alteration_repair');
  if (!repair || job.intake_channel !== 'online' || !['pending', 'queued'].includes(job.status)) return null;
  const c = (job.custom_order_data?.garment_check ?? null) as Check | null;
  if (!c) return 'check';
  return c.result === 'different' && !c.decision ? 'waiting' : null;
}

/**
 * At the counter, when the customer brings the garment: does it match what they asked for online? A match puts it in
 * the work queue. Anything different (another garment, more damage, other work) goes back to the customer with the
 * new price line by line; work starts only once they accept.
 */
export default function GarmentCheckPanel({ job, storeId, onDone }: Readonly<{ job: Job; storeId: number; onDone?: () => Promise<void> | void }>) {
  const toast = useToast();
  const state = garmentCheckState(job);
  const asked = (job.custom_order_data?.repair_items ?? []) as { label: string; amount: number }[];
  const [different, setDifferent] = useState(false);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>(asked.length ? asked.map((l) => ({ label: l.label, amount: String(l.amount) })) : [{ label: '', amount: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!state) return null;

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const send = async (result: 'as_described' | 'different') => {
    setBusy(true);
    setError('');
    try {
      const body = result === 'different'
        ? { result, note: note.trim(), lines: lines.filter((l) => l.label.trim()).map((l) => ({ label: l.label.trim(), amount: Number(l.amount) || 0 })) }
        : { result };
      const res = await api.post(`/stores/${storeId}/jobs/${job.id}/garment-check`, body);
      toast.success(res.data?.message ?? 'Saved.');
      await onDone?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Not saved. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'waiting') {
    const c = job.custom_order_data?.garment_check as Check;
    return (
      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-base font-semibold text-ink">Waiting for the customer</h2>
        <p className="mt-1 text-sm text-ink-muted">You sent a new price of {peso(Number(c.total ?? 0))}. Work can start once they accept. If they decline, return the garment; nothing is charged.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-ink bg-surface p-4 sm:p-5">
      <h2 className="text-base font-semibold text-ink">Check the garment</h2>
      <p className="mt-1 text-sm text-ink-muted">Compare what the customer brought with the request: {String(job.custom_order_data?.repair_note ?? 'their garment')}.</p>
      {!different ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" disabled={busy} onClick={() => send('as_described')} className="h-12 flex-1 rounded-xl bg-ink px-4 text-base font-semibold text-white disabled:opacity-60">It matches, add to work queue</button>
          <button type="button" disabled={busy} onClick={() => setDifferent(true)} className="h-12 flex-1 rounded-xl border border-line px-4 text-base font-semibold text-ink">It&apos;s different</button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <label className={PLAIN_LABEL}>What is different
            <textarea rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Also has a torn side seam" className={`${PLAIN_FIELD} mt-1.5 h-auto py-2 font-normal`} />
          </label>
          <div className="space-y-2">
            <p className={PLAIN_LABEL}>Work and price for the garment as it is</p>
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={l.label} maxLength={80} onChange={(e) => setLine(i, { label: e.target.value })} placeholder="Work" aria-label={`Work ${i + 1}`} className={`${PLAIN_FIELD} min-w-0 flex-1`} />
                <input value={l.amount} inputMode="decimal" onChange={(e) => setLine(i, { amount: e.target.value.replace(/[^\d.]/g, '') })} placeholder="₱" aria-label={`Price ${i + 1}`} className={`${PLAIN_FIELD} w-28 text-right tabular-nums`} />
                <button type="button" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} disabled={lines.length === 1} aria-label={`Remove work ${i + 1}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-rose-700 disabled:opacity-30"><Trash2 size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setLines((ls) => [...ls, { label: '', amount: '' }])} className="flex h-11 items-center gap-1 text-sm font-semibold text-ink"><Plus size={16} /> Add work</button>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink"><span>New total</span><span className="tabular-nums">{peso(total)}</span></div>
          </div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={busy || !note.trim()} onClick={() => send('different')} className="h-12 flex-1 rounded-xl bg-ink px-4 text-base font-semibold text-white disabled:opacity-60">Send to customer to accept</button>
            <button type="button" disabled={busy} onClick={() => setDifferent(false)} className="h-12 flex-1 rounded-xl border border-line px-4 text-base font-semibold text-ink">Back</button>
          </div>
        </div>
      )}
      {!different && error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    </section>
  );
}
