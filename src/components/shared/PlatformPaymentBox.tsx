'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PLATFORM_GCASH } from '@/lib/platformPayment';

const peso = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// The one place that tells a shop owner where to send the money.
export default function PlatformPaymentBox({ amount, note }: Readonly<{ amount: number; note?: string }>) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PLATFORM_GCASH.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the number is shown in full anyway */
    }
  };

  return (
    <div className="border border-line bg-sunken p-4 text-ink-body">
      <p className="text-xs font-bold uppercase tracking-wider text-ink">Pay with GCash</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-ink-muted">Amount</dt>
        <dd className="font-semibold text-ink">{peso(amount)}</dd>
        <dt className="text-ink-muted">GCash number</dt>
        <dd className="flex items-center gap-2">
          <span className="font-mono font-semibold text-ink tracking-wide">{PLATFORM_GCASH.number}</span>
          <button type="button" onClick={copy} aria-label="Copy GCash number" className="h-8 px-2 border border-line-strong bg-white text-xs font-medium flex items-center gap-1 cursor-pointer hover:bg-canvas">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </dd>
        <dt className="text-ink-muted">Account name</dt>
        <dd className="font-semibold text-ink">{PLATFORM_GCASH.name}</dd>
      </dl>
      <p className="mt-3 text-xs text-ink-muted">{note ?? 'After you pay, upload a screenshot of the GCash receipt below.'}</p>
    </div>
  );
}
