import React from 'react';
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

export default function CustomerMeasurementsCard({
  measurements,
  onManage,
}: CustomerMeasurementsCardProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex justify-between items-center border-b border-line pb-4 min-h-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
            <Ruler size={15} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Body Measurements</h3>
            <p className="text-[11px] text-ink-muted">All values in inches (″)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="text-xs font-bold text-taupe hover:underline cursor-pointer"
        >
          {measurements.length > 0 ? 'Manage →' : 'Add →'}
        </button>
      </div>

      {measurements.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-line rounded-xl bg-canvas/40 space-y-2">
          <Ruler size={22} className="mx-auto text-ink-faint opacity-40" />
          <p className="text-xs text-ink-faint">No measurements recorded yet.</p>
          <button
            type="button"
            onClick={onManage}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-taupe text-white px-3.5 py-2 rounded-xl hover:bg-taupe-hover transition-colors cursor-pointer shadow-2xs"
          >
            <Ruler size={12} /> Record Specs
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {measurements.slice(0, 2).map((m) => {
            const entries = Object.entries(m.metrics || {});
            return (
              <div key={m.id} className="p-3.5 bg-canvas border border-line rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider">{m.profile_name}</span>
                  <span className="text-[9px] font-bold text-taupe bg-taupe/10 px-2 py-0.5 rounded border border-taupe/20 uppercase tracking-wider">
                    Profile #{m.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {entries.slice(0, 6).map(([k, v]) => (
                    <div key={k} className="h-14 bg-surface border border-line rounded-lg p-2 flex flex-col justify-center text-center shadow-2xs">
                      <p className="text-[9px] text-ink-muted font-bold uppercase tracking-wider truncate">
                        {KNOWN_LABELS[k] ?? k.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs font-black font-mono text-ink mt-0.5">
                        {String(v)}
                        <span className="text-[9px] font-normal text-ink-faint ml-0.5">″</span>
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
              className="w-full py-2.5 text-center text-xs text-taupe font-bold hover:underline cursor-pointer border border-line rounded-xl bg-canvas hover:bg-surface transition-colors shadow-2xs"
            >
              View all {measurements.length} profiles →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
