'use client';

import React from 'react';
import { Users } from 'lucide-react';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';
import { useStoreStaff } from '@/components/jobs/readiness/useStoreStaff';

const ROLES = [{ v: 'lead', t: 'Lead' }, { v: 'tailor', t: 'Tailor' }, { v: 'assistant', t: 'Assistant' }];

interface AssignStaffSectionProps {
  readonly storeId: number;
  /** Only that branch's staff are offered; null shows everyone. */
  readonly branchId: number | null;
  readonly assignees: Record<number, string>;
  readonly setAssignees: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}

/** Shop / branch picks who will work the order. Staff then only move it to the next stage. */
export default function AssignStaffSection({ storeId, branchId, assignees, setAssignees }: AssignStaffSectionProps) {
  const people = useStoreStaff(storeId).filter((p) => !branchId || p.branchId === null || p.branchId === branchId);
  const toggle = (id: number) => setAssignees((cur) => {
    const next = { ...cur };
    if (id in next) delete next[id];
    else next[id] = Object.keys(next).length === 0 ? 'lead' : 'tailor';
    return next;
  });

  return (
    <CollapsibleSection
      icon={<Users size={16} className="text-emerald-700" />}
      iconBoxClassName="bg-emerald-50 border border-emerald-200"
      title="Assign Staff"
      defaultOpen
    >
      <p className="mb-3 text-xs text-ink-muted">
        They are told right away and the order shows in their My Jobs. Staff only move it to the next stage — you and the customer see every change.
      </p>
      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-line px-3 py-2">
            <input id={`assign-${p.id}`} type="checkbox" checked={p.id in assignees} onChange={() => toggle(p.id)} className="h-5 w-5 shrink-0 accent-taupe" />
            <label htmlFor={`assign-${p.id}`} className="min-w-0 flex-1 cursor-pointer">
              <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
              <span className="text-[11px] text-ink-muted">
                {p.branch ? `${p.branch} · ` : ''}{p.active ?? '–'} active job{p.active === 1 ? '' : 's'}
              </span>
            </label>
            {p.id in assignees && (
              <select
                aria-label={`Role for ${p.name}`}
                value={assignees[p.id]}
                onChange={(e) => setAssignees((cur) => ({ ...cur, [p.id]: e.target.value }))}
                className="h-11 rounded-lg border border-line bg-canvas px-2 text-base sm:text-xs"
              >
                {ROLES.map((r) => <option key={r.v} value={r.v}>{r.t}</option>)}
              </select>
            )}
          </li>
        ))}
        {people.length === 0 && (
          <li className="py-3 text-center text-xs text-ink-muted">No staff in this branch yet. You can plan staff later from the order&apos;s Order Steps.</li>
        )}
      </ul>
    </CollapsibleSection>
  );
}
