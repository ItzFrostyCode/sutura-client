import type { Delivery, ReadinessData } from '../readinessTypes';

export type FittingState = 'none' | 'waiting' | 'during' | 'passed' | 'skipped';
/** The one step that holds the primary button right now. */
export type CurrentStep = 'fitting' | 'balance' | 'handover' | 'complete' | 'wait';

export const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '');

/** What the "Hand over" steps need to know, worked out once from the order's steps. */
export function handoverFacts(data: ReadinessData, d: Delivery) {
  const status = data.status;
  const money = data.permissions.can_see_money;
  const needsFitting = d.fitting_requirement != null && d.fitting_requirement !== 'none';
  let fitting: FittingState = 'none';
  if (needsFitting) {
    if (status === 'ready_for_fitting') fitting = 'during';
    else if (d.fitting_passed_at) fitting = 'passed';
    else fitting = status === 'balance_handover' ? 'skipped' : 'waiting';
  }
  const fittingBlocks = fitting === 'waiting' || fitting === 'during';
  const balance = d.balance ?? 0;
  const owing = !d.balance_clear;
  const released = Boolean(d.released_with_balance);
  const remaining = d.handover.remaining;
  const canHandOver = !fittingBlocks && remaining > 0 && (d.balance_clear || released);
  const canComplete = remaining === 0 && d.balance_clear && d.open_corrections === 0;

  let current: CurrentStep = 'wait';
  if (fittingBlocks) current = 'fitting';
  else if (canComplete) current = 'complete';
  else if (owing && !released && money) current = 'balance';
  else if (canHandOver) current = 'handover';
  return { status, money, needsFitting, fitting, fittingBlocks, balance, owing, released, remaining, canHandOver, canComplete, current };
}

export type HandoverFacts = ReturnType<typeof handoverFacts>;

export type Panel = 'fix-fitting' | 'fix-handover' | 'handover' | 'release' | null;

/** What each step of "Hand over" gets: the order's steps, the work already worked out, and which inline panel is open. */
export interface StepCtx {
  readonly data: ReadinessData;
  readonly d: Delivery;
  readonly f: HandoverFacts;
  readonly api: import('../useOrderReadiness').OrderReadinessApi;
  readonly panel: Panel;
  readonly setPanel: (p: Panel) => void;
  readonly onGoToFinancials?: () => void;
}
