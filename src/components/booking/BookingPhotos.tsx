'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import PhotoThumb from '@/components/jobs/form/PhotoThumb';

const MAX = 5;

/** The customer's own pictures for the shop (a design they like, the garment to fix). They are saved with the booking. */
export default function BookingPhotos({ storeId, photos, setPhotos }: Readonly<{ storeId: string; photos: string[]; setPhotos: (next: string[]) => void }>) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError('');
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await api.post(`/public/stores/${storeId}/upload-reference-image`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url: string | undefined = res.data?.data?.url || res.data?.url;
      if (url) setPhotos([...photos, url]);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the photo. Use a JPG, PNG or WebP under 5 MB.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="mobile-caption mb-1 block font-semibold text-ink-body">Photos <span className="font-normal text-ink-muted">(optional)</span></span>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((url) => (
          <div key={url} className="space-y-1.5">
            <PhotoThumb url={url} alt="Your photo" className="aspect-square h-auto w-full" />
            <button type="button" onClick={() => setPhotos(photos.filter((u) => u !== url))} aria-label="Remove photo" className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-sm font-medium text-ink hover:bg-sunken"><Trash2 size={14} />Remove</button>
          </div>
        ))}
        {photos.length < MAX && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-sm font-medium text-ink-body hover:bg-sunken">
            {uploading ? <><Loader2 size={18} className="animate-spin" />Uploading…</> : <><Plus size={20} />Add photo</>}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        )}
      </div>
      <p className="mobile-caption mt-1 text-ink-muted">A design you like, or the garment you want fixed. Up to {MAX} photos.</p>
      {error && <p className="mobile-caption mt-1 text-danger">{error}</p>}
    </div>
  );
}
