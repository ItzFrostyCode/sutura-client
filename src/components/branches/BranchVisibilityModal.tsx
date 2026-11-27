import React from 'react';
import { Loader2, EyeOff, Eye } from 'lucide-react';
import Modal from '@/components/Modal';
import { StoreBranch } from './branchHelpers';

interface BranchVisibilityModalProps {
  /** The branch being hidden or shown; null closes the popup. */
  readonly branch: StoreBranch | null;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isSubmitting: boolean;
}

/** Confirms Hide / Show on a branch shop and says plainly what changes. */
export default function BranchVisibilityModal({ branch, onClose, onConfirm, isSubmitting }: BranchVisibilityModalProps) {
  const hiding = branch?.status === 'active';
  const name = branch?.name ?? 'this branch';

  return (
    <Modal isOpen={!!branch} onClose={onClose} title={hiding ? `Hide ${name}?` : `Show ${name} again?`}>
      <div className="space-y-4 text-sm text-ink-body">
        {hiding ? (
          <>
            <p>Customers won&apos;t be able to find or book this branch. Here&apos;s what happens:</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>It comes off the map, search and your shop page.</li>
              <li>Customers can&apos;t book appointments or order online from it.</li>
              <li>Its staff can still sign in and keep working.</li>
              <li>Orders and appointments already there stay as they are. If you&apos;re closing it, let those customers know.</li>
            </ul>
            <p className="text-ink-muted">Nothing is deleted. You can show it again anytime.</p>
          </>
        ) : (
          <>
            <p>This branch goes back on the map, in search and on your shop page, and customers can book there again.</p>
            <p className="text-ink-muted">If your plan already has its limit of open branch shops, hide another one first.</p>
          </>
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
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-taupe hover:bg-taupe-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : hiding ? <EyeOff size={16} /> : <Eye size={16} />}
            {hiding ? 'Hide branch' : 'Show branch'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
