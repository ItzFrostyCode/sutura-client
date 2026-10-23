'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import type { Job as StageJob } from '../jobHelpers';
import { nextTask } from '../jobStage';

/**
 * Phones only: one main action pinned to the bottom, so it is never scrolled out of reach. It is "Save changes" when something
 * is waiting to be saved, otherwise the next production task ("Next: Cutting"). Everything else stays in the More menu.
 */
export default function MobileActionBar({ storeId, job, dirty, saving, onSave, onMoved }: Readonly<{
  storeId: number; job: StageJob; dirty: boolean; saving: boolean; onSave: () => void; onMoved: () => Promise<void> | void;
}>) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const next = dirty ? null : nextTask(job);
  if (!dirty && !next) return null;

  const advance = async () => {
    if (!next) return;
    setBusy(true);
    try {
      const res = await api.post(`/stores/${storeId}/jobs/${job.id}/production/next`);
      toast.success(res.data?.message ?? `Moved to ${next.label}.`);
      await onMoved();
    } catch (err) {
      toast.error(getErrorMessage(err, 'That move is not allowed right now.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[599px] border-x border-t border-line bg-surface px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:hidden">
      <button
        type="button" disabled={saving || busy} onClick={dirty ? onSave : advance}
        className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-espresso text-base font-semibold text-white disabled:opacity-60"
      >
        {(saving || busy) && <Loader2 size={18} className="animate-spin" />}
        {dirty ? 'Save changes' : `Next: ${next!.label}`}
      </button>
    </div>
  );
}
