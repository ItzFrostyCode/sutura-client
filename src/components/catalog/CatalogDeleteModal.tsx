import React from 'react';
import Modal from '@/components/Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CatalogDeleteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
  readonly isSubmitting: boolean;
  /** This design has at least one real order/job order against it — deleting
   * it doesn't touch that order history, but it does pull a design customers
   * have actually bought, so the warning says so instead of the plain
   * "are you sure" every other (never-sold) design gets. */
  readonly hasSalesHistory?: boolean;
}

export default function CatalogDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  hasSalesHistory = false,
}: CatalogDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Item">
      <div className="space-y-4 text-ink">
        {hasSalesHistory ? (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 p-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <p className="text-sm">
              This design already has real orders against it. Deleting it won&apos;t change any past order —
              it just removes the design itself from your catalog, so customers can no longer find or
              reorder it. Are you sure you want to delete it?
            </p>
          </div>
        ) : (
          <p className="text-ink-body text-sm">
            Are you sure you want to delete this catalog design? This action cannot be undone.
          </p>
        )}
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
