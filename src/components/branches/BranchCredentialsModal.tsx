'use client';

import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import Modal from '@/components/Modal';
import type { BranchManagerCredentials } from './branchHelpers';

/**
 * Shown once, right after a branch is added with a new staff account as its
 * manager. The server keeps only a hash, and the manager must choose their
 * own password the first time they sign in.
 */
export default function BranchCredentialsModal({ credentials, onClose }: {
  readonly credentials: BranchManagerCredentials | null; readonly onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!credentials) return;
    const text = [
      `SUTURA staff login for ${credentials.name}`,
      'Sign in on the SUTURA login page.',
      `Login: ${credentials.login_email}`,
      `Temporary password: ${credentials.temporary_password}`,
      'You will be asked to choose your own password the first time you sign in.',
    ].join('\n');
    await navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal
      isOpen={credentials !== null}
      onClose={onClose}
      title="Branch manager login created"
      footer={(
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={copy}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-sunken">
            {copied ? <Check size={16} className="text-sage" /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Credentials'}
          </button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg bg-ink px-5 text-sm font-semibold text-white">Done</button>
        </div>
      )}
    >
      {credentials && (
        <>
          <p className="text-sm text-ink-muted">
            Send these to <strong className="font-semibold text-ink">{credentials.name}</strong>. They sign in on the SUTURA login page
            and must choose a new password the first time.
          </p>
          <dl className="mt-4 rounded-xl border border-line bg-canvas px-4">
            <div className="border-b border-line py-3">
              <dt className="text-xs text-ink-muted">Login</dt>
              <dd className="break-all font-mono text-base text-ink">{credentials.login_email}</dd>
            </div>
            <div className="py-3">
              <dt className="text-xs text-ink-muted">Temporary password</dt>
              <dd className="break-all font-mono text-base text-ink">{credentials.temporary_password}</dd>
            </div>
          </dl>
          <p className="mt-4 flex gap-2 text-sm text-ink">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-alert" />
            This password won&apos;t be shown again. Copy it before you close this window.
          </p>
        </>
      )}
    </Modal>
  );
}
