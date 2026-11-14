'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';

/**
 * A photo at full size over the page: Close (or Esc, or a tap outside the photo), and Previous / Next (or the arrow
 * keys) when there is more than one. The page behind does not scroll while it is open.
 */
export default function OrderPhotoViewer({ photos, index, alt, onIndex, onClose }: Readonly<{
  photos: string[]; index: number; alt: string; onIndex: (i: number) => void; onClose: () => void;
}>) {
  const many = photos.length > 1;
  const go = (step: number) => onIndex((index + step + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (many && e.key === 'ArrowRight') onIndex((index + 1) % photos.length);
      if (many && e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [index, many, photos.length, onClose, onIndex]);

  const url = photos[index];
  if (!url) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`${alt} ${index + 1} of ${photos.length}`}
      className="fixed inset-0 z-[80] flex flex-col bg-black" onClick={onClose}>
      <div className="flex h-14 shrink-0 items-center justify-between px-2 text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <span className="px-3 text-sm tabular-nums text-white/80">{many ? `${index + 1} of ${photos.length}` : alt}</span>
        <button type="button" onClick={onClose} aria-label="Close full view" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
          <X size={22} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={getMediaUrl(url)} alt={`${alt} ${index + 1}`} onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full select-none object-contain" />
        {many && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <ChevronLeft size={24} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
