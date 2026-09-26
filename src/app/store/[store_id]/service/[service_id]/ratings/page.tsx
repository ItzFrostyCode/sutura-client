'use client';

import { useEffect, useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { PublicService } from '@/components/store-storefront/types';

type ServiceReview = NonNullable<PublicService['reviews']>[number];

const STAR_FILTERS = [5, 4, 3, 2, 1] as const;

// The service detail page only ever shows a compact "4.7 (12) → View All"
// summary — this is that "View All", mirroring the Catalog item's own
// ratings page (/store/[store_id]/catalog/[item_id]/ratings) exactly:
// the real average up top, a star filter, the full list, and a "leave your
// own rating" form. Service reviews are star-only (no comment column on
// service_reviews — see ServiceReview's backend docblock), so review cards
// here skip the comment paragraph the catalog version has.
export default function ServiceRatingsPage({
  params,
}: Readonly<{ params: Promise<{ store_id: string; service_id: string }> }>) {
  const { store_id: storeId, service_id: serviceId } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [service, setService] = useState<PublicService | null>(null);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // No single-service-by-id public endpoint exists — same pattern the
    // service detail page itself already uses (fetch the store's whole
    // service list, find by id).
    api.get(`/public/stores/${storeId}/services`)
      .then((res) => {
        const list: PublicService[] = res.data.data ?? [];
        setService(list.find((s) => s.id === Number(serviceId)) ?? null);
      })
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

  const reviews = useMemo(() => service?.reviews ?? [], [service]);
  const filteredReviews = useMemo(
    () => (starFilter ? reviews.filter((r) => r.rating === starFilter) : reviews),
    [reviews, starFilter]
  );
  const countByStar = useMemo(() => {
    const map: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => { map[r.rating] = (map[r.rating] ?? 0) + 1; });
    return map;
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      setMessage({ type: 'error', text: 'Please log in to leave a rating.' });
      return;
    }
    if (myRating < 1) {
      setMessage({ type: 'error', text: 'Pick a star rating first.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post(`/stores/${storeId}/services/${serviceId}/reviews`, { rating: myRating });
      setService((prev) => prev ? {
        ...prev,
        reviews_count: res.data.reviews_count,
        reviews_avg_rating: res.data.reviews_avg_rating,
        reviews: [
          { ...res.data.review, user: { id: user.id, name: user.name, profile_picture: null } },
          ...(prev.reviews || []).filter((r) => r.id !== res.data.review.id),
        ],
      } : prev);
      setMessage({ type: 'success', text: 'Thanks for your rating!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit your rating. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <div className="sticky top-0 z-50 bg-surface border-b border-line">
        <div className="relative max-w-7xl mx-auto h-10 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="absolute left-2 sm:left-4 w-9 h-9 flex items-center justify-center text-ink-muted hover:bg-sunken transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-bold text-ink truncate px-10">Ratings &amp; Reviews</h1>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading…</div>}

      {!loading && service && (
        <main className="flex-1 w-full max-w-7xl mx-auto px-[10px] sm:px-6 lg:px-8 py-[14px] sm:py-6">
          <div className="bg-surface border border-line p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="text-center shrink-0">
                <p className="text-3xl font-bold text-ink">
                  {service.reviews_count ? (service.reviews_avg_rating ?? 0).toFixed(1) : '—'}
                </p>
                <div className="flex items-center gap-0.5 text-amber-500 justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={12} fill={n <= Math.round(service.reviews_avg_rating || 0) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-[11px] text-ink-faint mt-1">
                  {service.reviews_count ?? 0} review{service.reviews_count === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex-1 space-y-1">
                {STAR_FILTERS.map((n) => {
                  const count = countByStar[n] ?? 0;
                  const pct = service.reviews_count ? Math.round((count / service.reviews_count) * 100) : 0;
                  return (
                    <div key={n} className="flex items-center gap-2 text-[11px]">
                      <span className="text-ink-faint w-2 shrink-0">{n}</span>
                      <Star size={9} className="text-amber-500 shrink-0" fill="currentColor" />
                      <div className="flex-1 h-1.5 bg-sunken overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
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
              className={`shrink-0 px-3 py-1.5 text-xs font-semibold border transition-colors ${
                starFilter === null ? 'bg-ink text-white border-ink' : 'border-line text-ink-muted'
              }`}
            >
              All
            </button>
            {STAR_FILTERS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStarFilter((prev) => (prev === n ? null : n))}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  starFilter === n ? 'bg-ink text-white border-ink' : 'border-line text-ink-muted'
                }`}
              >
                {n} <Star size={10} fill="currentColor" />
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmitReview} className="bg-surface border border-line p-3 mb-4">
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
                disabled={submitting}
                className="ml-auto px-3 py-1.5 bg-ink hover:bg-taupe text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
            {message && (
              <div className={`flex items-center gap-2 mt-2 text-xs px-3 py-2 ${message.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/10 text-danger'}`}>
                {message.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {message.text}
              </div>
            )}
          </form>

          <div className="space-y-3">
            {filteredReviews.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-8">
                {starFilter ? `No ${starFilter}-star ratings yet.` : 'No ratings yet.'}
              </p>
            )}
            {filteredReviews.map((review: ServiceReview) => {
              const reviewerHref = review.user
                ? (isAuthenticated && user?.id === review.user.id ? '/account' : `/profile/${review.user.id}`)
                : null;

              return (
                <div key={review.id} className="bg-surface border border-line p-4">
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
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={12} fill={n <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
