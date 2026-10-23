'use client';

import React from 'react';
import { Factory, Clock, Package } from 'lucide-react';
import { PLAIN_FIELD } from '@/components/shared/plainForm';
import { Job } from '../jobTypes';
import SectionHeader from '../ui/SectionHeader';
import { stageNote } from '../jobStage';

const CUSTOMER_MATERIAL_STATUSES = ['safe', 'damaged', 'lost', 'returned'] as const;
const CARD = 'h-full rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6';
const OVERLINE = 'mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted';

interface JobProductionAsideProps {
  readonly job: Job;
  readonly estimatedReadyAt: string;
  readonly setEstimatedReadyAt: (val: string) => void;
  readonly customerMaterialStatus: string;
  readonly setCustomerMaterialStatus: (val: string) => void;
  /** A completed order: the two fields read as text. */
  readonly readOnly?: boolean;
}

/** Production context beside the work: a snapshot of the order, and the fields the customer sees on their tracker. */
export default function JobProductionAside({ job, estimatedReadyAt, setEstimatedReadyAt, customerMaterialStatus, setCustomerMaterialStatus, readOnly }: JobProductionAsideProps) {
  return (
    <>
      <section className={CARD}>
        <SectionHeader icon={Factory} title="Production Snapshot" as="h3" />
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 text-ink-muted">
            <span>Active Stage:</span>
            <span className="rounded-md bg-sunken px-2 py-0.5 text-[13px] font-medium text-ink">{stageNote(job as unknown as Parameters<typeof stageNote>[0])}</span>
          </div>
          <div className="flex justify-between gap-3 text-ink-muted">
            <span>Last Updated By:</span>
            <span className="font-medium text-ink">{job.assigned_staff?.name || 'Not yet touched'}</span>
          </div>
          {job.due_date && (
            <div className="flex justify-between gap-3 text-ink-muted">
              <span>Due Date:</span>
              <span className="font-medium text-ink">{new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
          {job.is_rush && (
            <div className="flex justify-between gap-3 border-t border-line pt-3 font-medium text-amber-700">
              <span>Priority:</span>
              <span>⚡ Rush Order</span>
            </div>
          )}
        </div>
      </section>

      {/* Customer-facing tracker fields: shown on the customer's My Orders detail page and the public /track lookup, not just internally. */}
      <section className={CARD}>
        <SectionHeader icon={Clock} title="Customer-Facing Status" as="h3" />
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="estimatedReadyAt" className={OVERLINE}>
              Estimated Ready Date <span className="text-[11px] font-normal normal-case tracking-normal text-ink-faint">(optional)</span>
            </label>
            {readOnly ? (
              <p className="text-sm text-ink">{estimatedReadyAt ? new Date(estimatedReadyAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set'}</p>
            ) : (
              <>
                <input id="estimatedReadyAt" type="datetime-local" value={estimatedReadyAt} onChange={(e) => setEstimatedReadyAt(e.target.value)} className={PLAIN_FIELD} />
                <p className="mt-1.5 text-[13px] text-ink-muted">
                  Shown to the customer as &ldquo;Estimated ready by&rdquo; on their order tracker — a best-guess ETA, not a guarantee.
                </p>
              </>
            )}
          </div>

          {job.material_source === 'customer_supplied' && (
            <div className="border-t border-line pt-4">
              <label htmlFor="customerMaterialStatus" className={OVERLINE}>
                <Package size={13} className="text-taupe" /> Customer&apos;s Material
              </label>
              {readOnly ? (
                <p className="text-sm capitalize text-ink">{customerMaterialStatus || 'Not tracked'}</p>
              ) : (
                <>
                  <select id="customerMaterialStatus" value={customerMaterialStatus} onChange={(e) => setCustomerMaterialStatus(e.target.value)} className={`${PLAIN_FIELD} capitalize`}>
                    <option value="">Not tracked</option>
                    {CUSTOMER_MATERIAL_STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[13px] text-ink-muted">
                    Tracks the fabric the customer dropped off — visible to them on their order tracker.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
