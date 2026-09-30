'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import type { ServiceField } from '../serviceHelpers';
import type { DraftEdit } from './ServiceEditors';

const ROSTER_PRESETS = ['Jersey Number', 'Position', 'Department', 'Section/Grade'];
const TYPES: { value: ServiceField['type']; label: string }[] = [
  { value: 'text', label: 'Short answer' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Pick one' },
  { value: 'checkbox', label: 'Yes / No' },
];
const newId = () => `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function ServiceBookingEditor({ edit }: Readonly<{ edit: DraftEdit }>) {
  const d = edit.draft!;
  const patch = (p: Partial<typeof d>) => edit.setDraft(prev => (prev ? { ...prev, ...p } : prev));
  const bulk = d.service_types.includes('bulk_sublimation');
  const setQ = (i: number, p: Partial<ServiceField>) => patch({ custom_fields: d.custom_fields.map((f, idx) => (idx === i ? { ...f, ...p } : f)) });
  const addRoster = (label: string) => {
    const l = label.trim();
    if (l && !d.roster_fields.some(f => f.label === l)) patch({ roster_fields: [...d.roster_fields, { id: newId(), label: l, type: 'text', required: false }] });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className={LABEL}>Questions customers answer when they book this service</p>
        <div className="space-y-3">
          {d.custom_fields.map((f, i) => (
            <div key={f.id} className="border border-line p-3 space-y-2">
              <div className="flex items-start gap-2">
                <input value={f.label} onChange={e => setQ(i, { label: e.target.value })} aria-label="Question" placeholder="e.g. Preferred color" className={FIELD} />
                <button type="button" onClick={() => patch({ custom_fields: d.custom_fields.filter((_, idx) => idx !== i) })} aria-label="Remove question" className="w-11 h-12 shrink-0 flex items-center justify-center text-ink-faint hover:text-danger cursor-pointer"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-1 min-[375px]:grid-cols-[1fr_auto] gap-2 items-center">
                <select value={f.type} onChange={e => setQ(i, { type: e.target.value as ServiceField['type'] })} aria-label="Answer type" className={FIELD}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-ink min-h-11 cursor-pointer">
                  <input type="checkbox" checked={f.required} onChange={e => setQ(i, { required: e.target.checked })} className="w-4 h-4 accent-[#6B5346]" /> Required
                </label>
              </div>
              {f.type === 'select' && (
                <input value={(f.options ?? []).join(', ')} onChange={e => setQ(i, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })} aria-label="Choices" placeholder="Choices, separated by commas" className={FIELD} />
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => patch({ custom_fields: [...d.custom_fields, { id: newId(), label: '', type: 'text', required: false }] })} className="mt-2 h-11 px-3 text-taupe text-xs font-semibold flex items-center gap-1 cursor-pointer">
          <Plus size={14} /> Add question
        </button>
      </div>

      {bulk && (
        <div>
          <p className={LABEL}>Team roster columns</p>
          <p className="text-xs text-ink-muted mb-2">Asked per person, next to Name and Size — e.g. a jersey number.</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {d.roster_fields.map(f => (
              <span key={f.id} className="inline-flex items-center gap-1.5 h-9 pl-3 pr-1 border border-line-strong text-sm text-ink">
                {f.label}
                <button type="button" onClick={() => patch({ roster_fields: d.roster_fields.filter(x => x.id !== f.id) })} aria-label={`Remove ${f.label}`} className="w-8 h-8 flex items-center justify-center text-ink-faint hover:text-danger cursor-pointer"><X size={14} /></button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {ROSTER_PRESETS.filter(p => !d.roster_fields.some(f => f.label === p)).map(p => (
              <button key={p} type="button" onClick={() => addRoster(p)} className="h-9 px-3 border border-line text-xs text-ink-muted hover:text-taupe hover:border-taupe cursor-pointer">+ {p}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ServiceBookingView({ customFields, rosterFields }: Readonly<{ customFields?: ServiceField[] | null; rosterFields?: ServiceField[] | null }>) {
  const q = customFields ?? [];
  const r = rosterFields ?? [];
  if (q.length === 0 && r.length === 0) return <p className="text-sm text-ink-faint">No extra questions — customers just pick a date and describe what they need.</p>;
  return (
    <div className="space-y-3 text-sm text-ink">
      {q.length > 0 && <ul className="space-y-1">{q.map((f, i) => <li key={f.id ?? f.label ?? i}>{f.label}{f.required && <span className="text-red-600"> *</span>}</li>)}</ul>}
      {r.length > 0 && <p><span className="text-ink-muted">Roster columns: </span>{r.map(f => f.label).join(', ')}</p>}
    </div>
  );
}
