'use client';

import React, { useEffect, useState, useMemo, FormEvent } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getSavedLocation, haversineKm } from '@/lib/customerLocation';
import { MessageSquare, Ruler, Shirt, Scissors, Package } from 'lucide-react';
import {
  StoreSettings,
  PackageInfo,
  CalendarAppointment,
  BookingCustomer,
  Branch,
  Service,
  SpecialHour,
  BookingTypeOption,
} from '../types';

const VALID_APPOINTMENT_TYPES = ['consultation', 'measurement', 'fitting', 'alteration', 'pickup'];
const TYPES_REQUIRING_SERVICE = ['measurement', 'alteration'];

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
    router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }, [hydrated, user, pathname, searchParams, router]);

  // URL context parameters
  const refName = searchParams.get('ref');
  const refSize = searchParams.get('ref_size');
  const refImage = searchParams.get('ref_image');
  const refPrice = searchParams.get('ref_price');
  const refColor = searchParams.get('ref_color');
  const branchSlugParam = searchParams.get('branch');
  const serviceIdParam = searchParams.get('service_id');
  const packageIdParam = searchParams.get('package_id');
  const refTypeParam = searchParams.get('ref_type');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Data
  const [appointmentType, setAppointmentType] = useState<string>(
    refTypeParam && VALID_APPOINTMENT_TYPES.includes(refTypeParam) ? refTypeParam : 'consultation'
  );
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
  // Separate from remarks (general "Notes") — both fields now render on the
  // same step (2), so they need their own state or typing in one would show
  // up in the other. Only used when needsOrderReference is true (fitting/
  // pickup with no design reference).
  const [orderReference, setOrderReference] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // A customer arriving via a fitting/pickup deep link (e.g. staff sent them
  // a link, or an order-tracking page linked here) already carries that
  // context; everyone else starts without it and can opt in via the "I
  // already have an order" toggle so Fitting/Pickup aren't presented as
  // universal first-visit options (they only make sense against an existing
  // order/garment — see BookingTypeSelector).
  const [hasExistingOrder, setHasExistingOrder] = useState(
    refTypeParam === 'fitting' || refTypeParam === 'pickup'
  );

  // Material/fabric responsibility — a structured choice, not a new backend
  // field: encoded into the existing free-text `notes` column at submit time
  // (handleSubmit), the same bracket-tag convention already used below for
  // the design-reference/package-inquiry context.
  const [materialSource, setMaterialSource] = useState<'own' | 'shop' | ''>('');
  const [materialDescription, setMaterialDescription] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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

  const BOOKING_TYPES: BookingTypeOption[] = useMemo(
    () => [
      {
        value: 'consultation',
        label: 'Consultation',
        duration: 30,
        icon: React.createElement(MessageSquare, { size: 18 }),
        hint: 'Discuss your garment idea, fabric options, and pricing with the store.',
      },
      {
        value: 'measurement',
        label: 'Measurement',
        duration: 45,
        icon: React.createElement(Ruler, { size: 18 }),
        hint: 'Get measured in-person so your garment is cut to fit you accurately.',
      },
      {
        value: 'fitting',
        label: 'Fitting',
        duration: 45,
        icon: React.createElement(Shirt, { size: 18 }),
        hint: 'Try on your garment in progress so the store can adjust the fit.',
      },
      {
        value: 'alteration',
        label: 'Alteration',
        duration: 30,
        icon: React.createElement(Scissors, { size: 18 }),
        hint: 'Bring in an existing piece for resizing, repair, or adjustment.',
      },
      {
        value: 'pickup',
        label: 'Pickup',
        duration: 15,
        icon: React.createElement(Package, { size: 18 }),
        hint: 'Collect your finished garment or order at the store.',
      },
    ],
    []
  );

  const availableBookingTypes = useMemo(() => {
    // A design reference (a NEW catalog item the customer wants made) rules
    // out both: Pickup/Alteration only make sense against something that
    // already exists.
    if (refName) {
      return BOOKING_TYPES.filter((t) => t.value !== 'pickup' && t.value !== 'alteration');
    }
    // Otherwise, Fitting/Pickup stay hidden by default — they're
    // meaningful only once a JobOrder/appointment already exists (a fitting
    // is normally auto-created by the store when production reaches that
    // stage; pickup is typically coordinated directly with the store) — not
    // something a first-time visitor would ever pick. The "I already have an
    // order" toggle (BookingTypeSelector) reveals them for the real case of
    // a returning customer who needs to request one manually.
    return hasExistingOrder
      ? BOOKING_TYPES
      : BOOKING_TYPES.filter((t) => t.value !== 'pickup' && t.value !== 'fitting');
  }, [refName, hasExistingOrder, BOOKING_TYPES]);

  const durationMinutes = BOOKING_TYPES.find((t) => t.value === appointmentType)?.duration ?? 30;

  const branchAutoFilled = !!branchSlugParam && !!storeSettings?.branches?.some((b) => b.slug === branchSlugParam);
  const autoFilledBranch = branchAutoFilled ? storeSettings?.branches?.find((b) => b.slug === branchSlugParam) || null : null;

  // A Catalog Item's own service_id (attached to the URL by the catalog item
  // detail page whenever item.service exists) already answers "what
  // service is this" — trust that context and never re-ask, even if this
  // particular service happens to be filtered out of the general public
  // services list (e.g. deactivated after the catalog page loaded). The
  // picker only reappears when the entry point genuinely carried no service
  // context at all (serviceIdParam empty), which also covers every non-
  // catalog entry point exactly as before.
  const hasServiceContext = !!serviceIdParam;
  const needsServicePicker = !hasServiceContext && appointmentType !== 'pickup' && !!storeSettings?.services && storeSettings.services.length > 0;
  const needsOrderReference = (appointmentType === 'fitting' || appointmentType === 'pickup') && !refName;

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
      const match = branchSlugParam && branchesWithDistance.find((b) => b.slug === branchSlugParam);
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

  const selectedService = useMemo(() => {
    if (!storeSettings?.services) return null;
    return storeSettings.services.find((s) => s.id.toString() === selectedServiceId || s.id.toString() === serviceIdParam) || null;
  }, [storeSettings?.services, selectedServiceId, serviceIdParam]);

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

  const step2NextDisabled =
    !date ||
    !time ||
    !!getSpecialHoursForDate(date)?.is_closed ||
    (!!storeSettings?.branches && storeSettings.branches.length > 0 && !selectedBranchId) ||
    (TYPES_REQUIRING_SERVICE.includes(appointmentType) && needsServicePicker && !selectedServiceId);

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

    if (packageIdParam) {
      api
        .get(`/public/stores/${storeId}/service-packages`)
        .then((res) => {
          const found = (res.data.data || []).find((p: PackageInfo) => p.id.toString() === packageIdParam);
          if (found) setPackageInfo(found);
        })
        .catch((err) => console.error('Failed to fetch package details:', err));
    }

    api
      .get(`/catalog/${storeId}/appointments`)
      .then((res) => setCalendarAppointments(res.data.data || []))
      .catch((err) => console.error('Failed to fetch appointments:', err));
  }, [storeId, branchSlugParam, serviceIdParam, packageIdParam]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/public/stores/${storeId}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setPaymentReceiptUrl(res.data.data.url);
      }
    } catch (err) {
      console.error('Failed to upload receipt:', err);
      alert('Failed to upload receipt. Please make sure it is a valid image (PNG/JPG/JPEG).');
      e.target.value = '';
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const scheduled_at = `${date}T${time || '12:00'}:00`;

    let notesPayload = '';
    if (refName) {
      notesPayload += `[Design Reference: ${refName}${refPrice ? ` (₱${Number(refPrice).toLocaleString()})` : ''}${
        refSize ? ` — Size ${refSize}` : ''
      }${refColor ? ` — ${refColor}` : ''}]\n`;
    }
    if (packageInfo) {
      notesPayload += `[Package Inquiry: ${packageInfo.name} — includes ${packageInfo.services.map((s) => s.name).join(', ')}]\n`;
    }
    if (materialSource === 'own') {
      notesPayload += `[Material: Customer will bring own fabric/sample${
        materialDescription.trim() ? ` — ${materialDescription.trim()}` : ''
      }]\n`;
    } else if (materialSource === 'shop') {
      notesPayload += `[Material: Customer will use the shop's material]\n`;
    }
    if (orderReference.trim()) {
      notesPayload += `[Existing Order: ${orderReference.trim()}]\n`;
    }
    if (remarks.trim()) {
      notesPayload += `Notes: ${remarks.trim()}`;
    }

    try {
      await api.post(`/catalog/${storeId}/book`, {
        name: user ? user.name || customer.name : customer.name,
        email: user ? user.email || customer.email : customer.email,
        phone: customer.phone,
        appointment_type: appointmentType,
        scheduled_at,
        notes: notesPayload.trim() || null,
        store_branch_id: selectedBranchId ? Number(selectedBranchId) : null,
        service_id: selectedServiceId ? Number(selectedServiceId) : null,
        duration_minutes: durationMinutes,
        payment_method: paymentMethod,
        payment_reference: paymentMethod !== 'cash' ? paymentReference : null,
        payment_receipt_path: paymentMethod !== 'cash' ? paymentReceiptUrl : null,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
      });
      setSuccess(true);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      alert('Failed to book appointment. Please check all fields.');
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
    // Also true before hydrate() resolves and while a not-logged-in
    // customer is mid-redirect to /login — keeps the wizard's own content
    // from flashing in behind the redirect.
    loading: loading || !hydrated || !user,
    success,
    submitting,
    storeSettings,
    packageInfo,

    // Design reference context
    refName,
    refSize,
    refImage,
    refPrice,
    refColor,

    // Step 2 state
    availableBookingTypes,
    appointmentType,
    setAppointmentType,
    hasExistingOrder,
    setHasExistingOrder,
    needsServicePicker,
    typesRequiringService: TYPES_REQUIRING_SERVICE,
    selectedServiceId,
    setSelectedServiceId,
    needsOrderReference,
    remarks,
    setRemarks,
    orderReference,
    setOrderReference,
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
    step2NextDisabled,

    // Step 3 state
    selectedService,
    selectedBranch,
    formatDatePreview,
    formatTimePreview,
    customer,
    setCustomer,
    answers,
    setAnswers,
    paymentMethod,
    setPaymentMethod,
    paymentReference,
    setPaymentReference,
    paymentReceiptUrl,
    uploadingReceipt,
    handleReceiptUpload,
    handleSubmit,
  };
}
