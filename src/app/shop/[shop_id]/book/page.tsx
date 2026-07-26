'use client';

import { useEffect, useState, FormEvent, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, Ruler, Shirt, Scissors, Package, AlertCircle, MapPin, Upload, X, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import InteractiveCalendar from '@/components/shared/InteractiveCalendar';

interface Branch {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
}

interface Service {
  id: number;
  name: string;
  base_price?: string | number;
  estimated_days?: number;
}

interface ShopSettings {
  name: string;
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
  // Design Reference — a catalog item the customer is inquiring about, passed
  // through as plain inspiration context (name/size), not something ordered
  // directly. The shop owner creates the actual Job Order after consultation.
  const refName = searchParams.get('ref');
  const refSize = searchParams.get('ref_size');
  const branchIdParam = searchParams.get('branch_id');
  const serviceIdParam = searchParams.get('service_id');
  const packageIdParam = searchParams.get('package_id');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Data
  const [appointmentType, setAppointmentType] = useState<string>('consultation');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [remarks, setRemarks] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Bulk/Custom Order — reference photos + an optional link (Drive/YouTube)
  // instead of native video upload, which would be far costlier to host.
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceLink, setReferenceLink] = useState('');
  const [uploadingReference, setUploadingReference] = useState(false);

  // Anonymized existing appointment slots, for the availability calendar —
  // fetched here (not inside InteractiveCalendar) since that's now a shared
  // UI widget reused by the owner's dashboard too, which fetches its own
  // (non-anonymized) appointment list instead.
  const [calendarAppointments, setCalendarAppointments] = useState<{ scheduled_at: string; duration_minutes: number; shop_branch_id: number | null }[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    const load = async () => {
      setLoadingAppts(true);
      try {
        const res = await api.get(`/catalog/${shopId}/appointments`);
        setCalendarAppointments(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      } finally {
        setLoadingAppts(false);
      }
    };
    void load();
  }, [shopId]);

  const getSpecialHoursForDate = (dateStr: string) => {
    if (!shopSettings?.special_hours) return null;
    return shopSettings.special_hours.find(s => dateStr >= s.start_date && dateStr <= s.end_date) || null;
  };

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
      console.error('Failed to upload receipt image:', err);
      alert('Failed to upload receipt. Please make sure it is a valid image (PNG/JPG/JPEG).');
      // Reset so the input doesn't look "filled" from a failed upload —
      // otherwise the browser still shows a selected filename even though
      // paymentReceiptUrl was never actually set.
      e.target.value = '';
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (referenceImages.length >= 10) {
      alert('Maximum of 10 reference images.');
      return;
    }

    setUploadingReference(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/public/shops/${shopId}/upload-reference-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setReferenceImages(prev => [...prev, res.data.data.url]);
      }
    } catch (err) {
      console.error('Failed to upload reference image:', err);
      alert('Failed to upload image. Please make sure it is a valid image (PNG/JPG/JPEG).');
    } finally {
      setUploadingReference(false);
    }
  };

  const removeReferenceImage = (url: string) => {
    setReferenceImages(prev => prev.filter(u => u !== url));
  };

  const TYPES_REQUIRING_SERVICE = ['measurement', 'alteration'];
  const BOOKING_TYPES = [
    { value: 'consultation', label: 'Consultation', icon: <MessageSquare size={18} />, hint: 'Discuss your garment idea with the shop' },
    { value: 'measurement', label: 'Measurement',  icon: <Ruler size={18} />,        hint: 'Get your body measurements taken' },
    { value: 'fitting',     label: 'Fitting',       icon: <Shirt size={18} />,         hint: 'Try on your garment for fitting' },
    { value: 'alteration',  label: 'Alteration',    icon: <Scissors size={18} />,      hint: 'Adjust an existing garment' },
    { value: 'pickup',      label: 'Pickup',         icon: <Package size={18} />,       hint: 'Collect your finished order at the shop' },
  ];

  useEffect(() => {
    // Fetch shop settings
    api.get(`/catalog/${shopId}/booking-settings`)
      .then(res => {
        const settings = res.data.data;
        setShopSettings(settings);

        // Prefer an explicit branch_id/service_id from the URL (arrived via a
        // branch's "Book Here" link or a service/package's "Book Appointment"
        // link) — only fall back to auto-selecting the sole branch otherwise.
        if (branchIdParam && settings?.branches?.some((b: Branch) => b.id.toString() === branchIdParam)) {
          setSelectedBranchId(branchIdParam);
        } else if (settings?.branches && settings.branches.length === 1) {
          setSelectedBranchId(settings.branches[0].id.toString());
        }

        if (serviceIdParam && settings?.services?.some((s: Service) => s.id.toString() === serviceIdParam)) {
          setSelectedServiceId(serviceIdParam);
        }

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch package details if provided in query params — packages aren't a
    // single-service booking, so this just shows a summary card and tags the
    // inquiry notes rather than trying to select a service_id from it.
    if (packageIdParam) {
      api.get(`/public/shops/${shopId}/service-packages`)
        .then(res => {
          const found = (res.data.data || []).find((p: PackageInfo) => p.id.toString() === packageIdParam);
          if (found) setPackageInfo(found);
        })
        .catch(err => {
          console.error('Failed to fetch package details:', err);
        });
    }
  }, [shopId, branchIdParam, serviceIdParam, packageIdParam]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const scheduled_at = `${date}T${time || '12:00'}:00`;

    // Compile remarks and catalog reference / package context
    let notesPayload = '';
    if (refName) {
      notesPayload += `[Design Reference: ${refName}${refSize ? ` — Size ${refSize}` : ''}]\n`;
    }
    if (packageInfo) {
      notesPayload += `[Package Inquiry: ${packageInfo.name} — includes ${packageInfo.services.map(s => s.name).join(', ')}]\n`;
    }
    if (remarks.trim()) {
      notesPayload += `Remarks: ${remarks}`;
    }

    try {
      await api.post(`/catalog/${shopId}/book`, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        appointment_type: appointmentType,
        scheduled_at,
        notes: notesPayload || null,
        reference_images: appointmentType === 'consultation' && referenceImages.length ? referenceImages : null,
        reference_link: appointmentType === 'consultation' && referenceLink.trim() ? referenceLink.trim() : null,
        answers,
        shop_branch_id: selectedBranchId ? Number(selectedBranchId) : null,
        service_id: selectedServiceId ? Number(selectedServiceId) : null,
        duration_minutes: Number(durationMinutes),
        payment_method: paymentMethod,
        payment_reference: paymentMethod !== 'cash' ? paymentReference : null,
        payment_receipt_path: paymentMethod !== 'cash' ? paymentReceiptUrl : null,
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#2D2A26]">Loading booking system...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF6F3] text-[#2D2A26] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-sm p-8 rounded-2xl text-center border border-[#EBE6E0]">
          <div className="w-16 h-16 bg-[#7A8B76]/20 text-[#7A8B76] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-[#827A73] mb-8">
            Your appointment request has been sent to {shopSettings?.name}. They will review it shortly.
          </p>
          <button 
            onClick={() => router.push(`/shop/${shopId}/catalog`)}
            className="w-full bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#2D2A26] font-medium py-3 rounded-lg transition-colors cursor-pointer"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2D2A26] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="text-[#827A73] hover:text-[#2D2A26] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-sm font-medium text-[#A8A19A]">
            Step {step} of 3
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Book an Appointment</h1>
          <p className="text-[#827A73]">{shopSettings?.name}</p>
        </div>

        {/* Design Catalog Reference — the item is inspiration for the fitting,
            not something being ordered/purchased directly. */}
        {refName && (
          <div className="mb-6 bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] font-bold text-[#9A8073] uppercase tracking-wider">Design Reference</span>
            <h3 className="font-semibold text-sm text-[#2D2A26]">
              {refName}{refSize && <span className="font-normal text-[#827A73]"> · Size {refSize}</span>}
            </h3>
          </div>
        )}

        {/* Selected Package Summary */}
        {packageInfo && (
          <div className="mb-6 bg-white border border-taupe/30 rounded-2xl p-4 shadow-xs">
            <span className="text-[10px] font-bold text-[#9A8073] uppercase tracking-wider">Package Inquiry</span>
            <h3 className="font-semibold text-sm text-[#2D2A26]">{packageInfo.name}</h3>
            <p className="text-xs text-[#827A73] mt-0.5">
              Includes: {packageInfo.services.map(s => s.name).join(', ')}
            </p>
            <p className="text-xs font-semibold text-[#9A8073] mt-1">
              ₱{(packageInfo.bundle_price
                ? Number(packageInfo.bundle_price)
                : packageInfo.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0)
              ).toLocaleString()}
            </p>
          </div>
        )}

        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 md:p-8 shadow-xl">
          
          {/* STEP 1: POLICY */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium border-b border-[#EBE6E0] pb-4">Service Details & Policy</h2>
              
              <div className="prose prose-invert max-w-none text-[#524A44]">
                {shopSettings?.booking_policy ? (
                  <div className="whitespace-pre-wrap">{shopSettings.booking_policy}</div>
                ) : (
                  <p className="italic text-[#A8A19A]">No specific booking policy provided by this shop.</p>
                )}
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-[#9A8073] hover:bg-[#91756A] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  Agree & Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium border-b border-[#EBE6E0] pb-4">Appointment Type & Schedule</h2>

              {/* Appointment Type Selector */}
              <div className="space-y-2">
                  <label className="text-sm font-medium text-[#524A44] block">What are you coming in for? <span className="text-[#B26959]">*</span></label>
                  <div className="grid grid-cols-1 gap-2">
                    {BOOKING_TYPES.map(t => (
                      <button
                        type="button" key={t.value}
                        onClick={() => {
                          setAppointmentType(t.value);
                          // Pickup is a quick hand-off, not a sit-down session —
                          // default it to a short slot instead of whatever
                          // duration was left over from another type.
                          if (t.value === 'pickup') setDurationMinutes('15');
                          else if (durationMinutes === '15') setDurationMinutes('60');
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          appointmentType === t.value
                            ? 'border-[#9A8073] bg-[#9A8073]/5 ring-2 ring-[#9A8073]/20'
                            : 'border-[#EBE6E0] bg-white hover:border-[#9A8073]/40'
                        }`}
                      >
                        <span className={`${appointmentType === t.value ? 'text-[#9A8073]' : 'text-[#A8A19A]'}`}>{t.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${appointmentType === t.value ? 'text-[#2D2A26]' : 'text-[#524A44]'}`}>{t.label}</p>
                          <p className="text-xs text-[#A8A19A]">{t.hint}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {TYPES_REQUIRING_SERVICE.includes(appointmentType) && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> Please select a service below — required for {appointmentType} appointments.
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <InteractiveCalendar
                    selectedBranchId={selectedBranchId ? String(selectedBranchId) : null}
                    durationMinutes={appointmentType === 'consultation' ? 30 : appointmentType === 'pickup' ? 15 : 60}
                    operatingHours={shopSettings?.operating_hours as any}
                    specialHours={shopSettings?.special_hours as any}
                    maxAppointmentsPerDay={shopSettings?.max_appointments_per_day ?? null}
                    appointments={calendarAppointments}
                    loadingAppts={loadingAppts}
                    selectedDate={date}
                    selectedTime={time}
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
                    <div className="bg-[#B26959]/10 border border-[#B26959]/20 rounded-xl p-4 flex gap-2.5 text-xs text-[#B26959] animate-in slide-in-from-top-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Temporarily Closed ({special.title})</p>
                        <p className="mt-0.5">We are fully closed on this date. Please choose a different date for your appointment.</p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2.5 text-xs text-[#826A50] animate-in slide-in-from-top-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Special Holiday Hours ({special.title})</p>
                        <p className="mt-0.5">Custom hours for this date: {special.special_open_time} - {special.special_close_time}.</p>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Branch Selector (if multi-branch) */}
              {shopSettings?.branches && shopSettings.branches.length > 1 && (
                <div className="space-y-2">
                  <label htmlFor="booking-branch" className="text-sm font-medium text-[#524A44] block">
                    Select Branch <span className="text-[#B26959]">*</span>
                  </label>
                  <select
                    id="booking-branch"
                    required
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  >
                    <option value="" disabled>Choose a branch...</option>
                    {shopSettings.branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.address || ''}, {b.city || ''})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch Location & In-Person Warning Alerts */}
              {(() => {
                const currentBranch = shopSettings?.branches?.find(b => b.id.toString() === selectedBranchId) || 
                                      (shopSettings?.branches?.length === 1 ? shopSettings.branches[0] : null);
                
                if (!currentBranch) return null;

                return (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <MapPin size={14} className="shrink-0 text-amber-700" />
                      Physical Store Visit Required
                    </p>
                    <p className="text-amber-700 leading-relaxed">
                      This is an <strong>in-person session</strong>. You must physically visit the selected branch on the scheduled date:
                    </p>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/50 shadow-xs">
                      <p className="font-bold text-zinc-800">{currentBranch.name}</p>
                      {currentBranch.address && <p className="text-zinc-600 mt-0.5">{currentBranch.address}</p>}
                      {currentBranch.city && <p className="text-zinc-700 font-medium mt-0.5">{currentBranch.city}</p>}
                    </div>
                    {appointmentType === 'consultation' ? (
                      <p className="text-amber-800/80 mt-1.5 leading-normal">
                        💡 <strong>Located far away?</strong> You can avoid traveling and message us directly using the <strong>"💬 Chat Shop"</strong> button on our homepage to start an online consultation!
                      </p>
                    ) : (
                      <p className="text-amber-800/80 mt-1.5 leading-normal font-semibold">
                        ⚠️ Warning: If you are located far from this branch (e.g. Luzon to Mindanao), please do not book this session as it cannot be done online.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Service Selector — Required for measurement/alteration, Optional for consultation, Hidden for fitting/pickup */}
              {appointmentType !== 'fitting' && appointmentType !== 'pickup' && shopSettings?.services && shopSettings.services.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="booking-service" className="text-sm font-medium text-[#524A44] block">
                    Service {appointmentType === 'measurement' || appointmentType === 'alteration' ? <span className="text-[#B26959]">*</span> : '(Optional)'}
                  </label>
                  <select
                    id="booking-service"
                    value={selectedServiceId}
                    required={appointmentType === 'measurement' || appointmentType === 'alteration'}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  >
                    <option value="">{appointmentType === 'measurement' || appointmentType === 'alteration' ? 'Select a service...' : 'No specific service (General Consultation)'}</option>
                    {shopSettings.services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Order Reference Input — Required for Fittings and Pickups */}
              {(appointmentType === 'fitting' || appointmentType === 'pickup') && (
                <div className="space-y-2">
                  <label htmlFor="booking-order-reference" className="text-sm font-medium text-[#524A44] block">
                    Ongoing Order Number or Garment Description <span className="text-[#B26959]">*</span>
                  </label>
                  <input
                    id="booking-order-reference"
                    type="text"
                    required
                    placeholder="e.g., Order #1002 or Blue Wedding Gown"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                  <p className="text-[11px] text-[#827A73]">
                    💡 {appointmentType === 'pickup'
                      ? 'Tell the shop which finished order you’re coming to collect.'
                      : 'Tell the designer which ongoing order you are coming in to fit.'}
                  </p>
                </div>
              )}

              {/* Consultation — reference images + optional link. Was previously
                  tied to the now-removed 'bulk_custom' type; Consultation is
                  the natural moment for a customer to attach a design idea. */}
              {appointmentType === 'consultation' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#524A44] block">
                      Design Reference Images <span className="text-xs font-normal text-[#A8A19A]">(optional, up to 10)</span>
                    </label>
                    {referenceImages.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {referenceImages.map(url => (
                          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-[#EBE6E0] bg-zinc-100">
                            <Image src={url} alt="Reference" fill className="object-cover" unoptimized />
                            <button
                              type="button"
                              onClick={() => removeReferenceImage(url)}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label htmlFor="reference-image-upload" className="flex items-center justify-center gap-2 border-2 border-dashed border-[#EBE6E0] rounded-xl py-3 text-sm text-[#827A73] hover:border-[#9A8073]/50 cursor-pointer transition-colors">
                      <Upload size={16} />
                      {uploadingReference ? 'Uploading...' : 'Upload a design photo, mockup, or existing uniform'}
                      <input
                        id="reference-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingReference}
                        onChange={handleReferenceImageUpload}
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="reference-link" className="text-sm font-medium text-[#524A44] flex items-center gap-1.5">
                      <LinkIcon size={14} /> Reference Link <span className="text-xs font-normal text-[#A8A19A]">(optional — Drive, YouTube, Pinterest, etc.)</span>
                    </label>
                    <input
                      id="reference-link"
                      type="url"
                      value={referenceLink}
                      onChange={(e) => setReferenceLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                    />
                    <p className="text-[11px] text-[#827A73]">
                      💡 Got a video walkthrough of the design? Upload it to Drive or YouTube and paste the link here instead.
                    </p>
                  </div>
                </div>
              )}

              {/* Duration Selector — Pickup is a fixed short hand-off, no need to ask */}
              {appointmentType !== 'pickup' && (
              <div className="space-y-2">
                <label htmlFor="booking-duration" className="text-sm font-medium text-[#524A44] block">
                  Estimated Duration
                </label>
                <select
                  id="booking-duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                >
                  <option value="30">30 minutes (Quick Consultation)</option>
                  <option value="60">60 minutes (Standard Fitting/Measurement)</option>
                  <option value="90">90 minutes (Detailed Fitting/Consultation)</option>
                  <option value="120">120 minutes (Comprehensive Session)</option>
                </select>
              </div>
              )}

              {/* Render Operating Hours */}
              {(() => {
                const hours = shopSettings?.operating_hours;
                if (!hours) return null;
                try {
                  const parsed = typeof hours === 'string' ? JSON.parse(hours) : hours;
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  return (
                    <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-4 mt-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-[#827A73] uppercase tracking-wider">Shop Operating Hours</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-[#524A44]">
                        {days.map(d => {
                          const h = parsed[d];
                          return (
                            <div key={d} className="flex justify-between border-b border-[#EBE6E0]/40 pb-1.5">
                              <span className="capitalize font-medium text-[#2D2A26]">{d}</span>
                              <span className="text-[#827A73]">
                                {h?.is_open 
                                  ? `${h.open} - ${h.close}`
                                  : <span className="text-[#B26959] font-medium">Closed</span>
                                }
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } catch (e) {
                  return null;
                }
              })()}

              <div className="pt-6">
                <button 
                  onClick={() => setStep(3)}
                  disabled={
                    !date ||
                    !time ||
                    !!getSpecialHoursForDate(date)?.is_closed ||
                    (!!shopSettings?.branches && shopSettings.branches.length > 1 && !selectedBranchId)
                  }
                  className="w-full bg-[#9A8073] hover:bg-[#91756A] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  Next Step <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS & SUBMIT */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium border-b border-[#EBE6E0] pb-4">Your Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="customer-name" className="text-sm font-medium text-[#524A44] mb-1 block">Full Name *</label>
                  <input 
                    id="customer-name"
                    type="text" required
                    value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                </div>
                <div>
                  <label htmlFor="customer-email" className="text-sm font-medium text-[#524A44] mb-1 block">Email Address *</label>
                  <input 
                    id="customer-email"
                    type="email" required
                    value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                </div>
                <div>
                  <label htmlFor="customer-phone" className="text-sm font-medium text-[#524A44] mb-1 block">Phone Number</label>
                  <input 
                    id="customer-phone"
                    type="tel" 
                    value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                </div>
              </div>

              {/* Inquiry Remarks Field */}
              <div className="pt-4 border-t border-[#EBE6E0]">
                <label htmlFor="customer-remarks" className="text-sm font-medium text-[#524A44] mb-1 block">Remarks / Special Instructions</label>
                <textarea 
                  id="customer-remarks"
                  rows={4}
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Specify sizing, alterations, or other details..."
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073]"
                />
              </div>

              {shopSettings?.booking_questions && shopSettings.booking_questions.length > 0 && (
                <div className="pt-4 space-y-4 border-t border-[#EBE6E0]">
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  {shopSettings.booking_questions.map((question: string, idx: number) => (
                    <div key={question}>
                      <label htmlFor={`question-${idx}`} className="text-sm font-medium text-[#524A44] mb-1 block">{question}</label>
                      <input 
                        id={`question-${idx}`}
                        type="text"
                        required
                        value={answers[question] || ''} 
                        onChange={(e) => setAnswers({...answers, [question]: e.target.value})}
                        className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Payment Section */}
              <div className="pt-4 border-t border-[#EBE6E0] space-y-4">
                <h3 className="text-lg font-medium">Payment / Booking Deposit</h3>
                <p className="text-xs text-[#827A73]">Select how you would like to handle your reservation/fitting deposit (if applicable).</p>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: 'Cash on Shop' },
                    { value: 'gcash', label: 'GCash' },
                    { value: 'bank_transfer', label: 'Bank Transfer' }
                  ].map(m => (
                    <button
                      type="button" key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`py-2.5 px-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === m.value
                          ? 'border-[#9A8073] bg-[#9A8073]/5 text-[#2D2A26]'
                          : 'border-[#EBE6E0] bg-white text-[#524A44] hover:border-[#9A8073]/40'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'cash' && (
                  <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl space-y-3">
                    <p className="text-xs text-zinc-700">
                      Please send payment to the shop&apos;s verified GCash / Bank details:
                      <br />
                      <strong className="text-zinc-950 font-bold">GCash: 0950 5585 800 (Printify Shop)</strong>
                      <br />
                      <strong className="text-zinc-950 font-bold">Bank: BPI - 1234-5678-90 (Sutura Account)</strong>
                    </p>
                    
                    <div className="space-y-2">
                      <label htmlFor="ref-code" className="text-xs font-medium text-[#524A44] block">
                        Transaction Reference Code <span className="text-[#A8A19A] font-normal">(optional)</span>
                      </label>
                      <input
                        id="ref-code"
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder={
                          paymentMethod === 'gcash'
                            ? 'Enter the 13-digit GCash reference number, if you have it'
                            : 'Enter your bank’s transaction/confirmation number, if you have it'
                        }
                        className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-[#2D2A26] text-xs focus:outline-none focus:border-[#9A8073]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="receipt-file" className="text-xs font-medium text-[#524A44] block">Upload Receipt Image *</label>
                      <input 
                        id="receipt-file"
                        type="file" required={!paymentReceiptUrl}
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="w-full text-xs text-[#827A73]"
                      />
                      {uploadingReceipt && <p className="text-[10px] text-[#9A8073] animate-pulse">Uploading proof of payment...</p>}
                      {paymentReceiptUrl && <p className="text-[10px] text-green-600 font-medium">✓ Proof of payment uploaded successfully!</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting || uploadingReceipt}
                  className="w-full bg-[#9A8073] hover:bg-[#91756A] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? 'Processing...' : uploadingReceipt ? 'Uploading receipt...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default function BookingWizard({ params }: Readonly<{ params: Promise<{ shop_id: string }> }>) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#2D2A26] animate-pulse">Loading booking system...</div>}>
      <BookingWizardContent params={params} />
    </Suspense>
  );
}
