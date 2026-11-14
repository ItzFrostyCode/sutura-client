'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import PhotoThumb from '@/components/jobs/form/PhotoThumb';
import { MAX_CLAIM_PHOTOS } from './claimTypes';

interface Props {
  readonly photos: string[];
  readonly setPhotos: (next: string[]) => void;
  readonly uploadPhoto: (file: File) => Promise<string | null>;
}

/** Up to five photos of the problem, each with a thumbnail and a Remove button. */
export default function ClaimPhotoPicker({ photos, setPhotos, uploadPhoto }: Props) {
  const [uploading, setUploading] = useState(false);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const added: string[] = [];
    for (const f of Array.from(files).slice(0, MAX_CLAIM_PHOTOS - photos.length)) {
      const url = await uploadPhoto(f);
      if (url) added.push(url);
    }
    setPhotos([...photos, ...added].slice(0, MAX_CLAIM_PHOTOS));
    setUploading(false);
  };

  return (
    <div>
      <span className="mobile-body-sm block font-semibold text-ink">Photos of the problem</span>
      <p className="mobile-caption mt-0.5 text-ink-muted">Add 1 to {MAX_CLAIM_PHOTOS} clear photos.</p>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {photos.map((url) => (
          <div key={url} className="space-y-2">
            <PhotoThumb url={url} alt="Photo of the problem" className="aspect-square h-auto w-full" />
            <button type="button" onClick={() => setPhotos(photos.filter((u) => u !== url))} aria-label="Remove photo" className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-sm font-medium text-ink hover:bg-sunken">
              <Trash2 size={14} />Remove
            </button>
          </div>
        ))}
        {photos.length < MAX_CLAIM_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-sm font-medium text-ink-body hover:bg-sunken">
            {uploading ? <><Loader2 size={18} className="animate-spin" />Uploading…</> : <><Plus size={20} />Add photo</>}
            <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>
    </div>
  );
}
