'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, CalendarClock, CalendarDays, Calendar as CalendarIcon,
  List as ListIcon, Clock, CheckCircle2, XCircle, Ban, ChevronLeft, ChevronRight,
  Info, Lock, Loader2, AlertCircle,
} from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import AccountHeader from '@/components/account/AccountHeader';

interface MyAppointment {
  id: number;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  service_name: string | null;
  payment_status: string;
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  shop: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string; address: string | null; city: string | null } | null;
}

// Matches Appointment::STATUSES exactly (pending, confirmed, in_progress,
// completed, cancelled, no_show).
const STATUS_META: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending Confirmation', Icon: Clock, tone: 'text-ink-muted bg-sunken border-line' },
  confirmed: { label: 'Confirmed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  in_progress: { label: 'In Progress', Icon: Clock, tone: 'text-taupe bg-taupe/10 border-taupe/20' },
  completed: { label: 'Completed', Icon: CheckCircle2, tone: 'text-sage bg-sage/10 border-sage/20' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'text-danger bg-danger/10 border-danger/20' },
  no_show: { label: 'No Show', Icon: Ban, tone: 'text-danger bg-danger/10 border-danger/20' },
};

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No Show' },
];

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  measurement: 'Measurement',
  fitting: 'Fitting',
  alteration: 'Alteration',
  pickup: 'Pickup',
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [appointments, setAppointments] = useState<MyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchAppointments = () => {
    setLoading(true);
    api.get('/my-appointments', { params: { per_page: 100 } })
      .then((res) => setAppointments(res.data.data ?? []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppointments(); }, []);

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
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
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
  const cells: { key: string; num: number | null; isToday: boolean; isPast: boolean; count: number }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ key: `lead-${i}`, num: null, isToday: false, isPast: false, count: 0 });
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

  const renderCard = (appt: MyAppointment) => {
    const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
    const StatusIcon = meta.Icon;
    const scheduled = new Date(appt.scheduled_at);
    const canSelfCancel = appt.status === 'pending' || appt.status === 'confirmed';
    const isPastDue = canSelfCancel && scheduled < new Date();

    return (
      <div
        key={appt.id}
        onClick={() => router.push(`/account/appointments/${appt.id}`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/account/appointments/${appt.id}`); }}
        role="button"
        tabIndex={0}
        className="bg-surface border border-line rounded-2xl p-5 cursor-pointer hover:border-line-strong transition-colors"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          {appt.shop?.slug ? (
            <Link
              href={`/shop/${appt.shop.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-ink-muted hover:text-taupe truncate min-w-0"
            >
              {appt.shop.name}
            </Link>
          ) : (
            <span className="text-xs font-semibold text-ink-muted truncate min-w-0">Shop</span>
          )}
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${meta.tone}`}>
            <StatusIcon size={12} /> {meta.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10.5px] font-medium bg-sunken text-ink-muted rounded-full px-2.5 py-0.5">
            {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
          </span>
          {appt.intake_channel === 'walk_in' && (
            <span className="text-[10.5px] font-semibold bg-surface text-ink-muted border border-line rounded-full px-2.5 py-0.5">WALK-IN</span>
          )}
        </div>

        <p className="text-sm font-bold text-ink">
          {appt.service_name ?? (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)}
        </p>

        <div className="flex items-center gap-1 mt-1.5 text-xs text-ink-muted">
          <CalendarDays size={11} className="shrink-0" />
          {scheduled.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
        </div>

        {appt.branch && (
          <div className="flex items-center gap-1 mt-1 text-xs text-ink-muted truncate">
            <MapPin size={11} className="shrink-0" />
            {appt.branch.name}{appt.branch.city ? `, ${appt.branch.city}` : ''}
          </div>
        )}

        {isPastDue && (
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-line text-[11px] text-ink-body leading-relaxed">
            <AlertCircle size={13} className="text-ink-muted shrink-0 mt-0.5" />
            This appointment&apos;s scheduled time has already passed with no update from the shop. If you&apos;re not sure what happened, reach out to them directly.
          </div>
        )}

        {!isPastDue && appt.status === 'pending' && (
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-line text-[11px] text-ink-body leading-relaxed">
            <Info size={13} className="text-ink-muted shrink-0 mt-0.5" />
            Waiting for the shop to confirm. Walk-ins are seen first come, first served — arriving early improves your spot in line.
          </div>
        )}

        {appt.status === 'cancelled' && (
          <div className="mt-3 pt-3 border-t border-line">
            {appt.cancellation_reason && (
              <p className="text-[11px] text-ink-muted leading-relaxed mb-2">
                <span className="font-semibold text-ink-body">Reason from shop:</span> {appt.cancellation_reason}
              </p>
            )}
            {appt.rebooking_blocked ? (
              <div className="flex items-center gap-2 h-9 rounded-lg bg-sunken text-ink-faint text-xs px-3">
                <Lock size={13} /> Rebooking unavailable — contact the shop
              </div>
            ) : appt.shop?.slug ? (
              <Link
                href={`/shop/${appt.shop.slug}/book`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-line-strong text-taupe text-xs font-semibold hover:bg-sunken transition-colors"
              >
                Book a new appointment
              </Link>
            ) : null}
          </div>
        )}

        {canSelfCancel && (
          <div className="mt-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleSelfCancel(appt.id); }}
              disabled={cancellingId === appt.id}
              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-danger/30 text-xs font-semibold text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
            >
              {cancellingId === appt.id && <Loader2 size={12} className="animate-spin" />}
              Cancel this appointment
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <AccountHeader title="My Appointments" backHref="/account" />

      {hasActiveAppointment && (
        <div className="flex items-start gap-2 bg-sunken border border-line rounded-xl px-4 py-3 mb-4">
          <Info size={15} className="text-ink-muted shrink-0 mt-0.5" />
          <p className="text-xs text-ink-body leading-relaxed">
            You can only hold one active appointment per shop at a time. Cancel your current one if you&apos;d like to book a different date.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center overflow-x-auto gap-2 -mx-1 px-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === f.key ? 'bg-taupe text-white border-taupe' : 'bg-surface text-ink-muted border-line hover:bg-sunken'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex bg-sunken border border-line rounded-lg p-1 gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label="List view"
            className={`w-8 h-7 rounded-md flex items-center justify-center ${view === 'list' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'}`}
          >
            <ListIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            aria-label="Calendar view"
            className={`w-8 h-7 rounded-md flex items-center justify-center ${view === 'calendar' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'}`}
          >
            <CalendarIcon size={14} />
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading your appointments…</div>}

      {!loading && appointments.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <CalendarClock size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-body mb-1">No appointments yet</p>
          <p className="text-xs text-ink-muted mb-5">Book a fitting or consultation with a shop to see it here.</p>
          <Link href="/shops" className="text-sm font-semibold text-taupe hover:text-taupe-hover">
            Browse Shops →
          </Link>
        </div>
      )}

      {!loading && appointments.length > 0 && view === 'calendar' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-display text-base font-semibold text-ink">{monthLabel}</p>
            <div className="flex border border-line rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d); setSelectedDay(null); }}
                className="w-7 h-6 flex items-center justify-center text-ink-muted border-r border-line hover:bg-sunken"
                aria-label="Previous month"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d); setSelectedDay(null); }}
                className="w-7 h-6 flex items-center justify-center text-ink-muted hover:bg-sunken"
                aria-label="Next month"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
          <div className="border border-line rounded-xl overflow-hidden bg-surface">
            <div className="grid grid-cols-7 bg-canvas">
              {WEEKDAYS.map((w, i) => (
                <div key={`${w}-${i}`} className="text-center text-[9.5px] font-semibold tracking-wide text-ink-faint py-1.5">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  disabled={!c.num}
                  onClick={() => c.num && setSelectedDay(c.key === selectedDay ? null : c.key)}
                  className={`h-11 flex flex-col items-center justify-center border-t border-line ${
                    c.isToday ? 'bg-amber-50/50' : c.isPast ? 'bg-canvas/40' : 'bg-surface'
                  } ${selectedDay === c.key ? 'ring-1 ring-inset ring-taupe' : ''}`}
                >
                  {c.num && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
                      c.isToday ? 'bg-taupe text-white' : c.isPast ? 'text-ink-faint' : 'text-ink'
                    }`}
                    >
                      {c.num}
                    </span>
                  )}
                  {c.count > 0 && <span className="w-1 h-1 rounded-full bg-taupe mt-0.5" />}
                </button>
              ))}
            </div>
          </div>
          {!selectedDay && (
            <p className="text-xs text-ink-faint text-center mt-3">Tap a day to see your appointments.</p>
          )}
        </div>
      )}

      {!loading && appointments.length > 0 && (view === 'list' || selectedDay) && (
        filtered.length === 0 ? (
          <p className="text-xs text-ink-muted text-center py-8">
            {selectedDay ? 'No appointments on this day.' : 'No appointments match this filter.'}
          </p>
        ) : (
          <div className="space-y-3">{filtered.map(renderCard)}</div>
        )
      )}
    </div>
  );
}
