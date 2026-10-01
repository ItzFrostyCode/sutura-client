import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';

export interface QueueAppointment {
  id: number; customer: string | null; what: string | null; appointment_type: string; purpose_label?: string | null;
  scheduled_at: string; branch: string | null; intake_channel: string; needs_new_time: boolean;
}
export interface QueuePayment {
  id: number; job_order_id: number; order_number: string | null; customer: string | null; amount: number; method: string; created_at: string;
}
export interface QueueDeposit { id: number; customer: string | null; method: string; scheduled_at: string }
interface Queue { appointments: { count: number; items: QueueAppointment[] }; payments: { count: number; items: QueuePayment[] }; deposits: { count: number; items: QueueDeposit[] } }

const EMPTY: Queue = { appointments: { count: 0, items: [] }, payments: { count: 0, items: [] }, deposits: { count: 0, items: [] } };

// What is waiting on the owner / branch manager right now. Reads the server's own counts
// (an independent query, never derived from a capped list) and refreshes on focus.
export function useDecisionQueue(storeId: number | undefined, enabled: boolean) {
  const toast = useToast();
  const [queue, setQueue] = useState<Queue>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!storeId || !enabled) return;
    api.get(`/stores/${storeId}/decision-queue`)
      .then((res) => setQueue(res.data?.data ?? EMPTY))
      .catch(() => setQueue(EMPTY))
      .finally(() => setLoading(false));
  }, [storeId, enabled]);

  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  const approve = async (id: number) => {
    if (!storeId) return;
    setBusyId(id);
    try {
      await api.put(`/stores/${storeId}/appointments/${id}`, { status: 'confirmed' });
      toast.success('Appointment approved. You can assign staff from the appointment.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not approve this appointment.'));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: number, reasonCode: string, note: string): Promise<boolean> => {
    if (!storeId) return false;
    setBusyId(id);
    try {
      await api.post(`/stores/${storeId}/appointments/${id}/reject`, { reason_code: reasonCode, note: note || null });
      toast.success('Appointment rejected — the customer was notified.');
      load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reject this appointment.'));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return { queue, loading, busyId, approve, reject, reload: load };
}
