'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Maximize2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useShopCategories, searchCategoryFor } from '@/components/services/useShopCategories';
import { UNIFORM_TYPES, guessUniformType } from '@/lib/uniformTypes';
import { useImageUpload } from '@/components/services/detail/ImageUploadField';
import ImageViewerModal from '@/components/shared/ImageViewerModal';
import { buildServicePayload, emptyServiceDraft, validateSection, type ServiceDraft } from '@/components/services/detail/serviceEditing';

const LABEL = 'mb-1.5 block text-xs min-[600px]:text-sm font-semibold text-ink';
const INPUT = 'h-11 min-[600px]:h-12 w-full border border-line-strong bg-white px-3.5 text-sm min-[600px]:text-base text-ink placeholder:text-ink-faint focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/15 disabled:bg-sunken disabled:text-ink-faint transition-colors';
const CARD = 'border border-line bg-white p-4 min-[600px]:p-6 shadow-xs';
const REQ = <span className="text-danger ml-0.5" aria-hidden="true">*</span>;

function NewServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { store } = useAuthStore();
  const storeId = store?.id ?? 0;

  const returnParam = searchParams.get('return');
  const returnTo = returnParam?.startsWith('/dashboard/') && !returnParam.startsWith('//') ? returnParam : null;

  const [d, setDraft] = useState<ServiceDraft>(emptyServiceDraft);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<ServiceDraft>) => setDraft((prev) => ({ ...prev, ...p }));

  const { options: categories, loading: categoriesLoading } = useShopCategories(storeId || undefined);

  const from = Number(d.estimated_days);
  const toTooLow = !d.turnaround_depends && d.estimated_days !== '' && d.estimated_days_max !== '' && Number(d.estimated_days_max) <= from;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      toast.error('Store information not loaded.');
      return;
    }

    const problem = validateSection('info', d)
      ?? (d.showcase_category ? null : 'Please pick a category.')
      ?? (d.showcase_category === 'uniform' && !d.service_leaf_type ? 'Please pick the uniform type.' : null);

    if (problem) {
      toast.error(problem);
      return;
    }

    // Single priced row or starting quote
    const payload = buildServicePayload(null, {
      ...d,
      tiers: [{ label: d.name.trim(), amount: d.base_price.trim() }],
    });

    setSaving(true);
    try {
      const res = await api.post(`/stores/${storeId}/services`, payload);
      toast.success('Service created successfully.');
      if (returnTo) {
        router.push(`${returnTo}?linked_service=${res.data.data.id}`);
      } else {
        router.push('/dashboard/services');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create this service.'));
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push('/dashboard/services');
    }
  };

  return (
    <div className="w-full max-w-6xl space-y-6 pb-28 min-[1024px]:pb-10">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1 min-w-0">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Services</span>
          </button>
          <h1 className="text-xl min-[600px]:text-2xl min-[1024px]:text-3xl font-bold text-ink tracking-tight">
            Create New Service
          </h1>
          <p className="text-xs min-[600px]:text-sm text-ink-muted">
            Set up your tailoring service with a hero photo, pricing, and completion estimate.
          </p>
        </div>

        {/* Desktop / Tablet action buttons */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="min-h-11 px-5 border border-line-strong bg-white text-sm font-semibold text-ink hover:bg-sunken disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-service-fullpage-form"
            disabled={saving}
            className="min-h-11 px-6 inline-flex items-center gap-2 bg-espresso hover:bg-espresso/90 text-sm font-semibold text-white shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving Service…' : 'Save Service'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <form id="new-service-fullpage-form" onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols on desktop): Visual Assets (Photo & Size Chart) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Service Image Card */}
          <div className={CARD}>
            <div className="flex items-center justify-between mb-3">
              <label className={LABEL}>
                Service Photo <span className="font-normal text-ink-muted text-xs">(Recommended)</span>
              </label>
            </div>
            <p className="text-xs text-ink-muted mb-3.5 leading-relaxed">
              Upload a clear photo of this service or finished garment. Customers will see this on your shop catalog.
            </p>
            <FullPageImageDropZone
              value={d.image_url}
              onChange={(url) => patch({ image_url: url })}
              storeId={storeId}
              alt="Service photo"
            />
          </div>

          {/* Reference Chart (Size Chart) Card */}
          <div className={CARD}>
            <div className="flex items-center justify-between mb-2">
              <label className={LABEL}>
                Reference Chart <span className="font-normal text-ink-muted text-xs">(Optional)</span>
              </label>
            </div>
            <p className="text-xs text-ink-muted mb-3.5 leading-relaxed">
              A photo of your size guide or measurement chart. Customers see it on the service page.
            </p>
            <FullPageImageDropZone
              value={d.sizeChart.image_url ?? ''}
              onChange={(url) => patch({ sizeChart: { ...d.sizeChart, image_url: url || null } })}
              storeId={storeId}
              alt="Reference chart"
            />
          </div>
        </div>

        {/* Right Column (7 cols on desktop): Service Details & Specifications */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Core Details */}
          <div className={CARD}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-4 pb-2 border-b border-line">
              1. Basic Information
            </h2>
            <div className="space-y-4">
              {/* Service Name */}
              <div>
                <label htmlFor="full-svc-name" className={LABEL}>
                  Service Name {REQ}
                </label>
                <input
                  id="full-svc-name"
                  value={d.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="e.g. Barong Tagalog Tailoring"
                  className={INPUT}
                  maxLength={191}
                  required
                />
              </div>

              {/* Price & Category in 2 cols on tablet/desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Starting Price */}
                <div>
                  <label htmlFor="full-svc-price" className={LABEL}>
                    Starting Price (₱)
                  </label>
                  <div className="flex h-11 min-[600px]:h-12 border border-line-strong bg-white focus-within:border-espresso focus-within:ring-2 focus-within:ring-espresso/15 transition-colors">
                    <span className="flex w-11 min-[600px]:w-12 items-center justify-center border-r border-line bg-sunken text-sm min-[600px]:text-base font-bold text-ink-muted select-none" aria-hidden="true">
                      ₱
                    </span>
                    <input
                      id="full-svc-price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={d.base_price}
                      onChange={(e) => patch({ base_price: e.target.value })}
                      placeholder="Leave empty for quote"
                      className="min-w-0 flex-1 bg-transparent px-3 text-sm min-[600px]:text-base text-ink placeholder:text-ink-faint focus:outline-none tabular-nums"
                    />
                  </div>
                  <p className="mt-1 text-[11px] min-[600px]:text-xs text-ink-muted">
                    Leave blank if this service always requires a custom quotation.
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="full-svc-category" className={LABEL}>
                    Category {REQ}
                  </label>
                  <select
                    id="full-svc-category"
                    value={d.showcase_category}
                    onChange={(e) => patch({
                      showcase_category: e.target.value,
                      service_category: searchCategoryFor(e.target.value),
                      service_leaf_type: e.target.value === 'uniform' ? guessUniformType(d.name) : '',
                    })}
                    className={INPUT}
                    required
                  >
                    <option value="">{categoriesLoading ? 'Loading categories…' : 'Choose a category…'}</option>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] min-[600px]:text-xs text-ink-muted truncate">
                    Determines where this service appears in your shop catalog.
                  </p>
                </div>
              </div>

              {/* Conditional Uniform Type */}
              {d.showcase_category === 'uniform' && (
                <div className="pt-1">
                  <label htmlFor="full-svc-uniform-type" className={LABEL}>
                    Uniform Type {REQ}
                  </label>
                  <select
                    id="full-svc-uniform-type"
                    value={d.service_leaf_type}
                    onChange={(e) => patch({ service_leaf_type: e.target.value })}
                    className={INPUT}
                    required
                  >
                    {UNIFORM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Estimated Completion */}
          <div className={CARD}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-4 pb-2 border-b border-line">
              2. Production &amp; Completion Time
            </h2>
            <div className="space-y-3.5">
              <fieldset>
                <legend className={LABEL}>
                  Estimated Completion {!d.turnaround_depends && REQ}
                </legend>
                <div className="flex items-center gap-2 max-w-md">
                  <FullPageDaysInput
                    id="full-svc-days"
                    label="From"
                    value={d.estimated_days}
                    disabled={d.turnaround_depends}
                    onChange={(v) => patch({ estimated_days: v, ...(v === '' ? { estimated_days_max: '' } : {}) })}
                  />
                  <span className="text-ink-muted font-bold select-none" aria-hidden="true">–</span>
                  <FullPageDaysInput
                    id="full-svc-days-max"
                    label="To"
                    value={d.estimated_days_max}
                    disabled={d.turnaround_depends || d.estimated_days === ''}
                    min={d.estimated_days ? from + 1 : 1}
                    invalid={toTooLow}
                    onChange={(v) => patch({ estimated_days_max: v })}
                  />
                </div>
                {toTooLow && (
                  <p className="mt-1.5 text-xs text-danger font-medium">
                    “To” must be {from + 1} days or more — or leave it blank.
                  </p>
                )}
              </fieldset>

              {/* "It depends" Switch */}
              <div className="pt-1">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={d.turnaround_depends}
                    onClick={() => patch({ turnaround_depends: !d.turnaround_depends })}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso cursor-pointer ${
                      d.turnaround_depends ? 'bg-espresso' : 'bg-line-strong'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out ${
                        d.turnaround_depends ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                  <span className="text-xs min-[600px]:text-sm font-medium text-ink">
                    It depends / Custom timeline (determined upon consultation)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Description */}
          <div className={CARD}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-4 pb-2 border-b border-line">
              3. Service Description
            </h2>
            <div>
              <label htmlFor="full-svc-desc" className={LABEL}>
                Description <span className="font-normal text-ink-muted text-xs">(Optional)</span>
              </label>
              <textarea
                id="full-svc-desc"
                rows={4}
                value={d.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Describe what this service covers, fabric recommendations, turnaround details, or what customers should prepare..."
                className="w-full resize-y border border-line-strong bg-white p-3.5 text-sm min-[600px]:text-base text-ink placeholder:text-ink-faint focus:border-espresso focus:outline-none focus:ring-2 focus:ring-espresso/15 transition-colors leading-relaxed min-h-[120px]"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Sticky Bottom Action Bar on Mobile / Small screens */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="flex-1 min-h-12 border border-line-strong bg-white text-sm font-semibold text-ink hover:bg-sunken disabled:opacity-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="new-service-fullpage-form"
          disabled={saving}
          className="flex-[2] min-h-12 inline-flex items-center justify-center gap-2 bg-espresso hover:bg-espresso/90 text-sm font-semibold text-white shadow-xs disabled:opacity-60 transition-colors cursor-pointer"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Saving…' : 'Save Service'}
        </button>
      </div>
    </div>
  );
}

function FullPageDaysInput({ id, label, value, onChange, disabled, min = 1, invalid = false }: Readonly<{
  id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean; min?: number; invalid?: boolean;
}>) {
  return (
    <div className={`flex h-11 min-[600px]:h-12 min-w-0 flex-1 border bg-white ${invalid ? 'border-danger' : 'border-line-strong'} ${disabled ? 'opacity-50 bg-sunken' : 'focus-within:border-espresso focus-within:ring-2 focus-within:ring-espresso/15'}`}>
      <label htmlFor={id} className="flex items-center border-r border-line bg-sunken px-2.5 text-xs font-semibold text-ink-muted select-none">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 flex-1 bg-transparent px-2.5 text-sm min-[600px]:text-base text-ink focus:outline-none tabular-nums disabled:cursor-not-allowed"
        aria-invalid={invalid || undefined}
      />
      <span className="flex items-center border-l border-line bg-sunken px-2.5 text-xs text-ink-muted select-none" aria-hidden="true">
        days
      </span>
    </div>
  );
}

/** A big drop zone with a preview — used for both the Service Photo and the Reference Chart. Tap the image (or View) to see it full size. */
function FullPageImageDropZone({ value, onChange, storeId, alt }: Readonly<{ value: string; onChange: (url: string) => void; storeId: number; alt: string }>) {
  const { upload, uploading } = useImageUpload(storeId);
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState(false);

  const take = async (file: File | undefined) => {
    const url = await upload(file);
    if (url !== null) onChange(url);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (!uploading) void take(e.dataTransfer.files?.[0]); }}
      className={`relative flex flex-col items-center justify-center border-2 border-dashed p-4 min-[600px]:p-6 transition-all rounded-xs aspect-4/3 min-[600px]:aspect-square max-h-[360px] w-full overflow-hidden ${
        dragging ? 'border-espresso bg-espresso/5' : 'border-line-strong bg-[#FAF8F5] hover:border-espresso/50'
      }`}
    >
      {value ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <button type="button" onClick={() => setViewing(true)} aria-label={`View ${alt.toLowerCase()} full size`} className="w-full h-full cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(value)} alt={alt} className="w-full h-full object-contain" />
          </button>
          <div className="absolute top-2 right-2 flex gap-1.5 bg-white/90 backdrop-blur p-1 rounded-sm shadow-xs border border-line">
            <button
              type="button"
              onClick={() => setViewing(true)}
              className="h-8 px-2 text-xs font-semibold text-ink flex items-center gap-1 cursor-pointer hover:bg-sunken"
            >
              <Maximize2 size={12} />
              <span>View</span>
            </button>
            <label className="h-8 px-2 text-xs font-semibold text-ink flex items-center gap-1 cursor-pointer hover:bg-sunken">
              <RefreshCw size={12} />
              <span>Replace</span>
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            <button
              type="button"
              onClick={() => onChange('')}
              className="h-8 px-2 text-xs font-semibold text-danger flex items-center gap-1 cursor-pointer hover:bg-danger/10"
            >
              <Trash2 size={12} />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer w-full h-full py-4">
          <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center text-espresso shadow-2xs">
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
          </div>
          <div className="space-y-0.5">
            <span className="text-xs min-[600px]:text-sm font-semibold text-ink">
              {uploading ? 'Uploading image…' : dragging ? 'Drop image here' : 'Drag & drop image or click to browse'}
            </span>
            <p className="text-[11px] text-ink-muted">Supports JPG, PNG, WebP up to 10MB</p>
          </div>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }}
          />
        </label>
      )}
      <ImageViewerModal src={viewing && value ? value : null} title={alt} fileName={alt.toLowerCase().replace(/\s+/g, '-')} onClose={() => setViewing(false)} />
    </div>
  );
}

export default function NewServicePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-espresso" size={32} /></div>}>
      <NewServiceContent />
    </Suspense>
  );
}