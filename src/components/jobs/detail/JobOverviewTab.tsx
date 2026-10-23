'use client';

import JobRequirementsCard from './JobRequirementsCard';
import React from 'react';
import { X } from 'lucide-react';
import { Job, GarmentSpecTable, CustomizationInstruction } from '../jobTypes';
import CancelledNotice from './CancelledNotice';
import JobSpecCard from './JobSpecCard';
import JobConsultationCard from './JobConsultationCard';
import JobCutSheetCard from './JobCutSheetCard';
import JobMeasurementCard from './JobMeasurementCard';
import JobRosterCard from './JobRosterCard';
import JobGarmentSpecTableCard from './spec/JobGarmentSpecTableCard';
import JobCustomizationInstructionsCard from './spec/JobCustomizationInstructionsCard';
import { InstructionsReadOnly, SpecTableReadOnly } from './spec/SpecReadOnly';

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
  /** A completed order: tables, notes and lists read as plain text; nothing can be added, saved or ticked. */
  readOnly?: boolean;
  /** Plain staff read the sizes and instructions; only the owner and branch managers edit them (default true). */
  canEditDetails?: boolean;
}

const GroupLabel = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <p className="pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{children}</p>
);

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
  readOnly,
  canEditDetails = true,
}: JobOverviewTabProps) {
  const locked = readOnly || !canEditDetails;
  return (
    <div className="space-y-4">
      <CancelledNotice job={job} />

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

      {/* The order itself and what it needs, side by side. */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2">
          <JobSpecCard job={job} />
        </div>
        <JobRequirementsCard job={job} paymentMet={downpaymentShortfall <= 0} onChanged={onRefreshJob} />
      </div>

      <div className="space-y-4">
        <GroupLabel>Sizes and measurements</GroupLabel>
        {locked ? <SpecTableReadOnly job={job} /> : onSaveSpecTable && <JobGarmentSpecTableCard job={job} onSaveSpecTable={onSaveSpecTable} />}
        <JobMeasurementCard
          job={job}
          onUseCurrentMeasurement={onUseCurrentMeasurement}
          storeId={storeId}
          onRefreshJob={onRefreshJob}
        />
        <JobRosterCard job={job} onToggleRosterItem={onToggleRosterItem} readOnly={readOnly} />
      </div>

      <div className="space-y-4">
        <GroupLabel>How to make it</GroupLabel>
        <JobConsultationCard job={job} />
        {locked ? <InstructionsReadOnly job={job} /> : onSaveInstructions && (
          <JobCustomizationInstructionsCard job={job} onSaveInstructions={onSaveInstructions} storeId={storeId} />
        )}
        <JobCutSheetCard job={job} notes={notes} setNotes={setNotes} readOnly={readOnly} />
      </div>
    </div>
  );
}
