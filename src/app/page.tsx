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
  Scissors, Sparkles, LocateFixed, ChevronRight, X, Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import PublicNav from '@/components/shared/PublicNav';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import CatalogItemCardSkeleton from '@/components/discovery/CatalogItemCardSkeleton';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isShopOpen, type OperatingHours } from '@/lib/shopStatus';
import ShopLogoAvatar from '@/components/ShopLogoAvatar';
import { getSavedLocation, saveLocationWithHistory, type SavedLocation } from '@/lib/customerLocation';

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
    desc: 'Search verified tailoring stores across Davao City by the exact garment you need — Barong, Filipiniana, uniforms, and more — and see them pinned on the map.',
  },
  {
    Icon: ShieldCheck,
    title: 'Verified Stores Only',
    desc: 'Every store goes through admin review before it appears here — no unverified listings, no guessing which tailor is legitimate.',
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

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);

  useEffect(() => {
    setSavedLocation(getSavedLocation());

    if (!showLocationModal) return;

    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = document.getElementById('mobile-frame-container');
    const prevFrameOverflow = frame ? frame.style.overflow : '';
    if (frame) {
      frame.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (frame) {
        frame.style.overflow = prevFrameOverflow;
      }
    };
  }, [showLocationModal]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();
    setPendingQuery(query);
    setShowLocationModal(true);
  };

  const handleUseCurrentGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device.');
      return;
    }
    setLocatingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const district = data?.address?.suburb || data?.address?.neighbourhood || data?.address?.city_district || 'Davao City';
          const address = data?.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          saveLocationWithHistory({ lat: latitude, lng: longitude, address, district });
        } catch {
          saveLocationWithHistory({ lat: latitude, lng: longitude, address: `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, district: 'Davao City' });
        } finally {
          setLocatingGps(false);
          setShowLocationModal(false);
          const q = pendingQuery.trim();
          router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
        }
      },
      (err) => {
        console.warn('GPS error:', err);
        setLocatingGps(false);
        setGpsError('Unable to access GPS location. Check browser permission or choose on map.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleContinueWithSaved = () => {
    setShowLocationModal(false);
    const q = pendingQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  const handleChooseOnMap = () => {
    setShowLocationModal(false);
    const q = pendingQuery.trim();
    router.push(q ? `/map?q=${encodeURIComponent(q)}&select=1&returnTo=/&continueTo=/search` : '/map?select=1&returnTo=/&continueTo=/search');
  };

  const handleSearchEntireCity = () => {
    setShowLocationModal(false);
    const q = pendingQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
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
            Search verified Davao City tailoring stores by garment, fabric, or repair service.
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
                <p className="text-xs font-bold text-ink">Find Local Stores</p>
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
            alt="Davao City Tailoring Stores Map"
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


        {/* Stores */}
        <div className="px-[10px] mt-8">
          {shopsLoading && (
            <>
              <h2 className="text-display text-xl text-ink mb-4">Stores</h2>
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
                <h2 className="text-display text-xl text-ink">Stores</h2>
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
                      <div className="absolute -bottom-5 left-3">
                        <ShopLogoAvatar
                          src={shop.logo_path}
                          name={shop.name}
                          className="w-14 h-14 rounded-full border-2 border-surface bg-surface shadow-xs"
                          textClassName="text-base font-bold text-taupe"
                          isOpen={isShopOpen(shop.operating_hours)}
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
              A Web-Based Tailoring Store Tracker for Davao City
            </h2>
            <p className="text-sm text-ink-muted">
              SUTURA centralizes and digitizes the discoverability and service tracking of tailoring stores within Davao City —
              connecting customers to verified stores by garment specialization and location, while giving them real-time
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
              A Web-Based Tailoring Store Tracker System for Davao City.
            </p>

            <div className="grid grid-cols-2 gap-[5px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink mb-2">Discover</p>
                <ul className="space-y-1.5">
                  <li><Link href="/search" className="text-xs text-ink-muted hover:text-taupe">Search Stores</Link></li>
                  <li><Link href="/map" className="text-xs text-ink-muted hover:text-taupe">Browse Map</Link></li>
                  <li><Link href="/track" className="text-xs text-ink-muted hover:text-taupe">Track an Order</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink mb-2">Account</p>
                <ul className="space-y-1.5">
                  <li><Link href="/login" className="text-xs text-ink-muted hover:text-taupe">Log In</Link></li>
                  <li><Link href="/register" className="text-xs text-ink-muted hover:text-taupe">Register a Store</Link></li>
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
      {/* Location Suggestion Modal before proceeding to search */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-auto touch-none overscroll-contain">
          {/* Backdrop scrim */}
          <button
            type="button"
            aria-label="Close location dialog"
            onClick={() => setShowLocationModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 focus:outline-none touch-none"
          />

          {/* Modal Card */}
          <div className="relative bg-surface rounded-2xl shadow-2xl flex flex-col w-[calc(100%-24px)] max-w-[280px] overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-line p-3.5 space-y-3 touch-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowLocationModal(false)}
              className="absolute top-2.5 right-2.5 p-1 rounded-full text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
              aria-label="Close"
            >
              <X size={17} />
            </button>

            {/* Header Icon & Title */}
            <div className="text-center pt-0.5">
              <div className="w-11 h-11 rounded-full bg-taupe/15 text-taupe flex items-center justify-center mx-auto mb-2">
                <LocateFixed size={22} className={locatingGps ? 'animate-pulse' : ''} />
              </div>
              <h2 className="text-sm font-serif font-bold text-ink leading-tight">
                Find Tailors Near You
              </h2>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                Use your current location to discover the closest verified tailor stores in Davao City.
              </p>

              {savedLocation && (
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-sunken border border-line text-[10px] text-ink font-medium max-w-[230px] truncate">
                  <MapPin size={10} className="text-taupe shrink-0" />
                  <span className="truncate">Saved: {savedLocation.district || savedLocation.address}</span>
                </div>
              )}
            </div>

            {/* Error banner if GPS fails */}
            {gpsError && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] text-center">
                {gpsError}
              </div>
            )}

            {/* Actions list */}
            <div className="space-y-1.5 pt-0.5">
              {/* GPS Button */}
              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={locatingGps}
                className="w-full py-2.5 px-3 bg-taupe hover:bg-taupe-hover text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {locatingGps ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Detecting GPS Location…</span>
                  </>
                ) : (
                  <>
                    <LocateFixed size={15} />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>

              {/* Continue with Saved Location (if exists) */}
              {savedLocation && (
                <button
                  type="button"
                  onClick={handleContinueWithSaved}
                  className="w-full py-2 px-3 bg-surface hover:bg-sunken border border-line text-ink rounded-xl font-semibold text-xs flex items-center justify-between transition-colors shadow-xs cursor-pointer"
                >
                  <span className="truncate">Search in {savedLocation.district || 'Saved Location'}</span>
                  <ChevronRight size={14} className="text-ink-faint shrink-0 ml-1" />
                </button>
              )}

              {/* Choose on Map */}
              <button
                type="button"
                onClick={handleChooseOnMap}
                className="w-full py-2 px-3 bg-surface hover:bg-sunken border border-line text-ink rounded-xl font-semibold text-xs flex items-center justify-between transition-colors shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin size={13} className="text-taupe shrink-0" />
                  <span className="truncate">Choose on Map</span>
                </div>
                <ChevronRight size={14} className="text-ink-faint shrink-0 ml-1" />
              </button>
            </div>

            {/* Skip Option */}
            <div className="pt-1 text-center border-t border-line/60">
              <button
                type="button"
                onClick={handleSearchEntireCity}
                className="text-[11px] text-ink-muted hover:text-ink font-medium transition-colors cursor-pointer"
              >
                Search all Davao City without location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
