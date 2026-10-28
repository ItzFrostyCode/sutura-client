import { useState } from 'react';
import { Plus } from 'lucide-react';
import { FIELD } from './FormStep';

/** The "+" at the top right of the team list: opens a small box to name a new column, which lands beside the last column. */
export default function RosterAddColumn({ onAdd, onOpenChange }: Readonly<{ onAdd: (label: string) => void; onOpenChange?: (open: boolean) => void }>) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const toggle = (next: boolean) => { setOpen(next); onOpenChange?.(next); };
  const add = () => { if (label.trim()) onAdd(label.trim()); setLabel(''); toggle(false); };

  return (
    <div className="relative">
      <button type="button" aria-label="Add a column" aria-expanded={open} title="Add a column" onClick={() => toggle(!open)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-espresso/25 bg-white text-espresso hover:bg-espresso/[0.06]"><Plus size={16} /></button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 flex w-72 max-w-[calc(100vw-2rem)] gap-2 rounded-lg border border-espresso/20 bg-white p-2 shadow-lg">
          <input autoFocus aria-label="New column name" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === 'Escape') toggle(false); }} placeholder="Column name, e.g. Height" className={`${FIELD} min-w-0 flex-1`} />
          <button type="button" onClick={add} className="h-11 shrink-0 cursor-pointer rounded-md bg-espresso px-4 text-sm font-medium text-white hover:bg-espresso/90">Add</button>
        </div>
      )}
    </div>
  );
}
