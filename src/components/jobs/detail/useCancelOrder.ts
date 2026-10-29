import { useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

export const MISTAKE = 'entered_by_mistake';

/** The cancel form's answers and the one request that cancels the order. A missing answer is reported, never silently blocked. */
export function useCancelOrder(storeId: number, jobId: number, onDone: () => void) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [agreedVia, setAgreedVia] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /** Returns the name of the field to focus when something is missing. */
  const missing = (): { message: string; focus: string } | null => {
    if (!reason) return { message: 'Choose why the order is being cancelled.', focus: 'cancel-reason' };
    // An order made by mistake never involved the customer: nothing to agree to.
    if (reason === MISTAKE) return null;
    if (!agreedVia) return { message: 'Choose how the customer agreed.', focus: 'cancel-agreed-via' };
    if (!agreed) return { message: 'Tick that the customer agreed to cancel this order.', focus: 'cancel-agreed' };
    return null;
  };

  const submit = async (focusField: (id: string) => void) => {
    const gap = missing();
    if (gap) { setError(gap.message); focusField(gap.focus); return; }
    setError('');
    setBusy(true);
    try {
      await api.post(`/stores/${storeId}/jobs/${jobId}/cancel`, reason === MISTAKE
        ? { reason, note: note.trim() || null }
        : { reason, note: note.trim() || null, agreed_via: agreedVia, customer_agreed: true });
      toast.success('Order cancelled.');
      onDone();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not cancel the order.'));
    } finally {
      setBusy(false);
    }
  };

  return { reason, setReason, note, setNote, agreedVia, setAgreedVia, agreed, setAgreed, error, busy, submit };
}
