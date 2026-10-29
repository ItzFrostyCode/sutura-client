'use client';

import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import {
  GARMENT_CATEGORIES,
  GARMENT_CATEGORY_KEYS,
  GARMENTS,
  SERVICE_GROUPS,
  SERVICE_GROUP_KEYS,
  canonicalGarment,
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
              <input type="radio" name="svc-group" checked={on} onChange={() => pick(key)} className="mt-1 w-4 h-4 accent-taupe-dark" />
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
          ? 'Select the garments you work on. Select none if you take any kind of garment.'
          : 'Select every garment this service makes. Customers who search for them will find this service.'}
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
                <label key={slug} className="flex w-fit max-w-full items-center gap-3 min-h-11 cursor-pointer">
                  <input type="checkbox" checked={chosen.has(slug)} onChange={() => toggle(slug)} className="sr-only" />
                  <Box checked={chosen.has(slug)} />
                  <span className="text-sm text-ink-body">{GARMENTS[slug].label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <OtherGarments value={d.garment_types} onChange={(garment_types) => patch({ garment_types })} />
    </div>
  );
}

/** Garments that are not on the list: the shop types the name. They are kept as typed and SUTURA checks new names. */
function OtherGarments({ value, onChange }: Readonly<{ value: string[]; onChange: (next: string[]) => void }>) {
  const [name, setName] = useState('');
  const typed = value.filter(g => !canonicalGarment(g));
  const clean = name.trim();
  const exists = typed.some(g => g.toLowerCase() === clean.toLowerCase());
  const add = () => {
    if (clean.length < 2 || exists) return;
    onChange([...value, clean]);
    setName('');
  };
  return (
    <fieldset className="border-t border-line pt-3">
      <legend className="sr-only">Other garments</legend>
      <p className="text-sm font-semibold text-ink" aria-hidden>Other garments</p>
      <p className="text-xs text-ink-muted mt-0.5">Not in the list above? Type the garment and add it. Your service uses it right away; SUTURA checks new names.</p>
      {typed.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3">
          {typed.map(g => (
            <li key={g} className="flex items-center gap-1 border border-line bg-canvas pl-3 text-sm text-ink">
              {g}
              <button type="button" aria-label={`Remove ${g}`} onClick={() => onChange(value.filter(x => x !== g))} className="w-9 h-9 flex items-center justify-center text-ink-faint hover:text-danger cursor-pointer"><X size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 mt-3">
        <input
          type="text" maxLength={100} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          aria-label="Other garment name" placeholder="e.g. Kimono, Malong" className={FIELD}
        />
        <button type="button" onClick={add} disabled={clean.length < 2 || exists} className="h-12 shrink-0 px-4 border border-line text-sm font-semibold text-taupe hover:bg-sunken disabled:opacity-40 flex items-center gap-1.5 cursor-pointer">
          <Plus size={14} /> Add
        </button>
      </div>
      {exists && <p className="text-xs text-danger mt-1.5">You already added “{clean}”.</p>}
    </fieldset>
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
        <legend className={LABEL}>What you do — select only what you offer</legend>
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(group.capabilities).map(([slug, cap]) => (
            <label key={slug} className="flex w-fit max-w-full items-center gap-3 min-h-11 cursor-pointer">
              <input type="checkbox" checked={chosen.has(slug)} onChange={() => toggle(slug)} className="sr-only" />
              <Box checked={chosen.has(slug)} />
              <span className="text-sm text-ink-body">{cap.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {chosen.has('bulk_orders') && (
        <div>
          <label htmlFor="svc-minqty" className={LABEL}>Usual minimum order (pieces) <span className="text-red-600">*</span></label>
          <input id="svc-minqty" type="number" min="1" value={d.min_order_qty} onChange={e => patch({ min_order_qty: e.target.value })} className={FIELD} />
          <p className="text-[11px] text-ink-faint mt-1.5">Shown on the service so teams know how many to order. It is a guide, not a rule: the shop can still take a smaller order and is warned when it does. Bulk orders get a team roster.</p>
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
