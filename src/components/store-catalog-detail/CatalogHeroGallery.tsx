'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media';
import { resolveFabricImage } from '@/lib/fabricHelper';
import { CatalogItem } from './types';

interface CatalogHeroGalleryProps {
  item: CatalogItem;
  selectedImage: string;
  setSelectedImage: (img: string) => void;
  setSelectedVariation: (variation: string) => void;
  storeId: string;
  itemId: string;
}

export default function CatalogHeroGallery({
  item,
  selectedImage,
  setSelectedImage,
  setSelectedVariation,
  storeId,
  itemId,
}: CatalogHeroGalleryProps) {
  const router = useRouter();
  const fabricImage = resolveFabricImage(item);
  const primaryModel = item.images.find(i => i.is_primary)?.image_url || item.images[0]?.image_url || '';
  const isFabricActive = Boolean(fabricImage && selectedImage === fabricImage);

  const viewPhoto = (src: string) => {
    router.push(`/store/${storeId}/catalog/${itemId}/photo?src=${encodeURIComponent(src)}`);
  };

  return (
    <>
      {/* 1. Hero Image — <main>'s own px tiers now provide the left/right
          inset directly (0px at 320-374px, 24px at 375-599px, see
          page.tsx), so no margin override is needed here any more: the
          image is just a normal child, same as every other section below
          it, which is what keeps it genuinely aligned with them instead
          of hand-matching two separate margin systems. Only the top
          margin still needs its own cancel — <main>'s py-4 would
          otherwise leave a gap between the sticky header and the image
          on the true full-bleed tier. */}
      <div className="relative -mt-4 min-[600px]:mt-0">
        {selectedImage ? (
          <>
            {/* aspect-square on mobile instead of the old aspect-3/4 —
                the tall portrait crop filled the entire viewport height,
                pushing Model/Price/Title/Sizing below the fold and
                forcing a scroll before a customer saw anything else. A
                shorter image lets all of that sit in the same first
                screen, matching the reference layout. 600px+ switches to
                a fixed, shorter height instead — at full 7-column desktop
                width, aspect-3/4 was rendering ~990px tall, far more
                dominant than the shorter info column next to it (or
                Shopee's own product image, which this was meant to
                match) — the mismatch is what created the big blank gap. */}
            <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken overflow-hidden relative w-full min-[600px]:border min-[600px]:border-line">
              {/* object-cover through 767px so the fixed-height box is
                  always fully filled (no bg-sunken letterbox gap around
                  the picture); only true desktop (768px+, a wide-enough
                  column that cropping is more noticeable) switches to
                  object-contain to show the whole uncropped image. */}
              <Image
                src={getMediaUrl(selectedImage)}
                alt={item.name}
                className="w-full h-full object-cover object-top min-[600px]:object-center md:object-contain transition-all duration-300"
                fill
              />
            </div>
            <button
              type="button"
              onClick={() => viewPhoto(selectedImage)}
              aria-label="View full photo"
              className="absolute left-0 right-0 bottom-0 touch-manipulation"
              style={{ top: 60 }}
            />
          </>
        ) : (
          <div className="aspect-3/4 bg-sunken overflow-hidden relative flex items-center justify-center text-ink-muted">
            No Image
          </div>
        )}
      </div>

      {/* 2. Model & Fabric Swatch Switcher */}
      {(item.images.length > 0 || fabricImage) && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              {isFabricActive ? 'Fabric' : 'Model'}
            </span>
            {fabricImage && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[11px] font-semibold ${!isFabricActive ? 'text-ink' : 'text-ink-faint'}`}>
                  Model
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isFabricActive) {
                      if (primaryModel) {
                        setSelectedImage(primaryModel);
                        setSelectedVariation('Model View');
                      }
                    } else {
                      if (fabricImage) {
                        setSelectedImage(fabricImage);
                        setSelectedVariation('Fabric Swatch');
                      }
                    }
                  }}
                  aria-label="Toggle between model and fabric photos"
                  className={`relative w-8 h-[18px] rounded-full transition-colors ${isFabricActive ? 'bg-ink' : 'bg-line-strong'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      isFabricActive ? 'translate-x-[14px]' : ''
                    }`}
                  />
                </button>
                <span className={`text-[11px] font-semibold ${isFabricActive ? 'text-ink' : 'text-ink-faint'}`}>
                  Fabric
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {(() => {
              const currentThumbnailImage = isFabricActive ? (fabricImage || primaryModel) : (primaryModel || fabricImage);
              return (
                <button
                  type="button"
                  onClick={() => currentThumbnailImage && viewPhoto(currentThumbnailImage)}
                  aria-label="View full photo"
                  className="w-16 h-16 rounded-none overflow-hidden border-2 border-ink ring-2 ring-taupe/50 transition-all relative shrink-0 shadow-xs touch-manipulation"
                  title={isFabricActive ? `${item.material || 'Fabric'} Swatch` : `${item.name} Model View`}
                >
                  <Image
                    src={getMediaUrl(currentThumbnailImage)}
                    alt={isFabricActive ? `${item.material || 'Fabric'} Swatch` : `${item.name} Model View`}
                    className={`w-full h-full object-cover ${isFabricActive ? 'object-center' : 'object-top'}`}
                    fill
                  />
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
