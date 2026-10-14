'use client';

import React from 'react';
import { Check } from 'lucide-react';
import {
  GARMENT_CATEGORIES,
  GARMENT_CATEGORY_KEYS,
  GARMENTS,
  SERVICE_GROUPS,
  SERVICE_GROUP_KEYS,
  garmentsInCategory,
  type ServiceGroup,
  type ServiceGroupKey,
} from '@/lib/garmentTaxonomy';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import type { DraftEdit } from './ServiceEditors';

const ANY_GARMENT_GROUPS = ['alterations_repairs', 'garment_customization'];
const groupOf = (key: string): ServiceGroup | null =>
  key in SERVICE_GROUPS ? (SERVICE_GROUPS[key as ServiceGroupKey] as ServiceGroup) : null;

const useSet = (edit: DraftEdit) => {
  const { draft, setDraft } = edit;
  return { d: draft!, patch: (p: Partial<NonNullable<typeof draft>>) => setDraft(prev => (prev ? { ...prev, ...p } : prev)) };
};

function Box({ checked }: Readonly<{ checked: boolean }>) {
  return (
    <span className={`w-5 h-5 shrink-0 border flex items-center justify-center ${checked ? 'bg-ink border-ink text-white' : 'border-line-strong bg-surface'}`}>
      {checked && <Check size={12} strokeWidth={3} />}
    </span>
  );
}

/** Step 1 — what kind of work: one of the 4 approved services. */
export function ServiceTypeEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);
  const pick = (key: string) => {
    const allowed = Object.keys(groupOf(key)?.capabilities ?? {});
    patch({ service_category: key, capabilities: d.capabilities.filter(c => allowed.includes(c)) });
  };
  return (
    <fieldset>
      <legend className={LABEL}>What kind of work is this? <span className="text-red-600">*</span></legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICE_GROUP_KEYS.map(key => {
          const g = SERVICE_GROUPS[key];
          const on = d.service_category === key;
          return (
            <label key={key} className={`flex items-start gap-3 p-4 border cursor-pointer min-h-11 ${on ? 'border-ink bg-canvas' : 'border-line hover:border-line-strong'}`}>
              <input type="radio" name="svc-group" checked={on} onChange={() => pick(key)} className="mt-1 w-4 h-4 accent-[#6B5346]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{g.label}</span>
                <span className="block text-xs text-ink-muted mt-0.5">{g.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Step 2 — the garments it works on, grouped by the 10 categories (never one long list). */
export function ServiceGarmentsEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);
  const chosen = new Set(d.garment_types);
  const anyAllowed = ANY_GARMENT_GROUPS.includes(d.service_category);
  const toggle = (slug: string) =>
    patch({ garment_types: chosen.has(slug) ? d.garment_types.filter(g => g !== slug) : [...d.garment_types, slug] });
  const toggleAll = (slugs: string[], on: boolean) =>
    patch({ garment_types: on ? Array.from(new Set([...d.garment_types, ...slugs])) : d.garment_types.filter(g => !slugs.includes(g)) });

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        {anyAllowed
          ? 'Tick the garments you work on — or leave everything unticked if you take any garment.'
          : 'Tick the garments this service makes. Customers searching for them will find it.'}
      </p>
      {GARMENT_CATEGORY_KEYS.filter(c => c !== 'other').map(cat => {
        const slugs = garmentsInCategory(cat);
        const all = slugs.every(s => chosen.has(s));
        const some = slugs.some(s => chosen.has(s));
        return (
          <fieldset key={cat} className="border-t border-line pt-3">
            <legend className="sr-only">{GARMENT_CATEGORIES[cat].label}</legend>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink" aria-hidden>{GARMENT_CATEGORIES[cat].label}</p>
              <button type="button" onClick={() => toggleAll(slugs, !all)} className="min-h-11 px-2 text-xs font-semibold text-taupe hover:text-ink cursor-pointer">
                {all ? 'Clear' : some ? 'Select all' : 'Select all in category'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {slugs.map(slug => (
                <label key={slug} className="flex items-center gap-3 min-h-11 cursor-pointer">
                  <input type="checkbox" checked={chosen.has(slug)} onChange={() => toggle(slug)} className="sr-only" />
                  <Box checked={chosen.has(slug)} />
                  <span className="text-sm text-ink-body">{GARMENTS[slug].label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

/** Step 3 — the specific tasks it offers, and the minimum order when it takes bulk orders. */
export function ServiceCapabilitiesEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const { d, patch } = useSet(edit);
  const group = groupOf(d.service_category);
  if (!group) return <p className="text-sm text-ink-muted">Pick the kind of work first.</p>;
  const chosen = new Set(d.capabilities);
  const toggle = (slug: string) =>
    patch({ capabilities: chosen.has(slug) ? d.capabilities.filter(c => c !== slug) : [...d.capabilities, slug] });

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className={LABEL}>What you do — tick only what you offer</legend>
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(group.capabilities).map(([slug, cap]) => (
            <label key={slug} className="flex items-center gap-3 min-h-11 cursor-pointer">
              <input type="checkbox" checked={chosen.has(slug)} onChange={() => toggle(slug)} className="sr-only" />
              <Box checked={chosen.has(slug)} />
              <span className="text-sm text-ink-body">{cap.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {chosen.has('bulk_orders') && (
        <div>
          <label htmlFor="svc-minqty" className={LABEL}>Minimum order (pieces) <span className="text-red-600">*</span></label>
          <input id="svc-minqty" type="number" min="1" value={d.min_order_qty} onChange={e => patch({ min_order_qty: e.target.value })} className={FIELD} />
          <p className="text-[11px] text-ink-faint mt-1.5">Shown on the service so teams know how many to order. Bulk orders get a team roster.</p>
        </div>
      )}
    </div>
  );
}

/** The detail page's "What you do" box: all three steps together. */
export function ServiceWorkEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  return (
    <div className="space-y-8">
      <ServiceTypeEditor edit={edit} />
      <ServiceCapabilitiesEditor edit={edit} />
      <div>
        <p className={LABEL}>Garments</p>
        <ServiceGarmentsEditor edit={edit} />
      </div>
    </div>
  );
}
