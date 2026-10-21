'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, Loader2, Save, ShoppingBag, Store, Zap, Check } from 'lucide-react';
import JobMoreMenu from './JobMoreMenu';
import { Job } from '../jobTypes';
import { newFollowUpOrderHref } from '../board/newOrderHref';
import { appointmentNo } from '@/components/appointments/appointmentHelpers';
import { jobPeople, jobPieces, orderSize } from '@/lib/orderSize';

interface JobDetailHeaderProps {
  job: Job;
  hasUnsavedChanges: boolean;
  saving: boolean;
  onBack: () => void;
  onResetChanges: () => void;
  onOpenMessageModal: () => void;
  onOpenFollowUpModal: () => void;
  onPrint: () => void;
  onOpenDeleteModal: () => void;
  onUpdate: () => void;
  canDelete: boolean;
  canCreateFollowUpOrder?: boolean;
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
  onOpenDeleteModal,
  onUpdate,
  canDelete,
  canCreateFollowUpOrder,
  moreActions,
}: JobDetailHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
      <div className="flex items-center gap-3.5">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors shadow-2xs shrink-0"
          type="button"
          title="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center flex-wrap gap-2">
            {job.order_number}
            {job.intake_channel === 'online' ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                <ShoppingBag size={11} /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sunken text-ink-muted px-2.5 py-0.5 rounded-full border border-line">
                <Store size={11} /> Walk-in
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Store size={11} /> {job.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}
            </span>
            {job.batch && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-taupe/10 text-taupe px-2.5 py-0.5 rounded-full border border-taupe/25">
                {job.batch.kind === 'set' ? `Order ${job.batch_no ?? 1} of ${job.batch.count}` : `Batch ${job.batch_no ?? 1} of ${job.batch.count}${job.paid_by_name ? ` · ${job.paid_by_name}` : ''}`}
              </span>
            )}
            {jobPeople(job) >= 2 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sunken text-ink-body px-2.5 py-0.5 rounded-full border border-line">
                <Users size={11} /> {orderSize(jobPeople(job), job.service?.min_order_qty)} · {jobPieces(job)} pcs
              </span>
            )}
            {job.is_rush && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                <Zap size={11} /> Rush Order
              </span>
            )}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage lifecycle, specifications, and financials
            {job.appointment_id && (
              <span className="ml-2">
                • From consultation{' '}
                <Link href={`/dashboard/appointments?open=${job.appointment_id}`} className="font-semibold text-taupe hover:underline">{appointmentNo(job.appointment_id)}</Link>
              </span>
            )}
            {job.tracking_code && (
              <span className="ml-2 text-ink-faint">
                • Tracking: <strong className="font-mono text-ink-body select-all">{job.tracking_code}</strong>
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {hasUnsavedChanges ? (
          <>
            <span className="hidden items-center gap-1.5 text-xs font-bold text-amber-700 md:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" /> Unsaved changes
            </span>
            <button onClick={onResetChanges} type="button" className="h-11 cursor-pointer rounded-lg border border-espresso/[0.12] bg-white px-4 text-sm font-medium text-ink hover:bg-espresso/[0.03]">Discard</button>
            <button onClick={onUpdate} disabled={saving} type="button" className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-espresso px-5 text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted"><Check size={15} className="text-sage" /> Saved</span>
        )}
        <JobMoreMenu
          onPrint={onPrint} onMessage={onOpenMessageModal} onFollowUpVisit={onOpenFollowUpModal}
          followUpOrderHref={canCreateFollowUpOrder ? newFollowUpOrderHref(job) : undefined}
          onDelete={canDelete ? onOpenDeleteModal : undefined} extra={moreActions}
        />
      </div>
    </div>
  );
}
