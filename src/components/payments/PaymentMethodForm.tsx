'use client';

import React, { useState } from 'react';
import { Loader2, QrCode } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { getErrorMessage } from '@/lib/apiError';
import { FIELD, LABEL } from '@/components/catalog/editable/editors/fieldStyles';
import { KIND_LABELS, type MethodForm } from './usePaymentMethods';

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

  return (
    <div className="bg-white border border-line p-4 sm:p-5 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-ink">{editing ? 'Edit payment method' : 'Add payment method'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pm-kind" className={LABEL}>Type</label>
          <select id="pm-kind" value={value.kind} onChange={(e) => set({ kind: e.target.value, name: value.name === KIND_LABELS[value.kind] || !value.name ? KIND_LABELS[e.target.value] : value.name })} className={FIELD}>
            {Object.entries(KIND_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pm-name" className={LABEL}>Name customers see <span className="text-red-600">*</span></label>
          <input id="pm-name" value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. GCash, BPI" className={FIELD} />
        </div>
        <div>
          <label htmlFor="pm-acct" className={LABEL}>Account name <span className="text-red-600">*</span></label>
          <input id="pm-acct" value={value.account_name} onChange={(e) => set({ account_name: e.target.value })} className={FIELD} />
        </div>
        <div>
          <label htmlFor="pm-num" className={LABEL}>Account / mobile number <span className="text-red-600">*</span></label>
          <input id="pm-num" value={value.account_number} onChange={(e) => set({ account_number: e.target.value })} inputMode="numeric" className={FIELD} />
        </div>
        {canPickScope && branches.length > 1 && (
          <div className="sm:col-span-2">
            <label htmlFor="pm-scope" className={LABEL}>Available at</label>
            <select id="pm-scope" value={value.store_branch_id} onChange={(e) => set({ store_branch_id: e.target.value })} className={FIELD}>
              <option value="">Entire shop</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name} only</option>)}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="pm-ins" className={LABEL}>Instructions <span className="normal-case font-normal text-ink-faint">(optional)</span></label>
          <textarea id="pm-ins" rows={2} value={value.instructions} onChange={(e) => set({ instructions: e.target.value })} placeholder="e.g. Send the exact amount and use the order number as the message." className={FIELD} />
        </div>
        <div className="sm:col-span-2">
          <span className={LABEL}>QR code <span className="normal-case font-normal text-ink-faint">(optional)</span></span>
          <div className="flex items-center gap-3">
            {value.qr_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getMediaUrl(value.qr_path)} alt="QR code" className="w-24 h-24 object-contain border border-line bg-white" />
            ) : (
              <div className="w-24 h-24 border border-dashed border-line-strong bg-canvas flex items-center justify-center text-ink-faint"><QrCode size={28} /></div>
            )}
            <div className="flex flex-col gap-2">
              <label className="h-11 px-4 border border-line-strong bg-white text-sm font-medium text-ink flex items-center gap-2 cursor-pointer hover:bg-sunken">
                {uploading && <Loader2 size={14} className="animate-spin" />} {value.qr_path ? 'Replace' : 'Upload QR'}
                <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {value.qr_path && <button type="button" onClick={() => set({ qr_path: '' })} className="text-xs font-semibold text-danger text-left cursor-pointer">Remove</button>}
            </div>
          </div>
          {err && <p className="text-xs text-danger mt-1.5">{err}</p>}
        </div>
      </div>
      <label className="flex items-center gap-3 min-h-11 cursor-pointer">
        <input type="checkbox" checked={value.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="w-4 h-4 accent-[#6B5346]" />
        <span className="text-sm text-ink">Active — customers can pay with this</span>
      </label>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-line">
        <button type="button" onClick={onCancel} disabled={saving} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer">Cancel</button>
        <button type="button" onClick={onSave} disabled={!valid || saving} className="h-11 px-5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
          {saving && <Loader2 size={16} className="animate-spin" />} Save
        </button>
      </div>
    </div>
  );
}
