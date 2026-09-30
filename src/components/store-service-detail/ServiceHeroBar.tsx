'use client';

import React from 'react';
import { Heart, Star } from 'lucide-react';

interface ServiceHeroBarProps {
  savesCount: number;
  isSaved: boolean;
  togglingSave: boolean;
  onToggleSave: () => void;
  myRating: number;
  setMyRating: (r: number | ((prev: number) => number)) => void;
  hoverRating: number;
  setHoverRating: (r: number) => void;
  onSubmitRating: (e: React.FormEvent) => void;
  submittingReview: boolean;
  /** The owner can't rate their own service. */
  canRate: boolean;
}

// ♥ Favorite (count) on the left, Rate ★★★★★ on the right — the same bar the
// Catalog Design gallery has under its photos.
export default function ServiceHeroBar({
  savesCount,
  isSaved,
  togglingSave,
  onToggleSave,
  myRating,
  setMyRating,
  hoverRating,
  setHoverRating,
  onSubmitRating,
  submittingReview,
  canRate,
}: ServiceHeroBarProps) {
  return (
    <div className="mt-3 px-4 min-[375px]:px-6 min-[600px]:px-0 flex items-center justify-between border-t border-line pt-3 gap-4">
      <button
        type="button"
        onClick={onToggleSave}
        disabled={togglingSave}
        aria-label={isSaved ? 'Unsave' : 'Save'}
        aria-pressed={isSaved}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-rose-600 transition-colors disabled:opacity-50"
      >
        <Heart size={17} className={isSaved ? 'fill-rose-600 text-rose-600' : ''} />
        <span className={`font-medium ${isSaved ? 'text-rose-600' : ''}`}>Favorite ({savesCount})</span>
      </button>

      {canRate && (
        <form onSubmit={onSubmitRating} className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
          <span className="text-xs text-ink-muted font-medium shrink-0">Rate:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMyRating((prev) => (prev === n ? 0 : n))}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`${n} star`}
                className="p-0.5 touch-manipulation"
              >
                <Star size={18} className={n <= (hoverRating || myRating) ? 'text-amber-500 fill-amber-500' : 'text-line-strong'} />
              </button>
            ))}
          </div>
          {myRating > 0 && (
            <button type="submit" disabled={submittingReview} className="text-[11px] font-semibold text-white bg-taupe px-2 py-1 hover:bg-ink transition-colors disabled:opacity-50 shrink-0">
              {submittingReview ? '…' : 'Send'}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
