'use client';

import React from 'react';
import { CreditCard, Scissors, Store, Copy } from 'lucide-react';
import { Job } from '../jobTypes';

interface JobOverviewSidebarProps {
  job: Job;
  jobPaidSoFar: number;
  requiredDownpayment: number;
  downpaymentShortfall: number;
  showDownpaymentGate: boolean;
  onGoToFinancials: () => void;
  onGoToProduction: () => void;
  isOwnerOrManager: boolean;
}

export default function JobOverviewSidebar({
  job,
  jobPaidSoFar,
  requiredDownpayment,
  downpaymentShortfall,
  showDownpaymentGate,
  onGoToFinancials,
  onGoToProduction,
  isOwnerOrManager,
}: JobOverviewSidebarProps) {
  const balance = Number.parseFloat(String(job.balance || 0));

  return (
    <div className="space-y-6">
      {/* Financials Snapshot Card */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2">
            <CreditCard size={15} className="text-taupe" /> Financial Breakdown
          </h3>
          {isOwnerOrManager && (
            <button
              type="button"
              onClick={onGoToFinancials}
              className="text-xs font-bold text-taupe hover:underline"
            >
              Full Ledger →
            </button>
          )}
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between text-ink-muted">
            <span>Total Amount:</span>
            <strong className="text-ink font-bold">₱{Number.parseFloat(String(job.total_amount || 0)).toFixed(2)}</strong>
          </div>
          {job.is_rush && Number.parseFloat(String(job.rush_fee || 0)) > 0 && (
            <div className="flex justify-between text-amber-700 font-semibold">
              <span>Includes Rush Fee:</span>
              <span>+₱{Number.parseFloat(String(job.rush_fee)).toFixed(2)}</span>
            </div>
          )}
          {job.discount_amount && Number.parseFloat(String(job.discount_amount)) > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Discount Applied:</span>
              <span>-₱{Number.parseFloat(String(job.discount_amount)).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-muted pt-2 border-t border-line">
            <span>Total Paid So Far:</span>
            <strong className="text-emerald-700 font-bold">₱{jobPaidSoFar.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-line text-ink">
            <span>Remaining Balance:</span>
            <span className={balance > 0 ? 'text-amber-700 font-extrabold' : 'text-emerald-700 font-extrabold'}>
              ₱{balance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 50% Downpayment Progress Meter */}
        <div className="pt-2 space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-ink-muted">
            <span>50% Downpayment Policy</span>
            <span>{jobPaidSoFar >= requiredDownpayment ? '✓ Met' : `₱${jobPaidSoFar.toFixed(0)} / ₱${requiredDownpayment.toFixed(0)}`}</span>
          </div>
          <div className="w-full h-2 bg-canvas rounded-full overflow-hidden border border-line">
            <div
              className={`h-full rounded-full transition-all ${jobPaidSoFar >= requiredDownpayment ? 'bg-emerald-600' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (jobPaidSoFar / requiredDownpayment) * 100)}%` }}
            />
          </div>
          {showDownpaymentGate && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-0.5">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <CreditCard size={13} className="text-amber-700" />
                Downpayment Required
              </p>
              <p className="text-amber-800 text-[11px] leading-snug">
                ₱{downpaymentShortfall.toFixed(2)} more needed before cutting/production starts.
              </p>
            </div>
          )}
        </div>

        {isOwnerOrManager && (
          <button
            type="button"
            onClick={onGoToFinancials}
            className="w-full py-2.5 bg-taupe hover:bg-taupe-hover text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            Log Payment / Deposit
          </button>
        )}
      </div>

      {/* Production Stage Tracker Card */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-bold text-sm text-ink flex items-center gap-2">
            <Scissors size={15} className="text-taupe" /> Pipeline Status
          </h3>
          <button
            type="button"
            onClick={onGoToProduction}
            className="text-xs font-bold text-taupe hover:underline"
          >
            Timeline →
          </button>
        </div>

        <div className="p-3 bg-canvas/50 border border-line rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted font-bold">Active Stage:</span>
            <span className="font-bold text-ink capitalize bg-surface px-2.5 py-0.5 rounded-md border border-line shadow-2xs">
              {job.status.replaceAll('_', ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-line/60">
            <span className="text-ink-muted">Assigned Tailor:</span>
            <span className="font-bold text-ink">{job.assigned_staff?.name || 'Unassigned'}</span>
          </div>
        </div>

        {job.is_outsourced && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
            <span className="font-bold text-purple-900 block">Outsourced Production</span>
            <p className="text-purple-800">Partner: {job.partner_store_name || 'Subcontractor'}</p>
            {job.outsourcing_cost && (
              <p className="text-purple-700">Cost: ₱{Number.parseFloat(String(job.outsourcing_cost)).toFixed(2)}</p>
            )}
          </div>
        )}

        {Boolean(job.adjustment_count && job.adjustment_count > 0) && (
          <div className="p-3 bg-canvas border border-line rounded-xl text-xs flex items-center justify-between">
            <span className="text-ink-muted font-semibold">Fitting Adjustments:</span>
            <span className="font-bold text-amber-700">{job.adjustment_count} round(s)</span>
          </div>
        )}
      </div>

      {/* Fulfillment & Tracking Card */}
      <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-3">
          <Store size={15} className="text-taupe" /> Tracking & Logistics
        </h3>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-canvas/50 border border-line rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Customer Tracking Code</span>
            <div className="flex items-center justify-between">
              <code className="font-mono font-bold text-sm text-ink select-all">{job.tracking_code || job.order_number}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(job.tracking_code || job.order_number);
                }}
                className="p-1.5 rounded-lg border border-line bg-surface hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
                title="Copy tracking code"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
          <div className="flex justify-between text-ink-muted pt-1">
            <span>Intake Channel:</span>
            <strong className="text-ink font-semibold capitalize">{job.intake_channel}</strong>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Fulfillment Mode:</span>
            <strong className="text-ink font-semibold capitalize">{job.fulfillment_type}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
