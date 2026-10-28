'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, X } from 'lucide-react';
import JobRejectModal from '@/components/jobs/JobRejectModal';
import JobsPageHeader from '@/components/jobs/JobsPageHeader';
import SimpleBoard from '@/components/jobs/board/SimpleBoard';
import JobsTableView from '@/components/jobs/board/JobsTableView';
import BoardToolbar from '@/components/jobs/board/BoardToolbar';
import BoardSummary from '@/components/jobs/board/BoardSummary';
import { useJobsBoard } from '@/components/jobs/board/useJobsBoard';
import { useAuthStore } from '@/store/useAuthStore';
import { KanbanSkeleton } from '@/components/ui/Skeleton';
import ApplePage from '@/components/jobs/ui/ApplePage';
import { isLateBalance } from '@/components/jobs/jobHelpers';
import { BTN_PRIMARY } from '@/components/shared/plainForm';

export default function JobOrdersPage() {
  return (
    <Suspense fallback={<ApplePage><div className="p-4"><KanbanSkeleton columns={4} /></div></ApplePage>}>
      <JobOrdersPageContent />
    </Suspense>
  );
}

function JobOrdersPageContent() {
  const { user } = useAuthStore();
  const isStaff = user?.roles?.[0]?.name === 'staff';
  const isOwnerOrManager = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))
  );

  const board = useJobsBoard();
  const [declining, setDeclining] = useState<number | null>(null);

  const isDeepFiltered = Boolean(board.statusFilter || board.overdueOnly || board.garment);
  const activeOrdersCount = Math.max(0, board.stageCounts.all - board.stageCounts.done);

  return (
    <ApplePage plain>
      <JobsPageHeader
        activeCount={activeOrdersCount}
        totalCount={board.jobs.length}
        isOwnerOrManager={isOwnerOrManager}
      />

      <div className="space-y-4 p-4 sm:p-6">

        {/* Alert Banner for Deep Links from Home Dashboard */}
        {isDeepFiltered && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-espresso/[0.08] bg-white px-4 py-3 text-[13px] text-ink-body">
            <span className="flex items-center gap-2">
              <AlertCircle size={15} className="text-espresso" />
              Showing the orders you opened from the dashboard
              {board.statusFilter && ` (Stage: ${board.statusFilter})`}
              {board.overdueOnly && ' (Overdue only)'}
              {board.garment && ` (Garment: ${board.garment})`}
            </span>
            <Link
              href="/dashboard/jobs"
              className="inline-flex h-9 items-center gap-1 rounded-md border border-espresso/25 bg-white px-3 text-sm font-medium text-espresso hover:bg-espresso/[0.06]"
            >
              <X size={13} /> Clear
            </Link>
          </div>
        )}

        {/* Executive Summary Cards */}
        {!board.loading && (
          <BoardSummary
            jobs={board.jobs}
            canSeeMoney={isOwnerOrManager}
          />
        )}

        {/* Filter and Operations Toolbar */}
        <BoardToolbar
          search={board.search}
          onSearch={board.setSearch}
          viewMode={board.viewMode}
          onViewMode={board.setViewMode}
          stageFilter={board.stageFilter}
          onStageFilter={board.setStageFilter}
          urgencyFilter={board.urgencyFilter}
          onUrgencyFilter={board.setUrgencyFilter}
          paymentFilter={board.paymentFilter}
          onPaymentFilter={board.setPaymentFilter}
          sortBy={board.sortBy}
          onSortBy={board.setSortBy}
          stageCounts={board.stageCounts}
          urgencyCounts={board.urgencyCounts}
          showMine={isStaff}
          mine={board.mine}
          onMine={board.setMine}
          closedCount={board.closed.length}
          showClosed={board.showClosed}
          onShowClosed={board.setShowClosed}
          canSeeMoney={isOwnerOrManager}
          lateBalanceCount={board.jobs.filter(isLateBalance).length}
          hasActiveFilters={board.hasActiveFilters}
          onResetFilters={board.resetFilters}
        />

        {/* Content: Operational Table View OR Kanban Workflow Board.
            At least one screen tall, so choosing a stage with few orders never shrinks the page under the scroll position:
            the tabs stay where they are instead of jumping up. */}
        <div className="min-h-[calc(100dvh-4rem)]">
        {board.loading ? (
          <KanbanSkeleton columns={4} />
        ) : board.loadError ? (
          <div role="alert" className="flex flex-col items-start gap-3 border-y border-espresso/15 py-6">
            <p className="text-base font-semibold text-espresso">The orders could not be loaded.</p>
            <p className="text-sm text-espresso/60">This is a connection problem, not an empty list: nothing was deleted. Check the connection, then try again.</p>
            <button type="button" onClick={board.refetch} className={BTN_PRIMARY}>Try again</button>
          </div>
        ) : board.viewMode === 'table' ? (
          <JobsTableView
            jobs={board.visible}
            canSeeMoney={isOwnerOrManager}
            canDecline={isOwnerOrManager}
            busyId={board.busyId}
            onAdvance={board.advance}
            onDecline={setDeclining}
          />
        ) : (
          <div className="lg:h-[max(30rem,calc(100dvh-20rem))]">
            <SimpleBoard
              byStage={board.byStage}
              closed={board.closed}
              showClosed={board.showClosed}
              canSeeMoney={isOwnerOrManager}
              canDecline={isOwnerOrManager}
              busyId={board.busyId}
              onAdvance={board.advance}
              onMove={board.moveTo}
              onDecline={setDeclining}
            />
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      <JobRejectModal
        isOpen={declining !== null}
        onClose={() => setDeclining(null)}
        onConfirm={async (reason) => {
          if (declining !== null) await board.decline(declining, reason);
          setDeclining(null);
        }}
        actionLoading={board.busyId !== null}
      />
    </ApplePage>
  );
}
