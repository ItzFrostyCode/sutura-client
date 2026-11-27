'use client';

import React, { useState } from 'react';
import { Pencil, Plus, QrCode, Smartphone, Trash2 } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import PaymentMethodForm from './PaymentMethodForm';
import { KIND_LABELS, emptyMethodForm, usePaymentMethods, type MethodForm } from './usePaymentMethods';
import type { PaymentAccount } from './usePayments';

// Where customers can pay this shop. They pay outside SUTURA (GCash, Maya, bank…), upload proof, and the shop verifies it.
export default function PaymentMethodsTab() {
  const { methods, loading, saving, save, remove, toggle, storeId } = usePaymentMethods();
  const { branches, selectedBranchId } = useBranch();
  const { user } = useAuthStore();
  const isOwner = Boolean(user?.roles?.some((r) => r.name === 'store_owner'));
  const [form, setForm] = useState<MethodForm | null>(null);
  const [editingId, setEditingId] = useState<number | undefined>();

  const open = (m?: PaymentAccount) => {
    setEditingId(m?.id);
    setForm(m ? { kind: m.kind, name: m.name, account_name: m.account_name, account_number: m.account_number, qr_path: m.qr_path ?? '', instructions: m.instructions ?? '', is_active: m.is_active, store_branch_id: m.store_branch_id ? String(m.store_branch_id) : '' } : emptyMethodForm());
  };
  const close = () => { setForm(null); setEditingId(undefined); };

  // Removing only ever affects the branch you remove it from:
  // - a branch-only method belongs to that one branch;
  // - an "Entire shop" method viewed under one branch is taken off that branch, the others keep it;
  // - under "All Branches" an "Entire shop" method needs a branch picked first (unless the shop has one branch).
  const askRemove = (m: PaymentAccount) => {
    const multiBranch = (branches ?? []).length > 1;
    if (m.store_branch_id || !multiBranch) {
      if (window.confirm(`Remove ${m.name}${m.branch ? ` from ${m.branch.name}` : ''}? Past payments keep their record.`)) remove(m.id);
      return;
    }
    const branch = (branches ?? []).find((b: { id: number }) => b.id === selectedBranchId) as { id: number; name: string } | undefined;
    if (!branch) {
      window.alert(`${m.name} is used by every branch. Pick the branch to remove it from in the branch switcher at the top, then remove it again. The other branches will keep it.`);
      return;
    }
    if (window.confirm(`Remove ${m.name} from ${branch.name}? The other branches keep it. Past payments keep their record.`)) remove(m.id, branch.id);
  };

  return (
    // Own padding: the Payments page puts every tab inside one card with none.
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        {/* No width cap: the explanation reads on one line beside "Add" (it wraps only when the screen is too narrow). */}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ink">Payment methods</h2>
          <p className="mt-0.5 text-sm text-ink-muted">The accounts customers see when they pay. SUTURA never handles the money: they pay you directly and send proof for you to check.</p>
        </div>
        {!form && <button type="button" onClick={() => open()} className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-black"><Plus size={16} /> Add</button>}
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
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-canvas px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-taupe shadow-sm"><Smartphone size={22} aria-hidden /></span>
          <p className="mt-3 text-sm font-semibold text-ink">No payment methods yet</p>
          <p className="mt-1 text-xs text-ink-muted">Add your GCash account so customers know where to pay.</p>
          <button type="button" onClick={() => open()} className="mt-4 flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-black"><Plus size={16} /> Add GCash</button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <li key={m.id} className={`flex gap-4 rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(45,42,38,0.04)] ${m.is_active ? '' : 'opacity-60'}`}>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-line bg-sunken text-ink-faint">{m.qr_path ? <QrCode size={26} className="text-taupe" /> : <span className="text-[10px] font-bold uppercase">{KIND_LABELS[m.kind]?.slice(0, 4)}</span>}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink truncate">{m.name} <span className="text-[11px] font-medium text-ink-muted">· {KIND_LABELS[m.kind] ?? m.kind}</span></p>
                <p className="text-sm text-ink-body truncate">{m.account_name}</p>
                <p className="text-sm font-mono text-ink truncate">{m.account_number}</p>
                <p className="text-[11px] text-ink-faint mt-1">{m.branch ? `${m.branch.name} only` : 'Entire shop'}{m.is_active ? '' : ' · Inactive'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button type="button" onClick={() => open(m)} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs font-semibold text-ink hover:bg-sunken"><Pencil size={13} /> Edit</button>
                  <button type="button" onClick={() => toggle(m)} className="h-9 cursor-pointer rounded-full border border-line-strong px-3 text-xs font-semibold text-ink hover:bg-sunken">{m.is_active ? 'Pause' : 'Activate'}</button>
                  <button type="button" onClick={() => askRemove(m)} aria-label={`Remove ${m.name}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line-strong text-danger hover:bg-danger/5"><Trash2 size={15} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
