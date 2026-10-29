import React from 'react';
import { unitOfMetrics, withUnit } from '@/lib/measurementUnit';
import { Ruler } from 'lucide-react';
import { MeasurementProfile } from '../customerTypes';

interface CustomerMeasurementsCardProps {
  readonly measurements: MeasurementProfile[];
  readonly onManage: () => void;
}

const KNOWN_LABELS: Record<string, string> = {
  chest: 'Chest',
  waist: 'Waist',
  hip: 'Hip',
  shoulder: 'Shoulder',
  sleeve: 'Sleeve',
  neck: 'Neck',
  inseam: 'Inseam',
  thigh: 'Thigh',
  shirt_length: 'Shirt Length',
  pant_length: 'Pant Length',
  bust: 'Bust',
  back_length: 'Back Length',
};

/** A quick look at the client's recorded measurement profiles; the Measurements & Specs tab holds all of them. */
export default function CustomerMeasurementsCard({ measurements, onManage }: CustomerMeasurementsCardProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2.5">
          <Ruler size={17} className="text-taupe shrink-0" />
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink">Body Measurements</h3>
            <p className="text-[11px] text-ink-muted">Anatomical specs recorded for this client</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="text-xs font-bold text-taupe hover:text-ink transition-colors cursor-pointer"
        >
          {measurements.length > 0 ? 'Manage →' : 'Add +'}
        </button>
      </div>

      {measurements.length === 0 ? (
        <div className="p-5 rounded-xl bg-canvas/40 border border-dashed border-line flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted mb-2 shadow-2xs">
            <Ruler size={15} />
          </div>
          <span className="text-xs font-bold text-ink">No measurements recorded yet.</span>
          <p className="text-[11px] text-ink-muted max-w-[240px] mt-0.5 mb-3.5">
            Chest, sleeve length, shoulder, waist, and inseam specs are recorded on a job order.
          </p>
          <button
            type="button"
            onClick={onManage}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-espresso hover:bg-espresso/90 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Ruler size={13} /> Record Specs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {measurements.slice(0, 2).map((m) => {
            const entries = Object.entries(m.metrics || {}).filter(([k, v]) => Boolean(v) && !k.startsWith('_'));
            return (
              <div key={m.id} className="p-3.5 bg-canvas border border-line rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">{m.profile_name}</span>
                  <span className="text-[10px] font-bold text-ink-muted bg-sunken px-2 py-0.5 rounded border border-line uppercase tracking-wider">
                    {entries.length} spec{entries.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {entries.slice(0, 6).map(([k, v]) => (
                    <div key={k} className="h-14 bg-surface border border-line rounded-lg p-2 flex flex-col justify-center text-center shadow-2xs">
                      <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider truncate">
                        {KNOWN_LABELS[k] ?? k.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs font-black font-mono text-ink mt-0.5 tabular-nums">
                        {withUnit(v, unitOfMetrics(m.metrics))}
                      </p>
                    </div>
                  ))}
                </div>

                {entries.length > 6 && (
                  <p className="text-[10px] text-ink-muted text-center font-medium">
                    +{entries.length - 6} more specs in profile
                  </p>
                )}
              </div>
            );
          })}

          {measurements.length > 2 && (
            <button
              type="button"
              onClick={onManage}
              className="w-full py-2.5 text-center text-xs text-taupe font-bold hover:text-ink cursor-pointer border border-line rounded-xl bg-canvas hover:bg-sunken transition-colors"
            >
              View all {measurements.length} profiles →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
