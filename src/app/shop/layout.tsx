'use client';

import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/context/ToastContext';

// Each page under /shop/[shop_id] (profile, catalog, book, item detail) already
// renders its own working navigation tailored to that shop and page — a shared
// nav here would either duplicate it or (as it did before) point nowhere, since
// this layout has no access to which shop is even being viewed.
export default function PublicShopLayout({ children }: { readonly children: React.ReactNode }) {
  // The catalog item detail page replaces this generic tagline with its own
  // "More Like This" section (real same-category items, not a static line)
  // — it has the item's garment_type to search by, which this layout doesn't.
  const pathname = usePathname();
  const isCatalogItemDetail = (pathname?.includes('/portfolio/') || pathname?.includes('/catalog/')) ?? false;
  const isBookingFlow = pathname?.endsWith('/book') ?? false;
  const hideFooter = isCatalogItemDetail || isBookingFlow;

  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-200">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        {!hideFooter && (
          <footer className="bg-zinc-50 border-t border-zinc-200 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#A8A19A]">
              Powered by SUTURA. All garments are crafted with precision.
            </div>
          </footer>
        )}
      </div>
    </ToastProvider>
  );
}
