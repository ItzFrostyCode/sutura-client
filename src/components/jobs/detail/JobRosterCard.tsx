'use client';

import React from 'react';
import { Shirt, CheckCircle2, Circle, Ruler } from 'lucide-react';
import { Job, RosterItem, CUSTOM_SIZE } from '../jobTypes';

interface JobRosterCardProps {
  job: Job;
  onToggleRosterItem: (index: number) => void;
}

export default function JobRosterCard({ job, onToggleRosterItem }: JobRosterCardProps) {
  const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;

  // Render Personalized Team Roster if present
  if (teamRoster && teamRoster.length > 0) {
    const doneCount = teamRoster.filter(r => r.completed).length;
    const customFitCount = teamRoster.filter(r => r.size === CUSTOM_SIZE).length;
    const sizeCounts = teamRoster.reduce<Record<string, number>>((acc, r) => {
      if (r.size) acc[r.size] = (acc[r.size] || 0) + 1;
      return acc;
    }, {});

    const knownRosterKeys = new Set(['name', 'print_name', 'number', 'size', 'completed']);
    const extraColumns = Array.from(
      teamRoster.reduce((set, row) => {
        Object.keys(row as unknown as Record<string, unknown>).forEach(k => {
          if (!knownRosterKeys.has(k)) set.add(k);
        });
        return set;
      }, new Set<string>())
    );

    // The names the owner gave the columns when the order was written up.
    const specColumns = (job.custom_order_data?.spec_table as { columns?: { key: string; label: string; type?: string }[] } | undefined)?.columns ?? [];
    // "12 Polo · 5 With jacket": how many of each style, when the order has a Style dropdown column.
    const styleKey = specColumns.find((c) => c.type === 'select' && /style/i.test(c.label))?.key;
    const styleCounts = styleKey
      ? Object.entries(teamRoster.reduce<Record<string, number>>((acc, r) => { const v = String((r as unknown as Record<string, unknown>)[styleKey] ?? '').trim(); if (v) acc[v] = (acc[v] || 0) + 1; return acc; }, {}))
      : [];
    const labelOf = (key: string, fallback: string) => specColumns.find((c) => c.key === key || (key === 'name' && c.key === 'player_name'))?.label ?? fallback;
    const teamName = job.custom_order_data?.team_name as string | undefined;
    const showTeamName = Boolean(teamName && teamName !== job.catalog_item?.name);

    return (
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Shirt size={17} className="text-taupe" /> Team Roster & Size Sheet
            </h2>
            {styleCounts.length > 0 && <p className="text-xs text-ink-muted mt-0.5">{styleCounts.map(([k, n]) => `${n} ${k}`).join(' · ')}</p>}
            {showTeamName && (
              <p className="text-xs text-ink-muted mt-0.5">
                Organization: <span className="font-semibold text-ink-body">{teamName}</span>
              </p>
            )}
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${doneCount === teamRoster.length ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sunken text-ink-muted border border-line'}`}>
            {doneCount}/{teamRoster.length} Completed
          </span>
        </div>

        {customFitCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Ruler size={13} />
            {customFitCount} {customFitCount === 1 ? 'person needs' : 'people need'} to be measured in person before cutting.
          </div>
        )}

        {Object.keys(sizeCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(sizeCounts).map(([size, qty]) => (
              <span key={size} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-canvas border border-line text-ink">
                {size} <span className="text-ink-muted font-semibold">× {qty}</span>
              </span>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-line">
            <thead>
              <tr className="text-ink-muted font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5 w-10">Done</th>
                <th className="pb-2.5 w-12">#</th>
                <th className="pb-2.5">{labelOf('name', 'Player / Staff Name')}</th>
                <th className="pb-2.5">{labelOf('print_name', 'Print Name')}</th>
                <th className="pb-2.5 w-20">{labelOf('number', 'Number')}</th>
                <th className="pb-2.5 w-20">{labelOf('size', 'Size')}</th>
                {extraColumns.map(col => (
                  <th key={col} className="pb-2.5">{labelOf(col, col)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {teamRoster.map((row, idx: number) => (
                <tr key={`${row.name}-${row.number}-${idx}`} className={row.completed ? 'bg-emerald-50/40' : undefined}>
                  <td className="py-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleRosterItem(idx)}
                      title={row.completed ? 'Mark as pending' : 'Mark as completed'}
                    >
                      {row.completed ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-line-strong" />}
                    </button>
                  </td>
                  <td className="py-2.5 text-ink-faint font-mono">{idx + 1}</td>
                  <td className={`py-2.5 font-bold ${row.completed ? 'text-ink-faint line-through' : 'text-ink'}`}>{row.name || '—'}</td>
                  <td className="py-2.5 text-ink-muted">{row.print_name || '—'}</td>
                  <td className="py-2.5 font-mono text-ink font-bold">{row.number || '—'}</td>
                  <td className="py-2.5">
                    {row.size === CUSTOM_SIZE ? (
                      <span
                        title="Needs to be measured in person — not one of the service's standard sizes"
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold text-amber-700"
                      >
                        <Ruler size={10} /> Custom
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-canvas border border-line rounded text-[10px] font-bold text-ink">{row.size}</span>
                    )}
                  </td>
                  {extraColumns.map(col => (
                    <td key={col} className="py-2.5 text-ink-muted">
                      {(row as unknown as Record<string, unknown>)[col] as string || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Otherwise check for non-personalized Bulk Size Breakdown
  const sizeBreakdown = job.custom_order_data?.size_breakdown as Record<string, number> | undefined;
  if (!sizeBreakdown || typeof sizeBreakdown !== 'object') return null;
  const entries = Object.entries(sizeBreakdown).filter(([, qty]) => Number(qty) > 0);
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, qty]) => sum + Number(qty), 0);
  const garmentType = job.custom_order_data?.garment_type as string | undefined;
  const orderPurpose = job.custom_order_data?.order_purpose as string | undefined;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Shirt size={17} className="text-taupe" /> Size Breakdown
          </h2>
          {(garmentType || orderPurpose) && (
            <p className="text-xs text-ink-muted mt-0.5">
              {[garmentType, orderPurpose].filter(Boolean).join(' — ')}
            </p>
          )}
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0 bg-sunken text-ink-muted border border-line">
          {total} pcs total
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map(([size, qty]) => (
          <span key={size} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-canvas border border-line text-ink">
            {size} <span className="text-ink-muted font-semibold">× {qty}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
