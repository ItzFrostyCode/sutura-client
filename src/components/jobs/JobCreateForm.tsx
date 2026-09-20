'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useJobCreateForm } from './form/useJobCreateForm';
import GarmentDesignSection from './form/GarmentDesignSection';
import CustomerServiceSection from './form/CustomerServiceSection';
import CustomSpecsSection from './form/CustomSpecsSection';
import ProductionFulfillmentSection from './form/ProductionFulfillmentSection';
import StaffAssignmentSection from './form/StaffAssignmentSection';
import PricingScheduleSection from './form/PricingScheduleSection';

export default function JobCreateForm() {
  const {
    shop,
    loading,
    submitting,
    error,
    handleSubmit,
    customers,
    services,
    staff,
    catalogItems,
    customerMeasurements,
    catalogItemId,
    setCatalogItemId,
    handleSelectCatalogItem,
    standardSize,
    setStandardSize,
    appointmentId,
    setAppointmentId,
    effectiveIntakeChannel,
    referenceImages,
    setReferenceImages,
    referenceLink,
    setReferenceLink,
    uploadingReference,
    setUploadingReference,
    customerLocked,
    setCustomerLocked,
    isTotalAmountCustom,
    setIsTotalAmountCustom,
    isDueDateCustom,
    setIsDueDateCustom,
    isBulkOrder,
    setIsBulkOrder,
    teamName,
    setTeamName,
    roster,
    setRoster,
    preExistingDamageNotes,
    setPreExistingDamageNotes,
    formData,
    setFormData,
    staffStageAssignments,
    setStaffStageAssignments,
    showOutsourcingHelp,
    setShowOutsourcingHelp,
    customFieldValues,
    setCustomFieldValues,
    handleCheckboxChange,
    selectedService,
    selectedCatalogItem,
    isSelectedAlterationRepair,
    isCustomTailoring,
    sectionTwoMeta,
  } = useJobCreateForm();

  if (loading) {
    return (
      <div className="py-12 text-center text-ink-faint animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-taupe" />
        <span>Loading form data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jobs"
          className="p-2 bg-surface border border-line rounded-lg hover:bg-sunken text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Create Job Order</h1>
          <p className="text-ink-muted text-sm mt-1">
            Start a new garment production workflow.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6">
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {appointmentId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <div>
              <span className="font-semibold">Linked Booking:</span> This Job Order will automatically link to and update Appointment{' '}
              <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs font-bold">
                #{appointmentId}
              </span>.
            </div>
            <button
              type="button"
              onClick={() => setAppointmentId(null)}
              className="text-blue-500 hover:text-blue-700 text-xs font-semibold cursor-pointer"
            >
              Clear Link
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Garment Type & Design */}
          <GarmentDesignSection
            formData={formData}
            setFormData={setFormData}
            catalogItems={catalogItems}
            catalogItemId={catalogItemId}
            setCatalogItemId={setCatalogItemId}
            onSelectCatalogItem={handleSelectCatalogItem}
            standardSize={standardSize}
            setStandardSize={setStandardSize}
            isSelectedAlterationRepair={isSelectedAlterationRepair}
            appointmentId={appointmentId}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            referenceLink={referenceLink}
            setReferenceLink={setReferenceLink}
            uploadingReference={uploadingReference}
            setUploadingReference={setUploadingReference}
            shopId={shop?.id}
          />

          {/* Section 2: Customer & Service Details */}
          <CustomerServiceSection
            formData={formData}
            setFormData={setFormData}
            effectiveIntakeChannel={effectiveIntakeChannel}
            appointmentId={appointmentId}
            customerLocked={customerLocked}
            setCustomerLocked={setCustomerLocked}
            customers={customers}
            services={services}
            customerMeasurements={customerMeasurements}
            isBulkOrder={isBulkOrder}
            setIsBulkOrder={setIsBulkOrder}
            setIsTotalAmountCustom={setIsTotalAmountCustom}
            setIsDueDateCustom={setIsDueDateCustom}
            setCustomFieldValues={setCustomFieldValues}
            selectedCatalogItem={selectedCatalogItem}
          />

          {/* Section 3: Custom Specifications & Notes */}
          <CustomSpecsSection
            formData={formData}
            setFormData={setFormData}
            selectedService={selectedService}
            isSelectedAlterationRepair={isSelectedAlterationRepair}
            preExistingDamageNotes={preExistingDamageNotes}
            setPreExistingDamageNotes={setPreExistingDamageNotes}
            customFieldValues={customFieldValues}
            setCustomFieldValues={setCustomFieldValues}
            handleCheckboxChange={handleCheckboxChange}
            isBulkOrder={isBulkOrder}
            setIsBulkOrder={setIsBulkOrder}
            teamName={teamName}
            setTeamName={setTeamName}
            roster={roster}
            setRoster={setRoster}
            sectionTwoMeta={sectionTwoMeta}
          />

          {/* Section 4: Production & Fulfillment */}
          <ProductionFulfillmentSection
            formData={formData}
            setFormData={setFormData}
            showOutsourcingHelp={showOutsourcingHelp}
            setShowOutsourcingHelp={setShowOutsourcingHelp}
          />

          {/* Section 5: Staff Assignment */}
          <StaffAssignmentSection
            staff={staff}
            staffStageAssignments={staffStageAssignments}
            setStaffStageAssignments={setStaffStageAssignments}
          />

          {/* Section 6: Pricing & Schedule */}
          <PricingScheduleSection
            formData={formData}
            setFormData={setFormData}
            selectedService={selectedService}
            isCustomTailoring={isCustomTailoring}
            isTotalAmountCustom={isTotalAmountCustom}
            setIsTotalAmountCustom={setIsTotalAmountCustom}
            setIsDueDateCustom={setIsDueDateCustom}
          />

          {/* Action Buttons */}
          <div className="pt-6 border-t border-line flex justify-end gap-4">
            <Link
              href="/dashboard/jobs"
              className="px-6 py-2.5 rounded-lg font-medium text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-taupe hover:bg-taupe-hover text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Create Job Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
