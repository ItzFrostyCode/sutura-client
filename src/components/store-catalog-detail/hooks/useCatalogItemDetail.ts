import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { getItemColorOptions, isAngleLabel } from '@/lib/fabricHelper';
import { categoryOfGarment } from '@/lib/garmentTaxonomy';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { CatalogItem, CatalogItemImage } from '../types';

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
  const [isSaved, setIsSaved] = useState(false);
  const [togglingSave, setTogglingSave] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [fromSameShop, setFromSameShop] = useState<CatalogItemResult[]>([]);
  const [moreLikeThis, setMoreLikeThis] = useState<CatalogItemResult[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated } = useAuthStore();
  const gate = useGuestGatedHref();

  useEffect(() => {
    api.get(`/catalog/${storeId}/${itemId}`)
      .then(res => {
        setItem(res.data.data);

        // Whichever color renders as swatch #1 and whichever photo renders
        // as bottom-thumbnail #1 must be what's already showing as the main
        // image/selected color on load — deriving both from the exact same
        // lists the UI renders (instead of independently picking off
        // is_primary / the raw color string) guarantees "thumb #1 in the
        // bottom row = main image" and "swatch #1 = default color" can never
        // drift apart from what CatalogHeroGallery/CatalogColorSelector
        // actually display.
        const colorOpts = getItemColorOptions(res.data.data);
        const hasRealColors = colorOpts.length > 1;
        if (hasRealColors) {
          setSelectedColor(colorOpts[0].name);
        }

        const angleImages = hasRealColors
          ? res.data.data.images.filter((img: CatalogItemImage) => isAngleLabel(img.view_angle))
          : res.data.data.images;
        const primary = angleImages.find((i: CatalogItemImage) => i.is_primary)
          || angleImages[0]
          || res.data.data.images[0];
        if (primary) {
          setSelectedImage(primary.image_url);
          setSelectedVariation(primary.view_angle || '');
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
    if (!user || !item) return;
    api.get(`/stores/${storeId}/catalog/${item.id}/my-save`)
      .then((res) => {
        if (res.data?.success) setIsSaved(!!res.data.is_saved);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, storeId, item?.id]);

  const handleToggleSave = async () => {
    if (!isAuthenticated || !user) {
      setReviewMessage({ type: 'error', text: 'Please log in to save this item.' });
      return;
    }
    if (!item || togglingSave) return;
    setTogglingSave(true);
    try {
      const res = await api.post(`/stores/${storeId}/catalog/${item.id}/save`);
      setIsSaved(res.data.status === 'saved');
      setItem((prev) => (prev ? { ...prev, saves_count: res.data.saves_count } : prev));
    } catch {
      // Non-critical UI toggle — silently no-op, matches the low-stakes
      // nature of a save/heart action elsewhere in this codebase.
    } finally {
      setTogglingSave(false);
    }
  };


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

  // Related designs follow the garment category (Barong, Dresses & Gowns, …): everything in the same category
  // counts, with the exact same garment listed first. A typed-in garment name (no category) matches by itself.
  const category = categoryOfGarment(item?.garment_type);
  const relatedParams = category && category !== 'other'
    ? { garment_category: category }
    : item?.garment_type ? { garment_type: item.garment_type } : null;
  const relatedKey = JSON.stringify(relatedParams);
  const sameTypeFirst = (list: CatalogItemResult[]) =>
    [...list]
      .filter(i => i.id !== item?.id)
      .sort((a, b) => Number(b.garment_type === item?.garment_type) - Number(a.garment_type === item?.garment_type));

  // "From the Same Shop" — deliberately store-scoped so it never mixes in
  // another shop's designs.
  useEffect(() => {
    if (!relatedParams || !item?.store?.id) return;
    api.get('/public/catalog-items', { params: { ...relatedParams, store_id: item.store.id, per_page: 12 } })
      .then(res => setFromSameShop(sameTypeFirst(res.data.data ?? [])))
      .catch(() => setFromSameShop([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relatedKey, item?.id, item?.store?.id]);

  // "More Like This" — platform-wide, deliberately NOT store-scoped (that is
  // what "From the Same Shop" above is for): the cross-shop discovery rail.
  useEffect(() => {
    if (!relatedParams) return;
    api.get('/public/catalog-items', { params: { ...relatedParams, per_page: 18 } })
      .then(res => setMoreLikeThis(sameTypeFirst(res.data.data ?? [])))
      .catch(() => setMoreLikeThis([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relatedKey, item?.id]);

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

  // A single-entry result just means "no real color variants" (the helper
  // falls back to the item's own color/"Default" so the selector always has
  // something to key off of) — only show the Color row when there's an
  // actual choice to make.
  const allColorOptions = item ? getItemColorOptions(item) : [];
  const colorOptions = allColorOptions.length > 1 ? allColorOptions : [];

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

  // The design's worked price (its service's price, plus any extra charge) — never its old stored price.
  // A design that needs a quote sends none, so the booking shows no price for it.
  const refPriceParam = (it: CatalogItem) => {
    const amount = it.pricing ? it.pricing.amount : Number(it.price) || null;
    return amount ? `&ref_price=${encodeURIComponent(String(amount))}` : '';
  };

  const buildBookHref = (branchSlug?: string | null) => {
    if (!item) return '#';
    return `/store/${storeId}/book?ref=${encodeURIComponent(item.name)}&ref_item_id=${item.id}${selectedSize ? `&ref_size=${encodeURIComponent(selectedSize)}` : ''}${selectedImage ? `&ref_image=${encodeURIComponent(selectedImage)}` : ''}${refPriceParam(item)}${displayColor ? `&ref_color=${encodeURIComponent(displayColor)}` : ''}${item.service ? `&service_id=${item.service.id}` : ''}${branchSlug ? `&branch=${encodeURIComponent(branchSlug)}` : ''}`;
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
    colorOptions,
    selectedSize,
    setSelectedSize,
    orderSuccess,
    isSaved,
    togglingSave,
    handleToggleSave,
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
    pageRef,
    gate,
    handleBackClick,
    handleReportClick,
    buildBookHref,
    displayColor,
  };
}
