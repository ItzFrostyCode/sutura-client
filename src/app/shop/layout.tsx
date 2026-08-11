import { ToastProvider } from '@/context/ToastContext';

// Each page under /shop/[shop_id] (profile, catalog, book, item detail) already
// renders its own working navigation tailored to that shop and page — a shared
// nav here would either duplicate it or (as it did before) point nowhere, since
// this layout has no access to which shop is even being viewed.
export default function PublicShopLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-200">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="bg-zinc-50 border-t border-zinc-200 py-6 mt-8">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#A8A19A]">
            Powered by SUTURA. All garments are crafted with precision.
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
