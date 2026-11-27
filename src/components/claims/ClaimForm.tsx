'use client';

import React, { useState } from 'react';
import { Camera, Loader2, Scissors, Undo2, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { CLAIM_REASONS, type ClaimReason, type ClaimType, type NewClaim } from './claimTypes';

const MAX_PHOTOS = 5;

interface ClaimFormProps {
  /** Uploads one photo and returns its URL (customer and shop use different endpoints). */
  readonly uploadPhoto: (file: File) => Promise<string | null>;
  readonly onSubmit: (claim: NewClaim) => Promise<boolean>;
  readonly onCancel: () => void;
  /** Wording: "you" for the customer, "the customer" when the shop files it. */
  readonly forShop?: boolean;
}

const CHOICES: { value: ClaimType; title: string; body: string; Icon: typeof Scissors }[] = [
  { value: 'repair', title: 'Repair / alteration', body: 'The shop fixes it for free.', Icon: Scissors },
  { value: 'refund', title: 'Refund', body: 'Return the garment and get money back.', Icon: Undo2 },
];

// "Report a problem": what's wrong, photos, and what the customer wants done.
export default function ClaimForm({ uploadPhoto, onSubmit, onCancel, forShop = false }: ClaimFormProps) {
  const [type, setType] = useState<ClaimType | null>(null);
  const [reason, setReason] = useState<ClaimReason>('poor_stitching');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const room = MAX_PHOTOS - photos.length;
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      const url = await uploadPhoto(f);
      if (url) urls.push(url);
    }
    setPhotos((p) => [...p, ...urls].slice(0, MAX_PHOTOS));
    setUploading(false);
  };

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!type) return setError(forShop ? 'Choose what the customer wants: repair or refund.' : 'Choose what you want: repair or refund.');
    if (description.trim().length < 10) return setError('Describe the problem in a few words (at least 10 characters).');
    if (photos.length === 0) return setError('Add at least one photo of the problem.');
    setError('');
    setSubmitting(true);
    // The caller shows its own toast on failure and closes the form on success.
    await onSubmit({ type, reason, description: description.trim(), photos });
    setSubmitting(false);
  };

  const field = 'w-full min-h-11 bg-canvas border border-line rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe';

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <legend className="block text-sm font-medium text-ink-body mb-2">{forShop ? 'What does the customer want?' : 'What would you like?'}</legend>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3">
          {CHOICES.map(({ value, title, body, Icon }) => {
            const on = type === value;
            return (
              <label key={value} className={`flex items-start gap-3 p-3 min-h-16 border rounded-lg cursor-pointer transition-colors ${on ? 'border-ink bg-sunken' : 'border-line-strong bg-white hover:bg-sunken'}`}>
                <input type="radio" name="claim-type" value={value} checked={on} onChange={() => setType(value)} className="sr-only" />
                <Icon size={18} className={`shrink-0 mt-0.5 ${on ? 'text-ink' : 'text-taupe'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{title}</span>
                  <span className="block text-xs text-ink-muted">{body}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="claim-reason" className="block text-sm font-medium text-ink-body mb-1.5">What&apos;s wrong?</label>
        <select id="claim-reason" value={reason} onChange={(e) => setReason(e.target.value as ClaimReason)} className={field}>
          {CLAIM_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="claim-description" className="block text-sm font-medium text-ink-body mb-1.5">Describe the problem</label>
        <textarea
          id="claim-description"
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. The left sleeve seam came apart after one wear."
          className={`${field} resize-none`}
        />
      </div>

      <div>
        <p className="block text-sm font-medium text-ink-body mb-1.5">
          Photos <span className="text-ink-faint font-normal">(1–{MAX_PHOTOS}, required)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            <div key={url} className="relative w-20 h-20 border border-line rounded-lg overflow-hidden bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(url)} alt="Problem photo" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((x) => x !== url))}
                aria-label="Remove photo"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/80 text-white flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className={`w-20 h-20 border border-dashed border-line-strong rounded-lg flex flex-col items-center justify-center gap-1 text-xs text-ink-muted cursor-pointer hover:bg-sunken ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              {uploading ? 'Uploading' : 'Add photo'}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-danger" role="alert">{error}</p>}

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="min-h-11 px-4 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken">Cancel</button>
        <button type="submit" disabled={submitting || uploading} className="min-h-11 px-4 rounded-lg bg-ink text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-ink/90">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Send report
        </button>
      </div>
    </form>
  );
}
