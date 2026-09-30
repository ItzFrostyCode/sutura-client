'use client';

import React, { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getMediaUrl } from '@/lib/media';

interface StoreImageEditModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly imageType: 'logo' | 'banner';
  readonly currentUrl?: string | null;
  readonly onSaved: () => void;
}

// Logo and banner are shown in the hero header, not inside the About tab —
// so they're edited right there too: click straight on the image, see it
// full view, upload a replacement. Self-contained (own upload + save call)
// since neither field has any other data bundled with it anymore.
export default function StoreImageEditModal({ isOpen, onClose, imageType, currentUrl, onSaved }: StoreImageEditModalProps) {
  const { store, user, token, setAuth, staffProfile } = useAuthStore();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const fieldKey = imageType === 'logo' ? 'logo_path' : 'banner_path';
  const label = imageType === 'logo' ? 'Logo' : 'Banner';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await api.post(`/stores/${store.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = uploadRes.data.data.url;
      const saveRes = await api.put(`/stores/${store.id}`, { [fieldKey]: url });
      if (user && token) setAuth(user, token, saveRes.data.data, staffProfile || undefined);
      toast.success(`${label} updated.`);
      onSaved();
      onClose();
    } catch {
      toast.error(`Failed to update your ${label.toLowerCase()}. Please try again.`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Store ${label}`} maxWidth="max-w-lg">
      <div className="p-5 space-y-5">
        <div
          className={`w-full border border-line bg-canvas overflow-hidden flex items-center justify-center ${
            imageType === 'logo' ? 'aspect-square max-w-[220px] mx-auto rounded-full' : 'aspect-[3/1]'
          }`}
        >
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getMediaUrl(currentUrl)} alt={label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-ink-faint px-4 text-center">No {label.toLowerCase()} uploaded yet.</span>
          )}
        </div>
        <label className="flex items-center justify-center gap-2 min-h-[48px] cursor-pointer text-sm font-semibold text-white bg-taupe hover:bg-[#8A7063] transition-colors">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>{uploading ? 'Uploading...' : `Upload New ${label}`}</span>
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFile} />
        </label>
      </div>
    </Modal>
  );
}
