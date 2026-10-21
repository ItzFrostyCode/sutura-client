'use client';

import BookingPhotos from '../BookingPhotos';
import React from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';
import {
  StoreSettings,
  Branch,
  CalendarAppointment,
  SpecialHour,
  BookingCustomer,
  Service,
} from '../types';
import type { BookingKind } from '../hooks/useBookingWizard';
import BookingServiceQuestions from './BookingServiceQuestions';
import BookingServicePicker from './schedule/BookingServicePicker';
import BookingBranchSelector from './schedule/BookingBranchSelector';
import BookingMaterialSelector from './schedule/BookingMaterialSelector';
import DesignSourceField from '@/components/shared/DesignSourceField';
import type { DesignSource } from '@/lib/designSource';

interface UserInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BookingStep2ScheduleProps {
  readonly kind: BookingKind;
  readonly appointmentType: string;
  readonly refName: string | null;
  readonly materialSource: 'own' | 'shop' | '';
  readonly setMaterialSource: (val: 'own' | 'shop' | '') => void;
  readonly materialDescription: string;
  readonly setMaterialDescription: (val: string) => void;
  readonly design: { design_source: DesignSource | null; design_link: string | null };
  readonly setDesign: (val: { design_source: DesignSource | null; design_link: string | null }) => void;
  readonly peopleCount: string;
  readonly setPeopleCount: (val: string) => void;
  readonly storeId: string;
  readonly photos: string[];
  readonly setPhotos: (val: string[]) => void;
  readonly needsServicePicker: boolean;
  readonly selectedServiceId: string;
  readonly setSelectedServiceId: (val: string) => void;
  readonly storeSettings: StoreSettings | null;
  readonly remarks: string;
  readonly setRemarks: (val: string) => void;
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
  readonly user: UserInfo | null;
  readonly customer: BookingCustomer;
  readonly setCustomer: React.Dispatch<React.SetStateAction<BookingCustomer>>;
  readonly answers: Record<string, string>;
  /** The chosen service's own questions, if the shop set any. */
  readonly serviceFields?: Service['custom_fields'];
  readonly setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function BookingStep2Schedule({
  kind,
  appointmentType,
  refName,
  materialSource,
  setMaterialSource,
  materialDescription,
  setMaterialDescription,
  design,
  setDesign,
  peopleCount,
  setPeopleCount,
  storeId,
  photos,
  setPhotos,
  needsServicePicker,
  selectedServiceId,
  setSelectedServiceId,
  storeSettings,
  remarks,
  setRemarks,
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
  user,
  customer,
  setCustomer,
  answers,
  setAnswers,
  serviceFields,
}: BookingStep2ScheduleProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">Branch, Schedule &amp; Details</h2>

      <BookingServicePicker
        needsServicePicker={needsServicePicker}
        selectedServiceId={selectedServiceId}
        setSelectedServiceId={setSelectedServiceId}
        storeSettings={storeSettings}
      />

      {/* Material selection is ONLY relevant for a custom service/design or alteration,
          never for a general shop visit/consultation. */}
      {kind === 'service' && (!!refName || appointmentType === 'alteration') && (
        <BookingMaterialSelector
          materialSource={materialSource}
          setMaterialSource={setMaterialSource}
          materialDescription={materialDescription}
          setMaterialDescription={setMaterialDescription}
        />
      )}

      {/* Where the design comes from: told to the shop before the consultation. */}
      {kind === 'service' && appointmentType !== 'alteration' && (
        <DesignSourceField audience="customer" source={design.design_source} link={design.design_link} onChange={setDesign} />
      )}

      {kind === 'service' && appointmentType !== 'alteration' && (
        <div>
          <label htmlFor="booking-people" className="mobile-caption font-semibold text-ink-body mb-1 block">People to measure <span className="font-normal text-ink-muted">(optional)</span></label>
          <input id="booking-people" type="number" inputMode="numeric" min={1} max={500} value={peopleCount} onChange={(e) => setPeopleCount(e.target.value)} placeholder="Just me" className="w-full form-input-mobile bg-white border-2 border-line focus:border-taupe rounded-xl text-base text-ink px-4" />
          <p className="mobile-caption mt-1 text-ink-muted">Leave it empty if it is just you. For a team or a group, the shop measures everyone, and each person gets their own measurements.</p>
        </div>
      )}

      {kind === 'service' && <BookingPhotos storeId={storeId} photos={photos} setPhotos={setPhotos} />}

      <BookingBranchSelector
        storeSettings={storeSettings}
        branchesWithDistance={branchesWithDistance}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        userLocation={userLocation}
      />

      {/* Interactive Date & Time Picker */}
      <div className="space-y-2 pt-1">
        <label className="mobile-h4 font-semibold text-ink block">
          Select Date &amp; Time <span className="text-danger">*</span>
        </label>
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 shadow-xs">
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

      {/* Relevant Details — contact confirmation, notes, owner questions. Already-authenticated (name/email come from the account),
          so only what the account doesn't already know gets asked here. */}
      <div className="pt-4 border-t border-line space-y-4">
        <h3 className="mobile-h3 font-semibold text-ink">Relevant Details</h3>

        <div className="space-y-1.5">
          <label htmlFor="customer-quick-phone" className="mobile-caption font-semibold text-ink-body flex items-center gap-1">
            <Phone size={14} className="text-taupe" /> Contact Number <span className="text-danger">*</span>
          </label>
          <input
            id="customer-quick-phone"
            type="tel"
            required
            value={customer.phone}
            onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="e.g. 0912 345 6789"
            className="w-full form-input-mobile bg-white border-2 border-line hover:border-taupe/60 focus:border-taupe focus:ring-2 focus:ring-taupe/10 rounded-xl text-base text-ink font-normal px-4 transition-colors shadow-xs"
          />
          {(!customer.phone || customer.phone.trim().length === 0) ? (
            <p className="mobile-caption text-danger font-medium mt-1 flex items-center gap-1">
              <AlertCircle size={13} className="shrink-0" /> Contact number is required to proceed.
            </p>
          ) : customer.phone.trim().replace(/\D/g, '').length < 7 ? (
            <p className="mobile-caption text-danger font-medium mt-1 flex items-center gap-1">
              <AlertCircle size={13} className="shrink-0" /> Please enter a valid phone number (at least 7 digits).
            </p>
          ) : (
            <p className="mobile-caption text-ink-faint font-normal mt-1">
              {user?.name ? `Booking as ${user.name} (${user.email})` : 'For appointment updates and SMS notifications.'}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="customer-notes" className="mobile-caption font-semibold text-ink-body block">
              Notes
            </label>
            <span className={`mobile-caption ${remarks.length >= 120 ? 'text-danger font-semibold' : 'text-ink-faint'}`}>
              {remarks.length} / 120
            </span>
          </div>
          <textarea
            id="customer-notes"
            rows={3}
            maxLength={120}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value.slice(0, 120))}
            placeholder="Specify any details or requests..."
            className="w-full bg-white border-2 border-line hover:border-taupe/60 focus:border-taupe focus:ring-2 focus:ring-taupe/10 rounded-xl px-4 py-3 text-ink text-base font-normal resize-none leading-relaxed transition-colors shadow-xs"
          />
        </div>

        {storeSettings?.booking_questions && storeSettings.booking_questions.length > 0 && (
          <div className="space-y-3">
            {storeSettings.booking_questions.map((question: string, idx: number) => (
              <div key={question}>
                <label htmlFor={`question-${idx}`} className="mobile-caption font-semibold text-ink-body mb-1 block">
                  {question}
                </label>
                <input
                  id={`question-${idx}`}
                  type="text"
                  required
                  value={answers[question] || ''}
                  onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
                  className="w-full form-input-mobile bg-white border-2 border-line hover:border-taupe/60 focus:border-taupe focus:ring-2 focus:ring-taupe/10 rounded-xl text-base text-ink font-normal px-4 transition-colors shadow-xs"
                />
              </div>
            ))}
          </div>
        )}

        {serviceFields && serviceFields.length > 0 && (
          <BookingServiceQuestions fields={serviceFields} answers={answers} setAnswers={setAnswers} />
        )}
      </div>
    </div>
  );
}
