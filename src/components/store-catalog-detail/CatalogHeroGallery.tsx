import React, { useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { isAngleLabel, CatalogColorOption } from '@/lib/fabricHelper';
import CatalogAngleThumbnails from './CatalogAngleThumbnails';
import { CatalogItem } from './types';

interface CatalogHeroGalleryProps {
  item: CatalogItem;
  selectedImage: string;
  setSelectedImage: (img: string) => void;
  selectedVariation: string;
  setSelectedVariation: (variation: string) => void;
  storeId: string;
  itemId: string;
  colorOptions: CatalogColorOption[];
  isSaved?: boolean;
  togglingSave?: boolean;
  onToggleSave?: () => void;
  // Inline rating + photo zoom are customer-only; the owner's Catalog
  // Preview omits them and gets the same gallery without either.
  myRating?: number;
  setMyRating?: (r: number) => void;
  hoverRating?: number;
  setHoverRating?: (r: number) => void;
  onSubmitRating?: (e: React.FormEvent) => void;
  submittingReview?: boolean;
  disableZoom?: boolean;
  /** Owner view: no Favorite / Rate bar under the photos. */
  hideActions?: boolean;
}

export default function CatalogHeroGallery({
  item,
  selectedImage,
  setSelectedImage,
  setSelectedVariation,
  storeId,
  itemId,
  colorOptions,
  isSaved,
  togglingSave,
  onToggleSave,
  myRating = 0,
  setMyRating,
  hoverRating = 0,
  setHoverRating,
  onSubmitRating,
  submittingReview,
  disableZoom,
  hideActions,
}: CatalogHeroGalleryProps) {
  const router = useRouter();

  // When the item has real color variants, each color's own photo lives in
  // the Color swatch row above instead — the bottom strip stays dedicated to
  // this garment's angle views (front/back/side/etc.) so a color photo never
  // shows up twice. With no color variants, nothing to exclude — every image
  // is just an angle view, same as before this changed.
  const hasColorVariants = colorOptions.length > 1;
  const uniqueImages = useMemo(() => {
    const seen = new Set<string>();
    return item.images.filter((img) => {
      if (!img.image_url || seen.has(img.image_url)) return false;
      if (hasColorVariants && !isAngleLabel(img.view_angle)) return false;
      seen.add(img.image_url);
      return true;
    });
  }, [item.images, hasColorVariants]);

  const currentIndex = uniqueImages.findIndex(img => img.image_url === selectedImage);
  const displayIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

  const viewPhoto = (src: string) => {
    router.push(`/store/${storeId}/catalog/${itemId}/photo?src=${encodeURIComponent(src)}`);
  };

  return (
    <>
      {/* Main image */}
      <div className="relative w-full">
        {selectedImage ? (
          <>
            <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken overflow-hidden relative w-full border-b border-line min-[600px]:border min-[600px]:border-line">
              <Image
                src={getMediaUrl(selectedImage)}
                alt={item.name}
                className="w-full h-full object-cover object-top min-[600px]:object-center md:object-contain transition-all duration-300"
                fill
                priority
                sizes="(max-width: 600px) 100vw, (max-width: 1024px) 60vw, 55vw"
              />
              {/* 1/N counter badge */}
              {uniqueImages.length > 1 && (
                <span className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 backdrop-blur-sm pointer-events-none">
                  {displayIndex} / {uniqueImages.length}
                </span>
              )}
            </div>
            {!disableZoom && <button
              type="button"
              onClick={() => viewPhoto(selectedImage)}
              aria-label="View full photo"
              className="absolute left-0 right-0 bottom-0 touch-manipulation cursor-zoom-in"
              style={{ top: 60 }}
            />}
          </>
        ) : (
          <div className="aspect-square bg-sunken overflow-hidden relative flex items-center justify-center text-ink-muted border-b border-line min-[600px]:border min-[600px]:border-line">
            No Image
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="mt-3 px-4 min-[375px]:px-6 min-[600px]:px-0">
        <CatalogAngleThumbnails
          images={uniqueImages}
          selectedImage={selectedImage}
          onSelectImage={(url, label) => {
            setSelectedImage(url);
            setSelectedVariation(label);
          }}
          itemName={item.name}
        />
      </div>

      {/* Gallery share bar: ♥ Favorite (count) left | Rate: ★★★★★ right */}
      {!hideActions && <div className="mt-3 px-4 min-[375px]:px-6 min-[600px]:px-0 flex items-center justify-between border-t border-line pt-3 gap-4">
        {/* Favorite */}
        <button
          type="button"
          onClick={onToggleSave}
          disabled={togglingSave || !onToggleSave}
          aria-label={isSaved ? 'Unsave' : 'Save'}
          aria-pressed={isSaved}
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-rose-600 transition-colors disabled:opacity-50"
        >
          <Heart size={17} className={isSaved ? 'fill-rose-600 text-rose-600' : ''} />
          <span className={`font-medium ${isSaved ? 'text-rose-600' : ''}`}>
            Favorite ({item.saves_count ?? 0})
          </span>
        </button>

        {/* Inline star rating */}
        {onSubmitRating && setMyRating && setHoverRating && <form
          onSubmit={onSubmitRating}
          className="flex items-center gap-2"
          onMouseLeave={() => setHoverRating(0)}
        >
          <span className="text-xs text-ink-muted font-medium shrink-0">Rate:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMyRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                aria-label={`${n} star`}
                className="p-0.5 touch-manipulation"
              >
                <Star
                  size={18}
                  className={
                    n <= (hoverRating || myRating)
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-line-strong'
                  }
                />
              </button>
            ))}
          </div>
          {myRating > 0 && (
            <button
              type="submit"
              disabled={submittingReview}
              className="text-[11px] font-semibold text-white bg-taupe px-2 py-1 hover:bg-ink transition-colors disabled:opacity-50 shrink-0"
            >
              {submittingReview ? '…' : 'Send'}
            </button>
          )}
        </form>}
      </div>}
    </>
  );
}
