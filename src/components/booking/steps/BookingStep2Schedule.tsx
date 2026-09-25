'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';
import {
  BookingTypeOption,
  StoreSettings,
  Branch,
  CalendarAppointment,
  SpecialHour,
} from '../types';
import BookingTypeSelector from './schedule/BookingTypeSelector';
import BookingServicePicker from './schedule/BookingServicePicker';
import BookingBranchSelector from './schedule/BookingBranchSelector';

interface BookingStep2ScheduleProps {
  readonly availableBookingTypes: BookingTypeOption[];
  readonly appointmentType: string;
  readonly setAppointmentType: (val: string) => void;
  readonly needsServicePicker: boolean;
  readonly typesRequiringService: string[];
  readonly selectedServiceId: string;
  readonly setSelectedServiceId: (val: string) => void;
  readonly storeSettings: StoreSettings | null;
  readonly needsOrderReference: boolean;
  readonly remarks: string;
  readonly setRemarks: (val: string) => void;
  readonly branchAutoFilled: boolean;
  readonly autoFilledBranch: Branch | null;
  readonly branchesWithDistance: Branch[];
  readonly selectedBranchId: string;
  readonly setSelectedBranchId: (val: string) => void;
  readonly userLocation: { lat: number; lng: number } | null;
  readonly date: string;
  readonly setDate: (val: string) => void;
  readonly time: string;
  readonly setTime: (val: string) => void;
  readonly parsedOperatingHours: Record<string, { is_open: boolean; open: string; close: string }> | null;
  readonly calendarAppointments: CalendarAppointment[];
  readonly durationMinutes: number;
  readonly specialHoursForDate: SpecialHour | null;
}

export default function BookingStep2Schedule({
  availableBookingTypes,
  appointmentType,
  setAppointmentType,
  needsServicePicker,
  typesRequiringService,
  selectedServiceId,
  setSelectedServiceId,
  storeSettings,
  needsOrderReference,
  remarks,
  setRemarks,
  branchAutoFilled,
  autoFilledBranch,
  branchesWithDistance,
  selectedBranchId,
  setSelectedBranchId,
  userLocation,
  date,
  setDate,
  time,
  setTime,
  parsedOperatingHours,
  calendarAppointments,
  durationMinutes,
  specialHoursForDate,
}: BookingStep2ScheduleProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">Appointment Type & Schedule</h2>

      <BookingTypeSelector
        availableBookingTypes={availableBookingTypes}
        appointmentType={appointmentType}
        onSelectType={setAppointmentType}
      />

      <BookingServicePicker
        needsServicePicker={needsServicePicker}
        typesRequiringService={typesRequiringService}
        appointmentType={appointmentType}
        selectedServiceId={selectedServiceId}
        setSelectedServiceId={setSelectedServiceId}
        storeSettings={storeSettings}
        needsOrderReference={needsOrderReference}
        remarks={remarks}
        setRemarks={setRemarks}
      />

      <BookingBranchSelector
        storeSettings={storeSettings}
        branchAutoFilled={branchAutoFilled}
        autoFilledBranch={autoFilledBranch}
        branchesWithDistance={branchesWithDistance}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        userLocation={userLocation}
      />

      {/* Interactive Date & Time Picker */}
      <div className="space-y-2 pt-1">
        <label className="mobile-h4 text-ink block">
          Select Date & Time <span className="text-danger">*</span>
        </label>
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs">
          <InteractiveCalendar
            selectedDate={date}
            selectedTime={time}
            operatingHours={parsedOperatingHours}
            specialHours={storeSettings?.special_hours || null}
            appointments={calendarAppointments}
            selectedBranchId={selectedBranchId || null}
            durationMinutes={durationMinutes}
            onDateChange={setDate}
            onTimeChange={setTime}
          />
        </div>
      </div>

      {specialHoursForDate && (
        specialHoursForDate.is_closed ? (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex gap-3 text-xs text-danger animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Temporarily Closed ({specialHoursForDate.title})</p>
              <p className="mobile-caption mt-0.5 font-normal">We are fully closed on this date. Please choose a different date for your appointment.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-ink-body animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold text-sm text-amber-900">Special Holiday Hours ({specialHoursForDate.title})</p>
              <p className="mobile-caption mt-0.5 font-normal text-amber-800">
                Custom hours for this date: {specialHoursForDate.special_open_time} - {specialHoursForDate.special_close_time}.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
