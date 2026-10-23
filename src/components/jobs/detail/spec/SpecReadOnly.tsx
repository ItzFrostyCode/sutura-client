import React from 'react';
import { PenLine, Table2 } from 'lucide-react';
import SectionHeader from '../../ui/SectionHeader';
import type { CustomizationInstruction, GarmentSpecTable, Job } from '../../jobTypes';

const CARD = 'space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6';

/** The saved per-garment specification table of a completed order: plain text, no add / edit / save. Nothing shows when none was saved. */
export function SpecTableReadOnly({ job }: Readonly<{ job: Job }>) {
  const table = job.custom_order_data?.spec_table as GarmentSpecTable | undefined;
  if (!table?.columns?.length || !table.rows?.length) return null;
  return (
    <div className={CARD}>
      <SectionHeader icon={Table2} title="Per-Garment / Per-Person Specifications" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              <th className="py-2 pr-3">#</th>
              {table.columns.map((c) => <th key={c.id} className="py-2 pr-3">{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {table.rows.map((row, i) => (
              <tr key={row.id}>
                <td className="py-2 pr-3 font-mono text-ink-faint">{i + 1}</td>
                {table.columns.map((c) => <td key={c.id} className="py-2 pr-3 text-ink-body">{String(row[c.key] ?? '') || '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The saved customization notes of a completed order: plain text and links, no add / edit / remove. */
export function InstructionsReadOnly({ job }: Readonly<{ job: Job }>) {
  const list = (job.custom_order_data?.customization_instructions as CustomizationInstruction[] | undefined) ?? [];
  if (list.length === 0) return null;
  return (
    <div className={CARD}>
      <SectionHeader icon={PenLine} title="Customization notes" />
      <ul className="space-y-3">
        {list.map((n) => (
          <li key={n.id} className="rounded-xl bg-sunken/70 p-4">
            <p className="text-sm font-semibold text-ink">{n.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-body">{n.details}</p>
            {n.reference_link && <a href={n.reference_link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[13px] text-espresso hover:underline">Reference link</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
