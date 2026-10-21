import React from 'react';
import type { ChecklistItem } from './readinessTypes';
import type { OrderReadinessApi } from './useOrderReadiness';

interface StepActionProps {
  readonly item: ChecklistItem;
  readonly api: OrderReadinessApi;
  readonly onOpen: (what: 'quotation' | 'approval' | 'tailors') => void;
  readonly onGoToFinancials?: () => void;
}

const primary = 'h-11 sm:h-9 whitespace-nowrap rounded-lg bg-espresso px-3 text-xs font-bold text-white hover:bg-espresso/90 disabled:opacity-50';
const ghost = 'h-11 sm:h-9 whitespace-nowrap rounded-lg border border-line px-3 text-xs font-bold text-ink-body hover:bg-sunken disabled:opacity-50';

/** The one button that moves a checklist step forward, if the viewer may press it. */
export default function StepAction({ item, api, onOpen, onGoToFinancials }: StepActionProps) {
  const d = api.data;
  if (!d || !item.applicable) return null;
  const perm = d.permissions;
  const busy = api.busy !== null;
  const status = d.status;
  const pending = status === 'pending';
  const confirmBlocked = (d.blockers?.confirm.length ?? 0) > 0;
  const startBlocked = (d.blockers?.start.length ?? 0) > 0 || status !== 'confirmed';

  switch (item.key) {
    case 'specs':
      return !item.done && pending ? <button type="button" disabled={busy} onClick={api.actions.approveSpecs} className={ghost}>Approve specs</button> : null;
    case 'measurements':
      return !item.done && status !== 'cancelled' ? <button type="button" disabled={busy} onClick={api.actions.verifyMeasurements} className={ghost}>Mark verified</button> : null;
    case 'customer_items':
      return !item.done && pending ? (
        <>
          <button type="button" disabled={busy} onClick={() => api.actions.assessCustomerItems('suitable')} className={ghost}>Suitable</button>
          <button type="button" disabled={busy} onClick={() => api.actions.assessCustomerItems('not_suitable')} className={ghost}>Not suitable</button>
        </>
      ) : null;
    case 'materials':
      return !item.done && ['confirmed', 'awaiting_materials'].includes(status)
        ? <button type="button" disabled={busy} onClick={() => api.actions.setMaterials('ready')} className={ghost}>Mark ready</button> : null;
    case 'quotation':
      return perm.can_edit_quotation ? <button type="button" onClick={() => onOpen('quotation')} className={item.done ? ghost : primary}>{item.done ? 'Edit' : 'Prepare quotation'}</button> : null;
    case 'approval':
      return !item.done && pending && d.quotation?.status === 'final'
        ? <button type="button" disabled={busy} onClick={() => onOpen('approval')} className={ghost}>Record approval</button> : null;
    case 'deposit':
      return !item.done && perm.can_see_money && onGoToFinancials ? <button type="button" onClick={onGoToFinancials} className={ghost}>Collect deposit</button> : null;
    case 'confirmed':
      return !item.done && perm.can_confirm
        ? <button type="button" disabled={busy || confirmBlocked} title={confirmBlocked ? d.blockers?.confirm[0]?.message : undefined} onClick={api.actions.confirm} className={primary}>Confirm order</button> : null;
    case 'tailor':
      return perm.can_assign && !['completed', 'cancelled', 'rejected'].includes(status)
        ? <button type="button" onClick={() => onOpen('tailors')} className={item.done ? ghost : primary}>{item.done ? 'Change' : 'Plan tailors'}</button> : null;
    case 'started':
      return !item.done && ['confirmed', 'awaiting_materials'].includes(status)
        ? <button type="button" disabled={busy || startBlocked} title={startBlocked ? (d.blockers?.start[0]?.message ?? 'Waiting for materials') : undefined} onClick={api.actions.startProduction} className={primary}>Start production</button> : null;
    default:
      return null;
  }
}
