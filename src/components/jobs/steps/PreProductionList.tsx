import React from 'react';
import { Check } from 'lucide-react';
import StepAction from '../readiness/StepAction';
import type { OrderReadinessApi } from '../readiness/useOrderReadiness';
import type { ChecklistItem, PreProductionStep, ReadinessData } from '../readiness/readinessTypes';

type Open = 'quotation' | 'approval' | 'tailors';

interface PreProductionListProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly onOpen: (what: Open) => void;
  readonly onGoToFinancials?: () => void;
}

/** Which checklist buttons belong under which step. */
const ITEMS: Record<PreProductionStep['key'], ChecklistItem['key'][]> = {
  request: [],
  details: ['specs', 'measurements', 'customer_items'],
  quotation: ['quotation'],
  decision: ['approval'],
  payment: ['deposit'],
  staff: ['tailor'],
  start: ['materials', 'confirmed', 'started'],
};

const ghost = 'h-11 sm:h-9 whitespace-nowrap rounded-lg bg-espresso px-3 text-xs font-bold text-white hover:bg-espresso/90 disabled:opacity-50';

/** The seven steps before work starts, in order. Leaving and coming back always lands on the first unfinished one. */
export default function PreProductionList({ data, api, onOpen, onGoToFinancials }: PreProductionListProps) {
  const pre = data.pre_production;
  if (!pre) return null;
  const byKey = new Map((data.checklist ?? []).map((i) => [i.key, i]));

  return (
    <ol className="divide-y divide-line">
      {pre.steps.map((step, index) => {
        const current = pre.current === step.key;
        const items = ITEMS[step.key].map((k) => byKey.get(k)).filter((i): i is ChecklistItem => Boolean(i && i.applicable));
        return (
          <li key={step.key} className={`flex gap-3 px-4 py-3 ${current ? 'bg-taupe/5' : ''}`} aria-current={current ? 'step' : undefined}>
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-sage text-white' : current ? 'bg-espresso text-white' : 'bg-sunken text-ink-faint'}`}>
              {step.done ? <Check size={13} strokeWidth={3} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${current ? 'font-bold text-ink' : step.done ? 'text-ink-body' : 'text-ink-muted'}`}>{step.label}</p>
              {step.note && !step.done && <p className="mt-0.5 text-xs text-ink-muted">{step.note}</p>}
              <div className="mt-2 flex flex-wrap gap-2 empty:hidden">
                {step.key === 'request' && !step.done && data.permissions.can_accept_request && (
                  <button type="button" disabled={api.busy !== null} onClick={api.actions.acceptRequest} className={ghost}>Accept this request</button>
                )}
                {items.map((item) => <StepAction key={item.key} item={item} api={api} onOpen={onOpen} onGoToFinancials={onGoToFinancials} />)}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
