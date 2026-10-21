'use client';

import React, { useEffect, useState, useMemo, useCallback, FormEvent } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getSavedLocation, haversineKm } from '@/lib/customerLocation';
import { buildBookingTypes } from '../bookingTypes';
import type { DesignSource } from '@/lib/designSource';
import {
  StoreSettings,
  CalendarAppointment,
  BookingCustomer,
  Branch,
  Service,
  SpecialHour,
} from '../types';
import { useRequestedItemsStore, RequestedServiceItem } from '@/store/useRequestedItemsStore';

// Fitting and pickup are made by the system for a job order; nobody books them.
const VALID_APPOINTMENT_TYPES = ['consultation', 'measurement', 'alteration', 'other'];

export type BookingKind = 'service' | 'shop';

export function useBookingWizard(storeId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, hydrated } = useAuthStore();

  // Login/signup now happens BEFORE the wizard, not after — a guest tapping
  // "Book Appointment" is bounced to /login with a `redirect` back to this
  // exact URL (context params included) instead of filling out appointment
  // details first. Waits for hydrate() (see AuthHydrator.tsx) so this
  // doesn't fire on the SSR-safe "logged out" initial state and redirect a
  // genuinely logged-in customer on every refresh.
  useEffect(() => {
    if (!hydrated || user) return;
    const query = searchParams.toString();
    const redirectTarget = `${pathname}${query ? `?${query}` : ''}`;
    // Tablet/desktop: send the guest back to the page they came from (design, service or
    // the store) with the Sign In modal over it, instead of a blank /login page.
    if (typeof window !== 'undefined' && window.innerWidth >= 600) {
      const itemId = searchParams.get('ref_item_id');
      const svcId = searchParams.get('service_id');
      const context = itemId ? `/store/${storeId}/catalog/${itemId}`
        : svcId ? `/store/${storeId}/service/${svcId}`
        : `/store/${storeId}`;
      router.replace(`${context}?signin=1&redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }
    router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }, [hydrated, user, pathname, searchParams, router]);

  // URL context parameters
  const refName = searchParams.get('ref');
  const refItemId = searchParams.get('ref_item_id');
  const refSize = searchParams.get('ref_size');
  const refImage = searchParams.get('ref_image');
  const refPrice = searchParams.get('ref_price');
  const refColor = searchParams.get('ref_color');
  const refAddOns = searchParams.get('ref_addons');
  const branchSlugParam = searchParams.get('branch');
  const serviceIdParam = searchParams.get('service_id');
  const serviceNameParam = searchParams.get('service_name');
  const refTypeParam = searchParams.get('ref_type');
  const refQtyParam = searchParams.get('ref_qty');
  const refMinQtyParam = searchParams.get('ref_min_qty');
  const qtyParam = searchParams.get('qty') || searchParams.get('quantity');
  // Coming from a service or design already tells us this is a service visit.
  const hasServiceContext = !!serviceIdParam || !!refItemId || !!refName;

  // Appointment Request Items
  const allRequestedItems = useRequestedItemsStore((s) => s.items);
  const requestedItems = useMemo(
    () => allRequestedItems.filter((it) => String(it.storeId) === String(storeId)),
    [allRequestedItems, storeId]
  );
  const {
    addItem,
    updateQuantity,
    updateNotes,
    updateCustomDetails,
    removeCatalogDesign,
    attachCatalogDesign,
    removeItem,
    clearStoreItems,
    getStoreItems,
  } = useRequestedItemsStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalPrefilterServiceId, setAddModalPrefilterServiceId] = useState<number | null>(null);
  const [attachDesignTargetItemId, setAttachDesignTargetItemId] = useState<string | null>(null);

  // Initial seeding for 3 entry points
  const seededRef = React.useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    if (hasServiceContext) {
      // Clear any prior draft items so we do not produce duplicate service requests
      clearStoreItems(storeId);
      const minQ = Math.max(1, parseInt(refMinQtyParam || '1', 10) || 1);
      const parsedQty = parseInt(refQtyParam || qtyParam || '1', 10) || minQ;
      const initialQty = Math.max(minQ, parsedQty);

      let parsedAddOns: string[] = [];
      if (refAddOns) {
        try {
          const parsed = JSON.parse(refAddOns);
          if (Array.isArray(parsed)) {
            parsedAddOns = parsed.map((x) => String(x));
          } else if (typeof parsed === 'string') {
            parsedAddOns = [parsed];
          }
        } catch {
          parsedAddOns = refAddOns.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      addItem({
        storeId,
        serviceId: serviceIdParam ? Number(serviceIdParam) : null,
        serviceName: serviceNameParam || (!refItemId ? refName : null),
        catalogItemId: refItemId ? Number(refItemId) : null,
        catalogItemName: refItemId ? refName : null,
        name: refName || serviceNameParam || 'Custom Item',
        image: refImage || null,
        basePrice: refPrice ? Number(refPrice) : null,
        quantity: initialQty,
        minQuantity: minQ,
        selectedColor: refColor || null,
        selectedSize: refSize || null,
        addOns: parsedAddOns,
        notes: null,
        customDetails: null,
      });
    } else {
      // Entry point 3: Normal Store Profile booking -> start with clean slate for general consultation
      clearStoreItems(storeId);
    }
  }, [storeId, hasServiceContext, refItemId, serviceIdParam, refName, refImage, refPrice, refColor, refSize, refAddOns, refQtyParam, refMinQtyParam, qtyParam, addItem, getStoreItems, clearStoreItems, serviceNameParam]);

  // Derive internal booking kind from actual requested items and entry point context:
  // - Store Profile with no requested items: general 'shop' visit
  // - Service or Catalog Design request: 'service'
  const kind: BookingKind = useMemo(() => {
    if (requestedItems.length > 0) return 'service';
    if (hasServiceContext) return 'service';
    return 'shop';
  }, [requestedItems.length, hasServiceContext]);

  const handleSetKind = useCallback((newKind: BookingKind) => {
    if (newKind === 'shop') {
      setMaterialSource('');
      setMaterialDescription('');
    }
  }, []);

  const handleAddService = (service: Service, qty?: number, customDetails?: string) => {
    const minQ = Math.max(1, Number(service.min_order_qty) || 1);
    const quantity = qty ? Math.max(minQ, qty) : minQ;
    addItem({
      storeId,
      serviceId: service.id,
      serviceName: service.name,
      catalogItemId: null,
      name: service.name,
      basePrice: service.base_price != null ? Number(service.base_price) : null,
      quantity,
      minQuantity: minQ,
      addOns: [],
      notes: customDetails || null,
      customDetails: customDetails || null,
    });
    setSelectedServiceId(String(service.id));
  };

  const handleAddCatalogDesign = (
    item: {
      id: number;
      name: string;
      price: number | string | null;
      service_id?: number | null;
      service?: { id: number; name: string; min_order_qty?: number } | null;
      images?: Array<{ id: number; image_url: string }>;
    },
    options: { quantity: number; size?: string; color?: string; customDetails?: string }
  ) => {
    // If we were attaching a design to an existing item
    if (attachDesignTargetItemId) {
      attachCatalogDesign(attachDesignTargetItemId, {
        id: item.id,
        name: item.name,
        image_url: item.images?.[0]?.image_url ?? null,
        sizes: options.size ? [options.size] : null,
        color: options.color || null,
        price: item.price,
      });
      if (options.customDetails) {
        updateNotes(attachDesignTargetItemId, options.customDetails);
      }
      setAttachDesignTargetItemId(null);
      setAddModalPrefilterServiceId(null);
      return;
    }

    const parentServiceId = item.service_id ?? item.service?.id ?? null;
    const parentServiceName = item.service?.name ?? null;
    const minQ = Math.max(1, Number(item.service?.min_order_qty) || 1);
    const quantity = Math.max(minQ, options.quantity || minQ);
    addItem({
      storeId,
      serviceId: parentServiceId,
      serviceName: parentServiceName,
      catalogItemId: item.id,
      catalogItemName: item.name,
      name: item.name,
      image: item.images?.[0]?.image_url ?? null,
      basePrice: item.price != null ? Number(item.price) : null,
      quantity,
      minQuantity: minQ,
      selectedSize: options.size || null,
      selectedColor: options.color || null,
      addOns: [],
      notes: options.customDetails || null,
      customDetails: options.customDetails || null,
    });
    if (parentServiceId) {
      setSelectedServiceId(String(parentServiceId));
    }
  };

  const handleOpenAddModal = (prefilterServiceId?: number | null, targetItemId?: string | null) => {
    setAddModalPrefilterServiceId(prefilterServiceId ?? null);
    setAttachDesignTargetItemId(targetItemId ?? null);
    setIsAddModalOpen(true);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  // The owner's Appointment Configuration for the design being booked from.
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<{ message: string; isConflict?: boolean } | null>(null);

  // Form Data
  const [appointmentType, setAppointmentType] = useState<string>(() => {
    if (refTypeParam && VALID_APPOINTMENT_TYPES.includes(refTypeParam)) {
      return refTypeParam;
    }
    const initialName = (serviceNameParam || '').toLowerCase();
    if (
      initialName.includes('alter') ||
      initialName.includes('repair') ||
      initialName.includes('hem') ||
      initialName.includes('adjust') ||
      initialName.includes('taper') ||
      initialName.includes('patch') ||
      initialName.includes('fix') ||
      initialName.includes('resize')
    ) {
      return 'alteration';
    }
    return 'consultation';
  });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  // Seeded from ?service_id= (e.g. "Book Appointment" tapped from a specific
  // service's own detail page) — without this, `selectedService` elsewhere
  // in this hook still resolved correctly (it falls back to serviceIdParam),
  // but Step 2's <select> is a plain controlled input bound directly to
  // this raw state, so it kept showing "Select a service..." instead of
  // the one the customer actually came from.
  const [selectedServiceId, setSelectedServiceId] = useState(serviceIdParam ?? '');
  const [customer, setCustomer] = useState<BookingCustomer>({ name: '', email: '', phone: '' });
  const [remarks, setRemarks] = useState('');
  // What an "Other" appointment is for (shown to the shop as "Other — {label}").
  const [purposeLabel, setPurposeLabel] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Material/fabric responsibility — a structured choice, not a new backend
  // field: encoded into the existing free-text `notes` column at submit time
  // (handleSubmit), the same bracket-tag convention already used below for
  // the design-reference context.
  const [materialSource, setMaterialSource] = useState<'own' | 'shop' | ''>('');
  const [materialDescription, setMaterialDescription] = useState('');
  // Where the design comes from (the shop's, or the customer's own) and a link to the customer's file.
  const [peopleCount, setPeopleCount] = useState('');
  /** The customer's own pictures (uploaded), sent with the booking beside the design's picture. */
  const [photos, setPhotos] = useState<string[]>([]);
  const [design, setDesign] = useState<{ design_source: DesignSource | null; design_link: string | null }>({ design_source: null, design_link: null });

  // Calendar Appointments
  const [calendarAppointments, setCalendarAppointments] = useState<CalendarAppointment[]>([]);

  // User Location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    setCustomer((prev) => ({
      name: user.name || prev.name || '',
      email: user.email || prev.email || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    const loc = getSavedLocation();
    if (loc) {
      setUserLocation({ lat: loc.lat, lng: loc.lng });
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const [returnToReview, setReturnToReview] = useState(false);
  const [quantity, setQuantity] = useState(qtyParam || '');

  const onEditPurpose = () => {
    setBookingError(null);
    setStep(1);
    setReturnToReview(true);
  };

  const onEditSchedule = () => {
    setBookingError(null);
    setStep(2);
    setReturnToReview(true);
  };

  const selectedService = useMemo(() => {
    if (!storeSettings?.services) return null;
    const targetServiceId = selectedServiceId || serviceIdParam || (requestedItems[0]?.serviceId ? String(requestedItems[0].serviceId) : '');
    return storeSettings.services.find((s) => s.id.toString() === targetServiceId) || null;
  }, [storeSettings?.services, selectedServiceId, serviceIdParam, requestedItems]);

  const availableBookingTypes = useMemo(
    () => buildBookingTypes({ kind, refName, selectedService, serviceIdParam, serviceNameParam }),
    [kind, refName, selectedService, serviceIdParam, serviceNameParam],
  );

  // Synchronize appointmentType if current selection is invalid for this service
  useEffect(() => {
    if (availableBookingTypes.length > 0) {
      const isCurrentValid = availableBookingTypes.some((t) => t.value === appointmentType);
      if (!isCurrentValid) {
        setAppointmentType(availableBookingTypes[0].value);
      }
    }
  }, [availableBookingTypes, appointmentType]);

  // One duration table, kept on the server for online and walk-in; the form only shows the length.
  const durationMinutes = storeSettings?.durations?.[appointmentType] ?? availableBookingTypes.find((t) => t.value === appointmentType)?.duration ?? 30;

  const branchAutoFilled = !!branchSlugParam && !!storeSettings?.branches?.some((b) => b.slug === branchSlugParam || String(b.id) === branchSlugParam);
  const autoFilledBranch = branchAutoFilled ? storeSettings?.branches?.find((b) => b.slug === branchSlugParam || String(b.id) === branchSlugParam) || null : null;

  // The service picker only appears if the visit is kind=service but no specific service or item was preselected or added yet.
  const needsServicePicker = kind === 'service' && !hasServiceContext && requestedItems.length === 0 && !!storeSettings?.services && storeSettings.services.length > 0;

  const totalSteps = 3;
  const displayStep = step;
  const prevStep = step - 1;

  const branchesWithDistance = useMemo(() => {
    if (!storeSettings?.branches) return [];
    return storeSettings.branches
      .map((b) => {
        let distanceKm: number | null = null;
        if (userLocation && b.latitude != null && b.longitude != null) {
          distanceKm = haversineKm(userLocation.lat, userLocation.lng, Number(b.latitude), Number(b.longitude));
        }
        return { ...b, distanceKm };
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      });
  }, [storeSettings?.branches, userLocation]);

  useEffect(() => {
    if (!selectedBranchId && branchesWithDistance.length > 0) {
      const match = branchSlugParam && branchesWithDistance.find((b) => b.slug === branchSlugParam || String(b.id) === branchSlugParam);
      if (match) {
        setSelectedBranchId(String(match.id));
      } else {
        setSelectedBranchId(String(branchesWithDistance[0].id));
      }
    }
  }, [branchesWithDistance, selectedBranchId, branchSlugParam]);

  const selectedBranch = useMemo(() => {
    if (!selectedBranchId) return null;
    // branchesWithDistance (not the raw storeSettings.branches list) so the
    // review screen and confirmation can show "1.2 km away" alongside the
    // branch, same distance data already computed for the picker.
    return branchesWithDistance.find((b) => String(b.id) === selectedBranchId) || null;
  }, [selectedBranchId, branchesWithDistance]);

  const parsedOperatingHours = useMemo(() => {
    if (!storeSettings?.operating_hours) return null;
    if (typeof storeSettings.operating_hours === 'string') {
      try {
        return JSON.parse(storeSettings.operating_hours);
      } catch {
        return null;
      }
    }
    return storeSettings.operating_hours as Record<string, { is_open: boolean; open: string; close: string }>;
  }, [storeSettings?.operating_hours]);

  const formatDatePreview = (dateStr: string) => {
    if (!dateStr) return 'Date not selected';
    try {
      const d = new Date(`${dateStr}T12:00:00`);
      return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTimePreview = (timeStr: string) => {
    if (!timeStr) return 'Time not selected';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getSpecialHoursForDate = (dateStr: string): SpecialHour | null => {
    if (!storeSettings?.special_hours) return null;
    return storeSettings.special_hours.find((s) => dateStr >= s.start_date && dateStr <= s.end_date) || null;
  };

  const step1NextDisabled = (appointmentType === 'other' || appointmentType === 'alteration') && purposeLabel.trim() === '';

  const hasValidPhone = Boolean(
    customer.phone && customer.phone.trim().replace(/\D/g, '').length >= 7
  );

  const step2NextDisabled =
    !date ||
    !time ||
    !hasValidPhone ||
    !!getSpecialHoursForDate(date)?.is_closed ||
    (!!storeSettings?.branches && storeSettings.branches.length > 0 && !selectedBranchId) ||
    (needsServicePicker && !selectedServiceId) ||
    // The service's own required questions (Services → Booking Form).
    (selectedService?.custom_fields ?? []).some((f) => f.required && f.type !== 'checkbox' && f.label?.trim() && !(answers[f.label] ?? '').trim());

  useEffect(() => {
    if (!storeId) return;

    api
      .get(`/catalog/${storeId}/booking-settings`)
      .then((res) => {
        const settings = res.data.data;
        setStoreSettings(settings);

        const branchFromSlug = branchSlugParam && settings?.branches?.find((b: Branch) => b.slug === branchSlugParam);
        if (branchFromSlug) {
          setSelectedBranchId(branchFromSlug.id.toString());
        } else if (settings?.branches && settings.branches.length === 1) {
          setSelectedBranchId(settings.branches[0].id.toString());
        }

        if (serviceIdParam && settings?.services?.some((s: Service) => s.id.toString() === serviceIdParam)) {
          setSelectedServiceId(serviceIdParam);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load booking settings:', err);
        setLoading(false);
      });

    api
      .get(`/catalog/${storeId}/appointments`)
      .then((res) => setCalendarAppointments(res.data.data || []))
      .catch((err) => console.error('Failed to fetch appointments:', err));
  }, [storeId, branchSlugParam, serviceIdParam]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setBookingError(null);

    const scheduled_at = `${date}T${time || '12:00'}:00`;
    const currentStoreItems = getStoreItems(storeId);

    const itemsPayload = currentStoreItems.length > 0
      ? currentStoreItems.map((item) => ({
          service_id: item.serviceId ?? null,
          catalog_item_id: item.catalogItemId ?? null,
          item_name: item.name,
          quantity: item.quantity,
          selected_size: item.selectedSize ?? null,
          selected_color: item.selectedColor ?? null,
          add_ons: item.addOns && item.addOns.length > 0 ? item.addOns : null,
          notes: item.notes ?? null,
        }))
      : undefined;

    // Only what the customer wrote goes in the notes; the fabric choice has its own fields.
    const notesPayload = remarks.trim();

    try {
      // The account is the customer (sign-in is required), so no name or email is sent. No payment is taken.
      const hasItems = currentStoreItems.length > 0;
      const isService = hasItems || kind === 'service';
      const effectiveKind = hasItems ? 'service' : kind;
      const firstItem = currentStoreItems[0];

      await api.post(`/catalog/${storeId}/book`, {
        kind: effectiveKind,
        phone: customer.phone?.trim() || undefined,
        appointment_type: appointmentType,
        purpose_label: ['other', 'alteration'].includes(appointmentType) ? purposeLabel.trim() : undefined,
        scheduled_at,
        notes: notesPayload.trim() || null,
        store_branch_id: selectedBranchId ? Number(selectedBranchId) : null,
        service_id: isService && (firstItem?.serviceId ?? selectedServiceId) ? Number(firstItem?.serviceId ?? selectedServiceId) : null,
        catalog_item_id: isService && (firstItem?.catalogItemId ?? refItemId) ? Number(firstItem?.catalogItemId ?? refItemId) : null,
        selected_size: isService ? (firstItem?.selectedSize ?? refSize ?? null) : null,
        selected_color: isService ? (firstItem?.selectedColor ?? refColor ?? null) : null,
        reference_images: isService ? (Array.from(new Set([firstItem?.image ?? refImage, ...photos].filter(Boolean) as string[])).slice(0, 10) || undefined) : undefined,
        answers: isService && Object.keys(answers).length > 0 ? answers : undefined,
        design_source: isService && design.design_source ? design.design_source : undefined,
        design_link: isService && design.design_link ? design.design_link : undefined,
        people_count: isService && Number(peopleCount) >= 2 ? Number(peopleCount) : undefined,
        material_source: isService && materialSource ? materialSource : undefined,
        material_note: isService && materialSource === 'own' && materialDescription.trim() ? materialDescription.trim() : undefined,
        items: isService && itemsPayload && itemsPayload.length > 0 ? itemsPayload : undefined,
      });
      clearStoreItems(storeId);
      setSuccess(true);
    } catch (err: unknown) {
      console.warn('Failed to book appointment:', err);
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const status = axiosErr?.response?.status;
      const res = axiosErr?.response?.data;
      const firstFieldError = res?.errors ? Object.values(res.errors)[0]?.[0] : undefined;
      const detail = firstFieldError || (res?.message && res.message !== 'The given data was invalid.' ? res.message : undefined);
      const message = detail || 'Failed to book appointment. Please check all fields and try again.';
      setBookingError({
        message,
        isConflict: status === 409,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    router,
    user,
    step,
    setStep,
    prevStep,
    displayStep,
    totalSteps,
    returnToReview,
    setReturnToReview,
    onEditPurpose,
    onEditSchedule,
    quantity,
    setQuantity,
    loading: loading || !hydrated || !user,
    success,
    submitting,
    bookingError,
    clearBookingError: () => setBookingError(null),
    storeSettings,

    // Design / Service reference context
    refName,
    refItemId,
    refSize,
    refImage,
    refPrice,
    refColor,
    refAddOns,
    serviceIdParam,
    serviceNameParam,

    // Step 2 state
    availableBookingTypes,
    appointmentType,
    setAppointmentType,
    kind,
    setKind: handleSetKind,
    kindLocked: hasServiceContext,
    needsServicePicker,
    selectedServiceId,
    setSelectedServiceId,
    remarks,
    setRemarks,
    materialSource,
    setMaterialSource,
    materialDescription,
    setMaterialDescription,
    design,
    setDesign,
    peopleCount,
    setPeopleCount,
    photos,
    setPhotos,
    branchAutoFilled,
    autoFilledBranch,
    branchesWithDistance,
    selectedBranchId,
    setSelectedBranchId,
    userLocation,
    date,
    setDate,
    time,
    setTime,
    parsedOperatingHours,
    calendarAppointments,
    durationMinutes,
    specialHoursForDate: date ? getSpecialHoursForDate(date) : null,
    step1NextDisabled,
    step2NextDisabled,
    purposeLabel,
    setPurposeLabel,

    // Step 3 state
    selectedService,
    selectedBranch,
    formatDatePreview,
    formatTimePreview,
    customer,
    setCustomer,
    answers,
    setAnswers,
    handleSubmit,

    // Requested Items and modal state
    requestedItems,
    isAddModalOpen,
    setIsAddModalOpen,
    addModalPrefilterServiceId,
    setAddModalPrefilterServiceId,
    handleOpenAddModal,
    handleAddService,
    handleAddCatalogDesign,
    handleRemoveItem,
    handleUpdateQuantity: updateQuantity,
    handleUpdateNotes: updateNotes,
    handleRemoveCatalogDesign: removeCatalogDesign,
    handleAttachCatalogDesign: attachCatalogDesign,
    updateQuantity,
    removeItem,
    clearStoreItems,
  };
}
