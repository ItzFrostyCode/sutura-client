'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  // `loading` is only the very first load (spinner). Later loads (next page, a
  // filter) keep the current rows on screen until the new ones arrive, so the
  // page never collapses to a spinner and jumps back to the top. `refreshing`
  // says a later load is in flight.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);
  const [error, setError] = useState('');
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
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
      loadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [path, key]);

  useEffect(() => { load(); }, [load]);

  return { items, setItems, meta, raw, loading, refreshing, error, reload: load };
}

/**
 * Keeps a paged list as tall as its tallest page so far, so a shorter last
 * page doesn't shrink the screen and throw the reader back to the top when
 * they press Next. Resets when `resetKey` (tab / filter / search) changes.
 * Put the returned ref and style on the list's wrapper.
 */
export function useStableListHeight<E extends HTMLElement>(resetKey: string) {
  const ref = useRef<E>(null);
  const [minHeight, setMinHeight] = useState(0);
  useEffect(() => { setMinHeight(0); }, [resetKey]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setMinHeight((prev) => Math.max(prev, el.offsetHeight));
    });
    observer.observe(el);
    return () => observer.disconnect();
  });
  return { ref, style: minHeight ? { minHeight } : undefined };
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
