'use client';

import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { CatalogItem, CatalogItemReview } from './types';

interface CatalogRatingsSectionProps {
  item: CatalogItem;
  /** Section heading; the customer page keeps "Product Ratings". */
  title?: string;
  // The customer page still passes its rating-form props; this section is
  // read-only, so they are optional (the owner's Ratings tab has none).
  storeId?: string;
  itemId?: string;
  myRating?: number;
  setMyRating?: (r: number) => void;
  hoverRating?: number;
  setHoverRating?: (r: number) => void;
  submittingReview?: boolean;
  reviewMessage?: { type: 'success' | 'error'; text: string } | null;
  onSubmitReview?: (e: React.FormEvent) => void;
}

const FILTER_TABS = ['All', '5', '4', '3', '2', '1'];
const PAGE_SIZE = 5;

function getInitial(name: string | null | undefined): string {
  if (!name) return '?';
  return name.trim()[0]?.toUpperCase() ?? '?';
}

function formatReviewDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function ReviewItem({ review }: { review: CatalogItemReview }) {
  const initial = getInitial(review.user?.name);
  return (
    <div className="flex gap-3 py-3.5 border-b border-line last:border-0">
      {/* Avatar */}
      <div
        className="w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ background: 'var(--brand-taupe, #8B7355)' }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        {/* Name + date */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink truncate">
            {review.user?.name ?? 'Anonymous'}
          </span>
          <span className="text-xs text-ink-muted shrink-0">
            {formatReviewDate(review.created_at)}
          </span>
        </div>
        {/* Stars */}
        <div className="flex items-center gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={11}
              className={n <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-line-strong'}
            />
          ))}
        </div>
        {/* Comment */}
        {review.comment && (
          <p className="text-sm text-ink-body mt-1.5 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

// Pagination component — numbers are non-clickable when only 1 page,
// prev/next become active only when there are more pages.
function Pagination({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoTo,
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (p: number) => void;
}) {
  if (totalPages <= 1) {
    // Still show the bar but everything is display-only / disabled
    return (
      <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-line">
        <button disabled className="w-8 h-8 flex items-center justify-center border border-line text-ink-muted opacity-40 cursor-not-allowed">
          <ChevronLeft size={14} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center border border-taupe bg-taupe text-white text-xs font-bold cursor-default">
          1
        </button>
        <button disabled className="w-8 h-8 flex items-center justify-center border border-line text-ink-muted opacity-40 cursor-not-allowed">
          <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  // Build page number list — show up to 5 pages, then "..."
  const pages: (number | '...')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3, 4, 5);
    if (totalPages > 5) pages.push('...');
  }

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-line">
      <button
        onClick={onPrev}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center border border-line-strong text-ink hover:border-taupe hover:text-taupe transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-ink-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onGoTo(p as number)}
            className={`w-8 h-8 flex items-center justify-center border text-xs font-semibold transition-colors ${
              currentPage === p
                ? 'border-taupe bg-taupe text-white cursor-default'
                : 'border-line-strong text-ink hover:border-taupe hover:text-taupe'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={onNext}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center border border-line-strong text-ink hover:border-taupe hover:text-taupe transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default function CatalogRatingsSection({
  item,
  title = 'Product Ratings',
}: CatalogRatingsSectionProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const avgRating = item.reviews_avg_rating ?? 0;
  const reviewsCount = item.reviews_count ?? 0;
  const allReviews: CatalogItemReview[] = item.reviews ?? [];

  // Filter by active tab
  const filtered =
    activeFilter === 'All'
      ? allReviews
      : allReviews.filter((r) => r.rating === Number(activeFilter));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to page 1 when filter changes — handled inline via key would
  // remount; simpler to just guard currentPage on render.
  const safePage = Math.min(currentPage, totalPages);
  const pageReviews = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (tab: string) => {
    setActiveFilter(tab);
    setCurrentPage(1);
  };

  return (
    <div className="border border-line bg-white">
      {/* Section header — no View All link */}
      <div className="px-4 py-3 border-b border-line">
        <span className="text-xs font-bold uppercase tracking-wider text-ink">
          {title}
        </span>
      </div>

      {/* Rating overview box */}
      {reviewsCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#fafaf8] border-b border-line px-4 py-5">
          {/* Left: big avg + stars */}
          <div className="text-center sm:min-w-[120px] sm:border-r sm:border-line sm:pr-6">
            <p className="text-4xl font-bold text-taupe leading-none">
              {avgRating.toFixed(1)}
              <span className="text-base font-normal text-ink-muted"> / 5</span>
            </p>
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={16}
                  className={
                    n <= Math.round(avgRating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-line-strong'
                  }
                />
              ))}
            </div>
          </div>

          {/* Right: filter pills — All, 5★, 4★, 3★, 2★, 1★ */}
          <div className="flex flex-wrap gap-2 sm:pl-2">
            {FILTER_TABS.map((tab) => {
              const count =
                tab === 'All'
                  ? reviewsCount
                  : allReviews.filter((r) => r.rating === Number(tab)).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleFilterChange(tab)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 border text-xs font-medium transition-all ${
                    activeFilter === tab
                      ? 'bg-taupe text-white border-taupe'
                      : 'bg-white text-ink border-line-strong hover:border-taupe hover:text-taupe'
                  }`}
                >
                  {tab === 'All' ? (
                    'All'
                  ) : (
                    <>
                      {tab}
                      <Star size={10} className="fill-current" />
                    </>
                  )}
                  {count > 0 && (
                    <span
                      className={
                        activeFilter === tab ? 'text-white/80' : 'text-ink-muted'
                      }
                    >
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews list — 5 per page */}
      <div className="px-4">
        {pageReviews.length > 0 ? (
          pageReviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))
        ) : (
          <p className="py-6 text-sm text-ink-muted text-center">
            {reviewsCount === 0
              ? 'No ratings yet.'
              : 'No reviews match this filter.'}
          </p>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onGoTo={(p) => setCurrentPage(p)}
      />
    </div>
  );
}
