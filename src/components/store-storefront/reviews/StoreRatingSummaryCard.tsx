import React from 'react';
import { Star } from 'lucide-react';
import { StorefrontReview, StoreProfile } from '../types';

interface StoreRatingSummaryCardProps {
  readonly store: StoreProfile;
  readonly reviews: StorefrontReview[];
  /** True when `reviews` is every review of the shop (one page, no star filter), so the bars can be drawn from it. */
  readonly reviewsComplete: boolean;
  readonly isOwnerViewingOwnStore: boolean;
  readonly myReview: { id?: number; rating: number; comment?: string | null } | null;
  readonly onOpenRatingModal: () => void;
}

/**
 * The shop's real rating, or an honest "No ratings yet". Never a placeholder score: it used to show 4.9★ and an
 * 85% / 15% split for a shop nobody had rated, which is fabricated data in front of customers.
 * The star bars are drawn only when every review is on screen; from one page (or one star filter) they would lie too.
 * Rating is allowed after a completed order or appointment (StoreReviewController), and the card says so.
 */
export default function StoreRatingSummaryCard({ store, reviews, reviewsComplete, isOwnerViewingOwnStore, myReview, onOpenRatingModal }: StoreRatingSummaryCardProps) {
  const count = Number(store.reviews_count ?? 0) || (reviewsComplete ? reviews.length : 0);
  const avg = count > 0 && store.reviews_avg_rating != null ? Number(store.reviews_avg_rating) : null;
  const showBars = reviewsComplete && reviews.length > 0;

  return (
    <div className="border border-line bg-surface p-4 sm:p-5">
      <div className={`grid grid-cols-1 items-center gap-4 ${showBars ? 'sm:grid-cols-2' : ''}`}>
        <div className={`flex flex-col items-center text-center ${showBars ? 'border-b border-line pb-4 sm:items-start sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4 sm:text-left' : ''}`}>
          {avg !== null ? (
            <>
              <span className="font-serif text-4xl font-black tracking-tight text-ink">{avg.toFixed(1)}</span>
              <div className="my-1.5 flex items-center gap-1" aria-label={`${avg.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} aria-hidden className={s <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-line-strong'} />
                ))}
              </div>
              <span className="mobile-body-sm text-ink-muted">Based on {count} customer rating{count === 1 ? '' : 's'}</span>
            </>
          ) : (
            <>
              <Star size={32} className="text-line-strong" aria-hidden />
              <p className="mobile-h4 mt-2 text-ink">No ratings yet</p>
              <p className="mobile-body-sm mt-1 text-ink-muted">Customers can rate {store.name} after a completed order or appointment.</p>
            </>
          )}

          {!isOwnerViewingOwnStore && (
            <button
              type="button"
              onClick={onOpenRatingModal}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 bg-taupe-dark px-5 text-base font-semibold text-white transition-colors hover:bg-nav-bar sm:w-auto"
            >
              <Star size={16} aria-hidden className={myReview?.rating ? 'fill-amber-300 text-amber-300' : 'fill-white text-white'} />
              <span>{myReview?.rating ? `Your rating: ${myReview.rating}★ · Edit` : 'Rate this shop'}</span>
            </button>
          )}
        </div>

        {showBars && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const matches = reviews.filter((r) => Math.round(r.rating) === starNum).length;
              const pct = Math.round((matches / reviews.length) * 100);
              return (
                <div key={starNum} className="flex items-center gap-2 text-xs">
                  <span className="flex w-9 items-center justify-end gap-0.5 font-medium text-ink">
                    {starNum} <Star size={12} className="fill-amber-400 text-amber-400" aria-hidden />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden bg-sunken">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-9 text-right text-ink-muted">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
