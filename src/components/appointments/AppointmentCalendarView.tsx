import React from 'react';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Clock, Eye, Play, CheckSquare, Scissors, Loader2,
  Calendar as CalendarIcon, UserX
} from 'lucide-react';
import {
  Appointment, AppointmentType, TYPE_CONFIG, STATUS_CONFIG,
  StatusBadge
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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (calSubMode === 'month') {
    return (
      <div className="p-3 sm:p-6">
        {/* Nav — used to be one fixed-gap row that squeezed and overflowed
            on narrow screens (mismatched left/right margins); wraps onto
            its own line on mobile instead, with tighter spacing. */}
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-base sm:text-xl font-bold text-[#2D2A26]">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => setCurrentDate(new Date())} className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-lg border border-[#EBE6E0] bg-[#FAF6F3] text-[#9A8073] hover:bg-[#F0EAE3] transition-colors">Today</button>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-1.5 sm:p-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} className="p-1.5 sm:p-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Type legend */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 flex-wrap">
          {(Object.keys(TYPE_CONFIG) as AppointmentType[]).map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${TYPE_CONFIG[t].dot}`} />
              <span className="text-[11px] sm:text-xs text-[#827A73]">{TYPE_CONFIG[t].label}</span>
            </div>
          ))}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[9px] sm:text-[11px] font-semibold text-[#A8A19A] uppercase tracking-wider py-1.5 sm:py-2 bg-[#FAF6F3]/50">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-[#EBE6E0]">
          {paddingDays.map(i => <div key={`e-${i}`} className="min-h-16 sm:min-h-28 bg-white/40 p-1 sm:p-1.5" />)}
          {daysArray.map(day => {
            const y = year, m = String(month + 1).padStart(2, '0'), d = String(day).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            const dayEvents = appointments.filter(a => a.scheduled_at.startsWith(dateStr));
            const hasPending = dayEvents.some(a => a.status === 'pending');
            const todayRef = new Date();
            const isToday = y === todayRef.getFullYear() && month === todayRef.getMonth() && day === todayRef.getDate();
            const isPast = new Date(y, month, day) < new Date(todayRef.getFullYear(), todayRef.getMonth(), todayRef.getDate());
            let dayTextClass = 'text-[#524A44] group-hover:text-[#2D2A26]';
            if (isToday) dayTextClass = 'bg-[#9A8073] text-white';
            else if (isPast) dayTextClass = 'text-[#C4BDB6]';
            return (
              <button
                type="button"
                key={day}
                onClick={() => { setSelectedDay(new Date(y, month, day)); setCalSubMode('day'); }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDay(new Date(y, month, day));
                    setCalSubMode('day');
                  }
                }}
                className={`min-h-16 sm:min-h-28 p-1 sm:p-1.5 group transition-colors text-left w-full ${isPast ? 'bg-[#FAF6F3]/40 cursor-default' : 'bg-white cursor-pointer hover:bg-[#FAF6F3]'} ${!isPast && hasPending ? 'ring-inset ring-1 ring-amber-300' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-semibold ${dayTextClass}`}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className={`text-[9px] font-medium ${isPast ? 'text-[#C4BDB6]' : 'text-[#A8A19A]'}`}>{dayEvents.length}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(event => {
                    const tc = TYPE_CONFIG[event.appointment_type];
                    const sc = STATUS_CONFIG[event.status];
                    const time = new Date(event.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                    const eventColorClass = isPast
                      ? 'bg-gray-50 border-gray-100 text-gray-400'
                      : `${tc.bg} ${tc.border} ${tc.text} ${sc.opacity}`;
                    const borderDashedClass = !isPast && event.status === 'pending' ? 'border-dashed' : '';
                    return (
                      // time is shrink-0/nowrap so it never truncates — only
                      // the customer name gives way on a narrow mobile cell.
                      // It used to share one `truncate` span with the name,
                      // which could clip the minutes off the time itself.
                      <div key={event.id} className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1 border overflow-hidden ${eventColorClass} ${borderDashedClass}`}>
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${isPast ? 'bg-gray-300' : tc.dot}`} />
                        <span className="shrink-0 whitespace-nowrap font-medium">{time}</span>
                        <span className="truncate hidden sm:inline">{event.customer?.name}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className={`text-[10px] font-medium pl-1 ${isPast ? 'text-[#C4BDB6]' : 'text-[#9A8073]'}`}>+{dayEvents.length - 3} more</div>
                  )}
                  {!isPast && dayEvents.length === 0 && (
                    <div className="text-[9px] text-[#D4CEC9] italic mt-1">Click to add</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DAY VIEW ──────────────────────────────────────────────────────
  const dayDate = selectedDay || new Date();
  const dayStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
  const dayEvents = appointments
    .filter(a => a.scheduled_at.startsWith(dayStr))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Two appointments booked at the same (or overlapping) time used to both
  // render as full-width absolute-positioned boxes at the same vertical
  // offset — their text just mashed together on top of each other. This
  // packs overlapping appointments into side-by-side columns instead, the
  // same way Google/Outlook calendars handle a double-booking.
  const layoutedDayEvents = (() => {
    const withTimes = dayEvents.map(event => {
      const start = new Date(event.scheduled_at);
      const startMins = start.getHours() * 60 + start.getMinutes();
      const endMins = startMins + (event.duration_minutes || 60);
      return { event, startMins, endMins };
    });

    const results: { event: Appointment; startMins: number; col: number; totalCols: number }[] = [];
    let cluster: { event: Appointment; startMins: number; endMins: number; col: number }[] = [];
    let clusterEnd = -Infinity;

    const flush = () => {
      if (cluster.length === 0) return;
      const totalCols = Math.max(...cluster.map(c => c.col)) + 1;
      cluster.forEach(c => results.push({ event: c.event, startMins: c.startMins, col: c.col, totalCols }));
      cluster = [];
    };

    for (const item of withTimes) {
      if (item.startMins >= clusterEnd) {
        flush();
        clusterEnd = -Infinity;
      }
      let col = 0;
      while (cluster.some(c => c.col === col && c.endMins > item.startMins)) col++;
      cluster.push({ ...item, col });
      clusterEnd = Math.max(clusterEnd, item.endMins);
    }
    flush();

    return results;
  })();

  const HOUR_START = 7;
  const HOUR_END = 20;
  const PX_PER_MIN = 1.5;

  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const dayMidnight = new Date(dayDate); dayMidnight.setHours(0, 0, 0, 0);
  const isDayPast = dayMidnight < todayMidnight;
  const isDayToday = dayMidnight.getTime() === todayMidnight.getTime();

  // Current time indicator position
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowOffsetMins = nowMins - HOUR_START * 60;
  const nowTopPx = nowOffsetMins * PX_PER_MIN;
  const showNowLine = isDayToday && nowOffsetMins >= 0 && nowOffsetMins <= (HOUR_END - HOUR_START) * 60;

  const defaultTimeForDay = () => {
    if (isDayToday) {
      const rounded = Math.ceil((now.getHours() * 60 + now.getMinutes() + 30) / 15) * 15;
      return `${String(Math.floor(rounded / 60) % 24).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
    }
    return '09:00';
  };

  const prevDay = () => { const d = new Date(dayDate); d.setDate(d.getDate() - 1); setSelectedDay(d); };
  const nextDay = () => { const d = new Date(dayDate); d.setDate(d.getDate() + 1); setSelectedDay(d); };

  const renderDayEmptyState = () => {
    if (isDayPast) {
      return <p className="text-xs text-[#C4BDB6] italic">Read-only — this date has passed</p>;
    }
    if (isOwnerOrManager) {
      return (
        <button
          type="button"
          onClick={() => onAddClick(dayStr, defaultTimeForDay())}
          className="text-xs font-medium text-[#9A8073] hover:text-[#9A8073]/70 underline underline-offset-2 transition-colors"
        >
          + Add appointment for this day
        </button>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col">
      {/* Day nav — used to be one row cramming a "‹ Month" button, a full
          "Weekday, Month Day" title, and an appointment-count badge into a
          fixed px-6 header, which overflowed/wrapped unevenly on mobile.
          Stacks into two rows below the sm breakpoint instead, with tighter
          padding and an abbreviated date format so it actually fits. */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b border-[#EBE6E0] bg-[#FAF6F3]/40">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button onClick={() => setCalSubMode('month')} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#9A8073] hover:text-[#2D2A26] transition-colors shrink-0">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <span className="sm:hidden">{currentDate.toLocaleDateString('en-US', { month: 'short' })}</span>
          </button>
          <span className="text-[#EBE6E0] hidden sm:inline">›</span>
          <h2 className="text-sm sm:text-lg font-bold text-[#2D2A26]">
            <span className="hidden sm:inline">{dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            <span className="sm:hidden">{dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </h2>
          {dayEvents.length > 0 && (
            <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-[#9A8073]/10 text-[#9A8073]">
              {dayEvents.length} appointment{dayEvents.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <button onClick={prevDay} className="p-1.5 sm:p-2 bg-white border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => setSelectedDay(new Date())} className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-lg border border-[#EBE6E0] bg-white text-[#9A8073] hover:bg-[#F0EAE3] transition-colors">Today</button>
          <button onClick={nextDay} className="p-1.5 sm:p-2 bg-white border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="flex overflow-hidden">
        {/* Time labels — quarter-hour ticks (:00/:15/:30/:45), not just the
            bare hour, so an appointment's actual minute can be read straight
            off the axis instead of only off the appointment card. Narrower
            on mobile so more width goes to the actual appointment blocks. */}
        <div className="w-11 sm:w-16 shrink-0 border-r border-[#EBE6E0] bg-[#FAF6F3]/30">
          {Array.from({ length: (HOUR_END - HOUR_START) * 4 }, (_, i) => {
            const h = HOUR_START + Math.floor(i / 4);
            const quarter = i % 4;
            const isHourMark = quarter === 0;
            let hourLbl = '';
            if (h < 12) hourLbl = `${h} AM`;
            else if (h === 12) hourLbl = '12 PM';
            else hourLbl = `${h - 12} PM`;
            return (
              <div key={i} style={{ height: `${15 * PX_PER_MIN}px` }} className="flex items-start justify-end pr-1.5 sm:pr-3 pt-0.5">
                <span className={isHourMark
                  ? 'text-[9px] sm:text-[10px] text-[#A8A19A] font-medium'
                  : 'text-[8px] sm:text-[9px] text-[#C4BDB6]'
                }>
                  {isHourMark ? hourLbl : `:${quarter * 15}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Events area */}
        <div className="flex-1 relative bg-white" style={{ height: `${(HOUR_END - HOUR_START) * 60 * PX_PER_MIN}px` }}>
          {/* Hour lines */}
          {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-[#EBE6E0]/70" style={{ top: `${i * 60 * PX_PER_MIN}px` }} />
          ))}
          {/* Quarter-hour dashes — matches the axis's new :15/:30/:45 ticks */}
          {Array.from({ length: (HOUR_END - HOUR_START) * 4 }, (_, i) => (
            i % 4 !== 0 && (
              <div
                key={`q-${i}`}
                className={`absolute left-0 right-0 border-t border-dashed ${i % 4 === 2 ? 'border-[#EBE6E0]/40' : 'border-[#EBE6E0]/20'}`}
                style={{ top: `${i * 15 * PX_PER_MIN}px` }}
              />
            )
          ))}

          {/* Current time indicator */}
          {showNowLine && (
            <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${nowTopPx}px` }}>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shrink-0" />
              <div className="flex-1 border-t-2 border-rose-500" />
            </div>
          )}

          {/* Appointment blocks */}
          {layoutedDayEvents.map(({ event, col, totalCols }) => {
            const startDate = new Date(event.scheduled_at);
            const startMins = startDate.getHours() * 60 + startDate.getMinutes();
            const offsetMins = startMins - HOUR_START * 60;
            const durMins = event.duration_minutes || 60;
            const topPx = Math.max(0, offsetMins * PX_PER_MIN);
            const heightPx = Math.max(42, durMins * PX_PER_MIN);
            const tc = TYPE_CONFIG[event.appointment_type];
            const sc = STATUS_CONFIG[event.status];
            const isHovered = hoveredAptId === event.id;
            const isLoading = actionLoadingId === event.id;
            const isPending = event.status === 'pending';
            const isConfirmed = event.status === 'confirmed';
            const isInProg = event.status === 'in_progress';
            const isClosed = ['cancelled', 'no_show'].includes(event.status);

            // Action buttons show once expanded (hover, or tap on touch —
            // onMouseEnter never reliably fires on a touchscreen, so tapping
            // toggles the same isHovered state instead). That expanded state
            // used to render past the block's fixed height with
            // overflow-hidden still on, clipping the buttons to an
            // unclickable sliver for any appointment under ~60min; switches
            // to overflow-visible + min-height once expanded so the block
            // actually grows to fit them instead of clipping.
            const isExpanded = (isHovered || heightPx >= 90) && !isClosed;
            return (
              <article
                key={event.id}
                className={`absolute rounded-lg border transition-all duration-150 ${isExpanded ? 'overflow-visible' : 'overflow-hidden'} ${tc.bg} ${tc.border} ${sc.opacity} ${isPending ? 'border-dashed' : sc.borderStyle} ${isHovered && !isClosed ? 'shadow-lg z-10 ring-2 ring-[#9A8073]/30' : 'z-1'}`}
                style={{
                  top: `${topPx}px`,
                  [isExpanded ? 'minHeight' : 'height']: `${heightPx}px`,
                  left: `calc(8px + (100% - 16px) * ${col} / ${totalCols})`,
                  width: `calc((100% - 16px) / ${totalCols}${totalCols > 1 ? ' - 4px' : ''})`,
                }}
                onMouseEnter={() => setHoveredAptId(event.id)}
                onMouseLeave={() => setHoveredAptId(null)}
                onClick={() => setHoveredAptId(isHovered ? null : event.id)}
              >
                <div className="flex h-full">
                  {/* Type color bar */}
                  <div className={`w-1 shrink-0 ${tc.dot} ${isInProg ? 'animate-pulse' : ''}`} />

                  <div className="flex-1 px-2 py-1.5 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${tc.text} ${isClosed ? 'line-through opacity-60' : ''} flex items-center gap-1`}>
                            <span>{event.customer?.name}</span>
                            {event.priority && event.priority !== 'normal' && (
                              <span className={`px-1 rounded-[3px] text-[8px] font-black uppercase tracking-wide border leading-none shrink-0 ${
                                event.priority === 'rush' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {event.priority}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-[#827A73] truncate">
                            {TYPE_CONFIG[event.appointment_type].label}
                            {event.service ? ` · ${event.service.name}` : ''}
                            {event.garment_category ? ` [${event.garment_category.toUpperCase()}]` : ''}
                            {event.assigned_staff ? ` · ${event.assigned_staff.name}` : ''}
                          </p>
                        </div>
                        <StatusBadge status={event.status} />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={9} className="text-[#A8A19A] shrink-0" />
                        <span className="text-[9px] sm:text-[10px] text-[#A8A19A] whitespace-nowrap overflow-hidden text-ellipsis">
                          {new Date(event.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          {' – '}
                          {new Date(new Date(event.scheduled_at).getTime() + durMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          {` (${durMins}m)`}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons — on hover or tall block */}
                    {(isHovered || heightPx >= 90) && !isClosed && !isLoading && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {isPending && isOwnerOrManager && (
                          <button type="button" onClick={e => { e.stopPropagation(); onReviewClick(event); }}
                            className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                            <Eye size={10} /> Review
                          </button>
                        )}
                        {isConfirmed && (
                          <button type="button" onClick={e => { e.stopPropagation(); onStartClick(event.id); }}
                            className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors">
                            <Play size={10} /> Start
                          </button>
                        )}
                        {isInProg && (
                          <button type="button" onClick={e => { e.stopPropagation(); onCompleteClick(event); }}
                            className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                            <CheckSquare size={10} /> Complete
                          </button>
                        )}
                        {/* Same guard as AppointmentListView — job creation
                            doesn't change an already-'confirmed' appointment's
                            status, so without checking job_order_id this
                            button stayed live after a job already existed. */}
                        {isConfirmed && isOwnerOrManager && !event.job_order_id && (
                          <button type="button" onClick={e => { e.stopPropagation(); onCreateJobClick(event); }}
                            className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#9A8073]/10 text-[#9A8073] hover:bg-[#FAF6F3] border border-[#9A8073]/20 transition-colors">
                            <Scissors size={10} /> Create Job
                          </button>
                        )}
                        {isConfirmed && isOwnerOrManager && (
                          <button type="button" onClick={e => { e.stopPropagation(); onNoShowClick(event); }}
                            className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#B26959]/10 text-[#B26959] hover:bg-[#B26959]/20 border border-[#B26959]/20 transition-colors">
                            <UserX size={10} /> No Show
                          </button>
                        )}
                        <button type="button" onClick={e => { e.stopPropagation(); onDetailsClick(event); }}
                          className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF6F3] text-[#827A73] hover:bg-[#F0EAE3] border border-[#EBE6E0] transition-colors">
                          <Eye size={10} /> Details
                        </button>
                      </div>
                    )}
                    {isLoading && (
                      <div className="flex items-center gap-1 mt-1">
                        <Loader2 size={12} className="animate-spin text-[#9A8073]" />
                        <span className="text-[10px] text-[#A8A19A]">Updating...</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {/* Empty state */}
          {dayEvents.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <CalendarIcon size={36} className="text-[#EBE6E0]" />
              <p className="text-sm text-[#A8A19A]">No appointments on this day</p>
              {renderDayEmptyState()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
