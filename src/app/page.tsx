'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, Search as SearchIcon,
  Radar, ShieldCheck, LineChart,
} from 'lucide-react';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import SearchInput from '@/components/shared/SearchInput';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import { GARMENT_CATEGORIES } from '@/lib/garmentCategories';
import type { CatalogItemResult } from '@/types/publicCatalog';

const ABOUT_PILLARS = [
  {
    Icon: Radar,
    title: 'Discover by Garment & Location',
    desc: 'Search verified tailoring shops across Davao City by the exact garment you need — Barong, Filipiniana, uniforms, and more — and see them pinned on the map.',
  },
  {
    Icon: ShieldCheck,
    title: 'Verified Shops Only',
    desc: 'Every shop goes through admin review before it appears here — no unverified listings, no guessing which tailor is legitimate.',
  },
  {
    Icon: LineChart,
    title: 'Real-Time Order Tracking',
    desc: 'Once you place an order, follow it from cutting to pickup with a live status tracker — no more "sa na po ba?" messages.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Live search suggestions — real matching catalog items, not fabricated
  // Shopee-style long-tail phrases (no search-history/trending infra exists
  // in this app to source those from honestly).
  const [suggestions, setSuggestions] = useState<CatalogItemResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { per_page: 48 };
    if (category) params.garment_type = category;

    api.get('/public/catalog-items', { params })
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      api.get('/public/catalog-items', { params: { q: q.trim(), per_page: 6 } })
        .then((res) => setSuggestions(res.data.data ?? []))
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  function goToSearch(query: string) {
    const trimmed = query.trim();
    setSuggestionsOpen(false);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />

      {/* Hero */}
      <section className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <h1 className="text-display text-3xl sm:text-4xl text-ink mb-3">
            Find Your Tailor in Davao City
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-xl mx-auto mb-7">
            Search verified tailoring shops by garment type, browse their branches on the map, or track a garment you already ordered — no account needed.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); goToSearch(q); }}
            className="max-w-lg mx-auto relative"
          >
            <div className="flex gap-2">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Try 'Barong', 'School Uniform', 'Alterations'..."
                className="flex-1"
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
              />
              <button
                type="submit"
                className="px-5 py-2 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
              >
                Search
              </button>
            </div>

            {suggestionsOpen && q.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-line rounded-lg overflow-hidden text-left z-10">
                <button
                  type="button"
                  onClick={() => goToSearch(q)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-sunken transition-colors border-b border-line"
                >
                  <SearchIcon size={14} className="text-ink-faint shrink-0" />
                  Search &ldquo;<span className="font-semibold">{q.trim()}</span>&rdquo;
                </button>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToSearch(item.name)}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink-muted hover:bg-sunken hover:text-ink transition-colors truncate"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </section>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {/* Categories */}
        <h2 className="text-display text-xl text-ink mb-4">Categories</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-10">
          {GARMENT_CATEGORIES.map(({ value, label, Icon }) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setCategory(value)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${
                category === value ? 'bg-sunken' : 'hover:bg-sunken'
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                category === value ? 'bg-taupe border-taupe text-white' : 'bg-surface border-line text-ink-muted'
              }`}>
                <Icon size={18} />
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${
                category === value ? 'text-taupe' : 'text-ink-muted'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Catalog Showroom — 6x8 */}
        <h2 className="text-display text-xl text-ink mb-4">Catalog Showroom</h2>

        {loading && (
          <div className="text-center py-16 text-sm text-ink-muted">Loading catalog…</div>
        )}

        {!loading && items.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
            No catalog items found for this category yet.
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map((item) => (
                <CatalogItemCard key={item.id} item={item} />
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <Link
                href="/search"
                className="px-6 py-2.5 border border-line rounded-lg text-sm font-semibold text-ink hover:border-line-strong hover:bg-sunken transition-colors flex items-center gap-2"
              >
                <SearchIcon size={14} /> See All
              </Link>
            </div>
          </>
        )}
      </main>

      {/* About Sutura */}
      <section id="about" className="bg-surface border-y border-line">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-taupe mb-2">About Sutura</p>
            <h2 className="text-display text-2xl sm:text-3xl text-ink mb-4">
              A Web-Based Tailoring Shop Tracker for Davao City
            </h2>
            <p className="text-sm text-ink-muted">
              SUTURA centralizes and digitizes the discoverability and service tracking of tailoring shops within Davao City —
              connecting customers to verified shops by garment specialization and location, while giving them real-time
              visibility into their order from placement to pickup.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {ABOUT_PILLARS.map(({ Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-taupe" />
                </div>
                <h3 className="text-sm font-bold text-ink mb-1.5">{title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-canvas">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <span className="font-serif font-bold text-lg text-ink">SUTURA</span>
              <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                A Web-Based Tailoring Shop Tracker System for Davao City.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3">Discover</p>
              <ul className="space-y-2">
                <li><Link href="/search" className="text-xs text-ink-muted hover:text-taupe">Search Shops</Link></li>
                <li><Link href="/map" className="text-xs text-ink-muted hover:text-taupe">Browse Map</Link></li>
                <li><Link href="/track" className="text-xs text-ink-muted hover:text-taupe">Track an Order</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3">Account</p>
              <ul className="space-y-2">
                <li><Link href="/login" className="text-xs text-ink-muted hover:text-taupe">Log In</Link></li>
                <li><Link href="/register" className="text-xs text-ink-muted hover:text-taupe">Register a Shop</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3">About</p>
              <ul className="space-y-2">
                <li><a href="#about" className="text-xs text-ink-muted hover:text-taupe">About Sutura</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-ink-faint">© {new Date().getFullYear()} SUTURA. All rights reserved.</p>
            <div className="flex items-center gap-1 text-xs text-ink-faint">
              <MapPin size={12} /> Davao City, Philippines
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
