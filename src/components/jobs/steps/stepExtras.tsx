import React from 'react';
import { BTN_SM } from '@/components/shared/plainForm';
import PiecesEditor from './PiecesEditor';
import { STEP_PRIMARY } from '../readiness/StepAction';
import { piecesSummary } from '../readiness/piecesSummary';
import type { OrderReadinessApi } from '../readiness/useOrderReadiness';
import type { PreProductionStep, ReadinessData } from '../readiness/readinessTypes';
import type { Job } from '../jobHelpers';

/** The inline "Edit pieces & sizes" editor of the Details & sizes step: open or closed, lifted so the quotation window can open it. */
export interface PiecesEditorState {
  readonly job: Job;
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly onGoToDetails?: () => void;
}

interface Ctx {
  readonly step: PreProductionStep;
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly pieces?: PiecesEditorState;
}

const NOTE = 'mt-1 text-[13px] text-ink-muted';

/** What sits under / beside a step besides its checklist buttons: the pieces summary and editor, the deposit and confirm hints. */
export function stepExtras({ step, data, api, pieces }: Ctx): { body: React.ReactNode; actions: React.ReactNode } {
  const perm = data.permissions;
  const pending = data.status === 'pending';

  if (step.key === 'details' && pieces) {
    return {
      body: pieces.open && perm.can_prepare
        ? <PiecesEditor job={pieces.job} api={api} onClose={() => pieces.setOpen(false)} onGoToDetails={pieces.onGoToDetails} />
        : (
          <>
            <p className={NOTE}>{piecesSummary(pieces.job)}</p>
            {!perm.can_prepare && !step.done && <p className={NOTE}>The owner or branch manager approves the details and sizes.</p>}
          </>
        ),
      actions: perm.can_prepare && pending && !pieces.open ? <button type="button" onClick={() => pieces.setOpen(true)} className={BTN_SM}>Edit pieces &amp; sizes</button> : null,
    };
  }

  if (step.key === 'payment' && !step.done && !perm.can_see_money && data.terms?.locked) {
    return { body: <p className={NOTE}>The owner or branch manager collects the deposit.</p>, actions: null };
  }

  if (step.key === 'confirmed' && !step.done && pending) {
    const before = (data.pre_production?.steps ?? []).filter((s) => s.key !== 'confirmed');
    const blockers = data.blockers?.confirm ?? [];
    const open = before.filter((s) => !s.done);
    const ready = open.length === 0 && blockers.length === 0;
    if (!perm.can_confirm) return { body: <p className={NOTE}>The owner or branch manager confirms the order.</p>, actions: null };
    if (ready) {
      return { body: null, actions: <button type="button" disabled={api.busy !== null} onClick={api.actions.confirm} className={STEP_PRIMARY}>Confirm order</button> };
    }
    const reasons = blockers.length > 0 ? blockers.map((b) => b.message) : open.map((s) => `${s.label} is not done yet.`);
    return {
      body: (
        <div className="mt-1 text-[13px] text-ink-body">
          <p className="font-medium text-ink">Still needed:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      ),
      actions: null,
    };
  }

  return { body: null, actions: null };
}
