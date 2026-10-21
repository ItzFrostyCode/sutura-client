'use client';

import JobRequirementsCard from './JobRequirementsCard';
import React from 'react';
import { X } from 'lucide-react';
import { Job, GarmentSpecTable, CustomizationInstruction } from '../jobTypes';
import { CANCELLATION_REASON_LABELS } from '../jobHelpers';
import JobSpecCard from './JobSpecCard';
import JobConsultationCard from './JobConsultationCard';
import JobCutSheetCard from './JobCutSheetCard';
import JobMeasurementCard from './JobMeasurementCard';
import JobRosterCard from './JobRosterCard';
import JobGarmentSpecTableCard from './spec/JobGarmentSpecTableCard';
import JobCustomizationInstructionsCard from './spec/JobCustomizationInstructionsCard';

interface JobOverviewTabProps {
  job: Job;
  notes: string;
  setNotes: (notes: string) => void;
  downpaymentShortfall: number;
  onUseCurrentMeasurement: (versionId: number) => void;
  onToggleRosterItem: (index: number) => void;
  onSaveSpecTable?: (table: GarmentSpecTable) => Promise<void>;
  onSaveInstructions?: (instructions: CustomizationInstruction[]) => Promise<void>;
  storeId?: number;
  onRefreshJob?: () => Promise<void>;
}

/** The order's details: what is being made, the sizes, the references and the requirements. Money lives in Payments. */
export default function JobOverviewTab({
  job,
  notes,
  setNotes,
  downpaymentShortfall,
  onUseCurrentMeasurement,
  onToggleRosterItem,
  onSaveSpecTable,
  onSaveInstructions,
  storeId,
  onRefreshJob,
}: JobOverviewTabProps) {
  return (
    <div className="space-y-5">
      {/* Cancellation Notice */}
      {job.status === 'cancelled' && job.cancellation_reason && (
        <div className="bg-danger/10 border border-danger/25 rounded-2xl p-4 flex items-start gap-3">
          <X size={16} className="text-danger shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-danger font-bold">This order was cancelled</p>
            <p className="text-danger/80 mt-0.5">
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
            <p className="text-danger font-bold">This order was rejected</p>
            <p className="text-danger/80 mt-0.5">Reason: {job.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <JobConsultationCard job={job} />
            <JobSpecCard job={job} />

            {/* PART A: Flexible Per-Garment / Per-Person Specification Table */}
            {onSaveSpecTable && (
              <JobGarmentSpecTableCard
                job={job}
                onSaveSpecTable={onSaveSpecTable}
              />
            )}

            {/* PART B: Customization Instructions & References */}
            {onSaveInstructions && (
              <JobCustomizationInstructionsCard
                job={job}
                onSaveInstructions={onSaveInstructions}
                storeId={storeId}
              />
            )}

            <JobCutSheetCard job={job} notes={notes} setNotes={setNotes} />
            <JobMeasurementCard
              job={job}
              onUseCurrentMeasurement={onUseCurrentMeasurement}
              storeId={storeId}
              onRefreshJob={onRefreshJob}
            />
            <JobRosterCard job={job} onToggleRosterItem={onToggleRosterItem} />
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <JobRequirementsCard job={job} paymentMet={downpaymentShortfall <= 0} onChanged={onRefreshJob} />
          </div>
        </div>
      </div>
    </div>
  );
}
