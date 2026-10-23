import React from 'react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import NeedsFixPanel from '../../detail/production/NeedsFixPanel';
import HandoverPanel from './HandoverPanel';
import type { StepCtx } from './handoverFacts';

/** Step 4: hand the garments over (how many pieces / people), then Complete the order. A problem found afterwards is Needs a fix. */
export default function HandoverStep({ ctx }: Readonly<{ ctx: StepCtx }>) {
  const { data, d, f, api, panel, setPanel } = ctx;
  const a = api.actions;
  const off = api.busy !== null;
  const h = d.handover;
  const people = h.unit === 'people';

  if (panel === 'handover' || panel === 'release') {
    return <HandoverPanel remaining={h.remaining} people={people} release={panel === 'release'} balance={f.balance} busy={off} onSave={a.recordHandover} onClose={() => setPanel(null)} />;
  }
  if (panel === 'fix-handover') {
    return <NeedsFixPanel canCharge={data.permissions.can_approve_change} busy={off} onShopFix={a.fittingIssue} onChargedFix={a.chargedFix} onClose={() => setPanel(null)} />;
  }
  const count = people ? `${h.handed_over} of ${h.quantity} people have their garments.` : `${h.handed_over} of ${h.quantity} garments handed over.`;
  let hint = '';
  if (f.fittingBlocks) hint = 'This comes after the fitting.';
  else if (f.owing && !f.released && h.remaining > 0) hint = 'This opens once the balance is paid.';
  else if (h.remaining === 0 && f.owing) hint = 'The order can be completed once the balance is paid.';
  else if (h.remaining === 0 && d.open_corrections > 0) hint = 'Finish the open fixes before completing the order.';

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-body">{count}</p>
      {hint && <p className="text-[13px] text-ink-muted">{hint}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {f.canHandOver && <button type="button" disabled={off} onClick={() => setPanel('handover')} className={f.current === 'handover' ? BTN_PRIMARY : BTN}>Hand over</button>}
        {f.canComplete && <button type="button" disabled={off} onClick={() => a.moveTo('completed', 'Order completed.')} className={BTN_PRIMARY}>Complete the order</button>}
        {f.status === 'balance_handover' && !f.fittingBlocks && <button type="button" disabled={off} onClick={() => setPanel('fix-handover')} className={BTN}>Needs a fix</button>}
      </div>
      {f.money && f.owing && !f.released && !f.fittingBlocks && h.remaining > 0 && (
        <button type="button" disabled={off} onClick={() => setPanel('release')} className="min-h-11 cursor-pointer text-sm font-medium text-ink-muted underline underline-offset-2 hover:text-ink disabled:opacity-50">Release with balance due…</button>
      )}
    </div>
  );
}
