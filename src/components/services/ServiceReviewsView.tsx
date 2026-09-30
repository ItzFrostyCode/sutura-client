'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface Rating {
  id: number;
  rating: number;
  created_at: string;
  user: { id: number; name: string } | null;
  service: { id: number; name: string } | null;
}

// Every star rating customers left on your services. Ratings are star-only, so there is nothing to reply to.
export default function ServiceReviewsView() {
  const { store } = useAuthStore();
  const [rows, setRows] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [rating, setRating] = useState('');

  useEffect(() => {
    if (!store?.id) return;
    let live = true;
    const q = new URLSearchParams({ page: String(page), ...(rating ? { rating } : {}) });
    api.get(`/stores/${store.id}/service-reviews?${q}`)
      .then((res) => { if (live) { setRows(res.data.data.data ?? []); setLastPage(res.data.data.last_page ?? 1); } })
      .catch(console.error)
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [store?.id, page, rating]);

  return (
    <div className="bg-surface border border-line p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Service Ratings</h2>
          <p className="text-xs text-ink-faint mt-0.5">Star ratings customers gave your services.</p>
        </div>
        <select value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} aria-label="Filter by rating" className="h-11 px-3 border border-line bg-surface text-sm text-ink">
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r === 1 ? '' : 's'}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-ink-faint animate-pulse">Loading ratings…</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-faint">No ratings yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{r.service?.name ?? 'Deleted service'}</p>
                <p className="text-xs text-ink-muted truncate">{r.user?.name ?? 'Customer'} · {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-ink shrink-0">
                <Star size={14} className="fill-amber-400 text-amber-500" /> {r.rating}.0
              </span>
            </li>
          ))}
        </ul>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-line">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-11 px-4 border border-line text-sm disabled:opacity-40 cursor-pointer">Prev</button>
          <span className="text-xs text-ink-muted">Page {page} of {lastPage}</span>
          <button type="button" disabled={page >= lastPage} onClick={() => setPage(page + 1)} className="h-11 px-4 border border-line text-sm disabled:opacity-40 cursor-pointer">Next</button>
        </div>
      )}
    </div>
  );
}
