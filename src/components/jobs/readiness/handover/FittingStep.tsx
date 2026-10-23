import React from 'react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import NeedsFixPanel from '../../detail/production/NeedsFixPanel';
import { day, type StepCtx } from './handoverFacts';

/** Step 2: the fitting (only when the order needs one). Start fitting, then Fits or Needs a fix; an optional fitting can be skipped. */
export default function FittingStep({ ctx }: Readonly<{ ctx: StepCtx }>) {
  const { data, d, f, api, panel, setPanel } = ctx;
  const a = api.actions;
  const off = api.busy !== null;

  if (panel === 'fix-fitting') {
    return (
      <NeedsFixPanel
        canCharge={data.permissions.can_approve_change} busy={off}
        onShopFix={a.fittingIssue} onChargedFix={a.chargedFix} onClose={() => setPanel(null)}
      />
    );
  }
  if (f.fitting === 'passed') return <p className="text-sm text-ink-body">Fitting passed{d.fitting_passed_at ? ` ${day(d.fitting_passed_at)}` : ''}.</p>;
  if (f.fitting === 'skipped') return <p className="text-sm text-ink-body">Fitting skipped.</p>;
  if (f.fitting === 'during') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-body">The customer is trying the garments on.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={off} onClick={() => a.moveTo('balance_handover', 'Fitting passed.')} className={BTN_PRIMARY}>Fits</button>
          <button type="button" disabled={off} onClick={() => setPanel('fix-fitting')} className={BTN}>Needs a fix</button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-body">{d.fitting_requirement === 'required' ? 'A fitting is required before the garments are handed over.' : 'A fitting is optional. Start it, or skip it and go on to payment and handover.'}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={off} onClick={() => a.moveTo('ready_for_fitting', 'Fitting started.')} className={BTN_PRIMARY}>Start fitting</button>
        {d.fitting_requirement === 'optional' && (
          <button type="button" disabled={off} onClick={() => a.moveTo('balance_handover', 'Fitting skipped. Moved to payment and handover.')} className={BTN}>Skip fitting</button>
        )}
      </div>
    </div>
  );
}
