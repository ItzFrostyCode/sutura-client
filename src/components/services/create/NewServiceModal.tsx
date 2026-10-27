'use client';

import { useState } from 'react';
import { Check, FileImage, Loader2, Paperclip, UploadCloud, X } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/Modal';
import { SHOWCASE_CATEGORIES } from '@/lib/serviceShowcase';
import { useImageUpload } from '../detail/ImageUploadField';
import { buildServicePayload, emptyServiceDraft, validateSection, type ServiceDraft } from '../detail/serviceEditing';
import type { ServiceCategory } from '@/lib/canonicalTaxonomy';

// One Category drives both taxonomies: the storefront chip (showcase) and the
// search / job-order category (service_category) it maps onto.
const SEARCH_CATEGORY: Record<string, ServiceCategory> = {
  custom_tailoring: 'custom_tailoring',
  formal: 'custom_tailoring',
  casual: 'custom_tailoring',
  alterations_repairs: 'alterations_repairs',
  uniform: 'uniform_production',
  office: 'uniform_production',
  school: 'uniform_production',
  medical: 'uniform_production',
  maritime: 'uniform_production',
  sports: 'printing_sublimation',
  embroidery: 'others',
};

const LABEL = 'mb-1.5 block text-sm font-medium text-ink';
const INPUT = 'h-11 w-full border border-line-strong bg-white px-3 text-sm text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none focus:ring-2 focus:ring-taupe/20 disabled:bg-sunken disabled:text-ink-faint';
const PANEL = 'border border-line bg-[#FBF8F5] p-3.5';
const REQ = <span className="text-danger" aria-hidden="true">*</span>;

/**
 * "Add new service" in one view: image, name, starting price, turnaround,
 * category, an optional reference chart and a description. Specification
 * tiers, booking questions and requirements aren't asked here — the price
 * becomes a single priced row, and requirements follow the shop's defaults
 * (both can be refined later on the service's own page).
 */
export default function NewServiceModal({ isOpen, storeId, onClose, onCreated }: Readonly<{
  isOpen: boolean;
  storeId: number;
  onClose: () => void;
  onCreated: (serviceId: number) => void;
}>) {
  const toast = useToast();
  const [d, setDraft] = useState<ServiceDraft>(emptyServiceDraft);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<ServiceDraft>) => setDraft((prev) => ({ ...prev, ...p }));

  const close = () => {
    if (saving) return;
    setDraft(emptyServiceDraft());
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateSection('info', d) ?? (d.showcase_category ? null : 'Pick a category.');
    if (problem) return toast.error(problem);

    // The API needs at least one priced row: the service itself at its starting price.
    const payload = buildServicePayload(null, { ...d, tiers: [{ label: d.name.trim(), amount: d.base_price.trim() }] });

    setSaving(true);
    try {
      const res = await api.post(`/stores/${storeId}/services`, payload);
      toast.success('Service created.');
      setDraft(emptyServiceDraft());
      onCreated(res.data.data.id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create this service.'));
    } finally {
      setSaving(false);
    }
  };

  const from = Number(d.estimated_days);
  const toTooLow = !d.turnaround_depends && d.estimated_days !== '' && d.estimated_days_max !== '' && Number(d.estimated_days_max) <= from;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Add New Service"
      // The shared Modal caps width at 599px; widen from tablets up. Laptops get
      // a 3-column landscape form so everything fits without scrolling.
      maxWidth="md:max-w-3xl lg:max-w-6xl"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={close} disabled={saving} className="h-11 px-5 border border-line-strong bg-white text-sm font-semibold text-ink hover:bg-sunken disabled:opacity-50 cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="new-service-form" disabled={saving} className="h-11 px-5 inline-flex items-center gap-2 bg-ink text-sm font-semibold text-white hover:bg-black disabled:opacity-60 cursor-pointer">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {saving ? 'Saving…' : 'Save Service'}
          </button>
        </div>
      }
    >
      <form id="new-service-form" onSubmit={submit} className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3 *:min-w-0">
        {/* ── 1: image + reference chart ── */}
        <div className="flex flex-col gap-3.5">
          <div className={PANEL}>
            <ImageDropZone value={d.image_url} onChange={(url) => patch({ image_url: url })} storeId={storeId} />
          </div>
          <div className={PANEL}>
            <p className={LABEL}>Reference Chart <span className="font-normal text-ink-muted">(Optional)</span></p>
            <ChartAttach
              value={d.sizeChart.image_url ?? ''}
              onChange={(url) => patch({ sizeChart: { ...d.sizeChart, image_url: url || null } })}
              storeId={storeId}
            />
          </div>
        </div>

        {/* ── 2: name, price, category ── */}
        <div className="flex flex-col gap-3.5">
          <div>
            <label htmlFor="svc-name" className={LABEL}>Service Name {REQ}</label>
            <input id="svc-name" value={d.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Barong Embroidery" className={INPUT} maxLength={191} />
          </div>

          <div>
            <label htmlFor="svc-price" className={LABEL}>Starting Price (PHP)</label>
            <div className="flex h-11 border border-line-strong bg-white focus-within:border-taupe focus-within:ring-2 focus-within:ring-taupe/20">
              <span className="flex w-11 items-center justify-center border-r border-line bg-sunken text-sm font-semibold text-ink-muted" aria-hidden="true">₱</span>
              <input id="svc-price" type="number" min="0" step="0.01" inputMode="decimal" value={d.base_price} onChange={(e) => patch({ base_price: e.target.value })} placeholder="Leave empty for a custom quote" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none tabular-nums" />
            </div>
          </div>

          <div>
            <label htmlFor="svc-category" className={LABEL}>Category {REQ}</label>
            <select
              id="svc-category"
              value={d.showcase_category}
              onChange={(e) => patch({ showcase_category: e.target.value, service_category: SEARCH_CATEGORY[e.target.value] ?? '' })}
              className={INPUT}
            >
              <option value="">Choose a category…</option>
              {SHOWCASE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-ink-muted">Where it shows on your shop page and in search.</p>
          </div>
        </div>

        {/* ── 3: turnaround + description (full width on tablets) ── */}
        <div className="flex flex-col gap-3.5 md:col-span-2 lg:col-span-1">
          <fieldset className={PANEL}>
            <legend className="sr-only">Estimated completion</legend>
            <p className={LABEL} aria-hidden="true">Estimated Completion {!d.turnaround_depends && REQ}</p>
            <div className="flex items-center gap-2">
              <DaysInput id="svc-days" label="From" value={d.estimated_days} disabled={d.turnaround_depends}
                onChange={(v) => patch({ estimated_days: v, ...(v === '' ? { estimated_days_max: '' } : {}) })} />
              <span className="text-ink-muted" aria-hidden="true">–</span>
              <DaysInput id="svc-days-max" label="To" value={d.estimated_days_max} disabled={d.turnaround_depends || d.estimated_days === ''}
                min={d.estimated_days ? from + 1 : 1} invalid={toTooLow} onChange={(v) => patch({ estimated_days_max: v })} />
            </div>
            {toTooLow && <p className="mt-1.5 text-xs text-danger">“To” must be {from + 1} days or more — or leave it blank.</p>}
            <label className="mt-2 inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-ink-body">
              <button
                type="button"
                role="switch"
                aria-checked={d.turnaround_depends}
                onClick={() => patch({ turnaround_depends: !d.turnaround_depends })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${d.turnaround_depends ? 'bg-ink' : 'bg-line-strong'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out ${d.turnaround_depends ? 'translate-x-5' : ''}`} />
              </button>
              It depends / Custom
            </label>
          </fieldset>

          <div className={`${PANEL} flex flex-1 flex-col`}>
            <label htmlFor="svc-desc" className={LABEL}>Description</label>
            <textarea
              id="svc-desc"
              rows={4}
              value={d.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="What it covers, fabric requirements, and what customers should bring or prepare."
              className="min-h-24 w-full flex-1 resize-y border border-line-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none focus:ring-2 focus:ring-taupe/20"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

function DaysInput({ id, label, value, onChange, disabled, min = 1, invalid = false }: Readonly<{
  id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean; min?: number; invalid?: boolean;
}>) {
  return (
    <div className={`flex h-11 min-w-0 flex-1 border bg-white ${invalid ? 'border-danger' : 'border-line-strong'} ${disabled ? 'opacity-60' : 'focus-within:border-taupe focus-within:ring-2 focus-within:ring-taupe/20'}`}>
      <label htmlFor={id} className="flex items-center border-r border-line bg-sunken px-2 text-xs font-medium text-ink-muted">{label}</label>
      <input id={id} type="number" min={min} inputMode="numeric" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 flex-1 bg-transparent px-2 text-sm text-ink focus:outline-none tabular-nums disabled:cursor-not-allowed" aria-invalid={invalid || undefined} />
      <span className="flex items-center border-l border-line bg-sunken px-2 text-xs text-ink-muted" aria-hidden="true">days</span>
    </div>
  );
}

/** Dashed drop zone with the chosen image previewed inside it (remove with ×). */
function ImageDropZone({ value, onChange, storeId }: Readonly<{ value: string; onChange: (url: string) => void; storeId: number }>) {
  const { upload, uploading } = useImageUpload(storeId);
  const [dragging, setDragging] = useState(false);
  const take = async (file: File | undefined) => {
    const url = await upload(file);
    if (url !== null) onChange(url);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (!uploading) void take(e.dataTransfer.files?.[0]); }}
      className={`flex min-h-32 items-center gap-3 border-2 border-dashed p-3 transition-colors ${dragging ? 'border-taupe bg-taupe/10' : 'border-taupe/40 bg-white'}`}
    >
      <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 text-center">
        {uploading ? <Loader2 size={26} className="animate-spin text-taupe" aria-hidden="true" /> : <UploadCloud size={28} className="text-taupe" aria-hidden="true" />}
        <span className="text-sm text-ink-body">
          {uploading ? 'Uploading…' : dragging ? 'Drop to upload' : <>Drag &amp; drop service image here or <span className="font-semibold text-taupe underline underline-offset-2">browse</span></>}
        </span>
        <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      {value && (
        <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-line bg-sunken">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getMediaUrl(value)} alt="Service image preview" className="h-full w-full object-cover" />
          <button type="button" onClick={() => onChange('')} aria-label="Remove image"
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow hover:bg-white cursor-pointer">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/** "Attach chart" button; once attached, a small thumbnail with replace/remove. */
function ChartAttach({ value, onChange, storeId }: Readonly<{ value: string; onChange: (url: string) => void; storeId: number }>) {
  const { upload, uploading } = useImageUpload(storeId);
  const take = async (file: File | undefined) => {
    const url = await upload(file);
    if (url !== null) onChange(url);
  };
  const picker = <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />;

  if (!value) {
    return (
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-2 border-dashed border-taupe/40 bg-white px-4 text-sm font-medium text-taupe hover:border-taupe">
        {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Paperclip size={15} aria-hidden="true" />}
        {uploading ? 'Uploading…' : 'Attach Size/Measurement Chart'}
        {picker}
      </label>
    );
  }
  return (
    <div className="flex items-center gap-3 border border-line bg-white p-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden border border-line bg-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getMediaUrl(value)} alt="Reference chart preview" className="h-full w-full object-cover" />
      </div>
      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-ink-body"><FileImage size={14} className="shrink-0 text-taupe" aria-hidden="true" /> Chart attached</span>
      <label className="cursor-pointer px-2 text-xs font-semibold text-taupe hover:underline">{uploading ? 'Uploading…' : 'Replace'}{picker}</label>
      <button type="button" onClick={() => onChange('')} aria-label="Remove chart" className="flex h-9 w-9 items-center justify-center text-ink-muted hover:text-danger cursor-pointer">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
