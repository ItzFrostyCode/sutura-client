'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobCreateForm } from './form/useJobCreateForm';
import JobOrderWizardStepper from './wizard/JobOrderWizardStepper';
import Step1CustomerInfo from './wizard/Step1CustomerInfo';
import Step2Measurements, { IndividualMeasurements } from './wizard/Step2Measurements';
import Step3OrderSpecs from './wizard/Step3OrderSpecs';
import Step4InvoicePayment from './wizard/Step4InvoicePayment';
import type { CustomerData } from './form/types';
import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import type { Staff } from '@/components/staff/staffHelpers';

export default function JobCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnParam = searchParams.get('return');
  const canCollectMoney = useAuthStore((s) =>
    (s.user?.roles ?? []).some((r) =>
      ['store_owner', 'branch_manager', 'super_admin'].includes(r.name)
    )
  );

  const staffWithoutAppointment = !canCollectMoney && !searchParams.get('appointment_id');
  const backHref = returnParam?.startsWith('/dashboard/') && !returnParam.startsWith('//')
    ? returnParam
    : '/dashboard/jobs';

  const {
    store,
    loading,
    error: formHookError,
    customers,
    services,
    catalogItems,
    customerMeasurements,
    catalogItemId,
    setCatalogItemId,
    handleSelectCatalogItem,
    appointmentId,
    servicePackage,
    effectiveIntakeChannel,
    referenceImages,
    setReferenceImages,
    referenceLink,
    setReferenceLink,
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
    customFieldValues,
  } = useJobCreateForm();

  // Wizard Navigation State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(1);
  const [wizardError, setWizardError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 1: Customer Info
  const [customerMode, setCustomerMode] = useState<'search' | 'new'>('new');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Step 2: Measurements
  const [measurements, setMeasurements] = useState<IndividualMeasurements>({
    unit: 'in',
    chest: '',
    waist: '',
    hips: '',
    shoulders: '',
    length: '',
    neck: '',
    sleeve: '',
    inseam: '',
  });
  const [selectedMeasurementProfileId, setSelectedMeasurementProfileId] = useState<string>('');
  const [sizeBreakdown, setSizeBreakdown] = useState<Record<string, string>>({
    XS: '',
    S: '',
    M: '',
    L: '',
    XL: '',
    '2XL': '',
    '3XL': '',
  });
  const [measurementSheets, setMeasurementSheets] = useState<string[]>([]);
  const [uploadingSheet, setUploadingSheet] = useState<boolean>(false);

  // Step 3: Order Specifications
  const [orderType, setOrderType] = useState<'catalog' | 'custom' | 'alteration'>('custom');
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');

  // Fetch shop staff directory for tailor assignment
  useEffect(() => {
    if (!store?.id) return;
    api
      .get(`/stores/${store.id}/staff`)
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffList(list.filter((s: Staff) => s.is_active !== false));
      })
      .catch((err) => {
        console.warn('Could not load staff directory for job creation:', err);
      });
  }, [store?.id]);

  // Step 4: Invoice & Payment
  const [itemRate, setItemRate] = useState<string>('');
  const [paymentTerm, setPaymentTerm] = useState<'full' | 'downpayment'>('downpayment');

  // Sync incoming customer if prefilled from query
  useEffect(() => {
    if (formData.customer_id && customers.length > 0) {
      const match = customers.find((c) => c.id.toString() === formData.customer_id);
      if (match) {
        setCustomerMode('search');
        setFullName(match.name);
        setEmail(match.email || '');
        setPhone(match.phone || '');
      }
    }
  }, [formData.customer_id, customers]);

  // Sync unit price from service or catalog item
  useEffect(() => {
    if (catalogItemId) {
      const cat = catalogItems.find((c) => c.id.toString() === catalogItemId);
      if (cat && cat.price) {
        setItemRate(cat.price.toString());
      }
    } else if (formData.service_id) {
      const svc = services.find((s) => s.id.toString() === formData.service_id);
      if (svc && svc.base_price) {
        setItemRate(svc.base_price.toString());
      }
    }
  }, [catalogItemId, formData.service_id, catalogItems, services]);

  // Sync bulk quantities
  useEffect(() => {
    if (isBulkOrder) {
      const totalPcs = Object.values(sizeBreakdown).reduce(
        (sum, val) => sum + (parseInt(val, 10) || 0),
        0
      );
      if (totalPcs > 0) {
        setFormData((prev) => ({ ...prev, quantity: totalPcs.toString() }));
      }
    }
  }, [isBulkOrder, sizeBreakdown, setFormData]);

  // When saved measurement profile is picked
  const handleSelectSavedProfile = (profileId: string) => {
    setSelectedMeasurementProfileId(profileId);
    setFormData((prev) => ({ ...prev, measurement_id: profileId }));
    const profile = customerMeasurements.find((m) => m.id.toString() === profileId);
    if (profile?.metrics) {
      setMeasurements((prev) => ({
        ...prev,
        chest: profile.metrics?.chest || profile.metrics?.bust || '',
        waist: profile.metrics?.waist || '',
        hips: profile.metrics?.hips || '',
        shoulders: profile.metrics?.shoulder || profile.metrics?.shoulders || '',
        length: profile.metrics?.length || profile.metrics?.shirt_length || '',
        neck: profile.metrics?.neck || '',
        sleeve: profile.metrics?.sleeve_length || '',
        inseam: profile.metrics?.inseam || '',
      }));
    }
  };

  // Auto-pull latest saved body measurements into Step 2 when measurements load for selected customer
  useEffect(() => {
    if (customerMeasurements.length > 0) {
      const sorted = [...customerMeasurements].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      const latest = sorted[0];
      if (latest) {
        setSelectedMeasurementProfileId(latest.id.toString());
        setFormData((prev) => ({ ...prev, measurement_id: latest.id.toString() }));
        if (latest.metrics) {
          setMeasurements((prev) => ({
            ...prev,
            chest: latest.metrics?.chest || latest.metrics?.bust || prev.chest,
            waist: latest.metrics?.waist || prev.waist,
            hips: latest.metrics?.hips || prev.hips,
            shoulders: latest.metrics?.shoulder || latest.metrics?.shoulders || prev.shoulders,
            length: latest.metrics?.length || latest.metrics?.shirt_length || prev.length,
            neck: latest.metrics?.neck || prev.neck,
            sleeve: latest.metrics?.sleeve_length || prev.sleeve,
            inseam: latest.metrics?.inseam || prev.inseam,
          }));
        }
      }
    }
  }, [customerMeasurements, setFormData]);

  const handleSelectCustomer = (cust: CustomerData | null) => {
    if (cust) {
      setFormData((prev) => ({ ...prev, customer_id: cust.id.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, customer_id: '', measurement_id: '' }));
      setSelectedMeasurementProfileId('');
    }
  };

  const handleCatalogPick = (item: CatalogItem) => {
    setCatalogItemId(item.id.toString());
    handleSelectCatalogItem(item.id.toString());
    if (item.price) {
      setItemRate(item.price.toString());
    }
  };

  // Upload helpers
  const handleUploadFile = async (file: File): Promise<string> => {
    if (!store) throw new Error('Shop not loaded');
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post(`/stores/${store.id}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.url || res.data?.data?.url || '';
  };

  const handleUploadSheet = async (file: File) => {
    try {
      setUploadingSheet(true);
      const url = await handleUploadFile(file);
      if (url) {
        setMeasurementSheets((prev) => [...prev, url]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload sheet photo. Please try again.');
    } finally {
      setUploadingSheet(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    try {
      setUploadingPhoto(true);
      const url = await handleUploadFile(file);
      if (url) {
        setReferenceImages((prev) => [...prev, url]);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload reference photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Navigation handlers
  const goToStep = (step: number) => {
    setWizardError('');
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep1Proceed = () => {
    if (!fullName.trim()) {
      setWizardError('Please enter the customer\'s name.');
      return;
    }
    setWizardError('');
    setMaxCompletedStep((prev) => Math.max(prev, 1));
    goToStep(2);
  };

  const handleStep2Proceed = () => {
    setWizardError('');
    setMaxCompletedStep((prev) => Math.max(prev, 2));
    goToStep(3);
  };

  const handleStep3Proceed = () => {
    if (!formData.service_id) {
      setWizardError('Please select a Type of Service before proceeding.');
      return;
    }
    if (orderType === 'alteration' && !preExistingDamageNotes.trim()) {
      setWizardError('Please document any pre-existing garment condition or damage notes for alteration jobs.');
      return;
    }
    setWizardError('');
    setMaxCompletedStep((prev) => Math.max(prev, 3));
    goToStep(4);
  };

  // Step 4 Final Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    if (!fullName.trim()) {
      setWizardError('Customer name is required.');
      goToStep(1);
      return;
    }

    if (!formData.due_date) {
      setWizardError('Please specify a production due date.');
      return;
    }

    setSubmitting(true);
    setWizardError('');

    try {
      let finalCustomerId = formData.customer_id;

      // 1. Create customer if new walk-in or customer_id is empty
      if (!finalCustomerId && fullName.trim()) {
        const custRes = await api.post(`/stores/${store.id}/customers`, {
          name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        });
        const createdCust = custRes.data?.data || custRes.data;
        if (createdCust?.id) {
          finalCustomerId = createdCust.id.toString();
        }
      }

      // 2. Calculations
      const totalAmt = parseFloat(formData.total_amount) || 0;
      const downPay = paymentTerm === 'full' ? totalAmt : (parseFloat(formData.downpayment) || 0);
      const appliedDownPay = Math.min(downPay, totalAmt);
      const balance = Math.max(0, totalAmt - appliedDownPay);

      // 3. Merge all image references
      const combinedImages = Array.from(
        new Set([...referenceImages, ...measurementSheets])
      );

      // 4. API Job creation payload
      await api.post(`/stores/${store.id}/jobs`, {
        intake_channel: effectiveIntakeChannel,
        fulfillment_type: 'pickup',
        customer_id: finalCustomerId,
        service_id: formData.service_id,
        assigned_staff_id: assignedStaffId ? Number(assignedStaffId) : null,
        assigned_to: assignedStaffId ? Number(assignedStaffId) : null,
        measurement_id: formData.measurement_id ? Number(formData.measurement_id) : null,
        quantity: isBulkOrder
          ? Math.max(1, Object.values(sizeBreakdown).reduce((s, c) => s + (parseInt(c, 10) || 0), 0))
          : Math.max(1, parseInt(formData.quantity, 10) || 1),
        total_amount: totalAmt.toFixed(2),
        discount_amount: 0,
        balance: balance.toFixed(2),
        due_date: formData.due_date || null,
        notes: formData.notes,
        custom_order_data: {
          ...customFieldValues,
          individual_measurements: !isBulkOrder ? measurements : null,
          size_breakdown: isBulkOrder ? sizeBreakdown : null,
          measurement_sheets: measurementSheets.length > 0 ? measurementSheets : null,
          team_name: isBulkOrder ? teamName || null : null,
          team_roster: isBulkOrder ? roster : null,
          pre_existing_damage_notes: orderType === 'alteration' ? preExistingDamageNotes.trim() : null,
          item_rate: itemRate || null,
          payment_term: paymentTerm,
        },
        appointment_id: appointmentId ? Number(appointmentId) : null,
        catalog_item_id: catalogItemId ? Number(catalogItemId) : null,
        service_package_id: servicePackage?.id ?? null,
        reference_images: combinedImages.length > 0 ? combinedImages : null,
        reference_link: referenceLink.trim() || null,
        material_source: formData.material_source,
        garment_category: formData.garment_category || null,
        is_rush: formData.is_rush,
        rush_fee: formData.is_rush ? Number(formData.rush_fee) : 0,
      });

      // 5. Success -> Redirect to dashboard
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      console.error(err);
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setWizardError(
        errorResponse.response?.data?.message || 'Failed to create job order. Please review your inputs.'
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-ink-muted animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-taupe" />
        <span className="text-sm font-semibold">Loading tailoring workspace...</span>
      </div>
    );
  }

  if (staffWithoutAppointment) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-ink">Start from an appointment</h1>
        <p className="text-sm text-ink-muted">
          Staff create job orders directly from an approved customer appointment.
        </p>
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center justify-center h-12 px-6 bg-taupe hover:bg-taupe-hover text-white rounded-xl font-bold text-sm shadow-2xs"
        >
          Go to Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center hover:bg-canvas text-ink-muted hover:text-ink transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-ink tracking-tight">
            Create Job Order
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
            Follow the 4-step wizard to register customer info, sizing, specifications, and invoice.
          </p>
        </div>
      </div>

      {/* Horizontal Stepper Header */}
      <JobOrderWizardStepper
        currentStep={currentStep}
        onStepClick={goToStep}
        maxCompletedStep={maxCompletedStep}
      />

      {/* Error Banner */}
      {(wizardError || formHookError) && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-2xl text-xs sm:text-sm text-danger font-semibold flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{wizardError || formHookError}</span>
        </div>
      )}

      {/* Linked Booking Notice if came from appointment */}
      {appointmentId && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between">
          <span>
            Linked Booking: This job order is connected to Appointment #{appointmentId}.
          </span>
        </div>
      )}

      {/* Active Wizard Step Content */}
      {currentStep === 1 && (
        <Step1CustomerInfo
          storeId={store?.id}
          customerMode={customerMode}
          setCustomerMode={setCustomerMode}
          customers={customers}
          selectedCustomerId={formData.customer_id}
          onSelectCustomer={handleSelectCustomer}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          onProceed={handleStep1Proceed}
        />
      )}

      {currentStep === 2 && (
        <Step2Measurements
          isBulkOrder={isBulkOrder}
          setIsBulkOrder={setIsBulkOrder}
          measurements={measurements}
          setMeasurements={setMeasurements}
          customerMeasurements={customerMeasurements}
          selectedMeasurementProfileId={selectedMeasurementProfileId}
          onSelectSavedProfile={handleSelectSavedProfile}
          sizeBreakdown={sizeBreakdown}
          setSizeBreakdown={setSizeBreakdown}
          roster={roster}
          setRoster={setRoster}
          teamName={teamName}
          setTeamName={setTeamName}
          measurementSheets={measurementSheets}
          setMeasurementSheets={setMeasurementSheets}
          uploadingSheet={uploadingSheet}
          onUploadSheet={handleUploadSheet}
          onBack={() => goToStep(1)}
          onProceed={handleStep2Proceed}
        />
      )}

      {currentStep === 3 && (
        <Step3OrderSpecs
          orderType={orderType}
          setOrderType={setOrderType}
          catalogItems={catalogItems}
          selectedCatalogItemId={catalogItemId}
          onSelectCatalogItem={handleCatalogPick}
          services={services}
          selectedServiceId={formData.service_id}
          onSelectService={(svcId) => setFormData((prev) => ({ ...prev, service_id: svcId }))}
          garmentCategory={formData.garment_category}
          setGarmentCategory={(cat) => setFormData((prev) => ({ ...prev, garment_category: cat }))}
          fabricSource={formData.material_source}
          setFabricSource={(src) => setFormData((prev) => ({ ...prev, material_source: src }))}
          referenceImages={referenceImages}
          setReferenceImages={setReferenceImages}
          referenceLink={referenceLink}
          setReferenceLink={setReferenceLink}
          uploadingPhoto={uploadingPhoto}
          onUploadPhoto={handleUploadPhoto}
          staffList={staffList}
          assignedStaffId={assignedStaffId}
          setAssignedStaffId={setAssignedStaffId}
          notes={formData.notes}
          setNotes={(n) => setFormData((prev) => ({ ...prev, notes: n }))}
          preExistingDamageNotes={preExistingDamageNotes}
          setPreExistingDamageNotes={setPreExistingDamageNotes}
          onBack={() => goToStep(2)}
          onProceed={handleStep3Proceed}
        />
      )}

      {currentStep === 4 && (
        <Step4InvoicePayment
          formData={formData}
          setFormData={setFormData}
          itemRate={itemRate}
          setItemRate={setItemRate}
          paymentTerm={paymentTerm}
          setPaymentTerm={setPaymentTerm}
          submitting={submitting}
          onBack={() => goToStep(3)}
          onSubmit={handleFinalSubmit}
        />
      )}
    </div>
  );
}
