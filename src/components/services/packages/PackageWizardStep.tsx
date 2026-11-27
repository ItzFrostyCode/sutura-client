'use client';

import React from 'react';
import { PackagePhotoEditor, PackageInfoEditor, PackageServicesEditor, PackageDescriptionEditor, type PackageDraftEdit } from './PackageEditors';
import type { PackageSection } from './packageEditing';

export default function PackageWizardStep({ section, edit }: Readonly<{ section: PackageSection; edit: PackageDraftEdit }>) {
  if (section === 'photo') return <PackagePhotoEditor edit={edit} />;
  if (section === 'info') return <PackageInfoEditor edit={edit} />;
  if (section === 'services') return <PackageServicesEditor edit={edit} />;
  return <PackageDescriptionEditor edit={edit} />;
}
