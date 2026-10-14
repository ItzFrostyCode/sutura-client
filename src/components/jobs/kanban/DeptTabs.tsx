import React from 'react';
import { LayoutGrid, Layers, Scissors, Shirt, Sparkles, type LucideIcon } from 'lucide-react';
import { DEPT_TABS, type DeptKey } from './kanbanConfig';

const ICONS: Record<DeptKey | 'all', LucideIcon> = {
  all: LayoutGrid, men: Shirt, women: Sparkles, children: Layers, service: Scissors, other: Layers,
};

interface DeptTabsProps {
  readonly value: 'all' | DeptKey;
  readonly onChange: (v: 'all' | DeptKey) => void;
  readonly counts: Record<string, number>;
  readonly total: number;
}

/** MEN / WOMEN / KIDS / SERVICE — the same departments as the storefront header, with live counts. */
export default function DeptTabs({ value, onChange, counts, total }: DeptTabsProps) {
  const tabs = [{ id: 'all' as const, label: 'ALL', title: 'View all job orders', count: total }, ...DEPT_TABS.map((t) => ({ ...t, count: counts[t.id] ?? 0 }))];
  return (
    <nav aria-label="Departments" className="hide-scrollbar flex h-9.5 items-center gap-1 overflow-x-auto rounded-lg border border-line bg-canvas p-1">
      {tabs.map((t) => {
        const Icon = ICONS[t.id];
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            title={t.title}
            aria-pressed={active}
            onClick={() => onChange(t.id)}
            className={`flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[11px] font-bold tracking-wide transition-all ${
              active ? 'border border-line/80 bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Icon size={12} className={active ? 'text-taupe' : ''} />
            {t.label}
            <span className={`rounded-full px-1.5 text-[10px] font-black tabular-nums ${active ? 'bg-taupe text-white' : 'bg-sunken text-ink-muted'}`}>{t.count}</span>
          </button>
        );
      })}
    </nav>
  );
}
