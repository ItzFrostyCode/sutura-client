import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import {
  type MyOrder,
  type MyAppointment,
  type CalendarCell,
  dayKey,
} from './accountTypes';
import { IN_PRODUCTION, READY_FOR_PICKUP } from '@/components/shared/orderTracking/orderPhases';

export function useAccountHub(isAuthenticated: boolean) {
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [statusCounts, setStatusCounts] = useState<{ inProduction: number; readyForPickup: number; completed: number } | null>(null);
  const [appointments, setAppointments] = useState<MyAppointment[] | null>(null);
  const [measurementCount, setMeasurementCount] = useState<number | null>(null);
  const [apptView, setApptView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/my-orders', { params: { per_page: 100 } })
      .then((res) => {
        setOrders(res.data.data ?? []);
        // Uncapped counts straight from the server; when an older server
        // doesn't send them (null), the tiles below fall back to the
        // capped-list derivation.
        const sc = res.data.status_counts;
        setStatusCounts(
          sc && typeof sc.inProduction === 'number' && typeof sc.readyForPickup === 'number' && typeof sc.completed === 'number'
            ? { inProduction: sc.inProduction, readyForPickup: sc.readyForPickup, completed: sc.completed }
            : null,
        );
      })
      .catch(() => { setOrders([]); setStatusCounts(null); });
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

  // Same rules as the Job Orders tabs the tiles open, so a tile's number always matches its tab.
  // Server counts (uncapped) win when present; the capped-list derivation below is the fallback
  // for older servers that don't send status_counts yet.
  const inProduction = statusCounts
    ? statusCounts.inProduction
    : orders.filter((o) => IN_PRODUCTION.has(o.status)).length;
  const readyForPickup = statusCounts
    ? statusCounts.readyForPickup
    : orders.filter((o) => READY_FOR_PICKUP.has(o.status)).length;
  const completed = statusCounts
    ? statusCounts.completed
    : orders.filter((o) => o.status === 'completed').length;

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
