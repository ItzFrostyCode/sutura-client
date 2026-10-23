import React from 'react';
import { BTN_PRIMARY } from '@/components/shared/plainForm';
import { firstTask } from '../jobStage';
import { peso } from './readinessFormat';
import type { Job } from '../jobHelpers';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { Blocker, ReadinessData } from './readinessTypes';

interface StartProductionProps {
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly job: Job;
  readonly onGoToFinancials?: () => void;
}

/** Why the deposit blocks the start, in money for the owner / branch manager, with the way to collect it. */
function depositReason(data: ReadinessData, blocker: Blocker, onGoToFinancials?: () => void): React.ReactNode {
  const d = data.deposit;
  if (!data.permissions.can_see_money || d?.required == null || d.paid == null) return `${blocker.message} The owner or branch manager collects it.`;
  const short = Math.max(0, d.required - d.paid);
  if (short < 0.005) return 'The deposit is paid but still waiting to be verified.';
  const waiting = d.pending_verification && d.pending_verification > 0 ? ` (${peso(d.pending_verification)} is waiting to be verified)` : '';
  return (
    <>
      Deposit short by {peso(short)}{waiting}.{' '}
      {onGoToFinancials && <button type="button" onClick={onGoToFinancials} className="min-h-6 font-medium text-ink underline underline-offset-2 hover:text-espresso">Collect</button>}
    </>
  );
}

/** The one button that ends the Confirmed column. When it is blocked, every reason is printed under it (a hover title does not show on phones). */
export default function StartProduction({ data, api, job, onGoToFinancials }: StartProductionProps) {
  const blockers = data.blockers?.start ?? [];
  const first = firstTask(job);

  return (
    <div className="space-y-3 border-t border-line px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={api.busy !== null || blockers.length > 0} onClick={() => api.actions.startProduction(first.status)} className={BTN_PRIMARY}>Start production</button>
        <span className="text-[13px] text-ink-muted">Work starts with {first.label}.</span>
      </div>
      {blockers.length > 0 && (
        <div className="text-[13px] text-ink-body">
          <p className="font-medium text-ink">Still needed:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {blockers.map((b) => <li key={b.key}>{b.key === 'deposit' ? depositReason(data, b, onGoToFinancials) : b.message}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
