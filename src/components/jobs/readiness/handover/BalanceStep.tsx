import React from 'react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import { peso } from '../readinessFormat';
import { day, type StepCtx } from './handoverFacts';

/** Step 3: the balance (approved extra charges are already in it). The owner or branch manager collects it on the Payments tab; staff are told who does. */
export default function BalanceStep({ ctx }: Readonly<{ ctx: StepCtx }>) {
  const { d, f, onGoToFinancials } = ctx;
  if (!f.owing) return <p className="text-sm text-ink-body">The balance is paid.</p>;

  const pending = d.pending_verification ?? 0;
  const amount = f.money ? peso(f.balance) : null;
  const by = d.balance_due_by ? ` by ${day(d.balance_due_by)}` : '';
  const text = f.released
    ? `Released with ${amount ?? 'the balance'} still due${by}.`
    : amount ? `Balance ${amount}.` : 'The balance is not paid yet — the owner or branch manager collects it.';

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-body">{text}</p>
      {f.money && pending > 0 && <p className="text-[13px] text-amber-700">{peso(pending)} waiting to be verified.</p>}
      {f.money && onGoToFinancials && (
        <button type="button" onClick={onGoToFinancials} className={f.current === 'balance' ? BTN_PRIMARY : BTN}>Collect {amount}</button>
      )}
    </div>
  );
}
