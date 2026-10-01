'use client';

import React, { useState } from 'react';
import { Pencil, Plus, QrCode, Trash2 } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import PaymentMethodForm from './PaymentMethodForm';
import { KIND_LABELS, emptyMethodForm, usePaymentMethods, type MethodForm } from './usePaymentMethods';
import type { PaymentAccount } from './usePayments';

// Where customers can pay this shop. They pay outside SUTURA (GCash, Maya, bank…), upload proof, and the shop verifies it.
export default function PaymentMethodsTab() {
  const { methods, loading, saving, save, remove, toggle, storeId } = usePaymentMethods();
  const { branches } = useBranch();
  const { user } = useAuthStore();
  const isOwner = Boolean(user?.roles?.some((r) => r.name === 'store_owner'));
  const [form, setForm] = useState<MethodForm | null>(null);
  const [editingId, setEditingId] = useState<number | undefined>();

  const open = (m?: PaymentAccount) => {
    setEditingId(m?.id);
    setForm(m ? { kind: m.kind, name: m.name, account_name: m.account_name, account_number: m.account_number, qr_path: m.qr_path ?? '', instructions: m.instructions ?? '', is_active: m.is_active, store_branch_id: m.store_branch_id ? String(m.store_branch_id) : '' } : emptyMethodForm());
  };
  const close = () => { setForm(null); setEditingId(undefined); };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-muted max-w-xl">The accounts customers see when they pay. SUTURA never handles the money — they pay you directly and send proof for you to verify.</p>
        {!form && <button type="button" onClick={() => open()} className="h-11 px-4 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"><Plus size={16} /> Add</button>}
      </div>

      {form && (
        <PaymentMethodForm
          value={form}
          onChange={setForm}
          onCancel={close}
          onSave={async () => { if (await save(form, editingId)) close(); }}
          saving={saving}
          storeId={storeId}
          branches={(branches ?? []).map((b: { id: number; name: string }) => ({ id: b.id, name: b.name }))}
          canPickScope={isOwner}
          editing={editingId !== undefined}
        />
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-ink-faint animate-pulse">Loading…</p>
      ) : methods.length === 0 && !form ? (
        <div className="bg-surface border border-line p-10 text-center">
          <p className="text-sm font-medium text-ink">No payment methods yet</p>
          <p className="text-xs text-ink-muted mt-1">Add your GCash, Maya or bank account so customers know where to pay.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <li key={m.id} className={`bg-white border p-4 flex gap-4 ${m.is_active ? 'border-line' : 'border-line opacity-60'}`}>
              <div className="w-16 h-16 border border-line bg-sunken flex items-center justify-center shrink-0 text-ink-faint">{m.qr_path ? <QrCode size={26} className="text-taupe" /> : <span className="text-[10px] font-bold uppercase">{KIND_LABELS[m.kind]?.slice(0, 4)}</span>}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink truncate">{m.name} <span className="text-[11px] font-medium text-ink-muted">· {KIND_LABELS[m.kind] ?? m.kind}</span></p>
                <p className="text-sm text-ink-body truncate">{m.account_name}</p>
                <p className="text-sm font-mono text-ink truncate">{m.account_number}</p>
                <p className="text-[11px] text-ink-faint mt-1">{m.branch ? `${m.branch.name} only` : 'Entire shop'}{m.is_active ? '' : ' · Inactive'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button type="button" onClick={() => open(m)} className="h-11 px-3 border border-line-strong text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer hover:bg-sunken"><Pencil size={13} /> Edit</button>
                  <button type="button" onClick={() => toggle(m)} className="h-11 px-3 border border-line-strong text-xs font-semibold text-ink cursor-pointer hover:bg-sunken">{m.is_active ? 'Pause' : 'Activate'}</button>
                  <button type="button" onClick={() => { if (window.confirm(`Remove ${m.name}? Past payments keep their record.`)) remove(m.id); }} aria-label={`Remove ${m.name}`} className="h-11 w-11 border border-line-strong text-danger flex items-center justify-center cursor-pointer hover:bg-danger/5"><Trash2 size={15} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
