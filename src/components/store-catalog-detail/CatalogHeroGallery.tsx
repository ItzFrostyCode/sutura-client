import React, { useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media';
import {
  resolveFabricImage,
  getItemColorOptions,
  CatalogColorOption,
} from '@/lib/fabricHelper';
import ModelFabricToggle from '@/components/discovery/ModelFabricToggle';
import CatalogColorSelector from './CatalogColorSelector';
import CatalogAngleThumbnails from './CatalogAngleThumbnails';
import { CatalogItem } from './types';

interface CatalogHeroGalleryProps {
  item: CatalogItem;
  selectedImage: string;
  setSelectedImage: (img: string) => void;
  selectedVariation: string;
  setSelectedVariation: (variation: string) => void;
  selectedColor?: string;
  setSelectedColor?: (color: string) => void;
  storeId: string;
  itemId: string;
}

export default function CatalogHeroGallery({
  item,
  selectedImage,
  setSelectedImage,
  setSelectedVariation,
  selectedColor = '',
  setSelectedColor,
  storeId,
  itemId,
}: CatalogHeroGalleryProps) {
  const router = useRouter();
  const fabricImage = resolveFabricImage(item);
  const primaryModel =
    item.images.find((i) => i.is_primary)?.image_url ||
    item.images[0]?.image_url ||
    '';

  const colorOptions = useMemo(() => getItemColorOptions(item), [item]);
  const activeColor = selectedColor || colorOptions[0]?.name || item.color || '';
  const activeOption = useMemo(() => {
    return (
      colorOptions.find(
        (o) => o.name.toLowerCase() === activeColor.toLowerCase()
      ) || colorOptions[0]
    );
  }, [colorOptions, activeColor]);

  // isFabricActive dynamically checks whether current image is a fabric swatch
  const isFabricActive = useMemo(() => {
    if (!selectedImage) return false;
    return (
      colorOptions.some(
        (o) => o.fabricImage && selectedImage === o.fabricImage
      ) || Boolean(fabricImage && selectedImage === fabricImage)
    );
  }, [selectedImage, colorOptions, fabricImage]);

  // Deduplicate model images by image_url
  const uniqueImages = useMemo(() => {
    const seen = new Set<string>();
    return item.images.filter((img) => {
      if (!img.image_url || seen.has(img.image_url)) return false;
      seen.add(img.image_url);
      return true;
    });
  }, [item.images]);

  const viewPhoto = (src: string) => {
    router.push(
      `/store/${storeId}/catalog/${itemId}/photo?src=${encodeURIComponent(src)}`
    );
  };

  const handleToggle = (toFabric: boolean) => {
    if (toFabric) {
      const targetFabric = activeOption?.fabricImage || fabricImage;
      if (targetFabric) {
        setSelectedImage(targetFabric);
        setSelectedVariation(activeOption?.fabricLabel || 'Fabric Swatch');
      }
    } else {
      const targetModel = activeOption?.modelImage || primaryModel;
      if (targetModel) {
        setSelectedImage(targetModel);
        setSelectedVariation(
          activeOption ? `${activeOption.name} · Model View` : 'Model View'
        );
      }
    }
  };

  const handleSelectColor = (opt: CatalogColorOption) => {
    if (setSelectedColor) {
      setSelectedColor(opt.name);
    }
    if (isFabricActive) {
      setSelectedImage(opt.fabricImage || fabricImage);
      setSelectedVariation(`${opt.fabricLabel || opt.name} · Fabric Swatch`);
    } else {
      setSelectedImage(opt.modelImage || primaryModel);
      setSelectedVariation(`${opt.name} · Model View`);
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
                priority
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

      {/* Model & Fabric Controls + Color Selector */}
      <div className="mt-3.5 space-y-2.5">
        {/* Header Bar: Left = Color Label, Right = Model/Fabric Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Color:
            </span>
            <span className="text-sm font-semibold text-ink capitalize">
              {activeOption?.name || item.color}
            </span>
          </div>

          {fabricImage && (
            <ModelFabricToggle
              showFabric={isFabricActive}
              setShowFabric={(val) => {
                const nextVal =
                  typeof val === 'function' ? val(isFabricActive) : val;
                handleToggle(nextVal);
              }}
              size="sm"
            />
          )}
        </div>

        {/* Sharp Box Color Selector */}
        <CatalogColorSelector
          options={colorOptions}
          selectedColor={activeColor}
          onSelectColor={handleSelectColor}
          isFabricActive={isFabricActive}
        />

        {/* Multiple camera angles if available */}
        {!isFabricActive && (
          <CatalogAngleThumbnails
            images={uniqueImages}
            selectedImage={selectedImage}
            onSelectImage={(url, label) => {
              setSelectedImage(url);
              setSelectedVariation(label);
            }}
            itemName={item.name}
          />
        )}
      </div>
    </>
  );
}
