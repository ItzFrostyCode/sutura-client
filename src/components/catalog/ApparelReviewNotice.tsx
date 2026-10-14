import { Clock, XCircle } from 'lucide-react';
import type { ApparelReview } from './catalogTypes';

/** Short label for the grid card badge. */
export function apparelReviewBadge(review?: ApparelReview | null): string | undefined {
  if (!review) return undefined;
  return review.status === 'pending' ? 'In review' : 'Not approved';
}

/**
 * Owner-only banner on a design whose typed-in apparel name is waiting for (or
 * was refused) SUTURA's check — customers can't see the design until it passes.
 */
export default function ApparelReviewNotice({ review }: { readonly review?: ApparelReview | null }) {
  if (!review) return null;
  const pending = review.status === 'pending';
  const Icon = pending ? Clock : XCircle;

  return (
    <div className={`flex gap-3 border px-4 py-3 text-sm ${pending ? 'border-line bg-sunken text-ink-body' : 'border-danger/40 bg-danger/5 text-ink-body'}`} role="status">
      <Icon size={18} className={`mt-0.5 shrink-0 ${pending ? 'text-taupe' : 'text-danger'}`} aria-hidden="true" />
      <p>
        {pending ? (
          <>The apparel name <strong>“{review.label}”</strong> is being checked by SUTURA. This design stays hidden from customers until it is approved, and Pause/Activate unlocks then.</>
        ) : (
          <>The apparel name <strong>“{review.label}”</strong> was not approved{review.reason ? `: ${review.reason}` : '.'} Choose another garment type to show this design to customers and unlock Pause/Activate.</>
        )}
      </p>
    </div>
  );
}
