'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import type { PublicService, StoreBranch, StoreProfile } from '@/components/store-storefront/types';
import type { ShopPaymentMethod } from '@/components/account/orders/usePayForOrder';
import { hasAnyMeasurement, measurementsFromMetrics, pickMeasurements } from '@/lib/garmentMeasurements';
import { usePeopleList } from '@/components/order-people/usePeopleList';
import { saleDay } from '@/lib/salePricing';

export interface SavedMeasurement {
  id: number;
  profile_name: string;
  version: number;
  metrics?: Record<string, string | undefined> | null;
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
export type PaymentTerm = 'full' | 'downpayment';

export const BULK_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;
const MAX_PHOTOS = 5;
/** Most people one online order can list (the server caps pieces at 500). */
export const MAX_PEOPLE = 500;

// Customer-side "Online Order" for one service. Follows the shop's walk-in
// wizard step for step — Customer Information → Measurements → Order
// Specifications → Invoice & Payment — and is submitted to
// POST /stores/{slug}/service-orders as a pending online job order.
export function useServiceOrder(storeId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id');
  // Set when the order starts from a design ("Place Order" in the design modal).
  const designName = searchParams.get('design');
  const designImage = searchParams.get('design_image');
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
  // A PH mobile number, kept as 11 digits (09XXXXXXXXX). "+63 917…" becomes "0917…".
  const [contactPhone, setContactPhoneRaw] = useState('');
  const setContactPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('63') && digits.length > 11) digits = `0${digits.slice(2)}`;
    else if (digits.startsWith('9') && digits.length === 10) digits = `0${digits}`;
    setContactPhoneRaw(digits.slice(0, 11));
  };
  const phoneValid = /^09\d{9}$/.test(contactPhone);
  const [branchId, setBranchId] = useState<number | null>(null);

  // 2 · Measurements (the person forms are set up below, once the sizes are known).
  // Individual = one person's own form; Bulk = the people list, one piece per person.
  const [orderMode, setOrderMode] = useState<OrderMode>('individual');
  // Top / Bottom / Full Set…: decides which body measurements are asked.
  const [garmentType, setGarmentType] = useState('');
  const [teamName, setTeamName] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [uploadingSheet, setUploadingSheet] = useState(false);

  // 3 · Order Specifications
  const [pricingId, setPricingId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [materialSource, setMaterialSource] = useState<MaterialChoice>('');
  const [materialDescription, setMaterialDescription] = useState('');
  // The design's photo is pre-attached as the first reference photo (the customer can remove it).
  const [photos, setPhotos] = useState<string[]>(() => (designImage ? [designImage] : []));
  const [uploading, setUploading] = useState(false);
  const [referenceLink, setReferenceLink] = useState('');
  const [notes, setNotes] = useState('');

  // 4 · Invoice & Payment
  const [quantity, setQuantity] = useState(1);
  const [rushRequested, setRushRequested] = useState(false);
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
    if (user?.phone && !contactPhone) setContactPhone(user.phone);
    // Only when the account's number loads; never overwrite what the customer typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Every GCash account in the shop (any branch), so Step 1 can tell which
  // branches take online orders. null while loading or if it failed (then
  // nothing is blocked here; Step 4 and the server still check).
  const [shopGcash, setShopGcash] = useState<ShopPaymentMethod[] | null>(null);
  useEffect(() => {
    if (!store?.slug) return;
    api.get(`/public/stores/${store.slug}/payment-methods`, { params: { any_branch: 1 } })
      .then((res) => setShopGcash(((res.data?.data ?? []) as ShopPaymentMethod[]).filter((m) => m.kind === 'gcash')))
      .catch(() => setShopGcash(null));
  }, [store?.slug]);
  // Payment is due before production (deposit or full), so the branch needs a GCash account to pay to.
  const paysUpFront = (service?.order_requirements?.payment_policy ?? 'deposit') !== 'none';
  const branchTakesOnline = (id: number) =>
    !paysUpFront || shopGcash === null || shopGcash.some((m) => m.store_branch_id == null || m.store_branch_id === id);
  const pricing = service?.pricing ?? [];
  const selectedPricing = pricing.find((p) => p.id === pricingId) ?? null;
  const minQty = Math.max(1, service?.min_order_qty ?? 1);
  const sizes = (service?.size_chart_rows ?? []).map((r) => r.size).filter(Boolean);
  const requirements = service?.order_requirements;
  const measurementsNeeded = requirements?.measurement_requirement !== 'none';
  const isRepairOnly = !!service && (service.service_types ?? []).length === 1 && service.service_types![0] === 'alteration_repair';

  // Standard sizes are the service's own chart sizes when it has a size chart.
  const bulkSizes: string[] = sizes.length > 0 ? sizes : [...BULK_SIZES];

  const hasSheets = sheets.length > 0;
  // Bulk: the people on the order (same list + editor as the walk-in wizard).
  const people = usePeopleList({ sizes: bulkSizes, garmentType, hasSheets, max: MAX_PEOPLE });
  const { persons } = people;
  // Individual: the customer's own sizing, one form with no list (its draft is used as-is).
  const solo = usePeopleList({ sizes: bulkSizes, garmentType, hasSheets, max: 1 });

  const bulkPieces = persons.length;
  const pieces = orderMode === 'bulk' ? bulkPieces : quantity;

  // Fills the active form from a measurement profile this shop has on file for the customer.
  const fillDraftFromProfile = (profileId: number) => {
    const profile = savedMeasurements.find((m) => m.id === profileId);
    if (!profile) return;
    const metrics = profile.metrics ?? {};
    const values = { unit: metrics.unit === 'cm' ? 'cm' as const : 'in' as const, ...measurementsFromMetrics(metrics) };
    if (orderMode === 'individual') {
      solo.fillDraft(values, profileId);
      return;
    }
    const firstPerson = persons.length === 0 && people.editingId === null;
    people.fillDraft(values, profileId, firstPerson ? user?.name : undefined);
  };

  const unitPrice = useMemo(() => {
    // A running discount takes the same % off a price tier (server: Service::discountedAmount).
    if (selectedPricing && selectedPricing.amount !== null && selectedPricing.amount !== '') {
      const amount = Number(selectedPricing.amount);
      const pct = Number(service?.sale_percent) || 0;
      return pct > 0 && saleIsLive(service) ? Math.round(amount * (100 - pct)) / 100 : amount;
    }
    const base = Number(service?.base_price);
    const sale = Number(service?.sale_price);
    const onSale = Number.isFinite(sale) && sale > 0 && sale < base && saleIsLive(service);
    return onSale ? sale : base;
  }, [selectedPricing, service]);
  // Own fabric: the service's per-piece deduction comes off before the total and deposit (same rule as the server).
  const fabricDeductionEach = materialSource === 'own' && Number.isFinite(unitPrice)
    ? Math.min(Math.max(0, Number(service?.own_fabric_deduction) || 0), unitPrice)
    : 0;
  const fabricDeduction = Math.round(fabricDeductionEach * pieces * 100) / 100;
  const estimatedTotal = Number.isFinite(unitPrice) && unitPrice > 0 ? (unitPrice - fabricDeductionEach) * pieces : null;

  const policy = requirements?.payment_policy ?? 'deposit';
  const depositPercent = policy === 'none' ? 0 : policy === 'full' ? 100 : requirements?.payment_policy_percent ?? 50;
  const dueNow = estimatedTotal === null ? null : Math.round((paymentTerm === 'full' ? estimatedTotal : (estimatedTotal * depositPercent) / 100) * 100) / 100;
  const paymentNeeded = dueNow !== null && dueNow > 0 && gcashAccounts.length > 0;

  const unansweredRequired = (service?.custom_fields ?? []).some((f) => {
    const field = f as unknown as { label?: string; type?: string; required?: boolean };
    return field.required && field.type !== 'checkbox' && field.label?.trim() && !(answers[field.label] ?? '').trim();
  });

  const stepReady: Record<number, boolean> = {
    1: phoneValid && (branches.length <= 1 || branchId !== null),
    2:
      !uploadingSheet &&
      (orderMode === 'individual'
        ? !measurementsNeeded || solo.draftValid
        : bulkPieces >= Math.max(1, minQty) && bulkPieces <= MAX_PEOPLE),
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
    // The customer's own sizing on an individual order (none when the service needs no measurements).
    const me = individual && measurementsNeeded && solo.draftValid ? solo.draft : undefined;
    const soloSource = !me || me.method === 'standard'
      ? undefined
      : me.method === 'shop' ? 'shop' : me.profileId !== null ? 'saved' : 'own';
    try {
      const res = await api.post(`/stores/${store.slug}/service-orders`, {
        service_id: service.id,
        contact_phone: contactPhone.trim(),
        store_branch_id: branchId ?? undefined,
        order_mode: orderMode,
        measurement_id: soloSource === 'saved' ? me!.profileId ?? undefined : undefined,
        // Saved with the order so the shop sees "measure me at the shop" and books the visit.
        measurement_source: measurementsNeeded ? soloSource : undefined,
        garment_category: garmentType || undefined,
        individual_measurements: soloSource === 'own' && hasAnyMeasurement(me!.values, garmentType) ? pickMeasurements(me!.values, garmentType) : undefined,
        // Standard-size people counted per size; everyone else is counted by the server as custom fit.
        size_breakdown: individual ? undefined : Object.fromEntries(bulkSizes.map((s) => {
          const count = persons.filter((p) => p.method === 'standard' && p.size === s).length;
          return [s, count > 0 ? String(count) : ''];
        })),
        team_name: individual ? undefined : teamName.trim() || undefined,
        // One row per person, so the shop sees every name and how each is sized.
        member_measurements: individual ? undefined : persons.map((p) => ({
          name: p.name || undefined,
          gender: p.gender || undefined,
          size: p.method === 'standard' ? p.size : undefined,
          measure_at_shop: p.method === 'shop' || undefined,
          ...(p.method === 'body' ? pickMeasurements(p.values, garmentType) : {}),
        })),
        measurement_sheets: sheets,
        pricing_id: pricingId ?? undefined,
        size: me?.method === 'standard' ? me.size : undefined,
        material_source: materialSource === 'own' ? 'customer_supplied' : 'store_supplied',
        material_description: materialSource === 'own' ? materialDescription.trim() || undefined : undefined,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
        // Tag the design by name so the shop knows which one the photo is.
        notes: [designName ? `[Design: ${designName}]` : '', notes.trim()].filter(Boolean).join('\n') || undefined,
        reference_images: photos,
        reference_link: referenceLink.trim() || undefined,
        quantity: individual ? quantity : undefined,
        rush_requested: rushRequested,
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
    designName,
    designImage,
    isRepairOnly,
    step,
    setStep,
    stepReady,
    // 1
    contactPhone,
    setContactPhone,
    phoneValid,
    branches,
    branchId,
    setBranchId,
    branchTakesOnline,
    // 2
    orderMode,
    setOrderMode,
    garmentType,
    setGarmentType,
    measurementsNeeded,
    savedMeasurements,
    bulkPieces,
    bulkSizes,
    people,
    persons,
    solo,
    fillDraftFromProfile,
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
    paymentTerm,
    setPaymentTerm,
    policy,
    depositPercent,
    requirements,
    unitPrice,
    fabricDeductionEach,
    fabricDeduction,
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
  const start = service.sale_starts_at ? saleDay(service.sale_starts_at) : undefined;
  const end = service.sale_ends_at ? saleDay(service.sale_ends_at) : undefined;
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}
