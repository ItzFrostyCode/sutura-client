import React from 'react';
import { Check, Circle } from 'lucide-react';
import type { Blocker, ChecklistItem } from './readinessTypes';

interface QuotationChecklistProps {
  readonly checklist?: ChecklistItem[];
  readonly dueDate: string;
  readonly blockers: Blocker[];
}

function Row({ done, label }: { readonly done: boolean; readonly label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-ink-body">
      {done ? <Check size={16} className="shrink-0 text-sage" aria-hidden /> : <Circle size={16} className="shrink-0 text-ink-faint" aria-hidden />}
      <span>{label}</span>
      <span className="sr-only">{done ? '(done)' : '(not done yet)'}</span>
    </li>
  );
}

/** Information only: what the final price needs first. The server still decides; its blockers are listed below. */
export default function QuotationChecklist({ checklist, dueDate, blockers }: QuotationChecklistProps) {
  const specs = checklist?.find((c) => c.key === 'specs');
  const meas = checklist?.find((c) => c.key === 'measurements');
  const showMeas = Boolean(meas?.applicable);
  const ready = Boolean(specs?.done) && (!showMeas || Boolean(meas?.done)) && Boolean(dueDate);
  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-xl bg-sunken/70 p-4">
        <p className="text-sm font-semibold text-ink">Before you send the final price</p>
        <ul className="space-y-1.5">
          <Row done={Boolean(specs?.done)} label="Specs approved" />
          {showMeas && <Row done={Boolean(meas?.done)} label="Measurements verified" />}
          <Row done={Boolean(dueDate)} label="Ready date set" />
        </ul>
        {ready && <p className="text-sm font-medium text-sage">Ready to send.</p>}
      </div>
      {blockers.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 rounded-xl bg-amber-500/[0.08] py-4 pl-9 pr-4 text-sm text-amber-800">
          {blockers.map((b) => <li key={b.key}>{b.message}</li>)}
        </ul>
      )}
    </div>
  );
}
