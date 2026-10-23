import React from 'react';
import { ClipboardCheck, PackageCheck } from 'lucide-react';
import ColumnFold from './ColumnFold';
import ReadyStepRow from './ReadyStepRow';
import { day } from './handover/handoverFacts';
import type { ReadinessData } from './readinessTypes';

const NOTE = 'text-[13px] text-ink-muted';

/** Getting ready, after the order started: both checks passed (the server will not start production without them). Read only. */
export function GettingReadyFold({ data }: Readonly<{ data: ReadinessData }>) {
  const tailors = (data.assignees ?? []).map((a) => a.name).filter(Boolean).join(', ');
  return (
    <ColumnFold icon={ClipboardCheck} title="Getting ready" done={2} total={2} folded>
      <ol className="divide-y divide-line">
        <ReadyStepRow n={1} title="Materials ready" done>{data.materials?.note && <p className={NOTE}>{data.materials.note}</p>}</ReadyStepRow>
        <ReadyStepRow n={2} title="Tailor assigned" done>{tailors && <p className={NOTE}>{tailors}</p>}</ReadyStepRow>
      </ol>
    </ColumnFold>
  );
}

/** Hand over, once the order is complete: every step done. Read only (the live steps are in the Ready column). */
export function HandOverFold({ data }: Readonly<{ data: ReadinessData }>) {
  const d = data.delivery;
  if (!d) return null;
  const needsFitting = d.fitting_requirement != null && d.fitting_requirement !== 'none';
  const told = d.ready_at ?? d.qc_passed_at;
  const h = d.handover;
  const last = h.records[h.records.length - 1];
  let n = 0;
  return (
    <ColumnFold icon={PackageCheck} title="Hand over" done={needsFitting ? 4 : 3} total={needsFitting ? 4 : 3} folded>
      <ol className="divide-y divide-line">
        <ReadyStepRow n={++n} title="Customer told" done><p className={NOTE}>{told ? `Told ${day(told)}.` : 'Told when the quality check passed.'}</p></ReadyStepRow>
        {needsFitting && (
          <ReadyStepRow n={++n} title="Fitting" done><p className={NOTE}>{d.fitting_passed_at ? `Fitting passed ${day(d.fitting_passed_at)}.` : 'The fitting was skipped.'}</p></ReadyStepRow>
        )}
        <ReadyStepRow n={++n} title="Pay the balance" done><p className={NOTE}>{d.released_with_balance ? 'Released with a balance, since paid.' : 'The balance is paid.'}</p></ReadyStepRow>
        <ReadyStepRow n={++n} title="Hand over" done>
          <p className={NOTE}>{h.handed_over} of {h.quantity} handed over{last ? `${last.received_by ? ` to ${last.received_by}` : ''} on ${day(last.handed_over_at)}` : ''}.</p>
        </ReadyStepRow>
      </ol>
    </ColumnFold>
  );
}
