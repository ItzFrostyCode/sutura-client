import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import type { PaymentAccount } from './usePayments';

export const KIND_LABELS: Record<string, string> = { gcash: 'GCash', maya: 'Maya', bank_transfer: 'Bank transfer', other: 'Other' };

export interface MethodForm {
  kind: string; name: string; account_name: string; account_number: string;
  qr_path: string; instructions: string; is_active: boolean; store_branch_id: string;
}
export const emptyMethodForm = (): MethodForm => ({ kind: 'gcash', name: 'GCash', account_name: '', account_number: '', qr_path: '', instructions: '', is_active: true, store_branch_id: '' });

// The shop's list of places customers can pay. SUTURA never moves money — customers pay outside and send proof.
export function usePaymentMethods() {
  const { store } = useAuthStore();
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/payment-methods`)
      .then((r) => setMethods(r.data?.data ?? []))
      .catch(() => setMethods([]))
      .finally(() => setLoading(false));
  }, [store?.id]);

  useEffect(() => { load(); }, [load]);

  // GCash is the only account customers pay to online (cash is paid at the shop, no account needed).
  const payload = (f: MethodForm) => ({ ...f, kind: 'gcash', qr_path: f.qr_path || null, instructions: f.instructions || null, store_branch_id: f.store_branch_id ? Number(f.store_branch_id) : null });

  const save = async (f: MethodForm, id?: number): Promise<boolean> => {
    if (!store?.id) return false;
    setSaving(true);
    try {
      if (id) await api.put(`/stores/${store.id}/payment-methods/${id}`, payload(f));
      else await api.post(`/stores/${store.id}/payment-methods`, payload(f));
      toast.success(id ? 'Payment method updated.' : 'Payment method added.');
      load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this payment method.'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** With a branch: an "Entire shop" method is removed from that branch only (the others keep it). */
  const remove = async (id: number, fromBranchId?: number | null) => {
    if (!store?.id) return;
    try {
      await api.delete(`/stores/${store.id}/payment-methods/${id}`, { params: fromBranchId ? { branch_id: fromBranchId } : {} });
      toast.success(fromBranchId ? 'Payment method removed from this branch.' : 'Payment method removed.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove this payment method.'));
    }
  };

  const toggle = (m: PaymentAccount) => save({
    kind: m.kind, name: m.name, account_name: m.account_name, account_number: m.account_number,
    qr_path: m.qr_path ?? '', instructions: m.instructions ?? '', is_active: !m.is_active, store_branch_id: m.store_branch_id ? String(m.store_branch_id) : '',
  }, m.id);

  return { methods, loading, saving, save, remove, toggle, storeId: store?.id ?? 0 };
}
