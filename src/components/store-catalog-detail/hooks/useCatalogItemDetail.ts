import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { CatalogItem, CatalogItemImage, MapBranch } from '../types';

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useCatalogItemDetail(storeId: string, itemId: string) {
  const router = useRouter();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  // Set only by handleBulkOrder now — the plain made-to-order path that
  // used to also set this (and its own orderSubmitting/orderError
  // companions) was removed once the catalog item detail page stopped
  // offering a direct-order CTA at all (always "Book a Fitting" now).
  const [orderSuccess, setOrderSuccess] = useState<{ order_number: string; id: number } | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [fromSameShop, setFromSameShop] = useState<CatalogItemResult[]>([]);
  const [moreLikeThis, setMoreLikeThis] = useState<CatalogItemResult[]>([]);
  const [showFind, setShowFind] = useState(false);
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
    api.get(`/catalog/${storeId}/${itemId}`)
      .then(res => {
        setItem(res.data.data);
        const primary = res.data.data.images.find((i: CatalogItemImage) => i.is_primary) || res.data.data.images[0];
        if (primary) {
          setSelectedImage(primary.image_url);
          setSelectedVariation(primary.view_angle || '');
        }
        if (res.data.data.color) {
          setSelectedColor(res.data.data.color.split(',')[0].trim());
        }
        setLoading(false);
        api.post(`/catalog/${storeId}/${itemId}/view`).catch(() => {});
        if (user) {
          api.post('/recently-viewed', { type: 'catalog_item', id: res.data.data.id }).catch(() => {});
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [storeId, itemId, user]);


  useEffect(() => {
    const scrollEl = pageRef.current?.closest('.overflow-y-auto');
    if (!scrollEl) return;
    // 'scroll' can fire dozens of times per second — without throttling,
    // every single event was calling setHeaderOpacity (a re-render) even
    // though only one visual update per frame is ever visible.
    // requestAnimationFrame caps this to at most once per frame.
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setHeaderOpacity(Math.min(scrollEl.scrollTop / 180, 1));
        rafId = null;
      });
    };
    handleScroll();
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // "From the Same Shop" — same store, same garment_type. Deliberately
  // store-scoped (unlike moreLikeThis below) so this section never mixes
  // in a different shop's designs just because they share a garment_type.
  useEffect(() => {
    if (!item?.garment_type || !item?.store?.id) return;
    api.get('/public/catalog-items', { params: { garment_type: item.garment_type, store_id: item.store.id, per_page: 8 } })
      .then(res => setFromSameShop((res.data.data ?? []).filter((i: CatalogItemResult) => i.id !== item.id)))
      .catch(() => setFromSameShop([]));
  }, [item?.garment_type, item?.id, item?.store?.id]);

  // "More Like This" — broader, platform-wide by garment_type, deliberately
  // NOT store-scoped (that's what "From the Same Shop" above is for). This
  // is the cross-shop discovery rail, matching Shopee's own "You May Also
  // Like" — same reference item, distinct purpose.
  useEffect(() => {
    if (!item?.garment_type) return;
    api.get('/public/catalog-items', { params: { garment_type: item.garment_type, per_page: 12 } })
      .then(res => setMoreLikeThis((res.data.data ?? []).filter((i: CatalogItemResult) => i.id !== item.id)))
      .catch(() => setMoreLikeThis([]));
  }, [item?.garment_type, item?.id]);

  const handleBackClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/store/${storeId}?tab=catalog`);
    }
  };

  // Guest actions that require auth send the guest to /login with the
  // current item page as ?redirect= — without it, login always dropped
  // them at /account instead of back to what they were doing, which read
  // as broken/annoying since they never asked to go to their account.
  const currentItemPath = `/store/${storeId}/catalog/${itemId}`;

  const handleReportClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(currentItemPath)}`);
      return;
    }
    router.push(`/store/${storeId}/catalog/${itemId}/report`);
  };

  // Standard Bulk — reuses the existing customerBulkOrder() contract exactly
  // (catalog_item_id, organization_name, store_branch_id, roster[]{name,size}).
  // No additional fields invented. See docs/PAYMENT-WORKFLOW.md §4.4,
  // docs/CUSTOMER-JOURNEY-TARGET.md §11 — Custom Bulk's extra requirements
  // are explicitly not assumed here.
  const [showBulkSheet, setShowBulkSheet] = useState(false);
  const [bulkOrganizationName, setBulkOrganizationName] = useState('');
  const [bulkRoster, setBulkRoster] = useState<{ name: string; size: string }[]>([]);
  const [bulkBranchId, setBulkBranchId] = useState<number | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const isBulkItem = Boolean(item?.service?.service_types?.includes('bulk_sublimation'));
  const bulkMinQty = item?.service?.min_order_qty ?? 1;

  const openBulkSheet = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(currentItemPath)}`);
      return;
    }
    setBulkError('');
    setBulkOrganizationName('');
    setBulkRoster([{ name: '', size: '' }]);
    setBulkBranchId(null);
    setShowBulkSheet(true);
  };

  const handleBulkOrder = async () => {
    if (!item) return;
    const validRoster = bulkRoster.filter((r) => r.size);
    if (validRoster.length < bulkMinQty) {
      setBulkError(`This service requires a minimum of ${bulkMinQty} pieces.`);
      return;
    }
    setBulkSubmitting(true);
    setBulkError('');
    try {
      const res = await api.post(`/stores/${storeId}/bulk-orders`, {
        catalog_item_id: item.id,
        organization_name: bulkOrganizationName || undefined,
        store_branch_id: bulkBranchId || undefined,
        roster: validRoster,
      });
      setOrderSuccess({ order_number: res.data.data.order_number, id: res.data.data.id });
      setShowBulkSheet(false);
      setShowFind(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setBulkError(e.response?.data?.message || 'Something went wrong placing your bulk order. Please try again.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // showFind is set from multiple call sites (including outside this hook,
  // via the exposed setShowFind), so this can't be moved into an event
  // handler the way the two setShowFind(false) calls above were — it's a
  // genuine "respond to a state change with a timed side effect" case
  // (keep it interactive immediately on open, but linger interactive for
  // 320ms after close so an in-flight close animation isn't cut short).
  useEffect(() => {
    if (showFind) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFindInteractive(true);
      return;
    }
    const t = setTimeout(() => setFindInteractive(false), 320);
    return () => clearTimeout(t);
  }, [showFind]);

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
      const res = await api.post(`/stores/${storeId}/catalog/${itemId}/reviews`, { rating: myRating });
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

  const branches = item?.store?.branches ?? [];
  const findBranch = branches.find(b => b.latitude && b.longitude) ?? branches[0] ?? null;

  const mapBranches: MapBranch[] = branches
    .filter(b => b.latitude && b.longitude)
    .map(b => ({ id: b.id, name: b.name, slug: b.slug, latitude: Number(b.latitude), longitude: Number(b.longitude) }));
  const selectedFindBranch = mapBranches.find(b => b.id === findSheetBranchId) ?? null;

  const selectedDistanceKm = userPos && selectedFindBranch
    ? haversineKm(userPos.lat, userPos.lng, selectedFindBranch.latitude, selectedFindBranch.longitude)
    : null;
  const nearestBranch = userPos
    ? mapBranches.reduce<{ branch: MapBranch; km: number } | null>((best, b) => {
        const km = haversineKm(userPos.lat, userPos.lng, b.latitude, b.longitude);
        return !best || km < best.km ? { branch: b, km } : best;
      }, null)
    : null;
  const nearerBranchSuggestion = nearestBranch && selectedFindBranch && nearestBranch.branch.id !== selectedFindBranch.id
    ? nearestBranch
    : null;

  const isRealVariationLabel = Boolean(selectedVariation && selectedVariation !== 'Default' && selectedVariation.toLowerCase() !== 'front' && selectedVariation !== 'Fabric Swatch');
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

  const displayColor = (selectedColor && selectedColor.trim())
    ? selectedColor.trim()
    : ((item?.color && item.color.trim())
      ? item.color.trim()
      : (isRealVariationLabel ? selectedVariation : (selectedImage ? colorFromFilename(selectedImage) : '')));

  const buildBookHref = (branchSlug?: string | null) => {
    if (!item) return '#';
    return `/store/${storeId}/book?ref=${encodeURIComponent(item.name)}${selectedSize ? `&ref_size=${encodeURIComponent(selectedSize)}` : ''}${selectedImage ? `&ref_image=${encodeURIComponent(selectedImage)}` : ''}&ref_price=${encodeURIComponent(String(item.price))}${displayColor ? `&ref_color=${encodeURIComponent(displayColor)}` : ''}${item.service ? `&service_id=${item.service.id}` : ''}${branchSlug ? `&branch=${encodeURIComponent(branchSlug)}` : ''}`;
  };

  return {
    item,
    loading,
    selectedImage,
    setSelectedImage,
    selectedVariation,
    setSelectedVariation,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    orderSuccess,
    isBulkItem,
    bulkMinQty,
    showBulkSheet,
    setShowBulkSheet,
    openBulkSheet,
    bulkOrganizationName,
    setBulkOrganizationName,
    bulkRoster,
    setBulkRoster,
    bulkBranchId,
    setBulkBranchId,
    bulkSubmitting,
    bulkError,
    handleBulkOrder,
    myRating,
    setMyRating,
    hoverRating,
    setHoverRating,
    submittingReview,
    reviewMessage,
    handleSubmitReview,
    headerOpacity,
    fromSameShop,
    moreLikeThis,
    showFind,
    setShowFind,
    findInteractive,
    findSheetBranchId,
    setFindSheetBranchId,
    showBookConfirm,
    setShowBookConfirm,
    showBranchPickModal,
    setShowBranchPickModal,
    userPos,
    locating,
    locateError,
    handleLocate,
    pageRef,
    gate,
    handleBackClick,
    handleReportClick,
    branches,
    findBranch,
    mapBranches,
    selectedFindBranch,
    selectedDistanceKm,
    nearestBranch,
    nearerBranchSuggestion,
    buildBookHref,
    displayColor,
  };
}
