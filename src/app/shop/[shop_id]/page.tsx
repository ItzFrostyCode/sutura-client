'use client';

import { useEffect, useState, useCallback, use, useRef, Suspense, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { MapPin, Star, Phone, Mail, Loader2, Clock, ExternalLink, Image as ImageIcon, AlertCircle, ShoppingBag, Map as MapIcon, Building2, Package, Camera, Pencil, Plus, Trash2, Upload, Info, Search, Calendar, MessageCircle, X, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, Bookmark, SlidersHorizontal, Minus, TrendingUp, TrendingDown, RotateCcw, Scissors, Globe, type LucideIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import ServiceDetailModal from '@/components/profile/ServiceDetailModal';
import { getActiveSale } from '@/lib/salePricing';
import { useToast } from '@/context/ToastContext';
import { Service } from '@/components/services/serviceHelpers';
import ServiceFormModal from '@/components/services/ServiceFormModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import EditOperatingHoursModal from '@/components/profile/EditOperatingHoursModal';
import SpecialHoursAnnouncementCard from '@/components/profile/SpecialHoursAnnouncementCard';
import ProfileAboutTab from '@/components/profile/ProfileAboutTab';
import PostImageLightbox from '@/components/profile/PostImageLightbox';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';
import ShopLogoAvatar from '@/components/ShopLogoAvatar';
import PublicNav from '@/components/shared/PublicNav';
import { getMediaUrl } from '@/lib/media';
import { resolveFabricImage } from '@/lib/fabricHelper';
import { isShopOpen } from '@/lib/shopStatus';

// Leaflet touches `window`, so load the map client-only — same approach the
// dashboard's own branches map uses.
const SingleBranchMap = dynamic(() => import('@/components/profile/SingleBranchMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-canvas border border-line rounded-2xl p-10 text-center text-sm text-ink-muted" style={{ height: 360 }}>
      Loading map…
    </div>
  ),
});

interface ShopBranch {
  id: number;
  slug?: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  contact_number?: string;
  operating_hours?: string;
  latitude?: string;
  longitude?: string;
  guide_image_url?: string | null;
}

interface PublicService {
  id: number;
  name: string;
  description?: string;
  categories?: string[];
  service_types?: string[];
  base_price: string;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  estimated_days: number;
  is_active: boolean;
  image_url?: string | null;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  custom_fields?: {
    name: string;
    label: string;
    type: 'short_text' | 'number' | 'dropdown' | 'single_choice' | 'multi_select';
    required?: boolean;
    options?: string[];
  }[];
}

interface PublicServicePackage {
  id: number;
  name: string;
  description: string | null;
  bundle_price: string | null;
  services: { id: number; name: string; base_price: string | null }[];
}

interface CatalogItemImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  view_angle?: string | null;
}

interface CatalogListItem {
  id: number;
  name: string;
  price: string;
  estimated_days?: number | null;
  material: string;
  garment_type?: string | null;
  color?: string | null;
  description?: string | null;
  images: CatalogItemImage[];
  // Already returned by the API (CatalogController::index does withAvg/withCount
  // for these, same as the owner dashboard's card) — just never declared or
  // rendered here on the public-facing card.
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  fabric_image_url?: string | null;
}

interface PublicShopPost {
  id: number;
  image_urls: string[];
  caption: string;
  service_id: number | null;
  service?: { id: number; name: string } | null;
  created_at: string;
}

interface StorefrontReview {
  id: number;
  user: { id: number; name: string };
  rating: number;
  comment: string | null;
  reply: string | null;
  is_featured: boolean;
  created_at: string;
}

interface ShopProfile {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  logo_path: string;
  banner_path?: string | null;
  // The About tab's Social Media Links editor (SettingsBasicInfo/useSettings)
  // stores this as a free-form array of { label, url } — NOT a fixed
  // { facebook, instagram, tiktok } object. getSocialUrl() below bridges
  // the two so saving a link there actually shows up here.
  social_links: { label: string; url: string }[];
  reviews_avg_rating: number | null;
  reviews_count: number;
  my_review?: { id?: number; rating: number; comment?: string | null } | null;
  district?: string;
  specializations?: string[];
  branches?: ShopBranch[];
  owner?: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string | null;
  };
  active_special_hours?: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
    announcement_image_url: string | null;
  } | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }>;
  special_hours?: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
    announcement_image_url: string | null;
  }>;
}

interface PublicShopProfilePageProps {
  readonly params: Promise<{
    readonly shop_id: string;
  }>;
}


const PORTFOLIO_COLOR_OPTIONS = [
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Ivory', hex: '#FFFFF0' },
  { label: 'Cream', hex: '#FFFDD0' },
  { label: 'Beige', hex: '#D9CDB8' },
  { label: 'Black', hex: '#1A1A1A' },
  { label: 'Sky Blue', hex: '#7DD3FC' },
  { label: 'Light Blue', hex: '#93C5FD' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Royal Blue', hex: '#1D4ED8' },
  { label: 'Navy', hex: '#1E3A8A' },
  { label: 'Red', hex: '#EF4444' },
  { label: 'Crimson', hex: '#DC2626' },
  { label: 'Burgundy', hex: '#800020' },
  { label: 'Maroon', hex: '#800000' },
  { label: 'Pink', hex: '#F472B6' },
  { label: 'Blush', hex: '#DE5D83' },
  { label: 'Rose Gold', hex: '#B76E79' },
  { label: 'Peach', hex: '#FFDAB9' },
  { label: 'Gold', hex: '#EAB308' },
  { label: 'Champagne', hex: '#F7E7CE' },
  { label: 'Silver', hex: '#94A3B8' },
  { label: 'Gray', hex: '#6B7280' },
  { label: 'Emerald', hex: '#047857' },
  { label: 'Green', hex: '#22C55E' },
  { label: 'Olive', hex: '#556B2F' },
  { label: 'Sage', hex: '#9CAF88' },
  { label: 'Purple', hex: '#A855F7' },
  { label: 'Lavender', hex: '#E9D5FF' },
  { label: 'Brown', hex: '#78350F' },
  { label: 'Bronze', hex: '#CD7F32' },
];

function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minute = mStr ? `:${mStr}` : ':00';
  return `${hour12}${minute} ${period}`;
}

function PublicShopProfileContent({ params }: Readonly<PublicShopProfilePageProps>) {
  const { shop_id: shopId } = use(params);
  const { user, shop: authShop, token, setAuth } = useAuthStore();
  const toast = useToast();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [packages, setPackages] = useState<PublicServicePackage[]>([]);
  const [posts, setPosts] = useState<PublicShopPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Whether the person currently viewing this page is the shop's own owner —
  // matched by slug since that's what identifies this page. Drives whether
  // edit affordances render at all; the public page stays pure read-only
  // for everyone else, including a different shop's own owner.
  const isOwnerViewingOwnShop = !!authShop && authShop.slug === shopId && user?.roles?.[0]?.name === 'shop_owner';

  // Full, authenticated service records (pricing tiers, service types, etc.)
  // for the owner's inline edit flow — the public /services endpoint returns
  // a slimmer shape that isn't enough to populate the edit form correctly.
  const [ownerServices, setOwnerServices] = useState<Service[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [isServiceDeleteOpen, setIsServiceDeleteOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);

  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  const MAX_POST_IMAGES = 12;
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [postImageUrls, setPostImageUrls] = useState<string[]>([]);
  const [postUploading, setPostUploading] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postServiceId, setPostServiceId] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedBranchSlug = searchParams.get('branch');
  const initialTabParam = searchParams.get('tab');
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Review State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [myReview, setMyReview] = useState<{ id?: number; rating: number; comment?: string | null } | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PublicServicePackage | null>(null);
  // Service highlight/expand — same auto-scroll pattern as catalog items
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<number | null>(null);
  const hasScrolledToService = useRef(false);
  const isAutoScrollingService = useRef(false);
  // A ?branch= slug in the URL means we arrived here from the owner's "Preview
  // Customer View" link for a specific branch — land straight on Locations
  // with it highlighted.
  // A ?tab= param covers old bookmarks/links to the standalone /catalog or /portfolio page, which
  // now redirects here instead of being its own route.
  const validTabParams = ['about', 'portfolio', 'catalog', 'locations', 'branch', 'reviews', 'review', 'services', 'hours', 'home', 'work', 'showroom'] as const;
  const [activeTab, setActiveTab] = useState<'about' | 'catalog' | 'locations' | 'reviews' | 'services' | 'home' | 'hours' | 'work'>(
    selectedBranchSlug
      ? 'locations'
      : initialTabParam === 'catalog' || initialTabParam === 'portfolio' || initialTabParam === 'showroom'
        ? 'catalog'
        : initialTabParam === 'branch'
          ? 'locations'
          : initialTabParam === 'review'
            ? 'reviews'
            : initialTabParam === 'about'
              ? 'about'
              : initialTabParam === 'locations'
                ? 'locations'
                : initialTabParam === 'services'
                  ? 'services'
                  : initialTabParam === 'hours'
                    ? 'hours'
                    : 'catalog'
  );
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Catalog tab state — same data source and behavior as the old standalone
  // /shop/[slug]/catalog page, just embedded here instead of a separate route.
  const [catalogItems, setCatalogItems] = useState<CatalogListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState(() => searchParams.get('q') || searchParams.get('search') || '');
  const [serviceSearch, setServiceSearch] = useState('');
  // Portfolio filter states: 1. Price (sort & min/max), 2. Color, 3. Rating, 4. Garment Type
  const [priceSort, setPriceSort] = useState<'' | 'price_asc' | 'price_desc'>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [catalogGarmentTypeFilters, setCatalogGarmentTypeFilters] = useState<Set<string>>(new Set());

  // Draft states for the 1-column dropdown sheet
  const [draftPriceSort, setDraftPriceSort] = useState<'' | 'price_asc' | 'price_desc'>('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftColorFilter, setDraftColorFilter] = useState('');
  const [draftRatingFilter, setDraftRatingFilter] = useState('');
  const [draftGarmentTypeFilters, setDraftGarmentTypeFilters] = useState<Set<string>>(new Set());
  const [showPortfolioFabric, setShowPortfolioFabric] = useState(false);

  // Highlight state for deep-linked search displays
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);
  const hasScrolledToItem = useRef(false);
  const isAutoScrolling = useRef(false);

  // Sync search query from URL (e.g. when redirected from search for "barong")
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search');
    if (qParam) {
      setCatalogSearch(qParam);
      setActiveTab('catalog');
    }
  }, [searchParams]);

  useEffect(() => {
    const rawItem = searchParams.get('item');
    if (!rawItem || catalogLoading || catalogItems.length === 0 || hasScrolledToItem.current) return;

    const itemId = Number(rawItem);
    if (Number.isNaN(itemId)) return;

    // Retry finding element until DOM finishes rendering
    const tryScroll = (attempts = 0) => {
      const targetElement = document.getElementById(`catalog-item-${itemId}`);
      if (targetElement) {
        hasScrolledToItem.current = true;
        setHighlightedItemId(itemId);
        setShowStickyHeader(true);
        isAutoScrolling.current = true;

        const container = targetElement.closest('.overflow-y-auto') as HTMLElement | null;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          const elementTopRelativeToContainer = targetRect.top - containerRect.top + container.scrollTop;
          // Offset by sticky header height (~105px with expanded search/filter bar)
          container.scrollTo({
            top: Math.max(0, elementTopRelativeToContainer - 105),
            behavior: 'smooth',
          });
        } else {
          const targetRect = targetElement.getBoundingClientRect();
          window.scrollTo({
            top: Math.max(0, window.scrollY + targetRect.top - 105),
            behavior: 'smooth',
          });
        }

        const scrollLockTimer = setTimeout(() => {
          isAutoScrolling.current = false;
        }, 1200);

        const fadeTimer = setTimeout(() => {
          setHighlightedItemId(null);
        }, 2500);

        return () => {
          clearTimeout(scrollLockTimer);
          clearTimeout(fadeTimer);
        };
      } else if (attempts < 6) {
        setTimeout(() => tryScroll(attempts + 1), 150);
      }
    };

    const timer = setTimeout(() => tryScroll(0), 100);
    return () => clearTimeout(timer);
  }, [searchParams, catalogLoading, catalogItems, activeTab]);

  // Sticky Header on scroll past tab bar & Portfolio filter modal
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [isPortfolioFilterOpen, setIsPortfolioFilterOpen] = useState(false);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Facet tallies & options for portfolio collection
  const garmentTypeTally = useMemo(() => {
    const tally: Record<string, number> = {};
    catalogItems.forEach((i) => {
      const g = i.garment_type?.trim();
      if (g) tally[g] = (tally[g] || 0) + 1;
    });
    return tally;
  }, [catalogItems]);

  const garmentTypeOptions = useMemo(() => {
    return Object.keys(garmentTypeTally)
      .sort((a, b) => a.localeCompare(b))
      .map((v) => ({ id: v, label: v }));
  }, [garmentTypeTally]);

  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    PORTFOLIO_COLOR_OPTIONS.forEach(c => map.set(c.label.toLowerCase(), c.hex));
    catalogItems.forEach(item => {
      if (item.color?.trim()) {
        const cName = item.color.trim();
        if (!map.has(cName.toLowerCase())) {
          map.set(cName.toLowerCase(), '#888888');
        }
      }
    });
    return Array.from(map.entries()).map(([k, hex]) => {
      const found = PORTFOLIO_COLOR_OPTIONS.find(c => c.label.toLowerCase() === k);
      return { label: found?.label || (k.charAt(0).toUpperCase() + k.slice(1)), hex };
    });
  }, [catalogItems]);

  const isShopCurrentlyOpen = useMemo(() => {
    return isShopOpen(shop?.operating_hours);
  }, [shop?.operating_hours]);

  const openFilterPanel = useCallback(() => {
    setDraftPriceSort(priceSort);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftColorFilter(colorFilter);
    setDraftRatingFilter(ratingFilter);
    setDraftGarmentTypeFilters(new Set(catalogGarmentTypeFilters));
    setIsPortfolioFilterOpen(true);
  }, [priceSort, minPrice, maxPrice, colorFilter, ratingFilter, catalogGarmentTypeFilters]);

  const applyFilterPanel = useCallback(() => {
    setPriceSort(draftPriceSort);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setColorFilter(draftColorFilter);
    setRatingFilter(draftRatingFilter);
    setCatalogGarmentTypeFilters(new Set(draftGarmentTypeFilters));
    setIsPortfolioFilterOpen(false);
  }, [draftPriceSort, draftMinPrice, draftMaxPrice, draftColorFilter, draftRatingFilter, draftGarmentTypeFilters]);

  const resetFilterPanel = useCallback(() => {
    setDraftPriceSort('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftColorFilter('');
    setDraftRatingFilter('');
    setDraftGarmentTypeFilters(new Set());
    setPriceSort('');
    setMinPrice('');
    setMaxPrice('');
    setColorFilter('');
    setRatingFilter('');
    setCatalogGarmentTypeFilters(new Set());
  }, []);

  const activeFilterCount = useMemo(() => {
    return (priceSort ? 1 : 0) +
      (minPrice || maxPrice ? 1 : 0) +
      (colorFilter ? 1 : 0) +
      (ratingFilter ? 1 : 0) +
      catalogGarmentTypeFilters.size;
  }, [priceSort, minPrice, maxPrice, colorFilter, ratingFilter, catalogGarmentTypeFilters]);

  const toggleGarmentType = useCallback((v: string) => {
    setCatalogGarmentTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (isAutoScrolling.current) return;
      if (!tabBarRef.current) return;
      const container = tabBarRef.current.closest('.overflow-y-auto') as HTMLElement | null;

      let isNavVisible = false;
      const scrollY = container ? container.scrollTop : window.scrollY;

      // Smooth brown header fade-in: starts at 20px, reaches 1.0 at 140px (well before tabs at ~260px)
      const progress = Math.min(1, Math.max(0, (scrollY - 20) / 120));
      setHeaderOpacity(progress);

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const navRect = tabBarRef.current.getBoundingClientRect();
        // Nav tab bar is visible if its bottom is below the sticky header boundary (~50px) and within container bounds
        isNavVisible = navRect.bottom > (containerRect.top + 50) && navRect.top < containerRect.bottom;
      } else {
        const navRect = tabBarRef.current.getBoundingClientRect();
        isNavVisible = navRect.bottom > 50 && navRect.top < window.innerHeight;
      }

      // If the nav tab bar is visible, sticky header MUST be hidden ("kung makita na ang nav kay syempre mawala nayung header")
      // If the nav tab bar has scrolled off the top, sticky header MUST be shown
      const shouldShowHeader = !isNavVisible && scrollY > 60;
      setShowStickyHeader(shouldShowHeader);
    }

    // Capture phase ensures scroll events in MobileFrame (overflow-y container) are detected immediately
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    if (!searchParams.get('item')) {
      handleScroll();
    }
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [activeTab, searchParams]);

  // Reviews tab state — everyone sees the same list; reply/feature/delete
  // actions are owner-only, same management the dashboard's Reviews page had.
  const [reviews, setReviews] = useState<StorefrontReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLastPage, setReviewsLastPage] = useState(1);
  const [reviewFilterRating, setReviewFilterRating] = useState('');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReviewForReply, setCurrentReviewForReply] = useState<StorefrontReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [mapModalBranch, setMapModalBranch] = useState<ShopBranch | null>(null);

  const getSocialUrl = (links: { label: string; url: string }[] | undefined, keyword: string): string | undefined =>
    links?.find(l => l.label?.toLowerCase().includes(keyword))?.url;

  const getMessengerUrl = (facebookUrl?: string) => {
    if (!facebookUrl) return 'https://m.me/suturatailoring';
    try {
      const url = new URL(facebookUrl);
      const pathname = url.pathname.replace(/^\/|\/$/g, '');
      if (pathname && !pathname.includes('/') && pathname !== 'profile.php') {
        return `https://m.me/${pathname}`;
      }
    } catch {
      // Ignore URL parse error
    }
    return 'https://m.me/suturatailoring';
  };

  const activeBranch = shop?.branches?.find(b => b.slug === selectedBranchSlug);

  const fetchShop = useCallback(() => {
    api.get(`/public/shops/${shopId}`)
      .then(res => {
        const fetchedShop = res.data.data;
        setShop(fetchedShop);
        if (fetchedShop?.my_review) {
          setMyReview(fetchedShop.my_review);
          setRatingValue(fetchedShop.my_review.rating);
        } else if (fetchedShop && fetchedShop.my_review === null) {
          setMyReview(null);
          setRatingValue(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shopId]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // Fetch customer's own rating for this shop if logged in
  useEffect(() => {
    if (user && shop?.slug) {
      api.get(`/shops/${shop.slug}/my-review`)
        .then(res => {
          if (res.data?.success && res.data.data) {
            setMyReview(res.data.data);
            setRatingValue(res.data.data.rating);
          }
        })
        .catch(() => {});
    }
  }, [user, shop?.slug]);

  // Recently Viewed — fire-and-forget, logged-in customers only (the
  // endpoint requires auth; no point firing it for a guest and eating a
  // 401). One row per user+shop server-side, so revisits just bump it.
  useEffect(() => {
    if (!user || !shop?.id) return;
    api.post('/recently-viewed', { type: 'shop', id: shop.id }).catch(() => {});
  }, [user, shop?.id]);

  // Fetch public services
  useEffect(() => {
    api.get(`/public/shops/${shopId}/services`)
      .then(res => {
        const active = (res.data.data || []).filter((s: PublicService) => s.is_active);
        setServices(active);
        const targetServiceId = searchParams.get('service_id') || searchParams.get('service');
        if (targetServiceId) {
          const match = active.find((s: PublicService) => String(s.id) === String(targetServiceId));
          if (match) {
            // Open inline panel (not modal) and trigger auto-scroll
            setExpandedServiceId(match.id);
          }
        }
      })
      .catch(() => {
        // Fall back silently — services section won't show
      });
  }, [shopId, searchParams]);

  // Auto-scroll + highlight a specific service when ?service_id= is in the URL
  useEffect(() => {
    const targetServiceId = searchParams.get('service_id') || searchParams.get('service');
    if (!targetServiceId || services.length === 0 || hasScrolledToService.current) return;

    const svcId = Number(targetServiceId);
    if (Number.isNaN(svcId)) return;

    const tryScroll = (attempts = 0) => {
      const targetElement = document.getElementById(`service-item-${svcId}`);
      if (targetElement) {
        hasScrolledToService.current = true;
        setHighlightedServiceId(svcId);
        setExpandedServiceId(svcId);
        isAutoScrollingService.current = true;

        const container = targetElement.closest('.overflow-y-auto') as HTMLElement | null;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          const elementTopRelativeToContainer = targetRect.top - containerRect.top + container.scrollTop;
          container.scrollTo({
            top: Math.max(0, elementTopRelativeToContainer - 105),
            behavior: 'smooth',
          });
        } else {
          const targetRect = targetElement.getBoundingClientRect();
          window.scrollTo({
            top: Math.max(0, window.scrollY + targetRect.top - 105),
            behavior: 'smooth',
          });
        }

        const scrollLockTimer = setTimeout(() => {
          isAutoScrollingService.current = false;
        }, 1200);

        const fadeTimer = setTimeout(() => {
          setHighlightedServiceId(null);
        }, 2500);

        return () => {
          clearTimeout(scrollLockTimer);
          clearTimeout(fadeTimer);
        };
      } else if (attempts < 6) {
        setTimeout(() => tryScroll(attempts + 1), 150);
      }
    };

    const timer = setTimeout(() => tryScroll(0), 100);
    return () => clearTimeout(timer);
  }, [searchParams, services, activeTab]);

  // Fetch public service packages (combo bundles)
  useEffect(() => {
    api.get(`/public/shops/${shopId}/service-packages`)
      .then(res => setPackages(res.data.data || []))
      .catch(() => {
        // Fall back silently — packages section won't show
      });
  }, [shopId]);

  // Fetch the shop's "Our Work" posts (completed-order showcase)
  useEffect(() => {
    api.get(`/public/shops/${shopId}/posts`)
      .then(res => setPosts(res.data.data || []))
      .catch(() => {
        // Fall back silently — Our Work tab just won't show
      });
  }, [shopId]);

  // Fetch the catalog listing — same endpoint the old standalone /catalog
  // page used, just embedded here instead of navigating to a separate route.
  useEffect(() => {
    api.get(`/catalog/${shopId}`)
      .then(res => {
        setCatalogItems(res.data.data || []);
        setCatalogLoading(false);
      })
      .catch(() => {
        setCatalogLoading(false);
      });
  }, [shopId]);

  // Fetch reviews — same list for everyone; reply/feature/delete stay owner-only.
  useEffect(() => {
    let ignore = false;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      const params = new URLSearchParams({ page: String(reviewsPage) });
      if (reviewFilterRating) params.append('rating', reviewFilterRating);
      try {
        const res = await api.get(`/public/shops/${shopId}/reviews?${params.toString()}`);
        if (!ignore) {
          setReviews(res.data.data.data || []);
          setReviewsLastPage(res.data.data.last_page || 1);
        }
      } catch {
        // Fall back silently
      } finally {
        if (!ignore) setReviewsLoading(false);
      }
    };
    fetchReviews();
    return () => { ignore = true; };
  }, [shopId, reviewsPage, reviewFilterRating, reviewsRefreshKey]);

  // If the owner has a valid session token but the in-memory auth store hasn't
  // been populated yet (e.g. they landed here via a hard refresh instead of
  // client-side navigation from the dashboard), rehydrate it silently. A failed
  // or expired token just leaves this as the normal public read-only view —
  // unlike the dashboard layout's bootstrap, we never redirect from here.
  useEffect(() => {
    if (!user && token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const { user: fetchedUser, shop: fetchedShop, staff_profile } = res.data.data;
            setAuth(fetchedUser, token, fetchedShop, staff_profile);
          }
        })
        .catch(() => {
          // Invalid/expired token on a public page — fail silently.
        });
    }
  }, [user, token, setAuth]);

  const refreshOwnerServices = (shopIdForFetch: number) => {
    api.get(`/shops/${shopIdForFetch}/services`)
      .then(res => setOwnerServices(res.data.data || []))
      .catch(() => {
        // Fall back silently — owner just won't see edit-ready data yet
      });
  };

  useEffect(() => {
    if (isOwnerViewingOwnShop && authShop) {
      Promise.resolve().then(() => refreshOwnerServices(authShop.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerViewingOwnShop, authShop?.id]);

  // ─── Owner-only inline edit handlers (no-ops unless isOwnerViewingOwnShop) ───

  const refreshPublicServices = () => {
    api.get(`/public/shops/${shopId}/services`)
      .then(res => setServices((res.data.data || []).filter((s: PublicService) => s.is_active)))
      .catch(() => {
        // Fall back silently
      });
  };

  const handleServiceSubmit = async (payload: Record<string, unknown>) => {
    if (!authShop) return;
    setIsServiceSubmitting(true);
    setServiceError('');
    try {
      if (editingServiceId) {
        await api.put(`/shops/${authShop.id}/services/${editingServiceId}`, payload);
        toast.success('Service updated.');
      } else {
        await api.post(`/shops/${authShop.id}/services`, payload);
        toast.success('Service added.');
      }
      refreshOwnerServices(authShop.id);
      refreshPublicServices();
      setIsServiceModalOpen(false);
      setEditingServiceId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setServiceError(error.response?.data?.message || 'Failed to save service.');
    } finally {
      setIsServiceSubmitting(false);
    }
  };

  const confirmDeleteService = async () => {
    if (!authShop || !deletingServiceId) return;
    setIsServiceSubmitting(true);
    try {
      await api.delete(`/shops/${authShop.id}/services/${deletingServiceId}`);
      refreshOwnerServices(authShop.id);
      refreshPublicServices();
      setIsServiceDeleteOpen(false);
      setDeletingServiceId(null);
      toast.success('Service deleted.');
    } catch {
      toast.error('Failed to delete service.');
    } finally {
      setIsServiceSubmitting(false);
    }
  };

  const handleHoursSaved = (hours: Record<string, { is_open: boolean; open: string; close: string }>) => {
    setShop(prev => (prev ? { ...prev, operating_hours: hours } : prev));
  };

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !authShop) return;

    const slotsLeft = MAX_POST_IMAGES - postImageUrls.length;
    if (slotsLeft <= 0) {
      toast.error(`You can only add up to ${MAX_POST_IMAGES} photos per post.`);
      e.target.value = '';
      return;
    }
    const filesToUpload = Array.from(files).slice(0, slotsLeft);
    if (files.length > slotsLeft) {
      toast.error(`Only ${MAX_POST_IMAGES} photos are allowed per post — added the first ${slotsLeft}.`);
    }

    setPostUploading(true);
    try {
      const uploaded = await Promise.all(filesToUpload.map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post(`/shops/${authShop.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data.data?.url || res.data.url;
      }));
      setPostImageUrls(prev => [...prev, ...uploaded.filter(Boolean)]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to upload one or more photos.'));
    } finally {
      setPostUploading(false);
      e.target.value = '';
    }
  };

  const removePostImage = (url: string) => {
    setPostImageUrls(prev => prev.filter(u => u !== url));
  };

  const submitPost = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!authShop || postImageUrls.length === 0 || !postCaption.trim()) return;
    setPostSubmitting(true);
    try {
      const res = await api.post(`/shops/${authShop.id}/posts`, {
        image_urls: postImageUrls,
        caption: postCaption.trim(),
        service_id: postServiceId ? Number.parseInt(postServiceId, 10) : null,
      });
      setPosts(prev => [res.data.data, ...prev]);
      setPostImageUrls([]);
      setPostCaption('');
      setPostServiceId('');
      setIsAddingPost(false);
      toast.success('Posted! Customers can now see this on your storefront.');
    } catch {
      toast.error('Failed to publish post.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const deletePost = async (id: number) => {
    if (!authShop) return;
    try {
      await api.delete(`/shops/${authShop.id}/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post removed.');
    } catch {
      toast.error('Failed to remove post.');
    }
  };

  const refreshOwnerReviews = () => {
    if (!authShop) return;
    const params = new URLSearchParams({ page: String(reviewsPage) });
    if (reviewFilterRating) params.append('rating', reviewFilterRating);
    api.get(`/shops/${authShop.id}/reviews?${params.toString()}`)
      .then(res => {
        setReviews(res.data.data.data || []);
        setReviewsLastPage(res.data.data.last_page || 1);
      })
      .catch(() => {
        // Fall back silently
      });
  };

  const handleToggleFeatureReview = async (review: StorefrontReview) => {
    if (!authShop) return;
    try {
      await api.put(`/shops/${authShop.id}/reviews/${review.id}`, { is_featured: !review.is_featured });
      refreshOwnerReviews();
    } catch {
      toast.error('Failed to update featured status.');
    }
  };

  const submitReviewReply = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!authShop || !currentReviewForReply) return;
    setReplySubmitting(true);
    try {
      await api.put(`/shops/${authShop.id}/reviews/${currentReviewForReply.id}`, { reply: replyText });
      setReplyModalOpen(false);
      refreshOwnerReviews();
      toast.success('Reply saved.');
    } catch {
      toast.error('Failed to submit reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!authShop) return;
    try {
      await api.delete(`/shops/${authShop.id}/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted.');
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  const handleStarClick = (star: number) => {
    // Toggle behavior: if clicking the currently selected star, toggle to 0 (unrate)
    if (ratingValue === star) {
      setRatingValue(0);
    } else {
      setRatingValue(star);
    }
  };


  const submitRating = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error('Please log in to rate this shop.');
      return;
    }
    if (!shop) {
      toast.error('Shop profile is still loading. Please try again.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post(`/shops/${shop.slug}/reviews`, { rating: ratingValue });
      if (ratingValue === 0) {
        setMyReview(null);
        setRatingValue(0);
        toast.success('Rating removed.');
      } else {
        const savedReview = res.data?.data || { rating: ratingValue };
        setMyReview(savedReview);
        setRatingValue(savedReview.rating);
        toast.success(myReview?.rating ? 'Rating updated!' : 'Rating submitted!');
      }
      setIsRatingModalOpen(false);
      setHoveredStar(null);
      fetchShop(); // Refresh counts
      setReviewsRefreshKey(k => k + 1);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center bg-canvas"><Loader2 className="w-8 h-8 animate-spin text-ink" /></div>;
  }

  if (!shop) {
    return <div className="py-32 text-center text-ink-faint">Shop not found.</div>;
  }

  const tabList: {
    id: 'catalog' | 'services' | 'about' | 'locations' | 'reviews';
    label: string;
    icon: LucideIcon;
  }[] = [
    { id: 'catalog', label: 'Catalog', icon: Package },
    { id: 'services', label: 'Service', icon: Scissors },
    { id: 'about', label: 'About', icon: Info },
  ];
  if (shop.branches && shop.branches.length > 0) {
    tabList.push({ id: 'locations', label: 'Branch', icon: MapIcon });
  }
  tabList.push({ id: 'reviews', label: 'Ratings', icon: Star });

  // Post photo grid: shows at most 4 thumbnails so a 12-photo post doesn't
  // overwhelm the feed — the 4th tile gets a "+N" overlay for the rest.
  // Every visible thumbnail opens the same lightbox, just starting at a
  // different index, so the hidden photos are still one click away.
  const renderPostImageGrid = (images: string[], openLightbox: (index: number) => void) => {
    const count = images.length;
    if (count <= 1) {
      return (
        <button type="button" onClick={() => openLightbox(0)} className="block w-full aspect-4/3 bg-sunken relative focus:outline-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="" className="w-full h-full object-cover" />
        </button>
      );
    }
    const gridCols = count === 3 ? 'grid-cols-3' : 'grid-cols-2';
    const visible = images.slice(0, 4);
    const remaining = count - visible.length;
    return (
      <div className={`grid ${gridCols} gap-0.5 aspect-4/3`}>
        {visible.map((img, i) => (
          <button
            type="button"
            key={img}
            onClick={() => openLightbox(i)}
            className="relative overflow-hidden focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="w-full h-full object-cover" />
            {i === visible.length - 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-lg">
                +{remaining}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-surface text-ink selection:bg-sunken selection:text-indigo-900 relative">
      {/* Unified Sticky Header (Back, Rate, & Saved buttons always sticky; Store Name, Location, and Search/Filter fade in smoothly before tabs) */}
      <header
        className="sticky top-0 z-50 w-full transition-colors duration-150 -mb-[54px] pointer-events-none"
        style={{
          backgroundColor: headerOpacity > 0 ? `rgba(140, 107, 93, ${headerOpacity})` : 'transparent',
          boxShadow: headerOpacity > 0.8 ? '0 4px 6px -1px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
        }}
      >
        <div className="max-w-3xl mx-auto px-3 pt-2 pb-1.5 pointer-events-auto">
          {/* Top Row: Back (sticky), Store Name & Location (fades in), Rate (sticky), Saved (sticky) */}
          <div className="flex items-center gap-2 h-10">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push('/search');
              }}
              aria-label="Back"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                headerOpacity > 0.5
                  ? 'text-canvas hover:bg-white/15'
                  : 'bg-black/75 backdrop-blur-md text-white hover:bg-black/90 shadow-md border border-white/20'
              }`}
            >
              <ChevronLeft size={22} />
            </button>

            <div
              className="min-w-0 flex-1 text-left transition-all duration-200"
              style={{
                opacity: headerOpacity,
                transform: `translateY(${(1 - headerOpacity) * -6}px)`,
              }}
            >
              <h2 className="text-[13px] font-extrabold text-canvas truncate leading-tight text-left">
                {shop.name}
              </h2>
              <p className="text-[10px] text-canvas/80 truncate mt-0.5 text-left">
                {activeBranch
                  ? `${activeBranch.name}, ${activeBranch.city}`
                  : `${shop.branches?.[0]?.district || shop.district || shop.city || 'Poblacion District'}, Davao City`}
              </p>
            </div>

            {/* Rate store button — positioned right next to Save */}
            <button
              type="button"
              onClick={() => {
                setRatingValue(myReview?.rating || 0);
                setIsRatingModalOpen(true);
              }}
              aria-label="Rate this shop"
              title={myReview?.rating ? `Your rating: ${myReview.rating}★` : "Rate shop"}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                headerOpacity > 0.5
                  ? 'text-canvas hover:bg-white/15'
                  : 'bg-black/75 backdrop-blur-md text-white hover:bg-black/90 shadow-md border border-white/20'
              }`}
            >
              <Star
                size={17}
                className={myReview?.rating ? 'fill-amber-400 text-amber-400' : 'text-current'}
              />
            </button>

            {/* Bookmark / Save button */}
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
              aria-label="Bookmark shop"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                headerOpacity > 0.5
                  ? 'text-canvas hover:bg-white/15'
                  : 'bg-black/75 backdrop-blur-md text-white hover:bg-black/90 shadow-md border border-white/20'
              }`}
            >
              <Bookmark size={17} className={isBookmarked ? 'fill-current text-white' : ''} />
            </button>
          </div>

          {/* Bottom Row: Search & Filter (in Catalog and Services tabs when scrolled) */}
          {(activeTab === 'catalog' || activeTab === 'services') && (
            <div
              className={`transition-all duration-300 overflow-hidden ${
                showStickyHeader
                  ? 'max-h-16 opacity-100 pb-1 mt-1.5'
                  : 'max-h-0 opacity-0 mt-0 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-full bg-white shadow-xs">
                  <Search size={15} className="text-taupe shrink-0" />
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'services'
                        ? 'Search services & packages...'
                        : 'Search this collection... e.g. barong, gown'
                    }
                    value={activeTab === 'services' ? serviceSearch : catalogSearch}
                    onChange={(e) => {
                      if (activeTab === 'services') {
                        setServiceSearch(e.target.value);
                      } else {
                        setCatalogSearch(e.target.value);
                      }
                    }}
                    className="flex-1 min-w-0 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                  {(activeTab === 'services' ? serviceSearch : catalogSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'services') {
                          setServiceSearch('');
                        } else {
                          setCatalogSearch('');
                        }
                      }}
                      aria-label="Clear search"
                      className="shrink-0 text-ink-faint hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {activeTab === 'catalog' && (
                  <button
                    type="button"
                    onClick={openFilterPanel}
                    className={`h-9 px-3 rounded-full border transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold ${
                      activeFilterCount > 0
                        ? 'bg-white text-taupe border-white shadow-xs'
                        : 'bg-white/15 text-canvas border-white/20 hover:bg-white/25 active:scale-95'
                    }`}
                    title="Filter collection"
                  >
                    <SlidersHorizontal size={15} />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-ink text-white text-[9px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Unified Profile Card with Hero Banner */}
      <div className="flex-1 bg-canvas pb-8">
        {/* Full-bleed Hero banner */}
        <div className="relative h-64 w-full overflow-hidden bg-sunken">
          {shop.banner_path ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getMediaUrl(shop.banner_path)}
              alt={shop.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <Image
              src="/images/hero_banner.jpg"
              alt={shop.name}
              fill
              unoptimized
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />
        </div>

        {/* Special hours announcement banner if active */}
        {(shop.active_special_hours?.announcement_message || shop.active_special_hours?.announcement_image_url) && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-3 px-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              {shop.active_special_hours.announcement_image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={shop.active_special_hours.announcement_image_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover border border-amber-200 shrink-0"
                />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div className="text-xs font-medium">
                <span className="font-bold mr-1">{shop.active_special_hours.title}:</span>
                {shop.active_special_hours.announcement_message}
              </div>
            </div>
          </div>
        )}

        {/* Profile Details (overlapping avatar, store name, owner, location, star rating) */}
        <div className="px-4">
          <div className="relative pt-3 pb-2 flex flex-col items-start">
            <div className="flex items-start justify-between w-full">
              <ShopLogoAvatar
                src={shop.logo_path}
                name={shop.name}
                containerClassName="-mt-10"
                className="w-20 h-20 rounded-full border-4 border-white bg-surface shadow-md overflow-hidden shrink-0"
                isOpen={isShopCurrentlyOpen}
              />

              {/* Owner actions or Message button */}
              <div className="flex items-center gap-2">
                {isOwnerViewingOwnShop && <AccountHeaderMenu />}
                {isOwnerViewingOwnShop ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    title="Edit Profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sunken hover:bg-line text-ink-body rounded-lg transition-colors text-xs font-semibold"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                ) : (
                  <a
                    href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Message on Facebook"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-full text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Message</span>
                  </a>
                )}
              </div>
            </div>

            <div className="mt-2.5">
              <h1 className="text-xl font-serif font-bold text-ink leading-tight">{shop.name}</h1>
              <p className="text-xs text-ink-muted mt-1">
                Shop Owner · <span className="font-semibold text-ink-body">{shop.owner?.name || 'Juancho L. Rivera'}</span>
              </p>
              <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                <MapPin size={13} className="text-taupe shrink-0" />
                <span>{activeBranch ? `${activeBranch.name}, ${activeBranch.city}` : `${shop.branches?.[0]?.district || shop.district || shop.city || 'Poblacion District'}, Davao City`}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center text-taupe">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className="fill-taupe text-taupe" />
                  ))}
                </div>
                <span className="text-xs font-extrabold text-ink">
                  {shop.reviews_avg_rating ? Number(shop.reviews_avg_rating).toFixed(1) : '4.9'}
                </span>
                <span className="text-xs text-ink-faint">
                  ({shop.reviews_count || 126} ratings)
                </span>
              </div>
            </div>
          </div>

          {/* Streamlined Tabs: Catalog, Service, About, Branch, Reviews */}
          <div ref={tabBarRef} className="flex overflow-x-auto no-scrollbar border-b border-line mt-1.5 mb-3">
            {tabList.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-0 py-2 text-center text-xs font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                    isActive
                      ? 'border-ink text-ink font-semibold'
                      : 'border-transparent text-ink-muted hover:text-ink font-normal'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB: ABOUT — 3 Distinct Sections: 1. Links (Social Links first!), 2. Description, 3. Hours */}
          {activeTab === 'about' && (
            <div className="space-y-3.5 max-w-lg mx-auto">
              {/* SECTION 1: Social Links (Mauna!) */}
              <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-taupe" />
                  <h3 className="text-sm font-bold text-ink">Social Links</h3>
                </div>

                {shop.social_links && shop.social_links.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {shop.social_links.map((link) => {
                      const lower = link.label?.toLowerCase() || '';
                      const isFb = lower.includes('facebook') || lower.includes('fb');
                      const isIg = lower.includes('instagram') || lower.includes('ig');
                      const isTiktok = lower.includes('tiktok');

                      return (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-canvas hover:bg-sunken text-xs font-semibold text-ink transition-all active:scale-95"
                        >
                          {isFb ? (
                            <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          ) : isIg ? (
                            <svg className="w-4 h-4 fill-[#E4405F] shrink-0" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          ) : isTiktok ? (
                            <span className="text-xs font-black shrink-0">🎵</span>
                          ) : (
                            <Globe size={15} className="text-taupe shrink-0" />
                          )}
                          <span>{link.label || 'Social Link'}</span>
                          <ExternalLink size={12} className="text-ink-faint ml-0.5" />
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-ink-muted flex items-center justify-between py-1">
                    <span>No social links listed yet.</span>
                    <a
                      href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-taupe font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Message on Facebook <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              {/* SECTION 2: Description */}
              <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-taupe" />
                  <h3 className="text-sm font-bold text-ink">Description</h3>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-line">
                  {shop.description || 'No description provided yet.'}
                </p>
              </div>

              {/* SECTION 3: Opening Hours */}
              <div className="bg-surface border border-line rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-taupe" />
                    <h3 className="text-sm font-bold text-ink">Opening hours</h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isShopCurrentlyOpen
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-ink-muted bg-sunken border border-line'
                  }`}>
                    {isShopCurrentlyOpen ? 'Open now' : 'Closed now'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { key: 'sunday', label: 'Sunday' },
                    { key: 'monday', label: 'Monday' },
                    { key: 'tuesday', label: 'Tuesday' },
                    { key: 'wednesday', label: 'Wednesday' },
                    { key: 'thursday', label: 'Thursday' },
                    { key: 'friday', label: 'Friday' },
                    { key: 'saturday', label: 'Saturday' },
                  ].map(({ key, label }) => {
                    const dayHours = shop.operating_hours?.[key];
                    const isToday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()] === key;
                    const isOpen = dayHours?.is_open && dayHours.open && dayHours.close;

                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                          isToday ? 'bg-taupe/10 font-medium' : 'text-ink-body'
                        }`}
                      >
                        <span className={`capitalize ${isToday ? 'font-bold text-ink' : 'text-ink-body'}`}>
                          {label} {isToday && <span className="text-[10px] text-taupe font-bold ml-1">(Today)</span>}
                        </span>
                        {isOpen ? (
                          <span className={`font-semibold ${isToday ? 'text-ink' : 'text-ink-body'}`}>
                            {formatTime12h(dayHours.open)} – {formatTime12h(dayHours.close)}
                          </span>
                        ) : (
                          <span className="text-ink-faint font-medium">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isOwnerViewingOwnShop && (
                  <button
                    type="button"
                    onClick={() => setIsHoursModalOpen(true)}
                    className="mt-3 text-xs font-semibold text-taupe hover:underline flex items-center gap-1"
                  >
                    <Pencil size={11} /> Edit Hours
                  </button>
                )}
              </div>

              {/* Request a fitting CTA Button */}
              <div className="pt-1">
                <Link
                  href={`/shop/${shopId}/book`}
                  className="w-full flex items-center justify-center py-3.5 bg-[#2B2725] hover:bg-[#1A1817] active:scale-[0.99] text-white text-sm font-bold rounded-full transition-all shadow-md"
                >
                  Request a fitting
                </Link>
              </div>

              {/* Owner-only About settings panel */}
              {isOwnerViewingOwnShop && (
                <div className="pt-4 border-t border-line">
                  <ProfileAboutTab />
                </div>
              )}
            </div>
          )}

          {/* TAB: SERVICES */}
          {activeTab === 'services' && (
            <div>
              {services.length === 0 && packages.length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-line">
                  <p className="text-ink-muted">No services listed yet.</p>
                </div>
              ) : (() => {
                const selectedService = services.find((s) => s.id === expandedServiceId);

                if (selectedService) {
                  const activeSale = selectedService.base_price
                    ? getActiveSale({
                        price: selectedService.base_price,
                        sale_price: selectedService.sale_price,
                        sale_starts_at: selectedService.sale_starts_at,
                        sale_ends_at: selectedService.sale_ends_at,
                      })
                    : null;
                  const priceDisplay = activeSale ? (
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="line-through text-ink-faint font-normal text-xs">
                        ₱{activeSale.original.toLocaleString()}
                      </span>
                      <span className="text-rose-600">
                        ₱{activeSale.sale.toLocaleString()}
                      </span>
                    </span>
                  ) : selectedService.base_price !== null && selectedService.base_price !== undefined ? (
                    `₱${Number.parseFloat(selectedService.base_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  ) : (
                    'Custom Quote'
                  );

                  return (
                    <div className="animate-fade-in pb-8">
                      {/* Top Header: [Back] [Service] [Owner actions] */}
                      <div className="flex items-center justify-between py-3 mb-4 border-b border-line">
                        <button
                          type="button"
                          onClick={() => setExpandedServiceId(null)}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink hover:text-taupe transition-colors"
                        >
                          <ArrowLeft size={16} /> Back
                        </button>
                        <h2 className="text-sm sm:text-base font-bold text-ink">Service</h2>
                        <div className="flex items-center gap-1.5">
                          {isOwnerViewingOwnShop && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingServiceId(selectedService.id);
                                  setServiceError('');
                                  setIsServiceModalOpen(true);
                                }}
                                title="Edit service"
                                className="w-7 h-7 flex items-center justify-center bg-surface border border-line text-ink-body hover:text-taupe transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingServiceId(selectedService.id);
                                  setIsServiceDeleteOpen(true);
                                }}
                                title="Delete service"
                                className="w-7 h-7 flex items-center justify-center bg-surface border border-line text-ink-body hover:text-danger transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                          {!isOwnerViewingOwnShop && <div className="w-10" />}
                        </div>
                      </div>

                      {/* Service Detail Card matching Screenshot 1 */}
                      <div className="bg-surface border border-line rounded-none overflow-hidden shadow-xs">
                        {/* Summary Header */}
                        <div className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-14 h-14 shrink-0 bg-sunken overflow-hidden border border-line relative">
                              {selectedService.image_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={getMediaUrl(selectedService.image_url)}
                                  alt={selectedService.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink-faint">
                                  <ImageIcon size={20} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-serif font-bold text-ink text-sm sm:text-base leading-snug truncate">
                                {selectedService.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="font-bold text-ink">
                                  {priceDisplay}
                                </span>
                                {selectedService.estimated_days ? (
                                  <span className="flex items-center gap-1 text-ink-muted">
                                    <Clock size={11} /> {selectedService.estimated_days}d
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <ChevronDown size={18} className="text-ink-faint shrink-0" />
                        </div>

                        {/* Large Image */}
                        {selectedService.image_url && (
                          <div className="h-64 sm:h-80 bg-sunken overflow-hidden border-t border-line relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getMediaUrl(selectedService.image_url)}
                              alt={selectedService.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Description & CTAs */}
                        <div className="p-5 space-y-4">
                          {selectedService.description && (
                            <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap">
                              {selectedService.description}
                            </p>
                          )}

                          {selectedService.size_chart_image_url && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Size Chart</h4>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={selectedService.size_chart_image_url} alt="Size chart" className="w-full border border-line" />
                            </div>
                          )}

                          <div className="space-y-2 pt-2">
                            <Link
                              href={`/shop/${shopId}/book?service_id=${selectedService.id}`}
                              className="block w-full text-center bg-[#2D2A26] hover:bg-black text-white py-3.5 text-sm font-semibold transition-colors focus:outline-none"
                            >
                              Book Appointment →
                            </Link>
                            {getSocialUrl(shop.social_links, 'facebook') && (
                              <a
                                href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center justify-center gap-1.5 bg-surface border border-line hover:bg-sunken text-ink-body py-2.5 text-xs font-semibold transition-colors focus:outline-none"
                              >
                                <MessageCircle size={13} /> Inquire on Facebook
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const filteredServices = services.filter((service) => {
                  if (!serviceSearch.trim()) return true;
                  const q = serviceSearch.toLowerCase().trim();
                  return (
                    service.name.toLowerCase().includes(q) ||
                    ((service as any).category && (service as any).category.toLowerCase().includes(q)) ||
                    ((service as any).service_type && (service as any).service_type.toLowerCase().includes(q)) ||
                    (service.description && service.description.toLowerCase().includes(q))
                  );
                });

                const filteredPackages = packages.filter((pkg) => {
                  if (!serviceSearch.trim()) return true;
                  const q = serviceSearch.toLowerCase().trim();
                  return (
                    pkg.name.toLowerCase().includes(q) ||
                    (pkg.description && pkg.description.toLowerCase().includes(q)) ||
                    pkg.services.some((s) => s.name.toLowerCase().includes(q))
                  );
                });

                const totalFilteredCount = filteredServices.length + filteredPackages.length;

                return (
                  <div>
                    {/* Search bar inside Service tab */}
                    <div className="mb-3 flex items-center gap-2 h-9 px-3 rounded-full bg-surface border border-line shadow-xs">
                      <Search size={14} className="text-taupe shrink-0" />
                      <input
                        type="text"
                        placeholder="Search services & packages..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-xs text-ink placeholder:text-ink-faint focus:outline-none"
                      />
                      {serviceSearch && (
                        <button
                          type="button"
                          onClick={() => setServiceSearch('')}
                          aria-label="Clear search"
                          className="shrink-0 text-ink-faint hover:text-ink"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-xs text-ink-muted whitespace-nowrap">
                          Showing {totalFilteredCount} services.
                        </span>
                        {serviceSearch && (
                          <button
                            type="button"
                            onClick={() => setServiceSearch('')}
                            className="flex items-center gap-1 border border-line bg-canvas px-2 py-0.5 rounded-full text-[10px] font-medium text-ink-body hover:border-taupe hover:text-taupe transition-colors shrink-0"
                          >
                            <span>&quot;{serviceSearch}&quot;</span>
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      {isOwnerViewingOwnShop && (
                        <button
                          type="button"
                          onClick={() => { setEditingServiceId(null); setServiceError(''); setIsServiceModalOpen(true); }}
                          className="flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                          <Plus size={14} /> Add Service
                        </button>
                      )}
                    </div>

                    {totalFilteredCount === 0 ? (
                      <div className="text-center py-12 bg-surface border border-line text-ink-muted text-xs">
                        No services or packages matched &quot;{serviceSearch}&quot;.
                      </div>
                    ) : (
                      /* Unified Grid: Services & Packages (1 card / 1 column for 320px mobile) */
                      <div className="grid grid-cols-1 gap-3">
                        {filteredServices.map((service) => {
                          const isHighlighted = highlightedServiceId === service.id;
                          const activeSale = service.base_price
                            ? getActiveSale({
                                price: service.base_price,
                                sale_price: service.sale_price,
                                sale_starts_at: service.sale_starts_at,
                                sale_ends_at: service.sale_ends_at,
                              })
                            : null;

                          return (
                            <div
                              key={`service-${service.id}`}
                              id={`service-item-${service.id}`}
                              onClick={() => {
                                setExpandedServiceId(service.id);
                                if (user) api.post('/recently-viewed', { type: 'service', id: service.id }).catch(() => {});
                              }}
                              className={`group flex flex-col justify-between w-full bg-surface border border-line overflow-hidden hover:border-taupe transition-all duration-300 cursor-pointer ${
                                isHighlighted ? 'ring-2 ring-taupe' : ''
                              }`}
                            >
                              {/* Top: Picture */}
                              <div className="h-48 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
                                {service.image_url ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={getMediaUrl(service.image_url)}
                                    alt={service.name}
                                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-ink-faint">
                                    <Scissors size={28} className="text-taupe/40" />
                                  </div>
                                )}
                              </div>

                              {/* Bottom: Details (No description) */}
                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-medium uppercase tracking-wide text-taupe truncate block">
                                    {(service as any).category || (service as any).service_type || 'Tailoring Service'}
                                  </span>
                                  <h3 className="text-sm font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-1 line-clamp-2">
                                    {service.name}
                                  </h3>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-line/50 mt-2.5">
                                  <span className="text-sm font-bold text-ink">
                                    {activeSale ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="line-through text-ink-faint text-xs font-normal">
                                          ₱{activeSale.original.toLocaleString()}
                                        </span>
                                        <span className="text-rose-600">
                                          ₱{activeSale.sale.toLocaleString()}
                                        </span>
                                      </span>
                                    ) : service.base_price !== null && service.base_price !== undefined ? (
                                      `₱${Number(service.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                    ) : (
                                      'Custom Quote'
                                    )}
                                  </span>

                                  <span className="flex items-center gap-1 text-xs text-ink-muted font-medium shrink-0">
                                    <Clock size={12} className="text-taupe shrink-0" />
                                    <span>Est. {service.estimated_days ? `${service.estimated_days}d` : '7-10d'}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {filteredPackages.map((pkg) => {
                          const sumPrice = pkg.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0);
                          const displayPrice = pkg.bundle_price ? Number(pkg.bundle_price) : sumPrice;

                          return (
                            <div
                              key={`package-${pkg.id}`}
                              onClick={() => setSelectedPackage(pkg)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPackage(pkg); }}
                              role="button"
                              tabIndex={0}
                              className="group flex flex-col justify-between w-full bg-surface border border-line overflow-hidden hover:border-taupe transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-taupe"
                            >
                              {/* Top: Picture */}
                              <div className="h-48 w-full bg-taupe/10 relative overflow-hidden shrink-0 border-b border-line flex items-center justify-center">
                                <Package size={40} className="text-taupe/50 transition-transform duration-500 group-hover:scale-110" />
                              </div>

                              {/* Bottom: Details (No description) */}
                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                  <span className="text-[10px] font-medium uppercase tracking-wide text-taupe truncate block">
                                    Package Deal
                                  </span>
                                  <h3 className="text-sm font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-1 line-clamp-2">
                                    {pkg.name}
                                  </h3>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-line/50 mt-2.5">
                                  <span className="text-sm font-bold text-ink">
                                    ₱{displayPrice.toLocaleString()}
                                  </span>

                                  <span className="flex items-center gap-1 text-xs text-ink-muted font-medium shrink-0">
                                    <Package size={12} className="text-taupe shrink-0" />
                                    <span>{pkg.services.length} {pkg.services.length === 1 ? 'service' : 'services'}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: CATALOG */}
          {activeTab === 'catalog' && (
            <div>
              {catalogLoading ? (
                <div className="text-center py-16 text-ink-faint animate-pulse">Curating showcase...</div>
              ) : catalogItems.length === 0 ? (
                <div className="text-center py-16 bg-surface border border-line text-ink-muted">
                  This shop hasn&apos;t published any showcase items yet.
                </div>
              ) : (() => {
                const filteredCatalogItems = catalogItems
                  .filter((item) => {
                    // Search term
                    if (catalogSearch && !item.name.toLowerCase().includes(catalogSearch.toLowerCase())) {
                      return false;
                    }

                    // Garment type filter
                    if (catalogGarmentTypeFilters.size > 0 && (!item.garment_type || !catalogGarmentTypeFilters.has(item.garment_type))) {
                      return false;
                    }

                    // Min price filter
                    const p = Number(item.price) || 0;
                    if (minPrice && p < Number(minPrice)) {
                      return false;
                    }

                    // Max price filter
                    if (maxPrice && p > Number(maxPrice)) {
                      return false;
                    }

                    // Color filter
                    if (colorFilter) {
                      const searchColor = colorFilter.toLowerCase();
                      const itemColor = (item.color || '').toLowerCase();
                      const itemName = (item.name || '').toLowerCase();
                      const viewAngles = (item.images || []).map((img) => (img.view_angle || '').toLowerCase()).join(' ');
                      const itemFabric = (item.material || '').toLowerCase();
                      const matchesColor =
                        itemColor.includes(searchColor) ||
                        itemName.includes(searchColor) ||
                        viewAngles.includes(searchColor) ||
                        itemFabric.includes(searchColor);
                      if (!matchesColor) return false;
                    }

                    // Rating filter
                    if (ratingFilter) {
                      const itemRating = Number(item.reviews_avg_rating ?? 0);
                      if (itemRating < Number(ratingFilter)) {
                        return false;
                      }
                    }

                    return true;
                  })
                  .sort((a, b) => {
                    if (priceSort === 'price_asc') {
                      return (Number(a.price) || 0) - (Number(b.price) || 0);
                    }
                    if (priceSort === 'price_desc') {
                      return (Number(b.price) || 0) - (Number(a.price) || 0);
                    }
                    return 0; // Default
                  });

                // Active filter chips
                interface FilterChip {
                  id: string;
                  label: string;
                  onRemove: () => void;
                }

                const activeFilterChips: FilterChip[] = [];

                if (priceSort) {
                  activeFilterChips.push({
                    id: 'sort',
                    label: priceSort === 'price_asc' ? 'Sort: Low to High' : 'Sort: High to Low',
                    onRemove: () => setPriceSort(''),
                  });
                }

                if (minPrice && maxPrice) {
                  activeFilterChips.push({
                    id: 'price-range',
                    label: `₱${Number(minPrice).toLocaleString()} – ₱${Number(maxPrice).toLocaleString()}`,
                    onRemove: () => {
                      setMinPrice('');
                      setMaxPrice('');
                    },
                  });
                } else if (minPrice) {
                  activeFilterChips.push({
                    id: 'price-min',
                    label: `Min ₱${Number(minPrice).toLocaleString()}`,
                    onRemove: () => setMinPrice(''),
                  });
                } else if (maxPrice) {
                  activeFilterChips.push({
                    id: 'price-max',
                    label: `Max ₱${Number(maxPrice).toLocaleString()}`,
                    onRemove: () => setMaxPrice(''),
                  });
                }

                if (colorFilter) {
                  activeFilterChips.push({
                    id: 'color',
                    label: `Color: ${colorFilter}`,
                    onRemove: () => setColorFilter(''),
                  });
                }

                if (ratingFilter) {
                  activeFilterChips.push({
                    id: 'rating',
                    label: `★ ${ratingFilter}${ratingFilter === '5' ? ' Stars' : '+ Stars'}`,
                    onRemove: () => setRatingFilter(''),
                  });
                }

                Array.from(catalogGarmentTypeFilters).forEach((g) => {
                  activeFilterChips.push({
                    id: `garment-${g}`,
                    label: g,
                    onRemove: () => toggleGarmentType(g),
                  });
                });

                return (
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="text-xs text-ink-muted whitespace-nowrap shrink-0">
                          Showing {filteredCatalogItems.length} catalog designs.
                        </span>
                        {activeFilterChips.map((chip) => (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={chip.onRemove}
                            className="flex items-center gap-1 border border-line bg-canvas px-2.5 py-0.5 rounded-full text-[11px] font-medium text-ink-body hover:border-taupe hover:text-taupe transition-colors shrink-0"
                          >
                            <span>{chip.label}</span>
                            <X size={11} />
                          </button>
                        ))}
                        {activeFilterChips.length > 0 && (
                          <button
                            type="button"
                            onClick={resetFilterPanel}
                            className="text-xs font-semibold text-taupe hover:underline ml-1 whitespace-nowrap shrink-0"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Model / Fabric toggle */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        <span className={`text-[11px] font-medium ${!showPortfolioFabric ? 'text-ink' : 'text-ink-faint'}`}>Model</span>
                        <button
                          type="button"
                          onClick={() => setShowPortfolioFabric((v) => !v)}
                          aria-label="Toggle between model and fabric photos"
                          className={`relative w-8 h-[18px] rounded-full transition-colors ${showPortfolioFabric ? 'bg-ink' : 'bg-line-strong'}`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${showPortfolioFabric ? 'translate-x-[14px]' : ''}`}
                          />
                        </button>
                        <span className={`text-[11px] font-medium ${showPortfolioFabric ? 'text-ink' : 'text-ink-faint'}`}>Fabric</span>
                      </div>
                    </div>

                    {filteredCatalogItems.length === 0 ? (
                      <div className="text-center py-16 bg-surface border border-line text-ink-muted">
                        No items match your search or filters. Try a different keyword or clear a filter.
                      </div>
                    ) : (
                      <div className="divide-y divide-line border-t border-line">
                        {filteredCatalogItems.map(item => {
                          const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;
                          const fabricImage = resolveFabricImage(item);
                          const displayImage = showPortfolioFabric ? (fabricImage || primaryImage) : primaryImage;
                          const isHighlighted = highlightedItemId === item.id;

                          return (
                            <Link
                              key={item.id}
                              id={`catalog-item-${item.id}`}
                              href={`/shop/${shopId}/catalog/${item.id}`}
                              className={`border-b border-line border-x-0 rounded-none px-0 py-3 flex items-start gap-3 transition-all duration-700 cursor-pointer group ${
                                isHighlighted
                                  ? 'bg-taupe/15 ring-2 ring-taupe px-2.5 rounded-xl shadow-xs'
                                  : 'hover:bg-sunken/40'
                              }`}
                            >
                              {/* Left: Image */}
                              <div className="w-20 h-28 sm:w-24 sm:h-32 overflow-hidden bg-sunken shrink-0 relative border border-line">
                                {displayImage ? (
                                  <Image
                                    key={displayImage}
                                    src={getMediaUrl(displayImage)}
                                    alt={`${item.name}${showPortfolioFabric ? ' - Fabric Swatch' : ''}`}
                                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                    fill
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-ink-faint text-[10px]">No Image</div>
                                )}
                              </div>

                              {/* Right: Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-medium uppercase tracking-wide text-taupe truncate">
                                      {item.garment_type || 'Bespoke Display'}
                                    </span>
                                    {(item.material || item.color) && (
                                      <span className="text-[9px] text-ink-muted">
                                        • {item.material}{item.material && item.color ? ` · ${item.color}` : item.color}
                                      </span>
                                    )}
                                  </div>

                                  {/* Name: 12 size regular, allows nextline wrapping */}
                                  <h3 className="text-[12px] font-normal text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 break-words">
                                    {item.name}
                                  </h3>

                                  {/* Rating: per-item only — does NOT fall back to shop rating */}
                                  {item.reviews_avg_rating && Number(item.reviews_avg_rating) > 0 ? (
                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted mt-1.5">
                                      <Star size={11} className="fill-amber-400 text-amber-500 shrink-0" />
                                      <span className="text-ink-body">{Number(item.reviews_avg_rating).toFixed(1)}</span>
                                      {item.reviews_count ? <span className="text-ink-faint font-normal">({item.reviews_count})</span> : null}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-ink-faint mt-1.5 flex items-center gap-1">
                                      <Clock size={11} className="text-taupe shrink-0" />
                                      Est. {item.estimated_days ? `${item.estimated_days}d` : '7d'}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-1.5">
                                  {/* Only Price is bold */}
                                  <span className="text-sm font-bold text-ink">
                                    ₱{Number(item.price).toLocaleString()}
                                  </span>

                                  {/* Estimated Days */}
                                  <span className="flex items-center gap-1 text-[11px] text-ink-muted font-medium">
                                    <Clock size={11} className="text-taupe shrink-0" />
                                    <span>Est. {item.estimated_days ? `${item.estimated_days}d` : '7-10d'}</span>
                                  </span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: HOURS — announcements show in the global top banner across
              every tab (see the banner right after the nav above), so this
              tab is just the standard operating hours. */}
          {activeTab === 'hours' && (
            <div className="max-w-md mx-auto">
              <div>
                <h3 className="text-xl font-bold text-ink mb-6 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Clock size={20} className="text-taupe" />
                    Standard Operating Hours
                  </span>
                  {isOwnerViewingOwnShop && (
                    <button
                      type="button"
                      onClick={() => setIsHoursModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-taupe hover:underline"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )}
                </h3>

                <div className="bg-surface border border-line rounded-2xl p-4">
                  <div className="space-y-4">
                    {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => {
                      const hours = shop.operating_hours?.[day];
                      if (!hours) return null;
                      const isOpen = hours.is_open && hours.open && hours.close;
                      return (
                        <div key={day} className="flex justify-between items-center text-sm py-1 border-b border-line/50 last:border-0 last:pb-0">
                          <span className="capitalize text-ink-body font-medium">{day}</span>
                          {isOpen ? (
                            <span className="text-ink font-bold bg-canvas px-3 py-1 rounded-lg">
                              {formatTime12h(hours.open)} – {formatTime12h(hours.close)}
                            </span>
                          ) : (
                            <span className="text-danger font-bold text-xs uppercase tracking-wider bg-danger/10 px-3 py-1 rounded-lg">
                              Closed
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOCATIONS */}
          {activeTab === 'locations' && shop.branches && shop.branches.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-bold text-ink">Our Branches</h2>
                  <p className="text-ink-muted text-sm mt-1">Visit us at any of our physical tailoring shops.</p>
                </div>
                {isOwnerViewingOwnShop && (
                  <Link href="/dashboard/branches" className="shrink-0 text-sm font-semibold text-taupe hover:underline flex items-center gap-1 whitespace-nowrap">
                    <Pencil size={13} /> Manage Branches
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {shop.branches.map((branch) => {
                  const isSelected = !!branch.slug && selectedBranchSlug === branch.slug;
                  return (
                    <div 
                      key={branch.id} 
                      className={`bg-surface rounded-2xl p-6 transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-2 border-ink ring-2 ring-white ring-offset-1 ring-offset-ink' 
                          : 'border border-line hover:border-taupe'
                      }`}
                    >
                      <div>
                        {branch.guide_image_url && (
                          <div className="-mx-6 -mt-6 mb-4 aspect-video bg-sunken overflow-hidden rounded-t-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={getMediaUrl(branch.guide_image_url)} alt={branch.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-ink text-xl flex items-center gap-2">
                            <Building2 className="text-taupe" size={20} />
                            {branch.name}
                          </h3>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-white bg-ink px-3 py-1 rounded-full uppercase tracking-wider">
                              Selected Location
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3 text-sm text-ink-body mb-4 bg-canvas p-4 rounded-xl border border-line/50">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-taupe shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{branch.address}, {branch.city}</span>
                          </div>
                          {branch.contact_number && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-taupe shrink-0" />
                              <span className="font-medium">{branch.contact_number}</span>
                            </div>
                          )}
                          {branch.operating_hours && (
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-taupe shrink-0" />
                              <span className="font-medium">{branch.operating_hours}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-auto">
                        <Link 
                          href={branch.slug ? `/shop/${shopId}/book?branch=${branch.slug}` : `/shop/${shopId}/book`}
                          className={`flex-1 text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                            isSelected 
                              ? 'bg-ink text-white hover:bg-black' 
                              : 'bg-surface border-2 border-ink text-ink hover:bg-canvas'
                          }`}
                        >
                          Book Here
                        </Link>
                        {branch.latitude && branch.longitude && (
                          <>
                            <button
                              type="button"
                              onClick={() => setMapModalBranch(branch)}
                              className="px-4 py-2.5 rounded-xl border border-line text-ink-body hover:bg-sunken hover:text-ink transition-colors flex items-center justify-center bg-surface"
                              title="View on Map"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 rounded-xl border border-line text-ink-body hover:bg-sunken hover:text-ink transition-colors flex items-center justify-center bg-surface"
                              title="Get Directions"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: OUR WORK */}
          {activeTab === 'work' && (posts.length > 0 || isOwnerViewingOwnShop) && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-bold text-ink">Our Work</h2>
                  <p className="text-ink-muted text-sm mt-1">A look at recent custom orders we&apos;ve completed for happy customers.</p>
                </div>
                {isOwnerViewingOwnShop && !isAddingPost && (
                  <button
                    type="button"
                    onClick={() => setIsAddingPost(true)}
                    className="shrink-0 flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus size={15} /> Add Post
                  </button>
                )}
              </div>

              {isOwnerViewingOwnShop && isAddingPost && (
                <form onSubmit={submitPost} className="bg-surface border border-line rounded-2xl p-5 space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Photos</span>
                    <span className={`text-xs font-semibold ${postImageUrls.length >= MAX_POST_IMAGES ? 'text-danger' : 'text-ink-muted'}`}>
                      {postImageUrls.length} / {MAX_POST_IMAGES} photos
                    </span>
                  </div>

                  {postImageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {postImageUrls.map(url => (
                        <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-line group/thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePostImage(url)}
                            title="Remove photo"
                            className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity focus:outline-none"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {postImageUrls.length < MAX_POST_IMAGES && (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-line border-dashed rounded-xl bg-canvas/50">
                      <div className="space-y-1 text-center">
                        {postUploading ? (
                          <Loader2 className="mx-auto h-8 w-8 text-ink-faint animate-spin" />
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-ink-faint" />
                            <div className="flex text-sm text-ink-muted justify-center">
                              <label htmlFor="inline-post-image" className="relative cursor-pointer bg-transparent rounded-md font-medium text-taupe hover:underline focus-within:outline-none">
                                <span>{postImageUrls.length === 0 ? 'Upload photos' : 'Add more photos'}</span>
                                <input
                                  id="inline-post-image"
                                  type="file"
                                  multiple
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handlePostImageUpload}
                                  disabled={postUploading}
                                />
                              </label>
                            </div>
                            <p className="text-xs text-ink-faint">PNG, JPG — up to {MAX_POST_IMAGES} photos per post</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={2}
                    value={postCaption}
                    onChange={e => setPostCaption(e.target.value)}
                    placeholder="e.g. Thank you to the Barangay Ballers team for trusting us with your jerseys!"
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink resize-none focus:outline-none focus:border-taupe"
                  />

                  <select
                    value={postServiceId}
                    onChange={e => setPostServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe"
                  >
                    <option value="">No related service</option>
                    {ownerServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => { setIsAddingPost(false); setPostImageUrls([]); setPostCaption(''); setPostServiceId(''); }} className="px-4 py-2 text-sm font-medium text-ink-body hover:bg-canvas rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={postSubmitting || postImageUrls.length === 0 || !postCaption.trim()}
                      className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-taupe hover:bg-taupe-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {postSubmitting && <Loader2 size={15} className="animate-spin" />}
                      Post to Storefront
                    </button>
                  </div>
                </form>
              )}

              {posts.length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-line">
                  <p className="text-ink-muted">No posts yet. Share your first completed order above.</p>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  {posts.map(post => (
                    <div key={post.id} className="group relative bg-surface border border-line rounded-2xl overflow-hidden w-full">
                      {isOwnerViewingOwnShop && (
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          title="Remove post"
                          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface border border-line text-ink-body hover:text-danger focus:outline-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="p-4 flex items-center gap-3">
                        <ShopLogoAvatar
                          src={shop.logo_path}
                          name={shop.name}
                          className="w-9 h-9 rounded-full border border-line"
                          textClassName="text-sm font-bold text-taupe"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-ink truncate">{shop.name}</p>
                          <p className="text-xs text-ink-faint">
                            {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-sunken relative">
                        {renderPostImageGrid(post.image_urls, (i) => {
                          setLightboxImages(post.image_urls);
                          setLightboxIndex(i);
                        })}
                      </div>

                      <div className="p-4 space-y-2">
                        <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                        <div className="pt-2 space-y-2">
                          <a
                            href={getMessengerUrl(getSocialUrl(shop.social_links, 'facebook'))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-1.5 bg-ink hover:bg-taupe text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <MessageCircle size={13} /> Inquire About This
                          </a>
                          {post.service && (
                            <Link
                              href={`/shop/${shopId}/book?service_id=${post.service.id}`}
                              className="flex w-full items-center justify-center gap-1.5 bg-surface border border-line hover:bg-sunken text-ink-body py-2 rounded-xl text-xs font-semibold transition-colors"
                            >
                              <Calendar size={13} /> Book &quot;{post.service.name}&quot;
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: RATINGS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-serif font-bold text-ink">Ratings</h2>
                  <p className="text-ink-muted text-xs mt-0.5">
                    Customer ratings breakdown for {shop.name}.
                  </p>
                </div>
                <select
                  value={reviewFilterRating}
                  onChange={e => { setReviewFilterRating(e.target.value); setReviewsPage(1); }}
                  className="px-3 py-1.5 bg-surface border border-line rounded-full text-xs text-ink focus:outline-none focus:border-taupe transition-colors shadow-xs"
                >
                  <option value="">All Stars</option>
                  <option value="5">5 Stars only</option>
                  <option value="4">4 Stars only</option>
                  <option value="3">3 Stars only</option>
                  <option value="2">2 Stars only</option>
                  <option value="1">1 Star only</option>
                </select>
              </div>

              {/* Overall Ratings Summary Card */}
              <div className="bg-surface rounded-2xl border border-line p-4 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  {/* Big score summary */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left justify-center border-b sm:border-b-0 sm:border-r border-line pb-3 sm:pb-0 sm:pr-4">
                    <span className="text-4xl font-black text-ink font-serif tracking-tight">
                      {shop.reviews_avg_rating ? Number(shop.reviews_avg_rating).toFixed(1) : '4.9'}
                    </span>
                    <div className="flex items-center gap-1 my-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avg = Number(shop.reviews_avg_rating || 4.9);
                        return (
                          <Star
                            key={star}
                            size={18}
                            className={star <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs text-ink-muted">
                      Based on {shop.reviews_count || reviews.length || 0} customer rating{((shop.reviews_count || reviews.length) === 1) ? '' : 's'}
                    </span>

                    {!isOwnerViewingOwnShop && (
                      <button
                        type="button"
                        onClick={() => {
                          setRatingValue(myReview?.rating || 0);
                          setIsRatingModalOpen(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-taupe hover:bg-taupe-hover text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Star size={13} className={myReview?.rating ? 'fill-amber-300 text-amber-300' : 'fill-white text-white'} />
                        <span>{myReview?.rating ? `Your Rating: ${myReview.rating}★ (Edit)` : 'Rate this Shop'}</span>
                      </button>
                    )}
                  </div>

                  {/* Star Distribution Bars */}
                  <div className="space-y-1.5 text-xs">
                    {[5, 4, 3, 2, 1].map((starNum) => {
                      const totalCount = reviews.length || 1;
                      const starMatches = reviews.filter(r => Math.round(r.rating) === starNum).length;
                      const percentage = reviews.length > 0 ? Math.round((starMatches / totalCount) * 100) : (starNum === 5 ? 85 : starNum === 4 ? 15 : 0);

                      return (
                        <div key={starNum} className="flex items-center gap-2">
                          <span className="w-8 font-semibold text-ink text-right flex items-center justify-end gap-0.5 text-[11px]">
                            {starNum} <Star size={10} className="fill-amber-400 text-amber-400" />
                          </span>
                          <div className="flex-1 h-2 bg-sunken rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-[10px] text-ink-faint text-right">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ratings List — strictly star ratings with customer name/date, NO comment messages */}
              {reviewsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-ink-faint" /></div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl border border-line p-6 shadow-xs">
                  <Star className="mx-auto h-9 w-9 text-ink-faint mb-2" />
                  <p className="text-xs font-bold text-ink">No ratings yet</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">Be the first to rate {shop.name}!</p>
                  {!isOwnerViewingOwnShop && (
                    <button
                      type="button"
                      onClick={() => {
                        setRatingValue(0);
                        setIsRatingModalOpen(true);
                      }}
                      className="mt-3 px-4 py-1.5 rounded-full bg-taupe text-white text-xs font-bold hover:bg-taupe-hover transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Star size={13} className="fill-white text-white" />
                      <span>Rate Now</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-surface rounded-2xl border border-line divide-y divide-line overflow-hidden shadow-xs">
                  {reviews.map(review => (
                    <div key={review.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-line/80 flex items-center justify-center font-bold text-ink-body text-xs shrink-0">
                          {review.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink text-xs truncate leading-tight">
                            {review.user?.name || 'Customer'}
                          </p>
                          <p className="text-[10px] text-ink-faint mt-0.5">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                size={12}
                                className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-extrabold text-amber-800 ml-0.5">
                            {Number(review.rating).toFixed(1)}
                          </span>
                        </div>

                        {isOwnerViewingOwnShop && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-[11px] text-danger hover:underline font-semibold ml-1 cursor-pointer"
                            title="Delete rating"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {reviewsLastPage > 1 && (
                    <div className="p-3 flex justify-center items-center gap-2 bg-canvas">
                      <button
                        type="button"
                        disabled={reviewsPage === 1}
                        onClick={() => setReviewsPage(p => p - 1)}
                        className="px-3 py-1 rounded-lg border border-line bg-surface text-xs font-medium disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-ink-body font-medium">Page {reviewsPage} of {reviewsLastPage}</span>
                      <button
                        type="button"
                        disabled={reviewsPage === reviewsLastPage}
                        onClick={() => setReviewsPage(p => p + 1)}
                        className="px-3 py-1 rounded-lg border border-line bg-surface text-xs font-medium disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Rating Modal — constrained strictly to fit inside 320px mobile viewport without overflow */}
      {isRatingModalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 pointer-events-auto">
          {/* Backdrop Scrim */}
          <button
            type="button"
            aria-label="Close rating dialog"
            onClick={() => {
              setIsRatingModalOpen(false);
              setHoveredStar(null);
              setRatingValue(myReview?.rating || 0);
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 focus:outline-none"
          />

          {/* Dialog Panel: exactly max-w-[296px] (320px - 24px) so it never exceeds 320px */}
          <div className="relative bg-surface rounded-2xl shadow-2xl flex flex-col w-full max-w-[296px] overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-line">
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line shrink-0 bg-surface">
              <div className="flex items-center gap-1.5 min-w-0">
                <Star size={14} className="text-amber-500 fill-amber-400 shrink-0" />
                <h2 className="text-xs font-bold text-ink truncate">
                  {myReview?.rating ? 'Update Rating' : 'Rate this Shop'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRatingModalOpen(false);
                  setHoveredStar(null);
                  setRatingValue(myReview?.rating || 0);
                }}
                aria-label="Close"
                className="p-1 -mr-1 rounded-full text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitRating} className="p-3.5 space-y-3">
              <div className="text-center">
                <p className="text-[11px] text-ink-muted mb-2">
                  How was your experience with <span className="font-semibold text-ink">{shop.name}</span>?
                </p>

                {/* Stars row — 5 stars sized at 30px with gap-1.5, fits 268px body easily */}
                <div
                  className="flex justify-center items-center gap-1.5 py-1"
                  onMouseLeave={() => setHoveredStar(null)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeVal = hoveredStar ?? ratingValue;
                    const isFilled = activeVal >= star;
                    const isCurrentRated = ratingValue === star;

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        title={isCurrentRated ? 'Click again to unrate' : `Rate ${star} star${star > 1 ? 's' : ''}`}
                        className="p-1 transition-all hover:scale-115 active:scale-95 focus:outline-none"
                      >
                        <Star
                          size={30}
                          className={
                            isFilled
                              ? 'fill-amber-400 text-amber-500 transition-colors'
                              : 'text-line-strong hover:text-amber-400/50 transition-colors'
                          }
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Star descriptor & helper */}
                <div className="mt-1.5 min-h-[26px] flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-ink">
                    {(hoveredStar ?? ratingValue) === 0
                      ? (myReview?.rating ? '0 Stars (Tap button below to save)' : 'Tap a star to rate')
                      : (hoveredStar ?? ratingValue) === 1
                      ? '1 Star · Poor'
                      : (hoveredStar ?? ratingValue) === 2
                      ? '2 Stars · Fair'
                      : (hoveredStar ?? ratingValue) === 3
                      ? '3 Stars · Good'
                      : (hoveredStar ?? ratingValue) === 4
                      ? '4 Stars · Very Good'
                      : '5 Stars · Excellent'}
                  </span>
                  {ratingValue > 0 && (
                    <span className="text-[10px] text-ink-muted mt-0.5">
                      Tap the same star to unrate
                    </span>
                  )}
                </div>
              </div>

              {/* Actions: Full-width submit button + secondary text actions */}
              <div className="space-y-2 pt-2 border-t border-line">
                <button
                  type="submit"
                  disabled={isSubmitting || (ratingValue === 0 && !myReview?.rating)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    ratingValue === 0 && myReview?.rating
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-taupe hover:bg-taupe-hover text-white'
                  } disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]`}
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>
                    {ratingValue === 0
                      ? 'Remove Rating'
                      : myReview?.rating
                      ? ratingValue === myReview.rating
                        ? 'Save Rating'
                        : `Update to ${ratingValue}★`
                      : `Submit ${ratingValue}★`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRatingModalOpen(false);
                    setHoveredStar(null);
                    setRatingValue(myReview?.rating || 0);
                  }}
                  className="w-full py-1 text-center text-[11px] font-semibold text-ink-muted hover:text-ink transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}



      <ServiceDetailModal
        service={selectedService}
        isOpen={selectedService !== null}
        onClose={() => setSelectedService(null)}
        facebookUrl={getSocialUrl(shop.social_links, 'facebook')}
        shopId={shopId}
      />

      <ServiceDetailModal
        service={selectedPackage ? {
          id: selectedPackage.id,
          name: selectedPackage.name,
          price: selectedPackage.bundle_price
            ? Number(selectedPackage.bundle_price)
            : selectedPackage.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0),
          description: selectedPackage.description || undefined,
          categories: ['Package'],
          tags: selectedPackage.services.map(s => s.name),
          kind: 'package',
        } : null}
        isOpen={selectedPackage !== null}
        onClose={() => setSelectedPackage(null)}
        facebookUrl={getSocialUrl(shop.social_links, 'facebook')}
        shopId={shopId}
      />

      {/* Catalog Filter Bottom Sheet (Anchored to device screen, NOT page top) */}
      {isPortfolioFilterOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center pointer-events-auto">
          {/* Backdrop Scrim */}
          <button
            type="button"
            aria-label="Close filter"
            onClick={() => setIsPortfolioFilterOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 focus:outline-none"
          />

          {/* Bottom Sheet Container */}
          <div className="relative bg-canvas rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] sm:max-w-md w-full overflow-hidden z-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 border-t sm:border border-line">
            {/* Grab Handle for mobile touch affordance */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden bg-surface">
              <div className="w-10 h-1 rounded-full bg-line-strong" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-line shrink-0 bg-surface">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-taupe" />
                <span className="text-sm font-bold text-ink">Filter Catalog</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-taupe text-canvas text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsPortfolioFilterOpen(false)}
                aria-label="Close"
                className="p-1.5 -mr-1 rounded-full text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 1-Column Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 1. PRICE (Sort + Min/Max) */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink mb-2.5">
                  1. Price &amp; Sorting
                </p>
                {/* Sort buttons: Default, Low to High, High to Low */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { key: '' as const, label: 'Default', Icon: Minus },
                    { key: 'price_asc' as const, label: 'Low to High', Icon: TrendingUp },
                    { key: 'price_desc' as const, label: 'High to Low', Icon: TrendingDown },
                  ].map((opt) => {
                    const isSelected = draftPriceSort === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setDraftPriceSort(opt.key)}
                        className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-taupe text-canvas border-taupe shadow-xs'
                            : 'bg-surface text-ink-body border-line hover:border-taupe/60'
                        }`}
                      >
                        <opt.Icon size={16} />
                        <span className="whitespace-nowrap">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Min - Max price inputs */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-faint">₱</span>
                    <input
                      type="number"
                      min={0}
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      placeholder="Min Price"
                      className="w-full pl-7 pr-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe"
                    />
                  </div>
                  <span className="text-ink-faint text-sm font-semibold">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-faint">₱</span>
                    <input
                      type="number"
                      min={0}
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      placeholder="Max Price"
                      className="w-full pl-7 pr-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe"
                    />
                  </div>
                </div>
              </div>

              {/* 2. COLOR */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink">
                    2. Color
                  </p>
                  {draftColorFilter && (
                    <button
                      type="button"
                      onClick={() => setDraftColorFilter('')}
                      className="text-[11px] font-medium text-taupe hover:underline"
                    >
                      Clear color
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftColorFilter('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      !draftColorFilter
                        ? 'bg-taupe text-canvas border-taupe font-semibold shadow-xs'
                        : 'bg-surface text-ink-body border-line hover:border-taupe'
                    }`}
                  >
                    All Colors
                  </button>
                  {availableColors.map((c) => {
                    const isSelected = draftColorFilter.toLowerCase() === c.label.toLowerCase();
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setDraftColorFilter(isSelected ? '' : c.label)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-ink text-canvas border-ink shadow-xs ring-1 ring-taupe'
                            : 'bg-surface text-ink-body border-line hover:border-taupe'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. RATING */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink">
                    3. Rating
                  </p>
                  {draftRatingFilter && (
                    <button
                      type="button"
                      onClick={() => setDraftRatingFilter('')}
                      className="text-[11px] font-medium text-taupe hover:underline"
                    >
                      Clear rating
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {[
                    { value: '5', label: '5 Stars only' },
                    { value: '4', label: '4 Stars & Up' },
                    { value: '3', label: '3 Stars & Up' },
                    { value: '2', label: '2 Stars & Up' },
                    { value: '1', label: '1 Star & Up' },
                  ].map((opt) => {
                    const isSelected = draftRatingFilter === opt.value;
                    const num = Number(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraftRatingFilter(isSelected ? '' : opt.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-taupe/10 border-taupe text-ink font-semibold'
                            : 'bg-surface border-line text-ink-body hover:bg-sunken'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={15}
                              className={star <= num ? 'text-amber-500 fill-amber-500' : 'text-line-strong'}
                            />
                          ))}
                          <span className="ml-2 font-medium text-ink">{opt.label}</span>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-taupe" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. GARMENT TYPE (if available) */}
              {garmentTypeOptions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink">
                      4. Garment Type
                    </p>
                    {draftGarmentTypeFilters.size > 0 && (
                      <button
                        type="button"
                        onClick={() => setDraftGarmentTypeFilters(new Set())}
                        className="text-[11px] font-medium text-taupe hover:underline"
                      >
                        Clear garment types
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {garmentTypeOptions.map((opt) => {
                      const isSelected = draftGarmentTypeFilters.has(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setDraftGarmentTypeFilters((prev) => {
                              const next = new Set(prev);
                              if (next.has(opt.id)) next.delete(opt.id);
                              else next.add(opt.id);
                              return next;
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-taupe text-canvas border-taupe font-semibold shadow-xs'
                              : 'bg-surface text-ink-body border-line hover:border-taupe'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-canvas/80' : 'text-ink-faint'}`}>
                            ({garmentTypeTally[opt.id] || 0})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-2.5 px-4 py-3 border-t border-line shrink-0 bg-surface"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <button
                type="button"
                onClick={resetFilterPanel}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-line-strong text-xs font-semibold text-ink-muted hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset All</span>
              </button>
              <button
                type="button"
                onClick={applyFilterPanel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-taupe hover:bg-taupe/90 text-canvas text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Post Image Lightbox */}

      <PostImageLightbox
        images={lightboxImages || []}
        initialIndex={lightboxIndex}
        isOpen={lightboxImages !== null}
        onClose={() => setLightboxImages(null)}
      />

      <Modal isOpen={mapModalBranch !== null} onClose={() => setMapModalBranch(null)} title={mapModalBranch?.name || 'Branch Location'}>
        {mapModalBranch?.latitude && mapModalBranch?.longitude && (
          <SingleBranchMap
            shopName={shop.name}
            branchName={mapModalBranch.name}
            address={mapModalBranch.address}
            city={mapModalBranch.city}
            latitude={Number(mapModalBranch.latitude)}
            longitude={Number(mapModalBranch.longitude)}
          />
        )}
      </Modal>

      {isOwnerViewingOwnShop && (
        <>
          <ServiceFormModal
            isOpen={isServiceModalOpen}
            onClose={() => { setIsServiceModalOpen(false); setEditingServiceId(null); setServiceError(''); }}
            editingId={editingServiceId}
            onSubmit={handleServiceSubmit}
            isSubmitting={isServiceSubmitting}
            error={serviceError}
            editingService={editingServiceId ? ownerServices.find(s => s.id === editingServiceId) || null : null}
          />

          <ServiceDeleteModal
            isOpen={isServiceDeleteOpen}
            onClose={() => { setIsServiceDeleteOpen(false); setDeletingServiceId(null); }}
            onConfirm={confirmDeleteService}
            isSubmitting={isServiceSubmitting}
          />

          <EditOperatingHoursModal
            isOpen={isHoursModalOpen}
            onClose={() => setIsHoursModalOpen(false)}
            shopId={authShop!.id}
            initialHours={shop.operating_hours || {}}
            onSaved={handleHoursSaved}
          />
        </>
      )}
    </div>
  );
}

export default function PublicShopProfilePage(props: Readonly<PublicShopProfilePageProps>) {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-canvas"><Loader2 className="w-8 h-8 animate-spin text-ink" /></div>}>
      <PublicShopProfileContent {...props} />
    </Suspense>
  );
}
