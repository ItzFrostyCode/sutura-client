'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, List, MoreHorizontal, Settings } from 'lucide-react';
import { ageOf, kindOf } from '@/components/notifications/inbox/inboxTypes';
import api from '@/lib/axios';
import { bindNotificationSoundUnlock, playNotificationSound } from '@/lib/notificationSound';
import {
  AppNotification,
  getSenderInfo,
} from '@/lib/notificationHelpers';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import NotificationToasts from '@/components/notifications/NotificationToasts';
import { useOptionalBranch } from '@/context/BranchContext';

/** How many notifications the drop-down shows before "See previous notifications" (same as the customer's). */
const PREVIEW = 8;

interface NotificationBellProps {
  /** "See all" in the panel footer. */
  readonly seeAllHref?: string;
  /** "Configure" in the panel footer. */
  readonly configureHref?: string;
  /**
   * 'dashboard' (default): the shop header's filled round button.
   * 'nav': the customer site header's plain icon button, and a full-width
   * panel on phones (the bell sits mid-header there, not at the edge).
   */
  readonly variant?: 'dashboard' | 'nav';
}

/**
 * The bell with its dropdown, new-notification toasts and chime. Used by the
 * shop dashboard header and, with variant="nav", by signed-in customers on
 * the public site (their notifications link to /account pages).
 */
export default function NotificationBell({
  seeAllHref = '/dashboard/notifications',
  configureHref = '/dashboard/notifications?tab=configure',
  variant = 'dashboard',
}: NotificationBellProps = {}) {
  const router = useRouter();
  const isNav = variant === 'nav';
  // The bell follows the branch selector: a branch shows its own notifications
  // plus store-wide ones; with "All Branches" (null) the API gives the owner
  // their main shop's. Managers and staff are pinned to their branch by the API.
  const selectedBranchId = useOptionalBranch()?.selectedBranchId ?? null;
  const branchParams = selectedBranchId === null ? undefined : { branch_id: selectedBranchId };
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  // Same controls as the customer's bell: All / Unread, and the ⋯ menu in the header.
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [headMenu, setHeadMenu] = useState(false);
  // New unread notifications since the page loaded, shown as toasts.
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  // Bumped whenever the unread count goes up, to replay the badge/bell motion.
  const [bump, setBump] = useState(0);
  const seenIds = useRef<Set<string> | null>(null);
  const lastCount = useRef<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Fetch Notifications ──────────────────────────────────────────────────
  const fetchList = async () => {
    try {
      const res = await api.get('/notifications', { params: { limit: 30, ...branchParams } });
      const raw = res.data.data;
      let list: AppNotification[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.data)) {
        list = raw.data;
      } else if (raw && typeof raw === 'object') {
        list = Object.values(raw).filter(
          (item): item is AppNotification =>
            item !== null && typeof item === 'object' && 'id' in item
        );
      }
      // The first load only records what's already there; anything unread
      // that shows up after that is new and gets a toast (newest on top).
      if (seenIds.current) {
        const seen = seenIds.current;
        const fresh = list.filter(n => !n.read_at && !seen.has(n.id));
        if (fresh.length) setToasts(prev => [...fresh.slice(0, 3), ...prev].slice(0, 4));
      }
      seenIds.current = new Set(list.map(n => n.id));

      setNotifications(list);
      const nextCount = typeof res.data.unread_count === 'number'
        ? res.data.unread_count
        : list.filter(n => !n.read_at).length;
      if (lastCount.current !== null && nextCount > lastCount.current) {
        setBump(b => b + 1);
        playNotificationSound();
      }
      lastCount.current = nextCount;
      setUnreadCount(nextCount);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => { bindNotificationSoundUnlock(); }, []);

  useEffect(() => {
    // A branch switch is a fresh first load: what it reveals isn't "new", so no toasts.
    seenIds.current = null;
    lastCount.current = null;
    void fetchList();
    // Checked every 15s so a new order or payment pops up while the shop is
    // working, without waiting for someone to open the bell.
    const interval = setInterval(() => {
      void fetchList();
    }, 15_000);

    return () => clearInterval(interval);
    // fetchList reads the branch from this render; re-run when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  // When opening dropdown, fetch immediately to guarantee fresh data
  useEffect(() => {
    if (open) {
      void fetchList();
    }
  }, [open]);

  // ── Click-outside close ──────────────────────────────────────────────────
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMenuOpenFor(null);
      }
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Click-outside close for per-row 3-dot menu
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu-container]')) {
        setMenuOpenFor(null);
      }
    }
    if (menuOpenFor) {
      document.addEventListener('mousedown', onOutside);
    }
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpenFor]);

  // ── Mark one read ────────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target || target.read_at) return;

    setUnreadCount(c => Math.max(0, c - 1));
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );

    try {
      const res = await api.post(`/notifications/${id}/read`, null, { params: branchParams });
      if (typeof res.data?.unread_count === 'number') {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      setUnreadCount(c => c + 1);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: null } : n))
      );
    }
  };

  // ── Mark one unread ──────────────────────────────────────────────────────
  const markAsUnread = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target || !target.read_at) return;

    setUnreadCount(c => c + 1);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: null } : n))
    );

    try {
      const res = await api.post(`/notifications/${id}/unread`, null, { params: branchParams });
      if (typeof res.data?.unread_count === 'number') {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      setUnreadCount(c => Math.max(0, c - 1));
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: target.read_at } : n))
      );
    }
  };

  // ── Mark all read ────────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
    try {
      const res = await api.post('/notifications/read-all', null, { params: branchParams });
      if (typeof res.data?.unread_count === 'number') {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      /* ignore */
    }
  };

  // ── Remove one notification ──────────────────────────────────────────────
  const removeNotification = async (id: string) => {
    setDismissing(id);
    const target = notifications.find(n => n.id === id);
    if (!target) return;

    const wasUnread = !target.read_at;
    if (wasUnread) {
      setUnreadCount(c => Math.max(0, c - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      const res = await api.delete(`/notifications/${id}`, { params: branchParams });
      if (typeof res.data?.unread_count === 'number') {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      if (wasUnread) setUnreadCount(c => c + 1);
      setNotifications(prev => [...prev, target]);
    } finally {
      setDismissing(null);
    }
  };

  // ── Row Click: Open Modal (Screenshot 3 Reference) ────────────────────────
  const handleItemClick = async (notif: AppNotification) => {
    void markAsRead(notif.id);
    setSelectedNotif(notif);
    setOpen(false);
  };

  // Toast body: go to the record it's about, or open the bell when it has none.
  const openFromToast = (notif: AppNotification) => {
    void markAsRead(notif.id);
    if (notif.data?.action_url) router.push(notif.data.action_url);
    else setOpen(true);
  };

  const count = unreadCount;
  const bellLabel = count > 0 ? `${count} unread notifications` : 'Notifications';

  return (
    <div className="relative" ref={wrapperRef}>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell-btn"
        aria-label={bellLabel}
        onClick={() => { setOpen(o => !o); setHeadMenu(false); }}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={bellLabel}
        className={isNav
          ? 'relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-ink hover:bg-sunken transition-colors cursor-pointer'
          : 'relative flex items-center justify-center w-10 h-10 rounded-full bg-line text-ink-body hover:bg-[#D1C7BD] transition-colors'}
      >
        {/* Same as the admin bell: amber while something is unread, count badge top right. */}
        <Bell
          key={`bell-${bump}`}
          size={isNav ? 19 : 20}
          className={count > 0 ? 'text-amber-500 animate-[wiggle_0.4s_ease-in-out]' : ''}
        />
        {count > 0 && (
          <span
            key={`badge-${bump}`}
            className={`${bump > 0 ? 'badge-bump ' : ''}absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 bg-[#E41E3F] text-white text-[10px] font-bold rounded-full border-2 border-surface shadow-xs`}
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* ── Dropdown: the same design as the customer's bell (InboxPanel compact): a sticky header with the title, a ⋯ menu
          and All / Unread; compact rows (picture, kind badge, two lines, time, unread dot) grouped New / Earlier; and
          "See previous notifications" pinned at the bottom. The data, branch filter, chime and toasts are this bell's own. */}
      {open && (
        <div
          aria-label="Notifications panel"
          className={`max-sm:fixed max-sm:inset-x-2 ${isNav ? 'max-sm:top-[60px]' : 'max-sm:top-[72px]'} sm:absolute sm:right-0 sm:mt-4 sm:w-[400px] sm:max-w-[calc(100vw-1rem)] z-50 max-h-[min(640px,calc(100dvh-96px))] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-3 shadow-[0_2px_6px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.22)] animate-in fade-in slide-in-from-top-2 duration-150`}
        >
          <div className="sticky -top-3 z-10 -mx-3 -mt-3 bg-surface px-3 pb-1 pt-3">
            <div className="mb-2 flex items-center justify-between gap-3 px-2">
              <h2 className="text-lg font-semibold text-ink">Notifications</h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHeadMenu((v) => !v)}
                  aria-label="Notification options"
                  aria-expanded={headMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sunken text-ink hover:bg-line"
                >
                  <MoreHorizontal size={18} />
                </button>
                {headMenu && (
                  <div className="absolute right-0 top-11 z-20 w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
                    <button type="button" disabled={count === 0} onClick={() => { setHeadMenu(false); void markAllAsRead(); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-ink hover:bg-sunken disabled:opacity-40">
                      <CheckCheck size={16} className="text-sage" /> Mark all as read
                    </button>
                    <button type="button" onClick={() => { setHeadMenu(false); setOpen(false); router.push(seeAllHref); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-ink hover:bg-sunken">
                      <List size={16} /> Open Notifications
                    </button>
                    <button type="button" onClick={() => { setHeadMenu(false); setOpen(false); router.push(configureHref); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-ink hover:bg-sunken">
                      <Settings size={16} /> Notification settings
                    </button>
                  </div>
                )}
              </div>
            </div>
            {notifications.length > 0 && (
              <div role="tablist" aria-label="Show" className="mb-1 flex gap-2 px-2">
                {(['all', 'unread'] as const).map((k) => (
                  <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`h-8 rounded-full px-3 text-[13px] font-semibold transition-colors ${filter === k ? 'bg-taupe/15 text-taupe-dark' : 'text-ink hover:bg-sunken'}`}>
                    {k === 'all' ? 'All' : 'Unread'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sunken"><Bell size={20} className="text-ink-muted" /></div>
              <p className="text-sm font-semibold text-ink">All caught up</p>
              <p className="mt-0.5 text-xs text-ink-muted">New orders, appointments and payments show up here.</p>
            </div>
          ) : (() => {
            const shown = filter === 'unread' ? notifications.filter((n) => !n.read_at) : notifications;
            const preview = shown.slice(0, PREVIEW);
            const groups = [
              { label: 'New', items: preview.filter((n) => !n.read_at) },
              { label: 'Earlier', items: preview.filter((n) => n.read_at) },
            ].filter((g) => g.items.length > 0);
            return (
              <>
                {groups.length === 0 && <p className="py-10 text-center text-sm text-ink-muted">No unread notifications.</p>}
                {groups.map((g, gi) => (
                  <section key={g.label} className="mt-2">
                    <div className="mb-1 flex items-center justify-between px-2">
                      <h3 className="text-sm font-semibold text-ink">{g.label}</h3>
                      {gi === 0 && <button type="button" onClick={() => { setOpen(false); router.push(seeAllHref); }} className="text-sm text-taupe hover:underline">See all</button>}
                    </div>
                    {g.items.map((notif) => {
                      const sender = getSenderInfo(notif);
                      const unread = !notif.read_at;
                      const kind = kindOf(notif.data?.type);
                      const sentence = notif.data?.message || notif.data?.title || 'New update';
                      return (
                        <button key={notif.id} type="button" onClick={() => handleItemClick(notif)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-sunken active:bg-sunken">
                          <span className="relative shrink-0">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-canvas font-serif text-base font-bold text-taupe-dark">{sender.initial}</span>
                            <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface ${kind.tone}`}><kind.Icon size={10} /></span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`line-clamp-2 min-h-[2lh] text-[13px] leading-snug ${unread ? 'font-medium text-ink' : 'text-ink-body'}`}>
                              <span className="font-semibold text-ink">{sender.name} </span>{sentence}
                            </span>
                            <span className={`mt-0.5 block text-[11px] ${unread ? 'font-semibold text-taupe' : 'text-ink-faint'}`}>{ageOf(notif.created_at)}</span>
                          </span>
                          <span aria-label={unread ? 'Unread' : undefined} className={`h-2.5 w-2.5 shrink-0 rounded-full ${unread ? 'bg-taupe' : 'bg-transparent'}`} />
                        </button>
                      );
                    })}
                  </section>
                ))}
                {shown.length > PREVIEW && (
                  <div className="sticky -bottom-3 z-10 -mx-3 -mb-3 mt-2 border-t border-line bg-surface px-3 pb-3 pt-2">
                    <button type="button" onClick={() => { setOpen(false); router.push(seeAllHref); }} className="flex h-10 w-full items-center justify-center rounded-xl bg-sunken text-[13px] font-semibold text-ink active:opacity-70">
                      See previous notifications
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      <NotificationToasts
        toasts={toasts}
        onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))}
        onOpen={openFromToast}
      />

      {/* ── Detail Modal (Screenshot 3 Reference) ── */}
      <NotificationDetailModal
        notif={selectedNotif}
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onDelete={id => {
          setNotifications(prev => prev.filter(n => n.id !== id));
          setUnreadCount(c => Math.max(0, c - 1));
        }}
      />
    </div>
  );
}
