'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2, MoreHorizontal, Home, HelpCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { PublicService, StoreProfile } from '@/components/store-storefront/types';
import { getSocialUrl, getMessengerUrl } from '@/components/store-storefront/storeStorefrontHelpers';
import ServiceRatingsSection from '@/components/store-service-detail/ServiceRatingsSection';
import ServiceProductInfo from '@/components/store-service-detail/ServiceProductInfo';
import ServiceHeroBar from '@/components/store-service-detail/ServiceHeroBar';
import { ServiceInlineActions, ServiceBottomBar } from '@/components/store-service-detail/ServiceActionButtons';
import CatalogDetailGrid from '@/components/store-catalog-detail/CatalogDetailGrid';
import ServiceAccordionSections from '@/components/store-service-detail/ServiceAccordionSections';
import ServiceStoreProfileCard from '@/components/store-service-detail/ServiceStoreProfileCard';
import ServiceRecommendationsSection from '@/components/store-service-detail/ServiceRecommendationsSection';
import ServiceDetailBreadcrumb from '@/components/store-service-detail/ServiceDetailBreadcrumb';
import type { SearchServiceResult } from '@/components/search/types';

// Dedicated page for a single service — was an in-place swap inside the
// Store Profile's Service tab (the old ServiceDetailView.tsx component,
// now deleted, is fully replaced by this page); rebuilt with the same
// responsive image-left/detail-right layout system as the Catalog Item
// Detail page (same 600px breakpoint tiers, same flat-design rules)
// instead of the old single-column rounded-corner card.
export default function ServiceDetailPage({
  params,
}: Readonly<{ params: Promise<{ store_id: string; service_id: string }> }>) {
  const { store_id: storeId, service_id: serviceId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { user, store: authStore } = useAuthStore();
  const gate = useGuestGatedHref();

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [service, setService] = useState<PublicService | null>(null);
  const [fromSameShop, setFromSameShop] = useState<SearchServiceResult[]>([]);
  const [moreLikeThis, setMoreLikeThis] = useState<SearchServiceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerOpacity, setHeaderOpacity] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [savesCount, setSavesCount] = useState(0);
  const [togglingSave, setTogglingSave] = useState(false);

  useEffect(() => {
    // No single-service-by-id public endpoint exists yet — fetching the
    // store's whole service list and finding by id matches the same
    // pattern useStoreStorefront.ts already uses for this same data.
    Promise.all([
      api.get(`/public/stores/${storeId}`),
      api.get(`/public/stores/${storeId}/services`),
    ])
      .then(([storeRes, servicesRes]) => {
        setStore(storeRes.data.data);
        const list: PublicService[] = servicesRes.data.data ?? [];
        const found = list.find((s) => s.id === Number(serviceId)) ?? null;
        setService(found);
        setSavesCount(found?.saves_count ?? 0);
        // "From the Same Shop" reuses this same store-scoped fetch rather
        // than firing a second request — the store's own service list is
        // already everything that section needs to show, just minus the
        // service currently being viewed.
        setFromSameShop((list as unknown as SearchServiceResult[]).filter((s) => s.id !== Number(serviceId)));
      })
      .catch(() => {
        setStore(null);
        setService(null);
      })
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

  // "More Like This" — cross-shop, platform-wide by service_category, the
  // same shape as useCatalogItemDetail.ts's own moreLikeThis effect (More
  // Like This is deliberately NOT store-scoped, unlike From the Same Shop).
  useEffect(() => {
    if (!service?.service_category) return;
    api.get('/public/services', { params: { service_category: service.service_category, per_page: 12 } })
      .then((res) => setMoreLikeThis((res.data.data ?? []).filter((s: SearchServiceResult) => s.id !== service.id)))
      .catch(() => setMoreLikeThis([]));
  }, [service?.service_category, service?.id]);

  useEffect(() => {
    if (!user || !store?.slug || !service) return;
    api.get(`/stores/${store.slug}/services/${service.id}/my-review`)
      .then((res) => {
        if (res.data?.success && res.data.data) setMyRating(res.data.data.rating);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, store?.slug, service?.id]);

  useEffect(() => {
    if (!user || !store?.slug || !service) return;
    api.get(`/stores/${store.slug}/services/${service.id}/my-save`)
      .then((res) => {
        if (res.data?.success) {
          setIsSaved(!!res.data.is_saved);
          setSavesCount(res.data.saves_count ?? 0);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, store?.slug, service?.id]);

  const handleToggleSave = async () => {
    if (!user) {
      toast.error('Please log in to save this service.');
      return;
    }
    if (!store?.slug || !service || togglingSave) return;
    setTogglingSave(true);
    try {
      const res = await api.post(`/stores/${store.slug}/services/${service.id}/save`);
      setIsSaved(res.data.status === 'saved');
      setSavesCount(res.data.saves_count ?? 0);
    } catch {
      toast.error('Failed to update saved status.');
    } finally {
      setTogglingSave(false);
    }
  };

  useEffect(() => {
    // 'scroll' can fire dozens of times per second — without throttling,
    // every event was calling setHeaderOpacity (a re-render) even though
    // only one visual update per frame is ever visible. requestAnimationFrame
    // caps this to at most once per frame.
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setHeaderOpacity(Math.min(window.scrollY / 180, 1));
        rafId = null;
      });
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const isOwnerViewingOwnStore = !!authStore && authStore.slug === storeId && user?.roles?.[0]?.name === 'store_owner';

  // Real history-back when there's actual history to go back to (matches
  // useCatalogItemDetail.ts's handleBackClick) — a plain unconditional
  // router.push() here was pushing a *new* Profile entry on top of Search
  // instead of reusing/popping the existing one, so the stack became
  // [Search, ServiceDetail, Profile]. Profile's own back button is real
  // browser history (router.back(), see StoreHeroHeader.tsx) — it would
  // then pop back into ServiceDetail instead of Search, forcing the
  // customer to hit back twice no matter which shop they were on. Only
  // fall back to a hardcoded destination when there's truly no history to
  // go back to (a direct link, recently-viewed on a fresh tab, etc.).
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/store/${storeId}?tab=services`);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard.');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  const handleDelete = async () => {
    if (!service || !store?.slug) return;
    if (!window.confirm(`Delete "${service.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/stores/${store.slug}/services/${service.id}`);
      toast.success('Service deleted.');
      router.push(`/store/${storeId}?tab=services`);
    } catch {
      toast.error('Failed to delete service.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewMessage({ type: 'error', text: 'Please log in to rate this service.' });
      return;
    }
    if (!store?.slug || !service) return;
    setSubmittingReview(true);
    setReviewMessage(null);
    try {
      const res = await api.post(`/stores/${store.slug}/services/${service.id}/reviews`, { rating: myRating });
      setReviewMessage({ type: 'success', text: 'Thanks for your rating!' });
      setService((prev) => (prev ? {
        ...prev,
        reviews_count: res.data.reviews_count,
        reviews_avg_rating: res.data.reviews_avg_rating,
        reviews: res.data.review
          ? [
              { ...res.data.review, user: { id: user.id, name: user.name, profile_picture: null } },
              ...(prev.reviews || []).filter((r) => r.id !== res.data.review.id),
            ]
          : (prev.reviews || []).filter((r) => r.user?.id !== user.id),
      } : prev));
    } catch {
      setReviewMessage({ type: 'error', text: 'Failed to submit your rating. Please try again.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const iconButtonClass = headerOpacity > 0.5
    ? 'w-10 h-10 rounded-full flex items-center justify-center text-ink transition-colors touch-manipulation'
    : 'w-10 h-10 rounded-full bg-ink/70 backdrop-blur-sm text-white flex items-center justify-center transition-colors touch-manipulation';

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas">
        <Loader2 size={28} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!service || !store) {
    return (
      <div className="min-h-full flex items-center justify-center bg-canvas">
        <div className="text-center text-ink-faint">Service not found.</div>
      </div>
    );
  }

  const facebookUrl = getSocialUrl(store.social_links, 'facebook');
  const bookHref = `/store/${storeId}/book?service_id=${service.id}&service_name=${encodeURIComponent(service.name)}`;
  const messageHref = facebookUrl ? getMessengerUrl(facebookUrl) : null;

  return (
    <div className="min-h-full flex flex-col bg-canvas">
      {/* Desktop/tablet: normal in-flow sticky bar — mirrors
          CatalogDesktopHeader.tsx exactly (same 600px switch as the
          catalog item detail page). */}
      <div className="hidden min-[600px]:block">
        <header className="sticky top-0 z-50 w-full bg-surface border-b border-line">
          <div className="max-w-7xl mx-auto px-4 min-[600px]:px-[10px] md:px-8 h-14 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-1 relative">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this service"
                className="w-9 h-9 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors"
              >
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More options"
                title="More options"
                className="w-9 h-9 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-line shadow-lg z-50 py-1">
                    {isOwnerViewingOwnStore && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            router.push(`/store/${storeId}?tab=services&edit_service=${service.id}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors text-left"
                        >
                          <Pencil size={15} className="text-ink-faint shrink-0" /> Edit service
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            void handleDelete();
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger hover:bg-canvas transition-colors text-left"
                        >
                          <Trash2 size={15} className="shrink-0" /> Delete service
                        </button>
                      </>
                    )}
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors"
                    >
                      <Home size={15} className="text-ink-faint shrink-0" /> Back to Homepage
                    </Link>
                    <Link
                      href="/account/settings/support"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors"
                    >
                      <HelpCircle size={15} className="text-ink-faint shrink-0" /> Need help?
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Mobile: fixed (not sticky) floating over the full-bleed hero image —
          mirrors CatalogDetailHeader.tsx. Floating back & action buttons with
          subtle edge insets over the true edge-to-edge image. */}
      <div className="min-[600px]:hidden">
        <div
          className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-3 sm:px-4"
          style={{
            backgroundColor: `rgba(255,255,255,${headerOpacity})`,
            borderBottom: headerOpacity > 0.6 ? '1px solid var(--brand-border)' : 'none',
          }}
        >
          <button type="button" onClick={handleBack} aria-label="Back" className={iconButtonClass}>
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-1.5 relative">
            <button type="button" onClick={handleShare} aria-label="Share this service" className={iconButtonClass}>
              <Share2 size={19} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              className={iconButtonClass}
            >
              <MoreHorizontal size={20} />
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-line shadow-lg z-50 py-1">
                  {isOwnerViewingOwnStore && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(`/store/${storeId}?tab=services&edit_service=${service.id}`);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors text-left"
                      >
                        <Pencil size={15} className="text-ink-faint shrink-0" /> Edit service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          void handleDelete();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger hover:bg-canvas transition-colors text-left"
                      >
                        <Trash2 size={15} className="shrink-0" /> Delete service
                      </button>
                    </>
                  )}
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors"
                  >
                    <Home size={15} className="text-ink-faint shrink-0" /> Back to Homepage
                  </Link>
                  <Link
                    href="/account/settings/support"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body hover:bg-canvas transition-colors"
                  >
                    <HelpCircle size={15} className="text-ink-faint shrink-0" /> Need help?
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main layout: on mobile (<600px), px-0 py-0 ensures the hero image
          is exact full width with zero left/right margin. On tablet/desktop
          (600px+), container insets, border, and 2-column grid take over. */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-0 min-[600px]:px-[10px] md:px-8 py-0 min-[600px]:py-[10px] md:py-6 pb-24 min-[600px]:pb-10">
        {/* Breadcrumb — tablet/desktop only, matches CatalogDetailBreadcrumb's placement */}
        <div className="hidden min-[600px]:block">
          <ServiceDetailBreadcrumb service={service} />
        </div>

        <CatalogDetailGrid
          gallery={
            <>
              {/* Image — 100% full width edge-to-edge on mobile */}
              <div className="relative w-full">
                {service.image_url ? (
                  <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken overflow-hidden relative w-full border-b border-line min-[600px]:border min-[600px]:border-line">
                    <Image
                      src={getMediaUrl(service.image_url)}
                      alt={service.name}
                      className="w-full h-full object-cover object-top min-[600px]:object-center md:object-contain transition-all duration-300"
                      fill
                      priority
                      sizes="(max-width: 600px) 100vw, (max-width: 1024px) 60vw, 55vw"
                    />
                  </div>
                ) : (
                  <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken flex items-center justify-center text-ink-faint border-b border-line min-[600px]:border min-[600px]:border-line">
                    No Image
                  </div>
                )}
              </div>
              <ServiceHeroBar
                savesCount={savesCount}
                isSaved={isSaved}
                togglingSave={togglingSave}
                onToggleSave={handleToggleSave}
                myRating={myRating}
                setMyRating={setMyRating}
                hoverRating={hoverRating}
                setHoverRating={setHoverRating}
                onSubmitRating={handleSubmitReview}
                submittingReview={submittingReview}
                canRate={!isOwnerViewingOwnStore}
              />
              {reviewMessage && (
                <p className={`mt-2 px-4 min-[375px]:px-6 min-[600px]:px-0 text-xs ${reviewMessage.type === 'success' ? 'text-sage' : 'text-danger'}`}>
                  {reviewMessage.text}
                </p>
              )}
            </>
          }
          buyZone={
            <div className="px-4 min-[375px]:px-6 min-[600px]:px-0">
              <ServiceProductInfo service={service} />
              <ServiceInlineActions bookHref={bookHref} messageHref={messageHref} />
            </div>
          }
        />

        {/* Specification · Description — same numbered-card system as the
            Catalog Item Detail page's Size Guide/Specification/Description. */}
        <div className="mt-6 px-4 min-[375px]:px-6 min-[600px]:px-0">
          <ServiceAccordionSections service={service} />
        </div>

        {/* Ratings — below the specification, like the Catalog Design page */}
        <div className="mt-4 px-4 min-[375px]:px-6 min-[600px]:px-0">
          <ServiceRatingsSection service={service} />
        </div>

        {/* Shop card */}
        <div className="mt-4 px-4 min-[375px]:px-6 min-[600px]:px-0">
          <ServiceStoreProfileCard store={store} gate={gate} />
        </div>

        {/* From the Same Shop + You May Also Like */}
        <div className="mt-6 px-4 min-[375px]:px-6 min-[600px]:px-0 space-y-4">
          <ServiceRecommendationsSection
            fromSameShop={fromSameShop}
            moreLikeThis={moreLikeThis}
            storeId={storeId}
            gate={gate}
          />
        </div>
      </main>

      <ServiceBottomBar bookHref={bookHref} messageHref={messageHref} storeHref={`/store/${storeId}`} />
    </div>
  );
}
