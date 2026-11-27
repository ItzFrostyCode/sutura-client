'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';

interface RateShopStarsProps {
  readonly storeSlug: string;
  readonly storeName: string;
  /** The customer's current rating of this shop (0 = not rated yet). */
  readonly rating: number;
  readonly onRated: (rating: number) => void;
}

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * Shopee-style rating on a completed order: stars only, no comment. One tap saves (the shop's rating is one per
 * customer, so rating another order from the same shop updates it). Saving answers back: the chosen stars pop one
 * after another, "Saved" with a check shows for a moment, and a toast confirms.
 */
export default function RateShopStars({ storeSlug, storeName, rating, onRated }: RateShopStarsProps) {
  const toast = useToast();
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // The stars just saved: they pop, and "Saved" shows, for a moment.
  const [popped, setPopped] = useState(0);
  // The pop itself is short: the chosen stars grow, then settle back.
  const [bump, setBump] = useState(0);
  const shown = hover || rating;

  useEffect(() => {
    if (!popped) return;
    const t = setTimeout(() => setPopped(0), 1800);
    return () => clearTimeout(t);
  }, [popped]);

  useEffect(() => {
    if (!bump) return;
    const t = setTimeout(() => setBump(0), 300 + bump * 60);
    return () => clearTimeout(t);
  }, [bump]);

  const save = async (value: number) => {
    if (saving || value === rating) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/stores/${storeSlug}/reviews`, { rating: value });
      onRated(value);
      setPopped(value);
      setBump(value);
      toast.success(rating > 0 ? `Rating updated to ${value} star${value > 1 ? 's' : ''}.` : `Thanks for rating ${storeName}!`);
    } catch {
      setError('Could not save your rating. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p className="text-sm text-ink-body" aria-live="polite">
        {popped ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-sage">
            <Check size={16} strokeWidth={3} aria-hidden /> Saved · thank you!
          </span>
        ) : rating > 0 ? (
          <>You rated <span className="font-semibold text-ink">{storeName}</span>{hover ? <span className="text-ink-muted"> · {WORDS[hover]}</span> : <span className="text-ink-muted"> · {WORDS[rating]}</span>}</>
        ) : (
          <>How was <span className="font-semibold text-ink">{storeName}</span>?{hover > 0 && <span className="text-ink-muted"> · {WORDS[hover]}</span>}</>
        )}
      </p>
      <div className="flex items-center" role="radiogroup" aria-label={`Rate ${storeName}`} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''} · ${WORDS[n]}`}
            disabled={saving}
            onMouseEnter={() => setHover(n)}
            onClick={() => void save(n)}
            className="flex h-10 w-9 items-center justify-center transition-transform active:scale-90 disabled:cursor-wait"
          >
            <Star
              size={24}
              style={{ transitionDelay: bump && n <= bump ? `${(n - 1) * 60}ms` : '0ms' }}
              className={`transition-[transform,color,fill] duration-200 ${bump && n <= bump ? 'scale-125' : hover === n ? 'scale-110' : ''} ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-line-strong'}`}
            />
          </button>
        ))}
        {saving && <Loader2 size={16} className="ml-1 animate-spin text-ink-faint" aria-label="Saving" />}
      </div>
      {error && <p role="alert" className="w-full text-xs text-danger">{error}</p>}
    </div>
  );
}
