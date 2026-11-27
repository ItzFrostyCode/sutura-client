'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] as const;

interface OrderStoreRatingCardProps {
  readonly storeSlug?: string;
  readonly storeName?: string;
  readonly status: string;
}

export default function OrderStoreRatingCard({
  storeSlug,
  storeName,
  status,
}: OrderStoreRatingCardProps) {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status !== 'completed' || !storeSlug) return;
    let cancelled = false;
    api.get(`/stores/${storeSlug}/my-rating`)
      .then((res) => {
        if (cancelled) return;
        const val = Number(res.data?.data?.rating ?? 0);
        setRating(Number.isFinite(val) ? val : 0);
      })
      .catch(() => {
        if (!cancelled) setRating(0);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [status, storeSlug]);

  if (status !== 'completed' || !storeSlug || !loaded) return null;

  const activeVal = hovered ?? rating;
  const activeLabel = activeVal >= 1 && activeVal <= 5 ? RATING_LABELS[activeVal - 1] : null;
  const savedLabel = rating >= 1 && rating <= 5 ? RATING_LABELS[rating - 1] : null;

  const submit = async (nextRating: number) => {
    if (saving || nextRating === rating) return;
    const previous = rating;
    setRating(nextRating);
    setSaving(true);
    try {
      await api.post(`/stores/${storeSlug}/reviews`, { rating: nextRating });
      toast.success(previous > 0 ? 'Rating updated.' : 'Rating saved.');
    } catch (err) {
      setRating(previous);
      toast.error(getErrorMessage(err, 'Could not save your rating.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-2.5"
      aria-label="Shop rating"
    >
      {rating > 0 ? (
        <p className="text-xs text-ink-muted leading-snug">
          You rated <span className="font-semibold text-ink">{storeName ?? 'this shop'}</span>
          {activeLabel && <span> · {activeLabel}</span>}
        </p>
      ) : (
        <div>
          <h3 className="text-sm font-bold text-ink">
            Rate {storeName ?? 'this shop'}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            {activeLabel ? `${activeVal} Star${activeVal > 1 ? 's' : ''} · ${activeLabel}` : 'Tap a star to share your experience'}
          </p>
        </div>
      )}

      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHovered(null)}
        role="radiogroup"
        aria-label={`Rate ${storeName ?? 'shop'}`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = activeVal >= star;
          const label = RATING_LABELS[star - 1];
          return (
            <button
              key={star}
              type="button"
              disabled={saving}
              onMouseEnter={() => setHovered(star)}
              onClick={() => void submit(star)}
              aria-label={`${star} star${star > 1 ? 's' : ''} (${label})`}
              aria-checked={rating === star}
              role="radio"
              className="w-9 h-9 -ml-1 first:ml-0 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taupe/40"
            >
              <Star
                size={22}
                className={`transition-colors duration-150 ${
                  filled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-line-strong hover:text-amber-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {rating > 0 && savedLabel && hovered === null && (
        <p className="text-[11px] text-ink-faint">Tap a star anytime to update your rating</p>
      )}
    </section>
  );
}
