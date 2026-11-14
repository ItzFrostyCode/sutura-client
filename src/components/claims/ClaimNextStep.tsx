'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import ClaimEscalate from './ClaimEscalate';
import { claimDateTime, claimDay, peso, type OrderClaim } from './claimTypes';

interface Props {
  readonly claim: OrderClaim;
  readonly onRespond: (choice: 'repair' | 'refund') => Promise<boolean>;
  readonly onEscalate: (message: string) => Promise<boolean>;
}

const note = 'mobile-body-sm rounded-xl bg-sunken px-3 py-3 text-ink';

/** What the customer sees or does next, depending on where the claim stands. Nothing for a claim that is only waiting. */
export default function ClaimNextStep({ claim, onRespond, onEscalate }: Props) {
  const [busy, setBusy] = useState<'repair' | 'refund' | null>(null);
  const choose = async (choice: 'repair' | 'refund') => { setBusy(choice); await onRespond(choice); setBusy(null); };
  const offer = claim.repair_offer;

  return (
    <>
      {claim.status === 'submitted' && <p className="mobile-body-sm text-ink-muted">The shop will look at your report and tell you what it can do.</p>}

      {claim.status === 'repair_offered' && (
        <div className={`${note} space-y-3`}>
          <p>
            The shop offered to repair it for free{offer?.due_date ? <>, ready by <span className="font-semibold">{claimDay(offer.due_date)}</span></> : ''}. You decide.
          </p>
          {offer?.note && <p className="whitespace-pre-line break-words text-ink-muted">“{offer.note}”</p>}
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <button type="button" disabled={busy !== null} onClick={() => void choose('repair')} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-4 text-base font-semibold text-white active:opacity-80 disabled:opacity-50">
              {busy === 'repair' && <Loader2 size={16} className="animate-spin" />}Accept free repair
            </button>
            <button type="button" disabled={busy !== null} onClick={() => void choose('refund')} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-ink bg-white px-4 text-base font-medium text-ink hover:bg-sunken disabled:opacity-50">
              {busy === 'refund' && <Loader2 size={16} className="animate-spin" />}Keep my refund request
            </button>
          </div>
        </div>
      )}

      {claim.repair_order && (
        <p className={note}>
          Repair order{' '}
          <Link href={`/account/orders/${claim.repair_order.id}`} className="font-semibold text-taupe underline underline-offset-2">{claim.repair_order.order_number}</Link>
          {claim.repair_order.due_date ? <>, ready by {claimDay(claim.repair_order.due_date)}</> : ''}. Follow it like any other order.
        </p>
      )}

      {claim.status === 'awaiting_return' && (
        <p className={note}>The shop accepted your refund. Return the garment to the shop. You get your money back once they receive it.</p>
      )}

      {claim.status === 'refunded' && claim.refund_amount !== null && (
        <p className={note}>
          Refunded <span className="font-semibold">{peso(claim.refund_amount)}</span> by {claim.refund_method === 'gcash' ? 'GCash' : 'cash'}
          {claim.refund_reference ? <>, reference <span className="font-mono">{claim.refund_reference}</span></> : ''}
          {claim.refunded_at ? <> on {claimDateTime(claim.refunded_at)}</> : ''}.
          {claim.refund_proof_path && <> <a href={getMediaUrl(claim.refund_proof_path)} target="_blank" rel="noopener noreferrer" className="font-semibold text-taupe underline underline-offset-2">See the receipt</a></>}
        </p>
      )}

      {claim.status === 'declined' && (
        <div className="space-y-3">
          <p className={note}><span className="font-semibold">The shop&apos;s reason:</span> {claim.decline_reason || 'No reason given.'}</p>
          {claim.escalated_ticket_id ? (
            <p className="mobile-body-sm text-ink-muted">
              SUTURA support is looking at this. <Link href={`/account/settings/support/${claim.escalated_ticket_id}`} className="font-semibold text-taupe underline underline-offset-2">Open your support ticket</Link>
            </p>
          ) : <ClaimEscalate onSend={onEscalate} />}
        </div>
      )}
    </>
  );
}
