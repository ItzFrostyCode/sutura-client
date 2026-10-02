import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import type { SmsMessage, SmsMode, SmsOutbox, SmsTab } from './smsHelpers';

export function useSmsOutbox() {
  const { store } = useAuthStore();
  const toast = useToast();
  const [tab, setTab] = useState<SmsTab>('draft');
  const [data, setData] = useState<SmsOutbox | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | 'all' | null>(null);

  const load = useCallback(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/sms`, { params: { status: tab } })
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Could not load the text messages.'))
      .finally(() => setLoading(false));
  }, [store?.id, tab, toast]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const run = async (id: number | 'all', fn: () => Promise<void>, ok?: string) => {
    setBusyId(id);
    try { await fn(); if (ok) toast.success(ok); load(); } catch (err) { toast.error(getErrorMessage(err, 'That did not work.')); } finally { setBusyId(null); }
  };

  const base = `/stores/${store?.id}/sms`;
  return {
    tab, setTab, data, loading, busyId,
    save: (m: SmsMessage, patch: { body?: string; number?: string; update_customer_number?: boolean }) => run(m.id, async () => { await api.put(`${base}/${m.id}`, patch); }, 'Saved.'),
    approve: (m: SmsMessage) => run(m.id, async () => { await api.post(`${base}/${m.id}/approve`); }, data?.test_mode ? 'Marked as sent (test mode — nothing was delivered).' : 'Sent.'),
    cancel: (m: SmsMessage) => run(m.id, async () => { await api.post(`${base}/${m.id}/cancel`); }, 'Cancelled.'),
    approveAll: () => run('all', async () => { await api.post(`${base}/approve-all`); }, 'Done.'),
    setMode: (mode: SmsMode) => run('all', async () => { await api.put(`${base}/settings`, { sms_mode: mode }); }),
    setEvents: (keys: string[]) => run('all', async () => { await api.put(`${base}/settings`, { sms_events: keys }); }),
  };
}
