'use client';

import { use, Suspense } from 'react';
import { Loader2, MapPin, ClipboardList, CalendarDays as CalendarDaysIcon, CheckCircle2 } from 'lucide-react';
import BookingHeader from '@/components/booking/BookingHeader';
import BookingSuccessState from '@/components/booking/BookingSuccessState';
import RequestedItemsSection from '@/components/booking/RequestedItemsSection';
import BookingActionBar from '@/components/booking/BookingActionBar';
import BookingDesktopSummary from '@/components/booking/BookingDesktopSummary';
import BookingStep1Policy from '@/components/booking/steps/BookingStep1Policy';
import BookingStep2Schedule from '@/components/booking/steps/BookingStep2Schedule';
import BookingStep3Review from '@/components/booking/steps/BookingStep3Review';
import { useBookingWizard } from '@/components/booking/hooks/useBookingWizard';
import StatusStepper, { type StepperStage } from '@/components/shared/StatusStepper';

// Real visual progress indicator, replacing a plain "Step X of Y" text pill
// — reuses the same StatusStepper already proven on OrderTrackingView rather
// than inventing a second stepper style. Three fixed steps regardless of
// dynamic sub-fields within Step 2 (Schedule bundles several sections but is
// still one step in the flow).
const BOOKING_STAGE_KEYS = ['policy', 'schedule', 'review'] as const;
const BOOKING_STAGES: StepperStage[] = [
  { key: 'policy', label: 'Details', Icon: ClipboardList },
  { key: 'schedule', label: 'Schedule', Icon: CalendarDaysIcon },
  { key: 'review', label: 'Review', Icon: CheckCircle2 },
];

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
    return (
      <BookingSuccessState
        storeId={storeId}
        storeName={b.storeSettings?.name}
        appointmentType={b.appointmentType}
        selectedBranch={b.selectedBranch}
        date={b.date}
        time={b.time}
        formatDatePreview={b.formatDatePreview}
        formatTimePreview={b.formatTimePreview}
        materialSource={b.materialSource}
      />
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas text-ink overflow-x-hidden w-full max-w-full">
      <BookingHeader onBack={() => (b.step > 1 ? b.setStep(b.prevStep) : b.router.back())} />

      <div className="flex-1 mobile-screen-margins py-4 pb-[calc(140px+env(safe-area-inset-bottom))] overflow-x-hidden">
        <div className="w-full max-w-xl lg:max-w-5xl mx-auto lg:flex lg:gap-8 lg:items-start min-w-0">
        <div className="lg:flex-1 lg:max-w-xl min-w-0">
          {/* Header Context */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{b.storeSettings?.name}</p>
            {b.branchAutoFilled && b.autoFilledBranch && (
              <p className="flex items-center gap-1 text-xs text-ink-faint">
                <MapPin size={11} className="text-taupe shrink-0" />
                {b.autoFilledBranch.name}
              </p>
            )}
          </div>

          {/* Step Progress — real visual stepper, not a text pill */}
          <div className="mb-5">
            <StatusStepper stages={BOOKING_STAGES} currentKey={BOOKING_STAGE_KEYS[b.step - 1]} layout="horizontal" />
          </div>

          {/* Requested Services & Designs section (only when service or design items exist) */}
          {b.step === 1 && b.requestedItems.length > 0 && (
            <div className="mb-6">
              <RequestedItemsSection
                items={b.requestedItems}
                storeSettings={b.storeSettings}
                onUpdateQuantity={b.handleUpdateQuantity}
                onRemoveItem={b.handleRemoveItem}
                onUpdateNotes={b.handleUpdateNotes}
                onRemoveCatalogDesign={b.handleRemoveCatalogDesign}
                allowEdit={true}
                compact={false}
              />
            </div>
          )}

          {b.step === 2 && b.requestedItems.length > 0 && (
            <RequestedItemsSection
              items={b.requestedItems}
              storeSettings={b.storeSettings}
              onUpdateQuantity={b.handleUpdateQuantity}
              onRemoveItem={b.handleRemoveItem}
              onUpdateNotes={b.handleUpdateNotes}
              onRemoveCatalogDesign={b.handleRemoveCatalogDesign}
              allowEdit={true}
              compact={true}
            />
          )}

          {/* Wizard Steps */}
          <div>
            {b.step === 1 && (
              <BookingStep1Policy
                storeSettings={b.storeSettings}
                availableBookingTypes={b.availableBookingTypes}
                appointmentType={b.appointmentType}
                setAppointmentType={b.setAppointmentType}
                purposeLabel={b.purposeLabel}
                setPurposeLabel={b.setPurposeLabel}
              />
            )}

            {b.step === 2 && (
              <BookingStep2Schedule
                kind={b.kind}
                appointmentType={b.appointmentType}
                refName={b.refName}
                materialSource={b.materialSource}
                setMaterialSource={b.setMaterialSource}
                materialDescription={b.materialDescription}
                setMaterialDescription={b.setMaterialDescription}
                design={b.design}
                setDesign={b.setDesign}
                peopleCount={b.peopleCount}
                setPeopleCount={b.setPeopleCount}
                storeId={storeId}
                photos={b.photos}
                setPhotos={b.setPhotos}
                needsServicePicker={b.needsServicePicker}
                selectedServiceId={b.selectedServiceId}
                setSelectedServiceId={b.setSelectedServiceId}
                storeSettings={b.storeSettings}
                remarks={b.remarks}
                setRemarks={b.setRemarks}
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
                user={b.user}
                customer={b.customer}
                setCustomer={b.setCustomer}
                answers={b.answers}
                serviceFields={b.selectedService?.custom_fields}
                setAnswers={b.setAnswers}
              />
            )}

            {b.step === 3 && (
              <BookingStep3Review
                storeId={storeId}
                bookingError={b.bookingError}
                onClearBookingError={b.clearBookingError}
                requestedItems={b.requestedItems}
                onUpdateQuantity={b.handleUpdateQuantity}
                onRemoveItem={b.handleRemoveItem}
                onOpenAddModal={() => b.handleOpenAddModal()}
                onUpdateNotes={b.handleUpdateNotes}
                onRemoveCatalogDesign={b.handleRemoveCatalogDesign}
                purposeLabel={b.purposeLabel}
                refName={b.refName}
                refDetailHref={b.refItemId ? `/store/${storeId}/catalog/${b.refItemId}` : null}
                serviceDetailHref={b.selectedService ? `/store/${storeId}/service/${b.selectedService.id}` : null}
                refImage={b.refImage}
                refPrice={b.refPrice}
                refSize={b.refSize}
                refColor={b.refColor}
                refAddOns={b.refAddOns}
                selectedService={b.selectedService}
                appointmentType={b.appointmentType}
                date={b.date}
                time={b.time}
                selectedBranch={b.selectedBranch}
                formatDatePreview={b.formatDatePreview}
                formatTimePreview={b.formatTimePreview}
                onEditPurpose={b.onEditPurpose}
                onEditSchedule={b.onEditSchedule}
                user={b.user}
                customer={b.customer}
                remarks={b.remarks}
                answers={b.answers}
                storeSettings={b.storeSettings}
                materialSource={b.materialSource}
                materialDescription={b.materialDescription}
                quantity={b.quantity}
                handleSubmit={b.handleSubmit}
              />
            )}
          </div>
        </div>

        {b.step < 3 && (
          <BookingDesktopSummary
            requestedItems={b.requestedItems}
            refName={b.refName}
            refPrice={b.refPrice}
            selectedService={b.selectedService}
            appointmentType={b.appointmentType}
            selectedBranch={b.selectedBranch}
            date={b.date}
            time={b.time}
            formatDatePreview={b.formatDatePreview}
            formatTimePreview={b.formatTimePreview}
            materialSource={b.materialSource}
            quantity={b.quantity}
          />
        )}
        </div>
      </div>

      {/* Anchored Bottom Action Bar */}
      <BookingActionBar
        step={b.step}
        onNextStep={() => {
          if (b.returnToReview && b.step < 3) {
            b.setStep(3);
            b.setReturnToReview(false);
          } else {
            b.setStep(b.step + 1);
          }
        }}
        step1NextDisabled={b.step1NextDisabled}
        step2NextDisabled={b.step2NextDisabled}
        submitting={b.submitting}
        returnToReview={b.returnToReview}
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
