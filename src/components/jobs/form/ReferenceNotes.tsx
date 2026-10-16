import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { FIELD, LABEL } from './FormStep';

interface Props {
  readonly storeId?: number;
  readonly images: string[];
  readonly onImages: (next: string[]) => void;
  readonly link: string;
  readonly onLink: (v: string) => void;
  readonly notes: string;
  readonly onNotes: (v: string) => void;
  readonly photoLabel: string;
}

/** A photo or link of what the customer wants (or of the garment as received), plus free notes. */
export default function ReferenceNotes({ storeId, images, onImages, link, onLink, notes, onNotes, photoLabel }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const upload = async (file: File | undefined) => {
    if (!file || !storeId) return;
    setUploading(true);
    setUploadError('');
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await api.post(`/stores/${storeId}/upload`, body, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url: string | undefined = res.data?.data?.url || res.data?.url;
      if (url) onImages([...images, url]);
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Failed to upload the photo.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className={LABEL}>{photoLabel} <span className="font-normal normal-case tracking-normal text-ink-faint">(optional)</span></span>
        <div className="flex flex-wrap items-center gap-3">
          {images.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(url)} alt="Reference" className="h-20 w-20 rounded-lg border border-line object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => onImages(images.filter((u) => u !== url))} className="absolute -right-2 -top-2 cursor-pointer rounded-full border border-line bg-surface p-1.5 text-ink-muted hover:text-danger">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-line px-4 text-sm font-semibold text-taupe hover:bg-sunken">
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {uploading ? 'Uploading…' : '+ Add photo'}
            <input type="file" accept="image/*" className="hidden" disabled={uploading || images.length >= 10} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        {uploadError && <p className="mt-1.5 text-xs text-danger">{uploadError}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="reference_link" className={LABEL}>Reference link</label>
          <input id="reference_link" type="text" value={link} onChange={(e) => onLink(e.target.value)} placeholder="Pinterest, Facebook, Drive…" className={FIELD} />
        </div>
        <div className="md:row-span-1">
          <label htmlFor="notes" className={LABEL}>Notes for the tailors</label>
          <textarea id="notes" value={notes} onChange={(e) => onNotes(e.target.value)} rows={3} placeholder="Requests, changes, anything not covered above" className={`${FIELD} h-auto min-h-24 resize-y py-2`} />
        </div>
      </div>
    </div>
  );
}
