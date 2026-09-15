'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, Store, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import PublicNav from '@/components/shared/PublicNav';
import SearchInput from '@/components/shared/SearchInput';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import { GARMENT_CATEGORIES, applyCategoryFilter } from '@/lib/garmentCategories';
import type { CatalogItemResult } from '@/types/publicCatalog';

interface RelatedShop {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
}

const SORT_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Newest' },
  { value: 'top_sales', label: 'Top Sales' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-ink-muted">Loading…</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [relatedShops, setRelatedShops] = useState<RelatedShop[]>([]);

  // Resets to page 1 whenever a filter changes — a stale page 4 selection
  // shouldn't survive a brand-new filter combination.
  useEffect(() => { setPage(1); }, [q, category, minPrice, maxPrice, minRating, sortBy]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string | number> = { per_page: 30, page };
      if (q.trim()) params.q = q.trim();
      applyCategoryFilter(params, category);
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (minRating) params.min_rating = minRating;
      if (sortBy) params.sort_by = sortBy;

      api.get('/public/catalog-items', { params })
        .then((res) => {
          setItems(res.data.data ?? []);
          setTotal(res.data.meta?.total ?? 0);
          setLastPage(res.data.meta?.last_page ?? 1);
        })
        .catch(() => { setItems([]); setTotal(0); setLastPage(1); })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, category, minPrice, maxPrice, minRating, sortBy, page]);

  // Shops related to the query — only worth fetching once there's an actual
  // search term; an empty query would just return the newest shops, which
  // isn't "related to" anything.
  useEffect(() => {
    if (!q.trim()) { setRelatedShops([]); return; }
    const handle = setTimeout(() => {
      api.get('/public/shops', { params: { q: q.trim(), per_page: 6 } })
        .then((res) => setRelatedShops(res.data.data ?? []))
        .catch(() => setRelatedShops([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  function handleSearchSubmit() {
    const trimmed = q.trim();
    router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  function clearFilters() {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSortBy('');
  }

  const hasActiveFilters = category || minPrice || maxPrice || minRating;

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />

      {/* Search bar */}
      <div className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className="flex gap-2 max-w-xl">
            <SearchInput value={q} onChange={setQ} placeholder="Search catalog items, e.g. Barong, Uniform..." className="flex-1" />
            <button
              type="submit"
              className="px-5 py-2 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {/* Shops related to the query */}
        {relatedShops.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-ink mb-3">Shops related to &ldquo;{q.trim()}&rdquo;</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {relatedShops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.slug}`}
                  className="shrink-0 w-40 bg-surface border border-line rounded-xl p-3 flex flex-col items-center text-center hover:border-line-strong transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-sunken overflow-hidden relative mb-2">
                    {shop.logo_path ? (
                      <Image src={getMediaUrl(shop.logo_path)} alt="" fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store size={16} className="text-ink-faint" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-ink truncate w-full">{shop.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={10} className="text-taupe fill-taupe" />
                    <span className="text-[11px] text-ink-muted">
                      {shop.reviews_avg_rating ? Number(shop.reviews_avg_rating).toFixed(1) : 'New'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sort tabs + result count */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs text-ink-faint">{loading ? 'Searching…' : `${total} result${total === 1 ? '' : 's'}`}</p>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="lg:hidden px-3 py-1.5 rounded-lg text-xs font-semibold border border-line text-ink-muted hover:bg-sunken transition-colors flex items-center gap-1.5 mr-1"
            >
              <SlidersHorizontal size={12} /> Filters
            </button>
            {SORT_TABS.map((tab) => (
              <button
                key={tab.value || 'default'}
                type="button"
                onClick={() => setSortBy(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  sortBy === tab.value ? 'bg-taupe text-white' : 'text-ink-muted hover:bg-sunken'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar filters */}
          <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-surface border border-line rounded-xl p-4 space-y-6 lg:sticky lg:top-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Category</p>
                <div className="space-y-1">
                  {GARMENT_CATEGORIES.map(({ value, label }) => (
                    <button
                      key={value || 'all'}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        category === value ? 'bg-sunken text-taupe font-semibold' : 'text-ink-muted hover:bg-sunken'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Price Range</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full px-2 py-1.5 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
                  />
                  <span className="text-ink-faint text-xs">–</span>
                  <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full px-2 py-1.5 bg-canvas border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Rating</p>
                <div className="space-y-1">
                  {[['', 'Any'], ['4', '4 stars & up'], ['3', '3 stars & up']].map(([value, label]) => (
                    <button
                      key={value || 'any'}
                      type="button"
                      onClick={() => setMinRating(value)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        minRating === value ? 'bg-sunken text-taupe font-semibold' : 'text-ink-muted hover:bg-sunken'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full px-3 py-2 border border-line rounded-lg text-xs font-semibold text-ink-muted hover:bg-sunken transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </aside>

          {/* Results */}
          <div>
            {loading && (
              <div className="text-center py-16 text-sm text-ink-muted">Searching…</div>
            )}

            {!loading && items.length === 0 && (
              <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
                No items matched your search. Try a broader term or clear a filter.
              </div>
            )}

            {!loading && items.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  {items.map((item) => (
                    <CatalogItemCard key={item.id} item={item} />
                  ))}
                </div>

                {lastPage > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-ink-muted px-2">Page {page} of {lastPage}</span>
                    <button
                      type="button"
                      disabled={page >= lastPage}
                      onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                      className="p-2 rounded-lg border border-line text-ink-muted hover:bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
