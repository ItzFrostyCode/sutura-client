'use client';

import React, { useMemo, useState } from 'react';
import CatalogColorSelector from '@/components/store-catalog-detail/CatalogColorSelector';
import CatalogHeroGallery from '@/components/store-catalog-detail/CatalogHeroGallery';
import CatalogDetailGrid from '@/components/store-catalog-detail/CatalogDetailGrid';
import { getItemColorOptions, isAngleLabel, type CatalogColorOption } from '@/lib/fabricHelper';
import type { DetailedCatalogItem } from '../detail/detailTypes';
import { toStorefrontItem } from './catalogItemMappers';
import type { CatalogSectionEdit } from './useCatalogSectionEdit';
import EditableBox from './EditableBox';
import GalleryEditor from './editors/GalleryEditor';
import EditableBuyZone from './EditableBuyZone';
import EditableGuideSections from './EditableGuideSections';

interface CatalogEditableOverviewProps {
  readonly item: DetailedCatalogItem;
  readonly edit: CatalogSectionEdit;
}

// The owner's Catalog Design page: the customer's Design Detail page, laid
// out with the very same grid and components, where every section is a box
// with a pencil instead of a separate edit form.
export default function CatalogEditableOverview({ item, edit }: Readonly<CatalogEditableOverviewProps>) {
  const sf = useMemo(() => toStorefrontItem(item), [item]);

  const colorOptions = useMemo(() => {
    const all = getItemColorOptions(sf);
    return all.length > 1 ? all : [];
  }, [sf]);

  // Same defaults as the customer page: swatch #1 is the color, and the first
  // angle photo (not a color photo) is the main image. A stale pick from
  // before a save falls back to the default instead of pointing at a photo
  // that no longer exists.
  const defaultImage = useMemo(() => {
    const angles = colorOptions.length > 0 ? sf.images.filter(i => isAngleLabel(i.view_angle)) : sf.images;
    return (angles.find(i => i.is_primary) ?? angles[0] ?? sf.images[0])?.image_url ?? '';
  }, [sf.images, colorOptions.length]);
  const [pickedImage, setPickedImage] = useState('');
  const [pickedColor, setPickedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const selectedImage = sf.images.some(i => i.image_url === pickedImage) ? pickedImage : defaultImage;
  const selectedColor = colorOptions.some(c => c.name === pickedColor) ? pickedColor : (colorOptions[0]?.name ?? '');

  const pickColor = (opt: CatalogColorOption) => {
    setPickedColor(opt.name);
    setPickedImage(opt.modelImage);
  };

  return (
    <div className="space-y-4">
      <CatalogDetailGrid
        gallery={
          <EditableBox
            control={edit.control('gallery')}
            className="max-[599px]:border-x-0"
            label="photos, colors and title"
            view={
              <div>
                <div className="pb-3">
                <CatalogHeroGallery
                  item={sf}
                  selectedImage={selectedImage}
                  setSelectedImage={setPickedImage}
                  selectedVariation={selectedColor}
                  setSelectedVariation={() => {}}
                  storeId=""
                  itemId={String(item.id)}
                  colorOptions={colorOptions}
                  disableZoom
                  hideActions
                />
                </div>
                {/* Colors sit right under the thumbnails, in the same box */}
                <div className="border-t border-line p-4 pr-14">
                  {colorOptions.length > 1 ? (
                    <div className="flex items-start">
                      <span className="w-[110px] shrink-0 text-sm text-ink-muted">Color</span>
                      <div className="flex-1 min-w-0">
                        <CatalogColorSelector options={colorOptions} selectedColor={selectedColor} onSelectColor={pickColor} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-faint">No colors yet — tap the pencil to add them.</p>
                  )}
                </div>
              </div>
            }
          >
            <GalleryEditor edit={edit} />
          </EditableBox>
        }
        buyZone={
          <EditableBuyZone
            edit={edit}
            sf={sf}
            selectedSize={selectedSize}
            onPickSize={setSelectedSize}
          />
        }
      />

      <EditableGuideSections edit={edit} sf={sf} />
    </div>
  );
}
