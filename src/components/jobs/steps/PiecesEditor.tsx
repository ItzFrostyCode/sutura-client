import React, { useEffect, useRef, useState } from 'react';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import QuotationWhatStep from '../readiness/QuotationWhatStep';
import { useQuotationOrder } from '../readiness/useQuotationOrder';
import type { OrderReadinessApi } from '../readiness/useOrderReadiness';
import type { Job } from '../jobHelpers';

interface PiecesEditorProps {
  readonly job: Job;
  readonly api: OrderReadinessApi;
  readonly onClose: () => void;
  /** Switch the page to its Details tab (team list, measurements). */
  readonly onGoToDetails?: () => void;
}

/**
 * Pieces, people and sizes of the order, edited in place under the Details & sizes step (no window). It mounts when opened,
 * so it starts from the order as it is now, scrolls into view and puts the cursor in its first field.
 */
export default function PiecesEditor({ job, api, onClose, onGoToDetails }: PiecesEditorProps) {
  const o = useQuotationOrder(job);
  const box = useRef<HTMLDivElement>(null);
  const [tried, setTried] = useState(false);
  const busy = api.busy !== null;
  const error = tried && o.problem ? `${o.problem} Give every piece a size first.` : null;

  useEffect(() => {
    box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.current?.querySelector<HTMLElement>('input')?.focus({ preventScroll: true });
  }, []);

  const save = async () => {
    if (o.problem) { setTried(true); return; }
    const patch = o.patch();
    if (patch && !(await api.actions.savePieces(patch))) return;
    onClose();
  };

  return (
    <div ref={box} className="mt-3 space-y-4 border-t border-line pt-4">
      <QuotationWhatStep job={job} o={o} onGoToDetails={onGoToDetails} />
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {!o.team && <button type="button" disabled={busy} onClick={save} className={BTN_PRIMARY}>Save</button>}
        <button type="button" disabled={busy} onClick={onClose} className={BTN}>{o.team ? 'Close' : 'Cancel'}</button>
      </div>
    </div>
  );
}
