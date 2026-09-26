import React, { useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media';
import { resolveFabricImage, getFabricLabel, getColorHex } from '@/lib/fabricHelper';
import ModelFabricToggle from '@/components/discovery/ModelFabricToggle';
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

  // Deduplicate model images by image_url in case DB contains duplicate entries
  const uniqueImages = useMemo(() => {
    const seen = new Set<string>();
    return item.images.filter((img) => {
      if (!img.image_url || seen.has(img.image_url)) return false;
      seen.add(img.image_url);
      return true;
    });
  }, [item.images]);

  const colorHex = item.color ? getColorHex(item.color) : '#94A3B8';

  const viewPhoto = (src: string) => {
    router.push(`/store/${storeId}/catalog/${itemId}/photo?src=${encodeURIComponent(src)}`);
  };

  const handleToggle = (showFabric: boolean) => {
    if (showFabric) {
      if (fabricImage) {
        setSelectedImage(fabricImage);
        setSelectedVariation('Fabric Swatch');
      }
    } else {
      if (primaryModel) {
        setSelectedImage(primaryModel);
        setSelectedVariation('Model View');
      }
    }
  };

  return (
    <>
      <div className="relative -mt-4 min-[600px]:mt-0">
        {selectedImage ? (
          <>
            <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken overflow-hidden relative w-full min-[600px]:border min-[600px]:border-line">
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
              className="absolute left-0 right-0 bottom-0 touch-manipulation cursor-zoom-in"
              style={{ top: 60 }}
            />
          </>
        ) : (
          <div className="aspect-3/4 bg-sunken overflow-hidden relative flex items-center justify-center text-ink-muted">
            No Image
          </div>
        )}
      </div>

      {/* Model & Fabric Controls + Color Swatch */}
      <div className="mt-3 space-y-2.5">
        {/* Row 1: Model/Fabric Switcher (Top) + View Label */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {fabricImage ? (
            <ModelFabricToggle
              showFabric={isFabricActive}
              setShowFabric={(val) => {
                const nextVal = typeof val === 'function' ? val(isFabricActive) : val;
                handleToggle(nextVal);
              }}
              size="sm"
            />
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Model View
            </span>
          )}

          <span className="text-[11px] font-semibold text-taupe">
            {isFabricActive
              ? `${getFabricLabel(item)} · Fabric Swatch`
              : (item.color ? `${item.color} · Model View` : 'Model View')}
          </span>
        </div>

        {/* Row 2: Color chip matching the Color Filter design */}
        {item.color && (
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs font-medium text-ink-muted">Color:</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-line text-xs font-medium text-ink shadow-2xs">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                style={{ backgroundColor: colorHex }}
              />
              <span className="capitalize">{item.color}</span>
            </div>
          </div>
        )}

        {/* Row 3: Only display photo thumbnails if there are multiple (>1) model angles */}
        {!isFabricActive && uniqueImages.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
            {uniqueImages.map((img, idx) => {
              const isSelected = selectedImage === img.image_url;
              return (
                <button
                  key={img.id || img.image_url || idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img.image_url);
                    setSelectedVariation(`Model View ${idx + 1}`);
                  }}
                  className={`w-16 h-16 rounded-none overflow-hidden border-2 transition-all relative shrink-0 shadow-xs cursor-pointer ${
                    isSelected
                      ? 'border-ink ring-2 ring-taupe/50'
                      : 'border-line hover:border-taupe opacity-75 hover:opacity-100'
                  }`}
                  title={`${item.name} View ${idx + 1}`}
                >
                  <Image
                    src={getMediaUrl(img.image_url)}
                    alt={`${item.name} View ${idx + 1}`}
                    className="w-full h-full object-cover object-top"
                    fill
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-ink/80 text-[8px] text-white text-center py-0.5 font-bold uppercase tracking-wider">
                    View {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

