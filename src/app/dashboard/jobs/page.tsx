'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, X } from 'lucide-react';
import JobRejectModal from '@/components/jobs/JobRejectModal';
import JobTrashModal from '@/components/jobs/JobTrashModal';
import JobsPageHeader from '@/components/jobs/JobsPageHeader';
import SimpleBoard from '@/components/jobs/board/SimpleBoard';
import BoardToolbar from '@/components/jobs/board/BoardToolbar';
import BoardSummary from '@/components/jobs/board/BoardSummary';
import { useJobsBoard } from '@/components/jobs/board/useJobsBoard';
import { useWaitingAppointments } from '@/components/jobs/board/useWaitingAppointments';
import { useAuthStore } from '@/store/useAuthStore';
import { KanbanSkeleton } from '@/components/ui/Skeleton';

export default function JobOrdersPage() {
  return (
    <Suspense fallback={<div className="p-4"><KanbanSkeleton columns={4} /></div>}>
      <JobOrdersPageContent />
    </Suspense>
  );
}

function JobOrdersPageContent() {
  const { user } = useAuthStore();
  const isStaff = user?.roles?.[0]?.name === 'staff';
  const isOwnerOrManager = Boolean(user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name)));
  const board = useJobsBoard();
  const waiting = useWaitingAppointments();
  const [trashOpen, setTrashOpen] = useState(false);
  const [declining, setDeclining] = useState<number | null>(null);
  const filtered = board.statusFilter || board.overdueOnly || board.garment;

  return (
    <div className="space-y-4">
      <JobsPageHeader jobsCount={board.jobs.length} onOpenTrash={() => setTrashOpen(true)} isOwnerOrManager={isOwnerOrManager} />

      {filtered && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-taupe/20 bg-taupe/10 px-4 py-2.5 text-sm font-medium text-taupe">
          <span className="flex items-center gap-2"><AlertCircle size={16} /> Showing only part of your orders</span>
          <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs font-semibold hover:underline"><X size={13} /> Show all</Link>
        </div>
      )}

      {!board.loading && <BoardSummary jobs={board.jobs} canSeeMoney={isOwnerOrManager} />}

      <BoardToolbar
        search={board.search} onSearch={board.setSearch} showMine={isStaff} mine={board.mine} onMine={board.setMine}
        closedCount={board.closed.length} showClosed={board.showClosed} onShowClosed={board.setShowClosed}
      />

      {board.loading ? <KanbanSkeleton columns={4} /> : (
        <SimpleBoard
          byStage={board.byStage} closed={board.closed} showClosed={board.showClosed}
          canSeeMoney={isOwnerOrManager} canDecline={isOwnerOrManager} busyId={board.busyId} waiting={waiting}
          onAdvance={board.advance} onDecline={setDeclining}
        />
      )}

      <JobRejectModal
        isOpen={declining !== null}
        onClose={() => setDeclining(null)}
        onConfirm={async (reason) => { if (declining !== null) await board.decline(declining, reason); setDeclining(null); }}
        actionLoading={board.busyId !== null}
      />

      {board.store && <JobTrashModal isOpen={trashOpen} onClose={() => setTrashOpen(false)} storeId={board.store.id} onRestored={board.refetch} />}
    </div>
  );
}
