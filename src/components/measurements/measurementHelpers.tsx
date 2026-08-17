import React from 'react';
import { Metrics } from './measurementTypes';

export const METRIC_FIELDS: { key: string; label: string; group: string }[] = [
  { key: 'bust',          label: 'Bust',           group: 'Upper Body' },
  { key: 'chest',         label: 'Chest',          group: 'Upper Body' },
  { key: 'shoulder',      label: 'Shoulder Width',  group: 'Upper Body' },
  { key: 'neck',          label: 'Neck',            group: 'Upper Body' },
  { key: 'sleeve_length', label: 'Sleeve Length',   group: 'Upper Body' },
  { key: 'back_length',   label: 'Back Length',     group: 'Upper Body' },
  { key: 'waist',         label: 'Waist',           group: 'Lower Body' },
  { key: 'hips',          label: 'Hips',            group: 'Lower Body' },
  { key: 'inseam',        label: 'Inseam',          group: 'Lower Body' },
  { key: 'thigh',         label: 'Thigh',           group: 'Lower Body' },
];

export const UPPER = METRIC_FIELDS.filter(f => f.group === 'Upper Body');
export const LOWER = METRIC_FIELDS.filter(f => f.group === 'Lower Body');

export const emptyMetrics = (): Metrics =>
  Object.fromEntries(METRIC_FIELDS.map(f => [f.key, '']));

export const emptyForm = () => ({
  customer_id: '',
  source: 'shop_owner',
  profile_name: '',
  metrics: emptyMetrics(),
  notes: '',
});

// Custom fields are stored verbatim (e.g. "Sleeve to Wrist"), but legacy
// profiles still use short-code keys (e.g. "sleeve_length") from before
// fields were freely nameable — look those up for a nicer label, otherwise
// just title-case whatever key is actually there.
export function humanizeMetricKey(key: string): string {
  const known = METRIC_FIELDS.find(f => f.key === key);
  if (known) return known.label;
  return key.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function MetricPill({ label, value }: { readonly label: string; readonly value?: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-sunken text-ink-body text-xs px-2.5 py-1 rounded-full font-medium border border-line">
      <span className="text-ink-faint">{label}</span>
      <span className="font-semibold text-ink">{value}&Prime;</span>
    </span>
  );
}

export function CustomerInitial({ name }: { readonly name: string }) {
  const colors = [
    'bg-taupe text-white', 'bg-sage text-white',
    'bg-[#6B7FA8] text-white', 'bg-[#A88B6B] text-white',
  ];
  const idx = (name.codePointAt(0) || 0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colors[idx]}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
