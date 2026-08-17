import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface BranchDeleteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isSubmitting: boolean;
}

export default function BranchDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: BranchDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Branch">
      <div className="space-y-4">
        <p className="text-ink-body text-sm">
          Are you sure you want to delete this branch? This cannot be undone. Branches with active orders or
          staff cannot be deleted.
        </p>
        <div className="pt-4 flex justify-end gap-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
