'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

export interface OperatingHours {
  is_open: boolean;
  open: string;
  close: string;
}

export interface SpecialHour {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  special_open_time: string | null;
  special_close_time: string | null;
}

export interface AppointmentSlot {
  scheduled_at: string; // ISO string
  duration_minutes: number;
  shop_branch_id: number | null;
  status?: string;
}

interface InteractiveCalendarProps {
  readonly selectedBranchId: string | null;
  readonly durationMinutes: number;
  readonly operatingHours: Record<string, OperatingHours> | null;
  readonly specialHours: SpecialHour[] | null;
  readonly maxAppointmentsPerDay?: number | null;
  readonly appointments: AppointmentSlot[];
  readonly loadingAppts?: boolean;
  readonly selectedDate: string; // YYYY-MM-DD
  readonly selectedTime: string; // HH:mm
  readonly mode?: 'public' | 'walk_in';
  readonly onDateChange: (date: string) => void;
  readonly onTimeChange: (time: string) => void;
}

/**
 * Shared date/time picker widget used by both the public storefront booking
 * page and the shop owner's Schedule Appointment modal.
 */
export default function InteractiveCalendar({
  selectedBranchId,
  durationMinutes,
  operatingHours,
  specialHours,
  maxAppointmentsPerDay,
  appointments,
  loadingAppts = false,
  selectedDate,
  selectedTime,
  mode = 'public',
  onDateChange,
  onTimeChange,
}: InteractiveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());

  const getSpecialHoursForDate = (dateStr: string) => {
    if (!specialHours) return null;
    return specialHours.find(s => dateStr >= s.start_date && dateStr <= s.end_date) || null;
  };

  const getOperatingHoursForDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()];
    return operatingHours?.[dayName] || null;
  };

  // Best-effort count from the anonymized slot list (pending + confirmed only);
  // the server re-checks the real cap (including all non-cancelled statuses) on submit.
  const getAppointmentCountForDate = (dateStr: string) => {
    return appointments.filter(appt => appt.scheduled_at.slice(0, 10) === dateStr).length;
  };

  const isDateFullyBooked = (dateStr: string) => {
    if (!maxAppointmentsPerDay) return false;
    return getAppointmentCountForDate(dateStr) >= maxAppointmentsPerDay;
  };

  const isDateDisabled = (dateStr: string) => {
    if (dateStr < todayStr) return true; // past dates

    // 1. Check Special Hours (Holidays / Emergency Closures)
    const special = getSpecialHoursForDate(dateStr);
    if (special?.is_closed) return true;

    // 2. Check Standard Operating Hours
    if (!special) {
      const opHours = getOperatingHoursForDate(dateStr);
      if (opHours && !opHours.is_open) return true;
    }

    // 3. Check Capacity Cap
    if (isDateFullyBooked(dateStr)) return true;

    return false;
  };

  // Generate available time slots based strictly on Standard Operating Hours & Special Hours
  const availableSlots = useMemo(() => {
    if (!selectedDate || isDateDisabled(selectedDate)) return [];

    let openTime = '09:00';
    let closeTime = '18:00';

    const special = getSpecialHoursForDate(selectedDate);
    if (special && !special.is_closed) {
      openTime = special.special_open_time || openTime;
      closeTime = special.special_close_time || closeTime;
    } else {
      const opHours = getOperatingHoursForDate(selectedDate);
      if (opHours) {
        if (!opHours.is_open) return []; // Closed on this day
        openTime = opHours.open || openTime;
        closeTime = opHours.close || closeTime;
      }
    }

    const [startH, startM] = openTime.split(':').map(Number);
    const [endH, endM] = closeTime.split(':').map(Number);

    const slots: { time: string; isBooked: boolean; hasPendingOnly: boolean }[] = [];
    let currentMins = startH * 60 + (startM || 0);
    const endMins = endH * 60 + (endM || 0);

    const isToday = selectedDate === todayStr;
    const now = new Date();
    const currentDayMins = now.getHours() * 60 + now.getMinutes();

    while (currentMins + durationMinutes <= endMins) {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      const slotStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Check for overlap with existing appointments
      const slotStartMins = currentMins;
      const slotEndMins = currentMins + durationMinutes;

      let isConfirmedOverlap = false;
      let isPendingOverlap = false;

      for (const appt of appointments) {
        if (selectedBranchId && appt.shop_branch_id && String(appt.shop_branch_id) !== selectedBranchId) {
          continue;
        }

        const apptDatePart = appt.scheduled_at.includes('T') ? appt.scheduled_at.split('T')[0] : appt.scheduled_at.split(' ')[0];
        if (apptDatePart !== selectedDate) continue;

        const timePart = appt.scheduled_at.includes('T') ? appt.scheduled_at.split('T')[1] : appt.scheduled_at.split(' ')[1];
        if (!timePart) continue;

        const [ah, am] = timePart.split(':').map(Number);
        const apptStartMins = ah * 60 + am;
        const apptEndMins = apptStartMins + (appt.duration_minutes || 60);

        if (slotStartMins < apptEndMins && slotEndMins > apptStartMins) {
          if (appt.status === 'pending') {
            isPendingOverlap = true;
          } else {
            isConfirmedOverlap = true;
          }
        }
      }

      const isPastSlot = isToday && currentMins <= currentDayMins;

      // In walk_in mode, a walk-in is only blocked by confirmed/in_progress appointments!
      // Slots with only pending appointments can be claimed by the walk-in ("kung sino ang makauna")
      const isBooked = mode === 'walk_in' ? isConfirmedOverlap : (isConfirmedOverlap || isPendingOverlap);
      const hasPendingOnly = mode === 'walk_in' && !isConfirmedOverlap && isPendingOverlap;

      if (!isPastSlot) {
        slots.push({ time: slotStr, isBooked, hasPendingOnly });
      }

      currentMins += 30; // 30-min slot intervals
    }

    return slots;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, durationMinutes, operatingHours, specialHours, appointments, selectedBranchId, todayStr, mode]);

  // Unified Calendar Grid Generator (Standard Date-Grid Approach)
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Leading padding from previous month
    if (firstDayIndex > 0) {
      const prevMonthLastDate = new Date(year, month, 0).getDate();
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = prevMonthLastDate - i;
        const prevDate = new Date(year, month - 1, d);
        const y = prevDate.getFullYear();
        const m = String(prevDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d).padStart(2, '0');
        cells.push({
          dateStr: `${y}-${m}-${dayStr}`,
          dayNumber: d,
          isCurrentMonth: false,
        });
      }
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({
        dateStr: `${year}-${mStr}-${dStr}`,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    return cells;
  }, [currentMonth]);

  const renderCalendarDays = () => {
    return calendarGrid.map(cell => {
      if (!cell.isCurrentMonth) {
        return <div key={cell.dateStr} className="p-2 border border-transparent" aria-hidden="true" />;
      }

      const { dateStr, dayNumber } = cell;
      const disabled = isDateDisabled(dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = todayStr === dateStr;
      const fullyBooked = dateStr >= todayStr && !getSpecialHoursForDate(dateStr)?.is_closed && isDateFullyBooked(dateStr);

      return (
        <button
          key={dateStr}
          type="button"
          disabled={disabled}
          title={fullyBooked ? 'Fully booked — please choose another date' : undefined}
          onClick={() => {
            onDateChange(dateStr);
            onTimeChange(''); // reset time when date changes
          }}
          className={`relative h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
            ${isSelected ? 'bg-taupe text-white hover:bg-[#856D60]' : ''}
            ${!isSelected && !disabled && isToday ? 'border-2 border-taupe text-taupe' : ''}
            ${!isSelected && !disabled && !isToday ? 'text-ink hover:bg-line' : ''}
            ${!isSelected && fullyBooked ? 'bg-danger/10 text-danger line-through' : ''}
            ${disabled && !fullyBooked ? 'text-zinc-300 cursor-not-allowed' : ''}
            ${disabled && fullyBooked ? 'cursor-not-allowed' : ''}
            ${!disabled ? 'cursor-pointer' : ''}
          `}
        >
          {dayNumber}
        </button>
      );
    });
  };

  const formatSlotLabel = (slot: string) => {
    const [h, m] = slot.split(':');
    const ampm = Number(h) >= 12 ? 'PM' : 'AM';
    const h12 = Number(h) % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const getClosedReason = () => {
    const special = getSpecialHoursForDate(selectedDate);
    if (special?.is_closed) {
      return {
        title: `Closed: ${special.title || 'Holiday'}`,
        description: 'The shop is closed for this date. Please pick another day.',
      };
    }
    const opHours = getOperatingHoursForDate(selectedDate);
    if (opHours && !opHours.is_open) {
      return {
        title: 'Closed on this day',
        description: "This day is closed according to the shop's Standard Operating Hours.",
      };
    }
    if (isDateFullyBooked(selectedDate)) {
      return {
        title: 'Fully Booked',
        description: 'All appointment slots are taken for this date.',
      };
    }
    return {
      title: 'No Available Time Slots',
      description: 'No open slots match the session duration. Please choose another date.',
    };
  };

  const renderTimePickerContent = () => {
    if (!selectedDate) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400">
          <CalendarIcon size={32} className="mb-2 opacity-20" />
          <p className="text-sm">Please select a date first</p>
        </div>
      );
    }

    if (loadingAppts) {
      return (
        <div className="h-full flex items-center justify-center text-zinc-400">
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-4 h-4 bg-zinc-300 rounded-full"></div>
            <span className="text-sm">Checking availability...</span>
          </div>
        </div>
      );
    }

    if (availableSlots.length === 0) {
      const reason = getClosedReason();
      return (
        <div className="h-full flex flex-col items-center justify-center text-ink-muted">
          <AlertCircle size={32} className="mb-2 text-taupe/60" />
          <p className="text-sm font-semibold text-ink">{reason.title}</p>
          <p className="text-xs mt-1 text-center max-w-[220px] text-ink-muted">{reason.description}</p>
        </div>
      );
    }

    const hasAnyOpen = availableSlots.some(s => !s.isBooked);

    return (
      <div className="space-y-3">
        {!hasAnyOpen && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <span>All slots for this day are currently booked. Please choose another date.</span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableSlots.map(({ time: slot, isBooked, hasPendingOnly }) => {
            let slotClass = 'border-line text-ink-body hover:border-taupe/50 hover:bg-canvas cursor-pointer';
            if (isBooked) {
              slotClass = 'bg-canvas/40 border-line/60 text-ink-faint cursor-not-allowed opacity-60';
            } else if (selectedTime === slot) {
              slotClass = 'border-taupe bg-taupe text-white cursor-pointer shadow-2xs';
            } else if (hasPendingOnly) {
              slotClass = 'border-amber-300/80 bg-amber-50/40 text-amber-900 hover:border-amber-400 hover:bg-amber-50/70 cursor-pointer';
            }

            return (
              <button
                key={slot}
                type="button"
                disabled={isBooked}
                onClick={() => !isBooked && onTimeChange(slot)}
                title={
                  isBooked
                    ? 'This slot is already confirmed'
                    : hasPendingOnly
                    ? 'Pending online inquiry — walk-in at counter takes priority'
                    : undefined
                }
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-between gap-1.5 ${slotClass}`}
              >
                <span className={isBooked ? 'line-through' : ''}>{formatSlotLabel(slot)}</span>
                {isBooked && (
                  <span className="text-[9px] font-bold uppercase no-underline tracking-wider bg-canvas border border-line px-1 rounded text-ink-faint">
                    Booked
                  </span>
                )}
                {hasPendingOnly && !isBooked && selectedTime !== slot && (
                  <span className="text-[9px] font-bold uppercase no-underline tracking-wider bg-amber-100 border border-amber-300 px-1 rounded text-amber-800">
                    Pending
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {mode === 'walk_in' && availableSlots.find(s => s.time === selectedTime)?.hasPendingOnly && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Walk-in Priority Notice:</span> An online customer previously submitted an inquiry for this slot. Because this walk-in customer is physically at the counter, saving will confirm this walk-in and automatically notify the online client to pick another time.
            </div>
          </div>
        )}
      </div>
    );
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Date Picker Side */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-ink-body flex items-center gap-2">
          <CalendarIcon size={16} /> Select Date <span className="text-danger">*</span>
        </label>

        <div className="bg-surface border border-line rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-ink">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 justify-items-center">
            {renderCalendarDays()}
          </div>
          {!!maxAppointmentsPerDay && (
            <p className="text-[11px] text-ink-faint mt-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger/10 border border-danger/30 inline-block shrink-0"></span>
              Dates crossed out are fully booked ({maxAppointmentsPerDay} slot{maxAppointmentsPerDay === 1 ? '' : 's'}/day max) — please choose another date.
            </p>
          )}
        </div>
      </div>

      {/* Time Picker Side */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-ink-body flex items-center gap-2">
          <Clock size={16} /> Select Time <span className="text-danger">*</span>
        </label>

        <div className="bg-surface border border-line rounded-xl p-4 h-80 overflow-y-auto">
          {renderTimePickerContent()}
        </div>
      </div>
    </div>
  );
}
