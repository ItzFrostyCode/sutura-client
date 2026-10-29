'use client';

import React from 'react';
import { Users, CheckCircle2, Circle, Ruler } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import { Job, RosterItem } from '../jobTypes';
import type { RosterMember } from '../form/types';
import { AREA_LABEL, areaOf, customParts, sizeSummary } from '../form/rosterHelpers';

interface TeamListCardProps {
  readonly job: Job;
  readonly onToggle: (index: number) => void;
  /** A completed order: the done marks show but cannot be changed. */
  readonly readOnly?: boolean;
  /** "Edit team list", while the order can still be changed. */
  readonly action?: React.ReactNode;
}

type Row = Record<string, unknown> & RosterItem;

/** Kept on each person but not shown as a column: the done mark, the pieces (own column), the profile link and raw points. */
const HIDDEN = new Set(['name', 'size', 'qty', 'completed', 'measurement_id', 'fit_metrics', 'measure_area', 'bottom_size', 'id']);

const text = (v: unknown) => String(v ?? '').trim();
const piecesOf = (r: Row) => Math.max(1, Number.parseInt(text(r.qty) || '1', 10) || 1);
const measured = (r: Row) => Boolean(text(r.measurement_id) || text(r.fit));

function SizeBadge({ row }: Readonly<{ row: Row }>) {
  const person = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? v : ''])) as RosterMember;
  const area = areaOf(person);
  const covers = area ? `${AREA_LABEL[area]} · ` : '';
  if (customParts(person).length === 0) return <span className="rounded bg-sunken px-2 py-0.5 text-[11px] font-semibold text-ink">{covers}{sizeSummary(person) || '—'}</span>;
  return measured(row)
    ? <span className="inline-flex items-center gap-1 rounded bg-sunken px-2 py-0.5 text-[11px] font-semibold text-ink"><Ruler size={10} /> {covers}Custom · measured</span>
    : <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700"><Ruler size={10} /> {covers}Custom · to measure</span>;
}

/**
 * The one place a group order's people are shown on the order page: name, size (a standard size, or Custom Fit with or
 * without measurements), pieces and the order's own extra columns, with a done mark per person. Cards on phones, a table
 * on wider screens. Editing happens in the team list editor this card opens ("Edit team list").
 */
export default function TeamListCard({ job, onToggle, readOnly, action }: TeamListCardProps) {
  const roster = ((job.custom_order_data?.team_roster || job.custom_order_data?.roster) as Row[] | undefined) ?? [];
  if (roster.length === 0) return null;

  const specColumns = (job.custom_order_data?.spec_table as { columns?: { key: string; label: string; type?: string }[] } | undefined)?.columns ?? [];
  const labelOf = (key: string, fallback: string) => specColumns.find((c) => c.key === key || (key === 'name' && c.key === 'player_name'))?.label ?? fallback;
  // Extra columns only when someone has a value in them (a polo team has no printed name or number).
  const extras = Array.from(new Set(roster.flatMap((r) => Object.keys(r)))).filter((k) => !HIDDEN.has(k) && !k.startsWith('fit_') && roster.some((r) => text(r[k])));

  const done = roster.filter((r) => r.completed).length;
  const pieces = roster.reduce((sum, r) => sum + piecesOf(r), 0);
  const toMeasure = roster.filter((r) => customParts(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'string' ? v : ''])) as RosterMember).length > 0 && !measured(r)).length;
  const bySize = roster.reduce<Record<string, number>>((acc, r) => { if (r.size) acc[r.size] = (acc[r.size] || 0) + piecesOf(r); return acc; }, {});
  const teamName = text(job.custom_order_data?.team_name);

  const Tick = ({ row, idx }: Readonly<{ row: Row; idx: number }>) => (readOnly ? (
    row.completed ? <CheckCircle2 size={18} className="text-emerald-600" aria-label="Done" /> : <Circle size={18} className="text-line-strong" aria-label="Not done" />
  ) : (
    <button type="button" onClick={() => onToggle(idx)} aria-label={row.completed ? `Mark ${row.name || `person ${idx + 1}`} as not done` : `Mark ${row.name || `person ${idx + 1}`} as done`} className="flex h-11 w-11 cursor-pointer items-center justify-center sm:h-8 sm:w-8">
      {row.completed ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-line-strong" />}
    </button>
  ));

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6" aria-label="Team list">
      <SectionHeader
        icon={Users}
        title="Team list"
        subtitle={`${roster.length} ${roster.length === 1 ? 'person' : 'people'} · ${pieces} ${pieces === 1 ? 'piece' : 'pieces'}${teamName ? ` · ${teamName}` : ''}`}
        badge={<span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${done === roster.length ? 'bg-emerald-500/10 text-emerald-700' : 'bg-sunken text-ink-muted'}`}>{done}/{roster.length} done</span>}
        actions={action}
      />

      {toMeasure > 0 && (
        <p className="flex items-center gap-1.5 rounded-xl bg-amber-500/[0.07] px-3.5 py-3 text-[13px] font-medium text-amber-800">
          <Ruler size={13} className="shrink-0" />{toMeasure} {toMeasure === 1 ? 'person' : 'people'} on Custom Fit still {toMeasure === 1 ? 'needs' : 'need'} measurements.
        </p>
      )}
      {Object.keys(bySize).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(bySize).map(([size, n]) => <span key={size} className="rounded-lg bg-sunken px-2.5 py-1 text-xs font-semibold text-ink">{size} <span className="text-ink-muted">× {n}</span></span>)}
        </div>
      )}

      {/* Phones: one card per person. */}
      <ul className="space-y-2 sm:hidden">
        {roster.map((r, idx) => (
          <li key={`m-${idx}`} className={`rounded-xl border border-line p-3 ${r.completed ? 'bg-emerald-500/[0.05]' : ''}`}>
            <div className="flex items-center gap-2">
              <Tick row={r} idx={idx} />
              <p className={`min-w-0 flex-1 truncate text-[15px] font-semibold ${r.completed ? 'text-ink-faint line-through' : 'text-ink'}`}>{idx + 1}. {r.name || '—'}</p>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 pl-1 text-[13px]">
              <dt className="text-ink-muted">{labelOf('size', 'Size')}</dt><dd><SizeBadge row={r} /></dd>
              <dt className="text-ink-muted">{labelOf('qty', 'Pieces')}</dt><dd className="text-ink">{piecesOf(r)}</dd>
              {extras.map((k) => <React.Fragment key={k}><dt className="text-ink-muted">{labelOf(k, k)}</dt><dd className="break-words text-ink">{text(r[k]) || '—'}</dd></React.Fragment>)}
            </dl>
          </li>
        ))}
      </ul>

      {/* Wider screens: a table. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full divide-y divide-line text-left text-[13px]">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              <th className="w-10 pb-2.5">Done</th>
              <th className="w-10 pb-2.5">#</th>
              <th className="pb-2.5">{labelOf('name', 'Name')}</th>
              <th className="pb-2.5">{labelOf('size', 'Size')}</th>
              <th className="w-20 pb-2.5">{labelOf('qty', 'Pieces')}</th>
              {extras.map((k) => <th key={k} className="pb-2.5">{labelOf(k, k)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {roster.map((r, idx) => (
              <tr key={`t-${idx}`} className={r.completed ? 'bg-emerald-500/[0.06]' : undefined}>
                <td className="py-2"><Tick row={r} idx={idx} /></td>
                <td className="py-2 font-mono text-ink-faint">{idx + 1}</td>
                <td className={`py-2 font-semibold ${r.completed ? 'text-ink-faint line-through' : 'text-ink'}`}>{r.name || '—'}</td>
                <td className="py-2"><SizeBadge row={r} /></td>
                <td className="py-2 text-ink">{piecesOf(r)}</td>
                {extras.map((k) => <td key={k} className="py-2 text-ink-muted">{text(r[k]) || '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
