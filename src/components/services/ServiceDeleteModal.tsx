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
  /** Services are archived, not deleted (Services decision S2): they can be restored as Unpublished. */
  readonly archive?: boolean;
}

export default function ServiceDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  label = 'service',
  count,
  archive = false,
}: ServiceDeleteModalProps) {
  const subject = count ? `these ${count} services` : `this ${label}`;
  if (archive) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={count ? 'Archive services?' : 'Archive this service?'}>
        <div className="space-y-4">
          <p className="text-ink-body text-sm">
            Archiving {subject} takes {count ? 'them' : 'it'} off your shop page and out of new bookings. Appointments, quotations and orders
            already made are not cancelled. You can restore {count ? 'them' : 'it'} later from Services › Archived; a restored service comes back unpublished.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="min-h-11 px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:text-ink transition-colors">Cancel</button>
            <button type="button" onClick={onConfirm} disabled={isSubmitting} className="min-h-11 bg-ink hover:bg-ink/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />} Yes, archive
            </button>
          </div>
        </div>
      </Modal>
    );
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div className="space-y-4">
        <p className="text-ink-body text-sm">
          Are you sure you want to delete {subject}? {/* Accurate, not scarier than it needs to be — this is a soft
          delete (see ServiceController::destroy/restore), it stays
          recoverable from Trash, it just won't show up on the store's
          storefront or in job/order forms until restored. */}
          It will be hidden from your store profile and won&apos;t be selectable for new orders, but you can restore {count ? 'them' : 'it'} later from Trash.
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
