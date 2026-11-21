'use client';

import React, { Suspense, useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import JobRejectModal from '@/components/jobs/JobRejectModal';
import JobKanbanBoard from '@/components/jobs/JobKanbanBoard';
import JobTrashModal from '@/components/jobs/JobTrashModal';
import { useJobs } from '@/components/jobs/useJobs';
import { GARMENT_CATEGORY_LABELS, type Job } from '@/components/jobs/jobHelpers';
import JobApproveModal from '@/components/jobs/JobApproveModal';
import { useAuthStore } from '@/store/useAuthStore';
import { KanbanSkeleton } from '@/components/ui/Skeleton';
import {
  DEFAULT_NOTIF_PREFS,
  buildStageIconFilters,
} from '@/components/jobs/stageIconFilters';
import StageNotifSettingsModal from '@/components/jobs/StageNotifSettingsModal';
import JobsPageHeader from '@/components/jobs/JobsPageHeader';
import JobsPageToolbar from '@/components/jobs/JobsPageToolbar';
import JobsAttentionBar from '@/components/jobs/JobsAttentionBar';
import { ATTENTION_FILTERS, assignedStaffId, matchesAttention, type AttentionKey } from '@/components/jobs/boardAttention';

export default function JobOrdersPage() {
  return (
    <Suspense fallback={<div className="p-4"><KanbanSkeleton columns={4} /></div>}>
      <JobOrdersPageContent />
    </Suspense>
  );
}

function JobOrdersPageContent() {
  const { store, user } = useAuthStore();
  const isStaff = user?.roles?.[0]?.name === 'staff';
  const isOwnerOrManager = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))
  );
  const {
    jobs,
    loading,
    search,
    setSearch,
    tab,
    setTab,
    myJobsOnly,
    setMyJobsOnly,
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
    staffList,
    assignStaff,
  } = useJobs();

  const [trashModalOpen, setTrashModalOpen] = useState(false);
  // The pending order being approved (asks for due date + staff, like a walk-in).
  const [approvingJob, setApprovingJob] = useState<Job | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'columns'>('kanban');
  const [showFilters, setShowFilters] = useState(false);
  // Home's "Quality checks needed" card deep-links here with ?stage=qc_ironing.
  const [stageFilter, setStageFilter] = useState<string>(useSearchParams().get('stage') || 'all');
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

  // "Needs attention" chips + "Assigned to" filter, applied to what the board shows.
  const repairRequiresDownpayment = Boolean(store?.repair_requires_downpayment);
  const [attention, setAttention] = useState<AttentionKey | null>(null);
  const [staffFilter, setStaffFilter] = useState('all');
  const activeJobs = useMemo(
    () => [...Object.entries(groupedJobs).filter(([k]) => k !== 'completed').flatMap(([, list]) => list), ...onHoldJobs],
    [groupedJobs, onHoldJobs]
  );
  const attentionCounts = useMemo(() => {
    const counts = {} as Record<AttentionKey, number>;
    for (const f of ATTENTION_FILTERS) {
      counts[f.key] = activeJobs.filter((j) => matchesAttention(j, f.key, repairRequiresDownpayment)).length;
    }
    return counts;
  }, [activeJobs, repairRequiresDownpayment]);
  const keepJob = useCallback((j: Job) => {
    if (attention && !matchesAttention(j, attention, repairRequiresDownpayment)) return false;
    if (staffFilter !== 'all') {
      const id = assignedStaffId(j);
      if (staffFilter === 'none' ? id !== null : String(id) !== staffFilter) return false;
    }
    return true;
  }, [attention, staffFilter, repairRequiresDownpayment]);
  const filtering = attention !== null || staffFilter !== 'all';
  const visibleGrouped = useMemo(
    () => (filtering ? Object.fromEntries(Object.entries(groupedJobs).map(([k, list]) => [k, list.filter(keepJob)])) : groupedJobs),
    [filtering, groupedJobs, keepJob]
  );
  const visibleOnHold = useMemo(() => (filtering ? onHoldJobs.filter(keepJob) : onHoldJobs), [filtering, onHoldJobs, keepJob]);
  const shownActiveCount = filtering ? activeJobs.filter(keepJob).length : activeJobs.length;

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
        isOwnerOrManager={isOwnerOrManager}
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
      <div className="bg-surface/60 border border-line rounded-3xl overflow-hidden shadow-2xs flex flex-col flex-1">
        <div data-tour="jobs-toolbar">
        <JobsPageToolbar
          tab={tab}
          setTab={setTab}
          totalJobsCount={jobs.length}
          walkInCount={walkInCount}
          onlineCount={onlineCount}
          search={search}
          setSearch={setSearch}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          designOriginFilter={designOriginFilter}
          setDesignOriginFilter={setDesignOriginFilter}
          catalogJobsCount={catalogJobsCount}
          customBespokeCount={customBespokeCount}
          alterationJobsCount={alterationJobsCount}
          showMyJobsToggle={isStaff}
          myJobsOnly={myJobsOnly}
          setMyJobsOnly={setMyJobsOnly}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onRefresh={() => fetchJobs({ silent: true })}
        />
        </div>

        <JobsAttentionBar
          counts={attentionCounts}
          active={attention}
          onToggle={(key) => setAttention((prev) => (prev === key ? null : key))}
          staffList={isOwnerOrManager ? staffList : undefined}
          staffFilter={staffFilter}
          onStaffFilter={setStaffFilter}
          shownCount={shownActiveCount}
          totalCount={activeJobs.length}
          onClear={() => { setAttention(null); setStaffFilter('all'); }}
        />

        <div data-tour="jobs-board" className="p-3 sm:p-5 flex-1 overflow-hidden">
          {loading ? (
            <KanbanSkeleton columns={4} />
          ) : (
            <JobKanbanBoard
              groupedJobs={visibleGrouped}
              activeColumns={activeColumns}
              onHoldJobs={visibleOnHold}
              actionLoadingId={actionLoadingId}
              onUpdateStatus={updateJobStatus}
              onApprove={(id) => setApprovingJob(jobs.find((j) => j.id === id) ?? null)}
              onReject={openRejectModal}
              highlightedJobId={null}
              stageFilter={stageFilter}
              viewMode={viewMode}
              staffList={staffList}
              onAssignStaff={assignStaff}
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

      <JobApproveModal
        job={approvingJob}
        staffList={staffList}
        onClose={() => setApprovingJob(null)}
        onConfirm={handleApproveJob}
      />

      <JobRejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        actionLoading={actionLoadingId !== null}
      />


      {store && (
        <JobTrashModal
          isOpen={trashModalOpen}
          onClose={() => setTrashModalOpen(false)}
          storeId={store.id}
          onRestored={() => fetchJobs({ silent: true })}
        />
      )}
    </div>
  );
}
