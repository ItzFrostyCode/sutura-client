'use client';

import React from 'react';
import SizeChartEditor from '@/components/shared/SizeChartEditor';
import GalleryEditor from '../editable/editors/GalleryEditor';
import SpecificationEditor from '../editable/editors/SpecificationEditor';
import { InfoEditor, SizesEditor } from '../editable/editors/InfoAndSizesEditors';
import { MeasurementGuideEditor, DescriptionEditor } from '../editable/editors/GuideEditors';
import type { CatalogDraftEdit, CatalogSection } from '../editable/useCatalogSectionEdit';

// The same editors the design page's boxes open — the create flow only sequences them.
export default function CatalogWizardStep({ section, edit }: Readonly<{ section: CatalogSection; edit: CatalogDraftEdit }>) {
  switch (section) {
    case 'gallery': return <GalleryEditor edit={edit} />;
    case 'info': return <InfoEditor edit={edit} />;
    case 'sizes': return <SizesEditor edit={edit} />;
    case 'measurement': return <MeasurementGuideEditor edit={edit} />;
    case 'spec': return <SpecificationEditor edit={edit} />;
    case 'description': return <DescriptionEditor edit={edit} />;
    case 'sizeChart':
      return (
        <SizeChartEditor
          mode="table"
          value={edit.form.sizeChart}
          onChange={edit.form.setSizeChart}
          storeId={edit.storeId}
          title="Size chart"
          description="Upload your own reference chart image and/or build a size & measurement table."
        />
      );
    default: return null;
  }
}
