import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import type { Appointment } from '@/components/appointments/appointmentHelpers';

const OPEN = ['confirmed', 'in_progress', 'completed'];
const DROPPED = ['no_show', 'cancelled', 'rescheduled'];

/** Appointments that took place (or are on) but have no order yet: the next orders to write up. Soonest first. */
export function useWaitingAppointments(): Appointment[] {
  const { store } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const [waiting, setWaiting] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!store) return;
    let live = true;
    api.get(`/stores/${store.id}/appointments`, { params: selectedBranchId !== null ? { branch_id: selectedBranchId } : {} })
      .then((res) => {
        const rows: Appointment[] = Array.isArray(res.data?.data) ? res.data.data : [];
        if (live) setWaiting(rows.filter((a) => OPEN.includes(a.status) && !a.job_order_id && !(a.outcome && DROPPED.includes(a.outcome)) && a.customer));
      })
      .catch(() => live && setWaiting([]));
    return () => { live = false; };
  }, [store, selectedBranchId]);

  return waiting;
}
