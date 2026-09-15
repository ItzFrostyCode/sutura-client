'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star, MapPin, Store, Search as SearchIcon, Clock,
  Shirt, Crown, UserRound, GraduationCap, Sparkles, Stethoscope,
  HeartPulse, Briefcase, Wrench, Grid3x3, Radar, ShieldCheck, LineChart,
} from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import PublicNav from '@/components/shared/PublicNav';
import SearchInput from '@/components/shared/SearchInput';

interface CatalogImageResult {
  image_url: string;
}

interface CatalogItemResult {
  id: number;
  name: string;
  garment_type: string;
  price: number | null;
  material: string | null;
  estimated_days: number | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  images: CatalogImageResult[];
  shop: { name: string; slug: string } | null;
}

// Mirrors GARMENT_CATEGORY_LABELS in reportHelpers.tsx — the real,
// established garment taxonomy (JobOrder.garment_category /
// CatalogItem.garment_type), not an invented Shopee-style category list.
const CATEGORIES: { value: string; label: string; Icon: typeof Shirt }[] = [
  { value: '', label: 'All', Icon: Grid3x3 },
  { value: 'barong', label: 'Barong Tagalog', Icon: Shirt },
  { value: 'gown', label: 'Gown', Icon: Crown },
  { value: 'suit', label: 'Suit', Icon: UserRound },
  { value: 'filipiniana', label: 'Filipiniana', Icon: Sparkles },
  { value: 'uniform', label: 'School Uniform', Icon: GraduationCap },
  { value: 'lab_gown', label: 'Lab Gown', Icon: Stethoscope },
  { value: 'scrub_suit', label: 'Scrub Suit', Icon: HeartPulse },
  { value: 'corporate_wear', label: 'Corporate Wear', Icon: Briefcase },
  { value: 'alteration_repair', label: 'Alterations', Icon: Wrench },
];

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

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { per_page: 48 };
    if (category) params.garment_type = category;

    api.get('/public/catalog-items', { params })
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category]);

  function handleSearchSubmit() {
    const trimmed = q.trim();
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {/* Categories — 10x1 */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-10">
          {CATEGORIES.map(({ value, label, Icon }) => (
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
                <Link
                  key={item.id}
                  href={item.shop ? `/shop/${item.shop.slug}` : '/search'}
                  className="group block bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors"
                >
                  <div className="aspect-3/4 bg-sunken relative overflow-hidden">
                    {item.images[0]?.image_url ? (
                      <Image
                        src={getMediaUrl(item.images[0].image_url)}
                        alt={item.name}
                        fill
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store size={22} className="text-ink-faint" />
                      </div>
                    )}
                    {/* Hover overlay — shop attribution shows on hover instead
                        of a static name line, matching the storefront's own
                        catalog card pattern (material on hover there). */}
                    <div className="absolute inset-0 bg-surface/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-2 text-center">
                      <span className="text-[11px] font-medium tracking-wide text-ink">
                        {item.shop?.name ?? 'View Details'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    {item.reviews_count ? (
                      <div className="flex items-center gap-1 mb-1">
                        <Star size={11} className="fill-taupe text-taupe" />
                        <span className="text-[11px] font-semibold text-ink">{Number(item.reviews_avg_rating).toFixed(1)}</span>
                        <span className="text-[11px] text-ink-faint">({item.reviews_count})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mb-1 text-ink-faint">
                        <Clock size={11} />
                        <span className="text-[11px]">Est. {item.estimated_days ?? 7}d</span>
                      </div>
                    )}
                    {item.price !== null && (
                      <p className="text-sm font-bold text-taupe">₱{Number(item.price).toLocaleString()}</p>
                    )}
                  </div>
                </Link>
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
