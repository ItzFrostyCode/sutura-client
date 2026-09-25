'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { CatalogItem } from './types';

interface CatalogRatingsSectionProps {
  item: CatalogItem;
  storeId: string;
  itemId: string;
  myRating: number;
  setMyRating: (r: number) => void;
  hoverRating: number;
  setHoverRating: (r: number) => void;
  submittingReview: boolean;
  reviewMessage: { type: 'success' | 'error'; text: string } | null;
  onSubmitReview: (e: React.FormEvent) => void;
}

export default function CatalogRatingsSection({
  item,
  storeId,
  itemId,
  myRating,
  setMyRating,
  hoverRating,
  setHoverRating,
  submittingReview,
  reviewMessage,
  onSubmitReview,
}: CatalogRatingsSectionProps) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-serif font-semibold text-taupe-dark">Product Ratings</h2>
        <Link
          href={`/store/${storeId}/catalog/${itemId}/ratings`}
          className="flex items-center gap-0.5 text-xs font-semibold text-taupe"
        >
          View All <ChevronRight size={13} />
        </Link>
      </div>

      {item.reviews_count ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber-500">
            {[1, 2, 3, 4, 5].map(n => (
              <Star
                key={n}
                size={16}
                fill={n <= Math.round(item.reviews_avg_rating || 0) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span className="font-semibold text-ink text-sm">{item.reviews_avg_rating?.toFixed(1)}</span>
          <span className="text-ink-faint text-xs">
            out of 5 · {item.reviews_count} review{item.reviews_count === 1 ? '' : 's'}
          </span>
        </div>
      ) : (
        <p className="text-xs text-ink-faint">No ratings yet.</p>
      )}

      <form onSubmit={onSubmitReview} className="bg-surface border border-line rounded-none p-3 mt-3">
        <h3 className="text-xs font-semibold text-ink-muted mb-2">Rate this Item</h3>
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setMyRating(n)}
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
          <div className={`flex items-center gap-2 mt-2 text-xs px-3 py-2 rounded-none ${reviewMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/10 text-danger'}`}>
            {reviewMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {reviewMessage.text}
          </div>
        )}
      </form>
    </div>
  );
}
