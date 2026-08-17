import React from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';

interface CatalogDeleteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
  readonly isSubmitting: boolean;
}

export default function CatalogDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: CatalogDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Item">
      <div className="space-y-4 text-ink">
        <p className="text-ink-body text-sm">
          Are you sure you want to delete this item from the catalog? This action cannot be undone.
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
            className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
