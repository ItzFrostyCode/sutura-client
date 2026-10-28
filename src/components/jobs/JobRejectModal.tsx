import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';

interface JobRejectModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason: string) => Promise<void>;
  readonly actionLoading: boolean;
}

export default function JobRejectModal({
  isOpen,
  onClose,
  onConfirm,
  actionLoading,
}: JobRejectModalProps) {
  const [rejectReason, setRejectReason] = useState('');

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    onConfirm(rejectReason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Job Order">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink-body">
          Reject is for a request the shop will <strong>not</strong> take. The customer is told, and it moves to Cancelled.
        </p>
        <p className="rounded-lg bg-sunken px-3 py-2 text-sm text-ink-body">
          Made this order by mistake? Do not reject it. Close this, open the order, then <strong>⋯ → Cancel this order → Made by mistake</strong>. The customer is not told.
        </p>
        <div>
          <label htmlFor="reject-reason" className="block text-sm font-medium text-ink-body mb-1.5">Reason <span className="text-ink-faint font-normal">(kept on the order)</span></label>
          <textarea
            id="reject-reason"
            rows={3}
            required
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Materials not available, fully booked this week..."
            className="w-full bg-canvas border border-line rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe resize-none"
          />
        </div>
        <div className="pt-1 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors"
          >
            Go back
          </button>
          <button
            type="submit"
            disabled={actionLoading || !rejectReason.trim()}
            className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {actionLoading && <Loader2 size={14} className="animate-spin" />}
            Confirm Rejection
          </button>
        </div>
      </form>
    </Modal>
  );
}
