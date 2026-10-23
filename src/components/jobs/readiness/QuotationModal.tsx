import React, { useRef, useState } from 'react';
import Modal from '@/components/Modal';
import type { Job } from '../jobHelpers';
import QuotationChecklist from './QuotationChecklist';
import QuotationDateSection from './QuotationDateSection';
import QuotationExtras from './QuotationExtras';
import QuotationFooter from './QuotationFooter';
import QuotationOrderLine from './QuotationOrderLine';
import QuotationPaymentSection from './QuotationPaymentSection';
import QuotationPriceSection from './QuotationPriceSection';
import QuotationReason from './QuotationReason';
import QuotationStep from './QuotationStep';
import { useQuotationForm } from './useQuotationForm';
import { piecesSummary } from './piecesSummary';
import { jobPieces } from '@/lib/orderSize';
import type { Blocker, ReadinessData } from './readinessTypes';

interface QuotationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly job: Job;
  readonly data: ReadinessData;
  /** The order's current total (only a fallback when the readiness data has none). */
  readonly currentTotal: number;
  readonly busy: boolean;
  readonly blockers: Blocker[];
  readonly onSave: (body: Record<string, unknown>) => Promise<boolean>;
  /** Closes the window and opens the pieces and sizes editor under the Details & sizes step. */
  readonly onChangePieces?: () => void;
}

type Missing = 'date' | 'reason';

/** Brings a field into view and puts the cursor in it. */
function reveal(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el?.focus({ preventScroll: true });
}

export default function QuotationModal({ isOpen, onClose, job, data, currentTotal, busy, blockers, onSave, onChangePieces }: QuotationModalProps) {
  // The pieces come from the order (changed under Details & sizes); the price is for one piece times that number.
  const pieces = jobPieces(job);
  const f = useQuotationForm(job, data, currentTotal, pieces);
  const [tried, setTried] = useState<Missing | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  // A message shows only while its field is still missing, so it clears by itself once the field is filled.
  const dateError = tried === 'date' && !f.dueDate ? 'Set the ready date first.' : null;
  const reasonError = tried === 'reason' && f.needsReason && !f.reason.trim() ? (f.askChange ? 'Write why the price changed first.' : 'Write why this customer can pay when picking up first.') : null;

  const submit = async (status: 'estimate' | 'final') => {
    const missing: Missing | null = status === 'final' && !f.dueDate ? 'date' : f.needsReason && !f.reason.trim() ? 'reason' : null;
    setTried(missing);
    if (missing) {
      reveal(missing === 'date' ? dateRef.current : reasonRef.current);
      return;
    }
    if (await onSave(f.payload(status))) onClose();
  };

  const change = onChangePieces ? () => { onClose(); onChangePieces(); } : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quotation"
      maxWidth="max-w-xl"
      footer={<QuotationFooter total={f.total} deposit={f.deposit} busy={busy} message={dateError ?? reasonError} onSubmit={submit} />}
    >
      <div className="space-y-5">
        <QuotationOrderLine job={job} />

        <QuotationStep n={1} title="What you're making" first>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-sm text-ink-body">{piecesSummary(job)}</p>
            {change && <button type="button" onClick={change} className="min-h-6 text-sm font-medium text-ink underline underline-offset-2 hover:text-espresso">Change</button>}
          </div>
        </QuotationStep>

        <QuotationStep n={2} title="Price">
          <QuotationPriceSection f={f} pieces={pieces} />
        </QuotationStep>

        {f.needsReason && <QuotationReason value={f.reason} onChange={f.setReason} forChange={f.askChange} error={reasonError} inputRef={reasonRef} />}

        <QuotationStep n={3} title="Ready date">
          <QuotationDateSection dueDate={f.dueDate} setDueDate={f.setDueDate} cap={data.capacity} inputRef={dateRef} error={dateError} />
        </QuotationStep>

        <QuotationStep n={4} title="Payment">
          <QuotationPaymentSection policy={f.policy} setPolicy={f.setPolicy} percent={f.percent} setPercent={f.setPercent} total={f.total} deposit={f.deposit ?? 0} />
          <QuotationExtras validUntil={f.validUntil} setValidUntil={f.setValidUntil} notes={f.notes} setNotes={f.setNotes} />
        </QuotationStep>

        <QuotationChecklist checklist={data.checklist} dueDate={f.dueDate} blockers={blockers} />
      </div>
    </Modal>
  );
}
