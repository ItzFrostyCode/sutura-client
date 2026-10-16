import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

export interface CustomerText {
  id: number;
  event_label: string;
  status: 'draft' | 'approved' | 'sent' | 'failed' | 'blocked' | 'cancelled';
  body: string;
  to_number: string | null;
  blocked_reason: string | null;
  error: string | null;
  is_test: boolean | null;
  created_at: string;
  sent_at: string | null;
}

interface TextsData {
  sms_mode: 'off' | 'review' | 'auto';
  plan_allows: boolean;
  has_number: boolean;
  opted_out: boolean;
  messages: CustomerText[];
}

/** One customer's texts: what was sent, what waits for the shop to check, and writing a new one. */
export function useCustomerTexts(storeId: number | undefined, customerId: number | undefined, enabled: boolean) {
  const toast = useToast();
  const [data, setData] = useState<TextsData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState<number | 'new' | null>(null);
  const base = storeId && customerId ? `/stores/${storeId}/customers/${customerId}/sms` : null;

  const load = useCallback(() => {
    if (!base || !enabled) return;
    api.get(base).then((res) => setData(res.data.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [base, enabled]);

  useEffect(() => { load(); }, [load]);

  /** Writes the text into the shop's outbox (it waits there to be checked, unless the shop sends automatically). */
  const write = async (body: string): Promise<boolean> => {
    if (!base) return false;
    setBusy('new');
    try {
      await api.post(base, { body });
      toast.success(data?.sms_mode === 'auto' ? 'Text sent.' : 'Text is ready — check it, then send.');
      load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not prepare the text.'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const send = async (id: number) => {
    if (!storeId) return;
    setBusy(id);
    try {
      await api.post(`/stores/${storeId}/sms/${id}/approve`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not send the text.'));
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (id: number) => {
    if (!storeId) return;
    setBusy(id);
    try {
      await api.post(`/stores/${storeId}/sms/${id}/cancel`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel the text.'));
    } finally {
      setBusy(null);
    }
  };

  return { data, loading, busy, write, send, cancel };
}
