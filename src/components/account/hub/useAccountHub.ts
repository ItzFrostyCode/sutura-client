import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import {
  type MyOrder,
  type MyAppointment,
  type CalendarCell,
  IN_PRODUCTION,
  dayKey,
} from './accountTypes';

export function useAccountHub(isAuthenticated: boolean) {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [appointments, setAppointments] = useState<MyAppointment[] | null>(null);
  const [measurementCount, setMeasurementCount] = useState<number | null>(null);
  const [apptView, setApptView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => setOrders([]));
    api.get('/my-appointments', { params: { per_page: 100 } })
      .then((res) => setAppointments(res.data.data ?? []))
      .catch(() => setAppointments([]));
    api.get('/my-measurements')
      .then((res) => setMeasurementCount((res.data.data ?? []).length))
      .catch(() => setMeasurementCount(0));
  }, [isAuthenticated]);

  const hasActiveAppointment = useMemo(
    () => (appointments ?? []).some((a) => a.status === 'pending' || a.status === 'confirmed'),
    [appointments],
  );

  const previewAppt = useMemo(() => {
    const list = appointments ?? [];
    return list.find((a) => a.status === 'pending' || a.status === 'confirmed') ?? list[0] ?? null;
  }, [appointments]);

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments ?? []) {
      const key = dayKey(new Date(a.scheduled_at));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  const calCells = useMemo<CalendarCell[]>(() => {
    const today = new Date();
    const calMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstWeekday = calMonthStart.getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ key: `lead-${i}`, num: null, isToday: false, isPast: false, hasAppt: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), d);
      const key = dayKey(date);
      cells.push({
        key,
        num: d,
        isToday: key === dayKey(today),
        isPast: date < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        hasAppt: (countsByDay.get(key) ?? 0) > 0,
      });
    }
    return cells;
  }, [countsByDay]);

  const inProduction = useMemo(() => orders.filter((o) => IN_PRODUCTION.has(o.status)).length, [orders]);
  const readyForPickup = useMemo(() => orders.filter((o) => o.status === 'ready_for_pickup').length, [orders]);
  const completed = useMemo(() => orders.filter((o) => o.status === 'completed').length, [orders]);

  return {
    orders,
    appointments,
    measurementCount,
    apptView,
    setApptView,
    hasActiveAppointment,
    previewAppt,
    calCells,
    inProduction,
    readyForPickup,
    completed,
  };
}
