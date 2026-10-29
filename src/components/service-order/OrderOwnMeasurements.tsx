'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { BOTTOM_FIELDS, TOP_FIELDS, type IndividualMeasurements, type ServiceOrderState } from './useServiceOrder';

type Field = { label: string; hint: string; optional?: boolean };
const FIELDS: Record<string, Field> = {
  chest: { label: 'Chest / Bust', hint: '38' },
  shoulders: { label: 'Shoulders', hint: '17.5' },
  sleeve: { label: 'Sleeve', hint: '24', optional: true },
  neck: { label: 'Neck', hint: '15.5', optional: true },
  length: { label: 'Shirt length', hint: '29' },
  waist: { label: 'Waist', hint: '32' },
  hips: { label: 'Hips', hint: '40' },
  inseam: { label: 'Inseam / Outseam', hint: '31', optional: true },
};
const INPUT = 'w-full h-[48px] bg-canvas border border-line rounded-none px-3 text-base text-ink tabular-nums focus:outline-none focus:border-taupe placeholder:text-ink-faint';

function Group({ o, title, keys }: Readonly<{ o: ServiceOrderState; title?: string; keys: readonly string[] }>) {
  return (
    <div className="space-y-2">
      {title && <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>}
      <div className="grid grid-cols-1 gap-3">
        {keys.map((k) => (
          <div key={k}>
            <label htmlFor={`m-${k}`} className={`block mobile-caption mb-1 ${FIELDS[k].optional ? 'text-ink-muted' : 'font-semibold text-ink-body'}`}>
              {FIELDS[k].label}{FIELDS[k].optional && ' (optional)'}
            </label>
            <input
              id={`m-${k}`} type="number" inputMode="decimal" step="0.25" min="0" value={o.measurements[k as keyof IndividualMeasurements]}
              onChange={(e) => o.setMeasurements((prev) => ({ ...prev, [k]: e.target.value }))} placeholder={FIELDS[k].hint} className={INPUT}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** "Enter my measurements": only the part that was chosen first (top, bottom or both), one field per row, then the unit and an optional card photo. */
export default function OrderOwnMeasurements({ o }: Readonly<{ o: ServiceOrderState }>) {
  return (
    <div className="space-y-5 bg-surface border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Body measurements</p>
        <div className="flex border border-line" role="radiogroup" aria-label="Unit">
          {(['in', 'cm'] as const).map((u) => (
            <button key={u} type="button" role="radio" aria-checked={o.measurements.unit === u} onClick={() => o.setMeasurements((p) => ({ ...p, unit: u }))}
              className={`h-9 px-3 text-xs font-semibold transition-colors ${o.measurements.unit === u ? 'bg-taupe text-white' : 'text-ink-muted hover:text-ink'}`}>
              {u === 'in' ? 'Inches' : 'Centimeters'}
            </button>
          ))}
        </div>
      </div>
      {o.area !== 'bottom' && <Group o={o} title={o.area === 'both' ? 'Top' : undefined} keys={TOP_FIELDS} />}
      {o.area !== 'top' && <Group o={o} title={o.area === 'both' ? 'Bottom' : undefined} keys={BOTTOM_FIELDS} />}
      <div className="space-y-2">
        <p className="mobile-caption font-semibold text-ink-body">Measurement card photo <span className="text-ink-faint font-normal">(optional)</span></p>
        <div className="flex flex-wrap gap-2">
          {o.sheets.map((url) => (
            <div key={url} className="relative w-20 h-20 border border-line overflow-hidden bg-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getMediaUrl(url)} alt="Measurement card" className="w-full h-full object-cover" />
              <button type="button" onClick={() => o.setSheets((p) => p.filter((u) => u !== url))} aria-label="Remove photo" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink/75 text-white flex items-center justify-center"><X size={12} /></button>
            </div>
          ))}
          {o.sheets.length < o.maxPhotos && (
            <label className="w-20 h-20 border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-ink-faint cursor-pointer hover:border-taupe/50 hover:text-taupe transition-colors focus-within:border-taupe">
              {o.uploadingSheet ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
              <span className="text-[11px] font-medium">{o.uploadingSheet ? 'Uploading' : 'Add'}</span>
              <input type="file" accept="image/*" className="sr-only" disabled={o.uploadingSheet} onChange={(e) => { const f = e.target.files?.[0]; if (f) void o.uploadSheet(f); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>
      <p className="mobile-caption text-ink-muted">The shop checks these at your fitting before cutting.</p>
    </div>
  );
}
