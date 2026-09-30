'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import CatalogDetailGrid from '@/components/store-catalog-detail/CatalogDetailGrid';
import ServiceProductInfo from '@/components/store-service-detail/ServiceProductInfo';
import { ServiceSpecBlock, ServiceChartBlock, ServiceDescriptionBlock, hasServiceChart } from '@/components/store-service-detail/ServiceDetailBlocks';
import EditableBox from '@/components/catalog/editable/EditableBox';
import SizeChartEditor from '@/components/shared/SizeChartEditor';
import { getMediaUrl } from '@/lib/media';
import type { Service } from '../serviceHelpers';
import { toPublicService } from './serviceEditing';
import { ServicePhotoEditor, ServiceInfoEditor, ServiceSpecEditor, ServiceDescriptionEditor } from './ServiceEditors';
import { ServiceBookingEditor, ServiceBookingView } from './ServiceBookingEditor';
import type { ServiceSectionEdit } from './useServiceSectionEdit';

const PAD = 'px-4 min-[375px]:px-6 min-[600px]:px-0';

interface ServiceEditableOverviewProps {
  readonly service: Service;
  readonly edit: ServiceSectionEdit;
}

// The customer's Service Detail page — same grid, same blocks, same order —
// where every section is a box with a pencil instead of a separate form.
export default function ServiceEditableOverview({ service, edit }: Readonly<ServiceEditableOverviewProps>) {
  const ps = useMemo(() => toPublicService(service), [service]);
  const chart = hasServiceChart(ps);

  return (
    <div className="space-y-4">
      <CatalogDetailGrid
        gallery={
          <EditableBox
            control={edit.control('photo')}
            label="photo"
            className="max-[599px]:border-x-0"
            view={
              service.image_url ? (
                <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken overflow-hidden relative w-full">
                  <Image
                    src={getMediaUrl(service.image_url)}
                    alt={service.name}
                    className="w-full h-full object-cover object-top min-[600px]:object-center md:object-contain"
                    fill
                    priority
                    sizes="(max-width: 600px) 100vw, (max-width: 1024px) 60vw, 55vw"
                  />
                </div>
              ) : (
                <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken flex items-center justify-center text-ink-faint">
                  No photo yet — tap the pencil to add one
                </div>
              )
            }
          >
            <ServicePhotoEditor edit={edit} />
          </EditableBox>
        }
        buyZone={
          <div className={`space-y-4 ${PAD}`}>
            <EditableBox control={edit.control('info')} label="name, price and turnaround" view={<div className="p-4 pr-14"><ServiceProductInfo service={ps} hideStats /></div>}>
              <ServiceInfoEditor edit={edit} />
            </EditableBox>
          </div>
        }
      />

      <div className={`space-y-4 ${PAD}`}>
        <EditableBox control={edit.control('spec')} label="specification" title="Specification" badge={1} view={<ServiceSpecBlock service={ps} />}>
          <ServiceSpecEditor edit={edit} />
        </EditableBox>

        <EditableBox
          control={edit.control('chart')}
          label="reference chart"
          title="Reference Chart"
          badge={2}
          view={chart ? <ServiceChartBlock service={ps} /> : <p className="text-sm text-ink-faint">Not added yet — a size or measurement chart customers can check.</p>}
        >
          {edit.draft && (
            <SizeChartEditor
              mode="table"
              value={edit.draft.sizeChart}
              onChange={(sizeChart) => edit.setDraft(d => (d ? { ...d, sizeChart } : d))}
              storeId={edit.storeId}
              title="Reference chart"
              description="Upload your own chart image and/or build a size & measurement table."
            />
          )}
        </EditableBox>

        <EditableBox control={edit.control('description')} label="description" title="Description" badge={3} view={<ServiceDescriptionBlock service={ps} />}>
          <ServiceDescriptionEditor edit={edit} />
        </EditableBox>

        <EditableBox control={edit.control('booking')} label="booking form" title="Booking Form" badge={4} view={<ServiceBookingView customFields={service.custom_fields} rosterFields={service.roster_fields} />}>
          <ServiceBookingEditor edit={edit} />
        </EditableBox>
      </div>
    </div>
  );
}
