import React, { useState } from 'react';
import { Ban, GitBranch, Pause } from 'lucide-react';
import StatusStepper from '@/components/shared/StatusStepper';
import { BTN_PRIMARY } from '@/components/shared/plainForm';
import { isGated, lineView } from '../../productionLine';
import type { Job } from '../../jobHelpers';
import type { OrderReadinessApi } from '../../readiness/useOrderReadiness';
import { buildStages, stepLabel, stepperKey } from './stages';
import StageControls from './StageControls';
import HoldPanel from './HoldPanel';
import FixingPanel from './FixingPanel';

const QUIET = 'min-h-11 cursor-pointer text-[13px] font-medium text-ink-muted hover:text-ink';
const CLOSED = ['cancelled', 'rejected', 'completed'];

/** The production line in a tinted well: where the order is, then the one thing to do next. The stepper only shows; Next / Back / Hold / Resume do the moving. */
export default function TimelinePanel({ job, rd }: Readonly<{ job: Job; rd: OrderReadinessApi }>) {
  const [holdOpen, setHoldOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const status = job.status;
  const onHold = status === 'on_hold';
  const cancelled = status === 'cancelled';
  const v = lineView(job);
  const fixing = status === 'final_adjustments' && isGated(job);
  const onLine = v.index !== null;
  const canHold = !onHold && !CLOSED.includes(status) && (onLine || ['design', 'qc_ironing', 'qc_check', 'final_adjustments'].includes(status));
  const current = onLine ? `${v.steps[v.index!].label} · step ${v.index! + 1} of ${v.steps.length}` : stepLabel(status);
  const key = stepperKey(job);

  let body: React.ReactNode = null;
  if (onHold) {
    body = (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl bg-amber-500/[0.08] px-4 py-3 text-amber-800">
          <Pause size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 text-sm">
            <p className="font-medium">On hold{job.hold_reason ? ` — ${job.hold_reason}` : ''}</p>
            {job.status_before_hold && <p className="mt-0.5 text-[13px]">Resume returns it to {stepLabel(job.status_before_hold)}.</p>}
          </div>
        </div>
        <button type="button" disabled={rd.busy !== null} onClick={rd.actions.resume} className={BTN_PRIMARY}>Resume</button>
        {rd.error?.key === 'production' && <p role="alert" className="text-sm text-danger">{rd.error.message}</p>}
      </div>
    );
  } else if (holdOpen) {
    body = <HoldPanel busy={rd.busy !== null} onHold={rd.actions.hold} onClose={() => setHoldOpen(false)} />;
  } else if (fixing) {
    body = <FixingPanel rd={rd} />;
  } else if (!CLOSED.includes(status)) {
    body = <StageControls job={job} rd={rd} fixOpen={fixOpen} onFix={setFixOpen} />;
  }

  return (
    <section className="space-y-5 rounded-2xl bg-sunken/60 p-5">
      <h2 className="flex items-center gap-2 text-[17px] font-semibold text-ink"><GitBranch size={18} className="text-ink-muted" /> Production Timeline</h2>
      {cancelled ? (
        <div className="flex items-center justify-center gap-3 rounded-xl bg-rose-500/10 py-4 text-rose-700"><Ban size={18} /><span className="text-sm font-semibold">Order Cancelled</span></div>
      ) : (
        <>
          <StatusStepper stages={buildStages(job)} currentKey={key ?? ''} />
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 text-[13px] text-ink-body">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-espresso" />
            <span>Current: <span className="font-semibold text-ink">{current}</span></span>
          </p>
          {body}
          {canHold && !holdOpen && !fixOpen && <button type="button" onClick={() => setHoldOpen(true)} className={QUIET}>Put on hold…</button>}
        </>
      )}
    </section>
  );
}
