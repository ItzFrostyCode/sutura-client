import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import { isWalkInEmail } from '@/components/customers/customerHelpers';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { clearJobDraft } from './wizard/jobDraft';
import { jobProblem, submitJobOrder, type JobSubmission } from './submitJobOrder';

/**
 * A warning that stops the order until someone says go on: the shop's usual minimum was not reached (the owner or a
 * branch manager may continue if they agreed it), or the customer already has an open order for this service
 * (continue only if this is really a separate order; `openOrderId` links to the one already there).
 */
export interface BelowMinimum { readonly message: string; readonly canContinue: boolean; readonly kind: 'minimum' | 'duplicate'; readonly openOrderId?: number }

/** Sends the order: checks the form, moves an unnamed consultation to its real customer, and handles the minimum-quantity warning. */
export function useJobSubmit({ storeId, submission, appointment }: Readonly<{ storeId: number | undefined; submission: JobSubmission; appointment: Appointment | null }>) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [below, setBelow] = useState<BelowMinimum | null>(null);

  const [confirmed, setConfirmed] = useState({ minimum: false, duplicate: false });
  const run = async (confirmBelowMinimum: boolean, confirmPossibleDuplicate = confirmed.duplicate) => {
    setConfirmed({ minimum: confirmBelowMinimum, duplicate: confirmPossibleDuplicate });
    if (!storeId) return;
    const problem = jobProblem(submission);
    if (problem) return setError(problem);
    setSubmitting(true);
    setError('');
    setBelow(null);
    try {
      // A consultation that started with no name moves to the real customer first (the server needs the same customer on both).
      const { appointmentId, formData } = submission;
      if (appointmentId && appointment?.customer && isWalkInEmail(appointment.customer.email) && formData.customer_id && String(appointment.customer.id) !== formData.customer_id) {
        await api.put(`/stores/${storeId}/appointments/${appointmentId}/customer`, { customer_id: formData.customer_id });
      }
      const id = await submitJobOrder({ ...submission, confirmBelowMinimum, confirmPossibleDuplicate }, () => toast.error('The order was created, but its staff could not be saved. Assign them from Order Steps.'));
      clearJobDraft(storeId);
      // Land on the new order (its Order Steps tab) so the next step is right there.
      router.push(id ? `/dashboard/jobs/${id}` : '/dashboard/jobs');
    } catch (err) {
      const data = (err as { response?: { data?: { code?: string; message?: string; can_continue?: boolean; job_order_id?: number } } })?.response?.data;
      if (data?.code === 'below_minimum') setBelow({ kind: 'minimum', message: data.message ?? 'Below the usual minimum.', canContinue: !!data.can_continue });
      else if (data?.code === 'possible_duplicate') setBelow({ kind: 'duplicate', message: data.message ?? 'This customer already has an open order for this service.', canContinue: true, openOrderId: data.job_order_id });
      else setError(getErrorMessage(err, 'Failed to create job order.'));
      setSubmitting(false);
    }
  };

  return {
    submitting, error, below,
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => { e.preventDefault(); void run(confirmed.minimum); },
    // Confirms only the warning on screen; any warning already confirmed stays confirmed.
    continueAnyway: () => void (below?.kind === 'duplicate' ? run(confirmed.minimum, true) : run(true)),
  };
}
