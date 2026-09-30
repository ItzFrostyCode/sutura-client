'use client';

import React from 'react';
import { ImagePlus, Loader2, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useToast } from '@/context/ToastContext';
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_TYPE_LABELS,
  serviceTypesFor,
  type ServiceCategory,
} from '@/lib/canonicalTaxonomy';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import ImageUploadField from './ImageUploadField';
import { CATEGORY_HANDLING } from '../serviceHelpers';
import type { ServiceSectionEdit } from './useServiceSectionEdit';

export type DraftEdit = Pick<ServiceSectionEdit, 'draft' | 'setDraft' | 'storeId'>;

const useSet = (edit: DraftEdit) => {
  const { draft, setDraft } = edit;
  return { d: draft!, patch: (p: Partial<NonNullable<typeof draft>>) => setDraft(prev => (prev ? { ...prev, ...p } : prev)) };
};

export function ServicePhotoEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);
  return <ImageUploadField value={d.image_url} onChange={url => patch({ image_url: url })} storeId={edit.storeId} hint="The photo customers see first on this service." alt="Service" />;
}

export function ServiceInfoEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);
  const bulk = d.service_types.includes('bulk_sublimation');
  const from = Number(d.estimated_days);
  const hasFrom = d.estimated_days !== '' && from >= 1;
  const belowFrom = hasFrom && d.estimated_days_max !== '' && Number(d.estimated_days_max) <= from;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor="svc-name" className={LABEL}>Service name <span className="text-red-600">*</span></label>
        <input id="svc-name" value={d.name} onChange={e => patch({ name: e.target.value })} className={FIELD} />
      </div>
      <div>
        <label htmlFor="svc-price" className={LABEL}>Starting price (PHP)</label>
        <input id="svc-price" type="number" min="0" value={d.base_price} onChange={e => patch({ base_price: e.target.value })} placeholder="Leave empty for a custom quote" className={FIELD} />
      </div>
      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="svc-days" className={LABEL}>Production time — from (days) {!d.turnaround_depends && <span className="text-red-600">*</span>}</label>
          <input
            id="svc-days"
            type="number"
            min="1"
            value={d.estimated_days}
            disabled={d.turnaround_depends}
            onChange={e => patch({ estimated_days: e.target.value, ...(e.target.value === '' ? { estimated_days_max: '' } : {}) })}
            placeholder="e.g. 5"
            className={`${FIELD} disabled:bg-sunken disabled:cursor-not-allowed`}
          />
          <p className="text-[11px] text-ink-faint mt-1.5">Type this first.</p>
        </div>
        <div>
          <label htmlFor="svc-days-max" className={LABEL}>to (days)</label>
          <input
            id="svc-days-max"
            type="number"
            min={hasFrom ? from + 1 : 1}
            value={d.estimated_days_max}
            disabled={d.turnaround_depends || !hasFrom}
            onChange={e => patch({ estimated_days_max: e.target.value })}
            placeholder={hasFrom ? `${from + 1} or higher` : '—'}
            className={`${FIELD} disabled:bg-sunken disabled:cursor-not-allowed`}
          />
          <p className={`text-[11px] mt-1.5 ${belowFrom ? 'text-danger' : 'text-ink-faint'}`}>
            {d.turnaround_depends ? 'Not needed.' : !hasFrom ? 'Enter the "from" days first.' : belowFrom ? `Must be ${from + 1} or higher — or leave it blank.` : `Leave blank for exactly ${from} day${from === 1 ? '' : 's'}, or enter ${from + 1} or higher.`}
          </p>
        </div>
        <label className="sm:col-span-2 flex items-start gap-3 cursor-pointer min-h-11">
          <input
            type="checkbox"
            checked={d.turnaround_depends}
            onChange={e => patch(e.target.checked ? { turnaround_depends: true, estimated_days: '', estimated_days_max: '' } : { turnaround_depends: false })}
            className="mt-1 w-4 h-4 accent-[#6B5346]"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">It depends</span>
            <span className="block text-xs text-ink-muted">No fixed time — you tell each customer once you know what they need.</span>
          </span>
        </label>
      </div>
      {bulk && (
        <div className="sm:col-span-2">
          <label htmlFor="svc-minqty" className={LABEL}>Minimum order (pieces)</label>
          <input id="svc-minqty" type="number" min="1" value={d.min_order_qty} onChange={e => patch({ min_order_qty: e.target.value })} className={FIELD} />
        </div>
      )}
    </div>
  );
}

export function ServiceSpecEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);
  const leafTypes = d.service_category ? serviceTypesFor(d.service_category as ServiceCategory) : [];
  const freeLeaf = d.service_category === 'others';
  const handling = CATEGORY_HANDLING[d.service_category];

  const setTier = (i: number, p: Partial<{ label: string; amount: string }>) =>
    patch({ tiers: d.tiers.map((t, idx) => (idx === i ? { ...t, ...p } : t)) });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="svc-cat" className={LABEL}>Category <span className="text-red-600">*</span></label>
          <select id="svc-cat" value={d.service_category} onChange={e => patch({ service_category: e.target.value, service_leaf_type: '', service_types: CATEGORY_HANDLING[e.target.value]?.types ?? [] })} className={FIELD}>
            <option value="">Select a category…</option>
            {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{SERVICE_CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="svc-leaf" className={LABEL}>Service type</label>
          {freeLeaf ? (
            <input id="svc-leaf" value={d.service_leaf_type} onChange={e => patch({ service_leaf_type: e.target.value })} placeholder="Describe it" className={FIELD} />
          ) : (
            <select id="svc-leaf" value={d.service_leaf_type} onChange={e => patch({ service_leaf_type: e.target.value })} disabled={!d.service_category} className={`${FIELD} disabled:opacity-50`}>
              <option value="">{d.service_category ? 'Select a type…' : 'Pick a category first'}</option>
              {leafTypes.map(t => <option key={t} value={t}>{SERVICE_TYPE_LABELS[t] ?? t}</option>)}
            </select>
          )}
        </div>
      </div>

      {handling && (
        <p className="text-xs text-ink-muted border-l-2 border-line-strong pl-3">{handling.note}</p>
      )}

      <div>
        <p className={LABEL}>Pricing options <span className="text-red-600">*</span></p>
        <div className="space-y-2">
          {d.tiers.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-[1fr_120px] gap-2 min-w-0">
                <input value={t.label} onChange={e => setTier(i, { label: e.target.value })} aria-label="Item" placeholder="e.g. Pants hemming" className={FIELD} />
                <input type="number" min="0" value={t.amount} onChange={e => setTier(i, { amount: e.target.value })} aria-label="Price" placeholder="₱" className={FIELD} />
              </div>
              <button type="button" onClick={() => patch({ tiers: d.tiers.filter((_, idx) => idx !== i) })} aria-label="Remove item" className="w-11 h-12 shrink-0 flex items-center justify-center text-ink-faint hover:text-danger cursor-pointer">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => patch({ tiers: [...d.tiers, { label: '', amount: '' }] })} className="mt-2 h-11 px-3 text-taupe text-xs font-semibold flex items-center gap-1 cursor-pointer">
          <Plus size={14} /> Add item
        </button>
      </div>
    </div>
  );
}

export function ServiceDescriptionEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);
  return (
    <div>
      <label htmlFor="svc-desc" className={LABEL}>Description</label>
      <textarea id="svc-desc" rows={6} value={d.description} onChange={e => patch({ description: e.target.value })} placeholder="What the service covers, how it works, what to bring…" className={FIELD} />
    </div>
  );
}
