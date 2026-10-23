import React from 'react';
import { AlertTriangle, Loader2, StickyNote } from 'lucide-react';
import { BTN_SM, PLAIN_FIELD } from '@/components/shared/plainForm';
import { Job } from './jobTypes';
import type { Job as StageJob } from './jobHelpers';
import { stepLabel } from './detail/production/stages';
import TimelinePanel from './detail/production/TimelinePanel';
import ReferenceSection from './detail/production/ReferenceSection';
import ProgressPhotos from './detail/production/ProgressPhotos';
import CompletionPhoto from './detail/production/CompletionPhoto';
import SectionHeading from './detail/production/SectionHeading';
import type { OrderReadinessApi } from './readiness/useOrderReadiness';

interface JobProductionTimelineProps {
  readonly job: Job;
  /** The order's steps and actions: Next / Back / Hold / Resume and the quality check go through it, instantly. */
  readonly rd: OrderReadinessApi;
  readonly notes: string;
  readonly setNotes: (notes: string) => void;
  readonly completionPhotoUrl: string;
  readonly setCompletionPhotoUrl: (url: string) => void;
  readonly onProgressPhotoAdded: () => void;
  readonly onSave?: () => void;
  readonly saving?: boolean;
  readonly dirty?: boolean;
  /** A completed order: notes read as text; photos can be viewed, not added or removed. */
  readonly readOnly?: boolean;
}

const FROM_QC = ['qc_ironing', 'qc_check', 'final_adjustments', 'ready_for_pickup', 'ready_for_fitting', 'balance_handover', 'completed'];

/** The production controls: the line, reference, photos and notes. Notes and photos are a draft saved with Save. It sits inside the page's "Work stage" section, so it draws no outer card. */
export default function JobProductionTimeline({
  job, rd, notes, setNotes, completionPhotoUrl, setCompletionPhotoUrl, onProgressPhotoAdded, onSave, saving, dirty, readOnly,
}: JobProductionTimelineProps) {
  const atOrPastQC = FROM_QC.includes(job.status);

  return (
    <div className="space-y-6">
      <TimelinePanel job={job as unknown as StageJob} rd={rd} />

      {job.material_source === 'customer_supplied' && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/[0.08] px-3.5 py-3 text-[13px] text-amber-800">
          <AlertTriangle size={16} className="shrink-0" />
          <p>Customer-supplied fabric/garment — keep it separate from the shop&apos;s own fabric</p>
        </div>
      )}

      <ReferenceSection job={job} />
      <ProgressPhotos job={job} stageLabel={stepLabel} onProgressPhotoAdded={onProgressPhotoAdded} readOnly={readOnly} />

      <section className="space-y-2 border-t border-line pt-6">
        <SectionHeading icon={StickyNote} title="Notes / Remarks" htmlFor="notes-remarks" />
        {readOnly ? (
          <p className="whitespace-pre-wrap text-sm text-ink-body">{notes.trim() || 'No notes.'}</p>
        ) : (
          <textarea
            id="notes-remarks"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className={`${PLAIN_FIELD} h-auto min-h-28 resize-y py-3`}
            placeholder="e.g. Needs adjustments on the sleeves..."
          />
        )}
      </section>

      {(atOrPastQC || completionPhotoUrl) && <CompletionPhoto url={completionPhotoUrl} setUrl={setCompletionPhotoUrl} readOnly={readOnly} />}

      {!readOnly && onSave && dirty && (
        <button type="button" disabled={saving} onClick={onSave} className={BTN_SM}>
          {saving && <Loader2 size={15} className="animate-spin" />} Save changes
        </button>
      )}
    </div>
  );
}
