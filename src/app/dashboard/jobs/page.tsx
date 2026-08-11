'use client';

import React, { Suspense } from 'react';
import { Plus, Store, ShoppingBag, AlertCircle, Truck, Scissors, Zap, Trash2, X } from 'lucide-react';
import SearchInput from '@/components/shared/SearchInput';
import Link from 'next/link';
import JobRejectModal from '@/components/jobs/JobRejectModal';
import JobKanbanBoard from '@/components/jobs/JobKanbanBoard';
import QuickJobModal from '@/components/jobs/QuickJobModal';
import JobTrashModal from '@/components/jobs/JobTrashModal';
import { useJobs } from '@/components/jobs/useJobs';
import { GARMENT_CATEGORY_LABELS } from '@/components/jobs/jobHelpers';
import { useAuthStore } from '@/store/useAuthStore';

export default function JobOrdersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-[#A8A19A]">Loading...</div>}>
      <JobOrdersPageContent />
    </Suspense>
  );
}

function JobOrdersPageContent() {
  const { shop } = useAuthStore();
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
  } = useJobs();

  const [quickModalOpen, setQuickModalOpen] = React.useState(false);
  const [trashModalOpen, setTrashModalOpen] = React.useState(false);

  return (
    <div className="space-y-5 h-full flex flex-col text-[#2D2A26]">
      {overdueOnly && (
        <div className="flex items-center justify-between bg-[#B26959]/10 border border-[#B26959]/20 text-[#B26959] text-sm font-medium rounded-xl px-4 py-2.5">
          <span className="flex items-center gap-2"><AlertCircle size={16} /> Showing overdue jobs only</span>
          <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <X size={13} /> Clear filter
          </Link>
        </div>
      )}
      {garmentCategoryFilter && (
        <div className="flex items-center justify-between bg-taupe/10 border border-taupe/20 text-taupe text-sm font-medium rounded-xl px-4 py-2.5">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> Showing {GARMENT_CATEGORY_LABELS[garmentCategoryFilter] ?? garmentCategoryFilter} jobs only
          </span>
          <Link href="/dashboard/jobs" className="flex items-center gap-1 text-xs font-semibold hover:underline">
            <X size={13} /> Clear filter
          </Link>
        </div>
      )}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Production Pipeline</h1>
          <p className="text-[#827A73] text-sm mt-1">Track and manage garment production — Walk-in and Online orders.</p>
        </div>
        <div className="flex flex-col lg:items-end gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setTrashModalOpen(true)}
              title="View deleted job orders"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium bg-[#FAF6F3] border border-[#EBE6E0] text-[#827A73] hover:bg-[#F0EAE3] transition-colors"
            >
              <Trash2 size={16} />
            </button>
            {/* Quick Entry — a deliberately bare-bones walk-in shortcut (just
                customer, service, total, DP, due date), not a shorter version
                of Create Job Order. The two used to look interchangeable with
                nothing distinguishing them beyond a hover tooltip on this one
                — the caption below makes both scopes visible without
                requiring a hover to discover the difference. */}
            <button
              type="button"
              onClick={() => setQuickModalOpen(true)}
              title="Log a walk-in fast with just the essentials — add measurements, staff, and other details afterward from the job's own page."
              className="flex items-center gap-1.5 bg-[#FAF6F3] border border-[#EBE6E0] hover:border-taupe text-[#524A44] hover:text-taupe px-3.5 py-2 rounded-lg font-semibold text-sm transition-all"
            >
              <Zap size={15} className="text-amber-500" />
              Quick Walk-in
            </button>
            <Link
              href="/dashboard/jobs/new"
              title="Full order form — measurements, staff assignment, rush settings, and every other detail up front."
              className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              Create Job Order
            </Link>
          </div>
          <p className="text-[11px] text-[#A8A19A]">
            Quick Walk-in = essentials only, fill in the rest later · Create Job Order = the full form
          </p>
        </div>
      </div>

      {pendingReviewCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {pendingReviewCount} job order{pendingReviewCount === 1 ? '' : 's'} awaiting feasibility review
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Review each pending order and approve it into production or reject it.</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        <div className="flex items-center border-b border-[#EBE6E0] flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setTab('all')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'all'
                ? 'border-taupe text-taupe'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <span>All Orders</span>
            <span className="bg-[#F0EAE3] text-[#827A73] text-xs px-2 py-0.5 rounded-full font-semibold ml-1">{jobs.length}</span>
          </button>
          <button
            onClick={() => setTab('walk_in')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'walk_in'
                ? 'border-taupe text-taupe'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <Store size={15} />
            <span>Walk-in</span>
            <span className="bg-[#F0EAE3] text-[#827A73] text-xs px-2 py-0.5 rounded-full font-semibold ml-1">{walkInCount}</span>
          </button>
          <button
            onClick={() => setTab('online')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'online'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <ShoppingBag size={15} />
            Online
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">{onlineCount}</span>
          </button>

          <div className="ml-auto pr-4 py-2 w-full sm:w-auto">
            <SearchInput value={search} onChange={setSearch} placeholder="Search order or customer..." className="w-full sm:w-64" />
          </div>
        </div>

        {tab === 'online' && (
          <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-700">
            <Truck size={13} />
            <span>Online production flow: <strong>{activeColumns.map(c => c.title).join(' → ')}</strong>. Depends on each order&apos;s Fulfillment Method — Store Pickup ends at &quot;Ready for Pickup&quot;, Shipping/Local Delivery ends at &quot;Handed Over&quot;.</span>
          </div>
        )}

        {tab === 'walk_in' && (
          <div className="px-5 py-2.5 bg-[#FAF6F3] border-b border-[#EBE6E0] flex items-center gap-2 text-xs text-[#827A73]">
            <Scissors size={13} />
            <span>Walk-in production flow: <strong>{activeColumns.map(c => c.title).join(' → ')}</strong>. Depends on each order&apos;s Fulfillment Method — Store Pickup ends at &quot;Ready for Pickup&quot;, Shipping/Local Delivery ends at &quot;Handed Over&quot;.</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading production pipeline...</div>
      ) : (
        <JobKanbanBoard
          groupedJobs={groupedJobs}
          activeColumns={activeColumns}
          onHoldJobs={onHoldJobs}
          actionLoadingId={actionLoadingId}
          onUpdateStatus={updateJobStatus}
          onApprove={handleApproveJob}
          onReject={openRejectModal}
        />
      )}

      <JobRejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
        }}
        onConfirm={handleConfirmReject}
        actionLoading={actionLoadingId !== null}
      />

      <QuickJobModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        onCreated={() => { if (fetchJobs) fetchJobs(); }}
      />

      {shop && (
        <JobTrashModal
          isOpen={trashModalOpen}
          onClose={() => setTrashModalOpen(false)}
          shopId={shop.id}
          onRestored={() => { if (fetchJobs) fetchJobs(); }}
        />
      )}
    </div>
  );
}
