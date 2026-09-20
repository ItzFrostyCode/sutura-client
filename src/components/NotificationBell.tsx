'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  List,
  Settings,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import api from '@/lib/axios';
import {
  AppNotification,
  getSenderInfo,
  formatDateTime,
  relativeTime,
} from '@/lib/notificationHelpers';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Fetch Notifications ──────────────────────────────────────────────────
  const fetchList = async () => {
    try {
      const res = await api.get('/notifications?limit=30');
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
      setNotifications(list);
      setUnreadCount(
        typeof res.data.unread_count === 'number'
          ? res.data.unread_count
          : list.filter(n => !n.read_at).length
      );
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    void fetchList();
    const interval = setInterval(() => {
      void fetchList();
    }, 30_000);

    return () => clearInterval(interval);
  }, []);

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
      const res = await api.post(`/notifications/${id}/read`);
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
      const res = await api.post(`/notifications/${id}/unread`);
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
      const res = await api.post('/notifications/read-all');
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
      const res = await api.delete(`/notifications/${id}`);
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

  const count = unreadCount;
  const bellLabel = count > 0 ? `${count} unread notifications` : 'Notifications';

  return (
    <div className="relative" ref={wrapperRef}>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell-btn"
        aria-label={bellLabel}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-line text-ink-body hover:bg-[#D1C7BD] transition-colors"
      >
        <Bell
          size={20}
          className={count > 0 ? 'animate-[wiggle_0.4s_ease-in-out]' : ''}
          fill="currentColor"
        />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-[#E41E3F] text-white text-[11px] font-bold rounded-full border-2 border-white"
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel (Screenshot 1 Reference) ── */}
      {open && (
        <div
          aria-label="Notifications panel"
          aria-modal="true"
          className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-1rem)] bg-surface border border-line rounded-2xl overflow-hidden z-50 shadow-xl
            animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-sm">Notifications</span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E41E3F] text-white rounded-full">
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-sunken text-ink-muted hover:text-ink transition-colors"
                aria-label="Close notifications"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto overscroll-contain divide-y divide-line">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mb-3">
                  <Bell size={20} className="text-ink-muted" />
                </div>
                <p className="text-sm font-semibold text-ink">All caught up!</p>
                <p className="text-xs text-ink-muted mt-0.5">No new notifications</p>
              </div>
            ) : (
              notifications.map(notif => {
                const sender = getSenderInfo(notif);
                const isDismissing = dismissing === notif.id;
                const isRead = !!notif.read_at;

                return (
                  <div
                    key={notif.id}
                    className={`relative w-full group flex items-start gap-3 px-4 py-3 hover:bg-[#FAF6F3] transition-colors cursor-pointer ${
                      isDismissing ? 'opacity-40' : ''
                    } ${!isRead ? 'bg-amber-50/25' : ''}`}
                    onClick={() => handleItemClick(notif)}
                  >
                    {/* Sender Avatar — identical to SUTURA Client Profile style */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-xl bg-canvas border border-line flex items-center justify-center shadow-2xs">
                        <span className="text-sm font-black text-taupe">{sender.initial}</span>
                      </div>
                      {!isRead && (
                        <span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E41E3F] rounded-full border-2 border-white"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 pr-1">
                      {/* Sender Name */}
                      <p className="text-[13px] font-bold text-ink truncate leading-tight">
                        {sender.name}
                      </p>

                      {/* Subject/Action line */}
                      <p className="text-[12px] text-ink-body font-medium leading-snug mt-0.5 line-clamp-2">
                        {notif.data?.title || notif.data?.message || 'New update'}
                      </p>

                      {/* Timestamp */}
                      <p className="text-[11px] text-ink-muted mt-1 font-normal">
                        {formatDateTime(notif.created_at)}
                      </p>
                    </div>

                    {/* Actions on the right: 3-dot (to the left of ✕) and ✕ button */}
                    <div className="flex items-center gap-0.5 shrink-0 relative" data-menu-container>
                      {/* 3-dot small button on the left of ✕ */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setMenuOpenFor(prev => (prev === notif.id ? null : notif.id));
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          menuOpenFor === notif.id
                            ? 'bg-sunken text-ink'
                            : 'text-ink-muted hover:text-ink hover:bg-sunken'
                        }`}
                        title="More options"
                        aria-label="More options"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Quick Dismiss ✕ button (Screenshot 1 Reference) */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          void removeNotification(notif.id);
                        }}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-sunken transition-colors"
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <X size={15} />
                      </button>

                      {/* 3-dot Dropdown Menu with icon on the left side of the text */}
                      {menuOpenFor === notif.id && (
                        <div
                          className="absolute right-0 top-8 z-40 w-52 bg-surface border border-line rounded-xl shadow-xl py-1 divide-y divide-line animate-in fade-in zoom-in-95 duration-100"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenFor(null);
                              void (isRead ? markAsUnread(notif.id) : markAsRead(notif.id));
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-ink-body hover:text-ink hover:bg-[#FAF6F3] transition-colors text-left"
                          >
                            <Check size={14} className={isRead ? 'text-ink-muted' : 'text-sage stroke-[2.5]'} />
                            <span>{isRead ? 'Mark as unread' : 'Mark as read'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenFor(null);
                              void removeNotification(notif.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors text-left"
                          >
                            <Trash2 size={14} className="text-danger stroke-[2]" />
                            <span>Delete this notification</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Toolbar (Screenshot 1 Reference: See all | Mark all read | Configure) */}
          <div className="border-t border-[#D6CCC0] px-3 py-2.5 bg-[#EBE4DC] flex items-center justify-between text-xs">
            {/* See All */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/dashboard/notifications');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-ink hover:text-taupe hover:bg-white/70 active:bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <List size={14} className="stroke-[2.5]" />
              <span>See all</span>
            </button>

            {/* Mark all read */}
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-ink-body hover:text-ink hover:bg-white/70 active:bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <CheckCheck size={14} className="text-sage stroke-[2.5]" />
              <span>Mark all read</span>
            </button>

            {/* Configure */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/dashboard/notifications?tab=configure');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-ink-body hover:text-ink hover:bg-white/70 active:bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <Settings size={14} className="stroke-[2.5]" />
              <span>Configure</span>
            </button>
          </div>
        </div>
      )}

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
