'use client';

import React from 'react';
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useToast } from '@/context/ToastContext';

// One photo: add, replace, remove. Used by services and combo packages.
export default function ImageUploadField({ value, onChange, storeId, hint, alt }: Readonly<{ value: string; onChange: (url: string) => void; storeId: number; hint: string; alt: string }>) {
  const toast = useToast();
  const [uploading, setUploading] = React.useState(false);

  const upload = async (file: File | undefined) => {
    if (!file || !storeId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data?.data?.url || res.data?.url || '');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload the photo.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">{hint}</p>
      <div className="relative w-full max-w-sm mx-auto aspect-[4/3] sm:aspect-square bg-sunken border border-line overflow-hidden">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediaUrl(value)} alt={alt} className="w-full h-full object-cover object-top" />
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center gap-1 text-ink-muted cursor-pointer hover:bg-line/40">
            {uploading ? <Loader2 className="w-7 h-7 animate-spin text-taupe" /> : <ImagePlus size={34} strokeWidth={1.5} />}
            <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Add photo'}</span>
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        )}
      </div>
      {value && (
        <div className="flex gap-2 justify-center">
          <label className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken">
            <RefreshCw size={15} /> Replace
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <button type="button" onClick={() => onChange('')} className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-danger flex items-center gap-2 cursor-pointer hover:bg-danger/5">
            <Trash2 size={15} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}
