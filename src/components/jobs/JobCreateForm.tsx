'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useJobCreateForm } from './form/useJobCreateForm';
import { useBranch } from '@/context/BranchContext';
import JobOrderWizardStepper from './wizard/JobOrderWizardStepper';
import Step1CustomerInfo from './wizard/Step1CustomerInfo';
import Step2Measurements, { IndividualMeasurements } from './wizard/Step2Measurements';
import Step3OrderSpecs from './wizard/Step3OrderSpecs';
import Step4InvoicePayment from './wizard/Step4InvoicePayment';
import type { CustomerData } from './form/types';
import { EMPTY_BODY_MEASUREMENTS, extraMeasurementsFromMetrics, measurementsFromMetrics, pickMeasurements } from '@/lib/garmentMeasurements';
import { GARMENT_TYPE_OPTIONS } from './jobHelpers';
import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import type { Staff } from '@/components/staff/staffHelpers';
import { usePeopleList, type OrderPerson } from '@/components/order-people/usePeopleList';
import { CUSTOM_SIZE } from '@/components/store-catalog-detail/BulkOrderSheet';
import { customerEmail } from '@/components/customers/customerHelpers';
import { revealField } from '@/lib/revealField';

const WALK_IN_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
/** Same cap as an online order (the server caps a job at 500 pieces). */
const MAX_WALK_IN_PEOPLE = 500;

/** Pieces per size; people without a standard size are counted under "Custom". */
function bulkSizeBreakdown(persons: OrderPerson[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of persons) {
    const key = p.method === 'standard' ? p.size : CUSTOM_SIZE;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export default function JobCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnParam = searchParams.get('return');
  const canCollectMoney = useAuthStore((s) =>
    (s.user?.roles ?? []).some((r) =>
      ['store_owner', 'branch_manager', 'super_admin'].includes(r.name)
    )
  );

  // Staff create orders too (walk-in or from an appointment). They don't take
  // payments or give discounts here (canCollectMoney), and the server puts the
  // order in their own branch, unpaid.
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
  const [measurements, setMeasurements] = useState<IndividualMeasurements>(EMPTY_BODY_MEASUREMENTS);
  // A saved profile's own extra measurements (armhole, cuff…), shown and saved with the order.
  const [extraMeasurements, setExtraMeasurements] = useState<Record<string, string>>({});
  // A profile carries what it was made for; use it when the order hasn't picked one yet.
  const applyProfileGarment = (metrics: Record<string, unknown> | null | undefined) => {
    const g = typeof metrics?.garment === 'string' ? metrics.garment : '';
    if (g && GARMENT_TYPE_OPTIONS.some((o) => o.value === g)) {
      setFormData((prev) => (prev.garment_category ? prev : { ...prev, garment_category: g as typeof prev.garment_category }));
    }
  };
  const [selectedMeasurementProfileId, setSelectedMeasurementProfileId] = useState<string>('');
  const [measurementSheets, setMeasurementSheets] = useState<string[]>([]);
  const [uploadingSheet, setUploadingSheet] = useState<boolean>(false);
  // Bulk: the same people list + editor as the customer's online order (one piece per person).
  const people = usePeopleList({
    sizes: WALK_IN_SIZES,
    garmentType: formData.garment_category,
    hasSheets: measurementSheets.length > 0,
    max: MAX_WALK_IN_PEOPLE,
  });

  // Step 3: Order Specifications
  const [orderType, setOrderType] = useState<'catalog' | 'custom' | 'alteration'>('custom');
  // Alterations & Repair: the customer's own garment, the work picked from the
  // chips, and the exact instructions (lengths, areas, repairs).
  const [alterationGarment, setAlterationGarment] = useState('');
  const [alterationTasks, setAlterationTasks] = useState<string[]>([]);
  const [alterationInstructions, setAlterationInstructions] = useState('');
  const isAlteration = orderType === 'alteration';
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');

  // The branch this order belongs to: the one picked in the switcher, or the
  // Main Shop under "All Branches" (where the server files it anyway).
  const { selectedBranchId, branches } = useBranch();
  const orderBranchId = selectedBranchId ?? branches.find(b => b.is_main)?.id ?? null;

  // Fetch the staff who can take this order: that branch's own staff plus
  // anyone with no branch (works across all branches). Staff of other
  // branches, e.g. a branch's manager, never show here.
  useEffect(() => {
    if (!store?.id) return;
    api
      .get(`/stores/${store.id}/staff`, { params: orderBranchId ? { branch_id: orderBranchId, include_floating: 1 } : {} })
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffList(list.filter((s: Staff) => s.is_active !== false));
      })
      .catch((err) => {
        console.warn('Could not load staff directory for job creation:', err);
      });
  }, [store?.id, orderBranchId]);

  // Step 4: Invoice & Payment
  const [itemRate, setItemRate] = useState<string>('');
  // ₱ off the total when the customer brings their own fabric (only counts with that fabric source).
  const [fabricDeduction, setFabricDeductionRaw] = useState('');
  // A total already worked out on step 4 follows the change (e.g. ₱200 → ₱300 takes ₱100 more off).
  const setFabricDeduction = (next: string) => {
    const before = Math.max(0, Number(fabricDeduction) || 0);
    const after = Math.max(0, Number(next) || 0);
    setFabricDeductionRaw(next);
    if (before === after) return;
    setFormData((prev) => {
      const total = parseFloat(prev.total_amount);
      if (!Number.isFinite(total) || prev.total_amount === '') return prev;
      const nextTotal = Math.max(0, total + before - after).toFixed(2);
      return { ...prev, total_amount: nextTotal, downpayment: paymentTerm === 'full' ? nextTotal : prev.downpayment };
    });
  };
  // The line picked from the service's price list ("Pricing options").
  const [pricingId, setPricingId] = useState<number | null>(null);
  const selectedService = services.find((s) => s.id.toString() === formData.service_id);
  const servicePricing = selectedService?.pricing ?? [];
  const selectedPricing = servicePricing.find((p) => p.id === pricingId) ?? null;
  const [paymentTerm, setPaymentTerm] = useState<'full' | 'downpayment'>('downpayment');

  // Sync incoming customer if prefilled from query
  useEffect(() => {
    if (formData.customer_id && customers.length > 0) {
      const match = customers.find((c) => c.id.toString() === formData.customer_id);
      if (match) {
        setCustomerMode('search');
        setFullName(match.name);
        // customerEmail: never prefill the walk-in placeholder login (walkin_…@sutura.com).
        setEmail(customerEmail(match));
        setPhone(match.phone || '');
      }
    }
  }, [formData.customer_id, customers]);

  // Sync unit price from service or catalog item
  useEffect(() => {
    if (servicePackage) {
      // A combo is sold at its bundle price (or, with none, its services' total).
      const sum = (servicePackage.services ?? []).reduce((t, s) => t + (Number(s.base_price) || 0), 0);
      const price = servicePackage.bundle_price ? Number(servicePackage.bundle_price) : sum;
      if (price > 0) setItemRate(String(price));
    } else if (catalogItemId) {
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
  }, [servicePackage, catalogItemId, formData.service_id, catalogItems, services]);

  // The total always follows the price typed on step 4: price × pieces + rush fee
  // − the customer's own fabric. The amount paid now follows it too: the whole
  // total on Full Payment, and never more than the total on a deposit.
  // A repair uses the customer's own garment: no fabric line, so nothing to take off.
  const fabricLessNow = !isAlteration && formData.material_source === 'customer_supplied' ? Math.max(0, Number(fabricDeduction) || 0) : 0;
  useEffect(() => {
    const rate = parseFloat(itemRate) || 0;
    if (rate <= 0) return;
    const qty = isBulkOrder ? Math.max(1, parseInt(formData.quantity, 10) || 1) : 1;
    const rush = formData.is_rush ? parseFloat(formData.rush_fee) || 0 : 0;
    const total = Math.max(0, rate * qty + rush - fabricLessNow).toFixed(2);
    setFormData((prev) => {
      const paid = parseFloat(prev.downpayment) || 0;
      const downpayment = paymentTerm === 'full' ? total : paid > Number(total) ? total : prev.downpayment;
      if (prev.total_amount === total && prev.downpayment === downpayment) return prev;
      return { ...prev, total_amount: total, downpayment };
    });
  }, [itemRate, isBulkOrder, formData.quantity, formData.is_rush, formData.rush_fee, fabricLessNow, paymentTerm, setFormData]);

  // A bulk order is one piece per person on the list.
  const bulkPeopleCount = people.persons.length;
  useEffect(() => {
    if (isBulkOrder && bulkPeopleCount > 0) {
      setFormData((prev) => ({ ...prev, quantity: bulkPeopleCount.toString() }));
    }
  }, [isBulkOrder, bulkPeopleCount, setFormData]);

  // When saved measurement profile is picked
  const handleSelectSavedProfile = (profileId: string) => {
    setSelectedMeasurementProfileId(profileId);
    setFormData((prev) => ({ ...prev, measurement_id: profileId }));
    const profile = customerMeasurements.find((m) => m.id.toString() === profileId);
    if (profile?.metrics) {
      const savedUnit = profile.metrics.unit === 'cm' ? 'cm' : profile.metrics.unit === 'in' ? 'in' : null;
      setMeasurements((prev) => ({ ...EMPTY_BODY_MEASUREMENTS, unit: savedUnit ?? prev.unit, ...measurementsFromMetrics(profile.metrics) }));
      setExtraMeasurements(extraMeasurementsFromMetrics(profile.metrics));
      applyProfileGarment(profile.metrics);
    } else {
      setExtraMeasurements({});
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
          const savedUnit = latest.metrics.unit === 'cm' ? 'cm' : latest.metrics.unit === 'in' ? 'in' : null;
          setMeasurements((prev) => ({ ...prev, ...(savedUnit ? { unit: savedUnit } : {}), ...measurementsFromMetrics(latest.metrics) }));
          setExtraMeasurements(extraMeasurementsFromMetrics(latest.metrics));
          applyProfileGarment(latest.metrics);
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

  // Show the problem and take the person to the field (lib/revealField). The
  // banner is at the top; the button they pressed is at the bottom.
  const stopAt = (message: string, field: string) => {
    setWizardError(message);
    revealField(field);
  };

  const handleStep1Proceed = () => {
    if (!fullName.trim()) return stopAt('Please enter the customer\'s name.', 'job-customer-name');
    setWizardError('');
    setMaxCompletedStep((prev) => Math.max(prev, 1));
    goToStep(2);
  };

  const handleStep2Proceed = () => {
    if (isBulkOrder && people.persons.length === 0) return stopAt('Add at least one person to the list for a bulk order.', 'job-people');
    setWizardError('');
    setMaxCompletedStep((prev) => Math.max(prev, 2));
    goToStep(3);
  };

  const handleStep3Proceed = () => {
    if (!formData.service_id) return stopAt('Please select a Type of Service before proceeding.', 'job-service');
    if (!isAlteration && formData.material_source === 'customer_supplied' && fabricDeduction !== '' && !(Number(fabricDeduction) >= 0)) {
      return stopAt('Enter a valid amount for the customer\'s fabric, or leave it empty.', 'fabric-deduction');
    }
    if (isAlteration && !alterationGarment) return stopAt('Pick the garment the customer brought in to alter or repair.', 'alteration-garment');
    if (isAlteration && !preExistingDamageNotes.trim()) {
      return stopAt('Write down the garment\'s current condition (stains, tears, wear) before intake.', 'alteration-damage');
    }
    setWizardError('');
    setMaxCompletedStep((prev) => Math.max(prev, 3));
    goToStep(4);
  };

  // Step 4 Final Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    // The fabric deduction can't be more than the price itself.
    const fabricLess = !isAlteration && formData.material_source === 'customer_supplied' ? Number(fabricDeduction) || 0 : 0;
    const priceBeforeFabric = (parseFloat(itemRate) || 0) * (isBulkOrder ? Math.max(1, parseInt(formData.quantity, 10) || 1) : 1)
      + (formData.is_rush ? parseFloat(formData.rush_fee) || 0 : 0);
    // A problem on an earlier step: go back to that step, then to the field.
    if (fabricLess > 0 && priceBeforeFabric > 0 && fabricLess > priceBeforeFabric) {
      setCurrentStep(3);
      return stopAt('The fabric / materials deduction is more than the price. Lower it here.', 'fabric-deduction');
    }

    if (!fullName.trim()) {
      setCurrentStep(1);
      return stopAt('Customer name is required.', 'job-customer-name');
    }

    if (!formData.due_date) return stopAt('Please specify a production due date.', 'job-due-date');

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
      // A repair has no style references (the section is hidden for it).
      const combinedImages = Array.from(
        new Set([...(isAlteration ? [] : referenceImages), ...measurementSheets])
      );

      // 4. API Job creation payload
      await api.post(`/stores/${store.id}/jobs`, {
        intake_channel: effectiveIntakeChannel,
        fulfillment_type: 'pickup',
        store_branch_id: orderBranchId ?? undefined,
        customer_id: finalCustomerId,
        service_id: formData.service_id,
        assigned_staff_id: assignedStaffId ? Number(assignedStaffId) : null,
        assigned_to: assignedStaffId ? Number(assignedStaffId) : null,
        measurement_id: formData.measurement_id ? Number(formData.measurement_id) : null,
        // An individual order is one piece for one person; a bulk order is one piece per person.
        quantity: isBulkOrder ? Math.max(1, people.persons.length) : 1,
        total_amount: totalAmt.toFixed(2),
        discount_amount: 0,
        balance: balance.toFixed(2),
        due_date: formData.due_date || null,
        notes: formData.notes,
        custom_order_data: {
          ...customFieldValues,
          // Only the measurements asked for this Garment Type.
          individual_measurements: !isBulkOrder
            ? {
                ...pickMeasurements(measurements, formData.garment_category),
                ...Object.fromEntries(Object.entries(extraMeasurements).filter(([, v]) => v.trim() !== '')),
              }
            : null,
          size_breakdown: isBulkOrder ? bulkSizeBreakdown(people.persons) : null,
          measurement_sheets: measurementSheets.length > 0 ? measurementSheets : null,
          team_name: isBulkOrder ? teamName || null : null,
          // One roster row per person: standard size, or "Custom" with their measurements / to be measured.
          team_roster: isBulkOrder ? people.persons.map((p) => ({
            name: p.name,
            ...(p.gender ? { gender: p.gender } : {}),
            print_name: p.printName,
            number: p.number,
            size: p.method === 'standard' ? p.size : CUSTOM_SIZE,
            ...(p.method === 'shop' ? { measure_at_shop: true } : {}),
            ...(p.method === 'body' ? pickMeasurements(p.values, formData.garment_category) : {}),
          })) : null,
          pre_existing_damage_notes: isAlteration ? preExistingDamageNotes.trim() : null,
          // Plain text, so the order page and work ticket show them as written.
          alteration_garment: isAlteration ? alterationGarment : null,
          alteration_tasks: isAlteration && alterationTasks.length > 0 ? alterationTasks.join(', ') : null,
          alteration_instructions: isAlteration ? alterationInstructions.trim() || null : null,
          item_rate: itemRate || null,
          // Shown on the order and work ticket ("own fabric deduction: ₱200.00").
          own_fabric_deduction: !isAlteration && formData.material_source === 'customer_supplied' && Number(fabricDeduction) > 0
            ? `₱${Number(fabricDeduction).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : null,
          // Same key the customer's own order uses, so the job shows which part was ordered.
          option: selectedPricing ? selectedPricing.label : null,
          payment_term: paymentTerm,
        },
        appointment_id: appointmentId ? Number(appointmentId) : null,
        catalog_item_id: catalogItemId ? Number(catalogItemId) : null,
        service_package_id: servicePackage?.id ?? null,
        reference_images: combinedImages.length > 0 ? combinedImages : null,
        reference_link: isAlteration ? null : referenceLink.trim() || null,
        // A repair is always on the customer's own garment.
        material_source: isAlteration ? 'customer_supplied' : formData.material_source,
        // The order type marks a repair (the Jobs list's Alterations filter
        // reads it); the garment type itself is never overwritten in the form.
        garment_category: isAlteration ? 'alteration_repair' : formData.garment_category || null,
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
          garmentCategory={formData.garment_category}
          setGarmentCategory={(cat) => setFormData((prev) => ({ ...prev, garment_category: cat as typeof prev.garment_category }))}
          measurements={measurements}
          setMeasurements={setMeasurements}
          extraMeasurements={extraMeasurements}
          setExtraMeasurements={setExtraMeasurements}
          customerMeasurements={customerMeasurements}
          selectedMeasurementProfileId={selectedMeasurementProfileId}
          onSelectSavedProfile={handleSelectSavedProfile}
          people={people}
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
          onSelectService={(svcId) => {
            setFormData((prev) => ({ ...prev, service_id: svcId }));
            // A new service starts as "the whole service" again.
            setPricingId(null);
          }}
          garmentCategory={formData.garment_category}
          alterationGarment={alterationGarment}
          setAlterationGarment={setAlterationGarment}
          alterationTasks={alterationTasks}
          onToggleAlterationTask={(task) =>
            setAlterationTasks((prev) => (prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]))
          }
          alterationInstructions={alterationInstructions}
          setAlterationInstructions={setAlterationInstructions}
          fabricSource={formData.material_source}
          setFabricSource={(src) => {
            setFormData((prev) => ({ ...prev, material_source: src }));
            // Shop fabric: nothing to take off.
            if (src !== 'customer_supplied') setFabricDeduction('');
          }}
          fabricDeduction={fabricDeduction}
          setFabricDeduction={setFabricDeduction}
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
          fabricDeduction={fabricLessNow}
          serviceName={selectedService?.name ?? ''}
          wholeServicePrice={selectedService?.base_price != null ? Number(selectedService.base_price) : null}
          pricingOptions={catalogItemId ? [] : servicePricing}
          pricingId={pricingId}
          onSelectPricing={setPricingId}
          paymentTerm={paymentTerm}
          setPaymentTerm={setPaymentTerm}
          isBulkOrder={isBulkOrder}
          submitting={submitting}
          onBack={() => goToStep(3)}
          onSubmit={handleFinalSubmit}
        />
      )}
    </div>
  );
}
