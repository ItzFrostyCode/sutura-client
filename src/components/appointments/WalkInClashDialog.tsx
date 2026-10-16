import React from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';
import { formatScheduled } from './appointmentHelpers';

export interface WalkInClash {
  conflicts: { id: number; customer_name?: string | null; scheduled_at: string; duration_minutes: number }[];
}

interface Props {
  readonly clash: WalkInClash | null;
  readonly isSubmitting: boolean;
  /** serve: save the walk-in and ask the online customer to move. other: go back and pick another time. */
  readonly onChoose: (choice: 'serve_walkin_reschedule_online' | 'other_time') => void;
}

/** A customer asked for this time online and is still waiting for the shop's answer. The owner chooses. */
export default function WalkInClashDialog({ clash, isSubmitting, onChoose }: Props) {
  const names = clash?.conflicts.map((c) => c.customer_name || 'A customer').join(', ');
  return (
    <Modal isOpen={!!clash} onClose={() => onChoose('other_time')} title="Someone already asked for this time">
      <div className="space-y-4">
        <p className="text-sm text-ink-body">
          {names} asked for this time online and is waiting for your answer. A walk-in can take the time, but then the online
          customer is asked to pick another time. A confirmed booking is never moved.
        </p>
        {clash && clash.conflicts.length > 0 && (
          <ul className="text-xs text-ink-muted space-y-1">
            {clash.conflicts.map((c) => (
              <li key={c.id}>{c.customer_name || 'Customer'} · {formatScheduled(c.scheduled_at).shortDate} {formatScheduled(c.scheduled_at).time} · {c.duration_minutes} min</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2.5">
          <button type="button" disabled={isSubmitting} onClick={() => onChoose('serve_walkin_reschedule_online')}
            className="min-h-[52px] px-4 bg-taupe hover:bg-taupe-hover text-white text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {isSubmitting && <Loader2 size={16} className="animate-spin" />} Serve the walk-in, ask the online customer to move
          </button>
          <button type="button" disabled={isSubmitting} onClick={() => onChoose('other_time')}
            className="min-h-[52px] px-4 border border-line bg-surface text-ink text-base font-semibold hover:border-taupe/50 disabled:opacity-50">
            Give the walk-in another time
          </button>
        </div>
      </div>
    </Modal>
  );
}
