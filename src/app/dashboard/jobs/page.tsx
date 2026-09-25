'use client';

import React, { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { AlertCircle, X } from 'lucide-react';
import JobRejectModal from '@/components/jobs/JobRejectModal';
import JobKanbanBoard from '@/components/jobs/JobKanbanBoard';
import QuickJobModal from '@/components/jobs/QuickJobModal';
import JobTrashModal from '@/components/jobs/JobTrashModal';
import { useJobs } from '@/components/jobs/useJobs';
import { GARMENT_CATEGORY_LABELS } from '@/components/jobs/jobHelpers';
import { useAuthStore } from '@/store/useAuthStore';
import { KanbanSkeleton } from '@/components/ui/Skeleton';
import {
  DEFAULT_NOTIF_PREFS,
  buildStageIconFilters,
} from '@/components/jobs/stageIconFilters';
import StageNotifSettingsModal from '@/components/jobs/StageNotifSettingsModal';
import JobsPageHeader from '@/components/jobs/JobsPageHeader';
import JobsPageToolbar from '@/components/jobs/JobsPageToolbar';

export default function JobOrdersPage() {
  return (
    <Suspense fallback={<div className="p-4"><KanbanSkeleton columns={4} /></div>}>
      <JobOrdersPageContent />
    </Suspense>
  );
}

function JobOrdersPageContent() {
  const { store } = useAuthStore();
  const {
    jobs,
    loading,
    search,
    setSearch,
    tab,
    setTab,
    rejectModalOpen,
    setRejectModalOpen,
    actionLoadingId,
    updateJobStatus,
    handleApproveJob,
    openRejectModal,
    handleConfirmReject,
    activeColumns,
    groupedJobs,
    onHoldJobs,
    walkInCount,
    onlineCount,
    pendingReviewCount,
    fetchJobs,
    overdueOnly,
    garmentCategoryFilter,
    designOriginFilter,
    setDesignOriginFilter,
    catalogJobsCount,
    customBespokeCount,
    alterationJobsCount,
  } = useJobs();

  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sutura_job_stage_notif_prefs');
        if (saved) return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_NOTIF_PREFS;
  });

  const toggleNotifPref = (stageKey: string) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [stageKey]: !prev[stageKey] };
      try {
        localStorage.setItem('sutura_job_stage_notif_prefs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const stageIconFilters = useMemo(
    () =>
      buildStageIconFilters(
        notifPrefs,
        pendingReviewCount,
        groupedJobs,
        onHoldJobs.length
      ),
    [notifPrefs, pendingReviewCount, groupedJobs, onHoldJobs.length]
  );

  return (
    <div className="space-y-5 h-full flex flex-col">
      <JobsPageHeader
        jobsCount={jobs.length}
        onOpenTrash={() => setTrashModalOpen(true)}
        onOpenQuickJob={() => setQuickModalOpen(true)}
      />

      {overdueOnly && (
        <div className="flex items-center justify-between gap-3 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-2"><AlertCircle size={16} /> Showing overdue jobs only</span>
          <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <X size={13} /> Clear filter
          </Link>
        </div>
      )}

      {garmentCategoryFilter && (
        <div className="flex items-center justify-between gap-3 bg-taupe/10 border border-taupe/20 text-taupe text-sm font-medium rounded-lg px-4 py-2.5">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> Showing {GARMENT_CATEGORY_LABELS[garmentCategoryFilter] ?? garmentCategoryFilter} jobs only
          </span>
          <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <X size={13} /> Clear filter
          </Link>
        </div>
      )}

      {/* Main White Surface Card Panel (Enclosing Toolbar + Kanban Board) */}
      <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs flex flex-col flex-1">
        <JobsPageToolbar
          tab={tab}
          setTab={setTab}
          totalJobsCount={jobs.length}
          walkInCount={walkInCount}
          onlineCount={onlineCount}
          onOpenSettings={() => setSettingsModalOpen(true)}
          designOriginFilter={designOriginFilter}
          setDesignOriginFilter={setDesignOriginFilter}
          catalogJobsCount={catalogJobsCount}
          customBespokeCount={customBespokeCount}
          alterationJobsCount={alterationJobsCount}
          stageFilter={stageFilter}
          setStageFilter={setStageFilter}
          stageIconFilters={stageIconFilters}
          search={search}
          setSearch={setSearch}
          activeColumns={activeColumns}
        />

        <div className="p-3 sm:p-4 flex-1 overflow-hidden">
          {loading ? (
            <KanbanSkeleton columns={4} />
          ) : (
            <JobKanbanBoard
              groupedJobs={groupedJobs}
              activeColumns={activeColumns}
              onHoldJobs={onHoldJobs}
              actionLoadingId={actionLoadingId}
              onUpdateStatus={updateJobStatus}
              onApprove={handleApproveJob}
              onReject={openRejectModal}
              highlightedJobId={null}
              stageFilter={stageFilter}
            />
          )}
        </div>
      </div>

      <StageNotifSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        notifPrefs={notifPrefs}
        onToggleNotifPref={toggleNotifPref}
        onResetAll={() => {
          setNotifPrefs(DEFAULT_NOTIF_PREFS);
          try {
            localStorage.setItem('sutura_job_stage_notif_prefs', JSON.stringify(DEFAULT_NOTIF_PREFS));
          } catch {}
        }}
      />

      <JobRejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        actionLoading={actionLoadingId !== null}
      />

      <QuickJobModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        onCreated={() => { if (fetchJobs) fetchJobs(); }}
      />

      {store && (
        <JobTrashModal
          isOpen={trashModalOpen}
          onClose={() => setTrashModalOpen(false)}
          storeId={store.id}
          onRestored={() => { if (fetchJobs) fetchJobs(); }}
        />
      )}
    </div>
  );
}
