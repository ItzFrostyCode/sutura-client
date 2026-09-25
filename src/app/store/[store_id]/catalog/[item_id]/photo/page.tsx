'use client';

import { Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

// Full-screen photo viewer — a real "next page", not a modal. Deliberately
// object-contain, never object-cover: the photo keeps its own natural
// aspect ratio and is scaled down only if it wouldn't otherwise fit the
// device, with the leftover space (top/bottom or left/right, whichever
// dimension has slack) letterboxed in black rather than cropping anything
// out of the store owner's actual photo.
export default function CatalogPhotoViewerPage({ params }: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-black" />}>
      <CatalogPhotoViewerContent params={params} />
    </Suspense>
  );
}

function CatalogPhotoViewerContent({ params }: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  const { store_id: storeId, item_id: itemId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const src = searchParams.get('src');

  return (
    <div className="min-h-dvh flex flex-col bg-black">
      <button
        type="button"
        onClick={() => router.push(`/store/${storeId}/catalog/${itemId}`)}
        aria-label="Back"
        className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="flex-1 relative">
        {src ? (
          <Image
            src={getMediaUrl(src)}
            alt=""
            fill
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">No image</div>
        )}
      </div>
    </div>
  );
}
