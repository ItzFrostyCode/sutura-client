'use client';

import { use, Suspense } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import BookingHeader from '@/components/booking/BookingHeader';
import BookingSuccessState from '@/components/booking/BookingSuccessState';
import BookingReferenceCard from '@/components/booking/BookingReferenceCard';
import BookingActionBar from '@/components/booking/BookingActionBar';
import BookingStep1Policy from '@/components/booking/steps/BookingStep1Policy';
import BookingStep2Schedule from '@/components/booking/steps/BookingStep2Schedule';
import BookingStep3Review from '@/components/booking/steps/BookingStep3Review';
import { useBookingWizard } from '@/components/booking/hooks/useBookingWizard';

function BookingWizardContent({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  const b = useBookingWizard(storeId);

  if (b.loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <Loader2 size={28} className="text-ink-faint animate-spin" />
      </div>
    );
  }

  if (b.success) {
    return <BookingSuccessState storeId={storeId} storeName={b.storeSettings?.name} />;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas text-ink">
      <BookingHeader onBack={() => (b.step > 1 ? b.setStep(b.prevStep) : b.router.back())} />

      <div className="flex-1 mobile-screen-margins py-4 pb-28">
        <div className="w-full max-w-xl mx-auto">
          {/* Header Context & Step Progress */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{b.storeSettings?.name}</p>
              {b.branchAutoFilled && b.autoFilledBranch && (
                <p className="flex items-center gap-1 text-xs text-ink-faint mt-0.5">
                  <MapPin size={11} className="text-taupe shrink-0" />
                  {b.autoFilledBranch.name}
                </p>
              )}
            </div>
            <div className="text-xs font-semibold text-ink-faint bg-sunken border border-line px-2.5 py-1 rounded-full">
              Step {b.displayStep} of {b.totalSteps}
            </div>
          </div>

          {/* Compact Design Reference Preview for Steps 1 & 2 */}
          {b.step < 3 && (
            <BookingReferenceCard
              refName={b.refName}
              refImage={b.refImage}
              refPrice={b.refPrice}
              refSize={b.refSize}
              refColor={b.refColor}
              packageInfo={b.packageInfo}
            />
          )}

          {/* Wizard Steps */}
          <div>
            {b.step === 1 && <BookingStep1Policy storeSettings={b.storeSettings} />}

            {b.step === 2 && (
              <BookingStep2Schedule
                availableBookingTypes={b.availableBookingTypes}
                appointmentType={b.appointmentType}
                setAppointmentType={b.setAppointmentType}
                needsServicePicker={b.needsServicePicker}
                typesRequiringService={b.typesRequiringService}
                selectedServiceId={b.selectedServiceId}
                setSelectedServiceId={b.setSelectedServiceId}
                storeSettings={b.storeSettings}
                needsOrderReference={b.needsOrderReference}
                remarks={b.remarks}
                setRemarks={b.setRemarks}
                branchAutoFilled={b.branchAutoFilled}
                autoFilledBranch={b.autoFilledBranch}
                branchesWithDistance={b.branchesWithDistance}
                selectedBranchId={b.selectedBranchId}
                setSelectedBranchId={b.setSelectedBranchId}
                userLocation={b.userLocation}
                date={b.date}
                setDate={b.setDate}
                time={b.time}
                setTime={b.setTime}
                parsedOperatingHours={b.parsedOperatingHours}
                calendarAppointments={b.calendarAppointments}
                durationMinutes={b.durationMinutes}
                specialHoursForDate={b.specialHoursForDate}
              />
            )}

            {b.step === 3 && (
              <BookingStep3Review
                refName={b.refName}
                refImage={b.refImage}
                refPrice={b.refPrice}
                refSize={b.refSize}
                refColor={b.refColor}
                selectedService={b.selectedService}
                packageInfo={b.packageInfo}
                appointmentType={b.appointmentType}
                date={b.date}
                time={b.time}
                selectedBranch={b.selectedBranch}
                formatDatePreview={b.formatDatePreview}
                formatTimePreview={b.formatTimePreview}
                onEditSchedule={() => b.setStep(2)}
                user={b.user}
                customer={b.customer}
                setCustomer={b.setCustomer}
                remarks={b.remarks}
                setRemarks={b.setRemarks}
                storeSettings={b.storeSettings}
                answers={b.answers}
                setAnswers={b.setAnswers}
                paymentMethod={b.paymentMethod}
                setPaymentMethod={b.setPaymentMethod}
                paymentReference={b.paymentReference}
                setPaymentReference={b.setPaymentReference}
                paymentReceiptUrl={b.paymentReceiptUrl}
                uploadingReceipt={b.uploadingReceipt}
                handleReceiptUpload={b.handleReceiptUpload}
                handleSubmit={b.handleSubmit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Anchored Bottom Action Bar */}
      <BookingActionBar
        step={b.step}
        onNextStep={() => b.setStep(b.step + 1)}
        step2NextDisabled={b.step2NextDisabled}
        submitting={b.submitting}
        uploadingReceipt={b.uploadingReceipt}
      />
    </div>
  );
}

export default function BookingWizard({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-white">
          <Loader2 size={28} className="text-ink-faint animate-spin" />
        </div>
      }
    >
      <BookingWizardContent params={params} />
    </Suspense>
  );
}
