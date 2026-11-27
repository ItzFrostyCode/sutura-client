'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, Scissors } from 'lucide-react';
import type { Job } from '../jobTypes';
import type { ComputedFinancials } from './financialsTypes';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * "Fabric deduction" on an order where the customer brings their own fabric.
 * Lowers the balance like a discount, but is recorded and labelled as a fabric
 * deduction. Suggests the service's per-piece amount × quantity, minus what was
 * already taken off (when the order was placed, or here before).
 */
export default function FabricDeductionBox({ job, financials, onApply }: Readonly<{
  job: Job;
  financials: ComputedFinancials;
  onApply: (amount: number, reason: string, kind: 'fabric') => Promise<void>;
}>) {
  const { remainingBalance, jobIsCompleted, jobIsCancelled } = financials;
  const data = (job.custom_order_data ?? {}) as Record<string, unknown>;
  const already = num(data.own_fabric_deduction) + num(data.own_fabric_deduction_after);
  const perPiece = num(job.service?.own_fabric_deduction);
  const suggested = useMemo(
    () => Math.max(0, Math.min(remainingBalance, perPiece * (job.quantity ?? 1) - already)),
    [remainingBalance, perPiece, job.quantity, already],
  );

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState("Customer's own fabric / materials");
  const [busy, setBusy] = useState(false);

  if (job.material_source !== 'customer_supplied' || jobIsCompleted || jobIsCancelled) return null;

  const value = Math.min(remainingBalance, num(amount));
  const submit = async () => {
    if (value <= 0) return;
    setBusy(true);
    try {
      await onApply(Math.round(value * 100) / 100, reason.trim() || "Customer's own fabric / materials", 'fabric');
      setOpen(false);
      setAmount('');
    } catch { /* the toast already says why */ } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Fabric / other materials deduction"className="rounded-2xl border-2 border-taupe/40 bg-taupe/[0.07] p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-taupe text-white shadow-2xs">
          <Scissors size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-taupe-dark">Customer brings own fabric</p>
          <h3 className="text-base font-bold text-ink leading-snug">Fabric / Other Materials Deduction</h3>
          {already === 0 && (
            <p className="mt-0.5 text-xs text-ink-body">
              {perPiece > 0
                ? <>This service takes <strong className="font-semibold text-ink">{peso(perPiece)}</strong> off per piece for the fabric. Add more for any other materials they bring.</>
                : 'Take off the cost of what the customer brought (fabric, lining, buttons, zippers or other trims). No fixed amount on this service, so enter it after checking the materials.'}
            </p>
          )}
        </div>
      </div>

      {already > 0 && (
        <div className="flex items-baseline justify-between gap-3 rounded-xl border border-taupe/30 bg-white px-4 py-3">
          <span className="text-xs font-semibold text-ink-body">Already taken off</span>
          <span className="text-xl font-bold tabular-nums text-taupe-dark">−{peso(already)}</span>
        </div>
      )}

      {remainingBalance <= 0 ? (
        <p className="text-xs text-ink-muted">Nothing left to pay, so nothing more to take off.</p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => { setAmount(suggested > 0 ? String(suggested) : ''); setOpen(true); }}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-taupe text-sm font-bold text-white shadow-2xs transition-colors hover:bg-taupe-hover cursor-pointer"
        >
          <Scissors size={15} aria-hidden="true" />
          {already > 0 ? 'Take off more' : 'Apply deduction'}{suggested > 0 ? ` (${peso(suggested)})` : ''}
        </button>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-body">Amount to take off</span>
              <span className="flex h-10 items-center gap-1 rounded-lg border border-line bg-white px-3 focus-within:border-taupe">
                <span className="text-xs font-bold text-ink-faint">₱</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={remainingBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold tabular-nums text-ink focus:outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-body">Reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-taupe focus:outline-none"
              />
            </label>
          </div>
          {value > 0 && (
            <p className="text-xs tabular-nums text-ink-muted">
              Balance {peso(remainingBalance)} − {peso(value)} = <strong className="text-ink">{peso(Math.max(0, remainingBalance - value))}</strong>
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer">Cancel</button>
            <button
              type="button"
              disabled={busy || value <= 0}
              onClick={() => void submit()}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-taupe px-4 text-xs font-bold text-white hover:bg-taupe-hover disabled:opacity-50 cursor-pointer"
            >
              {busy && <Loader2 size={12} className="animate-spin" />} Apply
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
