import React, { useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { confirmDialog, noticeDialog } from '@/store/useConfirmStore';
import { BTN } from '@/components/shared/plainForm';
import type { Job } from '../../jobTypes';
import SectionHeading from './SectionHeading';

interface ProgressPhotosProps {
  readonly job: Job;
  readonly stageLabel: (key: string) => string;
  readonly onProgressPhotoAdded: () => void;
  /** A completed order: the photos can be opened, not added or removed. */
  readonly readOnly?: boolean;
}

/** Proof of real progress at the current stage: each upload is tagged with the stage automatically and doubles as a production log. */
export default function ProgressPhotos({ job, stageLabel, onProgressPhotoAdded, readOnly }: ProgressPhotosProps) {
  const { store } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file || !store) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const uploadRes = await api.post(`/stores/${store.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = uploadRes.data?.data?.url || uploadRes.data?.url;
      if (!url) throw new Error('No URL returned from upload');
      await api.post(`/stores/${store.id}/jobs/${job.id}/progress-photos`, { url });
      onProgressPhotoAdded();
    } catch (err) {
      void noticeDialog(getErrorMessage(err, 'Failed to upload progress photo.'));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (url: string) => {
    if (!store || deletingUrl) return;
    setDeletingUrl(url);
    try {
      await api.delete(`/stores/${store.id}/jobs/${job.id}/progress-photos`, { data: { url } });
      onProgressPhotoAdded();
    } catch {
      void noticeDialog('Failed to remove progress photo.');
    } finally {
      setDeletingUrl(null);
    }
  };

  return (
    <section className="space-y-3 border-t border-line pt-6">
      <div className="space-y-2">
        <SectionHeading icon={Camera} title="Progress Photos" optional />
        <p className="text-[13px] text-ink-muted">
          Proof of real progress at whatever stage the job is currently in — builds customer trust and doubles as a production log. Each upload is tagged with the current stage automatically.
        </p>
      </div>

      {job.progress_photos && job.progress_photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {job.progress_photos.map((photo) => (
            <div key={photo.url + photo.uploaded_at} className="relative">
              <a href={photo.url} target="_blank" rel="noopener noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={`Progress at ${photo.stage}`} className="h-24 w-24 rounded-xl border border-line object-cover transition-opacity hover:opacity-80" />
                <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-espresso/60 py-0.5 text-center text-[10px] font-medium capitalize text-white">
                  {stageLabel(photo.stage)}
                </span>
              </a>
              {!readOnly && <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (await confirmDialog({ title: 'Remove this progress photo?', confirmLabel: 'Remove', danger: true })) {
                    remove(photo.url);
                  }
                }}
                disabled={deletingUrl === photo.url}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-xs transition-colors hover:border-danger/30 hover:text-danger"
                title="Remove progress photo"
                aria-label="Remove progress photo"
              >
                {deletingUrl === photo.url ? <Loader2 size={12} className="animate-spin text-danger" /> : <X size={13} />}
              </button>}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <label className={`${BTN} cursor-pointer select-none`}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          <span>{uploading ? 'Uploading...' : 'Add a progress photo'}</span>
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      )}
      {readOnly && !(job.progress_photos && job.progress_photos.length > 0) && <p className="text-[13px] text-ink-muted">No progress photos.</p>}
    </section>
  );
}
