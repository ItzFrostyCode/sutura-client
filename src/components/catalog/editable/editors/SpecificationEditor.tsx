import React from 'react';
import { CatalogCategoryFields } from '../../form/CatalogCategoryFields';
import { SpecificationBulletsEditor } from '../../form/SpecificationBulletsEditor';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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

// Laid out row for row like the Specification table customers see (Category,
// Garment Type, Service, Fabric, Material, Color, Sizes, Estimated
// Completion). Rows that are set elsewhere on the page are shown as plain
// text with a note on where to change them.
export default function SpecificationEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const f = edit.form;
  const colorNames = f.colorItems.map(c => c.name.trim()).filter(Boolean).join(', ');

  return (
    <div>
      <Row label="Category">
        <div className="grid grid-cols-1 gap-3 [&_label]:mb-1 [&_label]:text-[11px]">
          <CatalogCategoryFields formData={f.formData} onChange={f.handleChange} setFormData={f.setFormData} only="trail" />
        </div>
      </Row>
      <Row label="Garment Type">
        <div className="grid grid-cols-1 [&_label]:hidden">
          <CatalogCategoryFields formData={f.formData} onChange={f.handleChange} setFormData={f.setFormData} only="type" />
        </div>
      </Row>
      <Row label="Service" hint="Optional — bulk sublimation turns on Bulk Order">
        <div className="flex gap-2">
        <select aria-label="Linked service" name="service_id" value={f.formData.service_id} onChange={f.handleChange} className={FIELD}>
          <option value="">No linked service</option>
          {f.storeServices.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}{(s.service_types ?? []).includes('bulk_sublimation') ? ' (Bulk Sublimation)' : ''}
            </option>
          ))}
        </select>
        {edit.itemId > 0 && (
        <Link
          href={`/dashboard/services/new?return=${encodeURIComponent(`/dashboard/catalog/${edit.itemId}`)}`}
          aria-label="Add a new service"
          title="Add a new service — you'll come back here with it linked"
          className="w-12 h-12 shrink-0 bg-[#6B5346] text-white flex items-center justify-center hover:bg-ink transition-colors"
        >
          <Plus size={18} />
        </Link>
        )}
        </div>
        {edit.itemId === 0 && f.storeServices.length === 0 && (
          <p className="text-[11px] text-ink-faint mt-1.5">No services yet — add one under Services, then link it from this design&apos;s page.</p>
        )}
        {edit.itemId > 0 && f.storeServices.length === 0 && (
          <p className="text-[11px] text-ink-faint mt-1.5">No services yet — tap + to add one. You&apos;ll come back here with it linked.</p>
        )}
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
