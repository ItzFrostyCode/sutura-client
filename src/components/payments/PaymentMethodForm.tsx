'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Maximize2, QrCode, RefreshCw, Trash2, X } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { getErrorMessage } from '@/lib/apiError';
// Apple-style fields for this form: rounded, quiet border, sentence-case labels.
const FIELD = 'w-full min-h-11 rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] focus:border-ink/50 focus:ring-4 focus:ring-ink/[0.07] sm:text-sm';
const LABEL = 'mb-1.5 block text-[13px] font-medium text-ink-body';
import type { MethodForm } from './usePaymentMethods';

interface PaymentMethodFormProps {
  readonly value: MethodForm;
  readonly onChange: (v: MethodForm) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly saving: boolean;
  readonly storeId: number;
  readonly branches: { id: number; name: string }[];
  readonly canPickScope: boolean;
  readonly editing: boolean;
}

export default function PaymentMethodForm({ value, onChange, onSave, onCancel, saving, storeId, branches, canPickScope, editing }: Readonly<PaymentMethodFormProps>) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  useEffect(() => {
    if (!qrOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setQrOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qrOpen]);
  const set = (p: Partial<MethodForm>) => onChange({ ...value, ...p });
  const valid = value.name.trim() && value.account_name.trim() && value.account_number.trim();

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/stores/${storeId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set({ qr_path: res.data?.data?.url || res.data?.url || '' });
    } catch (e) {
      setErr(getErrorMessage(e, 'Could not upload the QR code.'));
    } finally {
      setUploading(false);
    }
  };

  // The QR's file input, shared by the empty box (tap to upload) and the Replace button.
  const qrInput = (
    <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
  );

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-canvas/60 p-4 sm:p-5">
      <h3 className="text-base font-semibold text-ink">{editing ? 'Edit payment method' : 'Add payment method'}</h3>

      {/* Compact two columns from 640px: left = the payment method's name (what customers see, e.g. GCash), then the QR under it;
          right = account name and number, then instructions. One column on a phone. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="pm-name" className={LABEL}>Payment method <span className="text-red-600">*</span></label>
            <input id="pm-name" value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. GCash" className={FIELD} />
          </div>

          <div>
            <span className={LABEL}>QR code <span className="font-normal text-ink-faint">(optional)</span></span>
            {value.qr_path ? (
              <div className="space-y-2">
                <button type="button" onClick={() => setQrOpen(true)} aria-label="View the QR code bigger" className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getMediaUrl(value.qr_path)} alt="QR code" className="aspect-square w-full object-contain p-2" />
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink/75 px-2 py-1 text-[11px] font-semibold text-white"><Maximize2 size={11} aria-hidden /> View</span>
                </button>
                <div className="flex gap-2">
                  {/* relative + overflow-hidden keep the visually hidden input inside this button: without them it is
                      positioned against a far-away ancestor, and focusing it scrolls the whole dashboard frame. */}
                  <label className="relative flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-full border border-line-strong bg-white text-xs font-semibold text-ink hover:bg-sunken focus-within:ring-2 focus-within:ring-taupe/40">
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} aria-hidden />} Replace
                    {qrInput}
                  </label>
                  <button type="button" onClick={() => set({ qr_path: '' })} className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-line-strong bg-white text-xs font-semibold text-danger hover:bg-danger/5">
                    <Trash2 size={13} aria-hidden /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface text-ink-faint transition-colors hover:border-ink/40 hover:text-ink focus-within:ring-2 focus-within:ring-taupe/40">
                {uploading ? <Loader2 size={24} className="animate-spin" /> : <QrCode size={28} aria-hidden />}
                <span className="text-xs font-semibold">{uploading ? 'Uploading…' : 'Upload QR'}</span>
                {qrInput}
              </label>
            )}
            {err && <p className="mt-1.5 text-xs text-danger">{err}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="pm-acct" className={LABEL}>Account name <span className="text-red-600">*</span></label>
            <input id="pm-acct" value={value.account_name} onChange={(e) => set({ account_name: e.target.value })} className={FIELD} />
          </div>
          <div>
            <label htmlFor="pm-num" className={LABEL}>Account / mobile number <span className="text-red-600">*</span></label>
            <input id="pm-num" value={value.account_number} onChange={(e) => set({ account_number: e.target.value })} inputMode="numeric" className={FIELD} />
          </div>
          {canPickScope && branches.length > 1 && (
            <div>
              <label htmlFor="pm-scope" className={LABEL}>Available at</label>
              <select id="pm-scope" value={value.store_branch_id} onChange={(e) => set({ store_branch_id: e.target.value })} className={FIELD}>
                <option value="">Entire shop</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name} only</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="pm-ins" className={LABEL}>Instructions <span className="font-normal text-ink-faint">(optional)</span></label>
            <textarea id="pm-ins" rows={3} value={value.instructions} onChange={(e) => set({ instructions: e.target.value })} placeholder="e.g. Send the exact amount and use the order number as the message." className={FIELD} />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" checked={value.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="h-4 w-4 accent-[#6B5346]" />
            <span className="text-sm text-ink">Active: customers can pay with this</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={saving} className="h-10 cursor-pointer rounded-full border border-line-strong bg-white px-5 text-sm font-medium text-ink hover:bg-sunken">Cancel</button>
        <button type="button" onClick={onSave} disabled={!valid || saving} className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
          {saving && <Loader2 size={16} className="animate-spin" />} Save
        </button>
      </div>

      {qrOpen && value.qr_path && typeof document !== 'undefined' && createPortal(
        <div role="dialog" aria-modal="true" aria-label="QR code" onClick={() => setQrOpen(false)} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4">
          <button type="button" onClick={() => setQrOpen(false)} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"><X size={22} /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getMediaUrl(value.qr_path)} alt="QR code" className="max-h-[85dvh] max-w-full rounded-xl bg-white object-contain" />
        </div>,
        document.body,
      )}
    </div>
  );
}
