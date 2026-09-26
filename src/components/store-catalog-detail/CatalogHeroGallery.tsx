import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shirt, Sparkles } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { resolveFabricImage, getFabricLabel } from '@/lib/fabricHelper';
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

              {/* Floating Model / Fabric Pill Toggle on the image */}
              {fabricImage && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center p-1 bg-black/65 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (primaryModel) {
                        setSelectedImage(primaryModel);
                        setSelectedVariation('Model View');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      !isFabricActive
                        ? 'bg-white text-ink shadow-sm font-bold'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Shirt size={12} />
                    <span>Model</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fabricImage) {
                        setSelectedImage(fabricImage);
                        setSelectedVariation('Fabric Swatch');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isFabricActive
                        ? 'bg-white text-ink shadow-sm font-bold'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Sparkles size={12} />
                    <span>Fabric</span>
                  </button>
                </div>
              )}
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

      {/* 2. Model & Fabric Swatch Switcher (Bottom Thumbnails) */}
      {(item.images.length > 0 || fabricImage) && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
              {isFabricActive ? (
                <>
                  <Sparkles size={13} className="text-taupe" />
                  <span>Fabric Swatch</span>
                </>
              ) : (
                <>
                  <Shirt size={13} className="text-ink" />
                  <span>Model Photos</span>
                </>
              )}
            </span>
            <span className="text-[11px] font-semibold text-taupe">
              {isFabricActive ? getFabricLabel(item) : (item.color ? `${item.color} · Model` : 'Model View')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {/* All Model Image Thumbnails */}
            {item.images.map((img, idx) => {
              const isSelected = selectedImage === img.image_url;
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img.image_url);
                    setSelectedVariation('Model View');
                  }}
                  className={`w-16 h-16 rounded-none overflow-hidden border-2 transition-all relative shrink-0 shadow-xs cursor-pointer ${
                    isSelected && !isFabricActive
                      ? 'border-ink ring-2 ring-taupe/50'
                      : 'border-line hover:border-taupe opacity-75 hover:opacity-100'
                  }`}
                  title={`${item.name} Model View ${idx + 1}`}
                >
                  <Image
                    src={getMediaUrl(img.image_url)}
                    alt={`${item.name} View ${idx + 1}`}
                    className="w-full h-full object-cover object-top"
                    fill
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-ink/80 text-[8px] text-white text-center py-0.5 font-bold uppercase tracking-wider">
                    Model
                  </span>
                </button>
              );
            })}

            {/* Fabric Swatch Thumbnail */}
            {fabricImage && (
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(fabricImage);
                  setSelectedVariation('Fabric Swatch');
                }}
                className={`w-16 h-16 rounded-none overflow-hidden border-2 transition-all relative shrink-0 shadow-xs cursor-pointer ${
                  isFabricActive
                    ? 'border-ink ring-2 ring-taupe/50'
                    : 'border-line hover:border-taupe opacity-75 hover:opacity-100'
                }`}
                title={`${getFabricLabel(item)} Swatch`}
              >
                <Image
                  src={getMediaUrl(fabricImage)}
                  alt={`${getFabricLabel(item)} Swatch`}
                  className="w-full h-full object-cover object-center"
                  fill
                />
                <span className="absolute bottom-0 inset-x-0 bg-ink/80 text-[8px] text-white text-center py-0.5 font-bold uppercase tracking-wider">
                  Fabric
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

