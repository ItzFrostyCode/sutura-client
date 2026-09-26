'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { PublicService } from '@/components/store-storefront/types';

interface ServiceRatingsSectionProps {
  service: PublicService;
  storeId: string;
  myRating: number;
  setMyRating: (r: number | ((prev: number) => number)) => void;
  hoverRating: number;
  setHoverRating: (r: number) => void;
  submittingReview: boolean;
  reviewMessage: { type: 'success' | 'error'; text: string } | null;
  onSubmitReview: (e: React.FormEvent) => void;
  isOwnerViewingOwnStore?: boolean;
}

export default function ServiceRatingsSection({
  service,
  storeId,
  myRating,
  setMyRating,
  hoverRating,
  setHoverRating,
  submittingReview,
  reviewMessage,
  onSubmitReview,
  isOwnerViewingOwnStore = false,
}: ServiceRatingsSectionProps) {
  const avgRating = service.reviews_avg_rating ? Number(service.reviews_avg_rating) : 0;
  const count = service.reviews_count ?? 0;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-serif font-semibold text-taupe-dark">Service Ratings</h2>
        <Link
          href={`/store/${storeId}/service/${service.id}/ratings`}
          className="flex items-center gap-0.5 text-xs font-semibold text-taupe hover:text-ink transition-colors"
        >
          View All <ChevronRight size={13} />
        </Link>
      </div>

      {count > 0 ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber-500">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={16}
                fill={n <= Math.round(avgRating) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span className="font-semibold text-ink text-sm">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-ink-faint text-xs">
            out of 5 · {count} review{count === 1 ? '' : 's'}
          </span>
        </div>
      ) : (
        <p className="text-xs text-ink-faint">No ratings yet.</p>
      )}

      {!isOwnerViewingOwnStore && (
        <form onSubmit={onSubmitReview} className="bg-surface border border-line rounded-none p-3 mt-3">
          <h3 className="text-xs font-semibold text-ink-muted mb-2">Rate this Service</h3>
          <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMyRating((prev) => (prev === n ? 0 : n))}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                className="p-0.5"
              >
                <Star
                  size={20}
                  className={n <= (hoverRating || myRating) ? 'text-amber-500' : 'text-line-strong'}
                  fill={n <= (hoverRating || myRating) ? 'currentColor' : 'none'}
                />
              </button>
            ))}
            <button
              type="submit"
              disabled={submittingReview || myRating < 1}
              className="ml-auto px-3 py-1.5 bg-ink hover:bg-taupe text-white text-xs font-semibold rounded-none transition-colors disabled:opacity-50"
            >
              {submittingReview ? 'Submitting…' : 'Submit'}
            </button>
          </div>
          {reviewMessage && (
            <div
              className={`flex items-center gap-2 mt-2 text-xs px-3 py-2 rounded-none ${
                reviewMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/10 text-danger'
              }`}
            >
              {reviewMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {reviewMessage.text}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
