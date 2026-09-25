'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// The catalog listing used to be its own page with its own header/hero,
// separate from the unified storefront page — now it's just the "Catalog"
// tab there, so this route forwards to it instead of duplicating the UI.
export default function PublicCatalogRedirect({ params }: Readonly<{ params: Promise<{ store_id: string }> }>) {
  const { store_id: storeId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/store/${storeId}?tab=catalog`);
  }, [storeId, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-ink-faint" />
    </div>
  );
}
