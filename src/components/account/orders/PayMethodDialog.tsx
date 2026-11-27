'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Loader2, Maximize2, Upload, X } from 'lucide-react';
import HomeSheet from '@/components/home/HomeSheet';
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

// Shows where to pay (GCash number / QR), then collects the proof. Never asks for card or wallet credentials.
// A full-height panel on the right from 1024px (bottom sheet on a phone); "Send payment proof" stays pinned at the bottom.
export default function PayMethodDialog({ method, outstanding, depositDue, depositLabel, uploading, submitting, onClose, onUpload, onSubmit }: Readonly<PayMethodDialogProps>) {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setQrOpen(false); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [qrOpen]);
  const value = Number(amount) || 0;
  const ok = value > 0 && value <= outstanding + 0.005 && proof !== '';

  const close = () => { setAmount(''); setReference(''); setProof(''); onClose(); };
  const copy = async () => { try { await navigator.clipboard.writeText(method?.account_number ?? ''); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };
  const chips = [
    ...(depositDue > 0 && depositDue < outstanding ? [{ label: depositLabel, v: depositDue }] : []),
    { label: depositDue > 0 ? 'Pay in full' : 'Pay the balance', v: outstanding },
  ];

  return (
    <HomeSheet
      isOpen={!!method}
      onClose={close}
      title="Pay with GCash"
      footer={method && (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted">SUTURA never takes your payment. Pay in your GCash app first, then send the screenshot here. The shop checks it before it counts.</p>
          <button type="button" disabled={!ok || submitting} onClick={async () => { if (await onSubmit({ amount: value, reference: reference.trim(), receiptPath: proof })) close(); }} className="w-full h-[52px] rounded-xl bg-taupe hover:bg-taupe-hover text-white text-base font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {submitting && <Loader2 size={18} className="animate-spin" />} Send payment proof
          </button>
        </div>
      )}
    >
      {method && (
        <div className="space-y-4">
          <div className="border border-line bg-canvas p-4 space-y-3">
            {method.qr_path && (
              <button type="button" onClick={() => setQrOpen(true)} aria-label="View the QR code bigger" className="group relative mx-auto block cursor-zoom-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getMediaUrl(method.qr_path)} alt={`${method.name} QR code`} className="w-48 h-48 object-contain bg-white border border-line" />
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink/75 px-2 py-1 text-[11px] font-semibold text-white">
                  <Maximize2 size={12} aria-hidden /> Tap to enlarge
                </span>
              </button>
            )}
            {qrOpen && method.qr_path && typeof document !== 'undefined' && createPortal(
              <div role="dialog" aria-modal="true" aria-label="QR code" onClick={() => setQrOpen(false)} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4">
                <button type="button" onClick={() => setQrOpen(false)} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  <X size={22} />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getMediaUrl(method.qr_path)} alt={`${method.name} QR code`} className="max-h-[85dvh] max-w-full rounded-xl bg-white object-contain" />
              </div>,
              document.body,
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Account name</p>
              <p className="text-base text-ink">{method.account_name}</p>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">GCash number</p>
                <p className="text-lg font-mono font-semibold text-ink break-all">{method.account_number}</p>
              </div>
              <button type="button" onClick={copy} className="h-11 px-3 border border-line-strong bg-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-sunken"><Copy size={14} /> {copied ? 'Copied' : 'Copy'}</button>
            </div>
            {method.instructions && <p className="text-sm text-ink-body whitespace-pre-wrap">{method.instructions}</p>}
          </div>

          <div>
            <label htmlFor="pay-amt" className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">Amount you paid</label>
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-ink-muted">₱</span>
              <input id="pay-amt" type="number" inputMode="decimal" min="1" max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" aria-describedby="pay-amt-left" className="w-full pl-8 pr-3.5 py-3 bg-surface border border-line text-ink text-base focus:outline-none focus:border-taupe" />
            </div>
            <p id="pay-amt-left" className="text-xs text-ink-muted mt-1.5">₱{outstanding.toLocaleString()} left to pay</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {chips.map((c) => <button key={c.label} type="button" onClick={() => setAmount(String(c.v))} className="h-11 px-3 border border-line-strong bg-white text-xs font-semibold cursor-pointer hover:bg-sunken">{c.label} · ₱{c.v.toLocaleString()}</button>)}
            </div>
            {value > outstanding + 0.005 && <p className="text-xs text-danger mt-1.5">That is more than what is left (₱{outstanding.toLocaleString()}).</p>}
          </div>

          <div>
            <label htmlFor="pay-ref" className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">Reference number <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
            <input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-3.5 py-3 bg-surface border border-line text-ink text-base focus:outline-none focus:border-taupe font-mono" />
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-ink mb-2">Screenshot of your payment <span className="text-red-600">*</span></span>
            {proof ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getMediaUrl(proof)} alt="Payment proof" className="w-16 h-16 object-cover border border-line" />
                <button type="button" onClick={() => setProof('')} className="text-xs font-semibold text-danger cursor-pointer">Remove</button>
              </div>
            ) : (
              <label className="h-12 border border-dashed border-line-strong bg-canvas flex items-center justify-center gap-2 text-sm text-ink-muted cursor-pointer hover:bg-sunken">
                {uploading ? <Loader2 size={16} className="animate-spin text-taupe" /> : <Upload size={16} />} {uploading ? 'Uploading…' : 'Attach screenshot'}
                <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const u = await onUpload(f); if (u) setProof(u); } }} />
              </label>
            )}
          </div>
        </div>
      )}
    </HomeSheet>
  );
}
