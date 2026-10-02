'use client';

import React from 'react';
import { PERIODS, prettyDate, type PeriodId } from './periods';
import { KIND_OPTIONS, type Kind } from './useStatements';

interface Props {
  readonly period: PeriodId;
  readonly onPeriod: (p: PeriodId) => void;
  readonly from: string;
  readonly to: string;
  readonly onCustom: (range: [string, string]) => void;
  readonly kinds: Kind[];
  readonly onKind: (k: Kind) => void;
  readonly firstRecord: string | null;
}

const chip = (on: boolean) => `min-h-11 px-3 border text-sm cursor-pointer whitespace-nowrap ${on ? 'border-taupe bg-sunken font-semibold text-ink' : 'border-line-strong bg-white text-ink-body hover:bg-sunken'}`;
const groups = [...new Set(PERIODS.map((p) => p.group))];

// Weekly / bi-weekly / monthly / yearly presets, "All time" from the first record, or any custom dates.
export default function StatementFilters({ period, onPeriod, from, to, onCustom, kinds, onKind, firstRecord }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g} className="flex flex-wrap items-center gap-2">
            <span className="w-20 shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{g}</span>
            {PERIODS.filter((p) => p.group === g).map((p) => (
              <button key={p.id} type="button" onClick={() => onPeriod(p.id)} aria-pressed={period === p.id} className={chip(period === p.id)}>{p.label}</button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col min-[600px]:flex-row min-[600px]:items-end gap-3">
        <label className="flex-1 text-xs font-bold uppercase tracking-wider text-ink">From
          <input type="date" value={from} max={to} onChange={(e) => onCustom([e.target.value, to])} className="mt-2 block w-full h-12 px-3.5 bg-surface border border-line text-base font-normal normal-case tracking-normal" />
        </label>
        <label className="flex-1 text-xs font-bold uppercase tracking-wider text-ink">To
          <input type="date" value={to} min={from} onChange={(e) => onCustom([from, e.target.value])} className="mt-2 block w-full h-12 px-3.5 bg-surface border border-line text-base font-normal normal-case tracking-normal" />
        </label>
      </div>
      <p className="text-xs text-ink-muted">
        {prettyDate(from)} to {prettyDate(to)}{firstRecord ? ` · your records start ${prettyDate(firstRecord)}` : ''}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Record types">
        {KIND_OPTIONS.map((k) => (
          <button key={k.id} type="button" onClick={() => onKind(k.id)} aria-pressed={kinds.includes(k.id)} className={chip(kinds.includes(k.id))}>{k.label}</button>
        ))}
      </div>
    </div>
  );
}
