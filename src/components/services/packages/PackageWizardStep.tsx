'use client';

import React from 'react';
import { PackagePhotoEditor, PackageInfoEditor, PackageServicesEditor, PackageDescriptionEditor, type PackageDraftEdit } from './PackageEditors';
import RequirementsEditor from '@/components/requirements/RequirementsEditor';
import type { PackageSection } from './packageEditing';

export default function PackageWizardStep({ section, edit }: Readonly<{ section: PackageSection; edit: PackageDraftEdit }>) {
  if (section === 'photo') return <PackagePhotoEditor edit={edit} />;
  if (section === 'info') return <PackageInfoEditor edit={edit} />;
  if (section === 'requirements') return <RequirementsEditor value={edit.draft!.requirements} onChange={(requirements) => edit.setDraft(d => (d ? { ...d, requirements } : d))} inheritLabel="Use the shop default" />;
  if (section === 'services') return <PackageServicesEditor edit={edit} />;
  return <PackageDescriptionEditor edit={edit} />;
}
