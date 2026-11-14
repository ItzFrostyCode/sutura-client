'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, Maximize2, X } from 'lucide-react';
import OrderPhotoViewer from './OrderPhotoViewer';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';

/**
 * Up to `max` photos: each is uploaded to the shop's reference-image store as soon as it is picked, and shows as a
 * thumbnail with a remove button. Used for reference photos and for a photo of a measurement card.
 */
export default function OrderPhotoPicker({ storeId, photos, onChange, max = 5, addLabel = 'Add photo', alt }: Readonly<{
  storeId: string; photos: string[]; onChange: (next: string[]) => void; max?: number; addLabel?: string; alt: string;
}>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState<number | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post(`/public/stores/${storeId}/upload-reference-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange([...photos, res.data.data.url]);
    } catch {
      setError("That photo didn't upload. Try a smaller image (5 MB or less).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Same grid and tile size as the design cards above, so a reference photo weighs as much as a design. */}
      <div className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-3">
        {photos.map((url, i) => (
          <div key={`${i}-${url}`} className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-line bg-sunken">
            <button type="button" onClick={() => setViewing(i)} aria-label={`View ${alt.toLowerCase()} ${i + 1} full size`} className="group block h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(url)} alt={alt} className="h-full w-full object-cover" />
              <span className="absolute bottom-2 left-2 flex h-8 items-center gap-1 rounded-full bg-ink/80 px-2.5 text-xs font-semibold text-white">
                <Maximize2 size={12} aria-hidden /> View
              </span>
            </button>
            <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} aria-label={`Remove this ${alt.toLowerCase()}`}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-ink/80 text-white">
              <X size={16} />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <label className="flex aspect-square min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-ink-muted transition-colors hover:border-ink hover:text-ink focus-within:border-ink">
            {busy ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={24} />}
            <span className="text-sm font-medium">{busy ? 'Uploading…' : addLabel}</span>
            <input type="file" accept="image/*" className="sr-only" disabled={busy}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <p className="mobile-caption mt-1.5 text-ink-muted">{photos.length} of {max} photos</p>
      {error && <p role="alert" className="mobile-caption mt-1 text-rose-700">{error}</p>}
      {viewing !== null && (
        <OrderPhotoViewer photos={photos} index={viewing} alt={alt} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
