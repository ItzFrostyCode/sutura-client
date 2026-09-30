'use client';

import React from 'react';
import SizeChartEditor from '@/components/shared/SizeChartEditor';
import { ServicePhotoEditor, ServiceInfoEditor, ServiceSpecEditor, ServiceDescriptionEditor, type DraftEdit } from '../detail/ServiceEditors';
import { ServiceBookingEditor } from '../detail/ServiceBookingEditor';
import type { ServiceSection } from '../detail/serviceEditing';

// Same editors as the detail page's boxes — the create flow only changes how they are sequenced.
export default function ServiceWizardStep({ section, edit }: Readonly<{ section: ServiceSection; edit: DraftEdit }>) {
  switch (section) {
    case 'photo': return <ServicePhotoEditor edit={edit} />;
    case 'info': return <ServiceInfoEditor edit={edit} />;
    case 'spec': return <ServiceSpecEditor edit={edit} />;
    case 'description': return <ServiceDescriptionEditor edit={edit} />;
    case 'booking': return <ServiceBookingEditor edit={edit} />;
    case 'chart':
      return (
        <SizeChartEditor
          mode="table"
          value={edit.draft!.sizeChart}
          onChange={(sizeChart) => edit.setDraft(d => (d ? { ...d, sizeChart } : d))}
          storeId={edit.storeId}
          title="Reference chart"
          description="Upload your own chart image and/or build a size & measurement table."
        />
      );
    default: return null;
  }
}
