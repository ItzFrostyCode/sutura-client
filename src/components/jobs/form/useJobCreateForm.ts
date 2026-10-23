'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useBranch } from '@/context/BranchContext';
import { serviceHasType } from '@/components/jobs/jobHelpers';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { planPrefill, type PrefillPlan } from './prefillPlan';
import { canonicalGarment, categoryOfGarment, type GarmentCategory } from '@/lib/garmentTaxonomy';
import { designImage, serviceGarments, servicesForGarment } from './jobFormHelpers';
import { defaultColumns } from './rosterHelpers';
import type { GarmentSpecColumn } from '@/components/jobs/jobTypes';
import { useCustomerMeasurements, useJobFormLookups } from './useJobFormLookups';
import { useJobPricing } from './useJobPricing';
import { useJobSubmit } from './useJobSubmit';
import type { ExtraService, JobCreateFormData, RosterMember } from './types';

const blankRow = (): RosterMember => ({ id: `${Date.now()}-${Math.random()}`, player_name: '', print_name: '', number: '', size: '', qty: '1' });

const EMPTY: JobCreateFormData = {
  customer_id: '', service_id: '', measurement_id: '', quantity: '1', price: null, downpayment: '', due_date: null,
  notes: '', is_rush: false, rush_fee: '', material_source: 'store_supplied', garment_type: '',
  discount_mode: 'fixed', discount_value: '', discount_reason: '',
  design_source: null, design_link: '', consultation_notes: '',
};

/** All the state of the Create Job Order form; the pieces on screen only read from it. */
export function useJobCreateForm() {
  const params = useSearchParams();
  const { selectedBranchId } = useBranch();
  const lookups = useJobFormLookups();
  const { store, services, catalogItems } = lookups;

  const [formData, setFormData] = useState<JobCreateFormData>(EMPTY);
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategory | ''>('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [extras, setExtras] = useState<ExtraService[]>([]);
  const [standardSize, setStandardSize] = useState('Custom Measurements');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [bulkChosen, setBulkChosen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [roster, setRoster] = useState<RosterMember[]>([blankRow()]);
  // The team table's columns: the service's own until the owner renames, adds or removes one.
  const [editedColumns, setRosterColumns] = useState<GarmentSpecColumn[] | null>(null);
  const [damageNotes, setDamageNotes] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceLink, setReferenceLink] = useState('');
  const [assignees, setAssignees] = useState<Record<number, string>>({});
  const [appointmentId, setAppointmentId] = useState<string | null>(params.get('appointment_id'));
  // The consultation / booking this order is written up from, as the shop saw it — shown beside the form so nothing it recorded is lost.
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [intakeChannel, setIntakeChannel] = useState<'walk_in' | 'online'>('walk_in');
  const [customerLocked, setCustomerLocked] = useState(!!params.get('customer_id'));

  const [measurementMode, setMeasurementModeState] = useState<import('./types').MeasurementSourceMode>('existing');
  // The branch the order belongs to: the consultation's, else the one chosen at the top of the dashboard.
  const [orderBranchId, setOrderBranchId] = useState<number | null>(null);
  const branchId = orderBranchId ?? selectedBranchId ?? null;
  const [inlineMeasurements, setInlineMeasurements] = useState<import('./types').InlineMeasurementData[]>([
    {
      id: `person-${Date.now()}`,
      profile_name: '',
      measurement_area: 'both',
      metrics: {},
      top_columns: ['Chest', 'Shoulder', 'Sleeve', 'Neck', 'Shirt Length'],
      bottom_columns: ['Waist', 'Hips', 'Inseam', 'Outseam', 'Thigh'],
      notes: '',
      photo_urls: [],
    },
  ]);
  const [activePersonIndex, setActivePersonIndex] = useState(0);

  const activeInlineMeasurement = inlineMeasurements[activePersonIndex] || inlineMeasurements[0];

  const setInlineMeasurement: React.Dispatch<React.SetStateAction<import('./types').InlineMeasurementData>> = (updaterOrVal) => {
    setInlineMeasurements((prev) => {
      const current = prev[activePersonIndex] || prev[0];
      const updated = typeof updaterOrVal === 'function' ? updaterOrVal(current) : updaterOrVal;
      return prev.map((p, idx) => (idx === activePersonIndex ? updated : p));
    });
  };

  const addPersonToMeasure = () => {
    setInlineMeasurements((prev) => [
      ...prev,
      {
        id: `person-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        profile_name: '',
        measurement_area: 'both',
        metrics: {},
        top_columns: ['Chest', 'Shoulder', 'Sleeve', 'Neck', 'Shirt Length'],
        bottom_columns: ['Waist', 'Hips', 'Inseam', 'Outseam', 'Thigh'],
        notes: '',
        photo_urls: [],
      },
    ]);
    setActivePersonIndex(inlineMeasurements.length);
  };

  const removePersonToMeasure = (idx: number) => {
    if (inlineMeasurements.length <= 1) return;
    setInlineMeasurements((prev) => prev.filter((_, i) => i !== idx));
    setActivePersonIndex((prev) => Math.max(0, Math.min(prev, inlineMeasurements.length - 2)));
  };

  const updatePersonMeasurement = (
    idx: number,
    updater: (prev: import('./types').InlineMeasurementData) => import('./types').InlineMeasurementData
  ) => {
    setInlineMeasurements((prev) => prev.map((p, i) => (i === idx ? updater(p) : p)));
  };

  const set = (patch: Partial<JobCreateFormData>) => setFormData((prev) => ({ ...prev, ...patch }));
  const measurements = useCustomerMeasurements(store?.id, formData.customer_id);

  const service = services.find((s) => s.id.toString() === formData.service_id);
  const design = catalogItems.find((c) => c.id.toString() === catalogItemId) ?? null;
  const isRepair = serviceHasType(service, 'alteration_repair');
  const isBulk = serviceHasType(service, 'bulk_sublimation') || bulkChosen;
  const teamPieces = roster.reduce((sum, r) => sum + Math.max(1, Number.parseInt(r.qty ?? '1', 10) || 1), 0);
  const pricing = useJobPricing(formData, service, design, isBulk, teamPieces);
  const rosterColumns = editedColumns ?? defaultColumns(service?.roster_fields);

  // A team order opens with as many empty rows as the service's minimum, so the list is ready to fill in.
  useEffect(() => {
    const min = service?.min_order_qty ?? 0;
    if (isBulk && min > 1) setRoster((cur) => (cur.length >= min || cur.some((r) => r.player_name) ? cur : [...cur, ...Array.from({ length: min - cur.length }, blankRow)]));
  }, [isBulk, service?.id, service?.min_order_qty]);

  // The newest measurement profile is pre-selected (or the one the page was opened with).
  // If customer has no measurements, default to 'record_now' so staff can measure directly.
  // Preference: the one asked for in the link, the one taken at this consultation, one made for this service/design, then the newest.
  useEffect(() => {
    const forThis = (m: (typeof measurements)[number]) => (catalogItemId && String(m.catalog_item_id) === catalogItemId) || (formData.service_id && String(m.service_id) === formData.service_id);
    const best = measurements.find((m) => appointmentId && String(m.appointment_id) === appointmentId) ?? measurements.find(forThis) ?? measurements[0];
    setFormData((prev) => ({ ...prev, measurement_id: params.get('measurement_id') || best?.id.toString() || '' }));
  }, [measurements, params, appointmentId, catalogItemId, formData.service_id]);

  // Measuring starts as "now" for someone at the counter, "later" or the booked size for a consultation; saved measurements lead only
  // when one already fits. It is set again only when the measurements load, never after the person has chosen themselves.
  const planMode = useRef<'standard_size' | 'none' | null>(null);
  const userMode = useRef(false);
  const matchesConsultation = measurements.some((m) => appointmentId && String(m.appointment_id) === appointmentId);
  const hasMatchingMeasurement = matchesConsultation || measurements.some((m) => (catalogItemId && String(m.catalog_item_id) === catalogItemId) || (formData.service_id && String(m.service_id) === formData.service_id));
  useEffect(() => {
    if (userMode.current) return;
    if (appointmentId) setMeasurementModeState(matchesConsultation ? 'existing' : planMode.current ?? 'none');
    else setMeasurementModeState(hasMatchingMeasurement ? 'existing' : 'record_now');
  }, [hasMatchingMeasurement, matchesConsultation, appointmentId]);
  const setMeasurementMode = (mode: import('./types').MeasurementSourceMode) => { userMode.current = true; setMeasurementModeState(mode); };

  const pickService = (id: string) => {
    const picked = services.find((s) => s.id.toString() === id);
    set({ service_id: id, price: null, due_date: null });
    // A different service has its own designs: the design picked for the earlier one no longer applies.
    if (design && String(design.service_id) !== id) setCatalogItemId('');
    // A service that works on one garment names it (editable under Garment).
    const only = picked ? serviceGarments(picked) : null;
    if (only && only.length === 1 && !formData.garment_type) { set({ garment_type: only[0] }); setGarmentCategory(categoryOfGarment(only[0]) ?? ''); }
    setCustomFieldValues({});
    setBulkChosen(serviceHasType(picked, 'bulk_sublimation'));
  };

  const pickGarment = (garment: string, category: GarmentCategory | '' = categoryOfGarment(garment) ?? garmentCategory) => {
    setGarmentCategory(category);
    set({ garment_type: garment });
    if (design && canonicalGarment(design.garment_type) !== canonicalGarment(garment)) setCatalogItemId('');
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

  // Opened from an appointment, a customer, or a design: the form is filled ONCE, from one plan (see prefillPlan.ts). Nothing
  // else fills it afterwards, so a later step can never undo an earlier one.
  const prefilled = useRef(false);
  const bookedPlan = useRef<PrefillPlan | null>(null);
  const applyPlan = (plan: PrefillPlan, only?: 'booking') => {
    setFormData((prev) => ({
      ...prev, service_id: plan.serviceId, price: null, due_date: null, garment_type: plan.garment,
      ...(only ? {} : {
        customer_id: plan.customerId, quantity: plan.quantity, notes: plan.notes, consultation_notes: plan.consultationNotes,
        design_source: plan.designSource, design_link: plan.designLink,
        ...(plan.materialSource ? { material_source: plan.materialSource } : {}),
      }),
    }));
    setCatalogItemId(plan.designId);
    setGarmentCategory(plan.garmentCategory);
    setCustomFieldValues(plan.answers);
    setBulkChosen(plan.group);
    if (plan.group) setRoster((cur) => (cur.some((r) => r.player_name) ? cur : plan.rowPieces.map((n) => ({ ...blankRow(), qty: String(n) }))));
    if (only) return;
    if (plan.standardSize) setStandardSize(plan.standardSize);
    setReferenceImages(plan.images);
    setReferenceLink(plan.referenceLink);
    setIntakeChannel(plan.intake);
    setOrderBranchId(plan.branchId);
    if (plan.measurementMode) { planMode.current = plan.measurementMode; setMeasurementModeState(plan.measurementMode); }
  };
  /** Puts back the service, design, answers and group the booking chose (not what was typed since). */
  const restoreBooked = () => { if (bookedPlan.current) applyPlan(bookedPlan.current, 'booking'); };
  const changedFromBooking = !!bookedPlan.current && (bookedPlan.current.serviceId !== formData.service_id || bookedPlan.current.designId !== catalogItemId);

  useEffect(() => {
    if (lookups.loading || prefilled.current) return;
    const aptId = params.get('appointment_id');
    const run = (apt: Appointment | null) => {
      prefilled.current = true;
      const plan = planPrefill({ params, apt, services, catalogItems });
      if (apt) { setAppointment(apt); bookedPlan.current = plan; }
      applyPlan(plan);
    };
    if (!aptId || !store) return run(null);
    const customerParam = params.get('customer_id');
    api.get(`/stores/${store.id}/appointments`, { params: customerParam ? { customer_id: customerParam } : undefined })
      .then((res) => run((res.data.data || []).find((a: { id: number }) => a.id === Number(aptId)) ?? null))
      .catch(() => run(null)); // the consultation only pre-fills; the form works without it
  }, [lookups.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const submission = {
    storeId: store?.id ?? 0, branchId, formData, pricing, service, intakeChannel, appointmentId,
    catalogItemId, standardSize, customFieldValues, isBulk, teamName, roster, rosterColumns, damageNotes, referenceImages, referenceLink, assignees,
    measurementMode, inlineMeasurement: activeInlineMeasurement,
    inlineMeasurements, extras, followUpOfId: params.get('follow_up_of'), defaultUnit: store?.default_measurement_unit === 'cm' ? 'cm' as const : 'in' as const,
  };

  const { submitting, error, below, handleSubmit, continueAnyway } = useJobSubmit({ storeId: store?.id, submission, appointment });

  return {
    ...lookups, formData, set, measurements, service, design, isRepair, isBulk, pricing, garmentCategory, setGarmentCategory,
    appointment, pickGarment, pickService, pickDesign, setCatalogItemId, standardSize, setStandardSize, customFieldValues, setCustomFieldValues,
    bulkChosen, setBulkChosen, teamName, setTeamName, roster, setRoster, rosterColumns, setRosterColumns, blankRow, damageNotes, setDamageNotes, referenceImages,
    setReferenceImages, referenceLink, setReferenceLink, assignees, setAssignees, appointmentId, setAppointmentId, intakeChannel,
    customerLocked, setCustomerLocked, submitting, error, below, handleSubmit, continueAnyway, formError: lookups.error,
    measurementMode, setMeasurementMode, branchId, restoreBooked, changedFromBooking, extras, setExtras,
    inlineMeasurement: activeInlineMeasurement, setInlineMeasurement,
    inlineMeasurements, setInlineMeasurements,
    activePersonIndex, setActivePersonIndex,
    addPersonToMeasure, removePersonToMeasure, updatePersonMeasurement,
  };
}

export type JobCreateForm = ReturnType<typeof useJobCreateForm>;
