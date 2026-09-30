'use client';

import React from 'react';
import CatalogProductInfo from '@/components/store-catalog-detail/CatalogProductInfo';
import CatalogSizeSelector from '@/components/store-catalog-detail/CatalogSizeSelector';
import type { CatalogItem as StorefrontItem } from '@/components/store-catalog-detail/types';
import EditableBox from './EditableBox';
import { InfoEditor, SizesEditor } from './editors/InfoAndSizesEditors';
import type { CatalogSectionEdit } from './useCatalogSectionEdit';

interface EditableBuyZoneProps {
  readonly edit: CatalogSectionEdit;
  readonly sf: StorefrontItem;
  readonly selectedSize: string;
  readonly onPickSize: (size: string) => void;
}

// The customer's right-hand column (title → size → actions).
export default function EditableBuyZone({
  edit,
  sf,
  selectedSize,
  onPickSize,
}: Readonly<EditableBuyZoneProps>) {

  return (
    <div className="space-y-4 px-4 min-[375px]:px-6 min-[600px]:px-0">
      <EditableBox control={edit.control('info')} label="title, price and production time" view={<div className="p-4 pr-14"><CatalogProductInfo item={sf} hideStats /></div>}>
        <InfoEditor edit={edit} />
      </EditableBox>

      <EditableBox
        control={edit.control('sizes')}
        label="sizes"
        title="Size"
        view={
          sf.sizes && sf.sizes.length > 0 ? (
            <div className="[&>div>div]:border-b-0 [&>div>div]:py-0">
              <CatalogSizeSelector sizes={sf.sizes} selectedSize={selectedSize} onSelectSize={onPickSize} orderSuccess={null} onViewOrder={() => {}} hideLabel />
            </div>
          ) : (
            <p className="text-sm text-ink-faint">No sizes listed — customers will see this design as fully made-to-measure.</p>
          )
        }
      >
        <SizesEditor edit={edit} />
      </EditableBox>

    </div>
  );
}
