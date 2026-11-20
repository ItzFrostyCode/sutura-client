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
    const active = list.filter((a) => a.status === 'pending' || a.status === 'confirmed');
    if (active.length === 0) return list[0] ?? null;
    // Earliest scheduled active appointment — fetch order is not chronological.
    return [...active].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    )[0];
  }, [appointments]);

  // Action-ranked next order: ready for pickup first, then an unpaid balance, then the
  // soonest-due one still in production (no due date goes last).
  const previewOrder = useMemo<MyOrder | null>(() => {
    const open = orders.filter((o) => !['cancelled', 'rejected', 'completed'].includes(o.status));
    const ready = open.find((o) => READY_FOR_PICKUP.has(o.status));
    if (ready) return ready;
    const owes = open.find((o) => o.balance > 0 && o.payment_status !== 'paid');
    if (owes) return owes;
    const inProduction = open
      .filter((o) => IN_PRODUCTION.has(o.status))
      .sort((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      });
    return inProduction[0] ?? null;
  }, [orders]);

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
    previewOrder,
    calCells,
    inProduction,
    readyForPickup,
    completed,
  };
}
