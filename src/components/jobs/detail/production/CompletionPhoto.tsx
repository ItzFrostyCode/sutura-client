import React, { useState } from 'react';
import { CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { noticeDialog } from '@/store/useConfirmStore';
import { BTN } from '@/components/shared/plainForm';
import SectionHeading from './SectionHeading';

interface CompletionPhotoProps {
  readonly url: string;
  readonly setUrl: (url: string) => void;
  /** A completed order: the photo can be seen, not changed. */
  readonly readOnly?: boolean;
}

/** A quick photo of the finished garment: proof of completion, quality-check evidence, and a portfolio picture. */
export default function CompletionPhoto({ url, setUrl, readOnly }: CompletionPhotoProps) {
  const { store } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file || !store) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${store.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUrl(res.data?.data?.url || res.data?.url || '');
    } catch (err) {
      void noticeDialog(getErrorMessage(err, 'Failed to upload completion photo.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-2 border-t border-line pt-6">
      <SectionHeading icon={CheckCircle2} title="Completion Photo" optional />
      <p className="text-[13px] text-ink-muted">A quick photo of the finished garment — doubles as proof-of-completion, QC evidence, and builds your portfolio.</p>
      {url ? (
        <div className="relative inline-block pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Completed garment" className="h-24 w-24 rounded-xl border border-line object-cover" />
          {!readOnly && (
            <button type="button" onClick={() => setUrl('')} aria-label="Remove completion photo" className="absolute -right-2 top-0 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:text-danger">
              <X size={13} />
            </button>
          )}
        </div>
      ) : readOnly ? null : (
        <label className={`${BTN} cursor-pointer`}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>{uploading ? 'Uploading...' : 'Upload a photo'}</span>
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      )}
    </section>
  );
}
