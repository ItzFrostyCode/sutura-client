'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Store, Search, Map as MapIcon, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import PublicNav from '@/components/shared/PublicNav';
import SearchInput from '@/components/shared/SearchInput';

interface ShopBranchResult {
  id: number;
  name: string;
  city: string | null;
}

interface ShopResult {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path: string | null;
  specializations: string[] | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  branches: ShopBranchResult[];
}

const QUICK_LINKS = [
  { href: '/search', label: 'Search Shops', Icon: Search, desc: 'Filter by garment, price, rating' },
  { href: '/map', label: 'Browse the Map', Icon: MapIcon, desc: 'See every branch in Davao City' },
  { href: '/track', label: 'Track an Order', Icon: Package, desc: 'Check your garment’s progress' },
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [shops, setShops] = useState<ShopResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/shops', { params: { per_page: 8 } })
      .then((res) => setShops(res.data.data ?? []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  function handleSearchSubmit() {
    const trimmed = q.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />

      {/* Hero — the "land here first, browse immediately" surface, Shopee/Lazada style */}
      <section className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <h1 className="text-display text-3xl sm:text-4xl text-ink mb-3">
            Find Your Tailor in Davao City
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-xl mx-auto mb-8">
            Search verified tailoring shops by garment type, browse their branches on the map, or track a garment you already ordered — no account needed.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}
            className="max-w-lg mx-auto flex gap-2"
          >
            <SearchInput value={q} onChange={setQ} placeholder="Try 'Barong', 'School Uniform', 'Alterations'..." className="flex-1" />
            <button
              type="submit"
              className="px-5 py-2 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Quick links — the 3 real surfaces this app actually has */}
      <section className="max-w-5xl w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {QUICK_LINKS.map(({ href, label, Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-surface border border-line rounded-2xl p-5 flex items-start gap-3 hover:border-line-strong transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center shrink-0">
                <Icon size={18} className="text-taupe" />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">{label}</p>
                <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display text-xl text-ink">Featured Shops</h2>
          <Link href="/search" className="text-sm font-medium text-taupe hover:text-taupe-hover">
            See all →
          </Link>
        </div>

        {loading && (
          <div className="text-center py-16 text-sm text-ink-muted">Loading shops…</div>
        )}

        {!loading && shops.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
            No shops available right now — check back soon.
          </div>
        )}

        {!loading && shops.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shop/${shop.slug}`}
                className="bg-surface border border-line rounded-2xl overflow-hidden hover:border-line-strong transition-colors"
              >
                <div className="h-28 bg-sunken relative">
                  {shop.banner_path ? (
                    <Image src={getMediaUrl(shop.banner_path)} alt={shop.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store size={24} className="text-ink-faint" />
                    </div>
                  )}
                  <div className="absolute -bottom-4 left-3 w-10 h-10 rounded-full border-2 border-surface bg-surface overflow-hidden">
                    {shop.logo_path ? (
                      <Image src={getMediaUrl(shop.logo_path)} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-sunken">
                        <Store size={14} className="text-ink-faint" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3.5 pt-6">
                  <h3 className="text-sm font-bold text-ink truncate">{shop.name}</h3>
                  {shop.branches[0] && (
                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-1 truncate">
                      <MapPin size={11} className="shrink-0" />
                      {shop.branches[0].city ?? shop.branches[0].name}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Star size={12} className="text-taupe fill-taupe" />
                    <span className="text-xs font-semibold text-ink">
                      {shop.reviews_avg_rating ? Number(shop.reviews_avg_rating).toFixed(1) : 'New'}
                    </span>
                    <span className="text-xs text-ink-faint">({shop.reviews_count})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
