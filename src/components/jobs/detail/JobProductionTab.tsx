'use client';

import React from 'react';
import { Scissors, Clock3, Package } from 'lucide-react';
import { Job } from '../jobTypes';
import JobProductionTimeline from '../JobProductionTimeline';

const CUSTOMER_MATERIAL_STATUSES = ['safe', 'damaged', 'lost', 'returned'] as const;

interface JobProductionTabProps {
  job: Job;
  status: string;
  setStatus: (status: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  completionPhotoUrl: string;
  setCompletionPhotoUrl: (url: string) => void;
  estimatedReadyAt: string;
  setEstimatedReadyAt: (val: string) => void;
  customerMaterialStatus: string;
  setCustomerMaterialStatus: (val: string) => void;
  setCancellationReason: (reason: string) => void;
  setHoldReason: (reason: string) => void;
  refreshJob: () => void;
}

export default function JobProductionTab({
  job,
  status,
  setStatus,
  notes,
  setNotes,
  completionPhotoUrl,
  setCompletionPhotoUrl,
  estimatedReadyAt,
  setEstimatedReadyAt,
  customerMaterialStatus,
  setCustomerMaterialStatus,
  setCancellationReason,
  setHoldReason,
  refreshJob,
}: JobProductionTabProps) {
  const collectedAmount =
    Number.parseFloat(String(job.total_amount)) -
    Number.parseFloat(String(job.balance)) -
    Number.parseFloat(String(job.discount_amount ?? 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Production Timeline Column (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <JobProductionTimeline
          job={job}
          status={status}
          setStatus={setStatus}
          notes={notes}
          setNotes={setNotes}
          completionPhotoUrl={completionPhotoUrl}
          setCompletionPhotoUrl={setCompletionPhotoUrl}
          setCancellationReason={setCancellationReason}
          setHoldReason={setHoldReason}
          collectedAmount={collectedAmount}
          onProgressPhotoAdded={refreshJob}
        />
      </div>

      {/* Right Sidebar Column (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Quick Production Context Snapshot */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2.5">
            <Scissors size={15} className="text-taupe" /> Production Snapshot
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Active Stage:</span>
              <strong className="text-ink font-bold capitalize bg-canvas px-2 py-0.5 rounded border border-line">
                {status.replaceAll('_', ' ')}
              </strong>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Assigned Tailor:</span>
              <strong className="text-ink font-bold">{job.assigned_staff?.name || 'Unassigned'}</strong>
            </div>
            {job.due_date && (
              <div className="flex justify-between text-ink-muted">
                <span>Due Date:</span>
                <strong className="text-ink font-bold">
                  {new Date(job.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </strong>
              </div>
            )}
            {job.is_rush && (
              <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-line">
                <span>Priority:</span>
                <span>⚡ Rush Order</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer-Facing Tracker Fields — surfaced on the customer's
            My Orders detail page and the public /track lookup, not just
            internally. See docs/CUSTOMER-WORKFLOW.md §7.4/§22. */}
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3.5">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-2.5">
            <Clock3 size={15} className="text-taupe" /> Customer-Facing Status
          </h3>

          <div>
            <label htmlFor="estimatedReadyAt" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
              Estimated Ready Date <span className="text-[11px] font-normal text-ink-faint lowercase">(optional)</span>
            </label>
            <input
              id="estimatedReadyAt"
              type="datetime-local"
              value={estimatedReadyAt}
              onChange={(e) => setEstimatedReadyAt(e.target.value)}
              className="w-full px-3.5 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            />
            <p className="text-[11px] text-ink-faint mt-1 leading-snug">
              Shown to the customer as &ldquo;Estimated ready by&rdquo; on their order tracker — a best-guess ETA, not a guarantee.
            </p>
          </div>

          {job.material_source === 'customer_supplied' && (
            <div className="pt-3 border-t border-line">
              <label htmlFor="customerMaterialStatus" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                <Package size={12} className="text-taupe" /> Customer&apos;s Material
              </label>
              <select
                id="customerMaterialStatus"
                value={customerMaterialStatus}
                onChange={(e) => setCustomerMaterialStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs capitalize"
              >
                <option value="">Not tracked</option>
                {CUSTOMER_MATERIAL_STATUSES.map(s => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
              <p className="text-[11px] text-ink-faint mt-1 leading-snug">
                Tracks the fabric the customer dropped off — visible to them on their order tracker.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
