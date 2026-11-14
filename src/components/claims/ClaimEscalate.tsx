'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/** "Ask SUTURA support to review" on a declined claim: opens a short inline form. It can be sent once. */
export default function ClaimEscalate({ onSend }: Readonly<{ onSend: (message: string) => Promise<boolean> }>) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 cursor-pointer items-center text-base font-semibold text-taupe underline underline-offset-2">Ask SUTURA support to review</button>;
  }

  const send = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) return setError('Tell support why you disagree, in at least 10 letters.');
    setError('');
    setSending(true);
    const ok = await onSend(message.trim());
    if (!ok) setSending(false); // on success the claim reloads with its ticket link
  };

  return (
    <form onSubmit={send} className="space-y-3">
      <label htmlFor="claim-escalate" className="mobile-body-sm block font-semibold text-ink">Why do you disagree with the shop?</label>
      <p className="mobile-caption text-ink-muted">SUTURA support sees your report, your photos and the shop&apos;s reason, and replies in Support. You can do this once.</p>
      <textarea id="claim-escalate" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full resize-none rounded-xl border border-line bg-white px-3 py-3 text-base text-ink focus:border-ink focus:outline-none" />
      {error && <p className="mobile-body-sm text-danger" role="alert">{error}</p>}
      <div className="flex flex-col gap-3 min-[480px]:flex-row-reverse">
        <button type="submit" disabled={sending} className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-white active:opacity-80 disabled:opacity-50 min-[480px]:flex-1">
          {sending && <Loader2 size={16} className="animate-spin" />}Send to support
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-12 cursor-pointer rounded-full border border-line bg-white px-6 text-base font-medium text-ink hover:bg-sunken">Cancel</button>
      </div>
    </form>
  );
}
