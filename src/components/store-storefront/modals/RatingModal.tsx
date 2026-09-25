import React from 'react';
import { createPortal } from 'react-dom';
import { Star, X, Loader2 } from 'lucide-react';

interface RatingModalProps {
  readonly isOpen: boolean;
  readonly mounted: boolean;
  readonly onClose: () => void;
  /** Name of the thing being rated (a store, or a service) — shown in the
   * modal's heading and prompt. Kept generic so this one modal covers both. */
  readonly subjectName: string;
  /** "Store" or "Service" — only used for the "Rate this {subjectType}" heading. */
  readonly subjectType?: string;
  readonly myReview: { id?: number; rating: number; comment?: string | null } | null;
  readonly ratingValue: number;
  readonly setRatingValue: (val: number) => void;
  readonly hoveredStar: number | null;
  readonly setHoveredStar: (val: number | null) => void;
  readonly isSubmitting: boolean;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
}

export default function RatingModal({
  isOpen,
  mounted,
  onClose,
  subjectName,
  subjectType = 'Store',
  myReview,
  ratingValue,
  setRatingValue,
  hoveredStar,
  setHoveredStar,
  isSubmitting,
  onSubmit,
}: RatingModalProps) {
  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const handleStarClick = (star: number) => {
    if (ratingValue === star) {
      setRatingValue(0);
    } else {
      setRatingValue(star);
    }
  };

  const getStarLabel = () => {
    const val = hoveredStar ?? ratingValue;
    if (val === 0) {
      return myReview?.rating ? '0 Stars (Tap button below to save)' : 'Tap a star to rate';
    }
    const map = ['1 Star · Poor', '2 Stars · Fair', '3 Stars · Good', '4 Stars · Very Good', '5 Stars · Excellent'];
    return map[val - 1] || `${val} Stars`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 pointer-events-auto">
      {/* Backdrop Scrim */}
      <button
        type="button"
        aria-label="Close rating dialog"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 focus:outline-none"
      />

      {/* Dialog Panel */}
      <div className="relative bg-surface rounded-2xl shadow-2xl flex flex-col w-[calc(100%-32px)] max-w-[400px] overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-line">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0 bg-surface">
          <div className="flex items-center gap-2 min-w-0">
            <Star size={16} className="text-amber-500 fill-amber-400 shrink-0" />
            <h2 className="mobile-h4 text-ink truncate">
              {myReview?.rating ? 'Update Rating' : `Rate this ${subjectType}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="text-center">
            <p className="mobile-body-sm text-ink-muted mb-3">
              How was your experience with <span className="font-semibold text-ink">{subjectName}</span>?
            </p>

            {/* Stars row */}
            <div
              className="flex justify-center items-center gap-2 py-2"
              onMouseLeave={() => setHoveredStar(null)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const activeVal = hoveredStar ?? ratingValue;
                const isFilled = activeVal >= star;
                const isCurrentRated = ratingValue === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    title={isCurrentRated ? 'Click again to unrate' : `Rate ${star} star${star > 1 ? 's' : ''}`}
                    className="p-2 transition-all hover:scale-115 active:scale-95 focus:outline-none cursor-pointer"
                  >
                    <Star
                      size={34}
                      className={
                        isFilled
                          ? 'fill-amber-400 text-amber-500 transition-colors'
                          : 'text-line-strong hover:text-amber-400/50 transition-colors'
                      }
                    />
                  </button>
                );
              })}
            </div>

            {/* Star descriptor & helper */}
            <div className="mt-2 min-h-[28px] flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-ink">{getStarLabel()}</span>
              {ratingValue > 0 && (
                <span className="mobile-caption text-ink-muted mt-0.5">Tap the same star to unrate</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-3 border-t border-line">
            <button
              type="submit"
              disabled={isSubmitting || (ratingValue === 0 && !myReview?.rating)}
              className={`w-full btn-primary-mobile text-base font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                ratingValue === 0 && myReview?.rating
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-taupe hover:bg-taupe-hover text-white'
              } disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer`}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              <span>
                {ratingValue === 0
                  ? 'Remove Rating'
                  : myReview?.rating
                  ? ratingValue === myReview.rating
                    ? 'Save Rating'
                    : `Update to ${ratingValue}★`
                  : `Submit ${ratingValue}★`}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] flex items-center justify-center text-center text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
