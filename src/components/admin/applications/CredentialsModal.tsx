'use client';

import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import Modal from '@/components/Modal';
import type { IssuedCredentials } from './useApplicationDetail';

function CopyRow({ label, value }: { readonly label: string; readonly value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="break-all font-mono text-base text-ink">{value}</p>
      </div>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`} className="btn-icon-mobile shrink-0 text-ink-muted hover:text-ink">
        {copied ? <Check size={18} className="text-sage" /> : <Copy size={18} />}
      </button>
    </div>
  );
}

// Shown exactly once, right after approval. The server keeps only a hash,
// so if this is lost the owner uses "Forgot Password?" (which also reaches
// their personal email).
export default function CredentialsModal({ credentials, onClose }: { readonly credentials: IssuedCredentials | null; readonly onClose: () => void }) {
  return (
    <Modal
      isOpen={credentials !== null}
      onClose={onClose}
      title="Shop login issued"
      footer={(
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="min-h-11 bg-ink px-5 text-sm font-semibold text-white">Done</button>
        </div>
      )}
    >
      {credentials && (
        <>
          <p className="text-sm text-ink-muted">
            Emailed to <strong className="font-semibold text-ink break-all">{credentials.sent_to}</strong>. The owner must
            choose a new password the first time they sign in on the Shop tab.
          </p>
          <div className="mt-4 border border-line bg-surface px-4">
            <CopyRow label="Login" value={credentials.login_email} />
            <CopyRow label="Temporary password" value={credentials.temporary_password} />
          </div>
          <p className="mt-4 flex gap-2 text-sm text-ink">
            <TriangleAlert size={16} className="mt-0.5 shrink-0 text-alert" />
            This password won&apos;t be shown again. Copy it now if you need to give it to the owner yourself.
          </p>
        </>
      )}
    </Modal>
  );
}
