'use client';

import React, { useState } from 'react';
import { PLAIN_FIELD } from '@/components/shared/plainForm';
import { useStoreStaff, type StaffPerson } from '@/components/jobs/readiness/useStoreStaff';

const ROLES = [{ v: 'lead', t: 'Lead' }, { v: 'tailor', t: 'Tailor' }, { v: 'assistant', t: 'Assistant' }];
/** More staff than this: a search box appears and the list scrolls inside itself. */
const SEARCH_FROM = 6;

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
  const [query, setQuery] = useState('');
  const all = useStoreStaff(storeId)
    .filter((p) => !branchId || p.branchId === null || p.branchId === branchId)
    .map((p) => ({ p, skill: matchedSkill(p, jobTerms) }))
    .sort((a, b) => Number(Boolean(b.skill)) - Number(Boolean(a.skill)));
  const q = query.trim().toLowerCase();
  const people = q ? all.filter(({ p }) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)) : all;
  const chosen = Object.keys(assignees).length;

  const toggle = (id: number) => setAssignees((cur) => {
    const next = { ...cur };
    if (id in next) delete next[id];
    else next[id] = Object.keys(next).length === 0 ? 'lead' : 'tailor';
    return next;
  });

  if (all.length === 0) return <p className="text-sm text-espresso/60">No staff in this branch yet. You can plan staff later from the order’s Order Steps.</p>;
  return (
    <div className="space-y-3">
      {all.length > SEARCH_FROM && <input type="search" aria-label="Search staff" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${all.length} staff`} className={PLAIN_FIELD} />}
      <ul className={`divide-y divide-espresso/15 border-y border-espresso/15 ${all.length > SEARCH_FROM ? 'max-h-80 overflow-y-auto overscroll-contain' : ''}`}>
        {people.map(({ p, skill }) => (
          <li key={p.id} className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <input id={`assign-${p.id}`} type="checkbox" checked={p.id in assignees} onChange={() => toggle(p.id)} className="h-5 w-5 shrink-0 accent-espresso" />
            <label htmlFor={`assign-${p.id}`} className="min-w-0 cursor-pointer">
              <span className="block truncate text-sm font-semibold text-espresso">{p.name} <span className="font-normal text-espresso/60">· {p.role}</span></span>
              <span className="block truncate text-xs text-espresso/60">
                {skill ? <span className="font-semibold text-espresso">Skilled in {skill} · </span> : null}
                {[p.branch, p.active != null ? `${p.active} active job${p.active === 1 ? '' : 's'}` : null].filter(Boolean).join(' · ')}
              </span>
            </label>
            {p.id in assignees && (
              <label className="col-start-2 flex items-center gap-2 text-sm text-espresso sm:col-start-3">
                <span className="text-espresso/60">As</span>
                <select aria-label={`Role for ${p.name}`} value={assignees[p.id]} onChange={(e) => setAssignees((cur) => ({ ...cur, [p.id]: e.target.value }))} className={`${PLAIN_FIELD} h-10 w-auto`}>
                  {ROLES.map((r) => <option key={r.v} value={r.v}>{r.t}</option>)}
                </select>
              </label>
            )}
          </li>
        ))}
        {people.length === 0 && <li className="py-6 text-center text-sm text-espresso/60">No staff match “{query}”.</li>}
      </ul>
      <p className="text-sm text-espresso/60">{chosen === 0 ? 'No one chosen yet. You can also plan staff later.' : `${chosen} chosen. They are told right away.`}</p>
    </div>
  );
}
