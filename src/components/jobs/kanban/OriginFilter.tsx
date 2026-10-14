import React from 'react';
import { Scissors, Shirt, Sparkles } from 'lucide-react';

type Origin = 'all' | 'catalog' | 'custom' | 'alteration';

interface OriginFilterProps {
  readonly value: Origin;
  readonly onChange: (v: Origin) => void;
  readonly counts: { all: number; catalog: number; custom: number; alteration: number };
}

/** Where the design came from: a catalog design, a custom one, or an alteration. */
export default function OriginFilter({ value, onChange, counts }: OriginFilterProps) {
  const items = [
    { id: 'all' as const, label: 'All', icon: null },
    { id: 'catalog' as const, label: 'Catalog', icon: <Sparkles size={11} className="text-taupe" /> },
    { id: 'custom' as const, label: 'Custom', icon: <Scissors size={11} /> },
    { id: 'alteration' as const, label: 'Alterations', icon: <Shirt size={11} /> },
  ];
  return (
    <div role="group" aria-label="Design origin" className="hide-scrollbar flex h-9.5 shrink-0 items-center gap-1 overflow-x-auto rounded-lg border border-line bg-canvas p-1">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          aria-pressed={value === i.id}
          onClick={() => onChange(i.id)}
          className={`flex h-7 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[11px] font-bold transition-all ${
            value === i.id ? 'border border-line/80 bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {i.icon}
          <span>{i.label}</span>
          <span className="rounded-full bg-sunken px-1 text-[9px] font-black tabular-nums text-ink-muted">{counts[i.id]}</span>
        </button>
      ))}
    </div>
  );
}
