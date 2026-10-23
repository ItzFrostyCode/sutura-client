import React from 'react';
import { Ban } from 'lucide-react';
import { cancelledLine } from './cancelOptions';

/** One line at the top of a cancelled order: when, why, and how the customer agreed. Draws nothing for other orders. */
export default function CancelledNotice({ job }: Readonly<{ job: Parameters<typeof cancelledLine>[0] }>) {
  const line = cancelledLine(job);
  if (!line) return null;
  const note = (job.custom_order_data?.cancellation as { note?: string | null } | undefined)?.note;
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-800">
      <Ban size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{line}</p>
        {note && <p className="mt-0.5 text-[13px]">{note}</p>}
      </div>
    </div>
  );
}
