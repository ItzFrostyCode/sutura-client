import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatBandItem {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Small line under the figure — a qualifier, not a second number. */
  hint?: string;
  /** Highlights the figure. Use sparingly: at most one per band. */
  tone?: 'default' | 'sage' | 'danger';
}

interface StatBandProps {
  readonly items: StatBandItem[];
  /** Columns at ≥sm. Mobile always stacks. */
  readonly columns?: 2 | 3 | 4;
}

const TONE: Record<NonNullable<StatBandItem['tone']>, string> = {
  default: 'text-ink',
  sage: 'text-sage',
  danger: 'text-danger',
};

const COLS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

/**
 * Flush, hairline-divided figure band — one surface with internal rules, not
 * N separate floating cards. Used across list pages for their summary row so
 * every page reads as the same system.
 */
export default function StatBand({ items, columns = 4 }: StatBandProps) {
  return (
    <div className={`grid grid-cols-1 ${COLS[columns]} bg-surface border border-line rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-line overflow-hidden`}>
      {items.map(item => (
        <div key={item.label} className="p-5 flex flex-col justify-between gap-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted truncate">{item.label}</p>
            {item.icon && <item.icon size={15} className="text-ink-faint shrink-0" />}
          </div>
          <div className="min-w-0">
            <p className={`text-figure text-2xl font-semibold break-words ${TONE[item.tone ?? 'default']}`}>
              {item.value}
            </p>
            {item.hint && <p className="text-xs text-ink-faint mt-1 truncate">{item.hint}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
