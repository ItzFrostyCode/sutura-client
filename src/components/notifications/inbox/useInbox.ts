'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import type { AppNotification } from './inboxTypes';

/** Fired with the new unread count whenever the notification list changes it. */
export const UNREAD_CHANGED_EVENT = 'sutura:unread_changed';

/** The customer's notifications: load, open one (marks it read), mark all read, and clear the ones already read. */
export function useInbox(enabled: boolean) {
  const router = useRouter();
  const [list, setList] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    api.get('/notifications')
      .then((res) => {
        const raw = res.data.data;
        setList(Array.isArray(raw) ? raw : raw?.data ?? []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [enabled]);

  const unreadCount = useMemo(() => list.filter((n) => !n.read_at).length, [list]);

  // Keep the bell's red count in step with what was just read here.
  useEffect(() => {
    if (!loading) window.dispatchEvent(new CustomEvent(UNREAD_CHANGED_EVENT, { detail: unreadCount }));
  }, [unreadCount, loading]);
  const readCount = list.length - unreadCount;

  const open = useCallback((n: AppNotification) => {
    if (!n.read_at) {
      setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      void api.post(`/notifications/${n.id}/read`).catch(() => {});
    }
    if (n.data?.action_url) router.push(n.data.action_url);
  }, [router]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setList((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: now })));
    void api.post('/notifications/read-all').catch(() => {});
  }, []);

  const clearRead = useCallback(() => {
    const ids = list.filter((n) => n.read_at).map((n) => n.id);
    if (ids.length === 0) return;
    setList((prev) => prev.filter((n) => !n.read_at));
    void api.post('/notifications/bulk-delete', { ids }).catch(() => {});
  }, [list]);

  return { list, loading, unreadCount, readCount, open, markAllRead, clearRead };
}
