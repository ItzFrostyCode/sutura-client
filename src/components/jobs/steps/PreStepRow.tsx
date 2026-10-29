import React, { useState } from 'react';
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

/**
 * One of the six steps. Only the step you are on has buttons ("Do this now"), so there is always one thing to do; any other
 * step says Done or Later and opens with "Open", to look at it or take it back. The pieces summary of "Details & sizes" stays visible, since it is information, not an action.
 */
export default function PreStepRow({ step, index, current, items, extras, data, api, onOpen, onGoToFinancials, readOnly }: PreStepRowProps) {
  const circle = step.done ? 'bg-taupe-dark text-white' : current ? 'bg-espresso text-white' : 'border border-line-strong text-ink-muted';
  // A step that is not the current one can still be opened: to see it, change it, or undo it.
  const [opened, setOpened] = useState(false);
  const active = (current || opened) && !readOnly;
  // A mis-click can be taken back until the customer has answered the price.
  const canReopen = !readOnly && step.key === 'details' && step.done && data.status === 'pending' && Boolean(data.permissions.can_prepare) && !data.quotation?.approved_at;
  const canAccept = active && step.key === 'request' && !step.done && data.permissions.can_accept_request;
  const hasActions = active && (canAccept || items.some((i) => !i.done) || Boolean(extras?.actions) || canReopen);
  // "Open" only where there is something behind it.
  const openable = !current && !readOnly && (step.key === 'details' || items.length > 0 || Boolean(extras?.actions));
  const status = step.done ? 'Done' : current ? 'Waiting' : 'Later';

  return (
    <li className={`flex flex-wrap gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap ${current ? 'bg-amber-500/[0.04] shadow-[inset_3px_0_0_var(--color-espresso)]' : ''}`} aria-current={current ? 'step' : undefined}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${circle}`}>
        {step.done ? <Check size={15} strokeWidth={2.5} /> : index + 1}
      </span>
      <div className="min-w-0 flex-1 basis-0 self-center">
        {hasActions && current && <p className="text-[11px] font-semibold uppercase tracking-wider text-espresso/60">Do this now</p>}
        <p className={`text-[15px] ${step.done || current ? 'font-medium text-ink' : 'text-ink-muted'}`}>{step.label}</p>
        {step.note && current && !step.done && <p className="mt-0.5 text-[13px] text-ink-muted">{step.note}</p>}
        {(active || step.key === 'details') && extras?.body}
        {hasActions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {canAccept && <button type="button" disabled={api.busy !== null} onClick={api.actions.acceptRequest} className={STEP_PRIMARY}>Accept this request</button>}
            {items.map((item) => <StepAction key={item.key} item={item} api={api} onOpen={onOpen} onGoToFinancials={onGoToFinancials} />)}
            {extras?.actions}
            {canReopen && <button type="button" disabled={api.busy !== null} onClick={api.actions.reopenDetails} className="cursor-pointer text-[13px] font-medium text-espresso underline underline-offset-2 disabled:opacity-40">Undo approval</button>}
          </div>
        )}
      </div>
      {(!hasActions || openable) && (
        <span className={`flex w-full items-center gap-3 pl-12 text-[13px] sm:ml-auto sm:w-auto sm:self-center sm:pl-0 ${step.done ? 'font-medium text-taupe-dark' : 'text-ink-faint'}`}>
          {!hasActions && status}
          {openable && (
            <button type="button" onClick={() => setOpened((v) => !v)} aria-expanded={opened} className="cursor-pointer font-medium text-espresso underline underline-offset-2">{opened ? 'Hide' : 'Open'}</button>
          )}
        </span>
      )}
    </li>
  );
}
