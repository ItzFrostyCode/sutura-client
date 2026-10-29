import React, { useState } from 'react';
import { BTN_SM, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { jobGarments, jobPeople, jobSoldAsSet, orderedLabel } from '@/lib/orderSize';
import type { Job } from '../jobHelpers';
import QuotationSizeCounts from './QuotationSizeCounts';
import type { QuotationOrderState } from './useQuotationOrder';
import { garmentsLabel } from '@/lib/orderUnits';

interface QuotationWhatStepProps {
  readonly job: Job;
  readonly o: QuotationOrderState;
  readonly onGoToDetails?: () => void;
}

const RADIO = 'flex min-h-11 items-center gap-2 text-sm text-ink-body';

/** Pieces and sizes editor (inline under Details & sizes): how many pieces, how many people, and whether they are standard sizes or custom measurements. */
export default function QuotationWhatStep({ job, o, onGoToDetails }: QuotationWhatStepProps) {
  // An order that needs no measuring (the service says so) is not asked how it is sized, unless the shop wants to.
  const [askSizes, setAskSizes] = useState(false);
  const noSizing = !o.team && job.measurement_requirement === 'none' && o.mode === 'custom' && !askSizes;
  if (o.team) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-ink-body">{jobPeople(job)} people · {orderedLabel(job)}{jobSoldAsSet(job) && ` · ${garmentsLabel(jobGarments(job))}`} (from the team list)</p>
        {onGoToDetails && <button type="button" onClick={onGoToDetails} className={BTN_SM}>Edit the team list</button>}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <label className={PLAIN_LABEL}>Pieces
          <input type="number" min={1} step={1} value={o.pieces} onChange={(e) => o.setPieces(e.target.value)} className={`${PLAIN_FIELD} mt-1.5 max-w-40 font-normal`} />
        </label>
        <p className="text-[13px] text-ink-muted">How many garments in all. The quotation prices one piece and multiplies it by this number.</p>
      </div>
      {noSizing ? (
        <div className="space-y-2">
          <p className="text-sm text-ink-body">No measuring is needed for this order: the service does not ask for it.</p>
          <button type="button" onClick={() => setAskSizes(true)} className={BTN_SM}>Add sizes or measurements anyway</button>
        </div>
      ) : (<>
      <fieldset>
        <legend className={PLAIN_LABEL}>Sizes</legend>
        <label className={RADIO}><input type="radio" name="size-mode" checked={o.mode === 'standard'} onChange={() => o.setMode('standard')} className="h-4 w-4 accent-espresso" />Standard sizes (S, M, L…)</label>
        <label className={RADIO}><input type="radio" name="size-mode" checked={o.mode === 'custom'} onChange={() => o.setMode('custom')} className="h-4 w-4 accent-espresso" />Custom measurements (measure each person)</label>
      </fieldset>
      {o.mode === 'standard' ? (
        <QuotationSizeCounts counts={o.counts} onChange={o.setCount} sized={o.sized} pieces={o.piecesN} />
      ) : (
        <div>
          <label className={PLAIN_LABEL}>People to measure
            <input type="number" min={1} step={1} value={o.people ?? o.piecesN} onChange={(e) => o.setPeople(e.target.value)} className={`${PLAIN_FIELD} mt-1.5 max-w-40 font-normal`} />
          </label>
          <p className="text-[13px] text-ink-muted">
            {o.peopleN} {o.peopleN === 1 ? 'person needs' : 'people need'} measurements. Record them under Details → Garment Measurements.
          </p>
          {onGoToDetails && <button type="button" onClick={onGoToDetails} className={`${BTN_SM} mt-2`}>Open Details</button>}
        </div>
      )}
      </>)}
    </div>
  );
}
