'use client';

import React from 'react';
import { Users, CheckCircle2, Circle, Ruler } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import { Job, RosterItem, CUSTOM_SIZE } from '../jobTypes';

interface JobRosterCardProps {
  job: Job;
  onToggleRosterItem: (index: number) => void;
  /** A completed order: the done marks show but cannot be changed. */
  readOnly?: boolean;
}

export default function JobRosterCard({ job, onToggleRosterItem, readOnly }: JobRosterCardProps) {
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
        <SectionHeader
          icon={Users}
          title="Team Roster & Size Sheet"
          subtitle={(styleCounts.length > 0 || showTeamName) ? (
            <>
              {styleCounts.length > 0 && <p>{styleCounts.map(([k, n]) => `${n} ${k}`).join(' · ')}</p>}
              {showTeamName && <p>Organization: <span className="font-semibold text-ink-body">{teamName}</span></p>}
            </>
          ) : undefined}
          badge={(
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full shrink-0 ${doneCount === teamRoster.length ? 'bg-emerald-500/10 text-emerald-700' : 'bg-sunken text-ink-muted'}`}>
              {doneCount}/{teamRoster.length} Completed
            </span>
          )}
        />

        {customFitCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-500/[0.07] rounded-xl px-3.5 py-3">
            <Ruler size={13} />
            {customFitCount} {customFitCount === 1 ? 'person needs' : 'people need'} to be measured in person before cutting.
          </div>
        )}

        {Object.keys(sizeCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(sizeCounts).map(([size, qty]) => (
              <span key={size} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sunken text-ink">
                {size} <span className="text-ink-muted font-semibold">× {qty}</span>
              </span>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-line">
            <thead>
              <tr className="text-ink-muted font-semibold uppercase tracking-wider text-[10px]">
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
                <tr key={`${row.name}-${row.number}-${idx}`} className={row.completed ? 'bg-emerald-500/[0.06]' : undefined}>
                  <td className="py-2.5">
                    {readOnly ? (
                      row.completed ? <CheckCircle2 size={16} className="text-emerald-600" aria-label="Done" /> : <Circle size={16} className="text-line-strong" aria-label="Not marked" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleRosterItem(idx)}
                        title={row.completed ? 'Mark as pending' : 'Mark as completed'}
                      >
                        {row.completed ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-line-strong" />}
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 text-ink-faint font-mono">{idx + 1}</td>
                  <td className={`py-2.5 font-semibold ${row.completed ? 'text-ink-faint line-through' : 'text-ink'}`}>{row.name || '—'}</td>
                  <td className="py-2.5 text-ink-muted">{row.print_name || '—'}</td>
                  <td className="py-2.5 font-mono text-ink font-semibold">{row.number || '—'}</td>
                  <td className="py-2.5">
                    {row.size === CUSTOM_SIZE ? (
                      <span
                        title="Needs to be measured in person — not one of the service's standard sizes"
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 rounded text-[10px] font-semibold text-amber-700"
                      >
                        <Ruler size={10} /> Custom
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-sunken rounded text-[10px] font-semibold text-ink">{row.size}</span>
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
      <SectionHeader
        icon={Users}
        title="Size Breakdown"
        subtitle={(garmentType || orderPurpose) ? [garmentType, orderPurpose].filter(Boolean).join(' — ') : undefined}
        badge={(
          <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0 bg-sunken text-ink-muted uppercase tracking-wider text-[11px]">
            {total} pcs total
          </span>
        )}
      />
      <div className="flex flex-wrap gap-2">
        {entries.map(([size, qty]) => (
          <span key={size} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sunken text-ink">
            {size} <span className="text-ink-muted font-semibold">× {qty}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
