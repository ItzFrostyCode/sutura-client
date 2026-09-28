'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ChevronRight, HelpCircle, Home, Image as ImageIcon, Loader2, MoreHorizontal, Package, Share2, Star } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { PublicServicePackage, StoreProfile } from '@/components/store-storefront/types';

export default function StorePackageDetailPage({
  params,
}: Readonly<{ params: Promise<{ store_id: string; package_id: string }> }>) {
  const { store_id: storeId, package_id: packageId } = use(params);
  const toast = useToast();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [servicePackage, setServicePackage] = useState<PublicServicePackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {
        // User cancelled the native share sheet.
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

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get(`/public/stores/${storeId}`),
      api.get(`/public/stores/${storeId}/service-packages`),
    ])
      .then(([storeResponse, packagesResponse]) => {
        if (cancelled) return;
        const packages: PublicServicePackage[] = packagesResponse.data.data ?? [];
        setStore(storeResponse.data.data);
        setServicePackage(packages.find((item) => item.id === Number(packageId)) ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setStore(null);
        setServicePackage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeId, packageId]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas">
        <Loader2 size={28} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!store || !servicePackage) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
        <Package size={28} className="text-ink-faint" />
        <p className="text-ink-muted">Package not found.</p>
        <Link href={`/store/${storeId}?tab=services`} className="text-sm font-semibold text-taupe hover:text-taupe-dark">
          Back to services
        </Link>
      </div>
    );
  }

  const totalServicePrice = servicePackage.services.reduce(
    (sum, service) => sum + (Number(service.base_price) || 0),
    0,
  );
  const displayPrice = servicePackage.bundle_price !== null
    ? Number(servicePackage.bundle_price)
    : totalServicePrice;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link
            href={`/store/${storeId}?tab=services`}
            aria-label="Back to store services"
            className="flex h-10 w-10 items-center justify-center text-ink hover:bg-canvas"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share this package"
              title="Share"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas"
            >
              <Share2 size={18} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="More options"
              title="More options"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas"
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
                <div className="absolute right-0 top-full z-50 mt-1 w-52 border border-line bg-surface py-1 shadow-lg">
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body transition-colors hover:bg-canvas"
                  >
                    <Home size={15} className="shrink-0 text-ink-faint" /> Back to Homepage
                  </Link>
                  <Link
                    href="/account/settings/support"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-body transition-colors hover:bg-canvas"
                  >
                    <HelpCircle size={15} className="shrink-0 text-ink-faint" /> Need help?
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-0 min-[375px]:px-6 min-[600px]:px-[10px] md:px-8 py-4 min-[600px]:py-8">
        <div className="grid min-[600px]:grid-cols-12 min-[600px]:gap-8 min-[600px]:items-start">
          <div className="min-[600px]:col-span-7">
            <div className="aspect-square min-[600px]:aspect-[4/3] min-[600px]:border min-[600px]:border-line bg-sunken flex flex-col items-center justify-center gap-2 text-ink-faint">
              <ImageIcon size={40} className="opacity-30" />
              <span className="text-sm font-medium">No Image Available</span>
            </div>
          </div>

          <section className="min-[600px]:col-span-5 px-4 min-[600px]:px-0 py-5 min-[600px]:py-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-taupe">Service package</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-serif font-bold leading-tight">{servicePackage.name}</h1>
            <p className="mt-3 text-2xl font-bold text-ink">
              ₱{displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <span className="ml-1.5 text-xs font-medium text-ink-muted">estimated starting price</span>
            </p>
            <p className="text-xs text-ink-muted">Final price may vary based on job-order details.</p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Star size={15} className="text-amber-500" fill="currentColor" />
                <span className="font-semibold text-ink">
                  {servicePackage.reviews_count ? Number(servicePackage.reviews_avg_rating ?? 0).toFixed(1) : 'No ratings yet'}
                </span>
                {servicePackage.reviews_count ? (
                  <span className="text-xs text-ink-faint">
                    ({servicePackage.reviews_count} rating{servicePackage.reviews_count === 1 ? '' : 's'})
                  </span>
                ) : null}
              </div>
              <Link
                href={`/store/${storeId}/package/${servicePackage.id}/ratings`}
                className="text-xs font-semibold text-taupe hover:text-taupe-dark"
              >
                View &amp; rate this package
              </Link>
            </div>

            {servicePackage.description && (
              <div className="mt-6 border-t border-line pt-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-ink">Description</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-body whitespace-pre-wrap">
                  {servicePackage.description}
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-line pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-ink">
                Included services ({servicePackage.services.length})
              </h2>
              <ul className="mt-2 divide-y divide-line">
                {servicePackage.services.map((service) => (
                  <li key={service.id}>
                    <Link
                      href={`/store/${storeId}/service/${service.id}`}
                      className="flex min-h-14 items-center justify-between gap-3 py-2 text-sm hover:text-taupe"
                    >
                      <span className="min-w-0 truncate">{service.name}</span>
                      <span className="shrink-0 text-ink-muted">
                        {service.base_price !== null && `₱${Number(service.base_price).toLocaleString()}`}
                        <ChevronRight size={15} className="ml-2 inline-block" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={`/store/${storeId}/book?package_id=${servicePackage.id}`}
              className="mt-7 flex h-13 w-full items-center justify-center gap-2 bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-taupe"
            >
              <CalendarDays size={17} /> Book this package
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}