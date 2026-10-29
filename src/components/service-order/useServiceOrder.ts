'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { PublicService, StoreBranch, StoreProfile } from '@/components/store-storefront/types';

export interface SavedMeasurement {
  id: number;
  profile_name: string;
  version: number;
  superseded_at?: string | null;
  updated_at?: string;
  /** What the profile holds; `_area` says whether it is a top, a bottom or both. */
  metrics?: Record<string, string | undefined>;
  store?: { slug: string } | null;
}

export interface PlacedOrder {
  id: number;
  order_number: string;
  tracking_code: string;
}

export type MaterialChoice = 'own' | 'shop' | '';
export type OrderMode = 'individual' | 'bulk';
/** How the shop gets the sizes: saved profile, a standard size, the customer's own numbers, or the shop measures. */
export type MeasurementSource = 'saved' | 'standard' | 'own' | 'shop';
/** What is ordered: the top, the bottom, or both. Asked first whenever the service needs sizing. */
export type OrderArea = '' | 'top' | 'bottom' | 'both';

/** The measuring fields of each part (the server keeps only the covered part's). */
export const TOP_FIELDS = ['chest', 'shoulders', 'sleeve', 'neck', 'length'] as const;
export const BOTTOM_FIELDS = ['waist', 'hips', 'inseam'] as const;
export const fieldsOf = (area: OrderArea): readonly string[] => (area === 'top' ? TOP_FIELDS : area === 'bottom' ? BOTTOM_FIELDS : area === 'both' ? [...TOP_FIELDS, ...BOTTOM_FIELDS] : []);
export type PaymentTerm = 'full' | 'downpayment';

/** The customer's effective payment policy for a store service (server-resolved,
 *  trusted-customer waiver included). The trust flag itself never leaves the API. */
export interface CustomerPaymentPolicy {
  payment_policy: 'none' | 'full' | 'deposit' | 'custom';
  payment_policy_percent: number;
}

// Same fields as the walk-in wizard's Individual Order measurements.
export interface IndividualMeasurements {
  unit: 'in' | 'cm';
  chest: string;
  waist: string;
  hips: string;
  shoulders: string;
  length: string;
  neck: string;
  sleeve: string;
  inseam: string;
}

export const BULK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;
const MAX_PHOTOS = 5;
const EMPTY_MEASUREMENTS: IndividualMeasurements = {
  unit: 'in', chest: '', waist: '', hips: '', shoulders: '', length: '', neck: '', sleeve: '', inseam: '',
};

// Customer-side "Online Order" for one service. Follows the shop's walk-in
// wizard step for step — Customer Information → Measurements → Order
// Specifications → Invoice & Payment — and is submitted to
// POST /stores/{slug}/service-orders as a pending online job order.
export function useServiceOrder(storeId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id');
  const { user, hydrated } = useAuthStore();

  // Same rule as the booking wizard: sign in before filling anything out.
  useEffect(() => {
    if (!hydrated || user) return;
    const query = searchParams.toString();
    const redirectTarget = `${pathname}${query ? `?${query}` : ''}`;
    if (typeof window !== 'undefined' && window.innerWidth >= 600 && serviceId) {
      router.replace(`/store/${storeId}/service/${serviceId}?signin=1&redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }
    router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }, [hydrated, user, pathname, searchParams, router, storeId, serviceId]);

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [service, setService] = useState<PublicService | null>(null);
  const [savedMeasurements, setSavedMeasurements] = useState<SavedMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // 1 · Customer Information
  const [contactPhone, setContactPhone] = useState('');
  const [branchId, setBranchId] = useState<number | null>(null);

  // 2 · Measurements
  const [orderMode, setOrderMode] = useState<OrderMode>('individual');
  // Who will wear it, when that is not the customer: their measurements are kept apart from the customer's own.
  const [wearerName, setWearerName] = useState('');
  const [measurementSource, setMeasurementSource] = useState<MeasurementSource>('shop');
  const [measurementId, setMeasurementId] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<IndividualMeasurements>(EMPTY_MEASUREMENTS);
  // Asked first when the service needs sizing: what is ordered decides every size and measuring field after it.
  const [areaChoice, setAreaState] = useState<OrderArea>('');
  const [sizeBreakdown, setSizeBreakdown] = useState<Record<string, string>>({});
  const [sizeBreakdownBottom, setSizeBreakdownBottom] = useState<Record<string, string>>({});
  const [teamName, setTeamName] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [uploadingSheet, setUploadingSheet] = useState(false);

  // 3 · Order Specifications
  const [pricingId, setPricingId] = useState<number | null>(null);
  const [size, setSize] = useState('');
  /** The bottom's size when top & bottom are ordered (`size` is then the top's). */
  const [sizeBottom, setSizeBottom] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [materialSource, setMaterialSource] = useState<MaterialChoice>('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [referenceLink, setReferenceLink] = useState('');
  const [notes, setNotes] = useState('');

  // 4 · Invoice & Payment
  const [quantity, setQuantity] = useState(1);
  const [rushRequested, setRushRequested] = useState(false);
  const [neededBy, setNeededBy] = useState('');
  const [paymentTerm, setPaymentTerm] = useState<PaymentTerm>('downpayment');
  // The customer-specific payment policy the server resolved for this store + service.
  const [customerPolicy, setCustomerPolicy] = useState<CustomerPaymentPolicy | null>(null);
  const [customerPolicyLoading, setCustomerPolicyLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    if (user?.phone) setContactPhone((prev) => prev || user.phone || '');
  }, [user?.phone]);

  useEffect(() => {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    Promise.all([api.get(`/public/stores/${storeId}`), api.get(`/public/stores/${storeId}/services`)])
      .then(([storeRes, servicesRes]) => {
        setStore(storeRes.data.data);
        const found: PublicService | null =
          (servicesRes.data.data ?? []).find((s: PublicService) => s.id === Number(serviceId)) ?? null;
        setService(found);
        if (found) {
          setQuantity(Math.max(1, found.min_order_qty ?? 1));
          if ((found.pricing ?? []).length === 1) setPricingId(found.pricing![0].id);
          // A service sold by the batch starts in bulk mode, like a walk-in team order.
          if ((found.min_order_qty ?? 1) > 1 || (found.service_types ?? []).includes('bulk_sublimation')) setOrderMode('bulk');
          if (found.order_requirements?.measurement_requirement === 'none') setMeasurementSource('shop');
        }
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

  // The customer's effective payment policy for this store + service — the same one the
  // order will snapshot, with the trusted-customer waiver applied server-side. The
  // trust flag itself never reaches the client.
  useEffect(() => {
    if (!user || !serviceId) return;
    setCustomerPolicyLoading(true);
    api.get(`/stores/${storeId}/service-order/payment-policy`, { params: { service_id: serviceId } })
      .then((res) => setCustomerPolicy((res.data?.data ?? null) as CustomerPaymentPolicy | null))
      .catch(() => setCustomerPolicy(null))
      .finally(() => setCustomerPolicyLoading(false));
  }, [user, storeId, serviceId]);

  // Default payment term, from the effective policy once it arrives (the public
  // requirements no longer decide it).
  useEffect(() => {
    if (customerPolicy) setPaymentTerm(customerPolicy.payment_policy === 'full' ? 'full' : 'downpayment');
  }, [customerPolicy]);

  // Measurements this shop already has for the customer (latest version of each profile).
  useEffect(() => {
    if (!user) return;
    api.get('/my-measurements')
      .then((res) => {
        const mine: SavedMeasurement[] = (res.data.data ?? []).filter(
          (m: SavedMeasurement) => m.store?.slug === storeId && !m.superseded_at
        );
        setSavedMeasurements(mine);
        if (mine.length > 0) {
          setMeasurementSource((prev) => (prev === 'shop' ? 'saved' : prev));
          setMeasurementId((prev) => prev ?? mine[0].id);
        }
      })
      .catch(() => setSavedMeasurements([]));
  }, [user, storeId]);

  const branches: StoreBranch[] = store?.branches ?? [];
  // The branch the order goes to: the picked one, else the shop's main branch (same as the server).
  const orderBranchId = branchId ?? branches.find((b) => Boolean(b.is_main))?.id ?? branches[0]?.id ?? null;

  const pricing = service?.pricing ?? [];
  const selectedPricing = pricing.find((p) => p.id === pricingId) ?? null;
  // The option picked decides what is covered and what one ordered unit is (a single option is implied). With nothing configured
  // on it the customer's own Top / Bottom choice stands and one unit is one garment, as before.
  const activeOption = selectedPricing ?? (pricing.length === 1 ? pricing[0] : null);
  const areaLocked = Boolean(activeOption?.covers);
  const area: OrderArea = activeOption?.covers ?? areaChoice;
  const soldAsSet = activeOption?.sold_as === 'set';
  const minQty = Math.max(1, service?.min_order_qty ?? 1);
  const sizes = (service?.size_chart_rows ?? []).map((r) => r.size).filter(Boolean);
  // Public requirements for everything the client may act on itself; the payment
  // policy is replaced with the customer's effective one (waiver included) when
  // the server has told us it.
  const requirements = customerPolicy && service?.order_requirements
    ? { ...service.order_requirements, payment_policy: customerPolicy.payment_policy, payment_policy_percent: customerPolicy.payment_policy_percent }
    : service?.order_requirements;
  const measurementsNeeded = requirements?.measurement_requirement !== 'none';
  const isRepairOnly = !!service && (service.service_types ?? []).length === 1 && service.service_types![0] === 'alteration_repair';

  const countOf = (b: Record<string, string>) => Object.values(b).reduce((sum, v) => sum + (Number.parseInt(v, 10) || 0), 0);
  const bulkPieces = countOf(sizeBreakdown);
  const bulkBottomPieces = countOf(sizeBreakdownBottom);
  const setArea = (next: OrderArea) => setAreaState(next);
  // Whether the area was chosen or came from the option, what belongs to a part no longer covered is dropped.
  useEffect(() => {
    if (area !== 'both') { setSizeBottom(''); setSizeBreakdownBottom({}); }
    setMeasurements((prev) => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, k === 'unit' || fieldsOf(area).includes(k) ? v : ''])) as unknown as IndividualMeasurements);
  }, [area]);

  const pieces = orderMode === 'bulk' ? bulkPieces : quantity;

  const unitPrice = useMemo(() => {
    if (selectedPricing && selectedPricing.amount !== null && selectedPricing.amount !== '') return Number(selectedPricing.amount);
    const base = Number(service?.base_price);
    const sale = Number(service?.sale_price);
    const onSale = Number.isFinite(sale) && sale > 0 && sale < base && saleIsLive(service);
    return onSale ? sale : base;
  }, [selectedPricing, service]);
  const estimatedTotal = Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice * pieces : null;

  const policy = requirements?.payment_policy ?? 'deposit';
  const depositPercent = policy === 'none' ? 0 : policy === 'full' ? 100 : requirements?.payment_policy_percent ?? 50;
  const dueNow = estimatedTotal === null ? null : Math.round((paymentTerm === 'full' ? estimatedTotal : (estimatedTotal * depositPercent) / 100) * 100) / 100;

  const unansweredRequired = (service?.custom_fields ?? []).some((f) => {
    const field = f as unknown as { label?: string; type?: string; required?: boolean };
    return field.required && field.type !== 'checkbox' && field.label?.trim() && !(answers[field.label] ?? '').trim();
  });

  // Only the covered part's numbers count.
  const hasOwnMeasurement = fieldsOf(area).some((k) => measurements[k as keyof IndividualMeasurements].trim() !== '');

  // Sizing, as an if / else: (1) the service needs no body measurements → nothing to ask; (2) else what is ordered comes first;
  // (3) then, for one person, the way the sizes are known; for a batch, the count per size (and per bottom size when both).
  const sourceReady =
    measurementSource === 'shop' ||
    (measurementSource === 'saved' && measurementId !== null) ||
    (measurementSource === 'standard' && size.trim() !== '' && (area !== 'both' || sizeBottom.trim() !== '')) ||
    (measurementSource === 'own' && (hasOwnMeasurement || sheets.length > 0));
  const bulkReady = bulkPieces >= minQty && bulkPieces <= 500 && (area !== 'both' || bulkBottomPieces === bulkPieces);
  const sizingReady = !measurementsNeeded ? (orderMode === 'bulk' ? bulkPieces >= minQty && bulkPieces <= 500 : true) : area !== '' && (orderMode === 'bulk' ? bulkReady : sourceReady);

  const stepReady: Record<number, boolean> = {
    1: contactPhone.replace(/\D/g, '').length >= 7 && (branches.length <= 1 || branchId !== null),
    2: !uploadingSheet && (pricing.length <= 1 || pricingId !== null) && sizingReady,
    3: materialSource !== '' && !unansweredRequired && !uploading,
    4: pieces >= minQty && !submitting && !customerPolicyLoading,
  };

  const upload = async (file: File, onDone: (url: string) => void, setBusy: (v: boolean) => void) => {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/public/stores/${storeId}/upload-reference-image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onDone(res.data.data.url);
    } catch {
      setError("That photo didn't upload. Try a smaller image or a different file.");
    } finally {
      setBusy(false);
    }
  };
  const uploadPhoto = (file: File) =>
    photos.length < MAX_PHOTOS ? upload(file, (url) => setPhotos((p) => [...p, url]), setUploading) : Promise.resolve();
  const uploadSheet = (file: File) =>
    sheets.length < MAX_PHOTOS ? upload(file, (url) => setSheets((p) => [...p, url]), setUploadingSheet) : Promise.resolve();

  const submit = async () => {
    if (!service || !store || submitting) return;
    setSubmitting(true);
    setError('');
    const individual = orderMode === 'individual';
    try {
      const res = await api.post(`/stores/${store.slug}/service-orders`, {
        service_id: service.id,
        contact_phone: contactPhone.trim(),
        store_branch_id: branchId ?? undefined,
        order_mode: orderMode,
        measurement_id: individual && measurementSource === 'saved' ? measurementId ?? undefined : undefined,
        measure_area: measurementsNeeded && area ? area : undefined,
        individual_measurements: individual && measurementSource === 'own' && hasOwnMeasurement ? measurements : undefined,
        size_breakdown: individual ? undefined : sizeBreakdown,
        size_breakdown_bottom: !individual && area === 'both' ? sizeBreakdownBottom : undefined,
        team_name: individual ? undefined : teamName.trim() || undefined,
        wearer_name: individual ? wearerName.trim() || undefined : undefined,
        measurement_sheets: individual && measurementSource === 'own' ? sheets : [],
        pricing_id: pricingId ?? undefined,
        size: individual && measurementsNeeded && measurementSource === 'standard' ? size.trim() || undefined : undefined,
        size_bottom: individual && measurementsNeeded && measurementSource === 'standard' && area === 'both' ? sizeBottom.trim() || undefined : undefined,
        material_source: materialSource === 'own' ? 'customer_supplied' : 'store_supplied',
        material_description: materialSource === 'own' ? materialDescription.trim() || undefined : undefined,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
        notes: notes.trim() || undefined,
        reference_images: photos,
        reference_link: referenceLink.trim() || undefined,
        quantity: individual ? quantity : undefined,
        rush_requested: rushRequested,
        needed_by: neededBy || undefined,
        payment_term: paymentTerm,
      });
      const data = res.data.data;
      setPlaced({ id: data.id, order_number: data.order_number, tracking_code: data.tracking_code });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Your order didn't go through. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    router,
    user,
    loading,
    store,
    service,
    isRepairOnly,
    step,
    setStep,
    stepReady,
    // 1
    contactPhone,
    setContactPhone,
    branches,
    branchId,
    setBranchId,
    // 2
    orderMode,
    setOrderMode,
    wearerName,
    setWearerName,
    measurementsNeeded,
    measurementSource,
    setMeasurementSource,
    savedMeasurements,
    measurementId,
    setMeasurementId,
    measurements,
    setMeasurements,
    area,
    areaLocked,
    setArea,
    soldAsSet,
    garments: pieces * (soldAsSet ? 2 : 1),
    sizeBreakdown,
    sizeBreakdownBottom,
    setSizeBreakdownBottom,
    bulkBottomPieces,
    setSizeBreakdown,
    bulkPieces,
    teamName,
    setTeamName,
    sheets,
    setSheets,
    uploadingSheet,
    uploadSheet,
    // 3
    pricing,
    pricingId,
    setPricingId,
    selectedPricing,
    sizes,
    size,
    setSize,
    sizeBottom,
    setSizeBottom,
    answers,
    setAnswers,
    materialSource,
    setMaterialSource,
    materialDescription,
    setMaterialDescription,
    photos,
    setPhotos,
    uploading,
    uploadPhoto,
    maxPhotos: MAX_PHOTOS,
    referenceLink,
    setReferenceLink,
    notes,
    setNotes,
    // 4
    quantity,
    setQuantity,
    minQty,
    pieces,
    rushRequested,
    setRushRequested,
    neededBy,
    setNeededBy,
    paymentTerm,
    setPaymentTerm,
    policy,
    depositPercent,
    requirements,
    unitPrice,
    estimatedTotal,
    dueNow,
    submitting,
    error,
    submit,
    placed,
  };
}

export type ServiceOrderState = ReturnType<typeof useServiceOrder>;

// Mirrors Service::effectivePrice(): a sale only counts inside its (Manila) date window.
function saleIsLive(service: PublicService | null): boolean {
  if (!service) return false;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const start = service.sale_starts_at?.slice(0, 10);
  const end = service.sale_ends_at?.slice(0, 10);
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}
