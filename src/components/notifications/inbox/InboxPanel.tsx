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
import { sectionsOf, type AppNotification } from './inboxTypes';
import { useInbox } from './useInbox';

/** How many notifications the drop-down shows before "See previous notifications". */
const PREVIEW = 8;

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
      <div className="mb-2 flex items-center justify-between gap-3 px-2">
        <TitleTag className={compact ? 'mobile-h2 text-ink' : 'mobile-h1 text-ink'}>Notifications</TitleTag>
        {signedIn && (
          <InboxMenu canMarkAll={inbox.unreadCount > 0} canClear={inbox.readCount > 0} showOpenAll={compact} onMarkAll={inbox.markAllRead} onClear={() => setConfirmClear(true)} onLeave={onLeave} />
        )}
      </div>

      {hydrated && !isAuthenticated && <GuestInbox />}
      {signedIn && inbox.loading && <div className="flex min-h-40 items-center justify-center"><Loader2 size={24} className="animate-spin text-ink-faint" /></div>}
      {signedIn && !inbox.loading && inbox.list.length === 0 && <EmptyState Icon={Bell} title="All caught up" message="Updates about your appointments and orders will show up here." />}

      {signedIn && !inbox.loading && inbox.list.length > 0 && (
        <>
          <div role="tablist" aria-label="Show" className="mb-1 flex gap-2 px-2">
            {(['all', 'unread'] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${filter === k ? 'bg-taupe/15 text-taupe-dark' : 'text-ink hover:bg-sunken'}`}>
                {k === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>

          {sections.length === 0 && <p className="mobile-body-sm py-10 text-center text-ink-muted">No unread notifications.</p>}

          {sections.map((g, i) => (
            <section key={g.label} className="mt-2">
              <div className="mb-1 flex items-center justify-between px-2">
                <h3 className="mobile-h4 text-ink">{g.label}</h3>
                {compact && i === 0 && <Link href="/notifications" onClick={onLeave} className="text-sm text-taupe hover:underline">See all</Link>}
              </div>
              {g.items.map((n) => <NotificationRow key={n.id} notif={n} onOpen={open} />)}
            </section>
          ))}

          {compact && hidden > 0 && (
            <Link href="/notifications" onClick={onLeave} className="mt-2 flex h-11 items-center justify-center rounded-xl bg-sunken text-sm font-semibold text-ink transition-opacity active:opacity-70">
              See previous notifications
            </Link>
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
    </div>
  );
}
