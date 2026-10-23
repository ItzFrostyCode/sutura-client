'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ApplePage, { AppleBar } from '@/components/jobs/ui/ApplePage';
import SearchInput from '@/components/shared/SearchInput';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import { TableSkeleton } from '@/components/ui/Skeleton';
import ArchivedOrderRow, { ARCHIVED_COLS } from '@/components/jobs/archived/ArchivedOrderRow';
import { useArchivedOrders } from '@/components/jobs/archived/useArchivedOrders';
import { useAuthStore } from '@/store/useAuthStore';

const HEADINGS = ['Order', 'Customer', 'Item', 'Total', 'Before archiving', 'Archived', ''];

export default function ArchivedOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const allowed = Boolean(user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name)));
  const a = useArchivedOrders();

  // Staff have no archive; send them back to the board.
  useEffect(() => {
    if (user && !allowed) router.replace('/dashboard/jobs');
  }, [user, allowed, router]);

  if (!allowed) return <ApplePage><div className="p-6"><TableSkeleton rows={4} cols={4} /></div></ApplePage>;

  return (
    <ApplePage>
      <AppleBar>
        <Link href="/dashboard/jobs" aria-label="Back to Job Orders" className={BTN}><ArrowLeft size={16} /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">Archived orders</h1>
          <p className="text-[13px] text-ink-muted">
            {a.jobs.length} archived · Restore puts an order back on the board. Delete permanently removes it for good.
          </p>
        </div>
      </AppleBar>

      <div className="space-y-4 p-4 sm:p-6">
        <SearchInput value={a.search} onChange={a.setSearch} placeholder="Search order no., customer or item" onCanvasBackground className="max-w-md" />

        {a.loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : a.loadError ? (
          <div role="alert" className="flex flex-col items-start gap-3 border-y border-espresso/15 py-6">
            <p className="text-base font-semibold text-espresso">The archive could not be loaded.</p>
            <p className="text-sm text-espresso/60">This is a connection problem, not an empty archive. Check the connection, then try again.</p>
            <button type="button" onClick={a.load} className={BTN_PRIMARY}>Try again</button>
          </div>
        ) : a.visible.length === 0 ? (
          <p className="rounded-xl border border-espresso/[0.08] bg-white px-6 py-12 text-center text-sm text-ink-muted">
            {a.jobs.length === 0 ? 'No archived orders.' : 'No archived orders match your search.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-espresso/[0.08] bg-white">
            <div aria-hidden className={`hidden gap-4 border-b border-espresso/[0.08] px-6 py-3 text-[12px] font-medium text-ink-muted lg:grid ${ARCHIVED_COLS}`}>
              {HEADINGS.map((h, i) => <span key={h || i} className={h === 'Total' ? 'text-right' : ''}>{h}</span>)}
            </div>
            <ul className="divide-y divide-espresso/[0.08]">
              {a.visible.map((job) => (
                <ArchivedOrderRow key={job.id} job={job} busy={a.busyId === job.id} onRestore={a.restore} onDelete={a.deleteForever} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </ApplePage>
  );
}
