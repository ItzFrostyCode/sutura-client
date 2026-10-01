'use client';

import React from 'react';
import Image from 'next/image';
import CatalogDetailGrid from '@/components/store-catalog-detail/CatalogDetailGrid';
import EditableBox from '@/components/catalog/editable/EditableBox';
import { getMediaUrl } from '@/lib/media';
import RequirementsEditor from '@/components/requirements/RequirementsEditor';
import RequirementsView from '@/components/requirements/RequirementsView';
import type { ServicePackage } from '../serviceHelpers';
import { PackagePhotoEditor, PackageInfoEditor, PackageServicesEditor, PackageDescriptionEditor } from './PackageEditors';
import { PackageInfoView, PackageServicesView, PackageDescriptionView } from './PackageViews';
import type { PackageSectionEdit } from './usePackageSectionEdit';

const PAD = 'px-4 min-[375px]:px-6 min-[600px]:px-0';
const BOX = 'aspect-square min-[600px]:aspect-auto min-[600px]:h-[560px] bg-sunken';

// The customer's package page — same grid as a service or a design — where every section is a box with a pencil.
export default function PackageEditableOverview({ pkg, edit }: Readonly<{ pkg: ServicePackage; edit: PackageSectionEdit }>) {
  return (
    <div className="space-y-4">
      <CatalogDetailGrid
        gallery={
          <EditableBox
            control={edit.control('photo')}
            label="photo"
            className="max-[599px]:border-x-0"
            view={
              pkg.image_url ? (
                <div className={`${BOX} overflow-hidden relative w-full`}>
                  <Image src={getMediaUrl(pkg.image_url)} alt={pkg.name} className="w-full h-full object-cover object-top min-[600px]:object-center md:object-contain" fill priority sizes="(max-width: 600px) 100vw, (max-width: 1024px) 60vw, 55vw" />
                </div>
              ) : (
                <div className={`${BOX} flex items-center justify-center text-ink-faint`}>No photo yet — tap the pencil to add one</div>
              )
            }
          >
            <PackagePhotoEditor edit={edit} />
          </EditableBox>
        }
        buyZone={
          <div className={`space-y-4 ${PAD}`}>
            <EditableBox control={edit.control('info')} label="name and price" view={<PackageInfoView pkg={pkg} />}>
              <PackageInfoEditor edit={edit} />
            </EditableBox>
          </div>
        }
      />

      <div className={`space-y-4 ${PAD}`}>
        <EditableBox control={edit.control('services')} label="included services" title="Included Services" badge={1} view={<PackageServicesView pkg={pkg} />}>
          <PackageServicesEditor edit={edit} />
        </EditableBox>
        <EditableBox control={edit.control('description')} label="description" title="Description" badge={2} view={<PackageDescriptionView pkg={pkg} />}>
          <PackageDescriptionEditor edit={edit} />
        </EditableBox>
        <EditableBox control={edit.control('requirements')} label="requirements" title="Requirements" badge={3} view={<RequirementsView value={pkg} />}>
          {edit.draft && <RequirementsEditor value={edit.draft.requirements} onChange={(requirements) => edit.setDraft(d => (d ? { ...d, requirements } : d))} inheritLabel="Use the shop default" />}
        </EditableBox>
      </div>
    </div>
  );
}
