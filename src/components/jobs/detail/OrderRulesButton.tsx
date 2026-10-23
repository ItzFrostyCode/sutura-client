'use client';

import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { Job } from '../jobTypes';
import OrderRulesModal from './OrderRulesModal';
import { BTN } from '@/components/shared/plainForm';

/** Opens "Edit what this order needs". Only the owner and branch managers see it, and not on a closed order. */
export default function OrderRulesButton({ job, onChanged, label = 'Edit what this order needs', className = '', variant = 'link' }: Readonly<{ job: Job; onChanged?: () => Promise<void> | void; label?: string; className?: string; variant?: 'link' | 'button' }>) {
  const roles = useAuthStore((s) => s.user?.roles);
  const [open, setOpen] = useState(false);
  const allowed = !!roles?.some((r) => ['store_owner', 'branch_manager'].includes(r.name));
  if (!allowed || !onChanged || ['completed', 'cancelled', 'rejected'].includes(job.status)) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${variant === 'button' ? `${BTN} w-full` : 'inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-semibold text-taupe hover:underline'} ${className}`}>
        <SlidersHorizontal size={variant === 'button' ? 16 : 14} /> {label}
      </button>
      {open && <OrderRulesModal job={job} isOpen onClose={() => setOpen(false)} onChanged={onChanged} />}
    </>
  );
}
