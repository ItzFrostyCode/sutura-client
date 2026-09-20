'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin, Search as SearchIcon,
  Radar, ShieldCheck, LineChart,
  Store, Star,
  ScanSearch, CalendarCheck2, Activity, PackageCheck,
  Scissors, Sparkles,
} from 'lucide-react';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import CatalogItemCardSkeleton from '@/components/discovery/CatalogItemCardSkeleton';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isShopOpen, type OperatingHours } from '@/lib/shopStatus';

interface ShopResult {
  id: number;
  slug: string;
  name: string;
  logo_path: string | null;
  banner_path: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  branches: { city: string | null; name: string }[];
  operating_hours?: OperatingHours | null;
}

interface ServiceResult {
  id: number;
  name: string;
  base_price: number | null;
  estimated_days: number | null;
  image_url: string | null;
  shop: { name: string; slug: string } | null;
}

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

// The real customer journey (Search → Book/Order → Track → Pickup), not a
// generic "how it works" — matches the thesis's own dual-tracking framework
// (Discovery Tracking: Obj 3+4, Production Tracking: Obj 6) and the real
// pages that exist for each step: /search, /shop/[id]/book, /account/orders
// (or /track for guests), and in-person counter pickup — no courier/delivery
// step, that's explicitly out of scope.
const HOW_IT_WORKS = [
  {
    step: '01',
    Icon: ScanSearch,
    title: 'Search & Discover',
    desc: 'Filter by garment type, price, rating, or Davao district to find a verified shop that does exactly what you need.',
  },
  {
    step: '02',
    Icon: CalendarCheck2,
    title: 'Book or Place an Order',
    desc: 'Reserve a fitting slot or start a custom order directly with the shop, with clear pricing up front.',
  },
  {
    step: '03',
    Icon: Activity,
    title: 'Track Production Live',
    desc: 'Watch your garment move through cutting, sewing, and finishing in real time — no more guessing or follow-up messages.',
  },
  {
    step: '04',
    Icon: PackageCheck,
    title: 'Pick Up at the Shop',
    desc: 'Get notified the moment it’s ready, then claim it in person at the counter with your digital claim code.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const gate = useGuestGatedHref();
  const [items, setItems] = useState<CatalogItemResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSearch, setHeroSearch] = useState('');

  const [shops, setShops] = useState<ShopResult[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  useEffect(() => {
    api.get('/public/shops', { params: { per_page: 8 } })
      .then((res) => setShops(res.data.data ?? []))
      .catch(() => setShops([]))
      .finally(() => setShopsLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/public/catalog-items', { params: { per_page: 48 } })
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/search');
    }
  };


  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav hideMenu={true} />

      {/* HERO — full-bleed, no horizontal padding. Editorial rhythm
          borrowed from the reference (INDOCHINO): full-bleed photography
          alternating with inset content sections below, not everything
          uniformly padded. */}
      <section className="relative h-[440px] shrink-0 overflow-hidden">
        <Image
          src="/images/hero_banner.jpg"
          alt="Davao Bespoke Tailoring Studio"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-3 pb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80 mb-2">
            Davao City &middot; Est. 2026
          </p>
          <h1 className="text-display text-2xl text-white mb-2 leading-tight">
            Find Your Tailor.<br />Track Every Stitch.
          </h1>
          <p className="text-xs text-white/85 mb-4 max-w-[280px]">
            Search verified Davao City tailoring shops by garment, fabric, or repair service.
          </p>

          {/* Big Wide Search Bar replacing the 2 buttons */}
          <form onSubmit={handleHeroSearch} className="w-full">
            <div className="flex items-center gap-2 h-12 w-full px-4 rounded-xl bg-white shadow-xl border border-white/20 transition-all focus-within:ring-2 focus-within:ring-taupe">
              <SearchIcon size={18} className="text-taupe shrink-0" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search Barong, Chiffon & tulle, Sublimation..."
                className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 px-3.5 py-1.5 bg-taupe hover:bg-taupe-hover text-white text-xs font-bold rounded-lg transition-colors active:scale-95"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <main className="flex-1 w-full">
        {/* Tailoring Services & Specialties Quick Hub */}
        <div className="px-[10px] pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Specialties & Services</p>
              <h2 className="text-display text-lg text-ink font-semibold">Tailoring Quick Hub</h2>
            </div>
            <Link href="/services" className="text-xs font-semibold text-taupe hover:text-taupe-hover">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/search?q=bespoke"
              className="bg-surface border border-line rounded-xl p-3 hover:border-taupe/60 transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white transition-colors">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Bespoke & Custom</p>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Barong, Suits, & Gowns</p>
              </div>
            </Link>

            <Link
              href="/search?q=alteration"
              className="bg-surface border border-line rounded-xl p-3 hover:border-taupe/60 transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white transition-colors">
                <Scissors size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Alterations & Repairs</p>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Hemming, resize & zipper</p>
              </div>
            </Link>

            <Link
              href="/map"
              className="bg-surface border border-line rounded-xl p-3 hover:border-taupe/60 transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white transition-colors">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Find Local Shops</p>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Davao districts map</p>
              </div>
            </Link>

            <Link
              href="/track"
              className="bg-surface border border-line rounded-xl p-3 hover:border-taupe/60 transition-all group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-taupe mb-2 group-hover:bg-taupe group-hover:text-white transition-colors">
                <Activity size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">Track Order</p>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Cutting to pickup status</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Find a shop near you — full-bleed, mirrors the reference's
            "Visit Your Local Showroom" banner, pointed at the real /map
            route (Objective 4: Map-Based Interface). Named distinctly from
            the "Showroom" catalog grid below to avoid confusion between the
            two — this is about physical shop locations, not the item grid. */}
        <section className="relative h-[230px] mt-5 overflow-hidden group">
          <Image
            src="/images/davao_map_banner.jpg"
            alt="Davao City Tailoring Shops Map"
            fill
            unoptimized
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/40 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider mb-2 border border-white/25">
              <MapPin size={11} className="text-amber-300" />
              <span>Davao City Districts</span>
            </div>
            <h2 className="text-display text-2xl text-white font-bold mb-1.5 drop-shadow-sm">
              Find a Shop Near You
            </h2>
            <p className="text-xs text-white/90 mb-4 max-w-[280px] leading-relaxed">
              Browse verified tailoring branches across Davao City&apos;s districts on an interactive map.
            </p>
            <Link
              href="/map"
              className="px-5 py-2.5 bg-white text-ink text-xs font-bold rounded-lg hover:bg-white/90 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <MapPin size={13} className="text-taupe" />
              <span>Open Map</span>
            </Link>
          </div>
        </section>

        {/* How SUTURA Works — inset text */}
        <div className="px-[10px] mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-taupe mb-1.5">How SUTURA Works</p>
          <h2 className="text-display text-xl text-ink mb-5">From Search to Pickup</h2>
          <div className="space-y-5">
            {HOW_IT_WORKS.map(({ step, Icon, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-sunken flex items-center justify-center text-taupe">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-ink-faint mb-0.5">STEP {step}</p>
                  <h3 className="text-sm font-bold text-ink mb-1">{title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Showcase Carousel — up to 10 items */}
        <div className="px-[10px] mt-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Curated Atelier Creations</p>
              <h2 className="text-display text-xl text-ink font-semibold">Showroom Catalog</h2>
            </div>
            <Link
              href="/search"
              className="text-xs font-semibold text-taupe hover:text-taupe-hover flex items-center gap-1"
            >
              See all →
            </Link>
          </div>

          {loading && (
            <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[145px] shrink-0">
                  <CatalogItemCardSkeleton />
                </div>
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-ink-muted">
              No catalog items found yet.
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <div className="flex overflow-x-auto hide-scrollbar gap-2.5 pb-2 snap-x snap-mandatory items-stretch">
                {items.slice(0, 10).map((item) => (
                  <div key={item.id} className="w-[145px] shrink-0 snap-start flex">
                    <CatalogItemCard item={item} />
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-3">
                <Link
                  href="/search"
                  className="px-5 py-2 border border-line rounded-lg text-xs font-semibold text-ink hover:border-line-strong hover:bg-sunken transition-colors flex items-center gap-1.5"
                >
                  <SearchIcon size={13} /> See All in Search
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Custom Sublimation & Team Orders spotlight — full-bleed feature banner */}
        <section className="relative h-[220px] mt-5 overflow-hidden">
          <Image
            src="/images/tailor_at_work.jpg"
            alt="Custom Sublimation Team & Sports Apparel"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center text-center px-[10px]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80 mb-1.5">Custom Sublimation & Teams</p>
            <h2 className="text-display text-xl text-white mb-4 max-w-[280px]">
              Custom Sublimation Team & Sports Apparel
            </h2>
            <Link
              href="/search?q=sublimation"
              className="px-4 py-2 bg-white text-ink text-xs font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              Browse Sublimation
            </Link>
          </div>
        </section>


        {/* Shops */}
        <div className="px-[10px] mt-8">
          {shopsLoading && (
            <>
              <h2 className="text-display text-xl text-ink mb-4">Shops</h2>
              <div className="grid grid-cols-2 gap-[5px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-surface border border-line overflow-hidden animate-pulse">
                    <div className="h-28 bg-sunken" />
                    <div className="p-3.5 pt-8 space-y-1.5">
                      <div className="h-3.5 w-3/4 bg-sunken rounded" />
                      <div className="h-3 w-1/2 bg-sunken rounded" />
                      <div className="h-3 w-1/3 bg-sunken rounded mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!shopsLoading && shops.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-display text-xl text-ink">Shops</h2>
                <Link href="/shops" className="text-sm font-medium text-taupe hover:text-taupe-hover">See all →</Link>
              </div>
              <div className="grid grid-cols-2 gap-[5px]">
                {shops.slice(0, 4).map((shop) => (
                  <Link
                    key={shop.id}
                    href={gate(`/shop/${shop.slug}`)}
                    className="bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors"
                  >
                    <div className="h-28 bg-sunken relative">
                      {shop.banner_path ? (
                        <Image src={getMediaUrl(shop.banner_path)} alt={shop.name} fill unoptimized className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store size={24} className="text-ink-faint" />
                        </div>
                      )}
                      <div className="absolute -bottom-5 left-3 w-14 h-14 shrink-0">
                        <div className="w-full h-full rounded-full border-2 border-surface bg-surface overflow-hidden relative">
                          {shop.logo_path ? (
                            <Image src={getMediaUrl(shop.logo_path)} alt="" fill unoptimized className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-sunken">
                              <Store size={14} className="text-ink-faint" />
                            </div>
                          )}
                        </div>
                        {/* Online / Offline status dot */}
                        <span
                          aria-label={isShopOpen(shop.operating_hours) ? 'Online · Open' : 'Offline · Closed'}
                          title={isShopOpen(shop.operating_hours) ? 'Online · Open' : 'Offline · Closed'}
                          className={`absolute bottom-0 right-0 z-10 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${
                            isShopOpen(shop.operating_hours) ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="p-3.5 pt-8">
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
            </>
          )}
        </div>
      </main>

      {/* About Sutura */}
      <section id="about" className="bg-surface border-y border-line mt-14">
        <div className="max-w-5xl mx-auto px-[10px] py-14">
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
          <div className="grid grid-cols-1 gap-6">
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
        <div className="max-w-5xl mx-auto px-[10px] py-5">
          {/* Single stacked column, not a 2-col grid — with only 3 uneven
              nav groups (3/2/1 links), a 2-col grid left a dead cell under
              the shortest column and made "About" read as disconnected
              from "Account". Stacking removes the empty gap and keeps
              grouping unambiguous at this width. */}
          <div className="mb-5">
            <span className="font-serif font-bold text-lg text-ink">SUTURA</span>
            <p className="text-xs text-ink-muted mt-1.5 leading-relaxed mb-4">
              A Web-Based Tailoring Shop Tracker System for Davao City.
            </p>

            <div className="grid grid-cols-2 gap-[5px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink mb-2">Discover</p>
                <ul className="space-y-1.5">
                  <li><Link href="/search" className="text-xs text-ink-muted hover:text-taupe">Search Shops</Link></li>
                  <li><Link href="/map" className="text-xs text-ink-muted hover:text-taupe">Browse Map</Link></li>
                  <li><Link href="/track" className="text-xs text-ink-muted hover:text-taupe">Track an Order</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink mb-2">Account</p>
                <ul className="space-y-1.5">
                  <li><Link href="/login" className="text-xs text-ink-muted hover:text-taupe">Log In</Link></li>
                  <li><Link href="/register" className="text-xs text-ink-muted hover:text-taupe">Register a Shop</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-widest text-ink mb-2">About</p>
              <ul className="space-y-1.5">
                <li><a href="#about" className="text-xs text-ink-muted hover:text-taupe">About Sutura</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line pt-3 flex flex-col sm:flex-row items-center justify-between gap-1.5">
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
