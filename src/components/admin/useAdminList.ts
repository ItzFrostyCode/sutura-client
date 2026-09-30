'use client';

import { useCallback, useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';

export interface PageMeta {
  current_page: number;
  last_page: number;
  total: number;
}

/**
 * Fetches one admin list endpoint and refetches whenever `params` change.
 * Pass a memo-stable params object (or a primitive-only literal built in the
 * page) — the key is its JSON so identical filters don't refetch.
 * `raw` exposes the whole response for endpoints that return extra fields
 * (e.g. applications' per-status `counts`).
 */
export function useAdminList<T>(path: string, params: Record<string, string | number | undefined>) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [raw, setRaw] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const clean = Object.fromEntries(Object.entries(JSON.parse(key)).filter(([, v]) => v !== '' && v !== undefined));
      const res = await adminApi.get(path, { params: clean });
      setItems(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
      setRaw(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load this list.'));
    } finally {
      setLoading(false);
    }
  }, [path, key]);

  useEffect(() => { load(); }, [load]);

  return { items, setItems, meta, raw, loading, error, reload: load };
}

/** Typing in a search box shouldn't fire a request per keystroke. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const DATE_ONLY: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
const DATE_TIME: Intl.DateTimeFormatOptions = { ...DATE_ONLY, hour: 'numeric', minute: '2-digit' };

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', withTime ? DATE_TIME : DATE_ONLY);
}
