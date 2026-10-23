import React from 'react';
import { Info, UserPlus, Users } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import { BTN_SM } from '@/components/shared/plainForm';
import type { ReadinessData } from './readinessTypes';

interface TailorsCardProps {
  readonly data: ReadinessData;
  readonly closed: boolean;
  readonly onOpen: (what: 'quotation' | 'approval' | 'tailors') => void;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
const initials = (name: string | null) => (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

/** Who is making this order, with the button to plan or change them and the history of changes. */
export default function TailorsCard({ data, closed, onOpen }: TailorsCardProps) {
  const people = data.assignees ?? [];
  const history = data.assignee_history ?? [];

  return (
    <section className="h-full rounded-2xl border border-line bg-surface shadow-2xs">
      <header className="border-b border-line px-5 py-4">
        <SectionHeader
          icon={Users}
          title="Tailors"
          as="h3"
          actions={data.permissions.can_assign && !closed ? (
            <button type="button" onClick={() => onOpen('tailors')} className={BTN_SM}>{people.length > 0 ? 'Change' : 'Plan tailors'}</button>
          ) : undefined}
        />
      </header>
      {people.length > 0 ? (
        <ul>
          {people.map((a) => (
            <li key={a.user_id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-xs font-semibold text-ink-body" aria-hidden>{initials(a.name)}</span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">{a.name}</span>
              <span className="text-[13px] capitalize text-ink-muted">{a.role}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-ink-muted"><UserPlus size={20} /></span>
          <p className="text-sm text-ink-muted">Nobody assigned yet.</p>
        </div>
      )}
      {data.capacity?.has_conflict && (
        <p className="mx-5 mb-4 flex gap-2 rounded-xl bg-amber-500/[0.08] px-3.5 py-3 text-[13px] text-amber-800"><Info size={16} className="mt-px shrink-0" />A tailor on this order has another order due within a day of this one.</p>
      )}
      {history.length > 0 && (
        <details className="border-t border-line px-5 py-3 text-[13px]">
          <summary className="min-h-6 cursor-pointer font-medium text-ink-body">History ({history.length})</summary>
          <ul className="mt-2 space-y-1.5 text-ink-muted">
            {history.map((e, i) => (
              <li key={i}>
                {day(e.at)} · {e.action === 'replaced' ? `${e.from} → ${e.to}` : e.action === 'added' ? `${e.to} added` : `${e.from} removed`}{e.by ? ` (by ${e.by})` : ''}{e.reason ? `. ${e.reason}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
