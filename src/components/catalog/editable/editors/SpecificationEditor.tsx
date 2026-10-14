import React from 'react';
import { GarmentPicker } from '../../form/GarmentPicker';
import { SpecificationBulletsEditor } from '../../form/SpecificationBulletsEditor';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { formatTurnaround } from '@/lib/formatTurnaround';
import { FIELD } from './fieldStyles';

function Row({ label, hint, children }: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[40%_1fr] gap-x-4 gap-y-1 py-3 border-b border-line last:border-0">
      <div>
        <p className="text-ink-faint font-medium mobile-body-sm">{label}</p>
        {hint && <p className="text-[11px] text-ink-faint mt-0.5">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// Laid out row for row like the Specification table customers see (Garment,
// Service, Fabric, Material, Color, Sizes, Estimated
// Completion). Rows that are set elsewhere on the page are shown as plain
// text with a note on where to change them.
export default function SpecificationEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const f = edit.form;
  const colorNames = f.colorItems.map(c => c.name.trim()).filter(Boolean).join(', ');

  return (
    <div>
      <Row label="Garment" hint="Category, then the garment">
        <div className="grid grid-cols-1 gap-3 [&_label]:mb-1 [&_label]:text-[11px]">
          <GarmentPicker formData={f.formData} setFormData={f.setFormData} />
        </div>
      </Row>
      <Row label="Service" hint="Edit in the title box">
        <p className="mobile-body-sm text-ink-body">{f.storeServices.find(s => String(s.id) === f.formData.service_id)?.name ?? '—'}</p>
      </Row>
      <Row label="Fabric / Material" hint="The fabric preview is picked from this name">
        <input aria-label="Fabric or material" name="material" value={f.formData.material} onChange={f.handleChange} placeholder="e.g. Cocoon Silk, Piña" className={FIELD} />
      </Row>
      <Row label="Color" hint="Edit with the photos">
        <p className="mobile-body-sm text-ink-body">{colorNames || '—'}</p>
      </Row>
      <Row label="Sizes Available" hint="Edit in the Size box">
        <p className="mobile-body-sm text-ink-body">{f.formData.sizes.join(', ') || '—'}</p>
      </Row>
      <Row label="Estimated Completion" hint="Edit in the title box">
        <p className="mobile-body-sm text-ink-body">
          {formatTurnaround(f.formData.estimated_days || null, f.formData.estimated_days_max || null)}
        </p>
      </Row>
      <div className="pt-4">
        <SpecificationBulletsEditor features={f.features} setFeatures={f.setFeatures} />
      </div>
    </div>
  );
}
