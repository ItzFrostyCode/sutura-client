'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

const COLLAPSE_KEY = 'sutura_appt_bar_collapsed';

interface UpcomingAppointment {
  id: number;
  appointment_type: string;
  status: string;
  scheduled_at: string;
  store: { name: string; slug: string } | null;
}

// Landing-page reminder for a logged-in customer's nearest CONFIRMED
// appointment — deliberately confirmed-only, not pending, since a request
// still awaiting the store's response isn't a commitment yet. Renders
// nothing for guests or for a customer with no confirmed upcoming
// appointment, so it never adds clutter for the common case.
export default function UpcomingAppointmentBar() {
  // Gated on `hydrated` too, not just `isAuthenticated` — the store starts
  // unauthenticated before it reads the persisted session, so skipping that
  // check would flash this bar in and out on every load for a logged-in
  // customer (same pattern the booking wizard's auth gate already uses).
  const { isAuthenticated, hydrated } = useAuthStore();
  const [appt, setAppt] = useState<UpcomingAppointment | null>(null);
  // Expanded by default (more discoverable on a first visit) — only starts
  // collapsed once the effect below finds an explicit stored preference.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Private browsing / storage blocked — default (expanded) is fine.
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    api.get('/my-appointments', { params: { per_page: 20 } })
      .then((res) => {
        const now = Date.now();
        const upcoming: UpcomingAppointment[] = (res.data?.data ?? [])
          .filter((a: UpcomingAppointment) => a.status === 'confirmed' && new Date(a.scheduled_at).getTime() >= now)
          .sort((a: UpcomingAppointment, b: UpcomingAppointment) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
        setAppt(upcoming[0] ?? null);
      })
      .catch(() => setAppt(null));
  }, [hydrated, isAuthenticated]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      // Nothing to persist to — the toggle still works for this page view.
    }
  };

  if (!isAuthenticated || !appt) return null;

  const scheduled = new Date(appt.scheduled_at);
  const dateLabel = scheduled.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeLabel = scheduled.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const purpose = appt.appointment_type.replace('_', ' ');

  // Not sticky on its own — the page stacks this directly above PublicNav
  // inside one shared sticky wrapper, so the two scroll/pin as a single
  // unit instead of fighting over their own independent `top: 0`s.
  return (
    <div className="w-full bg-ink text-white">
      <Link
        href={`/account/appointments/${appt.id}`}
        className={`flex items-center justify-between gap-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-[height] ${collapsed ? 'h-7' : 'h-10'}`}
      >
        <span className="flex items-center gap-2 min-w-0 text-xs sm:text-sm truncate">
          <Calendar size={collapsed ? 12 : 14} className="shrink-0 text-white/80" />
          {collapsed ? (
            <span className="truncate">{dateLabel}, {timeLabel}</span>
          ) : (
            <span className="truncate">
              Upcoming {purpose} appointment with {appt.store?.name ?? 'the store'} — {dateLabel}, {timeLabel}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCollapsed(); }}
          aria-label={collapsed ? 'Expand appointment reminder' : 'Collapse appointment reminder'}
          className="shrink-0 p-1 -mr-1 text-white/70 hover:text-white"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </Link>
    </div>
  );
}
