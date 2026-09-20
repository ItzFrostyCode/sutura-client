'use client';

import { useEffect, useState, useMemo, FormEvent, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Ruler,
  Shirt,
  Scissors,
  Package,
  AlertCircle,
  MapPin,
  Loader2,
  ChevronRight,
  Sparkles,
  Edit2,
  Phone,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';
import { getSavedLocation, haversineKm } from '@/lib/customerLocation';

function BookingHeader({ onBack }: { readonly onBack: () => void }) {
  return (
    <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-10 flex items-center justify-center relative">
      <button type="button" onClick={onBack} aria-label="Back" className="absolute left-4 p-1 text-ink-muted cursor-pointer">
        <ArrowLeft size={18} />
      </button>
      <h1 className="text-sm font-bold text-ink">Book an Appointment</h1>
    </div>
  );
}

interface Branch {
  id: number;
  slug?: string;
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Service {
  id: number;
  name: string;
  base_price?: string | number;
  estimated_days?: number;
  description?: string | null;
}

interface ShopSettings {
  name: string;
  description?: string | null;
  business_type?: string | null;
  specializations?: string[] | null;
  gcash_number?: string | null;
  gcash_account_name?: string | null;
  gcash_qr_path?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_qr_path?: string | null;
  fitting_fee?: number | string | null;
  booking_policy?: string | null;
  booking_questions?: string[] | null;
  max_appointments_per_day?: number | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }> | string | null;
  branches?: Branch[];
  services?: Service[];
  special_hours?: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
  }[];
}

interface PackageInfo {
  id: number;
  name: string;
  bundle_price: string | null;
  services: { id: number; name: string; base_price: string | null }[];
}

function BookingWizardContent({ params }: Readonly<{ params: Promise<{ shop_id: string }> }>) {
  const { shop_id: shopId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const VALID_APPOINTMENT_TYPES = ['consultation', 'measurement', 'fitting', 'alteration', 'pickup'];
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
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
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [isEditingCustomer] = useState(false); // kept for guest compat, unused for logged-in
  const [remarks, setRemarks] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Payment State (for shops with a fitting reservation fee)
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Anonymized calendar appointment slots
  const [calendarAppointments, setCalendarAppointments] = useState<{ scheduled_at: string; duration_minutes: number; shop_branch_id: number | null }[]>([]);

  // Automatically pre-fill authenticated user data
  useEffect(() => {
    if (!user) return;
    setCustomer(prev => ({
      name: user.name || prev.name || '',
      email: user.email || prev.email || '',
      phone: prev.phone || user.phone || '',
    }));
  }, [user]);

  // User Location (for Proximity-based Nearest Branch sorting)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const loc = getSavedLocation();
    if (loc) {
      setUserLocation({ lat: loc.lat, lng: loc.lng });
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const TYPES_REQUIRING_SERVICE = ['measurement', 'alteration'];
  const BOOKING_TYPES = [
    { value: 'consultation', label: 'Consultation', duration: 30, icon: <MessageSquare size={18} />, hint: 'Discuss your garment idea, fabric options, and pricing with the shop.' },
    { value: 'measurement', label: 'Measurement', duration: 45, icon: <Ruler size={18} />, hint: 'Get measured in-person so your garment is cut to fit you accurately.' },
    { value: 'fitting', label: 'Fitting', duration: 45, icon: <Shirt size={18} />, hint: 'Try on your garment in progress so the shop can adjust the fit.' },
    { value: 'alteration', label: 'Alteration', duration: 30, icon: <Scissors size={18} />, hint: 'Bring in an existing piece for resizing, repair, or adjustment.' },
    { value: 'pickup', label: 'Pickup', duration: 15, icon: <Package size={18} />, hint: 'Collect your finished garment or order at the shop.' },
  ];

  const AVAILABLE_BOOKING_TYPES = refName
    ? BOOKING_TYPES.filter(t => t.value !== 'pickup' && t.value !== 'alteration')
    : BOOKING_TYPES;

  const durationMinutes = BOOKING_TYPES.find(t => t.value === appointmentType)?.duration ?? 30;

  const serviceAutoFilled = !!serviceIdParam && !!shopSettings?.services?.some(s => s.id.toString() === serviceIdParam);
  const branchAutoFilled = !!branchSlugParam && !!shopSettings?.branches?.some(b => b.slug === branchSlugParam);
  const autoFilledBranch = branchAutoFilled ? shopSettings?.branches?.find(b => b.slug === branchSlugParam) : null;

  const needsServicePicker = !serviceAutoFilled && appointmentType !== 'pickup' && !!shopSettings?.services && shopSettings.services.length > 0;
  const needsOrderReference = (appointmentType === 'fitting' || appointmentType === 'pickup') && !refName;

  // Streamlined 3-step appointment wizard
  const totalSteps = 3;
  const displayStep = step;
  const prevStep = step - 1;

  // Proximity-sorted branches
  const branchesWithDistance = useMemo(() => {
    if (!shopSettings?.branches) return [];
    return shopSettings.branches.map(b => {
      let distanceKm: number | null = null;
      if (userLocation && b.latitude != null && b.longitude != null) {
        distanceKm = haversineKm(userLocation.lat, userLocation.lng, Number(b.latitude), Number(b.longitude));
      }
      return { ...b, distanceKm };
    }).sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });
  }, [shopSettings?.branches, userLocation]);

  // Pre-select nearest branch or branch from query param
  useEffect(() => {
    if (!selectedBranchId && branchesWithDistance.length > 0) {
      const match = branchSlugParam && branchesWithDistance.find(b => b.slug === branchSlugParam);
      if (match) {
        setSelectedBranchId(String(match.id));
      } else {
        setSelectedBranchId(String(branchesWithDistance[0].id));
      }
    }
  }, [branchesWithDistance, selectedBranchId, branchSlugParam]);

  const selectedBranch = useMemo(() => {
    if (!selectedBranchId || !shopSettings?.branches) return null;
    return shopSettings.branches.find(b => String(b.id) === selectedBranchId) || null;
  }, [selectedBranchId, shopSettings?.branches]);

  const selectedService = useMemo(() => {
    if (!shopSettings?.services) return null;
    return shopSettings.services.find(s => s.id.toString() === selectedServiceId || s.id.toString() === serviceIdParam) || null;
  }, [shopSettings?.services, selectedServiceId, serviceIdParam]);

  const parsedOperatingHours = useMemo(() => {
    if (!shopSettings?.operating_hours) return null;
    if (typeof shopSettings.operating_hours === 'string') {
      try {
        return JSON.parse(shopSettings.operating_hours);
      } catch {
        return null;
      }
    }
    return shopSettings.operating_hours as Record<string, { is_open: boolean; open: string; close: string }>;
  }, [shopSettings?.operating_hours]);

  // Helper date/time formatters for summary
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

  const getSpecialHoursForDate = (dateStr: string) => {
    if (!shopSettings?.special_hours) return null;
    return shopSettings.special_hours.find(s => dateStr >= s.start_date && dateStr <= s.end_date) || null;
  };

  const step2NextDisabled = !date
    || !time
    || !!getSpecialHoursForDate(date)?.is_closed
    || (!!shopSettings?.branches && shopSettings.branches.length > 0 && !selectedBranchId)
    || (TYPES_REQUIRING_SERVICE.includes(appointmentType) && needsServicePicker && !selectedServiceId);

  useEffect(() => {
    if (!shopId) return;

    api.get(`/catalog/${shopId}/booking-settings`)
      .then(res => {
        const settings = res.data.data;
        setShopSettings(settings);

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
      .catch(err => {
        console.error('Failed to load booking settings:', err);
        setLoading(false);
      });

    if (packageIdParam) {
      api.get(`/public/shops/${shopId}/service-packages`)
        .then(res => {
          const found = (res.data.data || []).find((p: PackageInfo) => p.id.toString() === packageIdParam);
          if (found) setPackageInfo(found);
        })
        .catch(err => console.error('Failed to fetch package details:', err));
    }

    api.get(`/catalog/${shopId}/appointments`)
      .then(res => setCalendarAppointments(res.data.data || []))
      .catch(err => console.error('Failed to fetch appointments:', err));
  }, [shopId, branchSlugParam, serviceIdParam, packageIdParam]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/public/shops/${shopId}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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

    // Compile design reference, package, and user notes
    let notesPayload = '';
    if (refName) {
      notesPayload += `[Design Reference: ${refName}${refPrice ? ` (₱${Number(refPrice).toLocaleString()})` : ''}${refSize ? ` — Size ${refSize}` : ''}${refColor ? ` — ${refColor}` : ''}]\n`;
    }
    if (packageInfo) {
      notesPayload += `[Package Inquiry: ${packageInfo.name} — includes ${packageInfo.services.map(s => s.name).join(', ')}]\n`;
    }
    if (remarks.trim()) {
      notesPayload += `Notes: ${remarks.trim()}`;
    }

    try {
      await api.post(`/catalog/${shopId}/book`, {
        name: user ? (user.name || customer.name) : customer.name,
        email: user ? (user.email || customer.email) : customer.email,
        phone: customer.phone,
        appointment_type: appointmentType,
        scheduled_at,
        notes: notesPayload.trim() || null,
        shop_branch_id: selectedBranchId ? Number(selectedBranchId) : null,
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

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col bg-canvas text-ink">
        <BookingHeader onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="text-taupe animate-spin" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col bg-canvas text-ink">
        <BookingHeader onBack={() => router.push(`/shop/${shopId}?tab=catalog`)} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface p-8 rounded-2xl text-center border border-line">
            <div className="w-16 h-16 bg-sage/20 text-sage rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-ink-muted mb-8 text-sm">
              Your appointment request has been sent to {shopSettings?.name}. They will review and confirm your slot shortly.
            </p>
            <button
              onClick={() => router.push(`/shop/${shopId}?tab=catalog`)}
              className="w-full bg-sunken hover:bg-line text-ink font-medium py-3 rounded-lg transition-colors cursor-pointer text-sm"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas text-ink">
      <BookingHeader onBack={() => (step > 1 ? setStep(prevStep) : router.back())} />
      <div className="flex-1 py-[10px] px-[10px] pb-24">
        <div className="w-full max-w-xl mx-auto">
          {/* Header Context & Step Progress */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{shopSettings?.name}</p>
              {branchAutoFilled && autoFilledBranch && (
                <p className="flex items-center gap-1 text-xs text-ink-faint mt-0.5">
                  <MapPin size={11} className="text-taupe shrink-0" />
                  {autoFilledBranch.name}
                </p>
              )}
            </div>
            <div className="text-xs font-semibold text-ink-faint bg-sunken border border-line px-2.5 py-1 rounded-full">
              Step {displayStep} of {totalSteps}
            </div>
          </div>

          {/* Compact Design Reference Preview for Steps 1 & 2 */}
          {refName && step < 3 && (
            <div className="mb-5 bg-surface border border-line rounded-xl shadow-xs p-3 flex items-center gap-3">
              {refImage && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
                  <Image src={getMediaUrl(refImage)} alt={refName} fill unoptimized className="object-cover object-top" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">Design Reference</span>
                  {refPrice && (
                    <span className="text-xs font-bold text-ink">₱{Number(refPrice).toLocaleString()}</span>
                  )}
                </div>
                <h3 className="font-semibold text-xs text-ink truncate mt-0.5">{refName}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
                  {refSize && <span className="text-ink-faint">Size {refSize}</span>}
                  {refSize && refColor && <span>•</span>}
                  {refColor && <span>{refColor}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Compact Package Summary Preview for Steps 1 & 2 */}
          {packageInfo && step < 3 && (
            <div className="mb-5 bg-surface border border-taupe/30 rounded-xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">Package Inquiry</span>
              <div className="flex items-center justify-between mt-0.5">
                <h3 className="font-semibold text-xs text-ink">{packageInfo.name}</h3>
                <span className="text-xs font-bold text-taupe">
                  ₱{(packageInfo.bundle_price
                    ? Number(packageInfo.bundle_price)
                    : packageInfo.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div>
            {/* STEP 1: SERVICE DETAILS & POLICY */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-sm font-bold text-ink">Service Details & Policy</h2>
                
                <div className="prose prose-invert max-w-none text-xs text-ink-body bg-surface border border-line p-4 rounded-xl leading-relaxed">
                  {shopSettings?.booking_policy ? (
                    <div className="whitespace-pre-wrap">{shopSettings.booking_policy}</div>
                  ) : (
                    <p className="italic text-ink-faint">No specific booking policy provided by this shop. Walk-in consultations and fittings are welcome during operating hours.</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: APPOINTMENT TYPE, BRANCH & SCHEDULE */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-sm font-bold text-ink">Appointment Type & Schedule</h2>

                {/* Appointment Type Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-ink-body block">
                    What are you coming in for? <span className="text-danger">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {AVAILABLE_BOOKING_TYPES.map(t => (
                      <button
                        type="button"
                        key={t.value}
                        onClick={() => setAppointmentType(t.value)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                          appointmentType === t.value
                            ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20'
                            : 'border-line bg-surface hover:border-taupe/40'
                        }`}
                      >
                        <span className={`${appointmentType === t.value ? 'text-taupe' : 'text-ink-faint'}`}>{t.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${appointmentType === t.value ? 'text-ink' : 'text-ink-body'}`}>
                            {t.label}
                          </p>
                          <p className="text-[11px] text-ink-faint mt-0.5">{t.hint}</p>
                        </div>
                        <ChevronRight size={16} className={`shrink-0 ${appointmentType === t.value ? 'text-taupe' : 'text-ink-faint'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Selector — Required for measurement/alteration, Optional for general consultation */}
                {needsServicePicker && (
                  <div className="space-y-1.5 pt-1">
                    <label htmlFor="booking-service" className="text-xs font-semibold text-ink-body block">
                      Service {TYPES_REQUIRING_SERVICE.includes(appointmentType) ? <span className="text-danger">*</span> : <span className="text-ink-faint">(Optional)</span>}
                    </label>
                    <select
                      id="booking-service"
                      value={selectedServiceId}
                      required={TYPES_REQUIRING_SERVICE.includes(appointmentType)}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-taupe"
                    >
                      <option value="">
                        {TYPES_REQUIRING_SERVICE.includes(appointmentType)
                          ? 'Select a service...'
                          : 'No specific service (General Consultation)'}
                      </option>
                      {shopSettings?.services?.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.base_price ? `(₱${Number(s.base_price).toLocaleString()})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Order Reference Input — Only for generic Fittings and Pickups without an item reference */}
                {needsOrderReference && (
                  <div className="space-y-1.5 pt-1">
                    <label htmlFor="booking-order-reference" className="text-xs font-semibold text-ink-body block">
                      Ongoing Order Number or Garment Description <span className="text-danger">*</span>
                    </label>
                    <input
                      id="booking-order-reference"
                      type="text"
                      placeholder="e.g. Order #1002 or Blue Wedding Gown"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value.slice(0, 120))}
                      className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-taupe"
                    />
                    <p className="text-[11px] text-ink-faint">
                      {appointmentType === 'pickup'
                        ? 'Tell the shop which finished order you’re coming to collect.'
                        : 'Tell the designer which ongoing order you are coming in to fit.'}
                    </p>
                  </div>
                )}

                {/* Branch Selection or Confirmation */}
                {shopSettings?.branches && shopSettings.branches.length > 1 && !(branchAutoFilled && autoFilledBranch) ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-ink-body block">
                        Select Branch <span className="text-danger">*</span>
                      </label>
                      {userLocation && (
                        <span className="text-[11px] text-ink-faint flex items-center gap-1">
                          <MapPin size={11} className="text-taupe" /> Sorted by nearest
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {branchesWithDistance.map((b) => {
                        const isSelected = selectedBranchId === String(b.id);
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBranchId(String(b.id))}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex items-start gap-3 ${
                              isSelected
                                ? 'border-taupe bg-taupe/5 ring-2 ring-taupe/20'
                                : 'border-line bg-surface hover:border-taupe/40'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-taupe bg-taupe' : 'border-line bg-surface'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-semibold ${isSelected ? 'text-ink' : 'text-ink-body'}`}>
                                  {b.name}
                                </p>
                                {b.distanceKm !== null && (
                                  <span className="text-[10px] text-taupe font-medium shrink-0">
                                    {b.distanceKm < 1 ? `${Math.round(b.distanceKm * 1000)}m away` : `${b.distanceKm.toFixed(1)} km away`}
                                  </span>
                                )}
                              </div>
                              {b.address && (
                                <p className="text-[11px] text-ink-faint mt-0.5 line-clamp-1">{b.address}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : shopSettings?.branches && shopSettings.branches.length === 1 ? (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-ink-body block">Branch Location</label>
                    <div className="p-3 bg-surface border border-line rounded-xl flex items-center gap-2.5">
                      <MapPin size={16} className="text-taupe shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink">{shopSettings.branches[0].name}</p>
                        {shopSettings.branches[0].address && (
                          <p className="text-[11px] text-ink-faint mt-0.5">{shopSettings.branches[0].address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Interactive Date & Time Picker */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-ink-body block">
                    Select Date & Time <span className="text-danger">*</span>
                  </label>
                  <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm">
                    <InteractiveCalendar
                      selectedDate={date}
                      selectedTime={time}
                      operatingHours={parsedOperatingHours}
                      specialHours={shopSettings?.special_hours || null}
                      appointments={calendarAppointments}
                      selectedBranchId={selectedBranchId || null}
                      durationMinutes={durationMinutes}
                      onDateChange={setDate}
                      onTimeChange={setTime}
                    />
                  </div>
                </div>

                {(() => {
                  if (!date) return null;
                  const special = getSpecialHoursForDate(date);
                  if (!special) return null;

                  if (special.is_closed) {
                    return (
                      <div className="bg-danger/10 border border-danger/20 rounded-xl p-3.5 flex gap-2.5 text-xs text-danger animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Temporarily Closed ({special.title})</p>
                          <p className="mt-0.5">We are fully closed on this date. Please choose a different date for your appointment.</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-2.5 text-xs text-ink-body animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Special Holiday Hours ({special.title})</p>
                          <p className="mt-0.5">Custom hours for this date: {special.special_open_time} - {special.special_close_time}.</p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* STEP 3: REVIEW & CONFIRM (FINAL STEP) */}
            {step === 3 && (
              <form id="booking-form" onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                
                {/* 1. Design Reference OR Selected Service OR Package Summary Card */}
                {refName ? (
                  <div className="p-3.5 bg-surface border border-line rounded-xl space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-taupe" /> Design Reference
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {refImage && (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
                          <Image src={getMediaUrl(refImage)} alt={refName} fill unoptimized className="object-cover object-top" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-xs text-ink truncate">{refName}</h3>
                          {refPrice && (
                            <span className="text-xs font-bold text-taupe shrink-0">₱{Number(refPrice).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-muted">
                          <span className="bg-sunken border border-line rounded px-1.5 py-0.5 text-[10px] font-medium text-ink">
                            {refSize ? `Size ${refSize}` : 'No size'}
                          </span>
                          {refColor && <span>{refColor}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedService ? (
                  <div className="p-3.5 bg-surface border border-line rounded-xl space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
                        <Scissors size={12} className="text-taupe" /> Selected Service
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} /> Change
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-ink">{selectedService.name}</h3>
                      {selectedService.base_price && (
                        <span className="text-xs font-bold text-taupe">₱{Number(selectedService.base_price).toLocaleString()}</span>
                      )}
                    </div>
                    {selectedService.description && (
                      <p className="text-[11px] text-ink-muted line-clamp-2">{selectedService.description}</p>
                    )}
                  </div>
                ) : packageInfo ? (
                  <div className="p-3.5 bg-surface border border-taupe/30 rounded-xl space-y-1.5 shadow-xs">
                    <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
                      <Package size={12} className="text-taupe" /> Package Inquiry
                    </span>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-ink">{packageInfo.name}</h3>
                      <span className="text-xs font-bold text-taupe">
                        ₱{(packageInfo.bundle_price
                          ? Number(packageInfo.bundle_price)
                          : packageInfo.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      Includes: {packageInfo.services.map(s => s.name).join(', ')}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-surface border border-line rounded-xl space-y-1.5 shadow-xs">
                    <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={12} className="text-taupe" /> Appointment Purpose
                    </span>
                    <h3 className="text-xs font-bold text-ink capitalize">{appointmentType} Consultation</h3>
                    <p className="text-[11px] text-ink-muted">Shop consultation and fitting service.</p>
                  </div>
                )}

                {/* 2. Appointment Schedule & Branch Summary Card */}
                <div className="p-3.5 bg-surface border border-line rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} className="text-taupe" /> Appointment Schedule
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={11} /> Edit Schedule
                    </button>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-taupe shrink-0" />
                      <span className="text-ink font-semibold">
                        {formatDatePreview(date)} • {formatTimePreview(time)}
                      </span>
                    </div>
                    {selectedBranch && (
                      <div className="flex items-start gap-2 text-ink-muted">
                        <MapPin size={13} className="text-taupe shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-ink">{selectedBranch.name}</span>
                          {selectedBranch.address && <p className="text-[11px] text-ink-faint">{selectedBranch.address}</p>}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-ink-muted pt-0.5">
                      <CheckCircle2 size={13} className="text-taupe shrink-0" />
                      <span>Purpose: <span className="font-medium text-ink capitalize">{appointmentType}</span></span>
                    </div>
                  </div>
                </div>

                {/* 3. Customer Contact Information */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-ink">Contact Details</h2>

                  {user ? (
                    /* Logged-in user — name+email always locked, phone always editable */
                    <div className="p-3.5 bg-surface border border-line rounded-xl space-y-3 shadow-xs">
                      {/* Name — locked */}
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-taupe/15 border border-taupe/30 flex items-center justify-center text-taupe font-bold text-sm shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-bold text-ink truncate">{user.name}</p>
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted truncate mt-0.5 flex items-center gap-1">
                            <Mail size={11} className="text-ink-faint shrink-0" />
                            <span>{user.email}</span>
                          </p>
                        </div>
                      </div>

                      {/* Phone — always editable */}
                      <div className="pt-2.5 border-t border-line/60">
                        <label htmlFor="customer-quick-phone" className="text-xs font-semibold text-ink-body flex items-center gap-1 mb-1.5">
                          <Phone size={12} className="text-taupe" /> Contact Number
                        </label>
                        <input
                          id="customer-quick-phone"
                          type="tel"
                          value={customer.phone}
                          onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="e.g. 0912 345 6789"
                          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-taupe"
                        />
                        <p className="text-[10px] text-ink-faint mt-1">Para sa appointment updates at SMS notifications.</p>
                      </div>
                    </div>
                  ) : (
                    /* Guest form */
                    <div className="space-y-3 p-3.5 bg-surface border border-line rounded-xl animate-in fade-in">
                      <p className="text-xs text-ink-muted mb-1">
                        Pakilagay ang inyong impormasyon upang makipag-ugnayan ang sastre para sa inyong appointment.
                      </p>
                      <div>
                        <label htmlFor="customer-name" className="text-xs font-semibold text-ink-body mb-1 block">Full Name *</label>
                        <input 
                          id="customer-name"
                          type="text" required
                          value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})}
                          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-taupe"
                        />
                      </div>
                      <div>
                        <label htmlFor="customer-email" className="text-xs font-semibold text-ink-body mb-1 block">Email Address *</label>
                        <input 
                          id="customer-email"
                          type="email" required
                          value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})}
                          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-taupe"
                        />
                      </div>
                      <div>
                        <label htmlFor="customer-phone" className="text-xs font-semibold text-ink-body mb-1 block">Contact Number</label>
                        <input 
                          id="customer-phone"
                          type="tel" 
                          value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                          placeholder="e.g. 0912 345 6789"
                          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-taupe"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Notes Field (120-character limit) */}
                <div className="pt-3 border-t border-line">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="customer-notes" className="text-xs font-semibold text-ink-body block">
                      Notes
                    </label>
                    <span className={`text-[11px] ${remarks.length >= 120 ? 'text-danger font-semibold' : 'text-ink-faint'}`}>
                      {remarks.length} / 120
                    </span>
                  </div>
                  <textarea 
                    id="customer-notes"
                    rows={3}
                    maxLength={120}
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value.slice(0, 120))}
                    placeholder="Specify the details..."
                    className="w-full bg-canvas border border-line rounded-lg px-3.5 py-2.5 text-ink text-xs focus:outline-none focus:border-taupe resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-ink-faint mt-1">
                    Maglagay ng maikling paalala o detalye para sa iyong appointment visit.
                  </p>
                </div>

                {/* 5. Additional Information (if configured) */}
                {shopSettings?.booking_questions && shopSettings.booking_questions.length > 0 && (
                  <div className="pt-3 space-y-3 border-t border-line">
                    <h3 className="text-xs font-semibold text-ink">Additional Information</h3>
                    {shopSettings.booking_questions.map((question: string, idx: number) => (
                      <div key={question}>
                        <label htmlFor={`question-${idx}`} className="text-xs font-semibold text-ink-body mb-1 block">{question}</label>
                        <input 
                          id={`question-${idx}`}
                          type="text"
                          required
                          value={answers[question] || ''} 
                          onChange={(e) => setAnswers({...answers, [question]: e.target.value})}
                          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-taupe"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. Fitting Reservation Fee (if applicable) */}
                {Number(shopSettings?.fitting_fee) > 0 && (
                  <div className="pt-3 border-t border-line space-y-3">
                    <h3 className="text-xs font-semibold text-ink">Fitting Reservation Fee</h3>
                    <p className="text-[11px] text-ink-muted">
                      This shop charges a ₱{Number(shopSettings?.fitting_fee).toLocaleString()} fee to reserve this slot. Select how you&apos;d like to pay it.
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'cash', label: 'Cash at Shop' },
                        { value: 'gcash', label: 'GCash' },
                        { value: 'bank', label: 'Bank Transfer' },
                      ].map(m => (
                        <button
                          type="button"
                          key={m.value}
                          onClick={() => setPaymentMethod(m.value)}
                          className={`p-2.5 text-center rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            paymentMethod === m.value
                              ? 'border-taupe bg-taupe/10 text-taupe'
                              : 'border-line bg-surface text-ink-muted hover:border-taupe/40'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {paymentMethod !== 'cash' && (
                      <div className="space-y-3 p-3 bg-surface border border-line rounded-xl text-xs">
                        {paymentMethod === 'gcash' && (shopSettings?.gcash_number || shopSettings?.gcash_qr_path) ? (
                          <div>
                            <p className="text-ink-muted">
                              Please send payment to {shopSettings.name}&apos;s GCash:
                            </p>
                            {shopSettings.gcash_account_name && <p className="font-semibold text-ink mt-0.5">{shopSettings.gcash_account_name}</p>}
                            {shopSettings.gcash_number && <p className="font-mono text-sm font-bold text-taupe mt-0.5">{shopSettings.gcash_number}</p>}
                            {shopSettings.gcash_qr_path && (
                              <div className="mt-2 w-32 h-32 relative border border-line rounded-lg overflow-hidden mx-auto bg-white">
                                <Image src={getMediaUrl(shopSettings.gcash_qr_path)} alt="GCash QR" fill unoptimized className="object-contain p-1" />
                              </div>
                            )}
                          </div>
                        ) : paymentMethod === 'bank' && (shopSettings?.bank_account_number || shopSettings?.bank_qr_path) ? (
                          <div>
                            <p className="text-ink-muted">
                              Please send payment to {shopSettings.name}&apos;s bank:
                            </p>
                            {shopSettings.bank_name && <p className="font-semibold text-ink mt-0.5">{shopSettings.bank_name}</p>}
                            {shopSettings.bank_account_name && <p className="text-ink-muted mt-0.5">{shopSettings.bank_account_name}</p>}
                            {shopSettings.bank_account_number && <p className="font-mono text-sm font-bold text-taupe mt-0.5">{shopSettings.bank_account_number}</p>}
                            {shopSettings.bank_qr_path && (
                              <div className="mt-2 w-32 h-32 relative border border-line rounded-lg overflow-hidden mx-auto bg-white">
                                <Image src={getMediaUrl(shopSettings.bank_qr_path)} alt="Bank QR" fill unoptimized className="object-contain p-1" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-ink-muted italic">
                            This shop hasn&apos;t set up their {paymentMethod === 'gcash' ? 'GCash' : 'Bank'} details yet — please confirm where to send payment with the shop directly.
                          </p>
                        )}

                        <div className="space-y-2 pt-2 border-t border-line/60">
                          <div>
                            <label htmlFor="payment-ref" className="text-xs font-semibold text-ink-body mb-1 block">Reference Number (Optional)</label>
                            <input
                              id="payment-ref"
                              type="text"
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                              placeholder="e.g. 100234812"
                              className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-taupe"
                            />
                          </div>
                          <div>
                            <label htmlFor="receipt-upload" className="text-xs font-semibold text-ink-body mb-1 block">Proof of Payment / Receipt (Optional)</label>
                            <input
                              id="receipt-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              className="w-full text-xs text-ink file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-taupe file:text-white hover:file:bg-taupe-hover cursor-pointer"
                            />
                            {uploadingReceipt && <p className="text-[10px] text-taupe mt-1">Uploading receipt...</p>}
                            {paymentReceiptUrl && <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 size={10} /> Receipt attached</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>

    {/* Shared Anchored Bottom Action Bar */}
    <div
      className="sticky bottom-0 left-0 right-0 z-40 bg-surface border-t border-line p-3 mt-auto shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-xl mx-auto">
        {step === 1 && (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full bg-taupe hover:bg-taupe-hover text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            Agree & Continue <ArrowRight size={16} />
          </button>
        )}
        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={step2NextDisabled}
            className="w-full bg-taupe hover:bg-taupe-hover text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
          >
            Review & Confirm <ArrowRight size={16} />
          </button>
        )}
        {step === 3 && (
          <button
            type="submit"
            form="booking-form"
            disabled={submitting || uploadingReceipt}
            className="w-full bg-taupe hover:bg-taupe-hover text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-xs"
          >
            {submitting ? 'Processing...' : uploadingReceipt ? 'Uploading receipt...' : 'Confirm Booking'}
          </button>
        )}
      </div>
    </div>
  </div>
  );
}

export default function BookingWizard({ params }: Readonly<{ params: Promise<{ shop_id: string }> }>) {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex flex-col bg-canvas text-ink">
        <BookingHeader onBack={() => window.history.back()} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="text-taupe animate-spin" />
        </div>
      </div>
    }>
      <BookingWizardContent params={params} />
    </Suspense>
  );
}
