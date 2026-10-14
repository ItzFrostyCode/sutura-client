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
    <Modal isOpen={!!method} onClose={close} title={`Pay with ${method?.name ?? ''}`} maxWidth="max-w-md">
      {method && (
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl bg-sunken p-4">
            {method.qr_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getMediaUrl(method.qr_path)} alt={`${method.name} QR code`} className="mx-auto h-48 w-48 rounded-xl bg-white object-contain" />
            )}
            <div>
              <p className="mobile-overline text-ink-faint">Account name</p>
              <p className="text-base text-ink">{method.account_name}</p>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="mobile-overline text-ink-faint">{method.kind === 'bank_transfer' ? 'Account number' : 'Number'}</p>
                <p className="text-lg font-mono font-semibold text-ink break-all">{method.account_number}</p>
              </div>
              <button type="button" onClick={copy} className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-4 text-xs font-semibold shadow-[0_1px_3px_rgba(45,42,38,0.12)] active:opacity-70"><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
            </div>
            {method.instructions && <p className="text-sm text-ink-body whitespace-pre-wrap">{method.instructions}</p>}
          </div>

          <div>
            <label htmlFor="pay-amt" className="mobile-overline mb-2 block text-ink-faint">Amount you paid</label>
            <input id="pay-amt" type="number" inputMode="decimal" min="1" max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Up to ₱${outstanding.toLocaleString()}`} className="h-12 w-full rounded-xl bg-sunken px-4 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-line-strong" />
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((c) => <button key={c.label} type="button" onClick={() => setAmount(String(c.v))} className="h-11 cursor-pointer rounded-full bg-sunken px-4 text-xs font-semibold text-ink active:opacity-70">{c.label} · ₱{c.v.toLocaleString()}</button>)}
            </div>
            {value > outstanding + 0.005 && <p className="text-xs text-danger mt-1.5">That is more than what is left (₱{outstanding.toLocaleString()}).</p>}
          </div>

          <div>
            <label htmlFor="pay-ref" className="mobile-overline mb-2 block text-ink-faint">Reference number <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
            <input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} className="h-12 w-full rounded-xl bg-sunken px-4 font-mono text-base text-ink focus:outline-none focus:ring-2 focus:ring-line-strong" />
          </div>

          <div>
            <span className="mobile-overline mb-2 block text-ink-faint">Screenshot of your payment <span className="text-red-600">*</span></span>
            {proof ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getMediaUrl(proof)} alt="Payment proof" className="h-16 w-16 rounded-xl object-cover" />
                <button type="button" onClick={() => setProof('')} className="text-xs font-semibold text-danger cursor-pointer">Remove</button>
              </div>
            ) : (
              <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-sunken text-sm text-ink-muted active:opacity-70">
                {uploading ? <Loader2 size={16} className="animate-spin text-taupe" /> : <Upload size={16} />} {uploading ? 'Uploading…' : 'Attach screenshot'}
                <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const u = await onUpload(f); if (u) setProof(u); } }} />
              </label>
            )}
          </div>

          <p className="text-xs text-ink-muted">SUTURA never takes your payment. Pay in your {method.name} app first, then send the proof here.</p>
          <button type="button" disabled={!ok || submitting} onClick={async () => { if (await onSubmit({ amount: value, reference: reference.trim(), receiptPath: proof })) close(); }} className="flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50">
            {submitting && <Loader2 size={18} className="animate-spin" />} I have paid
          </button>
        </div>
      )}
    </Modal>
  );
}
