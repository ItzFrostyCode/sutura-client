'use client';

import { useState } from 'react';
import { getItemColorOptions, isAngleLabel } from '@/lib/fabricHelper';
import CatalogHeroGallery from '@/components/store-catalog-detail/CatalogHeroGallery';
import CatalogProductInfo from '@/components/store-catalog-detail/CatalogProductInfo';
import CatalogColorSelector from '@/components/store-catalog-detail/CatalogColorSelector';
import CatalogSizeSelector from '@/components/store-catalog-detail/CatalogSizeSelector';
import CatalogDesktopActionButtons from '@/components/store-catalog-detail/CatalogDesktopActionButtons';
import CatalogAccordionSections from '@/components/store-catalog-detail/CatalogAccordionSections';
import CatalogDetailBreadcrumb from '@/components/store-catalog-detail/CatalogDetailBreadcrumb';
import { CatalogItem as DetailItem } from '@/components/store-catalog-detail/types';

interface CatalogPreviewBodyProps {
  item: DetailItem;
  storeSlug: string;
}

// Same components, same order, same default picks as the customer's
// /store/[slug]/catalog/[id] page — only the customer-only interactions
// (rating, photo zoom, booking) are left inert.
export default function CatalogPreviewBody({ item, storeSlug }: Readonly<CatalogPreviewBodyProps>) {
  const allColors = getItemColorOptions(item);
  const colorOptions = allColors.length > 1 ? allColors : [];

  // Mirrors useCatalogItemDetail: swatch #1 is the default color and the
  // first angle photo is the default main image.
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]?.name ?? '');
  const [selectedImage, setSelectedImage] = useState(() => {
    const angles = colorOptions.length > 0 ? item.images.filter((i) => isAngleLabel(i.view_angle)) : item.images;
    return (angles.find((i) => i.is_primary) ?? angles[0] ?? item.images[0])?.image_url ?? '';
  });
  const [selectedVariation, setSelectedVariation] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  return (
    <>
      <div className="hidden min-[600px]:block">
        <CatalogDetailBreadcrumb item={item} />
      </div>

      <div className="min-[600px]:grid min-[600px]:grid-cols-12 min-[600px]:gap-6 min-[600px]:items-start">
        <div className="min-[600px]:col-span-7">
          <CatalogHeroGallery
            item={item}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            selectedVariation={selectedVariation}
            setSelectedVariation={setSelectedVariation}
            storeId={storeSlug}
            itemId={String(item.id)}
            colorOptions={colorOptions}
            disableZoom
          />
        </div>

        <div className="min-[600px]:col-span-5 mt-4 min-[600px]:mt-0">
          <CatalogProductInfo item={item} />

          {colorOptions.length > 1 && (
            <div className="flex items-start gap-0 py-3.5 border-b border-line">
              <span className="w-[110px] shrink-0 text-sm text-ink-muted">Color</span>
              <div className="flex-1">
                <CatalogColorSelector
                  options={colorOptions}
                  selectedColor={selectedColor}
                  onSelectColor={(opt) => {
                    setSelectedColor(opt.name);
                    setSelectedImage(opt.modelImage);
                    setSelectedVariation(opt.name);
                  }}
                />
              </div>
            </div>
          )}

          <CatalogSizeSelector
            sizes={item.sizes}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            orderSuccess={null}
            onViewOrder={() => {}}
          />

          {/* Shown exactly as customers see them, but inert here. */}
          <div className="pointer-events-none select-none" aria-hidden="true">
            <CatalogDesktopActionButtons onOpenFind={() => {}} bookHref="#" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CatalogAccordionSections item={item} />
      </div>
    </>
  );
}
