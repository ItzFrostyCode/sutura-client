'use client';

import React, { useState } from 'react';
import { Copy, Loader2, Upload } from 'lucide-react';
import Modal from '@/components/Modal';
import { getMediaUrl } from '@/lib/media';
import type { ShopPaymentMethod } from './usePayForOrder';

interface PayMethodDialogProps {
  readonly method: ShopPaymentMethod | null;
  readonly outstanding: number;
  readonly depositDue: number;
  readonly depositLabel: string;
  readonly uploading: boolean;
  readonly submitting: boolean;
  readonly onClose: () => void;
  readonly onUpload: (file: File) => Promise<string | null>;
  readonly onSubmit: (p: { amount: number; reference: string; receiptPath: string }) => Promise<boolean>;
}

// Shows where to pay (number / QR), then collects the proof. Never asks for card or wallet credentials.
export default function PayMethodDialog({ method, outstanding, depositDue, depositLabel, uploading, submitting, onClose, onUpload, onSubmit }: Readonly<PayMethodDialogProps>) {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState('');
  const [copied, setCopied] = useState(false);
  const value = Number(amount) || 0;
  const ok = value > 0 && value <= outstanding + 0.005 && proof !== '';

  const close = () => { setAmount(''); setReference(''); setProof(''); onClose(); };
  const copy = async () => { try { await navigator.clipboard.writeText(method?.account_number ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };
  const chips = [
    ...(depositDue > 0 && depositDue < outstanding ? [{ label: depositLabel, v: depositDue }] : []),
    { label: depositDue > 0 ? 'Pay in full' : 'Pay the balance', v: outstanding },
  ];

  return (
    <Modal isOpen={!!method} onClose={close} title={`Send your ${method?.name ?? ''} payment`} maxWidth="max-w-md">
      {method && (
        <div className="space-y-4">
          {/* Where it went, in one line (the full card with the QR is on the page behind this). */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3">
            <div className="min-w-0">
              <p className="mobile-caption text-ink-muted">Paid to {method.account_name}</p>
              {/* A QR-only method has no number to show or copy. */}
              <p className="break-all font-mono text-base font-semibold text-ink">{method.account_number || method.name}</p>
            </div>
            {method.account_number && (
              <button type="button" onClick={copy} className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-sunken"><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
            )}
          </div>

          <div>
            <label htmlFor="pay-amt" className="mobile-body-sm mb-1.5 block font-semibold text-ink">Amount you paid</label>
            <input id="pay-amt" type="number" inputMode="decimal" min="1" max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Up to ₱${outstanding.toLocaleString()}`} className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5" />
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => <button key={c.label} type="button" onClick={() => setAmount(String(c.v))} className="h-11 cursor-pointer rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-line-strong hover:bg-sunken active:opacity-70">{c.label} · ₱{c.v.toLocaleString()}</button>)}
            </div>
            {value > outstanding + 0.005 && <p className="text-xs text-danger mt-1.5">That is more than what is left (₱{outstanding.toLocaleString()}).</p>}
          </div>

          <div>
            <label htmlFor="pay-ref" className="mobile-body-sm mb-1.5 block font-semibold text-ink">Reference number <span className="font-normal text-ink-faint">(optional)</span></label>
            <input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="From your GCash receipt" className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5 font-mono" />
          </div>

          <div>
            <span className="mobile-body-sm mb-1.5 block font-semibold text-ink">Screenshot of your payment <span className="text-danger">*</span></span>
            {proof ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getMediaUrl(proof)} alt="Payment proof" className="h-16 w-16 rounded-xl border border-line object-cover" />
                <button type="button" onClick={() => setProof('')} className="h-10 cursor-pointer rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-danger hover:bg-sunken">Remove</button>
              </div>
            ) : (
              <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface text-base font-medium text-ink hover:bg-sunken active:opacity-70">
                {uploading ? <Loader2 size={16} className="animate-spin text-taupe" /> : <Upload size={16} />} {uploading ? 'Uploading…' : 'Attach screenshot'}
                <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const u = await onUpload(f); if (u) setProof(u); } }} />
              </label>
            )}
          </div>

          <p className="text-xs text-ink-muted">SUTURA never takes your payment. Pay in your {method.name} app first, then send the proof here.</p>
          <button type="button" disabled={!ok || submitting} onClick={async () => { if (await onSubmit({ amount: value, reference: reference.trim(), receiptPath: proof })) close(); }} className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink text-base font-semibold text-white transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40">
            {submitting && <Loader2 size={18} className="animate-spin" />} Send payment proof
          </button>
        </div>
      )}
    </Modal>
  );
}
