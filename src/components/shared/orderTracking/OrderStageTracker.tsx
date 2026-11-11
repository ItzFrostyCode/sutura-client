import { ArrowRight, Ruler } from 'lucide-react';
import StatusStepper from '@/components/shared/StatusStepper';
import type { TrackedOrder } from '@/components/shared/OrderTrackingView';
import { TERMINAL_STATUSES, buildStages, stepperKey } from './orderPhases';

/**
 * "Saan na ang order ko?" — the leader's approved tracker: every production step with the date it happened, the
 * current one highlighted. Under it, the server's one plain sentence about what happens next (and what to do, if
 * anything). Cancelled / rejected / on hold show as one clear line instead of a stepper.
 */
export default function OrderStageTracker({ order, layout }: { readonly order: TrackedOrder; readonly layout: 'horizontal' | 'vertical' }) {
  const terminal = TERMINAL_STATUSES[order.status];
  const next = order.progress;

  return (
    <section aria-labelledby="order-progress-title" className="card-soft p-4">
      <h2 id="order-progress-title" className="mobile-h4 mb-3 text-ink">Order Progress</h2>

      {order.status === 'ready_for_fitting' && (
        <div className="mb-4 rounded-xl border border-taupe/25 bg-taupe/10 p-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-taupe-dark"><Ruler size={16} aria-hidden /> Ready for your fitting</p>
          <p className="mobile-body-sm mt-1 text-ink-body">Please visit the shop to try it on, so they can make the final adjustments.</p>
        </div>
      )}

      {terminal ? (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${terminal.tone}`}>
          <terminal.Icon size={20} aria-hidden />
          <span className="text-sm font-semibold">{terminal.label}</span>
        </div>
      ) : (
        <StatusStepper stages={buildStages(order.status, order.stage_timestamps, order.pipeline)} currentKey={stepperKey(order.status)} layout={layout} />
      )}

      {next?.headline && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="mobile-body-md font-semibold text-ink">{next.headline}</p>
          {next.detail && <p className="mobile-body-sm mt-1 text-ink-body">{next.detail}</p>}
          {next.action && (
            <p className="mobile-body-sm mt-2 inline-flex items-center gap-1.5 font-semibold text-taupe-dark"><ArrowRight size={15} aria-hidden /> {next.action.label}</p>
          )}
        </div>
      )}
    </section>
  );
}
