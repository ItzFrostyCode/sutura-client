'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import type { Service } from '../serviceHelpers';
import ImageUploadField from '../detail/ImageUploadField';
import { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS } from '@/lib/canonicalTaxonomy';
import { pricedTotal, suggestPackageCategory, type PackageDraft } from './packageEditing';

export interface PackageDraftEdit {
  readonly draft: PackageDraft | null;
  readonly setDraft: React.Dispatch<React.SetStateAction<PackageDraft | null>>;
  readonly services: Service[];
  readonly storeId: number;
}

const usePatch = (edit: PackageDraftEdit) => ({
  d: edit.draft!,
  patch: (p: Partial<PackageDraft>) => edit.setDraft(prev => (prev ? { ...prev, ...p } : prev)),
});

export function PackageInfoEditor({ edit }: Readonly<{ edit: PackageDraftEdit }>) {
  const { d, patch } = usePatch(edit);
  const total = pricedTotal(edit.services.filter(s => d.selectedIds.includes(s.id)));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor="pkg-name" className={LABEL}>Package name <span className="text-red-600">*</span></label>
        <input id="pkg-name" value={d.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g. Barong + Slacks Set" className={FIELD} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pkg-price" className={LABEL}>Bundle price (PHP)</label>
        <input id="pkg-price" type="number" min="0" value={d.bundlePrice} onChange={e => patch({ bundlePrice: e.target.value })} placeholder="Leave empty to use the services' total" className={FIELD} />
        <p className="text-xs text-ink-faint mt-1.5">
          {total > 0 ? `The chosen services add up to ₱${total.toLocaleString()}. ` : ''}One flat price for the whole set.
        </p>
      </div>
    </div>
  );
}

export function PackageServicesEditor({ edit }: Readonly<{ edit: PackageDraftEdit }>) {
  const { d, patch } = usePatch(edit);
  const [search, setSearch] = useState('');
  const chosen = edit.services.filter(s => d.selectedIds.includes(s.id));
  const options = edit.services.filter(s => !d.selectedIds.includes(s.id) && s.name.toLowerCase().includes(search.toLowerCase()));
  const missingPrice = chosen.filter(s => s.base_price == null);
  // The category follows the chosen services until the owner picks a different one.
  const setIds = (ids: number[]) => {
    const wasAuto = !d.service_category || d.service_category === suggestPackageCategory(edit.services, d.selectedIds);
    patch({ selectedIds: ids, ...(wasAuto ? { service_category: suggestPackageCategory(edit.services, ids) } : {}) });
  };
  return (
    <div className="space-y-4">
      <div>
        <p className={LABEL}>Included services <span className="text-red-600">*</span> <span className="normal-case font-normal text-ink-faint">— pick at least 2</span></p>
        {chosen.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing picked yet.</p>
        ) : (
          <ul className="border border-line divide-y divide-line">
            {chosen.map(s => (
              <li key={s.id} className="flex items-center gap-2 pl-3 min-h-12">
                <span className="flex-1 min-w-0 truncate text-sm text-ink">{s.name}</span>
                <span className="text-xs text-ink-muted shrink-0">{s.base_price != null ? `₱${Number(s.base_price).toLocaleString()}` : 'Custom quote'}</span>
                <button type="button" onClick={() => setIds(d.selectedIds.filter(i => i !== s.id))} aria-label={`Remove ${s.name}`} className="w-11 h-12 shrink-0 flex items-center justify-center text-ink-faint hover:text-danger cursor-pointer"><X size={18} /></button>
              </li>
            ))}
          </ul>
        )}
        {missingPrice.length > 0 && (
          <p className="text-xs text-amber-700 mt-2">{missingPrice.map(s => s.name).join(', ')} {missingPrice.length === 1 ? 'has' : 'have'} no fixed price, so the total above leaves {missingPrice.length === 1 ? 'it' : 'them'} out.</p>
        )}
      </div>
      <div>
        <label htmlFor="pkg-cat" className={LABEL}>Category <span className="text-red-600">*</span></label>
        <select id="pkg-cat" value={d.service_category} onChange={e => patch({ service_category: e.target.value })} className={FIELD}>
          <option value="">Select a category…</option>
          {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{SERVICE_CATEGORY_LABELS[c]}</option>)}
        </select>
        <p className="text-[11px] text-ink-faint mt-1.5">Filled in from the services you pick — change it if the set belongs somewhere else.</p>
      </div>
      <div>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search services" placeholder="Search your services…" className={`${FIELD} pl-10`} />
        </div>
        <ul className="mt-2 border border-line divide-y divide-line max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <li className="px-3 min-h-12 flex items-center text-sm text-ink-faint">{edit.services.length === 0 ? 'No services yet — add some under Services first.' : 'No more services to add.'}</li>
          ) : options.map(s => (
            <li key={s.id}>
              <button type="button" onClick={() => setIds([...d.selectedIds, s.id])} className="w-full flex items-center gap-2 px-3 min-h-12 text-left hover:bg-sunken cursor-pointer">
                <span className="flex-1 min-w-0 truncate text-sm text-ink">{s.name}</span>
                <span className="text-xs text-taupe font-semibold shrink-0">+ Add</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PackageDescriptionEditor({ edit }: Readonly<{ edit: PackageDraftEdit }>) {
  const { d, patch } = usePatch(edit);
  return (
    <div>
      <label htmlFor="pkg-desc" className={LABEL}>Description</label>
      <textarea id="pkg-desc" rows={6} value={d.description} onChange={e => patch({ description: e.target.value })} placeholder="What the set includes, who it is for, what to bring…" className={FIELD} />
    </div>
  );
}

export function PackagePhotoEditor({ edit }: Readonly<{ edit: PackageDraftEdit }>) {
  const { d, patch } = usePatch(edit);
  return <ImageUploadField value={d.image_url} onChange={url => patch({ image_url: url })} storeId={edit.storeId} hint="The photo customers see first on this package." alt="Package" />;
}
