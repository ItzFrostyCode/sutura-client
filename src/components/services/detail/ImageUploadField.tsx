'use client';

import React from 'react';
import { ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useToast } from '@/context/ToastContext';

/** Upload one image to the shop's storage; resolves to its URL (or '' on failure, after a toast). */
export function useImageUpload(storeId: number) {
  const toast = useToast();
  const [uploading, setUploading] = React.useState(false);
  const upload = async (file: File | undefined): Promise<string | null> => {
    if (!file || !storeId) return null;
    if (!file.type.startsWith('image/')) {
      toast.error('That file isn’t an image. Use a JPG, PNG or WebP.');
      return null;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data?.data?.url || res.data?.url || '';
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload the photo.'));
      return null;
    } finally {
      setUploading(false);
    }
  };
  return { upload, uploading };
}

// One photo: add (click or drag-and-drop), replace, remove. Used by services
// and combo packages. `compact` = a short strip, for optional extras such as
// a reference chart.
export default function ImageUploadField({ value, onChange, storeId, hint, alt, compact = false, emptyLabel = 'Add photo' }: Readonly<{
  value: string;
  onChange: (url: string) => void;
  storeId: number;
  hint: string;
  alt: string;
  compact?: boolean;
  emptyLabel?: string;
}>) {
  const { upload: uploadFile, uploading } = useImageUpload(storeId);
  const [dragging, setDragging] = React.useState(false);
  const upload = async (file: File | undefined) => {
    const url = await uploadFile(file);
    if (url !== null) onChange(url);
  };

  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (!uploading) setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragging(false); if (!uploading) upload(e.dataTransfer.files?.[0]); },
  };

  const frame = compact
    ? 'relative w-full h-28 bg-sunken border border-line overflow-hidden'
    : 'relative w-full max-w-sm mx-auto aspect-[4/3] sm:aspect-square bg-sunken border border-line overflow-hidden';

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">{hint}</p>
      <div className={`${frame} transition-colors ${dragging ? 'border-taupe bg-taupe/10' : ''}`} {...dropProps}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediaUrl(value)} alt={alt} className={`w-full h-full ${compact ? 'object-contain' : 'object-cover object-top'}`} />
        ) : (
          <label className={`w-full h-full flex ${compact ? 'flex-row gap-3' : 'flex-col gap-1'} items-center justify-center border-2 border-dashed ${dragging ? 'border-taupe' : 'border-transparent'} text-ink-muted cursor-pointer hover:bg-line/40`}>
            {uploading ? <Loader2 className="w-7 h-7 animate-spin text-taupe" /> : <ImagePlus size={compact ? 24 : 34} strokeWidth={1.5} />}
            <span className="text-xs font-medium text-center">
              {uploading ? 'Uploading…' : dragging ? 'Drop to upload' : <>{emptyLabel}<span className="block font-normal text-ink-faint">or drag an image here</span></>}
            </span>
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        )}
      </div>
      {value && (
        <div className={`flex gap-2 ${compact ? '' : 'justify-center'}`}>
          <label className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Replace
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
