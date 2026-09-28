'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Star, User as UserIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { PublicServicePackage } from '@/components/store-storefront/types';

interface PackageReview {
  id: number;
  rating: number;
  created_at: string;
  user: { id: number; name: string; profile_picture: string | null } | null;
}

const STAR_FILTERS = [5, 4, 3, 2, 1] as const;

export default function ServicePackageRatingsPage({
  params,
}: Readonly<{ params: Promise<{ store_id: string; package_id: string }> }>) {
  const { store_id: storeId, package_id: packageId } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [servicePackage, setServicePackage] = useState<PublicServicePackage | null>(null);
  const [reviews, setReviews] = useState<PackageReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get(`/public/stores/${storeId}/service-packages`)
      .then((response) => {
        const packages: PublicServicePackage[] = response.data.data ?? [];
        setServicePackage(packages.find((item) => item.id === Number(packageId)) ?? null);
      })
      .catch(() => setServicePackage(null))
      .finally(() => setLoading(false));
  }, [storeId, packageId]);

  useEffect(() => {
    setReviewsLoading(true);
    api.get(`/public/stores/${storeId}/service-packages/${packageId}/reviews?page=${page}`)
      .then((response) => {
        setReviews(response.data.data ?? []);
        setLastPage(response.data.meta?.last_page ?? 1);
        setRatingCounts(response.data.meta?.rating_counts ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      })
      .catch(() => {
        setReviews([]);
        setLastPage(1);
        setRatingCounts({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      })
      .finally(() => setReviewsLoading(false));
  }, [storeId, packageId, page]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get(`/stores/${storeId}/service-packages/${packageId}/my-review`)
      .then((response) => {
        if (response.data?.data) setMyRating(response.data.data.rating);
      })
      .catch(() => {});
  }, [isAuthenticated, storeId, packageId]);

  const filteredReviews = useMemo(
    () => starFilter ? reviews.filter((review) => review.rating === starFilter) : reviews,
    [reviews, starFilter],
  );

  const handleSubmitRating = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated || !user) {
      setMessage({ type: 'error', text: 'Please log in to rate this package.' });
      return;
    }
    if (myRating < 1) {
      setMessage({ type: 'error', text: 'Choose a star rating first.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await api.post(`/stores/${storeId}/service-packages/${packageId}/reviews`, {
        rating: myRating,
      });
      setServicePackage((current) => current ? {
        ...current,
        reviews_count: response.data.reviews_count,
        reviews_avg_rating: response.data.reviews_avg_rating,
      } : current);
      const savedReview: PackageReview = {
        ...response.data.review,
        user: { id: user.id, name: user.name, profile_picture: user.profile_picture ?? null },
      };
      setReviews((current) => [savedReview, ...current.filter((review) => review.id !== savedReview.id)]);
      setMessage({ type: 'success', text: 'Thanks for rating this package!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit your rating. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-ink-muted">Loading package ratings…</div>;
  }

  if (!servicePackage) {
    return <div className="py-16 text-center text-sm text-ink-muted">Package not found.</div>;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <header className="sticky top-0 z-50 bg-surface border-b border-line">
        <div className="relative max-w-7xl mx-auto h-12 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <button
            type="button"
            onClick={() => router.push(`/store/${storeId}/package/${packageId}`)}
            aria-label="Back to package"
            className="absolute left-2 sm:left-4 w-9 h-9 flex items-center justify-center text-ink-muted hover:bg-sunken transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-bold text-ink truncate px-10">Package Ratings</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        <Link href={`/store/${storeId}/package/${packageId}`} className="text-sm font-semibold text-taupe hover:text-taupe-dark">
          {servicePackage.name}
        </Link>

        <section className="mt-4 bg-surface border border-line p-4">
          <div className="flex items-center gap-4">
            <div className="text-center shrink-0">
              <p className="text-3xl font-bold text-ink">
                {servicePackage.reviews_count ? Number(servicePackage.reviews_avg_rating ?? 0).toFixed(1) : '—'}
              </p>
              <div className="flex items-center gap-0.5 text-amber-500 justify-center mt-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Star key={rating} size={12} fill={rating <= Math.round(servicePackage.reviews_avg_rating ?? 0) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="text-[11px] text-ink-faint mt-1">
                {servicePackage.reviews_count ?? 0} rating{servicePackage.reviews_count === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {STAR_FILTERS.map((rating) => {
                const count = ratingCounts[rating] ?? 0;
                const percentage = servicePackage.reviews_count
                  ? Math.round((count / servicePackage.reviews_count) * 100)
                  : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-[11px]">
                    <span className="text-ink-faint w-2 shrink-0">{rating}</span>
                    <Star size={9} className="text-amber-500 shrink-0" fill="currentColor" />
                    <div className="flex-1 h-1.5 bg-sunken overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-ink-faint w-4 shrink-0 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar my-4">
          <button
            type="button"
            onClick={() => setStarFilter(null)}
            className={`shrink-0 px-3 py-1.5 text-xs font-semibold border transition-colors ${starFilter === null ? 'bg-ink text-white border-ink' : 'border-line text-ink-muted'}`}
          >
            All
          </button>
          {STAR_FILTERS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setStarFilter((current) => current === rating ? null : rating)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border transition-colors ${starFilter === rating ? 'bg-ink text-white border-ink' : 'border-line text-ink-muted'}`}
            >
              {rating} <Star size={10} fill="currentColor" />
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmitRating} className="bg-surface border border-line p-3 mb-4">
          <h2 className="text-xs font-semibold text-ink-muted mb-2">Rate this package</h2>
          <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setMyRating((current) => current === rating ? 0 : rating)}
                onMouseEnter={() => setHoverRating(rating)}
                aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                className="p-0.5"
              >
                <Star
                  size={20}
                  className={rating <= (hoverRating || myRating) ? 'text-amber-500' : 'text-line-strong'}
                  fill={rating <= (hoverRating || myRating) ? 'currentColor' : 'none'}
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

        <section className="space-y-3" aria-label="Package ratings list">
          {reviewsLoading && <p className="py-6 text-center text-sm text-ink-muted">Loading ratings…</p>}
          {!reviewsLoading && filteredReviews.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-faint">
              {starFilter ? `No ${starFilter}-star ratings yet.` : 'No ratings yet. Be the first to rate this package.'}
            </p>
          )}
          {!reviewsLoading && filteredReviews.map((review) => {
            const reviewerHref = review.user
              ? (isAuthenticated && user?.id === review.user.id ? '/account' : `/profile/${review.user.id}`)
              : null;
            return (
              <article key={review.id} className="bg-surface border border-line p-4">
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
                  ) : <span className="text-sm font-semibold text-ink">Anonymous Customer</span>}
                  <time className="text-xs text-ink-faint shrink-0">
                    {new Date(review.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </time>
                </div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Star key={rating} size={12} fill={rating <= review.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        {lastPage > 1 && (
          <nav aria-label="Ratings pages" className="flex items-center justify-between mt-5">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm text-ink disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-xs text-ink-faint">Page {page} of {lastPage}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              disabled={page === lastPage}
              className="flex items-center gap-1 px-3 py-2 text-sm text-ink disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}