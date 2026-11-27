'use client';

import { useEffect, useRef } from 'react';

/**
 * Live updates without a page refresh (no WebSocket server needed).
 *
 * The notification bell polls the server; when a new notification arrives it
 * calls announceLiveUpdate() with the kinds of records it's about. Every page
 * that shows those records listens with useLiveRefresh() and quietly reloads
 * its data in the background: no skeleton, no lost scroll, and nothing the
 * person is typing is touched (forms keep their own state).
 *
 * As a fallback for changes that don't notify this person, each listener also
 * re-checks on a slow interval while the tab is visible, and right away when
 * the person comes back to the tab.
 */
export type LiveTopic =
  | 'notifications'
  | 'jobs'
  | 'appointments'
  | 'payments'
  | 'orders'
  | 'customers'
  | 'store'
  | 'billing'
  | 'support';

const EVENT = 'sutura:live-update';

/** Which records a notification type is about. */
export function topicsForNotificationType(type: string): LiveTopic[] {
  const t = type || '';
  if (t.startsWith('payment_') || t.includes('_payment_') || t === 'customer_payment_rejected') return ['payments', 'jobs', 'orders'];
  if (t.startsWith('job_') || t === 'new_job_order' || t === 'order_ready' || t.startsWith('claim_')) return ['jobs', 'orders', 'payments', 'customers'];
  if (t.startsWith('appointment_')) return ['appointments', 'customers'];
  if (t.includes('catalog_order')) return ['orders', 'payments'];
  if (t.startsWith('plan_') || t.startsWith('subscription_')) return ['billing', 'store'];
  if (t.startsWith('store_') || t.startsWith('branch_') || t.startsWith('apparel_type_') || t.startsWith('listing_')) return ['store'];
  if (t.startsWith('support_')) return ['support'];
  return [];
}

/** Tell every listener on this page that these kinds of records changed. */
export function announceLiveUpdate(topics: LiveTopic[]): void {
  if (typeof window === 'undefined' || topics.length === 0) return;
  window.dispatchEvent(new CustomEvent<LiveTopic[]>(EVENT, { detail: [...new Set(topics)] }));
}

interface LiveRefreshOptions {
  /** Background re-check while the tab is visible; 0 turns it off. Default 30s. */
  readonly intervalMs?: number;
  /** Pause everything (e.g. before the store is known). */
  readonly enabled?: boolean;
}

/**
 * Runs `refresh` (which should reload WITHOUT a loading state) when a matching
 * live update is announced, when the tab becomes visible again, and on a slow
 * interval while visible. Bursts are merged into one reload.
 */
export function useLiveRefresh(topics: LiveTopic[], refresh: () => void, { intervalMs = 30_000, enabled = true }: LiveRefreshOptions = {}): void {
  // Latest callback without re-subscribing every render.
  const refreshRef = useRef(refresh);
  useEffect(() => { refreshRef.current = refresh; });

  const topicKey = topics.join(',');

  useEffect(() => {
    if (!enabled) return;
    const wanted = new Set(topicKey.split(',').filter(Boolean));
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let lastRun = Date.now();

    const run = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        lastRun = Date.now();
        refreshRef.current();
      }, 400);
    };

    const onAnnounce = (e: Event) => {
      const changed = (e as CustomEvent<LiveTopic[]>).detail ?? [];
      if (changed.some(t => wanted.has(t))) run();
    };
    // Coming back to the tab: catch up if it's been a while.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRun > 5_000) run();
    };

    window.addEventListener(EVENT, onAnnounce);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    const timer = intervalMs > 0
      ? setInterval(() => { if (document.visibilityState === 'visible') run(); }, intervalMs)
      : null;

    return () => {
      window.removeEventListener(EVENT, onAnnounce);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      if (timer) clearInterval(timer);
      if (debounce) clearTimeout(debounce);
    };
  }, [topicKey, intervalMs, enabled]);
}
