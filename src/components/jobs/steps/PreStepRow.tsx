import React from 'react';
import { Check } from 'lucide-react';
import StepAction, { STEP_PRIMARY } from '../readiness/StepAction';
import type { OrderReadinessApi } from '../readiness/useOrderReadiness';
import type { ChecklistItem, PreProductionStep, ReadinessData } from '../readiness/readinessTypes';

interface PreStepRowProps {
  readonly step: PreProductionStep;
  readonly index: number;
  readonly current: boolean;
  readonly items: ChecklistItem[];
  /** Extra text / editor under the step and any extra buttons beside it. */
  readonly extras?: { body: React.ReactNode; actions: React.ReactNode };
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly onOpen: (what: 'quotation' | 'approval' | 'tailors') => void;
  readonly onGoToFinancials?: () => void;
  /** A completed order: no buttons, the row only says Done. */
  readonly readOnly?: boolean;
}

/** One of the six steps: a numbered circle, what it is, and the button(s) that move it forward. */
export default function PreStepRow({ step, index, current, items, extras, data, api, onOpen, onGoToFinancials, readOnly }: PreStepRowProps) {
  const circle = step.done ? 'bg-taupe-dark text-white' : current ? 'bg-espresso text-white' : 'border border-line-strong text-ink-muted';
  const canAccept = !readOnly && step.key === 'request' && !step.done && data.permissions.can_accept_request;
  const hasActions = canAccept || items.length > 0 || Boolean(extras?.actions);
  const actions = (
    <>
      {canAccept && <button type="button" disabled={api.busy !== null} onClick={api.actions.acceptRequest} className={STEP_PRIMARY}>Accept this request</button>}
      {items.map((item) => <StepAction key={item.key} item={item} api={api} onOpen={onOpen} onGoToFinancials={onGoToFinancials} />)}
      {extras?.actions}
    </>
  );

  return (
    <li className={`flex flex-wrap gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap ${current ? 'bg-amber-500/[0.04] shadow-[inset_3px_0_0_var(--color-espresso)]' : ''}`} aria-current={current ? 'step' : undefined}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${circle}`}>
        {step.done ? <Check size={15} strokeWidth={2.5} /> : index + 1}
      </span>
      <div className="min-w-0 flex-1 basis-0 self-center">
        <p className={`text-[15px] ${step.done || current ? 'font-medium text-ink' : 'text-ink-muted'}`}>{step.label}</p>
        {step.note && !step.done && <p className="mt-0.5 text-[13px] text-ink-muted">{step.note}</p>}
        {extras?.body}
        {current && hasActions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {!current && hasActions && <div className="flex w-full flex-wrap gap-2 pl-12 empty:hidden sm:ml-auto sm:w-auto sm:self-center sm:pl-0">{actions}</div>}
      {!hasActions && (
        <span className={`w-full pl-12 text-[13px] sm:ml-auto sm:w-auto sm:self-center sm:pl-0 ${step.done ? 'font-medium text-taupe-dark' : 'text-ink-faint'}`}>{step.done ? 'Done' : 'Waiting'}</span>
      )}
    </li>
  );
}
