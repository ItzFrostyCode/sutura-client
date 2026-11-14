'use client';

import { useState } from 'react';
import { Loader2, Scissors, Undo2 } from 'lucide-react';
import ClaimPhotoPicker from './ClaimPhotoPicker';
import { CLAIM_REASONS, type ClaimReason, type ClaimType, type NewClaim } from './claimTypes';

interface Props {
  /** The last day to report, already formatted ("Nov 15, 2026"). */
  readonly deadline: string;
  readonly uploadPhoto: (file: File) => Promise<string | null>;
  readonly onSubmit: (claim: NewClaim) => Promise<boolean>;
  readonly onCancel: () => void;
}

const CHOICES: { value: ClaimType; title: string; body: string; Icon: typeof Scissors }[] = [
  { value: 'repair', title: 'Free repair', body: 'The shop fixes it at no cost.', Icon: Scissors },
  { value: 'refund', title: 'Refund', body: 'You bring the garment back and get your money back.', Icon: Undo2 },
];

/** "Report a problem": what you want (repair or refund), what is wrong, a few words, and photos. Shown inline on the order page. */
export default function ClaimForm({ deadline, uploadPhoto, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<ClaimType | null>(null);
  const [reason, setReason] = useState<ClaimReason>('poor_stitching');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!type) return setError('Choose what you want: a free repair or a refund.');
    if (description.trim().length < 10) return setError('Tell the shop what happened, in at least 10 letters.');
    if (photos.length === 0) return setError('Add at least one photo of the problem.');
    setError('');
    setSending(true);
    const ok = await onSubmit({ type, reason, description: description.trim(), photos });
    if (!ok) setSending(false); // on success the section closes this form
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="mobile-body-sm text-ink-muted">You can report a problem until {deadline}.</p>

      <fieldset>
        <legend className="mobile-body-sm font-semibold text-ink">What do you want?</legend>
        <div className="mt-2 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          {CHOICES.map(({ value, title, body, Icon }) => (
            <label key={value} className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors ${type === value ? 'border-ink bg-sunken' : 'border-line bg-white hover:bg-sunken'}`}>
              <input type="radio" name="claim-type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" />
              <Icon size={20} className="mt-0.5 shrink-0 text-taupe" aria-hidden />
              <span className="min-w-0">
                <span className="block text-base font-semibold text-ink">{title}</span>
                <span className="mobile-body-sm block text-ink-muted">{body}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mobile-body-sm font-semibold text-ink">What is wrong?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CLAIM_REASONS.map((r) => (
            <label key={r.value} className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-base ${reason === r.value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-sunken'}`}>
              <input type="radio" name="claim-reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="sr-only" />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="claim-description" className="mobile-body-sm block font-semibold text-ink">What happened?</label>
        <textarea
          id="claim-description"
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="For example: the left sleeve seam came apart after one wear."
          className="mt-2 w-full resize-none rounded-xl border border-line bg-white px-3 py-3 text-base text-ink focus:border-ink focus:outline-none"
        />
      </div>

      <ClaimPhotoPicker photos={photos} setPhotos={setPhotos} uploadPhoto={uploadPhoto} />

      {error && <p className="mobile-body-sm text-danger" role="alert">{error}</p>}

      <div className="flex flex-col gap-3 min-[480px]:flex-row-reverse">
        <button type="submit" disabled={sending} className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50 min-[480px]:flex-1">
          {sending && <Loader2 size={16} className="animate-spin" />}Send report
        </button>
        <button type="button" onClick={onCancel} className="h-[52px] cursor-pointer rounded-full border border-line bg-white px-6 text-base font-medium text-ink hover:bg-sunken">Cancel</button>
      </div>
    </form>
  );
}
