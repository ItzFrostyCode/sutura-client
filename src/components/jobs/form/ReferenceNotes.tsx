import { Loader2, Plus, Trash2 } from 'lucide-react';
import { BTN_SM } from '@/components/shared/plainForm';
import { useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { FIELD, LABEL } from './FormStep';
import PhotoThumb from './PhotoThumb';

interface Props {
  readonly storeId?: number;
  readonly images: string[];
  readonly onImages: (next: string[]) => void;
  readonly link: string;
  readonly onLink: (v: string) => void;
  readonly notes: string;
  readonly onNotes: (v: string) => void;
  readonly photoLabel: string;
  /** Where a photo came from, by URL: the design, the booking. Anything else was added here. */
  readonly sources?: Record<string, string>;
}

/** A photo or link of what the customer wants (or of the garment as received), plus free notes. */
export default function ReferenceNotes({ storeId, images, onImages, link, onLink, notes, onNotes, photoLabel, sources = {} }: Props) {
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
        <span className={LABEL}>{photoLabel} <span className="font-normal text-espresso/60">(optional)</span></span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {images.map((url) => (
            <div key={url} className="space-y-2">
              <PhotoThumb url={url} alt="Reference" className="aspect-square h-auto w-full" />
              <p className="truncate text-xs text-espresso/60">{sources[url] ?? 'Added now'}</p>
              <button type="button" onClick={() => onImages(images.filter((u) => u !== url))} className={`${BTN_SM} w-full`}><Trash2 size={13} />Remove</button>
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-espresso/25 text-sm font-medium text-espresso hover:bg-espresso/[0.04]">
            {uploading && <Loader2 size={16} className="animate-spin" />}
            {uploading ? 'Uploading…' : <><Plus size={18} />Add photo</>}
            <input type="file" accept="image/*" className="hidden" disabled={uploading || images.length >= 10} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        {uploadError && <p className="mt-1.5 text-sm text-danger">{uploadError}</p>}
      </div>
      <div className="space-y-5">
        <div>
          <label htmlFor="reference_link" className={LABEL}>Reference link</label>
          <input id="reference_link" type="text" value={link} onChange={(e) => onLink(e.target.value)} placeholder="Pinterest, Facebook, Drive…" className={FIELD} />
        </div>
        <div>
          <label htmlFor="notes" className={LABEL}>Notes for the tailors</label>
          <textarea id="notes" value={notes} onChange={(e) => onNotes(e.target.value)} rows={3} placeholder="Requests, changes, anything not covered above" className={`${FIELD} h-auto min-h-24 resize-y py-2`} />
        </div>
      </div>
    </div>
  );
}
