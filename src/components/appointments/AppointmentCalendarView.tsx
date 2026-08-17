import React from 'react';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Eye, Plus, Building2, UserCheck, Phone
} from 'lucide-react';
import {
  Appointment, TYPE_CONFIG,
  StatusBadge, TypeBadge, getLocalDateString, formatScheduled, getCustomerInitials
} from './appointmentHelpers';

interface AppointmentCalendarViewProps {
  readonly appointments: Appointment[];
  readonly currentDate: Date;
  readonly setCurrentDate: (d: Date) => void;
  readonly selectedDay: Date | null;
  readonly setSelectedDay: (d: Date | null) => void;
  readonly calSubMode: 'month' | 'day';
  readonly setCalSubMode: (m: 'month' | 'day') => void;
  readonly hoveredAptId: number | null;
  readonly setHoveredAptId: (id: number | null) => void;
  readonly actionLoadingId: number | null;
  readonly isOwnerOrManager: boolean;

  // Actions
  readonly onReviewClick: (apt: Appointment) => void;
  readonly onStartClick: (aptId: number) => void;
  readonly onCompleteClick: (apt: Appointment) => void;
  readonly onCreateJobClick: (apt: Appointment) => void;
  readonly onDetailsClick: (apt: Appointment) => void;
  readonly onNoShowClick: (apt: Appointment) => void;
  readonly onAddClick: (dayStr: string, defaultTime: string) => void;
}

export default function AppointmentCalendarView({
  appointments, currentDate, setCurrentDate, selectedDay, setSelectedDay,
  calSubMode, setCalSubMode, hoveredAptId, setHoveredAptId, actionLoadingId,
  isOwnerOrManager,
  onReviewClick, onStartClick, onCompleteClick, onCreateJobClick, onDetailsClick, onNoShowClick, onAddClick
}: AppointmentCalendarViewProps) {

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Complete the grid into full 7-column rows so Saturday never cuts off
  const totalSlots = paddingDays.length + daysInMonth;
  const trailingSlotsCount = (7 - (totalSlots % 7)) % 7;
  const trailingDays = Array.from({ length: trailingSlotsCount }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now);
  };

  // ── MONTH VIEW ───────────────────────────────────────────────────────
  if (calSubMode === 'month') {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        {/* Navigation & Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-display text-xl sm:text-2xl font-bold text-ink">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-line bg-canvas hover:bg-sunken text-taupe transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-line rounded-lg bg-canvas overflow-hidden">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-2 hover:bg-sunken text-ink-muted hover:text-ink transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="w-px h-4 bg-line" />
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="p-2 hover:bg-sunken text-ink-muted hover:text-ink transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Unified 7-Column Calendar Card (Zero Cutoffs on Saturday) */}
        <div className="w-full border border-line rounded-xl overflow-hidden shadow-2xs bg-surface">
          {/* Day Headers Row */}
          <div className="grid grid-cols-7 bg-canvas border-b border-line">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div
                key={d}
                className={`text-center text-[10px] sm:text-xs font-bold text-ink-faint uppercase tracking-wider py-2.5 ${
                  i < 6 ? 'border-r border-line' : ''
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Month Day Cells (Responsive auto-fit height) */}
          <div className="grid grid-cols-7">
            {/* Leading Padding Days */}
            {paddingDays.map((_, i) => (
              <div
                key={`empty-prev-${i}`}
                className={`h-14 sm:h-16 lg:h-[72px] bg-canvas/30 border-b border-line p-1.5 sm:p-2 ${
                  i < 6 ? 'border-r' : ''
                }`}
              />
            ))}

            {/* Calendar Days */}
            {daysArray.map((day, idx) => {
              const y = year;
              const m = String(month + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const dateStr = `${y}-${m}-${d}`;

              const dayEvents = appointments.filter(a => {
                const str = a.scheduled_at.includes('T') ? a.scheduled_at.split('T')[0] : a.scheduled_at.split(' ')[0];
                return str === dateStr;
              });

              const todayLocal = getLocalDateString(new Date());
              const isToday = dateStr === todayLocal;
              const isPast = new Date(y, month, day) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
              const colIdx = (paddingDays.length + idx) % 7;
              const isLastColInRow = colIdx === 6;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => {
                    setSelectedDay(new Date(y, month, day));
                    setCalSubMode('day');
                  }}
                  className={`h-14 sm:h-16 lg:h-[72px] p-1.5 sm:p-2 group transition-colors text-left w-full relative flex flex-col justify-between border-b border-line ${
                    isLastColInRow ? '' : 'border-r'
                  } ${
                    isToday
                      ? 'bg-amber-50/25 hover:bg-amber-50/45'
                      : isPast
                      ? 'bg-canvas/20 hover:bg-canvas/45'
                      : 'bg-surface hover:bg-canvas/50'
                  }`}
                >
                  {/* Top-Left: Day Number */}
                  <div className="flex items-center justify-start w-full">
                    <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-bold ${
                      isToday ? 'bg-taupe text-white shadow-2xs' : isPast ? 'text-ink-faint' : 'text-ink group-hover:text-taupe'
                    }`}>
                      {day}
                    </span>
                  </div>

                  {/* Center (Sa Gitna): Appointment Count Badge */}
                  <div className="my-auto flex flex-col items-center justify-center">
                    {dayEvents.length > 0 && (
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-taupe/10 text-taupe border border-taupe/20 tabular-nums shadow-2xs group-hover:bg-taupe group-hover:text-white transition-colors">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Bottom spacing helper */}
                  <div className="h-1" />
                </button>
              );
            })}

            {/* Trailing Padding Days */}
            {trailingDays.map((_, i) => {
              const colIdx = (paddingDays.length + daysArray.length + i) % 7;
              const isLastColInRow = colIdx === 6;
              return (
                <div
                  key={`empty-next-${i}`}
                  className={`h-14 sm:h-16 lg:h-[72px] bg-canvas/30 border-b border-line p-1.5 sm:p-2 ${
                    isLastColInRow ? '' : 'border-r'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── DAY AGENDA & SCHEDULE VIEW ───────────────────────────────────────
  const dayDate = selectedDay || new Date();
  const dayStr = getLocalDateString(dayDate);
  const todayLocal = getLocalDateString(new Date());
  const isDayPast = dayStr < todayLocal;

  const dayEvents = appointments
    .filter(a => {
      const str = a.scheduled_at.includes('T') ? a.scheduled_at.split('T')[0] : a.scheduled_at.split(' ')[0];
      return str === dayStr;
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const prevDay = () => { const d = new Date(dayDate); d.setDate(d.getDate() - 1); setSelectedDay(d); };
  const nextDay = () => { const d = new Date(dayDate); d.setDate(d.getDate() + 1); setSelectedDay(d); };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Day Header with Back to Month & Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-line pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setCalSubMode('month')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-line bg-canvas hover:bg-sunken text-ink transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> Back to Month
          </button>

          <h2 className="text-display text-lg sm:text-xl font-bold text-ink truncate">
            {dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-line bg-canvas hover:bg-sunken text-taupe transition-colors"
          >
            Today
          </button>

          <div className="flex items-center border border-line rounded-lg bg-canvas overflow-hidden">
            <button
              type="button"
              onClick={prevDay}
              aria-label="Previous day"
              className="p-2 hover:bg-sunken text-ink-muted hover:text-ink transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-px h-4 bg-line" />
            <button
              type="button"
              onClick={nextDay}
              aria-label="Next day"
              className="p-2 hover:bg-sunken text-ink-muted hover:text-ink transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {isOwnerOrManager && !isDayPast && dayEvents.length > 0 && (
            <button
              type="button"
              onClick={() => onAddClick(dayStr, '09:00')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
            >
              <Plus size={14} /> Book Appointment
            </button>
          )}

          {isDayPast && (
            <span className="text-xs text-ink-faint font-medium bg-canvas border border-line px-3 py-2 rounded-lg">
              Past Date
            </span>
          )}
        </div>
      </div>

      {/* Day Agenda List */}
      {dayEvents.length === 0 ? (
        <div className="py-16 px-4 text-center bg-canvas/30 border border-line rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center mx-auto text-taupe">
            <Building2 size={20} />
          </div>
          <h4 className="font-bold text-sm text-ink">
            {isDayPast ? 'No appointments recorded on this day' : 'No appointments on this day'}
          </h4>
          <p className="text-xs text-ink-muted">
            {isDayPast
              ? 'Past dates cannot be selected for new bookings.'
              : 'The atelier schedule is open for new fittings or consultations.'}
          </p>
          {isOwnerOrManager && !isDayPast && (
            <button
              type="button"
              onClick={() => onAddClick(dayStr, '09:00')}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-taupe text-white hover:bg-taupe-hover transition-colors shadow-2xs"
            >
              <Plus size={14} /> Book Appointment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {dayEvents.map(apt => {
            const { time } = formatScheduled(apt.scheduled_at);
            const isPending = apt.status === 'pending';
            const isConfirmed = apt.status === 'confirmed';
            const isInProgress = apt.status === 'in_progress';

            return (
              <div
                key={apt.id}
                className={`bg-surface border rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPending ? 'border-amber-300/80 bg-amber-50/10' : 'border-line'
                }`}
              >
                {/* Left: Time + Customer Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Time Badge */}
                  <div className="bg-canvas border border-line rounded-lg p-2.5 text-center shrink-0 min-w-[90px]">
                    <p className="text-xs font-bold text-ink tabular-nums">{time}</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">{apt.duration_minutes ?? 45} mins</p>
                  </div>

                  {/* Customer & Service Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-ink truncate">{apt.customer?.name || 'Walk-in Client'}</p>
                      <TypeBadge type={apt.appointment_type} />
                      <StatusBadge status={apt.status} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                      {apt.service && (
                        <span className="font-medium text-ink-body">Service: {apt.service.name}</span>
                      )}
                      {apt.garment_category && (
                        <span className="text-[10px] uppercase font-bold tracking-wide bg-canvas border border-line px-1.5 py-0.2 rounded text-taupe">
                          {apt.garment_category.replace(/_/g, ' ')}
                        </span>
                      )}
                      {apt.customer?.phone && (
                        <span className="flex items-center gap-1 text-ink-faint">
                          <Phone size={11} /> {apt.customer.phone}
                        </span>
                      )}
                      {apt.assigned_staff && (
                        <span className="flex items-center gap-1 text-taupe font-medium">
                          <UserCheck size={11} /> {apt.assigned_staff.name}
                        </span>
                      )}
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-ink-faint italic truncate max-w-xl">
                        &ldquo;{apt.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60">
                  {isPending && isOwnerOrManager && (
                    <button
                      type="button"
                      onClick={() => onReviewClick(apt)}
                      className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
                    >
                      Review
                    </button>
                  )}
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => onStartClick(apt.id)}
                      className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-ink hover:bg-black text-white shadow-2xs transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => onCompleteClick(apt)}
                      className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  {isConfirmed && isOwnerOrManager && !apt.job_order_id && (
                    <button
                      type="button"
                      onClick={() => onCreateJobClick(apt)}
                      className="text-xs font-semibold px-3 py-2 rounded-lg bg-surface border border-line hover:bg-canvas text-ink transition-colors"
                    >
                      Job
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDetailsClick(apt)}
                    className="p-2 text-ink-muted hover:text-ink hover:bg-canvas border border-line rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
