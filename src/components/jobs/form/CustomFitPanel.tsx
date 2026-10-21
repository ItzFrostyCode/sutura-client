import { useState } from 'react';
import { Plus, Ruler } from 'lucide-react';
import { FIT_PREFIX } from './rosterHelpers';
import type { RosterMember } from './types';

const CELL = 'h-10 w-full rounded-lg border border-espresso/25 bg-white px-2 text-base sm:text-sm text-ink focus:outline-none focus:border-espresso/25 focus:ring-2 focus:ring-espresso/25';

interface Props {
  readonly row: RosterMember;
  readonly who: string;
  /** Measuring points shared by every Custom Fit row. */
  readonly fields: string[];
  readonly onFields: (next: string[]) => void;
  readonly onChange: (patch: Record<string, string>) => void;
}

/** Right under a Custom Fit row: type that person's own measurements instead of picking a standard size. */
export default function CustomFitPanel({ row, who, fields, onFields, onChange }: Props) {
  const [adding, setAdding] = useState('');
  const add = () => {
    const name = adding.trim();
    if (name && !fields.some((f) => f.toLowerCase() === name.toLowerCase())) onFields([...fields, name]);
    setAdding('');
  };

  return (
    <div className="col-span-full space-y-3 border-l-2 border-espresso/25 pl-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-espresso"><Ruler size={15} />Measurements for {who}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {fields.map((f) => (
          <label key={f} className="block">
            <span className="mb-1 block text-sm text-espresso">{f}</span>
            <input inputMode="decimal" value={row[FIT_PREFIX + f] ?? ''} onChange={(e) => onChange({ [FIT_PREFIX + f]: e.target.value })} className={CELL} />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <input aria-label="New measuring point" value={adding} onChange={(e) => setAdding(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add a measuring point, e.g. Hips" className={`${CELL} max-w-60`} />
        <button type="button" onClick={add} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-md border border-espresso/25 bg-white px-4 text-sm font-medium text-espresso hover:bg-espresso/[0.06]"><Plus size={14} />Add</button>
      </div>
    </div>
  );
}
