'use client';

import { useMemo, useState } from 'react';
import CatalogHeroGallery from '@/components/store-catalog-detail/CatalogHeroGallery';
import type { DetailedCatalogItem } from '../detail/detailTypes';
import { toStorefrontItem } from './catalogItemMappers';
import type { CatalogSectionEdit } from './useCatalogSectionEdit';
import EditableBox from './EditableBox';
import GalleryEditor from './editors/GalleryEditor';
import { FIELD, LABEL } from './editors/fieldStyles';

interface CatalogEditableOverviewProps {
  readonly item: DetailedCatalogItem;
  readonly edit: CatalogSectionEdit;
}

// The owner's design page, photos and description only: the photo gallery,
// then the name and full description. No price, ratings, views, colors,
// sizes or specification breakdowns. Each box has a pencil to edit it.
export default function CatalogEditableOverview({ item, edit }: Readonly<CatalogEditableOverviewProps>) {
  const sf = useMemo(() => toStorefrontItem(item), [item]);
  const defaultImage = (sf.images.find(i => i.is_primary) ?? sf.images[0])?.image_url ?? '';
  const [pickedImage, setPickedImage] = useState('');
  const selectedImage = sf.images.some(i => i.image_url === pickedImage) ? pickedImage : defaultImage;
  const f = edit.form;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
      <EditableBox control={edit.control('gallery')} className="max-[599px]:border-x-0" label="photos" view={
        <div className="pb-3">
          <CatalogHeroGallery
            item={sf}
            selectedImage={selectedImage}
            setSelectedImage={setPickedImage}
            selectedVariation=""
            setSelectedVariation={() => {}}
            storeId=""
            itemId={String(item.id)}
            colorOptions={[]}
            disableZoom
            hideActions
          />
        </div>
      }>
        <GalleryEditor edit={edit} showColors={false} />
      </EditableBox>

      <EditableBox control={edit.control('details')} className="max-[599px]:border-x-0" label="name and description" title="Description" view={
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-ink leading-tight">{item.name}</h1>
          {item.description?.trim() ? (
            <p className="text-sm text-ink-body leading-relaxed whitespace-pre-line">{item.description}</p>
          ) : (
            <p className="text-sm text-ink-faint">No description yet — tap the pencil to add one.</p>
          )}
        </div>
      }>
        <div className="space-y-4">
          <div>
            <label htmlFor="design-name" className={LABEL}>Design name <span className="text-red-600">*</span></label>
            <input id="design-name" name="name" value={f.formData.name} onChange={f.handleChange} maxLength={255} className={FIELD} />
          </div>
          <div>
            <label htmlFor="design-desc" className={LABEL}>Description</label>
            <textarea id="design-desc" name="description" rows={8} value={f.formData.description} onChange={f.handleChange} className={FIELD} />
          </div>
        </div>
      </EditableBox>
    </div>
  );
}
