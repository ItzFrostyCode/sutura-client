'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import JobMoreMenu from './JobMoreMenu';
import { Job } from '../jobTypes';
import { appointmentNo } from '@/components/appointments/appointmentHelpers';
import JobHeaderChips from './JobHeaderChips';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';

interface JobDetailHeaderProps {
  job: Job;
  hasUnsavedChanges: boolean;
  saving: boolean;
  onBack: () => void;
  onResetChanges: () => void;
  onOpenMessageModal?: () => void;
  onOpenFollowUpModal: () => void;
  onPrint: () => void;
  onArchive: () => void;
  onUpdate: () => void;
  canArchive: boolean;
  /** Owner / branch manager on an ongoing order: shows "Cancel this order" in the menu. */
  onCancel?: () => void;
  /** Owner / branch manager on a completed order: shows "New follow-up order" in the menu. */
  onFollowUpOrder?: () => void;
  /** A completed order is read only: no Save / Discard / "Saved" in the header. */
  readOnly?: boolean;
  /** Extra actions for the More menu (owner / branch manager only). */
  moreActions?: { label: string; icon: React.ReactNode; onClick: () => void }[];
}

export default function JobDetailHeader({
  job,
  hasUnsavedChanges,
  saving,
  onBack,
  onResetChanges,
  onOpenMessageModal,
  onOpenFollowUpModal,
  onPrint,
  onArchive,
  onUpdate,
  canArchive,
  onCancel,
  onFollowUpOrder,
  readOnly,
  moreActions,
}: JobDetailHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3.5">
        <button
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-ink-body hover:bg-sunken"
          type="button"
          title="Go back"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight text-ink sm:text-[32px]">{job.order_number}</h1>
            <JobHeaderChips job={job} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Manage lifecycle, specifications, and financials
            {job.appointment_id && (
              <span className="ml-2">
                • From consultation{' '}
                <Link href={`/dashboard/appointments?open=${job.appointment_id}`} className="font-semibold text-taupe hover:underline">{appointmentNo(job.appointment_id)}</Link>
              </span>
            )}
            {job.tracking_code && (
              <span className="ml-2">
                • Tracking: <strong className="select-all font-semibold tracking-wide text-ink">{job.tracking_code}</strong>
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {readOnly ? null : hasUnsavedChanges ? (
          <>
            <span className="hidden items-center gap-1.5 text-[13px] font-medium text-amber-700 md:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved changes
            </span>
            <button onClick={onResetChanges} type="button" className={BTN}>Discard</button>
            <button onClick={onUpdate} disabled={saving} type="button" className={BTN_PRIMARY}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted"><Check size={14} className="text-sage" /> Saved</span>
        )}
        <JobMoreMenu
          onPrint={onPrint} onMessage={onOpenMessageModal} onFollowUpVisit={onOpenFollowUpModal}
          onFollowUpOrder={onFollowUpOrder}
          onArchive={canArchive ? onArchive : undefined} onCancel={onCancel} extra={moreActions}
        />
      </div>
    </div>
  );
}
