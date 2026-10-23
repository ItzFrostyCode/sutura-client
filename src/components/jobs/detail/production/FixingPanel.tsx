import React, { useState } from 'react';
import { BTN_PRIMARY } from '@/components/shared/plainForm';
import CorrectionsList from '../../readiness/CorrectionsList';
import ApproveChangeModal from '../../readiness/ApproveChangeModal';
import type { OrderReadinessApi } from '../../readiness/useOrderReadiness';
import type { Correction } from '../../readiness/readinessTypes';

/** Fixing: the open fixes, each with Fixed; when none are open the order goes back to the quality check. */
export default function FixingPanel({ rd }: Readonly<{ rd: OrderReadinessApi }>) {
  const [approving, setApproving] = useState<Correction | null>(null);
  const data = rd.data;
  const d = data?.delivery;
  if (!data || !d) return null;
  const busy = rd.busy !== null;
  const shownError = rd.error && ['correction', 'move'].includes(rd.error.key) ? rd.error.message : '';

  return (
    <div className="space-y-3">
      <CorrectionsList
        corrections={d.corrections} canApprove={data.permissions.can_approve_change} busy={busy}
        onResolve={rd.actions.resolveCorrection} onCancel={rd.actions.cancelCorrection} onApprove={setApproving}
      />
      {d.open_corrections === 0 ? (
        <button type="button" disabled={busy} onClick={rd.actions.sendToQuality} className={BTN_PRIMARY}>Back to quality check</button>
      ) : (
        <p className="text-sm text-ink-body">Mark each fix as Fixed (or wait for the customer to approve a charged one) to go back to the quality check.</p>
      )}
      {shownError && <p role="alert" className="text-sm text-danger">{shownError}</p>}
      {approving && (
        <ApproveChangeModal isOpen onClose={() => setApproving(null)} change={approving} currentDue={data.order?.due_date ?? null} busy={busy} onApprove={(body) => rd.actions.approveChange(approving.id, body)} />
      )}
    </div>
  );
}
