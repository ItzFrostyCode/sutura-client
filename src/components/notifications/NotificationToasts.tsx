'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { type AppNotification, getTypeConfig, relativeTime } from '@/lib/notificationHelpers';

const VISIBLE_MS = 5000;
const EXIT_MS = 280;

interface NotificationToastsProps {
  readonly toasts: AppNotification[];
  readonly onDismiss: (id: string) => void;
  /** The card body was clicked: go to its record, or open the bell. */
  readonly onOpen: (notif: AppNotification) => void;
}

/**
 * New notifications, shown as cards under the header's bell (top right) as
 * they arrive. Newest on top, stacking downward. Each one leaves on its own
 * after 5 seconds; hovering or focusing it pauses that countdown.
 */
export default function NotificationToasts({ toasts, onDismiss, onOpen }: NotificationToastsProps) {
  if (toasts.length === 0) return null;
  return (
    <section
      aria-label="New notifications"
      aria-live="polite"
      className="pointer-events-none fixed right-5 top-20 z-50 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col gap-2.5"
    >
      {toasts.map(t => <NotificationToast key={t.id} notif={t} onDismiss={onDismiss} onOpen={onOpen} />)}
    </section>
  );
}

function NotificationToast({ notif, onDismiss, onOpen }: {
  readonly notif: AppNotification; readonly onDismiss: (id: string) => void; readonly onOpen: (notif: AppNotification) => void;
}) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remaining = useRef(VISIBLE_MS);
  const startedAt = useRef(0);

  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(() => onDismiss(notif.id), EXIT_MS);
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

  const { icon: Icon, bg, color } = getTypeConfig(notif.data?.type);
  const title = notif.data?.title || 'New notification';
  const message = notif.data?.message && notif.data.message !== title ? notif.data.message : null;

  return (
    <div
      data-shown={shown && !leaving}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className="notif-toast pointer-events-auto relative rounded-2xl border border-line bg-surface shadow-lg"
    >
      <button
        type="button"
        onClick={() => { onOpen(notif); leave(); }}
        className="flex w-full items-start gap-3 rounded-2xl p-3.5 pr-11 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe cursor-pointer"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon size={17} className={color} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-snug text-ink line-clamp-2">{title}</span>
          {message && <span className="mt-0.5 block text-[13px] leading-snug text-ink-body line-clamp-2">{message}</span>}
          <time dateTime={notif.created_at} className="mt-1 block text-[11px] text-ink-muted">{relativeTime(notif.created_at)}</time>
        </span>
      </button>
      <button
        type="button"
        onClick={leave}
        aria-label="Dismiss notification"
        className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-sunken hover:text-ink cursor-pointer"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
