import React from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';

interface CustomerDeleteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
  readonly isSubmitting: boolean;
}

export default function CustomerDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: CustomerDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Customer Record">
      <div className="space-y-4">
        <p className="text-ink text-xs leading-relaxed">
          Are you sure you want to remove this customer from your active Client Book? Historical job orders and measurements will remain archived for accounting.
        </p>
        <div className="pt-3 flex justify-end gap-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-danger hover:bg-danger/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Yes, Remove
          </button>
        </div>
      </div>
    </Modal>
  );
}
