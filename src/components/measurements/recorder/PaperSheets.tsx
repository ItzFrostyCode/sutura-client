'use client';

import React, { useState } from 'react';
import { ImagePlus, Loader2, X, Maximize2, RefreshCw } from 'lucide-react';
import { BTN_SM } from '@/components/shared/plainForm';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import PostImageLightbox from '@/components/profile/PostImageLightbox';

const MAX_PHOTOS = 10;

interface PaperSheetsProps {
  photoUrls: string[];
  onChangePhotos: (newPhotos: string[]) => void;
  storeId?: number;
}

export default function PaperSheets({
  photoUrls,
  onChangePhotos,
  storeId,
}: PaperSheetsProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Upload new photo(s)
  const handleUploadPhoto = async (files: FileList | null) => {
    if (!files || files.length === 0 || !storeId) return;
    if (photoUrls.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} paper sheet photos allowed.`);
      return;
    }

    setUploading(true);
    const addedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        if (photoUrls.length + addedUrls.length >= MAX_PHOTOS) break;
        const fd = new FormData();
        fd.append('file', files[i]);
        const res = await api.post(`/stores/${storeId}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = res.data?.data?.url || res.data?.url;
        if (url) {
          addedUrls.push(url);
        }
      }

      if (addedUrls.length > 0) {
        onChangePhotos([...photoUrls, ...addedUrls].slice(0, MAX_PHOTOS));
        toast.success(`Attached ${addedUrls.length} paper sheet photo(s).`);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to upload paper measurement photo.'));
    } finally {
      setUploading(false);
    }
  };

  // Replace existing photo at index
  const handleReplacePhoto = async (index: number, file: File | undefined) => {
    if (!file || !storeId) return;
    setReplacingIndex(index);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await api.post(`/stores/${storeId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        const next = [...photoUrls];
        next[index] = url;
        onChangePhotos(next);
        toast.success(`Replaced Sheet #${index + 1}.`);
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to replace sheet photo.'));
    } finally {
      setReplacingIndex(null);
    }
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    const next = photoUrls.filter((_, i) => i !== index);
    onChangePhotos(next);
    toast.info('Paper sheet photo removed.');
  };

  const mediaUrls = photoUrls.map(getMediaUrl);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-espresso">Paper measurement sheets <span className="text-sm font-normal text-espresso/60">(optional, up to {MAX_PHOTOS} photos)</span></h3>
        <span className="text-sm text-espresso/60">{photoUrls.length} / {MAX_PHOTOS}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {photoUrls.map((url, idx) => (
          <div key={`${url}-${idx}`} className="space-y-2">
            <div className="aspect-3/4 overflow-hidden rounded-md border border-espresso/25 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(url)} alt={`Paper sheet ${idx + 1}`} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setLightboxIndex(idx)} className={BTN_SM + ' flex-1 px-2'}><Maximize2 size={13} />View</button>
              <label className={BTN_SM + ' flex-1 px-2'}>
                {replacingIndex === idx ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}Replace
                <input type="file" accept="image/*" className="sr-only" disabled={replacingIndex !== null} onChange={(e) => { handleReplacePhoto(idx, e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <button type="button" onClick={() => handleRemovePhoto(idx)} aria-label={`Remove sheet photo ${idx + 1}`} className={BTN_SM + ' w-full px-2'}><X size={13} />Remove</button>
            </div>
          </div>
        ))}
        {photoUrls.length < MAX_PHOTOS && (
          <label className="flex aspect-3/4 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-espresso/25 p-3 text-center text-espresso hover:bg-espresso/[0.04]">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            <span className="text-sm font-medium">{uploading ? 'Uploading…' : 'Add a sheet'}</span>
            <span className="text-xs text-espresso/60">Camera or file</span>
            <input type="file" accept="image/*" multiple capture="environment" className="sr-only" disabled={uploading} onChange={(e) => { handleUploadPhoto(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>

      {/* Full screen Lightbox */}
      <PostImageLightbox
        images={mediaUrls}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
