import React from 'react';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media';
import { CLAIM_STATUS, claimDate, peso, reasonLabel, shortDate, type OrderClaim } from './claimTypes';

interface ClaimSummaryProps {
  readonly claim: OrderClaim;
  /** Where the repair order link goes: the shop's job page or the customer's order page. */
  readonly repairHref?: (id: number) => string;
  readonly forShop?: boolean;
}

// One claim: what was asked, the photos, and where it stands.
export default function ClaimSummary({ claim, repairHref, forShop = false }: ClaimSummaryProps) {
  const status = CLAIM_STATUS[claim.status];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink">{claim.type === 'refund' ? 'Refund' : 'Repair / alteration'}</span>
        <span className="text-xs text-ink-muted">· {reasonLabel(claim.reason)}</span>
        <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md border ${status.tone}`}>{status.label}</span>
      </div>

      <p className="text-sm text-ink-body whitespace-pre-line wrap-break-word">{claim.description}</p>

      {claim.photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {claim.photos.map((url) => (
            <a key={url} href={getMediaUrl(url)} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 border border-line rounded-md overflow-hidden bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(url)} alt="Problem photo" className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-muted">
        Reported {claimDate(claim.created_at)}{forShop && claim.filed_by ? ` by ${claim.filed_by}` : ''}
      </p>

      {claim.status === 'declined' && claim.decline_reason && (
        <p className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <span className="font-semibold">Reason: </span>{claim.decline_reason}
        </p>
      )}

      {claim.repair_offer && (
        <div className="text-sm text-ink-body bg-blue-50/60 border border-blue-200 rounded-lg px-3 py-2 space-y-0.5">
          <p>
            <span className="font-semibold">Free repair offered</span>
            {claim.repair_offer.due_date ? ` · ready by ${shortDate(claim.repair_offer.due_date)}` : ''}
            {claim.repair_offer.declined_at ? ' · customer kept the refund request' : ''}
          </p>
          {claim.repair_offer.note && <p className="text-ink-muted whitespace-pre-line wrap-break-word">&ldquo;{claim.repair_offer.note}&rdquo;</p>}
        </div>
      )}

      {claim.repair_order && (
        <p className="text-sm text-ink-body">
          Repair order{' '}
          {repairHref ? (
            <Link href={repairHref(claim.repair_order.id)} className="font-semibold text-taupe hover:underline">{claim.repair_order.order_number}</Link>
          ) : (
            <span className="font-semibold">{claim.repair_order.order_number}</span>
          )}
          {claim.repair_order.due_date ? ` · due ${new Date(claim.repair_order.due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
        </p>
      )}

      {claim.status === 'refunded' && claim.refund_amount !== null && (
        <p className="text-sm text-ink-body">
          Refunded <span className="font-semibold">{peso(claim.refund_amount)}</span> via {claim.refund_method === 'gcash' ? 'GCash' : 'cash'}
          {claim.refund_reference ? ` · Ref ${claim.refund_reference}` : ''} · {claimDate(claim.refunded_at)}
          {claim.refund_proof_path && (
            <> · <a href={getMediaUrl(claim.refund_proof_path)} target="_blank" rel="noopener noreferrer" className="text-taupe hover:underline">proof</a></>
          )}
        </p>
      )}
    </div>
  );
}
