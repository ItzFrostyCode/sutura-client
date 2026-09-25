'use client';

import { ToastProvider } from '@/context/ToastContext';

// Each page under /store/[store_id] (profile, catalog, book, item detail) already
// renders its own working navigation tailored to that store and page — a shared
// nav here would either duplicate it or (as it did before) point nowhere, since
// this layout has no access to which store is even being viewed.
export default function PublicStoreLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-white text-zinc-900 font-sans selection:bg-zinc-200">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
