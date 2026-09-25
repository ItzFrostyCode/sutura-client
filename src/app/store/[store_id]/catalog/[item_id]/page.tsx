'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { Ruler, Info, ShieldCheck, Star, CheckCircle2, AlertCircle, ArrowLeft, Flag, Store, ChevronDown, ChevronUp, ChevronRight, Locate as LocateIcon, Loader2 } from 'lucide-react';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import Link from 'next/link';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { findRecommendedSize, matchSizeForMetric, METRIC_LABELS } from '@/lib/sizeRecommendation';
import { resolveFabricImage } from '@/lib/fabricHelper';

const FindLocationMap = dynamic(() => import('@/components/profile/FindLocationMap'), { ssr: false });

// Straight-line distance in km — enough to compare branches against each
// other and give the customer a rough sense of scale; not turn-by-turn.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CatalogItemImage {
  id: number;
  image_url: string;
  view_angle: string;
  is_primary: boolean;
}

interface RecommendedItem {
  id: number;
  name: string;
  price: string | number;
  images?: CatalogItemImage[];
}

interface Recommendation {
  recommendedItem?: RecommendedItem;
}

interface CatalogItemReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { name: string } | null;
}

interface ShopBranch {
  id: number;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface CatalogItem {
  id: number;
  name: string;
  price: string | number;
  estimated_days?: number | null;
  description?: string;
  material?: string;
  color?: string;
  garment_type?: string;
  sizes?: string[] | null;
  features?: string[] | { bullets: string[]; image_url: string };
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  care_instructions?: string;
  images: CatalogItemImage[];
  fabric_image_url?: string | null;
  recommendations?: Recommendation[];
  external_gallery_url?: string;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  shop?: {
    id: number;
    name: string;
    slug: string;
    logo_path: string | null;
    reviews_avg_rating?: number | null;
    reviews_count?: number;
    catalog_items_count?: number;
    services_count?: number;
    branches?: ShopBranch[];
  } | null;
  service?: {
    id: number;
    name: string;
    service_types?: string[];
    min_order_qty?: number;
  } | null;
  reviews?: CatalogItemReview[];
}

export default function PublicProductDetailPage({ params }: Readonly<{ params: Promise<{ shop_id: string; item_id: string; }> }>) {
  const { shop_id: shopId, item_id: itemId } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{ order_number: string; id: number } | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeProfile, setSizeProfile] = useState<{ height_cm: string | number | null; weight_kg: string | number | null; metrics: Record<string, number> | null } | null>(null);
  const [showMySizeModal, setShowMySizeModal] = useState(false);
  const [mySizeError, setMySizeError] = useState('');
  const [showCare, setShowCare] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [moreLikeThis, setMoreLikeThis] = useState<CatalogItemResult[]>([]);
  const [showFind, setShowFind] = useState(false);
  // Stays true through the full close animation, not just until showFind
  // flips — otherwise pointer-events-none applies the instant Close is
  // tapped, and a mobile browser's delayed "ghost click" (a synthetic click
  // fired ~300ms after a touch, at the same screen coordinates, when the
  // element under your finger disappeared) lands on whatever the still-
  // visually-present sheet used to be covering — the catalog hero image.
  const [findInteractive, setFindInteractive] = useState(false);
  const [findSheetBranchId, setFindSheetBranchId] = useState<number | null>(null);
  const [showBookConfirm, setShowBookConfirm] = useState(false);
  const [showBranchPickModal, setShowBranchPickModal] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const pageRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated } = useAuthStore();
  const gate = useGuestGatedHref();

  useEffect(() => {
    api.get(`/catalog/${shopId}/${itemId}`)
      .then(res => {
        setItem(res.data.data);
        const primary = res.data.data.images.find((i: CatalogItemImage) => i.is_primary) || res.data.data.images[0];
        if (primary) {
          setSelectedImage(primary.image_url);
          setSelectedVariation(primary.view_angle || '');
        }
        setLoading(false);
        // Real customer view — fire-and-forget, no need to block or reflect
        // this locally since the owner reads views_count from their own
        // dashboard/analytics, not from this page.
        api.post(`/catalog/${shopId}/${itemId}/view`).catch(() => {
          // Non-critical — a failed view count shouldn't affect the shopper's page.
        });
        // Per-user Recently Viewed — separate from the anonymous counter
        // above; only fires for a logged-in customer.
        if (user) {
          api.post('/recently-viewed', { type: 'catalog_item', id: res.data.data.id }).catch(() => {});
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shopId, itemId]);

  // Powers the Size Guide banner's "Recommended: Size X" — only fetched
  // for a logged-in customer, same gate as the "Input size" link itself.
  useEffect(() => {
    if (!user) return;
    api.get('/my-size-profile')
      .then(res => setSizeProfile(res.data.data))
      .catch(() => setSizeProfile(null));
  }, [user]);

  // The header starts fully transparent (floating over the hero image) and
  // fades to a solid bar as the page scrolls — MobileFrame's actual scroll
  // container is an ancestor div (class overflow-y-auto), not window, so
  // the listener has to be attached there, found via the nearest such
  // ancestor from this page's own root.
  useEffect(() => {
    const scrollEl = pageRef.current?.closest('.overflow-y-auto');
    if (!scrollEl) return;
    const handleScroll = () => {
      setHeaderOpacity(Math.min(scrollEl.scrollTop / 180, 1));
    };
    handleScroll();
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  // "More Like This" — real same-category items via the same search/filter
  // the Home/Search pages already use (garment_type), not a static line.
  useEffect(() => {
    if (!item?.garment_type) return;
    api.get('/public/catalog-items', { params: { garment_type: item.garment_type, per_page: 8 } })
      .then(res => setMoreLikeThis((res.data.data ?? []).filter((i: CatalogItemResult) => i.id !== item.id)))
      .catch(() => setMoreLikeThis([]));
  }, [item?.garment_type, item?.id]);

  // router.back() alone can leave the button appearing to do nothing when
  // there's no real history to pop (opened via a direct link, a new tab, or
  // after a client-side redirect) — same "literal back with a real
  // fallback" pattern AccountHeader already uses, so tapping it always goes
  // somewhere instead of silently no-opping.
  const handleBackClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/shop/${shopId}?tab=catalog`);
    }
  };

  // Guest: send to login — they land back on this same product page and
  // have to tap "Report This Product" again themselves once logged in, no
  // auto-resume. Logged in: straight to the report flow's own page.
  const handleReportClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push(`/shop/${shopId}/catalog/${itemId}/report`);
  };

  const handleMadeToOrder = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!item) return;
    setOrderSubmitting(true);
    setOrderError('');
    try {
      const res = await api.post(`/shops/${shopId}/made-to-order`, {
        catalog_item_id: item.id,
        size: selectedSize || undefined,
      });
      setOrderSuccess({ order_number: res.data.data.order_number, id: res.data.data.id });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setOrderError(e.response?.data?.message || 'Something went wrong placing your order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Close the Find sheet once the order actually goes through — the
  // confirmation banner it triggers lives in the main page's own Size
  // section, not inside the sheet itself.
  useEffect(() => {
    if (orderSuccess) setShowFind(false);
  }, [orderSuccess]);

  // Opening: interactive immediately. Closing: stay interactive for the
  // full 300ms slide-down (matches the sheet's own transition-duration)
  // before finally releasing pointer-events — see findInteractive's comment.
  useEffect(() => {
    if (showFind) {
      setFindInteractive(true);
      return;
    }
    const t = setTimeout(() => setFindInteractive(false), 320);
    return () => clearTimeout(t);
  }, [showFind]);

  // One-shot real geolocation lookup for the Find sheet's "Locate" button —
  // Direction is deliberately gated on this (see the sheet's JSX) since it
  // routes FROM this position TO the shop, gmaps-style.
  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported on this device.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocateError('Unable to get your location. Check your location permission.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      setReviewMessage({ type: 'error', text: 'Please log in to leave a review.' });
      return;
    }
    if (myRating < 1) {
      setReviewMessage({ type: 'error', text: 'Pick a star rating first.' });
      return;
    }
    setSubmittingReview(true);
    setReviewMessage(null);
    try {
      const res = await api.post(`/shops/${shopId}/catalog/${itemId}/reviews`, { rating: myRating });
      setItem(prev => prev ? {
        ...prev,
        reviews_count: res.data.reviews_count,
        reviews_avg_rating: res.data.average_rating,
      } : prev);
      setReviewMessage({ type: 'success', text: 'Thanks for your review!' });
    } catch {
      setReviewMessage({ type: 'error', text: 'Failed to submit your review. Please try again.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas">
        <Loader2 size={28} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-full flex items-center justify-center bg-canvas">
        <div className="text-center text-ink-faint">Item not found.</div>
      </div>
    );
  }

  // Parsing helper for structured lists and visual guides
  let featuresList: string[] = [];
  let featuresImage = '';
  if (item.features) {
    if (Array.isArray(item.features)) {
      featuresList = item.features;
    } else if (typeof item.features === 'object') {
      featuresList = (item.features as { bullets: string[] }).bullets || [];
      featuresImage = (item.features as { image_url: string }).image_url || '';
    } else {
      try {
        const parsed = JSON.parse(item.features as unknown as string);
        if (Array.isArray(parsed)) {
          featuresList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          featuresList = parsed.bullets || [];
          featuresImage = parsed.image_url || '';
        }
      } catch {
        // Ignored
      }
    }
  }

  // The "Book a Fitting" link just needs somewhere to pin the shop on a map
  // — prefer a branch that actually has coordinates set over the shop's
  // first branch.
  const branches = item.shop?.branches ?? [];
  const findBranch = branches.find(b => b.latitude && b.longitude) ?? branches[0] ?? null;

  // The Find sheet itself shows every branch with real coordinates, not
  // just one — the customer picks which one they're actually headed to.
  const mapBranches = branches
    .filter(b => b.latitude && b.longitude)
    .map(b => ({ id: b.id, name: b.name, slug: b.slug, latitude: Number(b.latitude), longitude: Number(b.longitude) }));
  const selectedFindBranch = mapBranches.find(b => b.id === findSheetBranchId) ?? null;

  // Powers the Book confirmation's "are you sure" message and its nearest-
  // branch suggestion — both only meaningful once Locate has actually run.
  const selectedDistanceKm = userPos && selectedFindBranch
    ? haversineKm(userPos.lat, userPos.lng, selectedFindBranch.latitude, selectedFindBranch.longitude)
    : null;
  const nearestBranch = userPos
    ? mapBranches.reduce<{ branch: typeof mapBranches[number]; km: number } | null>((best, b) => {
        const km = haversineKm(userPos.lat, userPos.lng, b.latitude, b.longitude);
        return !best || km < best.km ? { branch: b, km } : best;
      }, null)
    : null;
  const nearerBranchSuggestion = nearestBranch && selectedFindBranch && nearestBranch.branch.id !== selectedFindBranch.id
    ? nearestBranch
    : null;

  // Shared by the main bottom bar's old standalone link and the Find
  // sheet's own "Book a Fitting" button — same reference context either
  // way, just optionally pinned to whichever branch is currently focused
  // inside Find instead of the generic default.
  const buildBookHref = (branchSlug?: string | null) =>
    `/shop/${shopId}/book?ref=${encodeURIComponent(item.name)}${selectedSize ? `&ref_size=${encodeURIComponent(selectedSize)}` : ''}${selectedImage ? `&ref_image=${encodeURIComponent(selectedImage)}` : ''}&ref_price=${encodeURIComponent(String(item.price))}${displayColor ? `&ref_color=${encodeURIComponent(displayColor)}` : ''}${item.service ? `&service_id=${item.service.id}` : ''}${branchSlug ? `&branch=${encodeURIComponent(branchSlug)}` : ''}&ref_type=fitting`;

  const sizeChartColumns = item.size_chart_columns || [];
  const sizeChartRows = item.size_chart_rows || [];
  const sizeChartImage = item.size_chart_image_url || '';
  const recommendedSize = findRecommendedSize(sizeChartColumns, sizeChartRows, sizeProfile?.metrics ?? null);

  // Every saved measurement the "My Size" picker can offer — the customer
  // picks exactly one, unlike the automatic banner above which guesses.
  const myMeasurementOptions: { key: string; label: string; value: number; unit: string }[] = [];
  if (sizeProfile?.height_cm != null) myMeasurementOptions.push({ key: 'height', label: 'Height', value: Number(sizeProfile.height_cm), unit: 'cm' });
  if (sizeProfile?.weight_kg != null) myMeasurementOptions.push({ key: 'weight', label: 'Weight', value: Number(sizeProfile.weight_kg), unit: 'kg' });
  if (sizeProfile?.metrics) {
    for (const [key, value] of Object.entries(sizeProfile.metrics)) {
      if (value != null) myMeasurementOptions.push({ key, label: METRIC_LABELS[key] ?? key, value: Number(value), unit: 'cm' });
    }
  }

  const handlePickMySize = (key: string, value: number, label: string) => {
    const matched = matchSizeForMetric(sizeChartColumns, sizeChartRows, key, value);
    if (matched && item.sizes?.includes(matched)) {
      setSelectedSize(matched);
      setShowMySizeModal(false);
      setMySizeError('');
    } else {
      setMySizeError(`No matching size found using ${label}.`);
    }
  };
  // "Color" — three real sources, in priority order, never a guess:
  // (1) the selected thumbnail's own Photo Label, when it's an actual color
  // name and not a meaningless 'Default'/'front'/blank; (2) the item's own
  // color field; (3) the selected photo's own filename (shop owners often
  // just name the file by color, e.g. "sky-blue.jpg" — stripped of its
  // extension and prettified) as a last-resort fallback.
  const isRealVariationLabel = !!selectedVariation && selectedVariation !== 'Default' && selectedVariation.toLowerCase() !== 'front' && selectedVariation !== 'Fabric Swatch';
  const colorFromFilename = (url: string): string => {
    const basename = url.split('/').pop() ?? '';
    const withoutExt = basename.replace(/\.(jpe?g|png|webp|gif)$/i, '');
    const clean = withoutExt.replace(/[-_]+/g, ' ').trim();
    const lower = clean.toLowerCase();
    const commonColors = [
      'ivory', 'white', 'cream', 'beige', 'black', 'navy', 'blue', 'sky blue', 'royal blue',
      'red', 'crimson', 'ruby', 'green', 'emerald', 'olive', 'yellow', 'gold', 'mustard',
      'pink', 'blush', 'rose', 'purple', 'lavender', 'gray', 'grey', 'silver', 'brown', 'tan', 'maroon'
    ];
    for (const c of commonColors) {
      if (lower.includes(c)) return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    if (clean.length > 25 || lower.includes('barong') || lower.includes('dress') || lower.includes('suit') || lower.includes('gown')) {
      return '';
    }
    return clean;
  };
  const displayColor = (item.color && item.color.trim())
    ? item.color.trim()
    : (isRealVariationLabel ? selectedVariation : (selectedImage ? colorFromFilename(selectedImage) : ''));

  const fabricImage = resolveFabricImage(item);
  const primaryModel = item.images.find(i => i.is_primary)?.image_url || item.images[0]?.image_url || '';
  const isFabricActive = !!fabricImage && selectedImage === fabricImage;

  let careText = '';
  let careImage = '';
  if (item.care_instructions) {
    try {
      const parsed = JSON.parse(item.care_instructions);
      if (parsed && typeof parsed === 'object' && ('text' in parsed || 'image_url' in parsed)) {
        careText = parsed.text || '';
        careImage = parsed.image_url || '';
      } else {
        careText = item.care_instructions;
      }
    } catch {
      careText = item.care_instructions;
    }
  }

  const headerSolid = headerOpacity > 0.5;
  // touch-manipulation — these buttons float directly over the hero image
  // (the header overlaps it via a negative margin, see below). Without this,
  // tapping one to navigate away can leave a mobile browser's delayed
  // "ghost click" (a synthetic click fired ~300ms after a touch, once it's
  // decided the tap wasn't a double-tap-to-zoom) to fire afterward at the
  // same screen coordinates — landing on the hero image's own button
  // underneath and opening the photo viewer instead. This tells the browser
  // the tap is handled immediately, skipping that delayed click entirely.
  const iconButtonClass = headerSolid
    ? 'w-8 h-8 rounded-full flex items-center justify-center text-ink transition-colors touch-manipulation'
    : 'w-8 h-8 rounded-full bg-ink/40 backdrop-blur-sm text-white flex items-center justify-center transition-colors touch-manipulation';

  return (
    <div ref={pageRef} className="min-h-full flex flex-col bg-canvas">
      {/* Sticky header — starts fully transparent, floating over the hero
          image (back + report buttons read as plain circles on the photo),
          and gradually gains a solid white background as the page scrolls,
          staying pinned at top the whole time. The negative margin pulls
          the image up underneath it so it truly overlaps at scroll-top
          instead of pushing the image down by the header's own height. */}
      <div
        className="sticky top-0 z-50 h-10 flex items-center justify-between px-3"
        style={{
          backgroundColor: `rgba(255,255,255,${headerOpacity})`,
          borderBottom: headerOpacity > 0.6 ? '1px solid var(--brand-border)' : 'none',
          marginBottom: -40,
        }}
      >
        <button type="button" onClick={handleBackClick} aria-label="Back" className={iconButtonClass}>
          <ArrowLeft size={16} />
        </button>
        <button type="button" onClick={handleReportClick} aria-label="Report this product" className={iconButtonClass}>
          <Flag size={16} />
        </button>
      </div>

      {/* 1. Picture — edge-to-edge hero, no search bar above it; the sticky
          header overlaps its top edge. Tapping it opens the full-screen
          photo viewer (a real page, not a modal). The image itself and its
          clickable region are deliberately two separate elements: the click
          target is inset from the top by the header's own height (60px,
          matching its negative margin above), so it can never physically
          share screen space with the back/report buttons — no dependence
          on z-index or click-timing to keep a tap on one from ever landing
          on the other, whatever the exact cause of that turns out to be. */}
      <div className="relative">
        {selectedImage ? (
          <>
            <div className="aspect-[3/4] bg-sunken overflow-hidden relative w-full">
              <Image src={getMediaUrl(selectedImage)} alt={item.name} className="w-full h-full object-cover object-top transition-all duration-300" fill unoptimized />
            </div>
            <button
              type="button"
              onClick={() => router.push(`/shop/${shopId}/catalog/${itemId}/photo?src=${encodeURIComponent(selectedImage)}`)}
              aria-label="View full photo"
              className="absolute left-0 right-0 bottom-0 touch-manipulation"
              style={{ top: 60 }}
            />
          </>
        ) : (
          <div className="aspect-[3/4] bg-sunken overflow-hidden relative flex items-center justify-center text-ink-muted">No Image</div>
        )}
      </div>

      <main className="flex-1 w-full px-[10px] py-[5px] pb-24">
        {/* Product Details */}
        <div className="mt-[5px]">
          {/* 2. Price */}
          <p className="text-base text-ink-muted">₱{Number(item.price).toLocaleString()}</p>

          {/* 3. Title */}
          <h1 className="text-lg font-serif font-semibold text-ink mt-1">{item.name}</h1>

          {!!item.reviews_count && (
            <div className="flex items-center gap-1.5 mt-2 text-sm">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={14} fill={n <= Math.round(item.reviews_avg_rating || 0) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="font-semibold text-ink">{item.reviews_avg_rating?.toFixed(1)}</span>
              <span className="text-ink-faint">({item.reviews_count} review{item.reviews_count === 1 ? '' : 's'})</span>
            </div>
          )}

          {/* 4. Model & Fabric Swatch Switcher (Bottom Thumbnails) */}
          {(item.images.length > 0 || fabricImage) && (
            <div className="mt-3 pt-3 border-t border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  {isFabricActive ? 'Fabric' : 'Model'}
                </span>
                {fabricImage && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[11px] font-semibold ${!isFabricActive ? 'text-ink' : 'text-ink-faint'}`}>Model</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isFabricActive) {
                          if (primaryModel) {
                            setSelectedImage(primaryModel);
                            setSelectedVariation('Model View');
                          }
                        } else {
                          if (fabricImage) {
                            setSelectedImage(fabricImage);
                            setSelectedVariation('Fabric Swatch');
                          }
                        }
                      }}
                      aria-label="Toggle between model and fabric photos"
                      className={`relative w-8 h-[18px] rounded-full transition-colors ${isFabricActive ? 'bg-ink' : 'bg-line-strong'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${isFabricActive ? 'translate-x-[14px]' : ''}`}
                      />
                    </button>
                    <span className={`text-[11px] font-semibold ${isFabricActive ? 'text-ink' : 'text-ink-faint'}`}>Fabric</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {(() => {
                  const currentThumbnailImage = isFabricActive ? (fabricImage || primaryModel) : (primaryModel || fabricImage);
                  return (
                    <div
                      className="w-16 h-16 rounded-none overflow-hidden border-2 border-ink ring-2 ring-taupe/50 transition-all relative shrink-0 shadow-xs"
                      title={isFabricActive ? `${item.material || 'Fabric'} Swatch` : `${item.name} Model View`}
                    >
                      <Image
                        src={getMediaUrl(currentThumbnailImage)}
                        alt={isFabricActive ? `${item.material || 'Fabric'} Swatch` : `${item.name} Model View`}
                        className={`w-full h-full object-cover ${isFabricActive ? 'object-center' : 'object-top'}`}
                        fill
                        unoptimized
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 5. Size / Dimensions */}
          <div className="mt-[5px]">
            <div className="flex items-center justify-between mb-[5px]">
              <h3 className="text-sm font-semibold text-ink">
                {selectedSize ? `Reference Size: ${selectedSize}` : 'Available Sizing'}
              </h3>
            </div>
            {item.sizes && item.sizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(prev => (prev === size ? '' : size))}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      selectedSize === size
                        ? 'border-ink bg-ink text-white'
                        : 'border-line-strong text-ink-body hover:border-taupe'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-muted">Custom tailored to your bespoke measurements during fitting.</p>
            )}

            {orderSuccess && (
              <div className="flex items-center gap-2 bg-sage/10 border border-sage/20 rounded-xl px-4 py-3 mt-4">
                <CheckCircle2 size={16} className="text-sage shrink-0" />
                <p className="text-sm text-ink-body flex-1">Order {orderSuccess.order_number} placed.</p>
                <button
                  type="button"
                  onClick={() => router.push(`/account/orders/${orderSuccess.id}`)}
                  className="text-xs font-semibold text-taupe shrink-0"
                >
                  View
                </button>
              </div>
            )}
            {orderError && <p className="text-xs text-danger mt-2">{orderError}</p>}
          </div>

          {/* 6/7/Care — one merged list, sharp corners, rows stuck together
              (divide-y, no gaps/rounding between them) instead of three
              separate floating cards. */}
          <div className="mt-4 border border-line bg-surface divide-y divide-line">
          <div>
            <button
              type="button"
              onClick={() => setShowSizeGuide(v => !v)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Ruler size={16} /> Size Guide
              </h3>
              {showSizeGuide ? <ChevronUp size={16} className="text-ink-faint" /> : <ChevronDown size={16} className="text-ink-faint" />}
            </button>
            {showSizeGuide && (
              <div className="px-4 pb-4 pt-3 border-t border-line">
                {sizeChartColumns.length > 0 ? (
                  <div className="overflow-x-auto border border-line rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-canvas">
                          <th className="px-3 py-2 text-left font-semibold text-ink-body">Size</th>
                          {sizeChartColumns.map(col => (
                            <th key={col} className="px-3 py-2 text-left font-semibold text-ink-body">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sizeChartRows.map(row => (
                          <tr key={row.size} className="border-t border-line">
                            <td className="px-3 py-2 font-semibold text-ink whitespace-nowrap">{row.size}</td>
                            {row.values.map((val, ci) => (
                              <td key={`${row.size}-${ci}`} className="px-3 py-2 text-ink-body">{val || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !sizeChartImage ? (
                  <p className="text-sm text-ink-faint">No size guide available yet for this item — sizes follow this shop's own standard. Contact the shop if you're unsure.</p>
                ) : null}
                {sizeChartImage && (
                  <div className="mt-3 relative w-full h-[200px] rounded-lg overflow-hidden border border-line bg-canvas">
                    <Image src={sizeChartImage} alt="Size Guide visual" className="object-cover object-center" fill unoptimized />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 7. Specs & Description — collapsible; description keeps the shop
              owner's own line breaks/spacing (whitespace-pre-wrap) so
              something pasted in from Word doesn't get flattened. */}
          <div>
            <button
              type="button"
              onClick={() => setShowSpecs(v => !v)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Info size={16} /> Specs &amp; Description
              </h3>
              {showSpecs ? <ChevronUp size={16} className="text-ink-faint" /> : <ChevronDown size={16} className="text-ink-faint" />}
            </button>
            {showSpecs && (
              <div className="px-4 pb-4 pt-1 border-t border-line space-y-4">
                {item.description && (
                  <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{item.description}</p>
                )}

                {(() => {
                  const specRows: [string, string][] = [];
                  if (item.garment_type) specRows.push(['Garment Type', item.garment_type]);
                  if (item.material) specRows.push(['Material', item.material]);
                  if (item.color) specRows.push(['Color', item.color]);
                  if (item.sizes && item.sizes.length > 0) specRows.push(['Sizes Available', item.sizes.join(', ')]);
                  specRows.push(['Estimated Completion', `${item.estimated_days ?? 7} day${(item.estimated_days ?? 7) === 1 ? '' : 's'}`]);
                  return specRows.length > 0 ? (
                    <table className="w-full text-sm">
                      <tbody>
                        {specRows.map(([label, value]) => (
                          <tr key={label} className="border-b border-line last:border-0">
                            <td className="py-2 pr-4 text-ink-faint font-medium w-2/5 align-top">{label}</td>
                            <td className="py-2 text-ink-body">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null;
                })()}

                {featuresList.length > 0 && (
                  <div className="pt-3 border-t border-line">
                    <h4 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">Additional Details</h4>
                    <ul className="space-y-2 text-sm text-ink-muted">
                      {featuresList.map((feat: string) => (
                        <li key={feat}>• {feat}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {featuresImage && (
                  <div className="relative w-full h-[200px] rounded-lg overflow-hidden border border-line bg-canvas">
                    <Image src={featuresImage} alt="Specifications visual guide" className="object-cover object-center" fill unoptimized />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Garment Care & Alterations — collapsible. */}
          <div>
            <button
              type="button"
              onClick={() => setShowCare(v => !v)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <ShieldCheck size={16} /> Garment Care &amp; Alterations
              </h3>
              {showCare ? <ChevronUp size={16} className="text-ink-faint" /> : <ChevronDown size={16} className="text-ink-faint" />}
            </button>
            {showCare && (
              <div className="px-4 pb-4 pt-1 text-sm text-ink-muted leading-relaxed whitespace-pre-wrap border-t border-line space-y-4">
                <div>
                  {careText || "Professional dry-clean only. Altered garments are final sale."}
                </div>
                {careImage && (
                  <div className="relative w-full h-[200px] rounded-lg overflow-hidden border border-line bg-canvas">
                    <Image src={careImage} alt="Garment Care guide" className="object-cover object-center" fill unoptimized />
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

          {item.external_gallery_url && (
            <a
              href={item.external_gallery_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-line-strong hover:border-ink hover:bg-canvas text-ink-body font-medium tracking-wide py-3.5 mt-6 transition-colors flex items-center justify-center rounded-xl uppercase gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Sample Designs (External Gallery)
            </a>
          )}
        </div>

        {/* 8. Product Ratings — compact summary + a quick "rate it right
            here" star picker, so leaving a rating doesn't force a trip to
            View All. The full list, star filter, and per-review comments
            still live on that dedicated page. */}
        <div className="mt-6 pt-6 border-t border-line">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-serif font-semibold text-ink">Product Ratings</h2>
            <Link
              href={`/shop/${shopId}/catalog/${itemId}/ratings`}
              className="flex items-center gap-0.5 text-xs font-semibold text-taupe"
            >
              View All <ChevronRight size={13} />
            </Link>
          </div>
          {item.reviews_count ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={16} fill={n <= Math.round(item.reviews_avg_rating || 0) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="font-semibold text-ink text-sm">{item.reviews_avg_rating?.toFixed(1)}</span>
              <span className="text-ink-faint text-xs">out of 5 · {item.reviews_count} review{item.reviews_count === 1 ? '' : 's'}</span>
            </div>
          ) : (
            <p className="text-xs text-ink-faint">No ratings yet.</p>
          )}

          <form onSubmit={handleSubmitReview} className="bg-surface border border-line rounded-xl p-3 mt-3">
            <h3 className="text-xs font-semibold text-ink-muted mb-2">Rate this Item</h3>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMyRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  className="p-0.5"
                >
                  <Star
                    size={20}
                    className={n <= (hoverRating || myRating) ? 'text-amber-500' : 'text-line-strong'}
                    fill={n <= (hoverRating || myRating) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
              <button
                type="submit"
                disabled={submittingReview || myRating < 1}
                className="ml-auto px-3 py-1.5 bg-ink hover:bg-taupe text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting…' : 'Submit'}
              </button>
            </div>
            {reviewMessage && (
              <div className={`flex items-center gap-2 mt-2 text-xs px-3 py-2 rounded-lg ${reviewMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/10 text-danger'}`}>
                {reviewMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {reviewMessage.text}
              </div>
            )}
          </form>
        </div>

        {/* 9. Shop profile — white card, deliberately square corners (no
            rounded-2xl) per explicit request, unlike every other card on
            this page. */}
        {item.shop && (
          <div className="mt-6 bg-surface border border-line p-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-sunken border-[0.5px] border-line">
                {item.shop.logo_path ? (
                  <Image src={getMediaUrl(item.shop.logo_path)} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store size={16} className="text-ink-faint" />
                  </div>
                )}
              </div>
              <p className="flex-1 min-w-0 text-sm font-bold text-ink leading-snug line-clamp-2">{item.shop.name}</p>
              <Link
                href={gate(`/shop/${item.shop.slug}`)}
                className="shrink-0 self-center px-3 py-1 border border-taupe rounded-md text-xs font-semibold text-taupe hover:bg-taupe/5 transition-colors"
              >
                Visit
              </Link>
            </div>

            <div className="flex items-stretch mt-3 pt-2.5 border-t border-line">
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-ink">
                  {item.shop.reviews_count ? Number(item.shop.reviews_avg_rating).toFixed(1) : 'New'}
                </p>
                <p className="text-[11px] text-ink-faint mt-0.5">Rating</p>
              </div>
              <div className="w-px bg-line" />
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-ink">{item.shop.catalog_items_count ?? 0}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">Catalog Items</p>
              </div>
              <div className="w-px bg-line" />
              <div className="flex-1 text-center">
                <p className="text-sm font-bold text-ink">{item.shop.services_count ?? 0}</p>
                <p className="text-[11px] text-ink-faint mt-0.5">Services</p>
              </div>
            </div>
          </div>
        )}

        {/* Also Suggested — owner-curated cross-sell, a browse-sideways strip. */}
        {item.recommendations && item.recommendations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-line">
            <h2 className="text-base font-serif font-semibold text-ink mb-3">Also Suggested</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {item.recommendations.map((rec) => {
                const recItem = rec.recommendedItem;
                if (!recItem) return null;
                const recImage = recItem.images?.find((i: CatalogItemImage) => i.is_primary)?.image_url || recItem.images?.[0]?.image_url;

                return (
                  <Link href={`/shop/${shopId}/catalog/${recItem.id}`} key={recItem.id} className="shrink-0 w-28 group block">
                    <div className="aspect-square bg-sunken overflow-hidden mb-2 relative rounded-lg">
                      {recImage ? (
                        <Image src={getMediaUrl(recImage)} alt={recItem.name} className="w-full h-full object-cover" fill unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-body">No Image</div>
                      )}
                    </div>
                    <h4 className="text-xs font-medium text-ink group-hover:text-taupe truncate">{recItem.name}</h4>
                    <p className="text-xs text-ink-faint mt-0.5">₱{Number(recItem.price).toLocaleString()}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. More Like This — real same-category items (garment_type), 2
            columns, same CatalogItemCard/grid the Home Showroom and Search
            results use. Replaces the old generic "Powered by SUTURA" footer
            line, which this page opts out of (see shop/layout.tsx). */}
        {moreLikeThis.length > 0 && (
          <div className="mt-6 pt-6 border-t border-line">
            <h2 className="text-base font-serif font-semibold text-ink mb-3">More Like This</h2>
            <div className="grid grid-cols-2 gap-[5px]">
              {moreLikeThis.map((rec) => (
                <CatalogItemCard key={rec.id} item={rec} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky bottom action bar — stays pinned at the bottom of the viewport
          while scrolling through the item details. */}
      <div
        className="sticky bottom-0 left-0 right-0 z-40 bg-surface border-t border-line p-3 mt-auto shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFind(true)}
            className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium py-2.5 transition-colors flex items-center justify-center rounded-lg text-sm"
          >
            Find Branch
          </button>
          <Link
            href={gate(buildBookHref(selectedFindBranch?.slug ?? findBranch?.slug ?? null))}
            className="flex-1 bg-ink hover:bg-taupe text-white font-medium py-2.5 transition-colors flex items-center justify-center rounded-lg text-sm text-center"
          >
            Book a Fitting
          </Link>
        </div>
      </div>

      {/* "Find" — full-screen, gmaps-style location finder */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ease-out bg-surface ${
          showFind
            ? 'translate-y-0 opacity-100 visible pointer-events-auto'
            : 'translate-y-full opacity-0 invisible pointer-events-none'
        }`}
      >
          {/* Map — no margin on any side, fills the whole screen. */}
          <div className="absolute inset-0 bg-surface">
            {(showFind || findInteractive) && mapBranches.length > 0 ? (
              <FindLocationMap
                branches={mapBranches}
                selectedBranchId={findSheetBranchId}
                onSelectBranch={setFindSheetBranchId}
                userPosition={userPos}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-sunken flex items-center justify-center text-sm text-ink-faint">
                {mapBranches.length > 0 ? 'Loading map…' : 'Location not available'}
              </div>
            )}
          </div>

          {/* Top row — back button + branch picker pill, "in the middle at
              the top" next to back, per how this was speced out. Selecting
              a branch here is what drives the map's focus. */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFind(false)}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-ink/50 backdrop-blur-sm text-white flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            {mapBranches.length > 0 && (
              <select
                value={findSheetBranchId ?? ''}
                onChange={(e) => setFindSheetBranchId(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 min-w-0 bg-ink/50 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none"
              >
                <option value="">All Branches</option>
                {mapBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Floating gmaps-style place card. Leaflet's own panes/controls
              (tiles, zoom control, attribution) sit at z-index up to ~1000
              and don't create their own stacking context, so anything meant
              to float over the map needs a z-index past that or it silently
              renders underneath the map tiles — invisible, and un-tappable
              since the map catches the click instead. */}
          <div
            className="absolute left-[10px] right-[10px] bottom-[10px] z-[1000] bg-surface rounded-2xl border border-line shadow-lg p-3"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Locate — nested inside the card (itself already `absolute`,
                so it's a valid containing block on its own — no `relative`
                needed) and anchored with a negative top offset, so it sits
                exactly 10px above the card's own top edge no matter how
                tall the card's content makes it, instead of an arbitrary
                fixed distance from the screen. Grey + white so it reads
                clearly against the map regardless of what's under it. */}
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              aria-label={locating ? 'Locating…' : userPos ? 'Located' : 'Locate me'}
              className="absolute -top-[50px] right-0 z-[1000] w-10 h-10 rounded-full bg-ink/60 backdrop-blur-sm text-white shadow-md flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <LocateIcon size={18} className={locating ? 'animate-pulse' : ''} />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
                {selectedImage && (
                  <Image src={getMediaUrl(selectedImage)} alt={item.name} fill unoptimized className="object-cover object-top" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-ink">₱{Number(item.price).toLocaleString()}</p>
                <p className="text-sm font-semibold text-ink-body truncate">{item.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {selectedFindBranch ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&${userPos ? `origin=${userPos.lat},${userPos.lng}&` : ''}destination=${selectedFindBranch.latitude},${selectedFindBranch.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium py-2.5 transition-colors flex items-center justify-center rounded-lg text-xs"
                >
                  Direction
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Choose a branch above first"
                  className="flex-1 bg-sunken text-ink-faint font-medium py-2.5 rounded-lg text-xs cursor-not-allowed"
                >
                  Direction
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  selectedFindBranch ? setShowBookConfirm(true) : setShowBranchPickModal(true);
                }}
                className="flex-[1.3] bg-ink hover:bg-taupe text-white font-medium py-2.5 transition-colors flex items-center justify-center rounded-lg text-xs"
              >
                Book a Fitting
              </button>
            </div>
            {locateError && <p className="text-xs text-danger mt-2">{locateError}</p>}
          </div>

          {/* Book confirmation — makes sure a branch pick sticks before
              handing off to the booking page, and surfaces a nearer branch
              if one exists instead of silently letting the customer commit
              to a farther trip. */}
          {showBookConfirm && selectedFindBranch && (
            <div
              className="fixed inset-0 z-[2000] bg-ink/50 flex items-end justify-center"
              onClick={() => setShowBookConfirm(false)}
            >
              <div
                className="bg-surface w-full rounded-t-2xl p-4"
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-sm font-bold text-ink">Book at {selectedFindBranch.name}?</h3>
                <p className="text-sm text-ink-body mt-1">
                  {selectedDistanceKm !== null
                    ? `This branch is about ${selectedDistanceKm.toFixed(1)} km from your located position.`
                    : `You're about to book a fitting at this branch.`}
                </p>
                {nearerBranchSuggestion && (
                  <p className="text-xs text-taupe bg-taupe/5 border border-taupe/20 rounded-lg p-2.5 mt-3">
                    💡 {nearerBranchSuggestion.branch.name} is closer to you ({nearerBranchSuggestion.km.toFixed(1)} km) — consider booking there instead.
                  </p>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookConfirm(false)}
                    className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium py-2.5 transition-colors flex items-center justify-center rounded-lg text-xs"
                  >
                    Back
                  </button>
                  <Link
                    href={buildBookHref(branches.find(b => b.id === selectedFindBranch.id)?.slug)}
                    className="flex-[1.3] bg-ink hover:bg-taupe text-white font-medium py-2.5 transition-colors flex items-center justify-center rounded-lg text-xs"
                  >
                    Continue
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Branch pick — Book a Fitting stays clickable even on "All
              Branches"; tapping it there opens this instead of just sitting
              disabled, so there's always something to do. Picking one here
              just sets the same state the top dropdown reads, so it updates
              in place — tap Book a Fitting again afterward for the actual
              confirm step. */}
          {showBranchPickModal && (
            <div
              className="fixed inset-0 z-[2000] bg-ink/50 flex items-end justify-center"
              onClick={() => setShowBranchPickModal(false)}
            >
              <div
                className="bg-surface w-full rounded-t-2xl p-4"
                style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-sm font-bold text-ink">Which branch?</h3>
                <p className="text-sm text-ink-body mt-1">Choose which branch you'd like to book a fitting at.</p>
                <div className="flex flex-col gap-2 mt-3">
                  {mapBranches.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setFindSheetBranchId(b.id);
                        setShowBranchPickModal(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-lg border border-line-strong hover:border-ink text-sm font-semibold text-ink-body transition-colors"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowBranchPickModal(false)}
                  className="w-full text-center text-xs font-semibold text-ink-faint mt-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
