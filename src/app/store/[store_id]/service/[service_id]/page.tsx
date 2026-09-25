'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2, MoreHorizontal, Home, HelpCircle, Pencil, Trash2, Clock, MessageCircle, Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { getActiveSale } from '@/lib/salePricing';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { PublicService, StoreProfile } from '@/components/store-storefront/types';
import { getSocialUrl, getMessengerUrl } from '@/components/store-storefront/storeStorefrontHelpers';

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

  const [store, setStore] = useState<StoreProfile | null>(null);
  const [service, setService] = useState<PublicService | null>(null);
  const [loading, setLoading] = useState(true);
  const [headerOpacity, setHeaderOpacity] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        setService(list.find((s) => s.id === Number(serviceId)) ?? null);
      })
      .catch(() => {
        setStore(null);
        setService(null);
      })
      .finally(() => setLoading(false));
  }, [storeId, serviceId]);

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

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/store/${storeId}?tab=services`);
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
      await api.post(`/stores/${store.slug}/services/${service.id}/reviews`, { rating: myRating });
      setReviewMessage({ type: 'success', text: 'Thanks for your rating!' });
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

  const activeSale = service.base_price
    ? getActiveSale({
        price: service.base_price,
        sale_price: service.sale_price,
        sale_starts_at: service.sale_starts_at,
        sale_ends_at: service.sale_ends_at,
      })
    : null;

  const priceDisplay = activeSale ? (
    <span className="flex items-center gap-1.5">
      <span className="line-through text-ink-faint font-normal text-sm">₱{activeSale.original.toLocaleString()}</span>
      <span className="text-rose-600">₱{activeSale.sale.toLocaleString()}</span>
    </span>
  ) : service.base_price !== null && service.base_price !== undefined ? (
    `₱${Number.parseFloat(service.base_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  ) : (
    'Custom Quote'
  );

  const facebookUrl = getSocialUrl(store.social_links, 'facebook');

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
              {isOwnerViewingOwnStore && (
                <>
                  <button
                    type="button"
                    onClick={() => router.push(`/store/${storeId}?tab=services&edit_service=${service.id}`)}
                    aria-label="Edit service"
                    className="w-9 h-9 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    aria-label="Delete service"
                    className="w-9 h-9 flex items-center justify-center text-danger hover:bg-canvas rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}

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
          mirrors CatalogDetailHeader.tsx. A sticky+negative-margin version
          of this was tried there and found broken (collapses its
          shrink-wrapped parent to ~0px, leaving sticky nothing to stick
          within), so this goes straight to `fixed` instead of repeating
          that mistake. */}
      <div className="min-[600px]:hidden">
        <div
          className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-0 min-[375px]:px-6"
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
            {isOwnerViewingOwnStore && (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/store/${storeId}?tab=services&edit_service=${service.id}`)}
                  aria-label="Edit service"
                  className={iconButtonClass}
                >
                  <Pencil size={17} />
                </button>
                <button type="button" onClick={handleDelete} aria-label="Delete service" className={iconButtonClass}>
                  <Trash2 size={17} />
                </button>
              </>
            )}

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

      {/* px-0/375/600/md tiers, same unified margin system as the catalog
          item detail page's <main> — every section inherits this same
          inset directly instead of each hand-tuning its own margin. */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-0 min-[375px]:px-6 min-[600px]:px-[10px] md:px-8 py-4 min-[600px]:py-[10px] md:py-6 pb-10">
        <div className="min-[600px]:grid min-[600px]:grid-cols-12 min-[600px]:gap-2.5 md:gap-10 min-[600px]:items-start">
          {/* Image Column */}
          <div className="min-[600px]:col-span-7">
            <div className="relative -mt-4 min-[600px]:mt-0">
              {service.image_url ? (
                <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken overflow-hidden relative w-full min-[600px]:border min-[600px]:border-line">
                  <Image
                    src={getMediaUrl(service.image_url)}
                    alt={service.name}
                    className="w-full h-full object-cover object-top min-[600px]:object-center md:object-contain transition-all duration-300"
                    fill
                  />
                </div>
              ) : (
                <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken flex items-center justify-center text-ink-faint min-[600px]:border min-[600px]:border-line">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Info Column */}
          <div className="min-[600px]:col-span-5 space-y-3 mt-4 min-[600px]:mt-0">
            <div className="space-y-2">
              <p className="text-lg font-bold text-ink">{priceDisplay}</p>
              <h1 className="text-base font-serif font-semibold text-ink">{service.name}</h1>
              <div className="flex items-center gap-2.5 text-sm flex-wrap">
                {service.estimated_days ? (
                  <span className="flex items-center gap-1 text-ink-muted text-xs">
                    <Clock size={12} /> {service.estimated_days}d
                  </span>
                ) : null}
                {service.reviews_avg_rating && Number(service.reviews_avg_rating) > 0 ? (
                  <span className="flex items-center gap-1 text-ink-muted text-xs">
                    <Star size={12} className="fill-amber-400 text-amber-500" />
                    <span className="font-semibold text-ink">{Number(service.reviews_avg_rating).toFixed(1)}</span>
                    {(service.reviews_count ?? 0) > 0 && <span>({service.reviews_count})</span>}
                  </span>
                ) : null}
              </div>
            </div>

            {service.description && (
              <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap">{service.description}</p>
            )}

            {service.size_chart_image_url && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">Size Chart</h4>
                <div className="relative w-full h-[200px] border border-line bg-canvas overflow-hidden">
                  <Image src={service.size_chart_image_url} alt="Size chart" fill className="object-cover object-center" />
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link
                href={`/store/${storeId}/book?service_id=${service.id}`}
                className="w-full h-[52px] rounded-none flex items-center justify-center bg-ink hover:bg-taupe text-white text-base font-semibold transition-colors"
              >
                Book Appointment →
              </Link>

              {facebookUrl && (
                <a
                  href={getMessengerUrl(facebookUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[52px] rounded-none flex items-center justify-center gap-2 border border-line hover:bg-sunken text-ink text-base font-medium transition-colors"
                >
                  <MessageCircle size={18} /> Inquire on Facebook
                </a>
              )}
            </div>

            {!isOwnerViewingOwnStore && (
              <form onSubmit={handleSubmitReview} className="bg-surface border border-line rounded-none p-3 mt-3">
                <h3 className="text-xs font-semibold text-ink-muted mb-2">Rate this Service</h3>
                <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMyRating((prev) => (prev === n ? 0 : n))}
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
                    className="ml-auto px-3 py-1.5 bg-ink hover:bg-taupe text-white text-xs font-semibold rounded-none transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
                {reviewMessage && (
                  <div className={`flex items-center gap-2 mt-2 text-xs px-3 py-2 rounded-none ${reviewMessage.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/10 text-danger'}`}>
                    {reviewMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {reviewMessage.text}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
