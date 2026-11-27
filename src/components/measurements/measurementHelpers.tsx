import React from 'react';
import { Metrics } from './measurementTypes';
import { MEASUREMENT_LABELS } from '@/lib/garmentMeasurements';

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
  source: 'store_owner',
  profile_name: '',
  status: 'finalized' as 'finalized' | 'pending_fitting',
  metrics: emptyMetrics(),
  notes: '',
  photo_urls: [] as string[],
});

// Custom fields are stored verbatim (e.g. "Sleeve to Wrist"), but legacy
// profiles still use short-code keys (e.g. "sleeve_length") from before
// fields were freely nameable — look those up for a nicer label, otherwise
// just title-case whatever key is actually there.
export function humanizeMetricKey(key: string): string {
  if (MEASUREMENT_LABELS[key]) return MEASUREMENT_LABELS[key];
  const known = METRIC_FIELDS.find(f => f.key === key);
  if (known) return known.label;
  return key.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * A profile's measurements to show, in order. The saved unit and garment ride
 * along in the same list, so they're left out here and the unit is returned.
 */
export function profileMeasurements(metrics: Record<string, string | number | null | undefined> | null | undefined) {
  const m = metrics ?? {};
  const unit: 'in' | 'cm' = m.unit === 'cm' ? 'cm' : 'in';
  const entries: [string, string][] = Object.entries(m)
    .filter(([k, v]) => k !== 'unit' && k !== 'garment' && v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => [k, String(v)]);
  return { unit, entries };
}

export function MetricPill({ label, value, unit = 'in' }: { readonly label: string; readonly value?: string; readonly unit?: 'in' | 'cm' }) {
  if (!value) return null;
  const displayVal = /["'a-zA-Z]/.test(value) ? value : unit === 'cm' ? `${value} cm` : `${value}″`;
  return (
    <span className="inline-flex items-center gap-1.5 bg-sunken text-ink-body text-xs px-2.5 py-1 rounded-full font-medium border border-line shadow-2xs">
      <span className="text-ink-faint font-medium">{label}:</span>
      <span className="font-bold text-ink font-mono">{displayVal}</span>
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
