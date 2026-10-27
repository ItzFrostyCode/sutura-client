'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { PublicService, StoreBranch, StoreProfile } from '@/components/store-storefront/types';
import type { ShopPaymentMethod } from '@/components/account/orders/usePayForOrder';

export interface SavedMeasurement {
  id: number;
  profile_name: string;
  version: number;
  superseded_at?: string | null;
  updated_at?: string;
  store?: { slug: string } | null;
}

export interface PlacedOrder {
  id: number;
  order_number: string;
  tracking_code: string;
}

export type MaterialChoice = 'own' | 'shop' | '';
export type OrderMode = 'individual' | 'bulk';
export type MeasurementSource = 'saved' | 'own' | 'shop';
export type PaymentTerm = 'full' | 'downpayment';

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
  const [measurementSource, setMeasurementSource] = useState<MeasurementSource>('shop');
  const [measurementId, setMeasurementId] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<IndividualMeasurements>(EMPTY_MEASUREMENTS);
  const [sizeBreakdown, setSizeBreakdown] = useState<Record<string, string>>({});
  const [teamName, setTeamName] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [uploadingSheet, setUploadingSheet] = useState(false);

  // 3 · Order Specifications
  const [pricingId, setPricingId] = useState<number | null>(null);
  const [size, setSize] = useState('');
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
  // Paid up front by GCash only (no bank transfer), proven with a receipt screenshot.
  const [gcashAccounts, setGcashAccounts] = useState<ShopPaymentMethod[]>([]);
  const [gcashLoading, setGcashLoading] = useState(true);
  const [gcashId, setGcashId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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
          const policy = found.order_requirements?.payment_policy;
          setPaymentTerm(policy === 'full' ? 'full' : 'downpayment');
          if (found.order_requirements?.measurement_requirement === 'none') setMeasurementSource('shop');
        }
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

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

  useEffect(() => {
    if (!store?.slug) return;
    setGcashLoading(true);
    api.get(`/public/stores/${store.slug}/payment-methods`, { params: orderBranchId ? { branch_id: orderBranchId } : {} })
      .then((res) => {
        const gcash = ((res.data?.data ?? []) as ShopPaymentMethod[]).filter((m) => m.kind === 'gcash');
        setGcashAccounts(gcash);
        setGcashId((prev) => (prev && gcash.some((m) => m.id === prev) ? prev : gcash[0]?.id ?? null));
      })
      .catch(() => setGcashAccounts([]))
      .finally(() => setGcashLoading(false));
  }, [store?.slug, orderBranchId]);
  const pricing = service?.pricing ?? [];
  const selectedPricing = pricing.find((p) => p.id === pricingId) ?? null;
  const minQty = Math.max(1, service?.min_order_qty ?? 1);
  const sizes = (service?.size_chart_rows ?? []).map((r) => r.size).filter(Boolean);
  const requirements = service?.order_requirements;
  const measurementsNeeded = requirements?.measurement_requirement !== 'none';
  const isRepairOnly = !!service && (service.service_types ?? []).length === 1 && service.service_types![0] === 'alteration_repair';

  const bulkPieces = Object.values(sizeBreakdown).reduce((sum, v) => sum + (Number.parseInt(v, 10) || 0), 0);
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
  const paymentNeeded = dueNow !== null && dueNow > 0 && gcashAccounts.length > 0;

  const unansweredRequired = (service?.custom_fields ?? []).some((f) => {
    const field = f as unknown as { label?: string; type?: string; required?: boolean };
    return field.required && field.type !== 'checkbox' && field.label?.trim() && !(answers[field.label] ?? '').trim();
  });

  const hasOwnMeasurement = ['chest', 'waist', 'hips', 'shoulders', 'length', 'neck', 'sleeve', 'inseam']
    .some((k) => measurements[k as keyof IndividualMeasurements].trim() !== '');

  const stepReady: Record<number, boolean> = {
    1: contactPhone.replace(/\D/g, '').length >= 7 && (branches.length <= 1 || branchId !== null),
    2:
      !uploadingSheet &&
      (orderMode === 'bulk'
        ? bulkPieces >= minQty && bulkPieces <= 500
        : !measurementsNeeded ||
          measurementSource === 'shop' ||
          (measurementSource === 'saved' && measurementId !== null) ||
          (measurementSource === 'own' && (hasOwnMeasurement || sheets.length > 0))),
    3: (pricing.length <= 1 || pricingId !== null) && materialSource !== '' && !unansweredRequired && !uploading,
    4: pieces >= minQty && !submitting && !gcashLoading && !uploadingReceipt && (!paymentNeeded || (gcashId !== null && receipt !== '')),
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
  const uploadReceipt = async (file: File) => {
    if (!store?.slug) return;
    setUploadingReceipt(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/public/stores/${store.slug}/upload-receipt`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReceipt(res.data?.data?.url ?? '');
    } catch {
      setError("The receipt didn't upload. Use a JPG, PNG or WEBP screenshot and try again.");
    } finally {
      setUploadingReceipt(false);
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
        individual_measurements: individual && measurementSource === 'own' && hasOwnMeasurement ? measurements : undefined,
        size_breakdown: individual ? undefined : sizeBreakdown,
        team_name: individual ? undefined : teamName.trim() || undefined,
        measurement_sheets: individual && measurementSource === 'own' ? sheets : [],
        pricing_id: pricingId ?? undefined,
        size: individual ? size.trim() || undefined : undefined,
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
        payment_method_id: paymentNeeded ? gcashId ?? undefined : undefined,
        payment_receipt: paymentNeeded ? receipt : undefined,
        payment_reference: paymentNeeded ? paymentReference.trim() || undefined : undefined,
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
    measurementsNeeded,
    measurementSource,
    setMeasurementSource,
    savedMeasurements,
    measurementId,
    setMeasurementId,
    measurements,
    setMeasurements,
    sizeBreakdown,
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
    gcashAccounts,
    gcashLoading,
    gcashId,
    setGcashId,
    paymentNeeded,
    receipt,
    setReceipt,
    paymentReference,
    setPaymentReference,
    uploadingReceipt,
    uploadReceipt,
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
