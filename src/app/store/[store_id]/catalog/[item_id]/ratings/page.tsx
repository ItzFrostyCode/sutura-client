'use client';

import { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface CatalogItemReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { id: number; name: string; profile_picture: string | null } | null;
}

interface CatalogItemMini {
  id: number;
  name: string;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  reviews?: CatalogItemReview[];
}

const STAR_FILTERS = [5, 4, 3, 2, 1] as const;

// The item detail page only ever shows a compact "4.7 (12 reviews) → View All"
// summary — this is that "View All": the real average up top, a star filter,
// and the full list, plus the "leave your own rating" form (moved off the
// main page so it doesn't compete with Order/Bulk Order for attention).
export default function ProductRatingsPage({ params }: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  const { store_id: storeId, item_id: itemId } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [item, setItem] = useState<CatalogItemMini | null>(null);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get(`/catalog/${storeId}/${itemId}`)
      .then(res => setItem(res.data.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [storeId, itemId]);

  const reviews = useMemo(() => item?.reviews ?? [], [item]);
  const filteredReviews = useMemo(
    () => (starFilter ? reviews.filter(r => r.rating === starFilter) : reviews),
    [reviews, starFilter]
  );
  const countByStar = useMemo(() => {
    const map: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { map[r.rating] = (map[r.rating] ?? 0) + 1; });
    return map;
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      setMessage({ type: 'error', text: 'Please log in to leave a review.' });
      return;
    }
    if (myRating < 1) {
      setMessage({ type: 'error', text: 'Pick a star rating first.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post(`/stores/${storeId}/catalog/${itemId}/reviews`, { rating: myRating });
      setItem(prev => prev ? {
        ...prev,
        reviews_count: res.data.reviews_count,
        reviews_avg_rating: res.data.average_rating,
        reviews: [
          { ...res.data.review, user: { name: user.name } },
          ...(prev.reviews || []).filter(r => r.id !== res.data.review.id),
        ],
      } : prev);
      setMessage({ type: 'success', text: 'Thanks for your review!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit your review. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* Header bar spans edge-to-edge, but its inner row is capped at the
          same max-w-7xl as PublicNav so the content below doesn't feel
          disconnected from it on wide screens — height only grows past
          mobile's h-10 (already fine as-is) to match PublicNav's own
          sm:h-16, not the reverse. */}
      <div className="sticky top-0 z-50 bg-surface border-b border-line">
        <div className="relative max-w-7xl mx-auto h-10 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="absolute left-2 sm:left-4 w-9 h-9 rounded-full flex items-center justify-center text-ink-muted hover:bg-sunken transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-bold text-ink truncate px-10">Ratings &amp; Reviews</h1>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}

      {!loading && item && (
        <main className="flex-1 w-full max-w-7xl mx-auto px-[10px] sm:px-6 lg:px-8 py-[14px] sm:py-6">
          <div className="bg-surface border border-line rounded-none p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center shrink-0">
                <p className="text-3xl font-bold text-ink">{item.reviews_count ? (item.reviews_avg_rating ?? 0).toFixed(1) : '—'}</p>
                <div className="flex items-center gap-0.5 text-amber-500 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={12} fill={n <= Math.round(item.reviews_avg_rating || 0) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-[11px] text-ink-faint mt-1">{item.reviews_count ?? 0} review{item.reviews_count === 1 ? '' : 's'}</p>
              </div>
              <div className="flex-1 space-y-1">
                {STAR_FILTERS.map(n => {
                  const count = countByStar[n] ?? 0;
                  const pct = item.reviews_count ? Math.round((count / item.reviews_count) * 100) : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-[11px]">
                      <span className="text-ink-faint w-2 shrink-0">{n}</span>
                      <Star size={9} className="text-amber-500 shrink-0" fill="currentColor" />
                      <div className="flex-1 h-1.5 bg-sunken rounded-none overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-none" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-ink-faint w-4 shrink-0 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar mb-4">
            <button
              type="button"
              onClick={() => setStarFilter(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                starFilter === null ? 'bg-ink text-white border-ink' : 'border-line text-ink-muted'
              }`}
            >
              All
            </button>
            {STAR_FILTERS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setStarFilter(prev => (prev === n ? null : n))}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  starFilter === n ? 'bg-ink text-white border-ink' : 'border-line text-ink-muted'
                }`}
              >
                {n} <Star size={10} fill="currentColor" />
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmitReview} className="bg-surface border border-line rounded-none p-3 mb-4">
            <h3 className="text-xs font-semibold text-ink-muted mb-2">Rate this Item</h3>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMyRating(prev => (prev === n ? 0 : n))}
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
                disabled={submitting}
                className="ml-auto px-3 py-1.5 bg-ink hover:bg-taupe text-white text-xs font-semibold rounded-none transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
            {message && (
              <div className={`flex items-center gap-2 mt-2 text-xs px-3 py-2 rounded-none ${message.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/10 text-danger'}`}>
                {message.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {message.text}
              </div>
            )}
          </form>

          <div className="space-y-3">
            {filteredReviews.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-8">
                {starFilter ? `No ${starFilter}-star reviews yet.` : 'No reviews yet.'}
              </p>
            )}
            {filteredReviews.map(review => {
              // Tapping a reviewer goes to your own /account if it's you,
              // otherwise a minimal public profile stub (name/avatar only —
              // never the account-hub content, that's private).
              const reviewerHref = review.user
                ? (isAuthenticated && user?.id === review.user.id ? '/account' : `/profile/${review.user.id}`)
                : null;

              return (
              <div key={review.id} className="bg-surface border border-line rounded-none p-4">
                <div className="flex items-center justify-between mb-1.5">
                  {reviewerHref ? (
                    <Link href={reviewerHref} className="flex items-center gap-2 min-w-0">
                      <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-sunken border-[0.5px] border-line">
                        {review.user?.profile_picture ? (
                          <Image src={review.user.profile_picture} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserIcon size={14} className="text-ink-faint" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-ink truncate">{review.user?.name || 'Anonymous Customer'}</span>
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-ink">Anonymous Customer</span>
                  )}
                  <span className="text-xs text-ink-faint shrink-0">
                    {new Date(review.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-amber-500 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={12} fill={n <= review.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-ink-body leading-relaxed">{review.comment}</p>
                )}
              </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
