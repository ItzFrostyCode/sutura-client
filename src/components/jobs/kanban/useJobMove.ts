import { useCallback, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/useAuthStore';
import { requiresDownpayment, type Job } from '../jobHelpers';
import { depositMet } from './flowChip';

/**
 * Every way of moving an order (drag, "Move to…", status change) goes through here, so the same
 * guards apply: the downpayment and balance gates, the ordering-flow rule, and the reason pop-ups
 * for cancelling or holding. The server re-checks all of it; this just says no earlier and nicer.
 */
export function useJobMove(onUpdateStatus: (id: number, status: string, reason?: string) => void) {
  const toast = useToast();
  const repairRequiresDownpayment = Boolean(useAuthStore((s) => s.store?.repair_requires_downpayment));
  const [cancelTarget, setCancelTarget] = useState<Job | null>(null);
  const [holdTarget, setHoldTarget] = useState<Job | null>(null);

  const requestMove = useCallback((job: Job, status: string) => {
    if (status === job.status) return;

    if (job.uses_confirmation_flow && job.status === 'pending' && !['confirmed', 'on_hold', 'cancelled'].includes(status)) {
      toast.error('Confirm this order first. It needs a final quotation, the customer\'s approval and a verified deposit — open it to see what is missing.');
      return;
    }
    if (requiresDownpayment(job, status, repairRequiresDownpayment) && !depositMet(job)) {
      toast.error('No downpayment yet. The required deposit must be collected before production starts — log it first.');
      return;
    }
    if (status === 'completed' && Number.parseFloat(String(job.balance ?? '0')) > 0) {
      toast.error('Balance unpaid. The full balance must be settled before the order is marked Completed.');
      return;
    }
    if (status === 'cancelled') { setCancelTarget(job); return; }
    if (status === 'on_hold') { setHoldTarget(job); return; }
    onUpdateStatus(job.id, status);
  }, [onUpdateStatus, repairRequiresDownpayment, toast]);

  return { requestMove, repairRequiresDownpayment, cancelTarget, setCancelTarget, holdTarget, setHoldTarget };
}
