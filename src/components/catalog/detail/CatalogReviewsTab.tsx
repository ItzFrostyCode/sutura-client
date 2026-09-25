'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { CatalogReview } from './detailTypes';

interface CatalogReviewsTabProps {
  reviews: CatalogReview[];
  reviewsAvgRating?: number | null;
}

export default function CatalogReviewsTab({
  reviews,
  reviewsAvgRating,
}: CatalogReviewsTabProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-base font-bold text-ink">Customer Reviews & Feedback</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Ratings and reviews submitted by verified customers.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-canvas px-4 py-2 rounded-xl border border-line">
          <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
            <Star size={18} className="fill-current" />
            <span>{reviewsAvgRating ? reviewsAvgRating : '0.0'}</span>
          </div>
          <span className="text-xs font-medium text-ink-muted">({reviews.length} reviews)</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <Star size={38} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold">No reviews submitted yet for this item.</p>
          <p className="text-xs text-ink-faint mt-1">
            Reviews left on your public storefront will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-xl bg-canvas border border-line/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-ink">{rev.user?.name || 'Customer'}</span>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={`star-${rev.id}-${i}`}
                        size={12}
                        className={i < (rev.rating || 0) ? 'fill-current' : 'text-zinc-300'}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[11px] text-ink-muted">
                  {new Date(rev.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {rev.comment && (
                <p className="text-xs text-ink-body leading-relaxed">{rev.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
