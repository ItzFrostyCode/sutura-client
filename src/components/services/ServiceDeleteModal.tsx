import React from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';

interface ServiceDeleteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
  readonly isSubmitting: boolean;
  readonly label?: string;
  // Bulk-delete count — when set, overrides `label` with a pluralized
  // "these N services" phrasing instead of "this service".
  readonly count?: number;
}

export default function ServiceDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  label = 'service',
  count,
}: ServiceDeleteModalProps) {
  const subject = count ? `these ${count} services` : `this ${label}`;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div className="space-y-4">
        <p className="text-ink-body text-sm">
          Are you sure you want to delete {subject}? {/* Accurate, not scarier than it needs to be — this is a soft
          delete (see ServiceController::destroy/restore), it stays
          recoverable from Trash, it just won't show up on the shop's
          storefront or in job/order forms until restored. */}
          It will be hidden from your storefront and won&apos;t be selectable for new orders, but you can restore {count ? 'them' : 'it'} later from Trash.
        </p>
        <div className="pt-4 flex justify-end gap-3">
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
            className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
