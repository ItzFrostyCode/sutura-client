'use client';

import React from 'react';
import { ArrowLeft, Loader2, Save, Trash2, ShoppingBag, Store, Printer, Zap, Mail, Check, CalendarPlus } from 'lucide-react';
import { Job } from '../jobTypes';

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
            {job.is_rush && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300">
                <Zap size={11} /> Rush Order
              </span>
            )}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage lifecycle, specifications, and financials
            {job.tracking_code && (
              <span className="ml-2 text-ink-faint">
                • Tracking: <strong className="font-mono text-ink-body select-all">{job.tracking_code}</strong>
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        {hasUnsavedChanges && (
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unsaved changes
          </span>
        )}

        {hasUnsavedChanges && (
          <button
            onClick={onResetChanges}
            type="button"
            className="h-9 px-3 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors text-xs font-semibold shadow-2xs active:scale-95"
            title="Discard draft changes"
          >
            Discard
          </button>
        )}

        <button
          onClick={onOpenMessageModal}
          className="h-9 w-9 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors flex items-center justify-center shadow-2xs active:scale-95"
          title="Message Customer"
          type="button"
        >
          <Mail size={15} />
        </button>
        <button
          onClick={onOpenFollowUpModal}
          className="h-9 w-9 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors flex items-center justify-center shadow-2xs active:scale-95"
          title="Schedule Follow-Up Visit"
          type="button"
        >
          <CalendarPlus size={15} />
        </button>
        <button
          onClick={onPrint}
          className="h-9 w-9 rounded-xl bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink transition-colors flex items-center justify-center shadow-2xs active:scale-95"
          title="Print Physical Work Ticket"
          type="button"
        >
          <Printer size={15} />
        </button>
        <button
          onClick={onOpenDeleteModal}
          className="h-9 w-9 rounded-xl bg-surface hover:bg-rose-50 border border-line hover:border-rose-200 text-ink-faint hover:text-rose-600 transition-colors flex items-center justify-center shadow-2xs active:scale-95"
          title="Delete Job Order"
          type="button"
        >
          <Trash2 size={15} />
        </button>

        <button
          onClick={onUpdate}
          disabled={saving || !hasUnsavedChanges}
          className={`h-9 px-4 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 ${
            hasUnsavedChanges
              ? 'bg-taupe hover:bg-taupe-hover text-white ring-2 ring-taupe/30 shadow-md cursor-pointer'
              : 'bg-surface border border-line text-ink-muted/70 font-semibold cursor-default hover:bg-surface opacity-80'
          }`}
          type="button"
          title={hasUnsavedChanges ? 'Click to save all pending changes' : 'All changes are saved'}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasUnsavedChanges ? (
            <Save size={14} />
          ) : (
            <Check size={14} className="text-sage" />
          )}
          <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
        </button>
      </div>
    </div>
  );
}
