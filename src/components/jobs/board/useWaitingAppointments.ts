import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import type { Appointment } from '@/components/appointments/appointmentHelpers';

/** Visits that happened (or are on) and have no job order yet: the next orders to create. The server decides which (`awaiting_job`). */
export function useWaitingAppointments(): Appointment[] {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const [waiting, setWaiting] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!store) return;
    let live = true;
    api.get(`/stores/${store.id}/appointments`, { params: { awaiting_job: 1, ...(selectedBranchId !== null ? { branch_id: selectedBranchId } : {}) } })
      .then((res) => {
        const rows: Appointment[] = Array.isArray(res.data?.data) ? res.data.data : [];
        if (live) setWaiting(rows.filter((a) => a.customer));
      })
      .catch(() => live && setWaiting([]));
    return () => { live = false; };
  }, [store, selectedBranchId]);

  return waiting;
}
