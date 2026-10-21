'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { AppleBar } from './ui/ApplePage';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';

interface JobsPageHeaderProps {
  activeCount: number;
  totalCount: number;
  onOpenTrash: () => void;
  isOwnerOrManager: boolean;
}

export default function JobsPageHeader({ activeCount, totalCount, onOpenTrash, isOwnerOrManager }: JobsPageHeaderProps) {
  return (
    <AppleBar>
      <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">Job Orders</h1>
        <p className="text-[13px] text-ink-muted">{activeCount} active · {totalCount} total</p>
      </div>
      {isOwnerOrManager && (
        <button
          type="button"
          onClick={onOpenTrash}
          title="View deleted job orders"
          aria-label="View deleted job orders"
          className={BTN}
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Deleted Orders</span>
        </button>
      )}
      {/* Staff open a walk-in order here too; an owner or manager can also collect the deposit. */}
      <Link href="/dashboard/jobs/new" className={BTN_PRIMARY}>
        <Plus size={16} />
        New Job Order
      </Link>
    </AppleBar>
  );
}
