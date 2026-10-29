import { useState } from 'react';
import { Plus } from 'lucide-react';
import MeasureInput from '@/components/measurements/recorder/MeasureInput';
import type { MeasureUnit } from '@/lib/measurementUnit';
import { FIT_PREFIX } from './rosterHelpers';
import type { RosterMember } from './types';

const CELL = 'h-10 w-full rounded-lg border border-espresso/25 bg-white px-2 text-base sm:text-sm text-ink focus:outline-none focus:border-espresso/25 focus:ring-2 focus:ring-espresso/25';

interface Props {
  readonly title?: string;
  readonly points: string[];
  readonly row: RosterMember;
  readonly unit: MeasureUnit;
  readonly onChange: (patch: Record<string, string>) => void;
  /** Adds a point to this part; the panel refuses a name the other part already has. */
  readonly onAdd: (name: string) => void;
}

/** One part of a Custom Fit person (top or bottom): its measuring points as fields, and a box to add another point. */
export default function FitPointGroup({ title, points, row, unit, onChange, onAdd }: Props) {
  const [adding, setAdding] = useState('');
  const add = () => { if (adding.trim()) onAdd(adding.trim()); setAdding(''); };
  return (
    <div className="space-y-3">
      {title && <p className="text-[13px] font-semibold uppercase tracking-wide text-espresso/60">{title}</p>}
      <div className="grid grid-cols-1 gap-3">
        {points.map((f) => (
          <div key={f} className="min-w-0">
            <span className="mb-1 block text-sm text-espresso">{f}</span>
            <MeasureInput label={f} value={row[FIT_PREFIX + f] ?? ''} recordUnit={unit} onChange={(v) => onChange({ [FIT_PREFIX + f]: v })} compact />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input aria-label={`New ${title?.toLowerCase() ?? ''} measuring point`.replace('  ', ' ')} value={adding} onChange={(e) => setAdding(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add a measuring point, e.g. Hips" className={`${CELL} min-w-0 max-w-60 flex-1`} />
        <button type="button" onClick={add} className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-espresso/25 bg-white px-4 text-sm font-medium text-espresso hover:bg-espresso/[0.06]"><Plus size={14} />Add</button>
      </div>
    </div>
  );
}
