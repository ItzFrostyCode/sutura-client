'use client';

import React from 'react';
import { Job } from '../jobTypes';
import JobProductionTimeline from '../JobProductionTimeline';
import type { OrderReadinessApi } from '../readiness/useOrderReadiness';

interface JobProductionTabProps {
  job: Job;
  rd: OrderReadinessApi;
  notes: string;
  setNotes: (notes: string) => void;
  completionPhotoUrl: string;
  setCompletionPhotoUrl: (url: string) => void;
  refreshJob: () => void;
  onSave?: () => void;
  saving?: boolean;
  dirty?: boolean;
  /** A completed order: notes read as text, photos can be viewed but not added or removed. */
  readOnly?: boolean;
}

/** The work stage: the production line, photos and notes. The snapshot and customer-facing cards live in JobProductionAside. */
export default function JobProductionTab({ job, rd, notes, setNotes, completionPhotoUrl, setCompletionPhotoUrl, refreshJob, onSave, saving, dirty, readOnly }: JobProductionTabProps) {
  return (
    <JobProductionTimeline
      job={job}
      rd={rd}
      notes={notes}
      setNotes={setNotes}
      completionPhotoUrl={completionPhotoUrl}
      setCompletionPhotoUrl={setCompletionPhotoUrl}
      onProgressPhotoAdded={refreshJob}
      onSave={onSave}
      saving={saving}
      dirty={dirty}
      readOnly={readOnly}
    />
  );
}
