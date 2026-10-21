'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import type { Job } from '../jobTypes';
import {
  FITTING_OPTIONS, MEASUREMENT_OPTIONS, PAYMENT_OPTIONS, fittingLabel, measurementLabel, paymentPolicyLabel,
  type FittingRequirement, type MeasurementRequirement, type PaymentPolicy,
} from '../requirements';

const PRODUCTION = ['pattern_making', 'mass_cutting_printing', 'cutting', 'sewing', 'ready_for_fitting', 'final_adjustments', 'qc_ironing', 'ready_for_pickup', 'balance_handover'];

function Group<T extends string>({ legend, usual, value, onChange, options, disabled }: Readonly<{
  legend: string; usual?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; hint: string }[]; disabled?: boolean;
}>) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="flex w-full items-baseline justify-between gap-3 text-[13px] font-medium text-ink-muted">
        <span>{legend}</span>{usual && <span className="text-xs font-normal">Service usually: {usual}</span>}
      </legend>
      <div role="radiogroup" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
            className={`min-h-12 cursor-pointer rounded-lg border px-3 py-2 text-left disabled:cursor-default disabled:opacity-60 ${value === o.value ? 'border-taupe bg-taupe/5' : 'border-espresso/[0.1] bg-white hover:border-taupe/60'}`}>
            <span className="block text-sm font-semibold text-ink">{o.label}</span>
            <span className="block text-xs text-ink-muted">{o.hint}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Change this order's rules (measurements, fitting, payment) for one customer. The service keeps its usual ones. */
export default function OrderRulesModal({ job, isOpen, onClose, onChanged }: Readonly<{ job: Job; isOpen: boolean; onClose: () => void; onChanged: () => Promise<void> | void }>) {
  const store = useAuthStore((s) => s.store);
  const toast = useToast();
  const [measure, setMeasure] = useState<MeasurementRequirement>(job.measurement_requirement ?? 'shop');
  const [fitting, setFitting] = useState<FittingRequirement>(job.fitting_requirement ?? 'optional');
  const [payment, setPayment] = useState<PaymentPolicy>(job.payment_policy === 'custom' ? 'deposit' : job.payment_policy ?? 'deposit');
  const [percent, setPercent] = useState(String(job.payment_policy_percent ?? 50));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const started = PRODUCTION.includes(job.status);
  const svc = job.service;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    if (!reason.trim()) return setError('Write a short reason.');
    setBusy(true);
    setError('');
    try {
      const body: Record<string, unknown> = { reason: reason.trim(), measurement_requirement: measure, fitting_requirement: fitting };
      if (!started) Object.assign(body, { payment_policy: payment, payment_policy_percent: payment === 'deposit' ? Number(percent) || 50 : null });
      const res = await api.put(`/stores/${store.id}/jobs/${job.id}/rules`, body);
      toast.success(res.data?.message ?? 'Saved.');
      await onChanged();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not change the rules.'));
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className="h-[52px] cursor-pointer rounded-lg border border-espresso/[0.12] px-6 text-base font-medium text-ink hover:bg-espresso/[0.03]">Cancel</button>
      <button type="submit" form="order-rules" disabled={busy} className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-espresso px-6 text-base font-semibold text-white hover:bg-espresso/90 disabled:opacity-60">
        {busy && <Loader2 size={18} className="animate-spin" />} Save the rules
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rules for this order" maxWidth="max-w-2xl" footer={footer}>
      <form id="order-rules" onSubmit={save} className="space-y-5">
        <p className="text-sm text-ink-muted">These came from the service. Change them only for this order, when you agreed it with the customer. The service itself stays the same.</p>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <Group legend="Measurements" usual={svc?.measurement_requirement ? measurementLabel(svc.measurement_requirement) : undefined} value={measure} onChange={setMeasure} options={MEASUREMENT_OPTIONS} />
        <Group legend="Final fitting" usual={svc?.fitting_requirement ? fittingLabel(svc.fitting_requirement) : undefined} value={fitting} onChange={setFitting} options={FITTING_OPTIONS} />
        <Group legend="Payment before production" usual={svc?.payment_policy ? paymentPolicyLabel(svc.payment_policy, svc.payment_policy_percent) : undefined} value={payment} onChange={setPayment} options={PAYMENT_OPTIONS} disabled={started} />
        {started && <p className="-mt-2 text-xs text-ink-muted">Production has started, so the payment rule can no longer change.</p>}
        {!started && payment === 'deposit' && (
          <div className="sm:max-w-40">
            <label htmlFor="rules_percent" className="mb-1.5 block text-[13px] font-medium text-ink-muted">Deposit (%)</label>
            <input id="rules_percent" type="number" inputMode="numeric" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} className="h-12 w-full rounded-lg border border-espresso/[0.12] bg-white px-3 text-base text-ink focus:border-taupe focus:outline-none sm:text-sm" />
          </div>
        )}
        <div>
          <label htmlFor="rules_reason" className="mb-1.5 block text-[13px] font-medium text-ink-muted">Why? <span className="text-danger">*</span></label>
          <input id="rules_reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="e.g. Regular customer, agreed to pay at pick-up" className="h-12 w-full rounded-lg border border-espresso/[0.12] bg-white px-3 text-base text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none sm:text-sm" />
          <p className="mt-1 text-xs text-ink-muted">Kept in the audit log.</p>
        </div>
      </form>
    </Modal>
  );
}
