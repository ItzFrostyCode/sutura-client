'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranch } from '@/context/BranchContext';
import { FileText } from 'lucide-react';
import { SERVICE_TYPE_META } from '@/components/services/serviceHelpers';
import { CatalogItem } from '@/components/catalog/catalogHelpers';
import {
  CustomerData,
  ServiceData,
  ServiceField,
  StaffData,
  CustomerMeasurement,
  RosterMember,
  JobCreateFormData,
} from './types';

function sanitizeServiceCustomFields(servicesRaw: unknown[]): ServiceData[] {
  return servicesRaw.map((s) => {
    const serviceObj = s as Record<string, unknown>;
    const customFieldsRaw = Array.isArray(serviceObj.custom_fields) ? serviceObj.custom_fields : [];
    const sanitizedFields = customFieldsRaw.map((f) => {
      const fieldObj = f as Record<string, unknown>;
      const fieldType = String(fieldObj.type || 'text');
      const resolvedType = fieldType === 'dropdown' ? 'select' : (fieldType === 'short_text' ? 'text' : fieldType);
      return {
        id: String(fieldObj.id || fieldObj.name || Math.random().toString(36).substring(2, 11)),
        label: String(fieldObj.label || ''),
        type: resolvedType as 'text' | 'number' | 'select' | 'radio' | 'checkbox',
        required: Boolean(fieldObj.required),
        options: Array.isArray(fieldObj.options) ? fieldObj.options.map(String) : [],
      };
    });
    return {
      ...serviceObj,
      id: Number(serviceObj.id),
      name: String(serviceObj.name || ''),
      category: typeof serviceObj.category === 'string' ? serviceObj.category : undefined,
      base_price: serviceObj.base_price !== null && serviceObj.base_price !== undefined ? String(serviceObj.base_price) : undefined,
      custom_fields: sanitizedFields,
      tags: Array.isArray(serviceObj.tags) ? serviceObj.tags : [],
    } as ServiceData;
  });
}

function matchServiceForCatalogItem(
  picked: CatalogItem,
  serviceList: ServiceData[]
): ServiceData | undefined {
  if (!picked || !serviceList.length) return undefined;

  const anyPicked = picked as unknown as { service_id?: number | string };
  if (anyPicked.service_id) {
    const direct = serviceList.find((s) => s.id.toString() === anyPicked.service_id?.toString());
    if (direct) return direct;
  }

  const garment = (picked.category || picked.garment_type || '').toLowerCase();
  if (garment) {
    const byCategory = serviceList.find((s) => {
      const sCat = (s.category || '').toLowerCase();
      const sType = (s.service_type || '').toLowerCase();
      const sCats = ((s as { categories?: string[] }).categories || []).map((c: string) => c.toLowerCase());
      return sCat === garment || sType === garment || sCats.includes(garment);
    });
    if (byCategory) return byCategory;
  }

  const itemName = picked.name.toLowerCase();
  const keywords = ['barong', 'gown', 'suit', 'filipiniana', 'uniform', 'dress', 'blazer', 'alteration', 'repair'];
  for (const kw of keywords) {
    if (itemName.includes(kw) || garment.includes(kw)) {
      const byKw = serviceList.find((s) => s.name.toLowerCase().includes(kw));
      if (byKw) return byKw;
    }
  }

  return serviceList.find((s) => s.service_type === 'custom_tailoring') || serviceList[0];
}

export function useJobCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { store, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogItemId, setCatalogItemId] = useState('');
  const [standardSize, setStandardSize] = useState<string>('Custom Measurements');

  const [customerMeasurements, setCustomerMeasurements] = useState<CustomerMeasurement[]>([]);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [linkedAppointmentChannel, setLinkedAppointmentChannel] = useState<'walk_in' | 'online' | null>(null);
  const effectiveIntakeChannel: 'walk_in' | 'online' = appointmentId ? (linkedAppointmentChannel ?? 'walk_in') : 'walk_in';
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceLink, setReferenceLink] = useState('');
  const [uploadingReference, setUploadingReference] = useState(false);
  const [customerLocked, setCustomerLocked] = useState(false);
  const [isTotalAmountCustom, setIsTotalAmountCustom] = useState(false);
  const [isDueDateCustom, setIsDueDateCustom] = useState(false);

  // Bulk Team Roster State
  const [isBulkOrder, setIsBulkOrder] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [roster, setRoster] = useState<RosterMember[]>([
    { id: 'roster-0', name: '', print_name: '', number: '', size: 'M' }
  ]);

  // Alteration/Repair pre-existing damage notes
  const [preExistingDamageNotes, setPreExistingDamageNotes] = useState('');

  const [formData, setFormData] = useState<JobCreateFormData>({
    customer_id: '',
    service_id: '',
    measurement_id: '',
    total_amount: '',
    downpayment: '',
    due_date: '',
    notes: '',
    po_number: '',
    is_outsourced: false,
    partner_store_name: '',
    outsourcing_cost: '',
    is_rush: false,
    rush_fee: '',
    material_source: 'store_supplied',
    garment_category: '',
    discount_amount: '0',
    discount_reason: '',
  });

  const [staffStageAssignments, setStaffStageAssignments] = useState<Record<string, string>>({
    design: '', pattern_making: '', cutting: '', sewing: '', qc_ironing: '',
  });
  const [showOutsourcingHelp, setShowOutsourcingHelp] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const handleCheckboxChange = (
    fieldLabel: string,
    opt: string,
    selected: string[],
    checked: boolean
  ) => {
    let nextSelected = [...selected];
    if (checked) {
      if (!nextSelected.includes(opt)) {
        nextSelected.push(opt);
      }
    } else {
      nextSelected = nextSelected.filter((s) => s !== opt);
    }
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldLabel]: nextSelected.join(', '),
    }));
  };

  useEffect(() => {
    if (store) {
      Promise.all([
        api.get(`/stores/${store.id}/customers`),
        api.get(`/stores/${store.id}/services`),
        api.get(`/stores/${store.id}/staff`),
        api.get(`/stores/${store.id}/catalog`),
      ])
        .then(([resCustomers, resServices, resStaff, resCatalog]) => {
          const custs = Array.isArray(resCustomers.data?.data) ? resCustomers.data.data : [];
          const servs = sanitizeServiceCustomFields(Array.isArray(resServices.data?.data) ? resServices.data.data : []);
          const rawStaff = resStaff.data?.data;
          const staffList: StaffData[] = Array.isArray(rawStaff)
            ? rawStaff
            : (rawStaff && typeof rawStaff === 'object' ? Object.values(rawStaff) : []);
          const catItems = Array.isArray(resCatalog.data?.data) ? resCatalog.data.data : [];
          setCustomers(custs);
          setServices(servs);
          setStaff(staffList);
          setCatalogItems(catItems);

          // Prefill from query params
          const qCust = searchParams.get('customer_id') || '';
          const qServ = searchParams.get('service_id') || '';
          const qNotes = searchParams.get('notes') || '';
          const qAptId = searchParams.get('appointment_id') || '';
          const qCatId = searchParams.get('catalog_item_id') || '';

          setAppointmentId(qAptId || null);
          setCustomerLocked(!!qCust);

          if (qCatId) {
            const picked = catItems.find((c: CatalogItem) => c.id.toString() === qCatId);
            if (picked) {
              setCatalogItemId(qCatId);
              const pickedImage =
                picked.images?.find((img: { is_primary?: boolean | number; image_url: string }) => Boolean(img.is_primary))?.image_url ||
                picked.images?.[0]?.image_url ||
                picked.fabric_image_url;
              if (pickedImage) {
                setReferenceImages([pickedImage]);
              }
              const matchedService = matchServiceForCatalogItem(picked, servs);
              setFormData((prev) => ({
                ...prev,
                service_id: prev.service_id || (matchedService ? matchedService.id.toString() : prev.service_id),
                total_amount: Number(picked.price) > 0 ? String(picked.price) : prev.total_amount,
                garment_category: (picked.category as typeof prev.garment_category) || prev.garment_category,
                due_date: picked.estimated_days
                  ? (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + picked.estimated_days);
                      return d.toISOString().split('T')[0];
                    })()
                  : prev.due_date,
              }));
              if (matchedService) {
                const fields = matchedService.custom_fields || [];
                const initialValues: Record<string, string> = {};
                fields.forEach((f) => {
                  initialValues[f.label] = '';
                });
                setCustomFieldValues((prev) => ({ ...initialValues, ...prev }));
                const name = matchedService.name.toLowerCase();
                const looksBulk =
                  name.includes('jersey') ||
                  name.includes('sublimation') ||
                  name.includes('uniform') ||
                  name.includes('esports');
                if (matchedService.service_type === 'bulk_sublimation' || looksBulk) {
                  setIsBulkOrder(true);
                }
              }
            }
          }

          if (qAptId && store) {
            api.get(`/stores/${store.id}/appointments`)
              .then(res => {
                const apt = (res.data.data || []).find((a: { id: number }) => a.id === Number(qAptId));
                if (apt?.reference_images?.length) setReferenceImages(apt.reference_images);
                if (apt?.reference_link) setReferenceLink(apt.reference_link);
                setLinkedAppointmentChannel(apt?.intake_channel === 'online' ? 'online' : 'walk_in');
                if (apt?.garment_category) {
                  setFormData(prev => ({ ...prev, garment_category: apt.garment_category }));
                }
              })
              .catch(() => { /* non-critical preview */ });
          }

          setFormData((prev) => ({
            ...prev,
            customer_id: qCust,
            service_id: qServ,
            notes: qNotes,
          }));

          if (qServ) {
            const selectedService = servs.find(
              (s: ServiceData) => s.id.toString() === qServ
            );
            const fields = selectedService?.custom_fields || [];
            const initialValues: Record<string, string> = {};
            fields.forEach((f: ServiceField) => {
              initialValues[f.label] = '';
            });
            setCustomFieldValues(initialValues);
          }

          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load data.');
          setLoading(false);
        });
    } else if (user && !store) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [store, user, searchParams]);

  // Load customer measurements when customer is selected
  useEffect(() => {
    if (store && formData.customer_id) {
      api
        .get(`/stores/${store.id}/measurements?customer_id=${formData.customer_id}`)
        .then((res) => {
          const measurements = (res.data.data || []).filter(
            (m: CustomerMeasurement) => !m.superseded_at
          );
          setCustomerMeasurements(measurements);

          const mostRecent = [...measurements].sort(
            (a: CustomerMeasurement, b: CustomerMeasurement) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0];

          const qMeas = searchParams.get('measurement_id') || '';
          setFormData((prev) => ({
            ...prev,
            measurement_id: qMeas || (mostRecent?.id?.toString() || ''),
          }));
        })
        .catch((err) => {
          console.error('Failed to load customer measurements', err);
        });
    } else {
      const timer = setTimeout(() => {
        setCustomerMeasurements([]);
        setFormData((prev) => ({ ...prev, measurement_id: '' }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [store, formData.customer_id, searchParams]);

  // Auto-calculate suggested total price based on service base price and rush fee
  useEffect(() => {
    if (!isTotalAmountCustom && formData.service_id) {
      const selected = services.find((s) => s.id.toString() === formData.service_id);
      if (selected) {
        const basePrice = Number.parseFloat(selected.base_price?.toString() || '0');
        const rushFee = formData.is_rush ? (Number.parseFloat(formData.rush_fee) || 0) : 0;
        const suggested = basePrice + rushFee;
        Promise.resolve().then(() => {
          setFormData((prev) => ({
            ...prev,
            total_amount: suggested > 0 ? suggested.toFixed(2) : '',
          }));
        });
      }
    }
  }, [formData.service_id, formData.is_rush, formData.rush_fee, services, isTotalAmountCustom]);

  // Auto-suggest a due date from turnaround
  useEffect(() => {
    if (!isDueDateCustom && !formData.is_rush && formData.service_id) {
      const selected = services.find((s) => s.id.toString() === formData.service_id);
      if (selected?.estimated_days) {
        const suggested = new Date();
        suggested.setDate(suggested.getDate() + selected.estimated_days);
        setFormData((prev) => ({
          ...prev,
          due_date: suggested.toISOString().split('T')[0],
        }));
      }
    }
  }, [formData.service_id, formData.is_rush, services, isDueDateCustom]);

  const handleSelectCatalogItem = (id: string) => {
    setCatalogItemId(id);
    if (!id) return;
    const picked = catalogItems.find((c) => c.id.toString() === id);
    if (picked) {
      const pickedImage =
        picked.images?.find((img: { is_primary?: boolean | number; image_url: string }) => Boolean(img.is_primary))?.image_url ||
        picked.images?.[0]?.image_url ||
        picked.fabric_image_url;
      if (pickedImage) {
        setReferenceImages((prev) => (prev.length === 0 ? [pickedImage] : prev));
      }
      const matchedService = matchServiceForCatalogItem(picked, services);
      setFormData((prev) => ({
        ...prev,
        service_id: matchedService ? matchedService.id.toString() : prev.service_id,
        total_amount:
          (!isTotalAmountCustom || !prev.total_amount) && Number(picked.price) > 0
            ? String(picked.price)
            : prev.total_amount,
        garment_category: (picked.category as typeof prev.garment_category) || prev.garment_category,
        due_date:
          (!isDueDateCustom || !prev.due_date) && picked.estimated_days
            ? (() => {
                const d = new Date();
                d.setDate(d.getDate() + picked.estimated_days);
                return d.toISOString().split('T')[0];
              })()
            : prev.due_date,
      }));
      if (matchedService) {
        const fields = matchedService.custom_fields || [];
        const initialValues: Record<string, string> = {};
        fields.forEach((f) => {
          initialValues[f.label] = '';
        });
        setCustomFieldValues(initialValues);
        const name = matchedService.name.toLowerCase();
        const looksBulk =
          name.includes('jersey') ||
          name.includes('sublimation') ||
          name.includes('uniform') ||
          name.includes('esports');
        if (matchedService.service_type === 'bulk_sublimation' || looksBulk) {
          setIsBulkOrder(true);
        }
      }
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!store) return;

    setSubmitting(true);
    setError('');

    const totalAmt = Number.parseFloat(formData.total_amount) || 0;
    const downPay = Number.parseFloat(formData.downpayment || '0');
    const rushFee = formData.is_rush ? (Number.parseFloat(formData.rush_fee) || 0) : 0;

    if (formData.is_rush && totalAmt < rushFee) {
      setError(`Total Amount must be greater than or equal to the Rush Fee (₱${rushFee.toFixed(2)}).`);
      setSubmitting(false);
      return;
    }

    const appliedDownPay = Math.min(downPay, totalAmt);
    const selectedForSubmit = services.find((s) => s.id.toString() === formData.service_id);

    if (isBulkOrder && selectedForSubmit?.min_order_qty && roster.length < selectedForSubmit.min_order_qty) {
      setError(`This service requires a minimum of ${selectedForSubmit.min_order_qty} pieces — the roster currently has ${roster.length}.`);
      setSubmitting(false);
      return;
    }

    const isAlterationJob = selectedForSubmit?.service_type === 'alteration_repair' || formData.garment_category === 'alteration_repair';
    if (isAlterationJob && !preExistingDamageNotes.trim()) {
      setError('Please log the garment\'s pre-existing condition before creating an alteration/repair job.');
      setSubmitting(false);
      return;
    }

    const balance = totalAmt - appliedDownPay;

    try {
      const assignedStages = Object.entries(staffStageAssignments).filter(([, userId]) => userId);
      await api.post(`/stores/${store.id}/jobs`, {
        intake_channel: effectiveIntakeChannel,
        fulfillment_type: 'pickup',
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        store_branch_id: assignedStages.length === 0 ? (selectedBranchId ?? undefined) : undefined,
        staff_stages: assignedStages.map(([stage, userId]) => ({ stage, user_id: Number(userId) })),
        measurement_id: formData.measurement_id ? Number(formData.measurement_id) : null,
        total_amount: formData.total_amount,
        discount_amount: formData.discount_amount ? Number.parseFloat(formData.discount_amount) : 0,
        balance: balance,
        due_date: formData.due_date || null,
        notes: formData.notes,
        custom_order_data: {
          ...customFieldValues,
          standard_size: standardSize && standardSize !== 'Custom Measurements' ? standardSize : null,
          po_number: formData.po_number || null,
          discount_reason: formData.discount_reason || null,
          team_name: teamName || null,
          team_roster: isBulkOrder
            ? roster.map(({ name, print_name, number, size }) => ({ name, print_name, number, size }))
            : null,
          pre_existing_damage_notes: isAlterationJob
            ? preExistingDamageNotes.trim()
            : null,
        },
        is_outsourced: formData.is_outsourced,
        partner_store_name: formData.is_outsourced ? formData.partner_store_name : null,
        outsourcing_cost: formData.is_outsourced && formData.outsourcing_cost ? Number.parseFloat(formData.outsourcing_cost) : null,
        appointment_id: appointmentId ? Number(appointmentId) : null,
        catalog_item_id: catalogItemId ? Number(catalogItemId) : null,
        reference_images: referenceImages.length > 0 ? referenceImages : null,
        reference_link: referenceLink.trim() || null,
        material_source: formData.material_source,
        garment_category: formData.garment_category || null,
        is_rush: formData.is_rush,
        rush_fee: formData.is_rush ? Number(formData.rush_fee) : 0,
      });
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Failed to create job order.');
      setSubmitting(false);
    }
  };

  const selectedService = services.find(
    (s) => s.id.toString() === formData.service_id
  );
  const isSelectedAlterationRepair = selectedService?.service_type === 'alteration_repair' || formData.garment_category === 'alteration_repair';
  const isCustomTailoring = !isSelectedAlterationRepair;
  const sectionTwoMeta = selectedService?.service_type
    ? SERVICE_TYPE_META[selectedService.service_type]
    : { icon: FileText, bg: 'bg-sunken', border: 'border-line', text: 'text-ink-faint' };

  return {
    store,
    user,
    loading,
    submitting,
    error,
    setError,
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
    selectedCatalogItem: catalogItems.find((c) => c.id.toString() === catalogItemId) || null,
    isSelectedAlterationRepair,
    isCustomTailoring,
    sectionTwoMeta,
  };
}
