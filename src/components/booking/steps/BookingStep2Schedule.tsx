'use client';

import React from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';
import {
  StoreSettings,
  Branch,
  CalendarAppointment,
  SpecialHour,
  BookingCustomer,
} from '../types';
import BookingServicePicker from './schedule/BookingServicePicker';
import BookingBranchSelector from './schedule/BookingBranchSelector';
import BookingMaterialSelector from './schedule/BookingMaterialSelector';
import BookingPaymentSection from './review/BookingPaymentSection';

interface UserInfo {
  name?: string | null;
  email?: string | null;
}

interface BookingStep2ScheduleProps {
  readonly appointmentType: string;
  readonly materialSource: 'own' | 'shop' | '';
  readonly setMaterialSource: (val: 'own' | 'shop' | '') => void;
  readonly materialDescription: string;
  readonly setMaterialDescription: (val: string) => void;
  readonly needsServicePicker: boolean;
  readonly typesRequiringService: string[];
  readonly selectedServiceId: string;
  readonly setSelectedServiceId: (val: string) => void;
  readonly storeSettings: StoreSettings | null;
  readonly needsOrderReference: boolean;
  readonly orderReference: string;
  readonly setOrderReference: (val: string) => void;
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
  readonly user: UserInfo | null;
  readonly customer: BookingCustomer;
  readonly setCustomer: React.Dispatch<React.SetStateAction<BookingCustomer>>;
  readonly answers: Record<string, string>;
  readonly setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly paymentMethod: string;
  readonly setPaymentMethod: (val: string) => void;
  readonly paymentReference: string;
  readonly setPaymentReference: (val: string) => void;
  readonly paymentReceiptUrl: string;
  readonly uploadingReceipt: boolean;
  readonly handleReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BookingStep2Schedule({
  appointmentType,
  materialSource,
  setMaterialSource,
  materialDescription,
  setMaterialDescription,
  needsServicePicker,
  typesRequiringService,
  selectedServiceId,
  setSelectedServiceId,
  storeSettings,
  needsOrderReference,
  orderReference,
  setOrderReference,
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
  user,
  customer,
  setCustomer,
  answers,
  setAnswers,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  setPaymentReference,
  paymentReceiptUrl,
  uploadingReceipt,
  handleReceiptUpload,
}: BookingStep2ScheduleProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="mobile-h2 text-ink">Branch, Schedule &amp; Details</h2>

      <BookingServicePicker
        needsServicePicker={needsServicePicker}
        typesRequiringService={typesRequiringService}
        appointmentType={appointmentType}
        selectedServiceId={selectedServiceId}
        setSelectedServiceId={setSelectedServiceId}
        storeSettings={storeSettings}
        needsOrderReference={needsOrderReference}
        orderReference={orderReference}
        setOrderReference={setOrderReference}
      />

      {(appointmentType === 'consultation' || appointmentType === 'measurement') && (
        <BookingMaterialSelector
          materialSource={materialSource}
          setMaterialSource={setMaterialSource}
          materialDescription={materialDescription}
          setMaterialDescription={setMaterialDescription}
        />
      )}

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

      {/* Relevant Details — contact confirmation, notes, owner questions,
          payment. Already-authenticated (name/email come from the account),
          so only what the account doesn't already know gets asked here. */}
      <div className="pt-4 border-t border-line space-y-4">
        <h3 className="mobile-h3 font-semibold text-ink">Relevant Details</h3>

        <div className="space-y-1.5">
          <label htmlFor="customer-quick-phone" className="mobile-caption font-semibold text-ink-body flex items-center gap-1">
            <Phone size={14} className="text-taupe" /> Contact Number
          </label>
          <input
            id="customer-quick-phone"
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="e.g. 0912 345 6789"
            className="w-full form-input-mobile bg-canvas border border-line rounded-lg text-base text-ink font-normal focus:outline-none focus:border-taupe"
          />
          <p className="mobile-caption text-ink-faint font-normal">
            {user?.name ? `Booking as ${user.name} (${user.email})` : 'For appointment updates and SMS notifications.'}
          </p>
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
            placeholder="Specify the details..."
            className="w-full bg-canvas border border-line rounded-lg px-3.5 py-2.5 text-ink text-base font-normal focus:outline-none focus:border-taupe resize-none leading-relaxed"
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
                  className="w-full form-input-mobile bg-canvas border border-line rounded-lg text-base text-ink font-normal focus:outline-none focus:border-taupe"
                />
              </div>
            ))}
          </div>
        )}

        <BookingPaymentSection
          storeSettings={storeSettings}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentReference={paymentReference}
          setPaymentReference={setPaymentReference}
          paymentReceiptUrl={paymentReceiptUrl}
          uploadingReceipt={uploadingReceipt}
          handleReceiptUpload={handleReceiptUpload}
        />
      </div>
    </div>
  );
}
