import React from 'react';
import PreStepRow from './PreStepRow';
import { stepExtras, type PiecesEditorState } from './stepExtras';
import type { OrderReadinessApi } from '../readiness/useOrderReadiness';
import type { ChecklistItem, PreProductionStep, ReadinessData } from '../readiness/readinessTypes';

type Open = 'quotation' | 'approval' | 'tailors';

interface PreProductionListProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly onOpen: (what: Open) => void;
  readonly onGoToFinancials?: () => void;
  readonly pieces?: PiecesEditorState;
  /** A completed order: every step only reads "Done", with no buttons. */
  readonly readOnly?: boolean;
}

/** Which checklist buttons belong under which step. */
const ITEMS: Record<PreProductionStep['key'], ChecklistItem['key'][]> = {
  request: [],
  details: ['specs', 'measurements', 'customer_items'],
  quotation: ['quotation'],
  decision: ['approval'],
  payment: ['deposit'],
  confirmed: [],
};

/** The six steps of a request, in order. Leaving and coming back always lands on the first unfinished one. */
export default function PreProductionList({ data, api, onOpen, onGoToFinancials, pieces, readOnly }: PreProductionListProps) {
  const pre = data.pre_production;
  if (!pre) return null;
  const byKey = new Map((data.checklist ?? []).map((i) => [i.key, i]));

  return (
    <ol className="divide-y divide-line">
      {pre.steps.map((step, index) => (
        <PreStepRow
          key={step.key}
          step={step}
          index={index}
          current={pre.current === step.key}
          readOnly={readOnly}
          items={readOnly ? [] : ITEMS[step.key].map((k) => byKey.get(k)).filter((i): i is ChecklistItem => Boolean(i && i.applicable))}
          extras={readOnly ? undefined : stepExtras({ step, data, api, pieces })}
          data={data}
          api={api}
          onOpen={onOpen}
          onGoToFinancials={onGoToFinancials}
        />
      ))}
    </ol>
  );
}
