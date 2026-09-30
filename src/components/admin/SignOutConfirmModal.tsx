'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import Modal from '@/components/Modal';

interface SignOutConfirmModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
}

// Sign out sits right under the nav in the console rail, so a stray click
// would otherwise end the admin session instantly (and sessions don't
// survive a closed tab, so there's no quick way back in).
export default function SignOutConfirmModal({ isOpen, onClose, onConfirm }: SignOutConfirmModalProps) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign out of the console?"
      footer={(
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 border border-line-strong px-4 text-sm text-ink">
            Stay signed in
          </button>
          <button type="button" disabled={busy} onClick={confirm} className="inline-flex min-h-11 items-center gap-2 bg-ink px-4 text-sm font-semibold text-white disabled:opacity-50">
            <LogOut size={15} /> {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    >
      <p className="text-sm text-ink-muted">
        You&apos;ll need your admin email and password to get back in. Any review you haven&apos;t submitted yet won&apos;t be saved.
      </p>
    </Modal>
  );
}
