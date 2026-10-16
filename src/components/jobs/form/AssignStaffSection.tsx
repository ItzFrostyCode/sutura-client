'use client';

import React from 'react';
import { useStoreStaff, type StaffPerson } from '@/components/jobs/readiness/useStoreStaff';

const ROLES = [{ v: 'lead', t: 'Lead' }, { v: 'tailor', t: 'Tailor' }, { v: 'assistant', t: 'Assistant' }];

interface Props {
  readonly storeId: number;
  /** Only that branch's staff are offered; null shows everyone. */
  readonly branchId: number | null;
  readonly assignees: Record<number, string>;
  readonly setAssignees: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  /** Words that describe the job (garment, category, service). A staff member whose skills mention one is listed first. */
  readonly jobTerms: string[];
}

function matchedSkill(person: StaffPerson, terms: string[]): string | null {
  const wanted = terms.map((t) => t.toLowerCase()).filter((t) => t.length > 2);
  return person.skills.find((s) => wanted.some((t) => t.includes(s.toLowerCase()) || s.toLowerCase().includes(t))) ?? null;
}

/** The shop / branch picks who works the order; staff then only move it to the next stage. */
export default function AssignStaffSection({ storeId, branchId, assignees, setAssignees, jobTerms }: Props) {
  const people = useStoreStaff(storeId)
    .filter((p) => !branchId || p.branchId === null || p.branchId === branchId)
    .map((p) => ({ p, skill: matchedSkill(p, jobTerms) }))
    .sort((a, b) => Number(Boolean(b.skill)) - Number(Boolean(a.skill)));

  const toggle = (id: number) => setAssignees((cur) => {
    const next = { ...cur };
    if (id in next) delete next[id];
    else next[id] = Object.keys(next).length === 0 ? 'lead' : 'tailor';
    return next;
  });

  if (people.length === 0) {
    return <p className="text-sm text-ink-muted">No staff in this branch yet. You can plan staff later from the order’s Order Steps.</p>;
  }
  return (
    <ul className="divide-y divide-line border-y border-line">
      {people.map(({ p, skill }) => (
        <li key={p.id} className="flex min-h-14 items-center gap-3 py-2">
          <input id={`assign-${p.id}`} type="checkbox" checked={p.id in assignees} onChange={() => toggle(p.id)} className="h-5 w-5 shrink-0 accent-taupe" />
          <label htmlFor={`assign-${p.id}`} className="min-w-0 flex-1 cursor-pointer">
            <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
            <span className="block truncate text-xs text-ink-muted">
              {skill ? <span className="font-semibold text-sage">Skilled in {skill} · </span> : null}
              {p.branch ? `${p.branch} · ` : ''}{p.active ?? '–'} active job{p.active === 1 ? '' : 's'}
            </span>
          </label>
          {p.id in assignees && (
            <select
              aria-label={`Role for ${p.name}`}
              value={assignees[p.id]}
              onChange={(e) => setAssignees((cur) => ({ ...cur, [p.id]: e.target.value }))}
              className="h-11 rounded-lg border border-line bg-canvas px-2 text-base sm:text-sm"
            >
              {ROLES.map((r) => <option key={r.v} value={r.v}>{r.t}</option>)}
            </select>
          )}
        </li>
      ))}
    </ul>
  );
}
