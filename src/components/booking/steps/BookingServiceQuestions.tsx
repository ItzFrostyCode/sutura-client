'use client';

import React from 'react';
import type { Service } from '../types';

type Field = NonNullable<Service['custom_fields']>[number];

const INPUT = 'w-full form-input-mobile bg-canvas border border-line rounded-none text-base text-ink font-normal focus:outline-none focus:border-taupe';

// The questions the shop set on this service (Services → Booking Form), answered here
// so the shop has them before the visit. Saved with the booking's other answers.
export default function BookingServiceQuestions({ fields, answers, setAnswers }: Readonly<{
  fields: Field[];
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}>) {
  const set = (label: string, v: string) => setAnswers(prev => ({ ...prev, [label]: v }));
  const shown = fields.filter(f => f.label?.trim());
  if (shown.length === 0) return null;

  return (
    <div className="space-y-3">
      {shown.map((f) => {
        const id = `svc-q-${f.id}`;
        const v = answers[f.label] || '';
        const label = (
          <label htmlFor={id} className="mobile-caption font-semibold text-ink-body mb-1 block">
            {f.label}{f.required && <span className="text-red-600"> *</span>}
          </label>
        );
        if (f.type === 'checkbox') {
          return (
            <label key={f.id} className="flex items-center gap-3 min-h-11 cursor-pointer">
              <input id={id} type="checkbox" checked={v === 'Yes'} onChange={e => set(f.label, e.target.checked ? 'Yes' : 'No')} className="w-5 h-5 accent-[#6B5346]" />
              <span className="text-base text-ink">{f.label}</span>
            </label>
          );
        }
        if ((f.type === 'select' || f.type === 'radio') && (f.options?.length ?? 0) > 0) {
          return (
            <div key={f.id}>
              {label}
              <select id={id} required={f.required} value={v} onChange={e => set(f.label, e.target.value)} className={INPUT}>
                <option value="">Choose…</option>
                {f.options!.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          );
        }
        return (
          <div key={f.id}>
            {label}
            <input id={id} type={f.type === 'number' ? 'number' : 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} required={f.required} value={v} onChange={e => set(f.label, e.target.value)} className={INPUT} />
          </div>
        );
      })}
    </div>
  );
}
