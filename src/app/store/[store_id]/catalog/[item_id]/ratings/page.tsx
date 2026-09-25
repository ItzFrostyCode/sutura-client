'use client';

import { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface CatalogItemReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { name: string } | null;
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
export default function ProductRatingsPage({ params }: Readonly<{ params: Promise<{ shop_id: string; item_id: string }> }>) {
  const { shop_id: shopId, item_id: itemId } = use(params);
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
    api.get(`/catalog/${shopId}/${itemId}`)
      .then(res => setItem(res.data.data))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [shopId, itemId]);

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
      const res = await api.post(`/shops/${shopId}/catalog/${itemId}/reviews`, { rating: myRating });
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
      <div className="sticky top-0 z-50 bg-surface border-b border-line px-4 h-10 flex items-center justify-center relative">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="absolute left-4 p-1 text-ink-muted">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-sm font-bold text-ink truncate px-10">Ratings &amp; Reviews</h1>
      </div>

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}

      {!loading && item && (
        <main className="flex-1 px-[10px] py-[14px]">
          <div className="bg-surface border border-line rounded-2xl p-4 mb-4">
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
                      <div className="flex-1 h-1.5 bg-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
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

          <form onSubmit={handleSubmitReview} className="bg-surface border border-line rounded-2xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-ink mb-3">Rate this Item</h3>
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
                    size={22}
                    className={n <= (hoverRating || myRating) ? 'text-amber-500' : 'text-line-strong'}
                    fill={n <= (hoverRating || myRating) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            {message && (
              <div className={`flex items-center gap-2 mt-3 text-xs px-3 py-2 rounded-lg ${message.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/10 text-danger'}`}>
                {message.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {message.text}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 px-4 py-2 bg-ink hover:bg-taupe text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>

          <div className="space-y-3">
            {filteredReviews.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-8">
                {starFilter ? `No ${starFilter}-star reviews yet.` : 'No reviews yet.'}
              </p>
            )}
            {filteredReviews.map(review => (
              <div key={review.id} className="bg-surface border border-line rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-ink">{review.user?.name || 'Anonymous Customer'}</span>
                  <span className="text-xs text-ink-faint">
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
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
