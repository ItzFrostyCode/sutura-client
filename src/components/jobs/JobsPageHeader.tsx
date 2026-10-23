'use client';

import React from 'react';
import Link from 'next/link';
import { Archive, Plus } from 'lucide-react';
import { AppleBar } from './ui/ApplePage';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';

interface JobsPageHeaderProps {
  activeCount: number;
  totalCount: number;
  isOwnerOrManager: boolean;
}

export default function JobsPageHeader({ activeCount, totalCount, isOwnerOrManager }: JobsPageHeaderProps) {
  return (
    <AppleBar>
      <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">Job Orders</h1>
        <p className="text-[13px] text-ink-muted">{activeCount} active · {totalCount} total</p>
      </div>
      {isOwnerOrManager && (
        <Link href="/dashboard/jobs/archived" title="View archived job orders" aria-label="View archived job orders" className={BTN}>
          <Archive size={16} />
          <span className="hidden sm:inline">Archived</span>
        </Link>
      )}
      {/* Making an order is the owner's and branch manager's job; plain staff only work on production. */}
      {isOwnerOrManager && (
        <Link href="/dashboard/jobs/new" className={BTN_PRIMARY}>
          <Plus size={16} />
          New Job Order
        </Link>
      )}
    </AppleBar>
  );
}
