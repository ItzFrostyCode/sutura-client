'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

interface OperatingHours {
  is_open: boolean;
  open: string;
  close: string;
}

interface SpecialHour {
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
}

interface InteractiveCalendarProps {
  selectedBranchId: string | null;
  durationMinutes: number;
  operatingHours: Record<string, OperatingHours> | null;
  specialHours: SpecialHour[] | null;
  maxAppointmentsPerDay?: number | null;
  appointments: AppointmentSlot[];
  loadingAppts?: boolean;
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:mm
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

/**
 * Shared date/time picker widget used by both the public storefront booking
 * page and the shop owner's Schedule Appointment modal. It's purely a UI
 * primitive — each caller fetches and passes in its own `appointments` list
 * (the public page anonymized, the owner's dashboard the real one), so this
 * component itself has no opinion on which system is calling it.
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
  onDateChange,
  onTimeChange,
}: InteractiveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Calendar math
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const todayStr = new Date().toISOString().split('T')[0];

  const getSpecialHoursForDate = (dateStr: string) => {
    if (!specialHours) return null;
    return specialHours.find(s => dateStr >= s.start_date && dateStr <= s.end_date) || null;
  };

  const getOperatingHoursForDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
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

    const special = getSpecialHoursForDate(dateStr);
    if (special?.is_closed) return true;

    // If not special, check standard operating hours
    if (!special) {
      const opHours = getOperatingHoursForDate(dateStr);
      if (opHours && !opHours.is_open) return true;
    }

    if (isDateFullyBooked(dateStr)) return true;

    return false;
  };

  // Generate available time slots for the selected date
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
      if (opHours && opHours.is_open) {
        openTime = opHours.open;
        closeTime = opHours.close;
      }
    }

    // Create Date objects for open/close bounds
    const startObj = new Date(`${selectedDate}T${openTime}:00`);
    const endObj = new Date(`${selectedDate}T${closeTime}:00`);

    // For today, if current time is past open time, adjust startObj
    if (selectedDate === todayStr) {
      const now = new Date();
      if (now > startObj) {
        // Round to next 30 min
        const rounded = new Date(Math.ceil(now.getTime() / (30 * 60000)) * (30 * 60000));
        startObj.setTime(Math.max(startObj.getTime(), rounded.getTime()));
      }
    }

    const slots: string[] = [];
    const currentSlot = new Date(startObj);

    while (currentSlot.getTime() + durationMinutes * 60000 <= endObj.getTime()) {
      const slotStr = currentSlot.toTimeString().substring(0, 5);

      // Check for overlap with existing appointments
      const slotStart = currentSlot.getTime();
      const slotEnd = slotStart + durationMinutes * 60000;

      const isOverlapping = appointments.some(appt => {
        // If branch filtering is active, only block slots for that branch
        if (selectedBranchId && appt.shop_branch_id && String(appt.shop_branch_id) !== selectedBranchId) {
          return false;
        }

        const apptStart = new Date(appt.scheduled_at).getTime();
        const apptEnd = apptStart + (appt.duration_minutes || 60) * 60000;

        // Overlap condition: start of new slot is before existing appt ends, AND end of new slot is after existing appt starts
        return (slotStart < apptEnd && slotEnd > apptStart);
      });

      if (!isOverlapping) {
        slots.push(slotStr);
      }

      // Increment by 30 mins interval
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    return slots;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, durationMinutes, operatingHours, specialHours, appointments, selectedBranchId, todayStr]);

  // Calendar rendering helper
  const renderCalendarDays = () => {
    const blanks = Array.from({ length: firstDayOfMonth }).map((_, i) => (
      <div key={`blank-${i}`} className="p-2 border border-transparent"></div>
    ));

    const days = Array.from({ length: daysInMonth }).map((_, i) => {
      const d = i + 1;
      const dStr = String(d).padStart(2, '0');
      const mStr = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const dateStr = `${currentMonth.getFullYear()}-${mStr}-${dStr}`;

      const disabled = isDateDisabled(dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = todayStr === dateStr;
      const fullyBooked = dateStr >= todayStr && !getSpecialHoursForDate(dateStr)?.is_closed && isDateFullyBooked(dateStr);

      return (
        <button
          key={`day-${d}`}
          type="button"
          disabled={disabled}
          title={fullyBooked ? 'Fully booked — please choose another date' : undefined}
          onClick={() => {
            onDateChange(dateStr);
            onTimeChange(''); // reset time when date changes
          }}
          className={`relative h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
            ${isSelected ? 'bg-[#9A8073] text-white shadow-md hover:bg-[#856D60]' : ''}
            ${!isSelected && !disabled && isToday ? 'border-2 border-[#9A8073] text-[#9A8073]' : ''}
            ${!isSelected && !disabled && !isToday ? 'text-[#2D2A26] hover:bg-[#EBE6E0]' : ''}
            ${!isSelected && fullyBooked ? 'bg-[#B26959]/10 text-[#B26959] line-through' : ''}
            ${disabled && !fullyBooked ? 'text-zinc-300 cursor-not-allowed' : ''}
            ${disabled && fullyBooked ? 'cursor-not-allowed' : ''}
            ${!disabled ? 'cursor-pointer' : ''}
          `}
        >
          {d}
        </button>
      );
    });

    return [...blanks, ...days];
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Date Picker Side */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-[#524A44] flex items-center gap-2">
          <CalendarIcon size={16} /> Select Date <span className="text-[#B26959]">*</span>
        </label>

        <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-[#2D2A26]">
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
              <div key={d} className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 justify-items-center">
            {renderCalendarDays()}
          </div>
          {!!maxAppointmentsPerDay && (
            <p className="text-[11px] text-[#A8A19A] mt-3 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B26959]/10 border border-[#B26959]/30 inline-block shrink-0"></span>
              Dates crossed out are fully booked ({maxAppointmentsPerDay} slot{maxAppointmentsPerDay === 1 ? '' : 's'}/day max) — please choose another date.
            </p>
          )}
        </div>
      </div>

      {/* Time Picker Side */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-[#524A44] flex items-center gap-2">
          <Clock size={16} /> Select Time <span className="text-[#B26959]">*</span>
        </label>

        <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 shadow-sm h-[320px] overflow-y-auto">
          {!selectedDate ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <CalendarIcon size={32} className="mb-2 opacity-20" />
              <p className="text-sm">Please select a date first</p>
            </div>
          ) : loadingAppts ? (
            <div className="h-full flex items-center justify-center text-zinc-400">
              <div className="animate-pulse flex items-center gap-2">
                <div className="w-4 h-4 bg-zinc-300 rounded-full"></div>
                <span className="text-sm">Checking availability...</span>
              </div>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <AlertCircle size={32} className="mb-2 text-[#B26959]/40" />
              <p className="text-sm font-medium text-[#B26959]">Fully Booked or Closed</p>
              <p className="text-xs mt-1 text-center max-w-[200px]">No available slots for this date. Please choose another date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSlots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onTimeChange(slot)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer
                    ${selectedTime === slot
                      ? 'border-[#9A8073] bg-[#9A8073] text-white shadow-md'
                      : 'border-[#EBE6E0] text-[#524A44] hover:border-[#9A8073]/50 hover:bg-[#FAF6F3]'
                    }
                  `}
                >
                  {(() => {
                    const [h, m] = slot.split(':');
                    const ampm = Number(h) >= 12 ? 'PM' : 'AM';
                    const h12 = Number(h) % 12 || 12;
                    return `${h12}:${m} ${ampm}`;
                  })()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
