'use client';

import React, { useEffect, useRef, useState } from 'react';
import { scrollToListTop } from '@/lib/scrollToListTop';
import { useRouter } from 'next/navigation';
import { Download, Loader2, SlidersHorizontal } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { TableSkeleton } from '@/components/ui/Skeleton';
import OrdersPager from '@/components/catalog/detail/orders/OrdersPager';
import JobQuickViewModal from '@/components/jobs/JobQuickViewModal';
import CompletedOrdersStats, { CompletedOrdersStatsSkeleton } from '@/components/jobs/completed/CompletedOrdersStats';
import CompletedOrdersTable from '@/components/jobs/completed/CompletedOrdersTable';
import CompletedOrdersFilters from '@/components/jobs/completed/CompletedOrdersFilters';
import { PAGE_SIZE, useCompletedOrders, type CompletedOrder } from '@/components/jobs/completed/useCompletedOrders';
import { useAuthStore } from '@/store/useAuthStore';

const BUTTON = 'h-10 px-3.5 inline-flex items-center gap-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taupe';

export default function CompletedOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  // The page shows order value, so it follows the API: owner and branch manager only.
  const canView = Boolean(user?.roles?.some((r) => ['store_owner', 'branch_manager'].includes(r.name)));

  useEffect(() => {
    if (user && !canView) router.replace('/dashboard/jobs');
  }, [user, canView, router]);

  const {
    orders, stats, total, pageCount, page, setPage,
    search, setSearch, filters, setFilters, activeFilterCount,
    loading, failed, exporting, exportCsv,
  } = useCompletedOrders();
  const [showFilters, setShowFilters] = useState(false);
  const [viewing, setViewing] = useState<CompletedOrder | null>(null);
  // Changing page brings the table's top back into view.
  const tableRef = useRef<HTMLDivElement>(null);
  const goToPage = (n: number) => { setPage(n); scrollToListTop(tableRef.current); };

  if (!canView) return null;

  const narrowed = Boolean(search.trim()) || activeFilterCount > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Completed Orders"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="completed-filters"
              className={`${BUTTON} ${showFilters || activeFilterCount ? 'border-taupe bg-taupe/10 text-taupe' : 'border-line bg-surface text-ink-body hover:border-taupe'}`}
            >
              <SlidersHorizontal size={15} />
              Filter
              {activeFilterCount > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-taupe text-white text-[11px] font-bold flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting || total === 0}
              className={`${BUTTON} border-line bg-surface text-ink-body hover:border-taupe`}
            >
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Export
            </button>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search Orders"
              onCanvasBackground
              className="w-full sm:w-64"
            />
          </>
        }
      />

      {stats ? <CompletedOrdersStats stats={stats} /> : <CompletedOrdersStatsSkeleton />}

      <div ref={tableRef} className="scroll-mt-24 bg-surface border border-line rounded-2xl overflow-hidden shadow-2xs">
        {showFilters && (
          <div id="completed-filters">
            <CompletedOrdersFilters filters={filters} onChange={setFilters} />
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="p-4"><TableSkeleton rows={6} cols={6} /></div>
        ) : failed ? (
          <div className="px-6 py-14 text-center text-sm text-ink-muted">
            Completed orders could not be loaded. Check your connection and refresh the page.
          </div>
        ) : (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <CompletedOrdersTable
              orders={orders}
              onView={setViewing}
              emptyMessage={
                narrowed
                  ? 'No completed orders match your search or filters.'
                  : 'No completed orders yet. Orders show here once they are marked Completed.'
              }
            />
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <OrdersPager page={page} pageCount={pageCount} total={total} pageSize={PAGE_SIZE} onChange={goToPage} />
      )}

      <JobQuickViewModal isOpen={viewing !== null} job={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
