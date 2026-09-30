'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';

interface ApproveModalProps {
  readonly isOpen: boolean;
  readonly storeName: string;
  readonly suggestedLogin: string;
  readonly loginDomain: string;
  readonly contactEmail: string;
  readonly onClose: () => void;
  /** Throw to keep the dialog open (e.g. login already taken). */
  readonly onConfirm: (loginEmail: string) => Promise<void>;
}

// Approving issues the shop's login. Only the part before @ is editable —
// the domain is fixed server-side so a shop login can never be a customer's
// personal email.
export default function ApproveModal({ isOpen, storeName, suggestedLogin, loginDomain, contactEmail, onClose, onConfirm }: ApproveModalProps) {
  const [local, setLocal] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) setLocal(suggestedLogin.split('@')[0] ?? '');
  }, [isOpen, suggestedLogin]);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(`${local.trim().toLowerCase()}@${loginDomain}`);
    } catch {
      /* caller showed the error */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Approve ${storeName}?`}
      footer={(
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 border border-line-strong px-4 text-sm text-ink">Cancel</button>
          <button type="button" disabled={busy || local.trim().length < 2} onClick={confirm} className="min-h-11 bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? 'Approving…' : 'Approve & Issue Login'}
          </button>
        </div>
      )}
    >
      <p className="text-sm text-ink-muted">
        The shop goes live immediately. We&apos;ll generate a temporary password and email the login to{' '}
        <strong className="font-semibold text-ink break-all">{contactEmail}</strong>.
      </p>
      <label htmlFor="shop-login" className="mt-5 mb-2 block text-sm text-ink">Shop login</label>
      <div className="flex min-h-12 items-stretch border border-line-strong bg-surface focus-within:border-ink">
        <input id="shop-login" value={local} autoComplete="off" spellCheck={false}
          onChange={(e) => setLocal(e.target.value.replace(/[^A-Za-z0-9._-]/g, ''))}
          className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink focus:outline-none" />
        <span className="flex items-center border-l border-line bg-sunken px-3 text-sm text-ink-muted">@{loginDomain}</span>
      </div>
      <p className="mt-2 text-xs text-ink-faint">Letters, numbers, dots, dashes, or underscores.</p>
    </Modal>
  );
}
