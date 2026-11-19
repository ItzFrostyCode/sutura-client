'use client';

import React from 'react';
import { Shirt, CheckCircle2, Circle, Ruler } from 'lucide-react';
import { Job, RosterItem } from '../jobTypes';
import { CUSTOM_SIZE } from '@/components/store-catalog-detail/BulkOrderSheet';
import { MEASUREMENT_FIELDS, MEASUREMENT_LABELS } from '@/lib/garmentMeasurements';

interface JobRosterCardProps {
  job: Job;
  onToggleRosterItem: (index: number) => void;
}

// Roster table cells: even spacing between columns, one-line headers (the table scrolls sideways instead).
const TH = 'pb-2.5 pr-5 last:pr-0 whitespace-nowrap';
const TD = 'py-2.5 pr-5 last:pr-0 whitespace-nowrap';
/** Divider before the first measurement column. */
const MEASURE_START = 'pl-5 border-l border-line';

export default function JobRosterCard({ job, onToggleRosterItem }: JobRosterCardProps) {
  const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;

  // Render Personalized Team Roster if present
  if (teamRoster && teamRoster.length > 0) {
    const doneCount = teamRoster.filter(r => r.completed).length;
    // Walk-in rows can carry the person's body measurements (custom fit, already measured).
    const rowValue = (r: RosterItem, key: string) => (r as unknown as Record<string, unknown>)[key];
    const rosterMeasureKeys = MEASUREMENT_FIELDS.map(f => f.key).filter(k => teamRoster.some(r => rowValue(r, k)));
    const isMeasured = (r: RosterItem) => rosterMeasureKeys.some(k => rowValue(r, k));
    const customFitCount = teamRoster.filter(r => r.size === CUSTOM_SIZE && !isMeasured(r)).length;
    // Same labels as the Size column: a custom row is "Custom fit" once measured.
    const sizeCounts = teamRoster.reduce<Record<string, number>>((acc, r) => {
      if (!r.size) return acc;
      const label = r.size !== CUSTOM_SIZE ? r.size : isMeasured(r) ? 'Custom fit' : 'Measure at shop';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const knownRosterKeys = new Set([
      'name', 'print_name', 'number', 'size', 'completed', 'unit', 'measure_at_shop',
      ...MEASUREMENT_FIELDS.map(f => f.key),
    ]);
    const extraColumns = Array.from(
      teamRoster.reduce((set, row) => {
        Object.keys(row as unknown as Record<string, unknown>).forEach(k => {
          if (!knownRosterKeys.has(k)) set.add(k);
        });
        return set;
      }, new Set<string>())
    );

    const teamName = job.custom_order_data?.team_name as string | undefined;
    const showTeamName = Boolean(teamName && teamName !== job.catalog_item?.name);

    return (
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <Shirt size={17} className="text-taupe" /> Team Roster & Size Sheet
            </h2>
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
          <table className="w-full min-w-max text-left text-xs divide-y divide-line">
            <thead>
              <tr className="text-ink-muted font-bold uppercase tracking-wider text-[10px]">
                <th className={`${TH} w-10`}>Done</th>
                <th className={`${TH} w-10`}>#</th>
                <th className={TH}>Name</th>
                <th className={TH}>Print Name</th>
                <th className={TH}>No.</th>
                <th className={TH}>Size</th>
                {rosterMeasureKeys.map((k, i) => (
                  <th key={k} className={`${TH} ${i === 0 ? MEASURE_START : ''}`}>{MEASUREMENT_LABELS[k] ?? k}</th>
                ))}
                {extraColumns.map(col => (
                  <th key={col} className={TH}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {teamRoster.map((row, idx: number) => (
                <tr key={`${row.name}-${row.number}-${idx}`} className={row.completed ? 'bg-emerald-50/40' : undefined}>
                  <td className={TD}>
                    <button
                      type="button"
                      onClick={() => onToggleRosterItem(idx)}
                      title={row.completed ? 'Mark as pending' : 'Mark as completed'}
                    >
                      {row.completed ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} className="text-line-strong" />}
                    </button>
                  </td>
                  <td className={`${TD} text-ink-faint font-mono`}>{idx + 1}</td>
                  <td className={`${TD} font-bold ${row.completed ? 'text-ink-faint line-through' : 'text-ink'}`}>{row.name || '—'}</td>
                  <td className={`${TD} text-ink-muted`}>{row.print_name || '—'}</td>
                  <td className={`${TD} font-mono text-ink font-bold`}>{row.number || '—'}</td>
                  <td className={TD}>
                    {row.size === CUSTOM_SIZE && isMeasured(row) ? (
                      <span
                        title="Made to this person's body measurements"
                        className="px-2 py-0.5 bg-canvas border border-line rounded text-[10px] font-bold text-ink whitespace-nowrap"
                      >
                        Custom fit
                      </span>
                    ) : row.size === CUSTOM_SIZE ? (
                      <span
                        title="Needs to be measured in person — not one of the service's standard sizes"
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold text-amber-700 whitespace-nowrap"
                      >
                        <Ruler size={10} /> Measure at shop
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-canvas border border-line rounded text-[10px] font-bold text-ink">{row.size}</span>
                    )}
                  </td>
                  {rosterMeasureKeys.map((k, i) => {
                    const v = rowValue(row, k);
                    return (
                      <td key={k} className={`${TD} tabular-nums text-ink-body ${i === 0 ? MEASURE_START : ''}`}>
                        {v ? `${String(v)} ${rowValue(row, 'unit') === 'cm' ? 'cm' : 'in'}` : '—'}
                      </td>
                    );
                  })}
                  {extraColumns.map(col => (
                    <td key={col} className={`${TD} text-ink-muted`}>
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
  // Online bulk orders: optional body measurements the customer gave for some people.
  const members = (Array.isArray(job.custom_order_data?.member_measurements)
    ? job.custom_order_data.member_measurements
    : []) as Array<Record<string, string | boolean | undefined>>;
  const memberKeys = MEASUREMENT_FIELDS.map((f) => f.key).filter((k) => members.some((m) => m[k]));

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

      {members.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-line">
          <p className="text-xs font-bold text-ink flex items-center gap-1.5">
            <Ruler size={13} className="text-taupe" /> People from the customer
            <span className="font-semibold text-ink-muted">({members.length} {members.length === 1 ? 'person' : 'people'})</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-left text-xs divide-y divide-line">
              <thead>
                <tr className="text-ink-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2 w-8">#</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Size</th>
                  {memberKeys.map((k) => (
                    <th key={k} className="pb-2 whitespace-nowrap">{MEASUREMENT_LABELS[k] ?? k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {members.map((m, i) => (
                  <tr key={`${m.name ?? ''}-${i}`}>
                    <td className="py-2 text-ink-faint font-mono">{i + 1}</td>
                    <td className="py-2 font-semibold text-ink">
                      {m.name || '—'}
                      {Boolean(m.measure_at_shop) && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-800 whitespace-nowrap">Measure at shop</span>
                      )}
                    </td>
                    <td className="py-2">{m.size ? <span className="px-2 py-0.5 bg-canvas border border-line rounded text-[10px] font-bold text-ink">{m.size}</span> : '—'}</td>
                    {memberKeys.map((k) => (
                      <td key={k} className="py-2 tabular-nums text-ink-body whitespace-nowrap">
                        {m[k] ? `${m[k]} ${m.unit === 'cm' ? 'cm' : 'in'}` : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
