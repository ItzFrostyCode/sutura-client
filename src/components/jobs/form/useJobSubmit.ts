import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import { isWalkInEmail } from '@/components/customers/customerHelpers';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { jobProblem, submitJobOrder, type JobSubmission } from './submitJobOrder';

/** The shop's usual minimum was not reached: say so, and let the owner or a branch manager go on if they agreed it. */
export interface BelowMinimum { readonly message: string; readonly canContinue: boolean }

/** Sends the order: checks the form, moves an unnamed consultation to its real customer, and handles the minimum-quantity warning. */
export function useJobSubmit({ storeId, submission, appointment }: Readonly<{ storeId: number | undefined; submission: JobSubmission; appointment: Appointment | null }>) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [below, setBelow] = useState<BelowMinimum | null>(null);

  const run = async (confirmBelowMinimum: boolean) => {
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
      const id = await submitJobOrder({ ...submission, confirmBelowMinimum }, () => toast.error('The order was created, but its staff could not be saved. Assign them from Order Steps.'));
      // Land on the new order (its Order Steps tab) so the next step is right there.
      router.push(id ? `/dashboard/jobs/${id}` : '/dashboard/jobs');
    } catch (err) {
      const data = (err as { response?: { data?: { code?: string; message?: string; can_continue?: boolean } } })?.response?.data;
      if (data?.code === 'below_minimum') setBelow({ message: data.message ?? 'Below the usual minimum.', canContinue: !!data.can_continue });
      else setError(getErrorMessage(err, 'Failed to create job order.'));
      setSubmitting(false);
    }
  };

  return {
    submitting, error, below,
    handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => { e.preventDefault(); void run(false); },
    continueAnyway: () => void run(true),
  };
}
