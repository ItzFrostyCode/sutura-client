'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Upload } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { ServiceOrderState } from './useServiceOrder';

const peso2 = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Pay the amount the payment term asks for, by GCash only, then attach the
// receipt. Sent with the order as a payment the shop verifies — SUTURA never
// moves the money or asks for wallet credentials.
export default function OrderGcashPayment({ o }: Readonly<{ o: ServiceOrderState }>) {
  const [copied, setCopied] = useState(false);

  if (o.dueNow === null || o.dueNow <= 0) return null;

  if (o.gcashLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-muted py-2">
        <Loader2 size={16} className="animate-spin" /> Loading the shop's GCash details…
      </div>
    );
  }

  if (o.gcashAccounts.length === 0) {
    return (
      <div className="border border-line bg-sunken px-4 py-3 text-sm text-ink-body">
        This shop hasn't added a GCash account yet. Place your order now and pay from My Orders once the shop accepts it.
      </div>
    );
  }

  const account = o.gcashAccounts.find((m) => m.id === o.gcashId) ?? o.gcashAccounts[0];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the number is shown in full anyway */
    }
  };

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2.5">
        <legend className="mobile-h4 text-ink mb-2.5">
          Payment method<span className="text-danger">*</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Payment method">
          {o.gcashAccounts.map((m) => {
            const on = m.id === account.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => o.setGcashId(m.id)}
                className={`h-14 px-4 border text-base font-semibold transition-colors ${
                  on ? 'bg-ink border-ink text-white' : 'bg-surface border-line text-ink hover:border-ink/40'
                }`}
              >
                {o.gcashAccounts.length > 1 ? `GCash · ${m.account_name}` : 'GCash'}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="border border-line bg-sunken p-4 text-ink-body">
        <p className="text-xs font-bold uppercase tracking-wider text-ink">Pay with GCash</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-4">
          <dl className="flex-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm items-center">
            <dt className="text-ink-muted">Amount</dt>
            <dd className="font-semibold text-ink tabular-nums">{peso2(o.dueNow)}</dd>
            <dt className="text-ink-muted">GCash number</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold text-ink tracking-wide">{account.account_number}</span>
              <button type="button" onClick={copy} aria-label="Copy GCash number" className="h-9 px-2.5 border border-line-strong bg-white text-xs font-medium flex items-center gap-1 hover:bg-canvas">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </dd>
            <dt className="text-ink-muted">Account name</dt>
            <dd className="font-semibold text-ink">{account.account_name}</dd>
          </dl>
          {account.qr_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getMediaUrl(account.qr_path)} alt="GCash QR code" className="w-32 h-32 object-contain bg-white border border-line self-start" />
          )}
        </div>
        {account.instructions && <p className="mt-3 text-sm text-ink-body whitespace-pre-wrap">{account.instructions}</p>}
        <p className="mt-3 text-xs text-ink-muted">
          After you pay, upload a screenshot of the GCash receipt below. The shop checks it before production starts.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="order-pay-ref" className="mobile-h4 text-ink block">
          Reference number <span className="text-ink-faint font-normal">(Optional)</span>
        </label>
        <input
          id="order-pay-ref"
          type="text"
          maxLength={255}
          value={o.paymentReference}
          onChange={(e) => o.setPaymentReference(e.target.value)}
          placeholder="13-digit GCash reference"
          className="w-full h-[48px] bg-canvas border border-line rounded-none px-4 text-base text-ink font-mono focus:outline-none focus:border-taupe placeholder:text-ink-faint placeholder:font-sans"
        />
      </div>

      <div className="space-y-1.5">
        <p className="mobile-h4 text-ink">
          Payment receipt<span className="text-danger">*</span>
        </p>
        <p className="mobile-caption text-ink-muted">Screenshot or photo — JPG, PNG, or WEBP</p>
        {o.receipt ? (
          <div className="flex items-center gap-3 border border-line bg-surface p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(o.receipt)} alt="GCash receipt" className="w-16 h-16 object-cover border border-line" />
            <p className="flex-1 text-sm text-ink">Receipt attached</p>
            <button type="button" onClick={() => o.setReceipt('')} className="h-11 px-3 text-sm font-semibold text-danger hover:underline underline-offset-4">
              Remove
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 h-16 px-5 border border-dashed border-line-strong bg-surface text-ink-muted cursor-pointer hover:border-taupe hover:text-taupe transition-colors focus-within:border-taupe">
            {o.uploadingReceipt ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <span className="text-base">{o.uploadingReceipt ? 'Uploading…' : 'Choose a file'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={o.uploadingReceipt}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void o.uploadReceipt(file);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
