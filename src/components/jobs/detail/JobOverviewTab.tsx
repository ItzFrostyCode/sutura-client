'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Job } from '../jobTypes';
import { CANCELLATION_REASON_LABELS } from '../jobHelpers';
import JobOverviewKPIStrip from './JobOverviewKPIStrip';
import JobSpecCard from './JobSpecCard';
import JobCutSheetCard from './JobCutSheetCard';
import JobMeasurementCard from './JobMeasurementCard';
import JobRosterCard from './JobRosterCard';
import JobOverviewSidebar from './JobOverviewSidebar';

interface JobOverviewTabProps {
  job: Job;
  notes: string;
  setNotes: (notes: string) => void;
  jobPaidSoFar: number;
  requiredDownpayment: number;
  downpaymentShortfall: number;
  showDownpaymentGate: boolean;
  onUseCurrentMeasurement: (versionId: number) => void;
  onToggleRosterItem: (index: number) => void;
  onGoToFinancials: () => void;
  onGoToProduction: () => void;
  // Financials is Owner/Branch-Manager-exclusive (PAYMENT-WORKFLOW.md Part
  // B) — Staff sees this same Financial Breakdown card read-only, without
  // the "Full Ledger" / "Log Payment" links into the gated tab.
  isOwnerOrManager: boolean;
}

export default function JobOverviewTab({
  job,
  notes,
  setNotes,
  jobPaidSoFar,
  requiredDownpayment,
  downpaymentShortfall,
  showDownpaymentGate,
  onUseCurrentMeasurement,
  onToggleRosterItem,
  onGoToFinancials,
  onGoToProduction,
  isOwnerOrManager,
}: JobOverviewTabProps) {
  return (
    <div className="space-y-5">
      {/* Cancellation Notice */}
      {job.status === 'cancelled' && job.cancellation_reason && (
        <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4 flex items-start gap-3">
          <X size={16} className="text-danger shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-[#9A5C4F] font-bold">This order was cancelled</p>
            <p className="text-[#9A5C4F]/80 mt-0.5">
              Reason: {CANCELLATION_REASON_LABELS[job.cancellation_reason] ?? job.cancellation_reason}
            </p>
          </div>
        </div>
      )}

      {/* Rejection Notice */}
      {job.status === 'rejected' && job.rejection_reason && (
        <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4 flex items-start gap-3">
          <X size={16} className="text-danger shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-[#9A5C4F] font-bold">This order was rejected</p>
            <p className="text-[#9A5C4F]/80 mt-0.5">Reason: {job.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* KPI Strip */}
        <JobOverviewKPIStrip job={job} />

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <JobSpecCard job={job} />
            <JobCutSheetCard job={job} notes={notes} setNotes={setNotes} />
            <JobMeasurementCard job={job} onUseCurrentMeasurement={onUseCurrentMeasurement} />
            <JobRosterCard job={job} onToggleRosterItem={onToggleRosterItem} />
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <JobOverviewSidebar
              job={job}
              jobPaidSoFar={jobPaidSoFar}
              requiredDownpayment={requiredDownpayment}
              downpaymentShortfall={downpaymentShortfall}
              showDownpaymentGate={showDownpaymentGate}
              onGoToFinancials={onGoToFinancials}
              onGoToProduction={onGoToProduction}
              isOwnerOrManager={isOwnerOrManager}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
