'use client';

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { Job } from '../jobTypes';
import OrderRulesModal from './OrderRulesModal';

/** Opens "Rules for this order". Only the owner and branch managers see it, and not on a closed order. */
export default function OrderRulesButton({ job, onChanged, label = 'Change for this order', className = '' }: Readonly<{ job: Job; onChanged?: () => Promise<void> | void; label?: string; className?: string }>) {
  const roles = useAuthStore((s) => s.user?.roles);
  const [open, setOpen] = useState(false);
  const allowed = !!roles?.some((r) => ['store_owner', 'branch_manager'].includes(r.name));
  if (!allowed || !onChanged || ['completed', 'cancelled', 'rejected'].includes(job.status)) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-semibold text-taupe hover:underline ${className}`}>
        <SlidersHorizontal size={14} /> {label}
      </button>
      {open && <OrderRulesModal job={job} isOpen onClose={() => setOpen(false)} onChanged={onChanged} />}
    </>
  );
}
