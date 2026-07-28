import React, { useState } from 'react';
import { Pause } from 'lucide-react';
import Modal from '@/components/Modal';

interface HoldReasonModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (reason: string) => void;
}

export default function HoldReasonModal({ isOpen, onClose, onConfirm }: HoldReasonModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={(
        <span className="inline-flex items-center gap-2">
          <Pause size={18} className="text-amber-600" /> Put Job Order On Hold
        </span>
      )}
    >
      <div className="space-y-3">
        <p className="text-xs text-[#827A73]">
          e.g. waiting on customer to confirm a design change, fabric delivery delayed, awaiting a fitting reschedule.
          This is shown to staff so they know why production paused.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Reason for the hold…"
          className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe resize-none"
        />
        <div className="pt-2 border-t border-[#EBE6E0] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26]">
            Never mind
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white"
          >
            Confirm Hold
          </button>
        </div>
      </div>
    </Modal>
  );
}
