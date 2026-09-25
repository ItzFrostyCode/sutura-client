'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { Job } from '../jobTypes';

interface JobOverviewKPIStripProps {
  job: Job;
}

export default function JobOverviewKPIStrip({ job }: JobOverviewKPIStripProps) {
  const totalAmount = Number.parseFloat(String(job.total_amount || 0));
  const balance = Number.parseFloat(String(job.balance || 0));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* Due Date Card */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Target Due Date</span>
        <p className="text-base sm:text-lg font-bold text-ink mt-1">
          {job.due_date ? new Date(job.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date Set'}
        </p>
        <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
          <Clock size={12} className="text-taupe" />
          {job.due_date ? 'Production schedule target' : 'Pending deadline confirmation'}
        </p>
      </div>

      {/* Payment Summary Card */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Payment Status</span>
        <p className="text-base sm:text-lg font-bold text-ink mt-1">
          ₱{totalAmount.toFixed(2)}
        </p>
        <p className="text-xs mt-0.5 font-semibold flex items-center gap-1">
          {balance <= 0 ? (
            <span className="text-emerald-700">✓ Fully Paid</span>
          ) : (
            <span className="text-amber-700">₱{balance.toFixed(2)} balance remaining</span>
          )}
        </p>
      </div>

      {/* Client Status Card */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Customer</span>
        <p className="text-base sm:text-lg font-bold text-ink mt-1 truncate">
          {job.customer?.name || 'Walk-in Guest'}
        </p>
        <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1 truncate">
          {job.customer_job_count && job.customer_job_count > 1 ? (
            <span className="text-amber-700 font-bold">★ Suki (Order #{job.customer_job_count})</span>
          ) : (
            <span>New Customer Order</span>
          )}
        </p>
      </div>

      {/* Production Stage Card */}
      <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs">
        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Current Stage</span>
        <p className="text-base sm:text-lg font-bold text-ink mt-1 capitalize">
          {job.status.replaceAll('_', ' ')}
        </p>
        <p className="text-xs text-ink-muted mt-0.5 truncate">
          Staff: <strong className="text-ink-body font-semibold">{job.assigned_staff?.name || 'Unassigned'}</strong>
        </p>
      </div>
    </div>
  );
}
