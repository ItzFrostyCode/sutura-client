'use client';

import { useEffect, useState, useCallback, useRef, useMemo, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useCloseOnDesktop } from '@/hooks/useCloseOnDesktop';
import { Service } from '@/components/services/serviceHelpers';
import { isStoreOpen } from '@/lib/storeStatus';
import {
  StoreProfile,
  StoreBranch,
  PublicService,
  PublicServicePackage,
  CatalogListItem,
  PublicStorePost,
  StorefrontReview,
  StorefrontTab,
  PORTFOLIO_COLOR_OPTIONS,
} from '../types';

const emptySubscribe = () => () => {};
const MAX_POST_IMAGES = 12;

export function useStoreStorefront(storeId: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, store: authStore, token, setAuth } = useAuthStore();
  const toast = useToast();

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [packages, setPackages] = useState<PublicServicePackage[]>([]);
  const [posts, setPosts] = useState<PublicStorePost[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnerViewingOwnStore = !!authStore && authStore.slug === storeId && user?.roles?.[0]?.name === 'store_owner';

  // Owner services
  const [ownerServices, setOwnerServices] = useState<Service[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [isServiceDeleteOpen, setIsServiceDeleteOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);

  // Operating Hours
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

  // Posts / Showcase
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [postImageUrls, setPostImageUrls] = useState<string[]>([]);
  const [postUploading, setPostUploading] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postServiceId, setPostServiceId] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // URL Params & Navigation
  const selectedBranchSlug = searchParams.get('branch');
  const initialTabParam = searchParams.get('tab');
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Review State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [myReview, setMyReview] = useState<{ id?: number; rating: number; comment?: string | null } | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [reviews, setReviews] = useState<StorefrontReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLastPage, setReviewsLastPage] = useState(1);
  const [reviewFilterRating, setReviewFilterRating] = useState('');

  // Service Rating — one rating-only modal instance reused across whichever
  // service the customer currently has open (see ServiceDetailView), unlike
  // the store rating above which only ever has one subject.
  const [ratingService, setRatingService] = useState<PublicService | null>(null);
  const [isServiceRatingModalOpen, setIsServiceRatingModalOpen] = useState(false);
  const [serviceRatingValue, setServiceRatingValue] = useState(0);
  const [myServiceReview, setMyServiceReview] = useState<{ id?: number; rating: number } | null>(null);
  const [serviceHoveredStar, setServiceHoveredStar] = useState<number | null>(null);
  const [isSubmittingServiceRating, setIsSubmittingServiceRating] = useState(false);

  // Service detail modal
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<number | null>(null);
  const hasScrolledToService = useRef(false);
  const isAutoScrollingService = useRef(false);

  // Map Modal
  const [mapModalBranch, setMapModalBranch] = useState<StoreBranch | null>(null);
  const [isAllBranchesMapOpen, setIsAllBranchesMapOpen] = useState(false);

  // Helper to parse tab from query param
  const resolveTabFromParam = useCallback((tabParam: string | null): StorefrontTab => {
    if (!tabParam) return 'catalog';
    if (tabParam === 'catalog' || tabParam === 'portfolio' || tabParam === 'showroom') return 'catalog';
    if (tabParam === 'branch' || tabParam === 'locations') return 'locations';
    if (tabParam === 'review' || tabParam === 'reviews' || tabParam === 'rating' || tabParam === 'ratings') return 'reviews';
    if (tabParam === 'service' || tabParam === 'services') return 'services';
    if (tabParam === 'about') return 'about';
    if (tabParam === 'hours') return 'hours';
    if (tabParam === 'work') return 'work';
    return 'catalog';
  }, []);

  // Active Tab
  const [activeTab, setActiveTabState] = useState<StorefrontTab>(() => resolveTabFromParam(initialTabParam));

  // Keep activeTab synced with URL query parameter so refresh/sharing preserves tab.
  // Deliberately uses the raw History API (window.history.replaceState)
  // instead of Next.js's router.replace() — router.replace() re-runs the
  // App Router's navigation lifecycle (including this page's own
  // useSearchParams()-driven effects) on every tab click, which would
  // refetch/reset state that shouldn't change just because the URL's
  // query string did. Browser back/forward still works correctly because
  // Next's router listens for popstate itself (see the effect below that
  // reads `searchParams` and resyncs state) — only the *forward* (tab
  // click) direction bypasses the router, not the *backward* one. Do not
  // "clean this up" into router.replace() without re-testing tab-click
  // performance — that was the whole reason for this split.
  const setActiveTab = useCallback((newTab: StorefrontTab) => {
    setActiveTabState(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const tabParamValue =
        newTab === 'locations'
          ? 'branch'
          : newTab === 'reviews'
            ? 'ratings'
            : newTab === 'services'
              ? 'services'
              : newTab === 'about'
                ? 'about'
                : newTab === 'work'
                  ? 'work'
                  : newTab === 'hours'
                    ? 'hours'
                    : null;

      if (tabParamValue) {
        url.searchParams.set('tab', tabParamValue);
      } else {
        url.searchParams.delete('tab');
      }
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, []);

  // Sync state if user navigates back/forward via browser history (or any
  // router.push elsewhere in this file, e.g. the branch-select push below,
  // changes the URL). Genuinely syncing FROM an external system (the
  // browser's own navigation, which setActiveTab's raw history.replaceState
  // deliberately bypasses — see that function's comment) INTO React state —
  // there's no React event handler to move this into instead.
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const resolved = resolveTabFromParam(tabParam);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveTabState(resolved);
  }, [searchParams, resolveTabFromParam]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Catalog State
  const [catalogItems, setCatalogItems] = useState<CatalogListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState(() => searchParams.get('q') || searchParams.get('search') || '');
  const [serviceSearch, setServiceSearch] = useState(() => searchParams.get('q') || searchParams.get('search') || '');

  // Portfolio Filters
  const [priceSort, setPriceSort] = useState<'' | 'price_asc' | 'price_desc'>('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [catalogGarmentTypeFilters, setCatalogGarmentTypeFilters] = useState<Set<string>>(new Set());
  const [showPortfolioFabric, setShowPortfolioFabric] = useState(false);

  // Draft filters for modal
  const [isPortfolioFilterOpen, setIsPortfolioFilterOpen] = useState(false);
  // The sheet's own trigger is mobile-only (StoreCatalogFilterSidebar takes
  // over at sm+) — without this, resizing past 640px while it's open left
  // it stuck open on top of the now-visible sidebar.
  useCloseOnDesktop(() => setIsPortfolioFilterOpen(false), 640);
  const [draftPriceSort, setDraftPriceSort] = useState<'' | 'price_asc' | 'price_desc'>('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftColorFilter, setDraftColorFilter] = useState('');
  const [draftRatingFilter, setDraftRatingFilter] = useState('');
  const [draftGarmentTypeFilters, setDraftGarmentTypeFilters] = useState<Set<string>>(new Set());

  const tabBarRef = useRef<HTMLDivElement>(null);

  // Catalog item deep linking
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);
  const hasScrolledToItem = useRef(false);
  const isAutoScrolling = useRef(false);
  const hasScrolledToSearchTab = useRef(false);

  // Sync search query from URL — reflects the query into whichever tab the
  // link actually pointed at (?tab=services&q=... from the Search page's
  // Services tab should land on Services pre-filled, not force Catalog).
  const currentQParam = searchParams.get('q') || searchParams.get('search') || '';
  const [prevQParam, setPrevQParam] = useState(currentQParam);
  if (currentQParam !== prevQParam) {
    setPrevQParam(currentQParam);
    if (currentQParam) {
      if (resolveTabFromParam(searchParams.get('tab')) === 'services') {
        setServiceSearch(currentQParam);
        setActiveTab('services');
      } else {
        setCatalogSearch(currentQParam);
        setActiveTab('catalog');
      }
    }
  }

  // Deep-link catalog item scroll
  useEffect(() => {
    const rawItem = searchParams.get('item');
    if (!rawItem || catalogLoading || catalogItems.length === 0 || hasScrolledToItem.current) return;

    const itemId = Number(rawItem);
    if (Number.isNaN(itemId)) return;

    const tryScroll = (attempts = 0) => {
      const targetElement = document.getElementById(`catalog-item-${itemId}`);
      if (targetElement) {
        hasScrolledToItem.current = true;
        setHighlightedItemId(itemId);
        isAutoScrolling.current = true;

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

  // Arrived here via a search (landing hero -> /search -> "click shop" link,
  // which forwards ?tab=catalog&q=<label>) — the label already switches to
  // the Catalog tab and pre-fills catalogSearch above, but on a fresh page
  // load the visitor still lands at the very top of the page (cover banner
  // + profile header), with the tab bar/catalog grid below the fold. Scroll
  // down to it automatically instead of making them scroll past the header
  // themselves. Same retry-until-mounted + scroll-lock pattern as the
  // catalog item deep-link above, reusing tabBarRef (already wired into
  // StoreHeroHeader's tab bar) as the target. Fires once per page load,
  // on every breakpoint (mobile, tablet, and desktop).
  useEffect(() => {
    if (!currentQParam || hasScrolledToSearchTab.current) return;

    const tryScrollToTabs = (attempts = 0) => {
      const targetElement = tabBarRef.current;
      if (targetElement) {
        hasScrolledToSearchTab.current = true;
        isAutoScrolling.current = true;

        const targetRect = targetElement.getBoundingClientRect();
        window.scrollTo({
          top: Math.max(0, window.scrollY + targetRect.top - 70),
          behavior: 'smooth',
        });

        const scrollLockTimer = setTimeout(() => {
          isAutoScrolling.current = false;
        }, 1200);
        return () => clearTimeout(scrollLockTimer);
      } else if (attempts < 6) {
        setTimeout(() => tryScrollToTabs(attempts + 1), 150);
      }
    };

    const timer = setTimeout(() => tryScrollToTabs(0), 100);
    return () => clearTimeout(timer);
  }, [currentQParam]);

  // Facet tallies
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

  const isStoreCurrentlyOpen = useMemo(() => {
    return isStoreOpen(store?.operating_hours);
  }, [store?.operating_hours]);

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

  const activeBranch = store?.branches?.find(b => b.slug === selectedBranchSlug);

  const fetchStore = useCallback(() => {
    api.get(`/public/stores/${storeId}`)
      .then(res => {
        const fetchedStore = res.data.data;
        setStore(fetchedStore);
        if (fetchedStore?.my_review) {
          setMyReview(fetchedStore.my_review);
          setRatingValue(fetchedStore.my_review.rating);
        } else if (fetchedStore?.my_review === null) {
          setMyReview(null);
          setRatingValue(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [storeId]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  useEffect(() => {
    if (user && store?.slug) {
      api.get(`/stores/${store.slug}/my-review`)
        .then(res => {
          if (res.data?.success && res.data.data) {
            setMyReview(res.data.data);
            setRatingValue(res.data.data.rating);
          }
        })
        .catch(() => {});
    }
  }, [user, store?.slug]);

  useEffect(() => {
    if (!user || !store?.id) return;
    api.post('/recently-viewed', { type: 'store', id: store.id }).catch(() => {});
  }, [user, store?.id]);

  useEffect(() => {
    api.get(`/public/stores/${storeId}/services`)
      .then(res => {
        const active = (res.data.data || []).filter((s: PublicService) => s.is_active);
        setServices(active);
        const targetServiceId = searchParams.get('service_id') || searchParams.get('service');
        if (targetServiceId) {
          const match = active.find((s: PublicService) => String(s.id) === String(targetServiceId));
          if (match) {
            setExpandedServiceId(match.id);
          }
        }

        // "Edit" on the standalone /store/[store_id]/service/[service_id]
        // page can't reach this page's own edit-modal state directly (it's
        // a separate route) — it links back here with ?edit_service=<id>
        // instead, and this reopens the same modal the inline "Edit" icon
        // always used. Owner-gated so an arbitrary query param can't open
        // it for anyone else.
        const editServiceId = searchParams.get('edit_service');
        if (editServiceId && isOwnerViewingOwnStore) {
          const match = active.find((s: PublicService) => String(s.id) === editServiceId);
          if (match) {
            setEditingServiceId(match.id);
            setServiceError('');
            setIsServiceModalOpen(true);
          }
        }
      })
      .catch(() => {});
  }, [storeId, searchParams, isOwnerViewingOwnStore]);

  // Deep-link service scroll
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

  useEffect(() => {
    api.get(`/public/stores/${storeId}/service-packages`)
      .then(res => setPackages(res.data.data || []))
      .catch(() => {});
  }, [storeId]);

  useEffect(() => {
    api.get(`/public/stores/${storeId}/posts`)
      .then(res => setPosts(res.data.data || []))
      .catch(() => {});
  }, [storeId]);

  useEffect(() => {
    api.get(`/catalog/${storeId}`)
      .then(res => {
        setCatalogItems(res.data.data || []);
        setCatalogLoading(false);
      })
      .catch(() => {
        setCatalogLoading(false);
      });
  }, [storeId]);

  useEffect(() => {
    let ignore = false;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      const params = new URLSearchParams({ page: String(reviewsPage) });
      if (reviewFilterRating) params.append('rating', reviewFilterRating);
      try {
        const res = await api.get(`/public/stores/${storeId}/reviews?${params.toString()}`);
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
  }, [storeId, reviewsPage, reviewFilterRating, reviewsRefreshKey]);

  useEffect(() => {
    if (!user && token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const { user: fetchedUser, store: fetchedStore, staff_profile } = res.data.data;
            setAuth(fetchedUser, token, fetchedStore, staff_profile);
          }
        })
        .catch(() => {});
    }
  }, [user, token, setAuth]);

  const refreshOwnerServices = useCallback((storeIdForFetch: number) => {
    api.get(`/stores/${storeIdForFetch}/services`)
      .then(res => setOwnerServices(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOwnerViewingOwnStore && authStore) {
      refreshOwnerServices(authStore.id);
    }
  }, [isOwnerViewingOwnStore, authStore?.id, refreshOwnerServices]);

  const refreshPublicServices = useCallback(() => {
    api.get(`/public/stores/${storeId}/services`)
      .then(res => setServices((res.data.data || []).filter((s: PublicService) => s.is_active)))
      .catch(() => {});
  }, [storeId]);

  const handleServiceSubmit = async (payload: Record<string, unknown>) => {
    if (!authStore) return;
    setIsServiceSubmitting(true);
    setServiceError('');
    try {
      if (editingServiceId) {
        await api.put(`/stores/${authStore.id}/services/${editingServiceId}`, payload);
        toast.success('Service updated.');
      } else {
        await api.post(`/stores/${authStore.id}/services`, payload);
        toast.success('Service added.');
      }
      refreshOwnerServices(authStore.id);
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
    if (!authStore || !deletingServiceId) return;
    setIsServiceSubmitting(true);
    try {
      await api.delete(`/stores/${authStore.id}/services/${deletingServiceId}`);
      refreshOwnerServices(authStore.id);
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
    setStore(prev => (prev ? { ...prev, operating_hours: hours } : prev));
  };

  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !authStore) return;

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
        const res = await api.post(`/stores/${authStore.id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    if (!authStore || postImageUrls.length === 0 || !postCaption.trim()) return;
    setPostSubmitting(true);
    try {
      const res = await api.post(`/stores/${authStore.id}/posts`, {
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
    if (!authStore) return;
    try {
      await api.delete(`/stores/${authStore.id}/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post removed.');
    } catch {
      toast.error('Failed to remove post.');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!authStore) return;
    try {
      await api.delete(`/stores/${authStore.id}/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted.');
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  const submitRating = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      toast.error('Please log in to rate this store.');
      return;
    }
    if (!store) {
      toast.error('Store profile is still loading. Please try again.');
      return;
    }
    setIsSubmittingRating(true);
    try {
      const res = await api.post(`/stores/${store.slug}/reviews`, { rating: ratingValue });
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
      fetchStore();
      setReviewsRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to submit rating. Please try again.'));
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const openServiceRatingModal = async (service: PublicService) => {
    if (!user) {
      toast.error('Please log in to rate this service.');
      return;
    }
    setRatingService(service);
    setMyServiceReview(null);
    setServiceRatingValue(0);
    if (store?.slug) {
      try {
        const res = await api.get(`/stores/${store.slug}/services/${service.id}/my-review`);
        if (res.data?.success && res.data.data) {
          setMyServiceReview(res.data.data);
          setServiceRatingValue(res.data.data.rating);
        }
      } catch {
        // No prior rating (or fetch failed) — modal still opens at 0 stars.
      }
    }
    setIsServiceRatingModalOpen(true);
  };

  const submitServiceRating = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!user || !store || !ratingService) return;

    setIsSubmittingServiceRating(true);
    try {
      const res = await api.post(`/stores/${store.slug}/services/${ratingService.id}/reviews`, {
        rating: serviceRatingValue,
      });

      if (serviceRatingValue === 0) {
        setMyServiceReview(null);
        toast.success('Rating removed.');
      } else {
        const savedReview = res.data?.review || { rating: serviceRatingValue };
        setMyServiceReview(savedReview);
        toast.success(myServiceReview?.rating ? 'Rating updated!' : 'Rating submitted!');
      }

      // Reflect the fresh aggregate on the service card/detail immediately,
      // without a full re-fetch of the services list.
      setServices((prev) =>
        prev.map((s) =>
          s.id === ratingService.id
            ? { ...s, reviews_count: res.data?.reviews_count, reviews_avg_rating: res.data?.reviews_avg_rating }
            : s
        )
      );

      setIsServiceRatingModalOpen(false);
      setServiceHoveredStar(null);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to submit rating. Please try again.'));
    } finally {
      setIsSubmittingServiceRating(false);
    }
  };

  const tabList: { id: StorefrontTab; label: string }[] = [
    { id: 'catalog', label: 'Catalog' },
    { id: 'services', label: 'Service' },
    { id: 'about', label: 'About' },
  ];
  if (store?.branches && store.branches.length > 0) {
    tabList.push({ id: 'locations', label: 'Branch' });
  }
  tabList.push({ id: 'reviews', label: 'Ratings' });

  return {
    router,
    searchParams,
    user,
    authStore,
    store,
    loading,
    isOwnerViewingOwnStore,
    activeTab,
    setActiveTab,
    tabList,
    selectedBranchSlug,
    activeBranch,
    isBookmarked,
    setIsBookmarked,
    isStoreCurrentlyOpen,

    // Header & Navigation
    tabBarRef,

    // Catalog
    catalogItems,
    catalogLoading,
    catalogSearch,
    setCatalogSearch,
    highlightedItemId,
    priceSort,
    setPriceSort,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    colorFilter,
    setColorFilter,
    ratingFilter,
    setRatingFilter,
    catalogGarmentTypeFilters,
    toggleGarmentType,
    showPortfolioFabric,
    setShowPortfolioFabric,

    // Portfolio filter modal
    isPortfolioFilterOpen,
    setIsPortfolioFilterOpen,
    openFilterPanel,
    applyFilterPanel,
    resetFilterPanel,
    activeFilterCount,
    draftPriceSort,
    setDraftPriceSort,
    draftMinPrice,
    setDraftMinPrice,
    draftMaxPrice,
    setDraftMaxPrice,
    draftColorFilter,
    setDraftColorFilter,
    draftRatingFilter,
    setDraftRatingFilter,
    draftGarmentTypeFilters,
    setDraftGarmentTypeFilters,
    garmentTypeTally,
    garmentTypeOptions,
    availableColors,

    // Services
    services,
    packages,
    serviceSearch,
    setServiceSearch,
    expandedServiceId,
    setExpandedServiceId,
    highlightedServiceId,
    selectedService,
    setSelectedService,

    // Owner service modals
    ownerServices,
    isServiceModalOpen,
    setIsServiceModalOpen,
    editingServiceId,
    setEditingServiceId,
    isServiceSubmitting,
    serviceError,
    setServiceError,
    isServiceDeleteOpen,
    setIsServiceDeleteOpen,
    deletingServiceId,
    setDeletingServiceId,
    handleServiceSubmit,
    confirmDeleteService,

    // Hours modal
    isHoursModalOpen,
    setIsHoursModalOpen,
    handleHoursSaved,

    // Posts & Lightbox
    posts,
    isAddingPost,
    setIsAddingPost,
    postImageUrls,
    postUploading,
    postCaption,
    setPostCaption,
    postServiceId,
    setPostServiceId,
    postSubmitting,
    lightboxImages,
    setLightboxImages,
    lightboxIndex,
    setLightboxIndex,
    handlePostImageUpload,
    removePostImage,
    submitPost,
    deletePost,

    // Reviews & Rating Modal
    reviews,
    reviewsLoading,
    reviewsPage,
    setReviewsPage,
    reviewsLastPage,
    reviewFilterRating,
    setReviewFilterRating,
    handleDeleteReview,
    isRatingModalOpen,
    setIsRatingModalOpen,
    ratingValue,
    setRatingValue,
    myReview,
    hoveredStar,
    setHoveredStar,
    isSubmittingRating,
    submitRating,

    // Service Rating Modal
    ratingService,
    isServiceRatingModalOpen,
    setIsServiceRatingModalOpen,
    serviceRatingValue,
    setServiceRatingValue,
    myServiceReview,
    serviceHoveredStar,
    setServiceHoveredStar,
    isSubmittingServiceRating,
    openServiceRatingModal,
    submitServiceRating,

    // Map modal
    mapModalBranch,
    setMapModalBranch,
    isAllBranchesMapOpen,
    setIsAllBranchesMapOpen,

    // Hydration safe flag
    mounted,
  };
}
