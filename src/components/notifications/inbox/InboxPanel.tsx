'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/account/EmptyState';
import NotificationRow from './NotificationRow';
import GuestInbox from './GuestInbox';
import InboxMenu from './InboxMenu';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import { sectionsOf, type AppNotification } from './inboxTypes';
import { useInbox } from './useInbox';

/** How many notifications the drop-down shows before "See previous notifications". */
const PREVIEW = 8;
/** The drop-down's title, ⋯ menu and All / Unread stay at the top while the list scrolls under them (the popover has 12px padding). */
const STICKY_HEAD = 'sticky -top-3 z-10 -mx-3 -mt-3 bg-surface px-3 pt-3 pb-1';

interface InboxPanelProps {
  /** The drop-down under the bell: fewer rows, "See all", "See previous notifications" and "Open Notifications" lead to the full page. */
  readonly compact?: boolean;
  /** Called when the panel sends the person somewhere (so the drop-down can close). */
  readonly onLeave?: () => void;
}

/**
 * The customer's notifications, laid out like Facebook's: the title with a ⋯ menu (mark all as read, notification settings, open
 * notifications, clear read — which asks first), All / Unread, then New (unread) and the read ones by day. Used by the bell's
 * drop-down and by /notifications.
 */
export default function InboxPanel({ compact = false, onLeave }: InboxPanelProps) {
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const signedIn = hydrated && isAuthenticated && !!user;
  const inbox = useInbox(hydrated && isAuthenticated);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  // Notifications without an action_url open a detail modal here (the
  // dashboard bell uses NotificationDetailModal directly; we do the same).
  const { detailNotif, closeDetail, deleteDetail } = inbox;

  const shown = filter === 'unread' ? inbox.list.filter((n) => !n.read_at) : inbox.list;
  let sections = sectionsOf(shown);
  let hidden = 0;
  if (compact) {
    let left = PREVIEW;
    sections = sections.map((s) => { const items = s.items.slice(0, Math.max(0, left)); left -= items.length; return { ...s, items }; }).filter((s) => s.items.length > 0);
    hidden = shown.length - sections.reduce((n, s) => n + s.items.length, 0);
  }
  const open = (n: AppNotification) => { onLeave?.(); inbox.open(n); };
  const TitleTag = compact ? 'h2' : 'h1';

  return (
    <div>
      <div className={compact ? STICKY_HEAD : undefined}>
      <div className="mb-2 flex items-center justify-between gap-3 px-2">
        <TitleTag className={compact ? 'text-lg font-semibold text-ink' : 'mobile-h1 text-ink'}>Notifications</TitleTag>
        {signedIn && (
          <InboxMenu canMarkAll={inbox.unreadCount > 0} canClear={inbox.readCount > 0} showOpenAll={compact} onMarkAll={inbox.markAllRead} onClear={() => setConfirmClear(true)} onLeave={onLeave} />
        )}
      </div>

      {signedIn && !inbox.loading && inbox.list.length > 0 && (
        <div role="tablist" aria-label="Show" className="mb-1 flex gap-2 px-2">
          {(['all', 'unread'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`${compact ? 'h-8 px-3 text-[13px]' : 'h-9 px-4 text-sm'} rounded-full font-semibold transition-colors ${filter === k ? 'bg-taupe/15 text-taupe-dark' : 'text-ink hover:bg-sunken'}`}>
              {k === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
      )}
      </div>

      {hydrated && !isAuthenticated && <GuestInbox />}
      {signedIn && inbox.loading && <div className="flex min-h-40 items-center justify-center"><Loader2 size={24} className="animate-spin text-ink-faint" /></div>}
      {signedIn && !inbox.loading && inbox.list.length === 0 && <EmptyState Icon={Bell} title="All caught up" message="Updates about your appointments and orders will show up here." />}

      {signedIn && !inbox.loading && inbox.list.length > 0 && (
        <>
          {sections.length === 0 && <p className="mobile-body-sm py-10 text-center text-ink-muted">No unread notifications.</p>}

          {sections.map((g, i) => (
            <section key={g.label} className="mt-2">
              <div className="mb-1 flex items-center justify-between px-2">
                <h3 className={compact ? 'text-sm font-semibold text-ink' : 'mobile-h4 text-ink'}>{g.label}</h3>
                {compact && i === 0 && <Link href="/notifications" onClick={onLeave} className="text-sm text-taupe hover:underline">See all</Link>}
              </div>
              {g.items.map((n) => <NotificationRow key={n.id} notif={n} onOpen={open} compact={compact} />)}
            </section>
          ))}

          {/* Pinned to the bottom of the drop-down, so it shows without scrolling (the list scrolls under it). */}
          {compact && hidden > 0 && (
            <div className="sticky -bottom-3 z-10 -mx-3 -mb-3 mt-2 border-t border-line bg-surface px-3 pb-3 pt-2">
              <Link href="/notifications" onClick={onLeave} className="flex h-10 items-center justify-center rounded-xl bg-sunken text-[13px] font-semibold text-ink transition-opacity active:opacity-70">
                See previous notifications
              </Link>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { inbox.clearRead(); setConfirmClear(false); }}
        title="Clear read notifications?"
        message={`${inbox.readCount} notification${inbox.readCount === 1 ? '' : 's'} you have already read will be removed for good. Unread ones stay.`}
        confirmLabel="Clear"
        tone="danger"
      />

      {/* Detail modal for notifications that have no action_url — tapping
          "View Details" on a SUTURA System notification would otherwise silently
          do nothing. The modal reuses the same component the dashboard bell uses. */}
      <NotificationDetailModal
        notif={detailNotif}
        isOpen={!!detailNotif}
        onClose={closeDetail}
        onDelete={deleteDetail}
      />
    </div>
  );
}
