'use client';

import { FormEvent } from 'react';
import BookingReferenceSummary from './review/BookingReferenceSummary';
import BookingScheduleSummary from './review/BookingScheduleSummary';
import BookingContactSection from './review/BookingContactSection';
import BookingPaymentSection from './review/BookingPaymentSection';
import {
  StoreSettings,
  Branch,
  Service,
  PackageInfo,
  BookingCustomer,
} from '../types';

interface UserInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BookingStep3ReviewProps {
  readonly refName: string | null;
  readonly refImage: string | null;
  readonly refPrice: string | null;
  readonly refSize: string | null;
  readonly refColor: string | null;
  readonly selectedService: Service | null;
  readonly packageInfo: PackageInfo | null;
  readonly appointmentType: string;
  readonly date: string;
  readonly time: string;
  readonly selectedBranch: Branch | null;
  readonly formatDatePreview: (d: string) => string;
  readonly formatTimePreview: (t: string) => string;
  readonly onEditSchedule: () => void;
  readonly user: UserInfo | null;
  readonly customer: BookingCustomer;
  readonly setCustomer: React.Dispatch<React.SetStateAction<BookingCustomer>>;
  readonly remarks: string;
  readonly setRemarks: (val: string) => void;
  readonly storeSettings: StoreSettings | null;
  readonly answers: Record<string, string>;
  readonly setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly paymentMethod: string;
  readonly setPaymentMethod: (val: string) => void;
  readonly paymentReference: string;
  readonly setPaymentReference: (val: string) => void;
  readonly paymentReceiptUrl: string;
  readonly uploadingReceipt: boolean;
  readonly handleReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export default function BookingStep3Review({
  refName,
  refImage,
  refPrice,
  refSize,
  refColor,
  selectedService,
  packageInfo,
  appointmentType,
  date,
  time,
  selectedBranch,
  formatDatePreview,
  formatTimePreview,
  onEditSchedule,
  user,
  customer,
  setCustomer,
  remarks,
  setRemarks,
  storeSettings,
  answers,
  setAnswers,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  setPaymentReference,
  paymentReceiptUrl,
  uploadingReceipt,
  handleReceiptUpload,
  handleSubmit,
}: BookingStep3ReviewProps) {
  return (
    <form id="booking-form" onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      {/* 1. Summary Card */}
      <BookingReferenceSummary
        refName={refName}
        refImage={refImage}
        refPrice={refPrice}
        refSize={refSize}
        refColor={refColor}
        selectedService={selectedService}
        packageInfo={packageInfo}
        appointmentType={appointmentType}
        onEditSchedule={onEditSchedule}
      />

      {/* 2. Schedule Card */}
      <BookingScheduleSummary
        date={date}
        time={time}
        selectedBranch={selectedBranch}
        appointmentType={appointmentType}
        formatDatePreview={formatDatePreview}
        formatTimePreview={formatTimePreview}
        onEditSchedule={onEditSchedule}
      />

      {/* 3. Customer Contact Section */}
      <BookingContactSection
        user={user}
        customer={customer}
        setCustomer={setCustomer}
      />

      {/* 4. Notes Field */}
      <div className="pt-3 border-t border-line">
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
        <p className="mobile-caption text-ink-faint mt-1 font-normal">
          Maglagay ng maikling paalala o detalye para sa iyong appointment visit.
        </p>
      </div>

      {/* 5. Additional Information */}
      {storeSettings?.booking_questions && storeSettings.booking_questions.length > 0 && (
        <div className="pt-3 space-y-3 border-t border-line">
          <h3 className="mobile-h4 font-semibold text-ink">Additional Information</h3>
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

      {/* 6. Fitting Reservation Fee */}
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
    </form>
  );
}
