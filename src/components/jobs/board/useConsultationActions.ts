import { useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, type Appointment } from '@/components/appointments/appointmentHelpers';

/** The two things a consultation can do besides becoming an order: be marked "No order" (with an optional reason), or get another visit booked. */
export function useConsultationActions(appointment: Appointment, onRemove: (id: number) => void) {
  const { store } = useAuthStore();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpBusy, setFollowUpBusy] = useState(false);

  const cancelNoOrder = () => { setAsking(false); setNote(''); };

  const confirmNoOrder = async () => {
    if (!store || busy) return;
    setBusy(true);
    try {
      await api.post(`/stores/${store.id}/appointments/${appointment.id}/no-order`, { note: note.trim() || undefined });
      toast.success('Marked as no order.');
      onRemove(appointment.id);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not mark this visit as no order.'));
      setBusy(false);
    }
  };

  const bookFollowUp = async (payload: Record<string, unknown>) => {
    if (!store) return;
    setFollowUpBusy(true);
    try {
      await api.post(`/stores/${store.id}/appointments/follow-up`, payload);
      toast.success('Follow-up visit booked.');
      setFollowUpOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not book the follow-up visit.'));
    } finally {
      setFollowUpBusy(false);
    }
  };

  return { asking, setAsking, note, setNote, busy, cancelNoOrder, confirmNoOrder, followUpOpen, setFollowUpOpen, followUpBusy, bookFollowUp };
}
