'use client';

import React, { useEffect, useState, useMemo, FormEvent } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getSavedLocation, haversineKm } from '@/lib/customerLocation';
import { buildBookingTypes } from '../bookingTypes';
import {
  StoreSettings,
  CalendarAppointment,
  BookingCustomer,
  Branch,
  Service,
  SpecialHour,
} from '../types';

// Fitting and pickup are made by the system for a production order; nobody books them.
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
  const branchSlugParam = searchParams.get('branch');
  const serviceIdParam = searchParams.get('service_id');
  const serviceNameParam = searchParams.get('service_name');
  const refTypeParam = searchParams.get('ref_type');
  // Coming from a service or design already tells us this is a service visit.
  const hasServiceContext = !!serviceIdParam || !!refItemId || !!refName;

  const [kind, setKind] = useState<BookingKind>(hasServiceContext ? 'service' : 'shop');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  // The owner's Appointment Configuration for the design being booked from.
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
  const qtyParam = searchParams.get('qty') || searchParams.get('quantity');
  const [quantity, setQuantity] = useState(qtyParam || '');

  const onEditPurpose = () => {
    setStep(1);
    setReturnToReview(true);
  };

  const onEditSchedule = () => {
    setStep(2);
    setReturnToReview(true);
  };

  const selectedService = useMemo(() => {
    if (!storeSettings?.services) return null;
    return storeSettings.services.find((s) => s.id.toString() === selectedServiceId || s.id.toString() === serviceIdParam) || null;
  }, [storeSettings?.services, selectedServiceId, serviceIdParam]);

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

  // A Catalog Item's own service_id (attached to the URL by the catalog item
  // detail page whenever item.service exists) already answers "what
  // service is this" — trust that context and never re-ask, even if this
  // particular service happens to be filtered out of the general public
  // services list (e.g. deactivated after the catalog page loaded). A design
  // reference (refName, set for every catalog-item booking regardless of
  // whether that item has a linked service_id) counts the same way — the
  // catalog design itself already fully specifies what's being made, so a
  // "Service (Optional)" dropdown underneath it is redundant, not optional.
  // The picker only reappears when the entry point genuinely carried neither
  // (a plain "Book Appointment" from the store profile, not tied to any
  // design or service).
  const needsServicePicker = kind === 'service' && !hasServiceContext && !!storeSettings?.services && storeSettings.services.length > 0;

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

  const step1NextDisabled = appointmentType === 'other' && purposeLabel.trim() === '';

  const step2NextDisabled =
    !date ||
    !time ||
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

    const scheduled_at = `${date}T${time || '12:00'}:00`;

    // The design itself (title, category, size, color) is sent as structured
    // fields below — catalog_item_id/selected_size/selected_color — instead
    // of a "[Design Reference: …]" line in notes, so the owner, branch, and
    // staff views can show its real title and category.
    let notesPayload = '';
    if (refName && !refItemId) {
      notesPayload += `[Design Reference: ${refName}${refPrice ? ` (from ₱${Number(refPrice).toLocaleString()})` : ''}${
        refSize ? ` — Size ${refSize}` : ''
      }${refColor ? ` — ${refColor}` : ''}]\n`;
    }
    if (materialSource === 'own') {
      notesPayload += `[Material: Customer will bring own fabric/sample${
        materialDescription.trim() ? ` — ${materialDescription.trim()}` : ''
      }]\n`;
    } else if (materialSource === 'shop') {
      notesPayload += `[Material: Customer will use the shop's material]\n`;
    }
    if (quantity.trim()) {
      notesPayload += `[Quantity: ${quantity.trim()} people/items]\n`;
    }
    if (remarks.trim()) {
      notesPayload += `Notes: ${remarks.trim()}`;
    }

    try {
      // The account is the customer (sign-in is required), so no name or email is sent. No payment is taken.
      const isService = kind === 'service';
      await api.post(`/catalog/${storeId}/book`, {
        kind,
        phone: !user?.phone && customer.phone ? customer.phone : undefined,
        appointment_type: appointmentType,
        purpose_label: appointmentType === 'other' ? purposeLabel.trim() : undefined,
        scheduled_at,
        notes: notesPayload.trim() || null,
        store_branch_id: selectedBranchId ? Number(selectedBranchId) : null,
        service_id: isService && selectedServiceId ? Number(selectedServiceId) : null,
        catalog_item_id: isService && refItemId ? Number(refItemId) : null,
        selected_size: isService && refItemId ? refSize : null,
        selected_color: isService && refItemId ? refColor : null,
        reference_images: refImage ? [refImage] : undefined,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      // Say what the server actually objected to (an existing active booking, a taken slot,
      // a missing answer…) instead of a generic message.
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const detail = res?.message ?? Object.values(res?.errors ?? {})[0]?.[0];
      alert(detail ? `Could not book: ${detail}` : 'Failed to book appointment. Please check all fields.');
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
    // Also true before hydrate() resolves and while a not-logged-in
    // customer is mid-redirect to /login — keeps the wizard's own content
    // from flashing in behind the redirect.
    loading: loading || !hydrated || !user,
    success,
    submitting,
    storeSettings,

    // Design / Service reference context
    refName,
    refItemId,
    refSize,
    refImage,
    refPrice,
    refColor,
    serviceIdParam,
    serviceNameParam,

    // Step 2 state
    availableBookingTypes,
    appointmentType,
    setAppointmentType,
    kind,
    setKind,
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
  };
}
