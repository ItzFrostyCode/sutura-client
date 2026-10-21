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
        label="sizes and add-ons"
        title="Sizes & Add-ons"
        view={
          <div>
            {sf.sizes && sf.sizes.length > 0 ? (
              <div className="[&>div>div]:border-b-0 [&>div>div]:py-0">
                <CatalogSizeSelector sizes={sf.sizes} selectedSize={selectedSize} onSelectSize={onPickSize} orderSuccess={null} onViewOrder={() => {}} hideLabel />
              </div>
            ) : (
              <p className="text-sm text-ink-faint">No sizes listed — customers will see this design as fully made-to-measure.</p>
            )}
            {sf.add_ons && sf.add_ons.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-line text-xs">
                <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px] block mb-1">
                  Design Add-ons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sf.add_ons.map((a) => (
                    <span key={a.id || a.name} className="px-2 py-0.5 bg-sunken border border-line text-ink text-[11px]">
                      {a.name} (+₱{Number(a.price).toLocaleString('en-PH')})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        }
      >
        <SizesEditor edit={edit} />
      </EditableBox>

    </div>
  );
}
