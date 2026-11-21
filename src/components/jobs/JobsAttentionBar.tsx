'use client';

import React from 'react';
import { ATTENTION_FILTERS, type AttentionKey } from './boardAttention';
import type { Staff } from '@/components/staff/staffHelpers';

const TONE: Record<'red' | 'amber' | 'plain', string> = {
  red: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-800',
  plain: 'bg-sunken text-ink',
};

interface Props {
  counts: Record<AttentionKey, number>;
  active: AttentionKey | null;
  onToggle: (key: AttentionKey) => void;
  /** Owner / branch manager: filter the board to one tailor's orders. */
  staffList?: Staff[];
  staffFilter?: string;
  onStaffFilter?: (value: string) => void;
  shownCount: number;
  totalCount: number;
  onClear: () => void;
}

/**
 * "Needs attention" row above the Orders board: one chip per problem with its
 * count. A chip filters the board to those orders; clicking it again clears it.
 */
export default function JobsAttentionBar({
  counts, active, onToggle, staffList, staffFilter = 'all', onStaffFilter, shownCount, totalCount, onClear,
}: Props) {
  const filtered = active !== null || staffFilter !== 'all';
  return (
    <div className="px-4 sm:px-5 py-3 border-b border-line flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-ink-body mr-1">Needs attention</span>
      {ATTENTION_FILTERS.map((f) => {
        const on = active === f.key;
        const count = counts[f.key];
        return (
          <button
            key={f.key}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(f.key)}
            className={`h-9 pl-3 pr-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-taupe/40 ${
              on ? 'bg-ink border-ink text-white' : `bg-surface border-line hover:border-line-strong ${count === 0 ? 'text-ink-muted' : 'text-ink'}`
            }`}
          >
            {f.label}
            <span className={`min-w-6 h-6 px-1.5 rounded-full inline-flex items-center justify-center text-[11px] font-bold tabular-nums ${on ? 'bg-white/20 text-white' : TONE[f.tone]}`}>
              {count}
            </span>
          </button>
        );
      })}

      {staffList && onStaffFilter && (
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-body sm:ml-auto">
          Assigned to
          <select
            value={staffFilter}
            onChange={(e) => onStaffFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg border border-line bg-surface text-xs font-semibold text-ink focus:outline-none focus:border-taupe cursor-pointer"
          >
            <option value="all">Everyone</option>
            <option value="none">Unassigned</option>
            {staffList.map((s) => {
              const id = s.user_id ?? s.user?.id;
              return id ? <option key={id} value={String(id)}>{s.user?.name ?? `Staff #${id}`}</option> : null;
            })}
          </select>
        </label>
      )}

      {filtered && (
        <span className="flex items-center gap-2 text-xs text-ink-muted">
          Showing {shownCount} of {totalCount}
          <button type="button" onClick={onClear} className="h-9 px-1 font-bold text-taupe-dark underline">
            Clear
          </button>
        </span>
      )}
    </div>
  );
}
