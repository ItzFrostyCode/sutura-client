import React from 'react';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Eye, Plus, Building2, UserCheck, Phone,
  AlertCircle, Globe, Store, RefreshCw
} from 'lucide-react';
import {
  Appointment, TYPE_CONFIG,
  StatusBadge, TypeBadge, getLocalDateString, formatScheduled, getCustomerInitials,
  ChannelBadge, RescheduledBadge, CheckInBadge
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
  readonly onCheckInClick?: (aptId: number) => void;
}

export default function AppointmentCalendarView({
  appointments, currentDate, setCurrentDate, selectedDay, setSelectedDay,
  calSubMode, setCalSubMode, hoveredAptId, setHoveredAptId, actionLoadingId,
  isOwnerOrManager,
  onReviewClick, onStartClick, onCompleteClick, onCreateJobClick, onDetailsClick, onNoShowClick, onAddClick, onCheckInClick
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
                const str = a.scheduled_at ? a.scheduled_at.split('T')[0].split(' ')[0] : '';
                return str === dateStr;
              });

              const hasPending = dayEvents.some(a => a.status === 'pending');
              const hasConfirmed = dayEvents.some(a => a.status === 'confirmed');
              const hasInProgress = dayEvents.some(a => a.status === 'in_progress');

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
                  className={`min-h-[64px] sm:min-h-[76px] lg:min-h-[84px] p-1.5 sm:p-2 group transition-colors text-left w-full relative flex flex-col justify-between border-b border-line ${
                    isLastColInRow ? '' : 'border-r'
                  } ${
                    hasPending
                      ? 'bg-amber-50/40 hover:bg-amber-50/60 ring-1 ring-amber-300'
                      : isToday
                      ? 'bg-amber-50/25 hover:bg-amber-50/45'
                      : isPast
                      ? 'bg-canvas/20 hover:bg-canvas/45'
                      : 'bg-surface hover:bg-canvas/50'
                  }`}
                >
                  {/* Top-Row: Day Number + Status Dots */}
                  <div className="flex items-center justify-between w-full">
                    <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-bold ${
                      isToday ? 'bg-taupe text-white shadow-2xs' : isPast ? 'text-ink-faint' : 'text-ink group-hover:text-taupe'
                    }`}>
                      {day}
                    </span>

                    {/* Status Dots Indicator */}
                    <div className="flex items-center gap-1">
                      {hasPending && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200 shrink-0" title="Has pending bookings awaiting approval" />
                      )}
                      {hasConfirmed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" title="Has confirmed appointments" />
                      )}
                      {hasInProgress && (
                        <span className="w-1.5 h-1.5 rounded-full bg-taupe shrink-0" title="Has in-progress sessions" />
                      )}
                    </div>
                  </div>

                  {/* Center / Body: Appointment Badges & Desktop Chips */}
                  <div className="w-full my-auto">
                    {dayEvents.length > 0 && (
                      <div className="flex flex-col gap-0.5 w-full">
                        {/* Mobile / Compact Badge */}
                        <div className="flex items-center justify-center md:hidden">
                          {hasPending ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                              <AlertCircle size={9} /> {dayEvents.length}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-taupe/10 text-taupe border border-taupe/20 tabular-nums shadow-2xs">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Desktop Mini-Chips (Visible Proof of who booked and when) */}
                        <div className="hidden md:flex flex-col gap-0.5 w-full overflow-hidden mt-0.5">
                          {dayEvents.slice(0, 2).map(apt => {
                            const cleanTime = apt.scheduled_at.includes('T')
                              ? apt.scheduled_at.split('T')[1].substring(0, 5)
                              : apt.scheduled_at.split(' ')[1]?.substring(0, 5) || '';
                            const isOnline = apt.intake_channel === 'online';
                            const isAptPending = apt.status === 'pending';

                            return (
                              <div
                                key={apt.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate border flex items-center justify-between gap-1 ${
                                  isAptPending
                                    ? 'bg-amber-100/80 text-amber-950 border-amber-300 font-semibold'
                                    : 'bg-canvas text-ink border-line'
                                }`}
                                title={`${cleanTime} - ${apt.customer?.name || 'Client'} (${isOnline ? 'Online' : 'Walk-in'})`}
                              >
                                <span className="truncate">
                                  {cleanTime} {apt.customer?.name?.split(' ')[0] || 'Client'}
                                </span>
                                {isOnline && <Globe size={9} className="text-sky-600 shrink-0" />}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <span className="text-[9px] text-ink-faint font-bold pl-1">
                              +{dayEvents.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom spacing helper */}
                  <div className="h-0.5" />
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
                      <ChannelBadge channel={apt.intake_channel} />
                      {(apt.outcome === 'rescheduled' || apt.notes?.includes('[Rescheduled from')) && (
                        <RescheduledBadge />
                      )}
                      <TypeBadge type={apt.appointment_type} />
                      <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} />
                      <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
                    </div>

                    {isPending && apt.intake_channel === 'online' && (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 text-amber-900 text-xs px-2.5 py-1 rounded-md font-medium">
                        <AlertCircle size={13} className="text-amber-600 shrink-0" />
                        <span>Online customer booking request — awaiting store confirmation</span>
                      </div>
                    )}

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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
                    >
                      <Eye size={13} /> <span>Review & Approve</span>
                    </button>
                  )}
                  {isConfirmed && !apt.checked_in_at && onCheckInClick && (
                    <button
                      type="button"
                      onClick={() => onCheckInClick(apt.id)}
                      className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-surface border border-taupe/40 hover:bg-taupe/10 text-taupe shadow-2xs transition-colors"
                    >
                      Check In
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
