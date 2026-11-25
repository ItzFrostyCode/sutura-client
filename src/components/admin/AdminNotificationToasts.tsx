'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { type AdminNotificationItem, useAdminNotificationStore } from '@/store/useAdminNotificationStore';
import { relativeTime } from '@/lib/notificationHelpers';
import { AdminCategoryIcon, adminCategoryBg, adminSeverityBadge } from './adminNotificationStyle';

const VISIBLE_MS = 5000;
const EXIT_MS = 280;
const MAX_TOASTS = 4;

/**
 * New admin alerts as cards under the header's bell (top right), mounted
 * once by AdminShell. The first load only records what's already there;
 * anything unread that shows up after that gets a card, newest on top,
 * stacking downward. Same motion and timing as the shop's NotificationToasts.
 */
export default function AdminNotificationToasts() {
  const router = useRouter();
  const { notifications, fetched, markAsRead } = useAdminNotificationStore();
  const [toasts, setToasts] = useState<AdminNotificationItem[]>([]);
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    // The store starts empty; only a real fetch counts as the first load.
    if (!fetched) return;
    if (seenIds.current) {
      const seen = seenIds.current;
      const fresh = notifications.filter((n) => !n.read_at && !seen.has(n.id));
      if (fresh.length) setToasts((prev) => [...fresh.slice(0, 3), ...prev].slice(0, MAX_TOASTS));
    }
    seenIds.current = new Set(notifications.map((n) => n.id));
  }, [notifications, fetched]);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const open = (item: AdminNotificationItem) => {
    void markAsRead(item.id);
    router.push(item.link);
  };

  if (toasts.length === 0) return null;
  return (
    <section
      aria-label="New admin alerts"
      aria-live="polite"
      className="pointer-events-none fixed right-5 top-17 lg:top-20 z-50 flex w-90 max-w-[calc(100vw-2.5rem)] flex-col gap-3"
    >
      {toasts.map((t) => <AdminToast key={t.id} item={t} onDismiss={dismiss} onOpen={open} />)}
    </section>
  );
}

function AdminToast({ item, onDismiss, onOpen }: {
  readonly item: AdminNotificationItem;
  readonly onDismiss: (id: string) => void;
  readonly onOpen: (item: AdminNotificationItem) => void;
}) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remaining = useRef(VISIBLE_MS);
  const startedAt = useRef(0);

  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(() => onDismiss(item.id), EXIT_MS);
  };
  const start = () => {
    startedAt.current = Date.now();
    timer.current = setTimeout(leave, remaining.current);
  };
  const pause = () => {
    if (!timer.current || leaving) return;
    clearTimeout(timer.current);
    timer.current = null;
    remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt.current));
  };
  const resume = () => { if (!timer.current && !leaving) start(); };

  useEffect(() => {
    // One frame at the off-screen position first, so the slide-in transitions.
    const frame = requestAnimationFrame(() => setShown(true));
    start();
    return () => { cancelAnimationFrame(frame); if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per card
  }, []);

  return (
    <div
      data-shown={shown && !leaving}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="notif-toast admin-toast pointer-events-auto relative rounded-xl border border-line bg-surface shadow-lg"
    >
      <button
        type="button"
        onClick={() => { onOpen(item); leave(); }}
        className="flex w-full items-start gap-3 rounded-xl p-3.5 pr-11 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe cursor-pointer"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${adminCategoryBg(item.category)}`}>
          <AdminCategoryIcon category={item.category} size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{item.title}</span>
            {item.badge && (
              <span className={`rounded-full border px-1.5 py-px text-[10px] font-semibold ${adminSeverityBadge(item.severity)}`}>
                {item.badge}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm font-semibold leading-snug text-ink line-clamp-2">{item.message}</span>
          {item.detail && <span className="mt-0.5 block text-xs text-ink-muted line-clamp-1">{item.detail}</span>}
          <span className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
            <time dateTime={item.created_at} className="text-ink-muted">{relativeTime(item.created_at)}</time>
            <span className="font-semibold text-taupe">{item.action_label ?? 'Review'}</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={leave}
        aria-label="Dismiss alert"
        className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-sunken hover:text-ink cursor-pointer"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
