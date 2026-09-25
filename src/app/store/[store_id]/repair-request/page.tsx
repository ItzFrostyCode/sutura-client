'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ImagePlus, X, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';

interface PricingOption {
  id: number;
  label: string;
  amount: string | number;
}

interface RepairService {
  id: number;
  name: string;
  service_types?: string[];
  pricing?: PricingOption[];
}

export default function RepairRequestPage({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <RepairRequestPageContent params={params} />
    </Suspense>
  );
}

function RepairRequestPageContent({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id');
  const router = useRouter();

  const [service, setService] = useState<RepairService | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [garmentDescription, setGarmentDescription] = useState('');
  const [selectedPricingIds, setSelectedPricingIds] = useState<number[]>([]);
  const [damageNotes, setDamageNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{ order_number: string; tracking_code: string; id: number } | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    api.get(`/public/stores/${storeId}/services`)
      .then((res) => {
        const match = (res.data.data ?? []).find((s: RepairService) => String(s.id) === serviceId);
        if (!match || !(match.service_types ?? []).includes('alteration_repair')) {
          setNotFound(true);
        } else {
          setService(match);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

  const togglePricing = (id: number) => {
    setSelectedPricingIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const totalAmount = (service?.pricing ?? [])
    .filter((p) => selectedPricingIds.includes(p.id))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const handleUpload = async (file: File) => {
    if (images.length >= 5) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/public/stores/${storeId}/upload-reference-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, res.data.data.url]);
    } catch {
      setError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = garmentDescription.trim() && damageNotes.trim() && selectedPricingIds.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !service) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/stores/${storeId}/repair-requests`, {
        service_id: service.id,
        garment_description: garmentDescription.trim(),
        pre_existing_damage_notes: damageNotes.trim(),
        pricing_ids: selectedPricingIds,
        reference_images: images,
      });
      setSubmitted({
        order_number: res.data.data.order_number,
        tracking_code: res.data.data.tracking_code,
        id: res.data.data.id,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Something went wrong submitting your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-10 flex items-center justify-center relative">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="absolute left-4 p-1 text-ink-muted">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-bold text-ink">Request a Repair</h1>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      )}

      {!loading && notFound && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-semibold text-ink mb-1">Service not found</p>
          <p className="text-xs text-ink-muted">This store has no matching repair/alteration service.</p>
        </div>
      )}

      {!loading && service && submitted && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={26} className="text-sage" />
          </div>
          <p className="text-sm font-bold text-ink mb-1.5">Repair request sent</p>
          <p className="text-xs text-ink-muted leading-relaxed max-w-[260px] mb-1">
            Order {submitted.order_number} · Tracking code {submitted.tracking_code}
          </p>
          <p className="text-xs text-ink-muted leading-relaxed max-w-[260px] mb-6">
            The store will review your request and confirm pricing before starting the repair.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/account/orders/${submitted.id}`)}
            className="px-5 py-2.5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors"
          >
            View My Order
          </button>
        </main>
      )}

      {!loading && service && !submitted && (
        <main className="flex-1 px-[10px] py-[14px] space-y-5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-2 px-0.5">Service</h2>
            <div className="bg-surface border border-line rounded-2xl px-4 py-3.5">
              <p className="text-sm font-bold text-ink">{service.name}</p>
            </div>
          </div>

          <div>
            <label htmlFor="garment-description" className="text-sm font-semibold text-ink mb-2 block">
              What item needs repair?
            </label>
            <textarea
              id="garment-description"
              value={garmentDescription}
              onChange={(e) => setGarmentDescription(e.target.value)}
              rows={2}
              placeholder="e.g. Blue denim jeans from an ukay-ukay, waist a bit loose"
              className="w-full resize-none px-3.5 py-3 rounded-xl bg-surface border border-line text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors placeholder:text-ink-faint"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-2">What does it need? (select all that apply)</h2>
            <div className="bg-surface border border-line rounded-2xl overflow-hidden divide-y divide-line">
              {(service.pricing ?? []).map((p) => {
                const checked = selectedPricingIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePricing(p.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-canvas transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-taupe border-taupe' : 'border-line'}`}>
                        {checked && <CheckCircle2 size={13} className="text-white" fill="currentColor" />}
                      </div>
                      <span className="text-sm font-medium text-ink">{p.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-ink-body shrink-0">₱{Number(p.amount).toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
            {selectedPricingIds.length > 0 && (
              <div className="flex items-center justify-between px-1 mt-2">
                <span className="text-xs text-ink-muted">Estimated total</span>
                <span className="text-sm font-bold text-taupe">₱{totalAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="damage-notes" className="text-sm font-semibold text-ink mb-2 block">
              Pre-existing damage / condition
            </label>
            <p className="text-[11px] text-ink-muted mb-2">
              Note any existing wear, stains, or damage before drop-off — this protects both you and the store.
            </p>
            <textarea
              id="damage-notes"
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Small fray on the left back pocket seam"
              className="w-full resize-none px-3.5 py-3 rounded-xl bg-surface border border-line text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors placeholder:text-ink-faint"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-2">Photos (optional, up to 5)</h2>
            <div className="flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Reference" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/70 text-white flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-line flex items-center justify-center text-ink-faint cursor-pointer hover:border-taupe/50 transition-colors">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl bg-taupe hover:bg-taupe-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Repair Request'}
          </button>
        </main>
      )}
    </div>
  );
}
