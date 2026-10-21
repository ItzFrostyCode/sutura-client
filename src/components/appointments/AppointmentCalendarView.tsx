import React, { useMemo } from 'react';
import { groupByDay } from './calendar/calendarHelpers';
import { CalendarSkeleton } from './AppointmentSkeletons';
import type { Appointment } from './appointmentHelpers';
import type { AgendaActions } from './calendar/AgendaCard';
import DayAgenda from './calendar/DayAgenda';
import MonthBoard from './calendar/MonthBoard';
import PhoneCalendar from './calendar/PhoneCalendar';

interface AppointmentCalendarViewProps {
  readonly appointments: Appointment[];
  /** First load with nothing kept yet: the calendar's own skeleton. */
  readonly loading?: boolean;
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
  readonly onCompleteClick: (apt: Appointment) => void;
  readonly onCreateJobClick: (apt: Appointment) => void;
  readonly onDetailsClick: (apt: Appointment) => void;
  readonly onNoShowClick: (apt: Appointment) => void;
  readonly onAddClick: (dayStr: string, defaultTime: string) => void;
  readonly onCheckInClick?: (aptId: number) => void;
}

/**
 * The calendar of appointments (Stitch). A phone gets a compact month with the chosen day's cards under it; a tablet or
 * desktop gets the month board, and a tap on a day opens that day's cards.
 */
export default function AppointmentCalendarView({
  appointments, loading = false, currentDate, setCurrentDate, selectedDay, setSelectedDay, calSubMode, setCalSubMode,
  isOwnerOrManager, onReviewClick, onCompleteClick, onCreateJobClick, onDetailsClick, onAddClick, onCheckInClick,
}: AppointmentCalendarViewProps) {
  const actions: AgendaActions = { isOwnerOrManager, onReviewClick, onCompleteClick, onCreateJobClick, onDetailsClick, onCheckInClick };
  const goToToday = () => { const now = new Date(); setCurrentDate(now); setSelectedDay(now); };
  const byDay = useMemo(() => groupByDay(appointments), [appointments]);

  if (loading) return <CalendarSkeleton />;

  return (
    <>
      <div className="md:hidden">
        <PhoneCalendar
          byDay={byDay} currentDate={currentDate} setCurrentDate={setCurrentDate}
          selectedDay={selectedDay} setSelectedDay={setSelectedDay} actions={actions} onAddClick={onAddClick} onToday={goToToday}
        />
      </div>
      <div className="hidden md:block">
        {calSubMode === 'month' ? (
          <MonthBoard
            byDay={byDay} currentDate={currentDate} setCurrentDate={setCurrentDate} onToday={goToToday}
            onPickDay={(d) => { setSelectedDay(d); setCalSubMode('day'); }}
          />
        ) : (
          <DayAgenda
            byDay={byDay} day={selectedDay ?? new Date()} setDay={setSelectedDay} onToday={goToToday}
            onBack={() => setCalSubMode('month')} actions={actions} onAddClick={onAddClick}
          />
        )}
      </div>
    </>
  );
}
