import React from 'react';
import { Receipt } from 'lucide-react';
import type { ChecklistItem } from './readinessTypes';
import type { OrderReadinessApi } from './useOrderReadiness';

interface StepActionProps {
  readonly item: ChecklistItem;
  readonly api: OrderReadinessApi;
  readonly onOpen: (what: 'quotation' | 'approval' | 'tailors') => void;
  readonly onGoToFinancials?: () => void;
}

export const STEP_PRIMARY = 'inline-flex h-11 sm:h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-espresso px-4 text-[13px] font-semibold text-white hover:bg-espresso/90 disabled:opacity-40';
const primary = STEP_PRIMARY;
const ghost = 'inline-flex h-11 sm:h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-espresso/[0.14] bg-surface px-4 text-[13px] font-medium text-ink hover:bg-sunken disabled:opacity-40';

/** The one button that moves a checklist step forward, if the viewer may press it. */
export default function StepAction({ item, api, onOpen, onGoToFinancials }: StepActionProps) {
  const d = api.data;
  if (!d || !item.applicable) return null;
  const perm = d.permissions;
  const busy = api.busy !== null;
  const status = d.status;
  const pending = status === 'pending';
  // Set-up sign-offs belong to the owner and branch managers; plain staff see the step but have no button.
  const prepare = Boolean(perm.can_prepare);

  switch (item.key) {
    case 'specs':
      return prepare && !item.done && pending ? <button type="button" disabled={busy} onClick={api.actions.approveSpecs} className={ghost}>Approve specs</button> : null;
    case 'measurements':
      return prepare && !item.done && status !== 'cancelled' ? <button type="button" disabled={busy} onClick={api.actions.verifyMeasurements} className={ghost}>Mark verified</button> : null;
    case 'customer_items':
      return prepare && !item.done && pending ? (
        <>
          <button type="button" disabled={busy} onClick={() => api.actions.assessCustomerItems('suitable')} className={ghost}>Suitable</button>
          <button type="button" disabled={busy} onClick={() => api.actions.assessCustomerItems('not_suitable')} className={ghost}>Not suitable</button>
        </>
      ) : null;
    case 'quotation':
      return perm.can_edit_quotation ? <button type="button" onClick={() => onOpen('quotation')} className={item.done ? ghost : primary}>{item.done ? 'Edit' : <><Receipt size={15} /> Prepare quotation</>}</button> : null;
    case 'approval':
      return prepare && !item.done && pending && d.quotation?.status === 'final'
        ? <button type="button" disabled={busy} onClick={() => onOpen('approval')} className={ghost}>Record approval</button> : null;
    case 'deposit':
      return !item.done && perm.can_see_money && onGoToFinancials ? <button type="button" onClick={onGoToFinancials} className={ghost}>Collect deposit</button> : null;
    default:
      return null;
  }
}
