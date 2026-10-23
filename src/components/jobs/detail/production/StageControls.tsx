import React from 'react';
import { BTN, BTN_PRIMARY, BTN_SM } from '@/components/shared/plainForm';
import { isGated, lineView } from '../../productionLine';
import type { Job } from '../../jobHelpers';
import type { OrderReadinessApi } from '../../readiness/useOrderReadiness';
import NeedsFixPanel from './NeedsFixPanel';

interface StageControlsProps {
  readonly job: Job;
  readonly rd: OrderReadinessApi;
  readonly fixOpen: boolean;
  readonly onFix: (open: boolean) => void;
}

/** Back (when allowed) and the one primary: Next, or at the quality check "Quality check passed" with "Needs a fix". Every move is instant. */
export default function StageControls({ job, rd, fixOpen, onFix }: StageControlsProps) {
  const v = lineView(job);
  const a = rd.actions;
  const off = rd.busy !== null;
  const shownError = rd.error && ['production', 'qc', 'move', 'correction'].includes(rd.error.key) ? rd.error.message : '';

  if (fixOpen && v.atQc) {
    return (
      <NeedsFixPanel
        canCharge={Boolean(rd.data?.permissions.can_approve_change)} busy={off}
        onShopFix={(body) => a.failQuality(body)} onChargedFix={(body) => a.chargedFix(body)} onClose={() => onFix(false)}
      />
    );
  }
  if (!v.next && !v.atQc && !v.back) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {v.back && <button type="button" disabled={off} onClick={a.productionBack} className={BTN_SM}>Back to {v.back.label}</button>}
        {v.atQc ? (
          <>
            <button type="button" disabled={off} onClick={a.passQuality} className={BTN_PRIMARY}>Quality check passed</button>
            <button type="button" disabled={off} onClick={() => onFix(true)} className={BTN}>Needs a fix</button>
          </>
        ) : v.next && (
          <button type="button" disabled={off} onClick={a.productionNext} className={BTN_PRIMARY}>Next: {v.next.label}</button>
        )}
      </div>
      {shownError && <p role="alert" className="text-sm text-danger">{shownError}</p>}
      {!isGated(job) && v.next?.status === 'completed' && <p className="text-[13px] text-ink-muted">This order does not use the handover steps. Completing it needs the balance paid.</p>}
    </div>
  );
}
