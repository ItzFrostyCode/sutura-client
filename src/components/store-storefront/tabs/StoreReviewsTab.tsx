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

        <select
          value={reviewFilterRating}
          onChange={(e) => {
            setReviewFilterRating(e.target.value);
            setReviewsPage(1);
          }}
          className="h-9 px-3 bg-surface border border-line text-sm text-ink focus:outline-none focus:border-taupe transition-colors"
        >
          <option value="">All Stars</option>
          <option value="5">5 Stars only</option>
          <option value="4">4 Stars only</option>
          <option value="3">3 Stars only</option>
          <option value="2">2 Stars only</option>
          <option value="1">1 Star only</option>
        </select>
      </div>

      {/* Overall Ratings Summary Card */}
      <StoreRatingSummaryCard
        store={store}
        reviews={reviews}
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
        <div className="text-center py-10 bg-surface border border-line p-5">
          <Star className="mx-auto h-10 w-10 text-ink-faint mb-2" />
          <p className="text-sm font-semibold text-ink">No ratings yet</p>
          <p className="mobile-caption text-ink-muted mt-0.5">Be the first to rate {store.name}!</p>
          {!isOwnerViewingOwnStore && (
            <button
              type="button"
              onClick={onOpenRatingModal}
              className="mt-3.5 min-h-[44px] h-[48px] px-6 bg-taupe text-white text-sm font-semibold hover:bg-taupe-hover transition-colors inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Star size={15} className="fill-white text-white" />
              <span>Rate Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-line divide-y divide-line overflow-hidden">
          {reviews.map((review) => (
            <StoreReviewRow
              key={review.id}
              review={review}
              isOwnerViewingOwnStore={isOwnerViewingOwnStore}
              onDeleteReview={onDeleteReview}
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
