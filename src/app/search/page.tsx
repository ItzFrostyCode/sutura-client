'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Store } from 'lucide-react';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import SearchInput from '@/components/shared/SearchInput';

interface ShopBranchResult {
  id: number;
  name: string;
  city: string | null;
  landmark: string | null;
}

interface ShopResult {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  logo_path: string | null;
  banner_path: string | null;
  specializations: string[] | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  branches: ShopBranchResult[];
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Featured' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Lowest Price' },
];

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [results, setResults] = useState<ShopResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string> = {};
      if (q.trim()) params.q = q.trim();
      if (minRating) params.min_rating = minRating;
      if (sortBy) params.sort_by = sortBy;

      api.get('/public/shops', { params })
        .then((res) => {
          setResults(res.data.data ?? []);
          setTotal(res.data.meta?.total ?? res.data.data?.length ?? 0);
        })
        .catch(() => { setResults([]); setTotal(0); })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, minRating, sortBy]);

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <h1 className="text-display text-2xl text-ink mb-1">Find a Tailoring Shop</h1>
        <p className="text-sm text-ink-muted mb-6">Search by garment type, shop name, or specialization across Davao City.</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchInput value={q} onChange={setQ} placeholder="Search shops, e.g. Barong, Uniform..." className="flex-1" />
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="px-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
          >
            <option value="">Any rating</option>
            <option value="4">4+ stars</option>
            <option value="3">3+ stars</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading && <div className="text-center py-16 text-sm text-ink-muted">Searching…</div>}

        {!loading && results.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
            No shops matched your search. Try a broader term or clear the filters.
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="text-xs text-ink-faint mb-3">{total} shop{total === 1 ? '' : 's'} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.slug}`}
                  className="bg-surface border border-line rounded-2xl overflow-hidden hover:border-line-strong transition-colors"
                >
                  <div className="h-32 bg-sunken relative">
                    {shop.banner_path ? (
                      <Image src={shop.banner_path} alt={shop.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store size={28} className="text-ink-faint" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-sm font-bold text-ink truncate">{shop.name}</h2>
                    {shop.branches[0] && (
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-1 truncate">
                        <MapPin size={12} className="shrink-0" />
                        {shop.branches[0].city ?? shop.branches[0].name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      <Star size={13} className="text-taupe fill-taupe" />
                      <span className="text-xs font-semibold text-ink">
                        {shop.reviews_avg_rating ? shop.reviews_avg_rating.toFixed(1) : 'New'}
                      </span>
                      <span className="text-xs text-ink-faint">({shop.reviews_count})</span>
                    </div>
                    {shop.specializations && shop.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {shop.specializations.slice(0, 3).map((spec) => (
                          <span key={spec} className="px-2 py-0.5 rounded-full bg-sunken text-ink-muted text-[10px] font-medium">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
