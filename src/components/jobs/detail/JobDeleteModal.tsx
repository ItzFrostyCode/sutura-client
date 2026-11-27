'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface JobDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export default function JobDeleteModal({
  isOpen,
  onClose,
  onDelete,
  isDeleting,
}: JobDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div className="space-y-4">
        <p className="text-ink-body text-sm">
          Are you sure you want to delete this job order? This action cannot be undone.
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
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            type="button"
          >
            {isDeleting && <Loader2 size={16} className="animate-spin" />}
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
