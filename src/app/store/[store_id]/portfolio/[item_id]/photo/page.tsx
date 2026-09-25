'use client';

import { Suspense, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyPortfolioPhotoRedirect({ params }: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>}>
      <LegacyPortfolioPhotoContent params={params} />
    </Suspense>
  );
}

function LegacyPortfolioPhotoContent({ params }: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  const { store_id: storeId, item_id: itemId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`/store/${storeId}/catalog/${itemId}/photo${qs ? `?${qs}` : ''}`);
  }, [storeId, itemId, router, searchParams]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
    </div>
  );
}
