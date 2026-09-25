'use client';

import React, { useState } from 'react';
import { HelpCircle, Scissors, Clock3, Package } from 'lucide-react';
import { Job } from '../jobTypes';
import JobProductionTimeline from '../JobProductionTimeline';
import MaterialsUsedCard from '../MaterialsUsedCard';

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
  isOutsourced: boolean;
  setIsOutsourced: (val: boolean) => void;
  partnerStoreName: string;
  setPartnerStoreName: (name: string) => void;
  outsourcingCost: string;
  setOutsourcingCost: (cost: string) => void;
  store: { id: number; name?: string } | null;
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
  isOutsourced,
  setIsOutsourced,
  partnerStoreName,
  setPartnerStoreName,
  outsourcingCost,
  setOutsourcingCost,
  store,
}: JobProductionTabProps) {
  const [showOutsourcingHelp, setShowOutsourcingHelp] = useState(false);

  const collectedAmount =
    Number.parseFloat(String(job.total_amount)) -
    Number.parseFloat(String(job.balance)) -
    Number.parseFloat(String(job.discount_amount ?? 0));

  const outsourcingCostNum = Number.parseFloat(outsourcingCost || '0');
  const jobTotal = Number.parseFloat(String(job.total_amount)) || 0;
  const outsourcingProfit = jobTotal - outsourcingCostNum;
  const isLoss = outsourcingProfit <= 0;

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
        {/* Outsourcing Toggle Card */}
        <div className={`border rounded-2xl p-5 transition-colors shadow-2xs ${isOutsourced ? 'bg-taupe/5 border-taupe/30' : 'bg-surface border-line'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="outsourced-toggle" className="text-sm font-bold text-ink cursor-pointer">Outsourcing</label>
                <button
                  type="button"
                  onClick={() => setShowOutsourcingHelp(p => !p)}
                  className="text-ink-faint hover:text-taupe transition-colors"
                  title="What is this?"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">Outsource to a partner store?</p>
            </div>
            <div className="relative inline-flex items-center">
              <input
                id="outsourced-toggle"
                type="checkbox"
                className="sr-only peer"
                checked={isOutsourced}
                onChange={(e) => setIsOutsourced(e.target.checked)}
              />
              <label htmlFor="outsourced-toggle" className="w-10 h-5 bg-canvas border border-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sage cursor-pointer">
                <span className="sr-only">Toggle Outsourcing</span>
              </label>
            </div>
          </div>

          {showOutsourcingHelp && (
            <div className="mt-3 p-3 bg-canvas border border-line rounded-xl text-xs text-ink-body leading-relaxed">
              Turn this on when you&apos;re subcontracting this job — or part of it, like beadwork or embroidery — to another store or freelance artisan, usually because you&apos;re overbooked or don&apos;t have that skill or machine in-house. The customer still pays your full Total Amount either way — enter what <strong>you</strong> pay the partner below so you can see your real profit on this job, not just what the customer paid.
            </div>
          )}

          {isOutsourced && (
            <div className="mt-4 space-y-3 pt-3 border-t border-line">
              <div>
                <label htmlFor="partnerStoreName" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Partner Store Name <span className="text-danger">*</span>
                </label>
                <input
                  id="partnerStoreName"
                  type="text"
                  required
                  value={partnerStoreName}
                  onChange={(e) => setPartnerStoreName(e.target.value)}
                  placeholder="e.g. Maria's Tailoring"
                  className="w-full px-3.5 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
                />
              </div>

              <div>
                <label htmlFor="outsourcingCost" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  What You&apos;re Paying Them <span className="text-[11px] font-normal text-ink-faint lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-bold text-xs">₱</span>
                  <input
                    id="outsourcingCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={outsourcingCost}
                    onChange={(e) => setOutsourcingCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {outsourcingCostNum > 0 && (
                <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs ${isLoss ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-sage/10 border-sage/20 text-sage'}`}>
                  <span className="font-medium">{isLoss ? 'Losing money' : 'Your profit'}</span>
                  <span className="font-bold">₱{outsourcingProfit.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

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

        {store && (
          <MaterialsUsedCard
            storeId={store.id}
            jobOrderId={job.id}
            materials={job.materials ?? []}
            onChange={refreshJob}
          />
        )}
      </div>
    </div>
  );
}
