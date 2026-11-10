'use client';

import { useEffect, useState } from 'react';
import type { OperatingHours } from './storeStatus';

/**
 * One thing the person searched or opened on this device: words they typed / a suggestion they tapped ('search'), or a
 * shop, service or design they tapped in the results. A shop also keeps its place and hours (shown like Google Maps).
 */
export interface RecentSearch {
  /** The words, or the shop / service / design name. */
  readonly term: string;
  /** When it was last searched or opened (ms). */
  readonly at: number;
  readonly kind?: 'search' | 'shop' | 'service' | 'design';
  /** Shop: its slug (opens it on the map). */
  readonly slug?: string;
  /** Service / design: its page. */
  readonly href?: string;
  /** Shop: where it is. */
  readonly address?: string;
  /** Shop: its hours, so Open / Closes … is worked out when the list is shown. */
  readonly hours?: OperatingHours | string | null;
}

const KEY = 'sutura_recent_searches';
const CHANGED = 'sutura:recent_searches';
/** Older entries beyond this are dropped. */
const MAX = 100;

/** What makes two entries the same (searching the same words, or opening the same shop, again). */
export function recentKey(r: Pick<RecentSearch, 'term' | 'kind' | 'slug' | 'href'>): string {
  return `${r.kind ?? 'search'}:${(r.slug ?? r.href ?? r.term).toLowerCase()}`;
}

function read(): RecentSearch[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown;
    return Array.isArray(raw) ? raw.filter((r): r is RecentSearch => typeof r?.term === 'string' && typeof r?.at === 'number') : [];
  } catch {
    return [];
  }
}

function write(list: RecentSearch[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* storage off: nothing is remembered */ }
  window.dispatchEvent(new Event(CHANGED));
}

/** Remembers a shop / service / design that was opened, or searched words (newest first; again = back to the top). */
export function addRecentItem(item: Omit<RecentSearch, 'at'>) {
  const term = item.term.trim();
  if (!term) return;
  const entry: RecentSearch = { ...item, term, at: Date.now() };
  const key = recentKey(entry);
  write([entry, ...read().filter((r) => recentKey(r) !== key)]);
}

/** Remembers searched words (typed and entered, or a suggestion tapped). */
export function addRecentSearch(term: string) {
  addRecentItem({ term, kind: 'search' });
}

/** Deletes these entries for good (by recentKey). */
export function removeRecentSearches(keys: readonly string[]) {
  const gone = new Set(keys);
  write(read().filter((r) => !gone.has(recentKey(r))));
}

/** The remembered entries, newest first, kept up to date when they change (also in another tab). */
export function useRecentSearches(): RecentSearch[] {
  const [list, setList] = useState<RecentSearch[]>([]);
  useEffect(() => {
    const load = () => setList(read());
    load();
    window.addEventListener(CHANGED, load);
    window.addEventListener('storage', load);
    return () => { window.removeEventListener(CHANGED, load); window.removeEventListener('storage', load); };
  }, []);
  return list;
}

export type RecentGroupLabel = 'Today' | 'This week' | 'Last week' | 'Previous searches';

/** Today / This week (since Monday) / Last week / Previous searches — empty groups are left out. */
export function groupRecentSearches(list: readonly RecentSearch[], now = new Date()): { label: RecentGroupLabel; items: RecentSearch[] }[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = today - ((now.getDay() + 6) % 7) * 86_400_000; // Monday
  const lastWeekStart = weekStart - 7 * 86_400_000;
  const groups: { label: RecentGroupLabel; items: RecentSearch[] }[] = [
    { label: 'Today', items: [] },
    { label: 'This week', items: [] },
    { label: 'Last week', items: [] },
    { label: 'Previous searches', items: [] },
  ];
  for (const r of list) {
    const i = r.at >= today ? 0 : r.at >= weekStart ? 1 : r.at >= lastWeekStart ? 2 : 3;
    groups[i].items.push(r);
  }
  return groups.filter((g) => g.items.length > 0);
}
