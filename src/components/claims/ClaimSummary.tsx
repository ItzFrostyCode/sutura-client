import PhotoThumb from '@/components/jobs/form/PhotoThumb';
import ClaimNextStep from './ClaimNextStep';
import { CLAIM_STATUS, claimDateTime, reasonLabel, type OrderClaim } from './claimTypes';

interface Props {
  readonly claim: OrderClaim;
  readonly onRespond: (choice: 'repair' | 'refund') => Promise<boolean>;
  readonly onEscalate: (message: string) => Promise<boolean>;
}

/** One claim, flat: what was reported, the photos, where it stands and what the customer does next. */
export default function ClaimSummary({ claim, onRespond, onEscalate }: Props) {
  const status = CLAIM_STATUS[claim.status] ?? CLAIM_STATUS.submitted;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="mobile-h4 text-ink">{claim.type === 'refund' ? 'Refund' : 'Free repair'} · {reasonLabel(claim.reason)}</h3>
          <p className="mobile-caption text-ink-muted">Reported {claimDateTime(claim.created_at)}</p>
        </div>
        <span className={`mobile-body-sm inline-flex shrink-0 items-center rounded-full px-3 py-1 font-semibold ${status.tone}`}>{status.label}</span>
      </div>

      <p className="mobile-body-md whitespace-pre-line break-words text-ink">{claim.description}</p>

      {claim.photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {claim.photos.map((url) => <PhotoThumb key={url} url={url} alt="Photo of the problem" className="h-16 w-16" />)}
        </div>
      )}

      <ClaimNextStep claim={claim} onRespond={onRespond} onEscalate={onEscalate} />
    </div>
  );
}
