'use client';

import React from 'react';
import { ImagePlus, Loader2, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { getMediaUrl } from '@/lib/media';
import { useToast } from '@/context/ToastContext';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import ImageUploadField from './ImageUploadField';
import type { ServiceSectionEdit } from './useServiceSectionEdit';
import type { PricingTierInput } from '../serviceHelpers';
import { COVERS_FIELD, COVERS_LABEL, NOT_SET, SET_NEEDS_BOTH, SOLD_AS_FIELD, SOLD_AS_LABEL, type Covers, type SoldAs } from '@/lib/orderUnits';

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
  const from = Number(d.estimated_days);
  const hasFrom = d.estimated_days !== '' && from >= 1;
  const belowFrom = hasFrom && d.estimated_days_max !== '' && Number(d.estimated_days_max) <= from;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor="svc-name" className={LABEL}>Service name <span className="text-red-600">*</span></label>
        <input id="svc-name" value={d.name} onChange={e => patch({ name: e.target.value })} className={FIELD} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="svc-price" className={LABEL}>Starting price (PHP)</label>
        <input id="svc-price" type="number" min="0" value={d.base_price} onChange={e => patch({ base_price: e.target.value })} placeholder="Leave empty for a custom quote" className={FIELD} />
        <p className="text-[11px] text-ink-faint mt-1.5">Leave empty for a custom quote.</p>
      </div>
      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="svc-days" className={`${LABEL} sm:min-h-[2.5rem] flex items-end`}>
            <span>Production time — from (days) {!d.turnaround_depends && <span className="text-red-600">*</span>}</span>
          </label>
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
          <p className="text-[11px] text-ink-faint mt-1.5">
            {d.turnaround_depends ? 'Not needed.' : hasFrom ? 'Minimum days needed.' : 'Type this first.'}
          </p>
        </div>
        <div>
          <label htmlFor="svc-days-max" className={`${LABEL} sm:min-h-[2.5rem] flex items-end`}>
            <span>To (days)</span>
          </label>
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
            className="mt-1 w-4 h-4 accent-taupe-dark"
          />
          <span>
            <span className="block text-sm font-semibold text-ink">It depends</span>
            <span className="block text-xs text-ink-muted">No fixed time — you tell each customer once you know what they need.</span>
          </span>
        </label>
      </div>
    </div>
  );
}

// Prices & add-ons: one row per price — the service itself in a few versions ("Jusi barong") or an add-on
// ("With collar + jacket"). A row with no price shows customers "Depends — quotation, or walk in with the item".
export function ServiceSpecEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);

  const setTier = (i: number, p: Partial<PricingTierInput>) =>
    patch({ tiers: d.tiers.map((t, idx) => (idx === i ? { ...t, ...p } : t)) });

  return (
    <div className="space-y-5">
      <div>
        <p className={LABEL}>Prices &amp; add-ons <span className="text-red-600">*</span></p>
        <p className="text-xs text-ink-muted mb-2">
          E.g. &quot;Jusi barong&quot; ₱4,500 or &quot;With collar + jacket&quot; ₱300. Leave the price empty when it depends —
          customers see &quot;Depends — quotation, or walk in with the item&quot;. For a uniform sold as top only, bottom only or a set,
          add one row for each and set Covers and Sold as: the price is per unit, the minimum order counts units, and a set is handed over as two garments.
        </p>
        <div className="space-y-2">
          {d.tiers.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 space-y-2 min-w-0">
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <input value={t.label} onChange={e => setTier(i, { label: e.target.value })} aria-label="Price or add-on" placeholder="e.g. Uniform set (top + bottom)" className={FIELD} />
                  <input type="number" min="0" value={t.amount} onChange={e => setTier(i, { amount: e.target.value })} aria-label="Price" placeholder="₱ or empty" className={FIELD} />
                </div>
                {/* Two separate settings; the same words are shown on the service and on every order made from it. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-muted">{COVERS_FIELD}</span>
                    <select value={t.covers} onChange={e => setTier(i, { covers: e.target.value as PricingTierInput['covers'] })} aria-label={COVERS_FIELD} className={FIELD}>
                      <option value="">{NOT_SET}</option>
                      {(Object.keys(COVERS_LABEL) as Covers[]).map(c => <option key={c} value={c}>{COVERS_LABEL[c]}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-muted">{SOLD_AS_FIELD}</span>
                    <select value={t.sold_as} onChange={e => setTier(i, { sold_as: e.target.value as PricingTierInput['sold_as'] })} aria-label={SOLD_AS_FIELD} className={FIELD}>
                      <option value="">{NOT_SET}</option>
                      {(Object.keys(SOLD_AS_LABEL) as SoldAs[]).map(c => <option key={c} value={c}>{SOLD_AS_LABEL[c]}</option>)}
                    </select>
                  </label>
                </div>
                {t.sold_as === 'set' && t.covers !== 'both' && <p className="text-xs font-medium text-danger">{SET_NEEDS_BOTH}</p>}
              </div>
              <button type="button" onClick={() => patch({ tiers: d.tiers.filter((_, idx) => idx !== i) })} aria-label="Remove row" className="w-11 h-12 shrink-0 flex items-center justify-center text-ink-faint hover:text-danger cursor-pointer">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => patch({ tiers: [...d.tiers, { label: '', amount: '', covers: '', sold_as: '' }] })} className="mt-2 h-11 px-3 text-taupe text-xs font-semibold flex items-center gap-1 cursor-pointer">
          <Plus size={14} /> Add a price or add-on
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
