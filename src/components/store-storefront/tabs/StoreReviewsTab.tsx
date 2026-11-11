import React from 'react';
import { Star, Loader2 } from 'lucide-react';
import { StorefrontReview, StoreProfile } from '../types';
import StoreRatingSummaryCard from '../reviews/StoreRatingSummaryCard';
import StoreReviewRow from '../reviews/StoreReviewRow';

interface StoreReviewsTabProps {
  readonly reviews: StorefrontReview[];
  readonly reviewsLoading: boolean;
  readonly reviewsPage: number;
  readonly setReviewsPage: React.Dispatch<React.SetStateAction<number>>;
  readonly reviewsLastPage: number;
  readonly reviewFilterRating: string;
  readonly setReviewFilterRating: (val: string) => void;
  readonly store: StoreProfile;
  readonly isOwnerViewingOwnStore: boolean;
  readonly myReview: { id?: number; rating: number; comment?: string | null } | null;
  readonly onOpenRatingModal: () => void;
  readonly onDeleteReview: (id: number) => void;
  readonly onReplyToReview: (id: number, reply: string) => Promise<boolean>;
  readonly onToggleFeaturedReview: (id: number, isFeatured: boolean) => void;
}

export default function StoreReviewsTab({
  reviews,
  reviewsLoading,
  reviewsPage,
  setReviewsPage,
  reviewsLastPage,
  reviewFilterRating,
  setReviewFilterRating,
  store,
  isOwnerViewingOwnStore,
  myReview,
  onOpenRatingModal,
  onDeleteReview,
  onReplyToReview,
  onToggleFeaturedReview,
}: StoreReviewsTabProps) {
  return (
    <section aria-labelledby="store-reviews-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 id="store-reviews-title" className="mobile-h2 sm:tablet-h2 text-ink">
            Ratings
          </h2>
          <p className="mobile-body-sm sm:tablet-body-md text-ink-muted mt-0.5">
            Customer ratings breakdown for {store.name}.
          </p>
        </div>

        {/* Only worth showing once there is something to filter. */}
        {(reviews.length > 0 || reviewFilterRating) && (
        <select
          aria-label="Show ratings with"
          value={reviewFilterRating}
          onChange={(e) => {
            setReviewFilterRating(e.target.value);
            setReviewsPage(1);
          }}
          className="h-11 px-3 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe-dark transition-colors"
        >
          <option value="">All Stars</option>
          <option value="5">5 Stars only</option>
          <option value="4">4 Stars only</option>
          <option value="3">3 Stars only</option>
          <option value="2">2 Stars only</option>
          <option value="1">1 Star only</option>
        </select>
        )}
      </div>

      {/* Overall Ratings Summary Card */}
      <StoreRatingSummaryCard
        store={store}
        reviews={reviews}
        reviewsComplete={!reviewFilterRating && reviewsLastPage <= 1 && !reviewsLoading}
        isOwnerViewingOwnStore={isOwnerViewingOwnStore}
        myReview={myReview}
        onOpenRatingModal={onOpenRatingModal}
      />

      {/* Ratings List */}
      {reviewsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-ink-faint w-6 h-6" />
        </div>
      ) : reviews.length === 0 ? (
        // The summary card above already says "No ratings yet" and holds the one rate button; only a star filter that
        // matches nothing needs its own line here.
        reviewFilterRating ? (
          <p className="mobile-body-sm border border-line bg-surface p-5 text-center text-ink-muted">No {reviewFilterRating}-star ratings yet.</p>
        ) : null
      ) : (
        <div className="bg-surface border border-line divide-y divide-line overflow-hidden">
          {reviews.map((review) => (
            <StoreReviewRow
              key={review.id}
              review={review}
              isOwnerViewingOwnStore={isOwnerViewingOwnStore}
              onDeleteReview={onDeleteReview}
              onReplyToReview={onReplyToReview}
              onToggleFeatured={onToggleFeaturedReview}
            />
          ))}

          {reviewsLastPage > 1 && (
            <div className="p-2.5 flex justify-center items-center gap-3 bg-canvas">
              <button
                type="button"
                disabled={reviewsPage === 1}
                onClick={() => setReviewsPage((p) => p - 1)}
                className="min-h-[44px] px-4 py-2 border border-line bg-surface text-sm font-medium disabled:opacity-40 cursor-pointer hover:bg-sunken transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-ink-body font-normal">
                Page {reviewsPage} of {reviewsLastPage}
              </span>
              <button
                type="button"
                disabled={reviewsPage === reviewsLastPage}
                onClick={() => setReviewsPage((p) => p + 1)}
                className="min-h-[44px] px-4 py-2 border border-line bg-surface text-sm font-medium disabled:opacity-40 cursor-pointer hover:bg-sunken transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
