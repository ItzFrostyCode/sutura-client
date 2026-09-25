import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import {
  type MyAppointment,
  type DayCell,
  dayKey,
} from './appointmentTypes';

export function useAppointmentsList() {
  const toast = useToast();
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchAppointments = () => {
    setLoading(true);
    api.get('/my-appointments', { params: { per_page: 100 } })
      .then((res) => setAppointments(res.data.data ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const hasActiveAppointment = useMemo(
    () => appointments.some((a) => a.status === 'pending' || a.status === 'confirmed'),
    [appointments],
  );

  const filtered = useMemo(() => {
    let list = statusFilter === 'all' ? appointments : appointments.filter((a) => a.status === statusFilter);
    if (view === 'calendar' && selectedDay) {
      list = list.filter((a) => dayKey(new Date(a.scheduled_at)) === selectedDay);
    }
    return list;
  }, [appointments, statusFilter, view, selectedDay]);

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments) {
      const key = dayKey(new Date(a.scheduled_at));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  const handleSelfCancel = async (id: number) => {
    if (!window.confirm('Cancel this appointment? This can’t be undone.')) return;
    setCancellingId(id);
    try {
      await api.delete(`/my-appointments/${id}`);
      toast.success('Appointment cancelled.');
      fetchAppointments();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Failed to cancel appointment. Please try again.';
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date();
  const monthLabel = calMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
  const firstWeekday = calMonth.getDay();
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const cells: DayCell[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ key: `lead-${i}`, num: null, isToday: false, isPast: false, count: 0 });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), d);
    const key = dayKey(date);
    cells.push({
      key,
      num: d,
      isToday: key === dayKey(today),
      isPast: date < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      count: countsByDay.get(key) ?? 0,
    });
  }

  return {
    appointments,
    loading,
    statusFilter,
    setStatusFilter,
    view,
    setView,
    calMonth,
    setCalMonth,
    selectedDay,
    setSelectedDay,
    cancellingId,
    hasActiveAppointment,
    filtered,
    monthLabel,
    cells,
    handleSelfCancel,
  };
}
