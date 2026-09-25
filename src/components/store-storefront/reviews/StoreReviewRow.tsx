import React from 'react';
import { Star } from 'lucide-react';
import { StorefrontReview } from '../types';

interface StoreReviewRowProps {
  readonly review: StorefrontReview;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onDeleteReview: (id: number) => void;
}

export default function StoreReviewRow({
  review,
  isOwnerViewingOwnStore,
  onDeleteReview,
}: StoreReviewRowProps) {
  return (
    <div className="p-3 flex items-center justify-between gap-3 min-h-[52px] hover:bg-sunken/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-line/80 flex items-center justify-center font-semibold text-ink-body text-sm shrink-0">
          {review.user?.name?.charAt(0) || 'U'}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink text-sm truncate leading-tight">
            {review.user?.name || 'Customer'}
          </p>
          <time className="text-xs text-ink-faint mt-0.5 block">
            {new Date(review.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={13}
                className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-amber-800 ml-0.5">
            {Number(review.rating).toFixed(1)}
          </span>
        </div>

        {isOwnerViewingOwnStore && (
          <button
            type="button"
            onClick={() => onDeleteReview(review.id)}
            className="min-h-[44px] px-2 text-xs text-danger hover:underline font-semibold ml-1 cursor-pointer flex items-center"
            title="Delete rating"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
