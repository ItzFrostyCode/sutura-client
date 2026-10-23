import React from 'react';
import QuotationModal from './QuotationModal';
import ApprovalModal from './ApprovalModal';
import TailorsModal from './TailorsModal';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { ReadinessData } from './readinessTypes';
import type { Job } from '../jobHelpers';

export type OpenModal = 'quotation' | 'approval' | 'tailors' | null;

interface ReadinessModalsProps {
  readonly open: OpenModal;
  readonly onClose: () => void;
  readonly storeId: number;
  readonly job: Job;
  readonly data: ReadinessData;
  readonly rd: OrderReadinessApi;
  readonly currentTotal: number;
  readonly started: boolean;
  readonly onChangePieces: () => void;
}

/** The three windows the Steps tab can open: the quotation, the in-person approval and the tailor plan. */
export default function ReadinessModals({ open, onClose, storeId, job, data, rd, currentTotal, started, onChangePieces }: ReadinessModalsProps) {
  return (
    <>
      {open === 'quotation' && (
        <QuotationModal isOpen onClose={onClose} job={job} data={data} currentTotal={currentTotal} busy={rd.busy === 'quotation'} blockers={rd.blockers} onSave={rd.actions.saveQuotation} onChangePieces={onChangePieces} />
      )}
      {open === 'approval' && <ApprovalModal isOpen onClose={onClose} data={data} busy={rd.busy === 'approval'} onApprove={rd.actions.approveInPerson} />}
      {open === 'tailors' && <TailorsModal isOpen onClose={onClose} storeId={storeId} current={data.assignees ?? []} capacity={data.capacity} busy={rd.busy === 'tailor'} onSave={rd.actions.saveAssignees} started={started} />}
    </>
  );
}
