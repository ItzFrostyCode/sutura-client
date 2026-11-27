'use client';

import React from 'react';
import Link from 'next/link';
import { Ruler, AlertTriangle, Lock } from 'lucide-react';
import { Job } from '../jobTypes';
import { STAGES_REQUIRING_DOWNPAYMENT } from '../jobHelpers';

interface JobMeasurementCardProps {
  job: Job;
  onUseCurrentMeasurement: (versionId: number) => void;
}

export default function JobMeasurementCard({ job, onUseCurrentMeasurement }: JobMeasurementCardProps) {
  if (!job.measurement) return null;

  const metrics = job.measurement.metrics || {};
  const metricEntries = Object.entries(metrics);

  // Mirrors JobOrderController::update()'s measurement snapshot lock exactly
  // — same STAGES_REQUIRING_DOWNPAYMENT boundary as "No DP, No Cut". Once
  // production has started, syncing to a newer version would cut/sew to
  // numbers that no longer match what was actually already worked, so the
  // action is disabled here rather than left to fail with a 422 on click.
  const isSnapshotLocked = STAGES_REQUIRING_DOWNPAYMENT.has(job.status);

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="text-base font-bold text-ink flex items-center gap-2">
          <Ruler size={17} className="text-taupe" /> {job.measurement.profile_name}
        </h2>
        {job.customer && (
          <Link
            href={`/dashboard/customers/${job.customer.id}?tab=measurements`}
            className="text-xs font-bold text-taupe hover:underline"
          >
            Customer Measurements →
          </Link>
        )}
      </div>

      {job.measurement.is_stale && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-3.5 shadow-2xs">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1">
            <p className="font-bold">A newer measurement profile was updated after this order was placed.</p>
            {isSnapshotLocked ? (
              <p className="mt-0.5 text-amber-700 flex items-center gap-1.5">
                <Lock size={11} className="shrink-0" />
                Production has already started — this job stays pinned to the snapshot it was cut/sewn against and can no longer be switched.
              </p>
            ) : (
              <>
                <p className="mt-0.5 text-amber-700">Would you like to sync this job with the latest customer measurements?</p>
                {job.measurement.current_version_id && (
                  <button
                    type="button"
                    onClick={() => onUseCurrentMeasurement(job.measurement!.current_version_id!)}
                    className="mt-2 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors shadow-2xs"
                  >
                    Sync with Current Version
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {metricEntries.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {metricEntries.map(([k, v]) => (
            <div key={k} className="bg-canvas/50 border border-line rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-ink-muted font-bold uppercase truncate">{k.replaceAll('_', ' ')}</p>
              <p className="text-sm font-bold text-ink mt-0.5">
                {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '')}
                <span className="text-[10px] font-normal text-ink-faint ml-0.5">″</span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-faint italic">No measurement metrics recorded.</p>
      )}

      {job.measurement.notes && (
        <p className="text-xs text-ink-muted border-t border-line pt-3">
          <strong className="text-ink-body">Measurement Notes:</strong> {job.measurement.notes}
        </p>
      )}
    </div>
  );
}
