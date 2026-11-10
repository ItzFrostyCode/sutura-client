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
import { toPublicService, type ServiceSection } from './serviceEditing';
import { ServicePhotoEditor, ServiceInfoEditor, ServiceSpecEditor, ServiceDescriptionEditor } from './ServiceEditors';
import { ServiceBookingEditor, ServiceBookingView } from './ServiceBookingEditor';
import { ServiceWorkEditor } from './ServiceWorkEditors';
import RequirementsEditor from '@/components/requirements/RequirementsEditor';
import RequirementsView from '@/components/requirements/RequirementsView';
import type { ServiceSectionEdit } from './useServiceSectionEdit';
import { cardNumbers } from './serviceSteps';

const PAD = 'px-4 min-[375px]:px-6 min-[600px]:px-0';

/** Each section has an anchor so the guided setup can scroll to the step it opens. */
export const stepAnchor = (section: ServiceSection) => `svc-step-${section}`;

interface ServiceEditableOverviewProps {
  readonly service: Service;
  readonly edit: ServiceSectionEdit;
}

// The customer's Service Detail page — same grid, same cards, same titles, same numbers, same order — where every
// section is a box with a pencil instead of a separate form. The cards a customer meets only when booking follow.
export default function ServiceEditableOverview({ service, edit }: Readonly<ServiceEditableOverviewProps>) {
  const ps = useMemo(() => toPublicService(service), [service]);
  const chart = hasServiceChart(ps);
  const num = cardNumbers(chart);
  const heroImage = service.image_url || null;

  return (
    <div className="space-y-4">
      <CatalogDetailGrid
        gallery={
          <div id={stepAnchor('photo')} className="scroll-mt-24">
            <EditableBox
              control={edit.control('photo')}
              label="photo"
              className="max-[599px]:border-x-0"
              view={
                heroImage ? (
                  <div className="aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken overflow-hidden relative w-full">
                    <Image src={getMediaUrl(heroImage)} alt={service.name} className="w-full h-full object-cover object-top min-[600px]:object-center md:object-contain" fill priority sizes="(max-width: 600px) 100vw, (max-width: 1024px) 60vw, 55vw" />
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
          </div>
        }
        buyZone={
          <div id={stepAnchor('info')} className={`space-y-4 scroll-mt-24 ${PAD}`}>
            <EditableBox control={edit.control('info')} label="name, price and turnaround" view={<div className="p-4 pr-14"><ServiceProductInfo service={ps} /></div>}>
              <ServiceInfoEditor edit={edit} />
            </EditableBox>
          </div>
        }
      />

      <div className={`space-y-3 ${PAD}`}>
        <div id={stepAnchor('workprices')} className="scroll-mt-24">
          <EditableBox control={edit.control('workprices')} label="what they do and prices" title="What they do & prices" badge={num.workprices} view={<div className="p-4"><ServiceSpecBlock service={ps} /></div>}>
            <div className="space-y-6">
              <ServiceWorkEditor edit={edit} />
              <div className="border-t border-line pt-5">
                <ServiceSpecEditor edit={edit} />
              </div>
            </div>
          </EditableBox>
        </div>

        <div id={stepAnchor('chart')} className="scroll-mt-24">
          <EditableBox
            control={edit.control('chart')}
            label="reference chart"
            title={chart ? 'Reference Chart' : 'Reference Chart (optional)'}
            badge={num.chart}
            view={chart ? <ServiceChartBlock service={ps} /> : <p className="p-4 text-sm text-ink-faint">Not added. Customers only see this card once you add a size or measurement chart.</p>}
          >
            {edit.draft && (
              <SizeChartEditor
                mode="table"
                value={edit.draft.sizeChart}
                onChange={(sizeChart) => edit.setDraft((d) => (d ? { ...d, sizeChart } : d))}
                storeId={edit.storeId}
                title="Reference chart"
                description="Upload your own chart image and/or build a size & measurement table."
              />
            )}
          </EditableBox>
        </div>

        <div id={stepAnchor('description')} className="scroll-mt-24">
          <EditableBox control={edit.control('description')} label="description" title="Description" badge={num.description} view={<ServiceDescriptionBlock service={ps} />}>
            <ServiceDescriptionEditor edit={edit} />
          </EditableBox>
        </div>

        <p className="pt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">What the customer sees when they book</p>

        <div id={stepAnchor('booking')} className="scroll-mt-24">
          <EditableBox control={edit.control('booking')} label="booking questions" title="Booking questions" badge={num.booking} view={<ServiceBookingView customFields={service.custom_fields} rosterFields={service.roster_fields} />}>
            <ServiceBookingEditor edit={edit} />
          </EditableBox>
        </div>

        <div id={stepAnchor('requirements')} className="scroll-mt-24">
          <EditableBox control={edit.control('requirements')} label="before they book" title="Before they book" badge={num.requirements} view={<RequirementsView value={service} />}>
            {edit.draft && <RequirementsEditor value={edit.draft.requirements} onChange={(requirements) => edit.setDraft((d) => (d ? { ...d, requirements } : d))} inheritLabel="Use the shop default" />}
          </EditableBox>
        </div>
      </div>
    </div>
  );
}
