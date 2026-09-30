import React from 'react';
import { Plus, X } from 'lucide-react';
import { BulletItem } from '../catalogTypes';

interface SpecificationBulletsEditorProps {
  readonly features: BulletItem[];
  readonly setFeatures: React.Dispatch<React.SetStateAction<BulletItem[]>>;
}

const INPUT = 'w-full h-11 px-3 bg-surface border border-line text-ink text-base focus:outline-none focus:border-taupe';

// Extra Specification rows: the owner names the first column (e.g. "Fit") and
// fills in the second (e.g. "Regular") — the same two-column table the
// customer sees.
export function SpecificationBulletsEditor({ features, setFeatures }: SpecificationBulletsEditorProps) {
  // The blank starter row from an empty design isn't shown until it is used.
  const rows = features.filter(f => f.id !== 'init' || f.text || f.value);

  const update = (id: string, patch: Partial<BulletItem>) =>
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Extra rows</p>
        <button
          type="button"
          onClick={() => setFeatures(prev => [...prev, { id: Math.random().toString(), text: '', value: '' }])}
          className="h-11 px-3 text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1 cursor-pointer"
        >
          <Plus size={14} /> Add row
        </button>
      </div>

      {rows.map(feat => (
        <div key={feat.id} className="flex items-start gap-2">
          <div className="flex-1 grid grid-cols-[40%_1fr] gap-2 min-w-0">
            <input
              value={feat.text}
              onChange={e => update(feat.id, { text: e.target.value })}
              aria-label="Row name (first column)"
              placeholder="e.g. Fit"
              className={INPUT}
            />
            <input
              value={feat.value ?? ''}
              onChange={e => update(feat.id, { value: e.target.value })}
              aria-label="Row value (second column)"
              placeholder="e.g. Regular"
              className={INPUT}
            />
          </div>
          <button
            type="button"
            onClick={() => setFeatures(prev => prev.filter(f => f.id !== feat.id))}
            aria-label="Remove row"
            className="w-11 h-11 shrink-0 flex items-center justify-center text-ink-faint hover:text-danger transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
