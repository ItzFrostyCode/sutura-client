'use client';

import React, { useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { getErrorMessage } from '@/lib/apiError';

const MAX = 6;

// Shops that measure on paper take a photo of the sheet and attach it — typed values are optional then.
// On a phone the picker opens the camera directly.
export default function MeasurementPhotos({ urls, onChange, storeId }: Readonly<{ urls: string[]; onChange: (u: string[]) => void; storeId: number }>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const add = async (files: FileList | null) => {
    if (!files || !storeId) return;
    setBusy(true);
    setError('');
    const next = [...urls];
    try {
      for (const file of Array.from(files).slice(0, MAX - urls.length)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = res.data?.data?.url || res.data?.url;
        if (url) next.push(url);
      }
      onChange(next);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the photo.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="block text-sm font-medium text-ink-body mb-1.5">Photos of the paper sheet <span className="text-ink-faint font-normal">(optional · up to {MAX})</span></p>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((u, i) => (
          <div key={u} className="relative aspect-square border border-line bg-sunken overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(u)} alt={`Measurement sheet ${i + 1}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange(urls.filter((x) => x !== u))} aria-label="Remove photo" className="absolute top-1 right-1 w-8 h-8 bg-ink/70 text-white flex items-center justify-center cursor-pointer"><X size={14} /></button>
          </div>
        ))}
        {urls.length < MAX && (
          <label className="aspect-square border border-dashed border-line-strong bg-canvas flex flex-col items-center justify-center gap-1 text-ink-muted cursor-pointer hover:bg-sunken">
            {busy ? <Loader2 size={20} className="animate-spin text-taupe" /> : <Camera size={22} />}
            <span className="text-[11px] font-medium">{busy ? 'Uploading…' : 'Add photo'}</span>
            <input type="file" accept="image/*" capture="environment" multiple className="sr-only" disabled={busy} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}
