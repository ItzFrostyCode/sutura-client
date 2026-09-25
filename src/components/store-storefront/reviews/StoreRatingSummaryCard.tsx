import React from 'react';
import { Star } from 'lucide-react';
import { StorefrontReview, StoreProfile } from '../types';

interface StoreRatingSummaryCardProps {
  readonly store: StoreProfile;
  readonly reviews: StorefrontReview[];
  readonly isOwnerViewingOwnStore: boolean;
  readonly myReview: { id?: number; rating: number; comment?: string | null } | null;
  readonly onOpenRatingModal: () => void;
}

export default function StoreRatingSummaryCard({
  store,
  reviews,
  isOwnerViewingOwnStore,
  myReview,
  onOpenRatingModal,
}: StoreRatingSummaryCardProps) {
  const avg = Number(store.reviews_avg_rating || 4.9);
  const totalCount = reviews.length || 1;

  return (
    <div className="bg-surface border border-line p-3.5 sm:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
        {/* Big score summary */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left justify-center border-b sm:border-b-0 sm:border-r border-line pb-3.5 sm:pb-0 sm:pr-3.5">
          <span className="text-4xl font-black text-ink font-serif tracking-tight">
            {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : '4.9'}
          </span>
          <div className="flex items-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={18}
                className={star <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
              />
            ))}
          </div>
          <span className="mobile-caption text-ink-muted">
            Based on {store.reviews_count || reviews.length || 0} customer rating
            {(store.reviews_count || reviews.length) === 1 ? '' : 's'}
          </span>

          {!isOwnerViewingOwnStore && (
            <button
              type="button"
              onClick={onOpenRatingModal}
              className="mt-3 w-full sm:w-auto min-h-[44px] h-[48px] inline-flex items-center justify-center gap-2 px-5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
            >
              <Star
                size={16}
                className={myReview?.rating ? 'fill-amber-300 text-amber-300' : 'fill-white text-white'}
              />
              <span>{myReview?.rating ? `Your Rating: ${myReview.rating}★ (Edit)` : 'Rate this Store'}</span>
            </button>
          )}
        </div>

        {/* Star Distribution Bars */}
        <div className="space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((starNum) => {
            const starMatches = reviews.filter((r) => Math.round(r.rating) === starNum).length;
            const percentage =
              reviews.length > 0
                ? Math.round((starMatches / totalCount) * 100)
                : starNum === 5
                ? 85
                : starNum === 4
                ? 15
                : 0;

            return (
              <div key={starNum} className="flex items-center gap-2">
                <span className="w-9 font-medium text-ink text-right flex items-center justify-end gap-0.5 text-xs">
                  {starNum} <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-sunken overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-[11px] text-ink-faint text-right">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
