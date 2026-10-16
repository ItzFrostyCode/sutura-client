'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useBranch } from '@/context/BranchContext';
import { useToast } from '@/context/ToastContext';
import { serviceHasType } from '@/components/jobs/jobHelpers';
import { canonicalGarment, categoryOfGarment, type GarmentCategory } from '@/lib/garmentTaxonomy';
import { designImage, servicesForGarment } from './jobFormHelpers';
import { useCustomerMeasurements, useJobFormLookups } from './useJobFormLookups';
import { useJobPricing } from './useJobPricing';
import { jobProblem, submitJobOrder } from './submitJobOrder';
import type { JobCreateFormData, RosterMember } from './types';

const blankRow = (): RosterMember => ({ id: `${Date.now()}-${Math.random()}`, name: '', print_name: '', number: '', size: 'M' });

const EMPTY: JobCreateFormData = {
  customer_id: '', service_id: '', measurement_id: '', quantity: '1', price: null, downpayment: '', due_date: null,
  notes: '', is_rush: false, rush_fee: '', material_source: 'store_supplied', garment_type: '',
  discount_mode: 'fixed', discount_value: '', discount_reason: '',
};

/** All the state of the Create Job Order form; the pieces on screen only read from it. */
export function useJobCreateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { selectedBranchId } = useBranch();
  const lookups = useJobFormLookups();
  const { store, services, catalogItems } = lookups;

  const [formData, setFormData] = useState<JobCreateFormData>(EMPTY);
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategory | ''>('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [standardSize, setStandardSize] = useState('Custom Measurements');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [bulkChosen, setBulkChosen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [roster, setRoster] = useState<RosterMember[]>([blankRow()]);
  const [damageNotes, setDamageNotes] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceLink, setReferenceLink] = useState('');
  const [assignees, setAssignees] = useState<Record<number, string>>({});
  const [appointmentId, setAppointmentId] = useState<string | null>(params.get('appointment_id'));
  const [intakeChannel, setIntakeChannel] = useState<'walk_in' | 'online'>('walk_in');
  const [customerLocked, setCustomerLocked] = useState(!!params.get('customer_id'));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<JobCreateFormData>) => setFormData((prev) => ({ ...prev, ...patch }));
  const measurements = useCustomerMeasurements(store?.id, formData.customer_id);

  const service = services.find((s) => s.id.toString() === formData.service_id);
  const design = catalogItems.find((c) => c.id.toString() === catalogItemId) ?? null;
  const isRepair = serviceHasType(service, 'alteration_repair');
  const isBulk = serviceHasType(service, 'bulk_sublimation') || bulkChosen;
  const pricing = useJobPricing(formData, service, design, isBulk);

  // The newest measurement profile is pre-selected (or the one the page was opened with).
  useEffect(() => {
    setFormData((prev) => ({ ...prev, measurement_id: params.get('measurement_id') || measurements[0]?.id.toString() || '' }));
  }, [measurements, params]);

  const pickService = (id: string) => {
    const picked = services.find((s) => s.id.toString() === id);
    set({ service_id: id, price: null, due_date: null });
    setCustomFieldValues({});
    setBulkChosen(serviceHasType(picked, 'bulk_sublimation'));
  };

  const pickGarment = (garment: string, category: GarmentCategory | '' = categoryOfGarment(garment) ?? garmentCategory) => {
    setGarmentCategory(category);
    set({ garment_type: garment });
    if (design && canonicalGarment(design.garment_type) !== canonicalGarment(garment)) setCatalogItemId('');
    const fits = servicesForGarment(services, garment, category);
    // A service that cannot do this garment is dropped; when only one can, it is picked — no need to ask.
    if (formData.service_id && !fits.some((s) => s.id.toString() === formData.service_id)) pickService('');
    if (fits.length === 1 && fits[0].id.toString() !== formData.service_id) pickService(fits[0].id.toString());
  };

  const pickDesign = (id: string) => {
    const picked = catalogItems.find((c) => c.id.toString() === id);
    setCatalogItemId(id);
    if (!picked) return;
    const garment = canonicalGarment(picked.garment_type) ?? picked.garment_type ?? '';
    setGarmentCategory(categoryOfGarment(garment) ?? (garment ? 'other' : ''));
    const image = designImage(picked);
    if (image) setReferenceImages((prev) => (prev.length === 0 ? [image] : prev));
    const serviceId = picked.service_id != null ? String(picked.service_id) : servicesForGarment(services, garment, '')[0]?.id.toString() ?? '';
    if (serviceId && serviceId !== formData.service_id) pickService(serviceId);
    set({ garment_type: garment, price: null, due_date: null });
  };

  // Opened from an appointment, a customer, or a design: fill what that page already knows, once the lists are in.
  const prefilled = useRef(false);
  useEffect(() => {
    if (lookups.loading || prefilled.current) return;
    prefilled.current = true;
    set({ customer_id: params.get('customer_id') || '', notes: params.get('notes') || '' });
    if (params.get('service_id')) pickService(params.get('service_id')!);
    if (params.get('catalog_item_id')) pickDesign(params.get('catalog_item_id')!);
    const aptId = params.get('appointment_id');
    if (!aptId || !store) return;
    api.get(`/stores/${store.id}/appointments`).then((res) => {
      const apt = (res.data.data || []).find((a: { id: number }) => a.id === Number(aptId));
      if (!apt) return;
      if (apt.reference_images?.length) setReferenceImages(apt.reference_images);
      if (apt.reference_link) setReferenceLink(apt.reference_link);
      setIntakeChannel(apt.intake_channel === 'online' ? 'online' : 'walk_in');
      // What the customer already answered on the service's questions when booking.
      const given = Object.entries((apt.answers ?? {}) as Record<string, unknown>).filter(([, v]) => typeof v === 'string' && v.trim() !== '');
      if (given.length) setCustomFieldValues((prev) => ({ ...Object.fromEntries(given as [string, string][]), ...prev }));
    }).catch(() => { /* the appointment only pre-fills; the form works without it */ });
  }, [lookups.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const submission = {
    storeId: store?.id ?? 0, branchId: selectedBranchId ?? null, formData, pricing, service, intakeChannel, appointmentId,
    catalogItemId, standardSize, customFieldValues, isBulk, teamName, roster, damageNotes, referenceImages, referenceLink, assignees,
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!store) return;
    const problem = jobProblem(submission);
    if (problem) return setError(problem);
    setSubmitting(true);
    setError('');
    try {
      const id = await submitJobOrder(submission, () => toast.error('The order was created, but its staff could not be saved. Assign them from Order Steps.'));
      // Land on the new order (its Order Steps tab) so the next step is right there.
      router.push(id ? `/dashboard/jobs/${id}` : '/dashboard/jobs');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create job order.'));
      setSubmitting(false);
    }
  };

  return {
    ...lookups, formData, set, measurements, service, design, isRepair, isBulk, pricing, garmentCategory, setGarmentCategory,
    pickGarment, pickService, pickDesign, setCatalogItemId, standardSize, setStandardSize, customFieldValues, setCustomFieldValues,
    bulkChosen, setBulkChosen, teamName, setTeamName, roster, setRoster, blankRow, damageNotes, setDamageNotes, referenceImages,
    setReferenceImages, referenceLink, setReferenceLink, assignees, setAssignees, appointmentId, setAppointmentId, intakeChannel,
    customerLocked, setCustomerLocked, submitting, error, handleSubmit, formError: lookups.error,
  };
}

export type JobCreateForm = ReturnType<typeof useJobCreateForm>;
