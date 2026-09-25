'use client';

import React, { useEffect, useState, useMemo, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

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
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
    return refName
      ? BOOKING_TYPES.filter((t) => t.value !== 'pickup' && t.value !== 'alteration')
      : BOOKING_TYPES;
  }, [refName, BOOKING_TYPES]);

  const durationMinutes = BOOKING_TYPES.find((t) => t.value === appointmentType)?.duration ?? 30;

  const serviceAutoFilled = !!serviceIdParam && !!storeSettings?.services?.some((s) => s.id.toString() === serviceIdParam);
  const branchAutoFilled = !!branchSlugParam && !!storeSettings?.branches?.some((b) => b.slug === branchSlugParam);
  const autoFilledBranch = branchAutoFilled ? storeSettings?.branches?.find((b) => b.slug === branchSlugParam) || null : null;

  const needsServicePicker = !serviceAutoFilled && appointmentType !== 'pickup' && !!storeSettings?.services && storeSettings.services.length > 0;
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
    if (!selectedBranchId || !storeSettings?.branches) return null;
    return storeSettings.branches.find((b) => String(b.id) === selectedBranchId) || null;
  }, [selectedBranchId, storeSettings?.branches]);

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
    loading,
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
    needsServicePicker,
    typesRequiringService: TYPES_REQUIRING_SERVICE,
    selectedServiceId,
    setSelectedServiceId,
    needsOrderReference,
    remarks,
    setRemarks,
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
