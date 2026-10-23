import React, { useState } from 'react';
import ReadyStepRow from '../ReadyStepRow';
import FittingStep from './FittingStep';
import BalanceStep from './BalanceStep';
import HandoverStep from './HandoverStep';
import { day, handoverFacts, type Panel } from './handoverFacts';
import type { OrderReadinessApi } from '../useOrderReadiness';
import type { ReadinessData } from '../readinessTypes';

interface HandOverStepsProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly onGoToFinancials?: () => void;
}

/** Number of steps done, for the section's subtitle. */
export function handOverProgress(data: ReadinessData): string {
  const d = data.delivery;
  if (!d) return '';
  const f = handoverFacts(data, d);
  const flags = [true, ...(f.needsFitting ? [f.fitting === 'passed' || f.fitting === 'skipped'] : []), !f.owing, f.remaining === 0];
  return `${flags.filter(Boolean).length} of ${flags.length} done`;
}

/** The Ready column's steps in order: customer told, fitting (if needed), the balance, hand over. One primary button at a time. */
export default function HandOverSteps({ data, api, onGoToFinancials }: HandOverStepsProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const d = data.delivery;
  if (!d) return null;
  const f = handoverFacts(data, d);
  const ctx = { data, d, f, api, panel, setPanel, onGoToFinancials };
  const told = d.ready_at ?? d.qc_passed_at;
  const shownError = api.error && ['move', 'handover', 'correction'].includes(api.error.key) ? api.error.message : '';
  let n = 0;

  return (
    <>
      <ol className="divide-y divide-line">
        <ReadyStepRow n={++n} title="Customer told" done>
          <p className="text-sm text-ink-body">{told ? `Customer told ${day(told)}.` : 'The customer was told when the quality check passed.'}</p>
        </ReadyStepRow>
        {f.needsFitting && (
          <ReadyStepRow n={++n} title="Fitting" done={f.fitting === 'passed' || f.fitting === 'skipped'}><FittingStep ctx={ctx} /></ReadyStepRow>
        )}
        <ReadyStepRow n={++n} title="Pay the balance" done={!f.owing}><BalanceStep ctx={ctx} /></ReadyStepRow>
        <ReadyStepRow n={++n} title="Hand over" done={f.remaining === 0}><HandoverStep ctx={ctx} /></ReadyStepRow>
      </ol>
      {shownError && <p role="alert" className="border-t border-line px-5 py-3 text-sm text-danger sm:px-6">{shownError}</p>}
    </>
  );
}
