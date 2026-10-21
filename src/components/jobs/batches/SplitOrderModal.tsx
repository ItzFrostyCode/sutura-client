'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import type { Job } from '../jobTypes';
import { useSplitPlan, type Person } from './useSplitPlan';
import SplitPeopleList from './SplitPeopleList';
import SplitBatchFields from './SplitBatchFields';

const peopleOf = (job: Job): Person[] =>
  ((job.custom_order_data?.team_roster as Record<string, unknown>[] | undefined) ?? []).map((r, index) => ({
    index, name: String(r.name ?? r.player_name ?? ''), detail: [r.style, r.size].filter(Boolean).join(' · '),
  }));

/** Split a group order into batches, one per payer. The same design; each batch has its own deposit, due date and tracking code. */
export default function SplitOrderModal({ job, isOpen, onClose, onDone }: Readonly<{ job: Job; isOpen: boolean; onClose: () => void; onDone: () => Promise<void> | void }>) {
  const store = useAuthStore((s) => s.store);
  const toast = useToast();
  const router = useRouter();
  const people = peopleOf(job);
  const plan = useSplitPlan(people, Number(job.total_amount) || 0, Number(job.discount_amount) || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const invalid = plan.batches.length === 0 || plan.stays.length === 0 || plan.left.total < 0 || plan.left.discount < 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || invalid) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/stores/${store.id}/jobs/${job.id}/split`, { groups: plan.groups() });
      toast.success(res.data?.message ?? 'The order was split.');
      await onDone();
      onClose();
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not split the order.'));
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className="h-[52px] cursor-pointer rounded-lg border border-espresso/[0.12] px-6 text-base font-medium text-ink hover:bg-espresso/[0.03]">Cancel</button>
      <button type="submit" form="split-form" disabled={busy || invalid} className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-espresso px-6 text-base font-semibold text-white hover:bg-espresso/90 disabled:opacity-50">
        {busy && <Loader2 size={18} className="animate-spin" />} Split the order
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split into batches" maxWidth="max-w-2xl" footer={footer}>
      <form id="split-form" onSubmit={save} className="space-y-4">
        <p className="text-sm text-ink-muted">Use this when some people pay later. The people who stay keep this order; each batch you make becomes its own order for the same customer. Payments already received stay with this order.</p>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={plan.separately} className="h-11 cursor-pointer rounded-lg border border-espresso/[0.12] bg-white px-4 text-sm font-medium text-ink hover:bg-espresso/[0.03]">Each person separately</button>
          <button type="button" onClick={plan.reset} className="h-11 cursor-pointer px-3 text-sm font-medium text-taupe hover:underline">Start over</button>
        </div>
        <SplitPeopleList people={people} plan={plan} />
        <SplitBatchFields plan={plan} />
      </form>
    </Modal>
  );
}
