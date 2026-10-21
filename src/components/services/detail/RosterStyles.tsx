'use client';

import React from 'react';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import type { ServiceField } from '../serviceHelpers';

const STYLE_LABEL = 'Style';
const newId = () => `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * The styles this service offers (polo, V-neck, with jacket…). One design, but each person can wear a different
 * style: it becomes a "Style" dropdown column in the team table. No price here: the shop prices by hand.
 */
export default function RosterStyles({ fields, onChange }: Readonly<{ fields: ServiceField[]; onChange: (next: ServiceField[]) => void }>) {
  const current = fields.find((f) => f.label === STYLE_LABEL && f.type === 'select');
  const set = (text: string) => {
    const options = text.split(',').map((o) => o.trim()).filter(Boolean);
    const rest = fields.filter((f) => f !== current);
    onChange(options.length === 0 ? rest : [...rest, { ...(current ?? { id: newId(), label: STYLE_LABEL, required: false }), type: 'select', options }]);
  };
  return (
    <div>
      <label htmlFor="svc-styles" className={LABEL}>Styles</label>
      <input id="svc-styles" defaultValue={(current?.options ?? []).join(', ')} onBlur={(e) => set(e.target.value)} placeholder="e.g. Polo, V-neck, With jacket" className={FIELD} />
      <p className="mt-1.5 text-[11px] text-ink-faint">Separate them with commas. Each person on an order picks one from a dropdown. The price stays with the shop.</p>
    </div>
  );
}
