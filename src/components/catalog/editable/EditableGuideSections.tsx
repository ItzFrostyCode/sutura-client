'use client';

import React from 'react';
import { SizeChartBlock, MeasurementGuideBlock, hasMeasurementGuide } from '@/components/store-catalog-detail/CatalogGuideBlocks';
import { CatalogSpecTable, CatalogDescriptionBlock } from '@/components/store-catalog-detail/CatalogSpecAndDescription';
import type { CatalogItem as StorefrontItem } from '@/components/store-catalog-detail/types';
import SizeChartEditor from '@/components/shared/SizeChartEditor';
import RequirementsEditor from '@/components/requirements/RequirementsEditor';
import RequirementsView from '@/components/requirements/RequirementsView';
import EditableBox from './EditableBox';
import { MeasurementGuideEditor, DescriptionEditor } from './editors/GuideEditors';
import SpecificationEditor from './editors/SpecificationEditor';
import type { CatalogSectionEdit } from './useCatalogSectionEdit';

interface EditableGuideSectionsProps {
  readonly edit: CatalogSectionEdit;
  readonly sf: StorefrontItem;
}

// 1 Size Guide (chart + measurement guide), 2 Specification, 3 Description —
// the same numbered cards the customer sees, each editable on its own.
export default function EditableGuideSections({ edit, sf }: Readonly<EditableGuideSectionsProps>) {
  return (
    <div className="space-y-4 px-4 min-[375px]:px-6 min-[600px]:px-0">
      <div className="bg-white border border-line">
        <div className="flex items-center gap-2.5 px-4 min-h-12 border-b border-line text-sm font-bold uppercase tracking-wider text-ink">
          <span className="w-5 h-5 rounded-full bg-taupe text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
          Size Guide
        </div>
        <div className="p-4 space-y-4">
          <EditableBox control={edit.control('sizeChart')} label="size chart" title="1. Size Chart" view={<SizeChartBlock item={sf} hideLabel />}>
            <SizeChartEditor
              mode="table"
              value={edit.form.sizeChart}
              onChange={edit.form.setSizeChart}
              storeId={edit.storeId}
              title="Size chart"
              description="Upload your own reference chart image and/or build a size & measurement table."
            />
          </EditableBox>

          <EditableBox
            control={edit.control('measurement')}
            label="measurement guide"
            title="2. Measurement Guide"
            view={
              hasMeasurementGuide(sf) ? (
                <MeasurementGuideBlock item={sf} hideLabel />
              ) : (
                <p className="text-sm text-ink-faint">Not added yet — tell customers how to measure themselves for this design.</p>
              )
            }
          >
            <MeasurementGuideEditor edit={edit} />
          </EditableBox>
        </div>
      </div>

      <EditableBox control={edit.control('spec')} label="specification" title="Specification" badge={2} view={<CatalogSpecTable item={sf} />}>
        <SpecificationEditor edit={edit} />
      </EditableBox>

      <EditableBox control={edit.control('description')} label="description" title="Description" badge={3} view={<CatalogDescriptionBlock item={sf} />}>
        <DescriptionEditor edit={edit} />
      </EditableBox>

      <EditableBox control={edit.control('requirements')} label="requirements" title="Requirements" badge={4} view={<RequirementsView value={edit.item} fallback="Uses the service or shop default" />}>
        <RequirementsEditor value={edit.reqDraft} onChange={edit.setReqDraft} inheritLabel="Use the service / shop default" />
      </EditableBox>
    </div>
  );
}
