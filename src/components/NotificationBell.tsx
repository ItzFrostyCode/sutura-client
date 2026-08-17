'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Scissors,
  Calendar,
  CreditCard,
  Package,
  Info,
  X,
  MoreVertical,
  Trash2,
  UserCog,
  XCircle,
  AlertTriangle,
  PackageOpen,
  PauseCircle,
} from 'lucide-react';
import api from '@/lib/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotifData {
  type?: string;
  title?: string;
  message?: string;
  action_url?: string;
  [key: string]: unknown;
}

interface AppNotification {
  id: string;
  created_at: string;
  read_at: string | null;
  data: NotifData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; color: string; label: string }
> = {
  order_ready: {
    icon: Package,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
    label: 'Order Ready',
  },
  new_job_order: {
    icon: Scissors,
    bg: 'bg-sunken',
    color: 'text-taupe',
    label: 'New Job',
  },
  appointment_booked: {
    icon: Calendar,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
    label: 'Appointment',
  },
  payment_received: {
    icon: CreditCard,
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
    label: 'Payment',
  },
  new_catalog_order: {
    icon: Package,
    bg: 'bg-violet-50',
    color: 'text-violet-600',
    label: 'New Order',
  },
  staff_assigned: {
    icon: UserCog,
    bg: 'bg-sunken',
    color: 'text-taupe',
    label: 'Staff Assigned',
  },
  payment_rejected: {
    icon: XCircle,
    bg: 'bg-red-50',
    color: 'text-red-600',
    label: 'Payment Rejected',
  },
  overdue_jobs_digest: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
    label: 'Overdue Jobs',
  },
  unclaimed_pickups_digest: {
    icon: PackageOpen,
    bg: 'bg-orange-50',
    color: 'text-orange-600',
    label: 'Unclaimed Pickups',
  },
  jobs_on_hold_digest: {
    icon: PauseCircle,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
    label: 'Jobs On Hold',
  },
  subscription_expired: {
    icon: CreditCard,
    bg: 'bg-red-50',
    color: 'text-red-600',
    label: 'Subscription',
  },
  default: {
    icon: Info,
    bg: 'bg-sunken',
    color: 'text-ink-muted',
    label: 'Update',
  },
};

// job_* (every production-stage transition, e.g. job_cutting, job_completed)
// and appointment_* (every status change, e.g. appointment_confirmed,
// appointment_cancelled) are generated dynamically from the underlying
// status/stage string — enumerating every possible value here would drift
// out of sync with JobOrder::STATUSES/Appointment::STATUSES the moment a
// new one is added, so they're matched by prefix instead of by exact key.
function getTypeConfig(type?: string) {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type];
  if (type?.startsWith('job_')) return TYPE_CONFIG.new_job_order;
  if (type?.startsWith('appointment_')) return TYPE_CONFIG.appointment_booked;
  return TYPE_CONFIG.default;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Backend-computed, unlimited-scope count — the list itself is capped to
  // the 30 most recent notifications, so deriving "unread" by filtering
  // that same capped array would silently undercount any owner sitting on
  // more than 30 unread notifications at once.
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  // Defined inside the effect so setState is called inside an async callback,
  // not synchronously in the effect body — this is the correct React pattern.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get('/notifications');
        const raw = res.data.data;
        const list: AppNotification[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        if (!cancelled) {
          setNotifications(list);
          setUnreadCount(typeof res.data.unread_count === 'number' ? res.data.unread_count : list.filter(n => !n.read_at).length);
        }
      } catch {
        // Silently fail — bell shows 0 unread
      }
    };

    void load();
    const interval = setInterval(() => { void load(); }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // empty — load is defined inside, no external deps

  // ── Click-outside close ──────────────────────────────────────────────────
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // ── Click-outside close for the per-row "⋯" menu ─────────────────────────
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null);
      }
    }
    if (menuOpenFor) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpenFor]);

  // ── Mark one read ────────────────────────────────────────────────────────
  // Stays in the list (just visually muted, see the read_at check in the
  // row render below) instead of disappearing — clicking to view/navigate
  // shouldn't make a notification look deleted.
  const markAsRead = async (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (!target || target.read_at) return;

    setDismissing(id);
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
    } finally {
      setDismissing(null);
    }
  };

  // ── Mark all read ────────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
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

  // ── Mark one unread — counterpart to markAsRead, for the "⋯" row menu ────
  const markAsUnread = async (id: string) => {
    setMenuOpenFor(null);
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

  // ── Remove one — the explicit "I don't need to see this again" action,
  // distinct from markAsRead which keeps it visible just muted.
  const removeNotification = async (id: string) => {
    setMenuOpenFor(null);
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
    }
  };

  // ── Navigate on click ────────────────────────────────────────────────────
  const handleNotifClick = async (notif: AppNotification) => {
    await markAsRead(notif.id);
    const url = notif.data?.action_url;
    if (url) router.push(url);
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

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          aria-label="Notifications panel"
          aria-modal="true"
          className="absolute right-0 mt-2 w-[340px] bg-surface border border-line rounded-2xl overflow-hidden z-50
            animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-taupe" />
              <span className="font-semibold text-ink text-sm">Notifications</span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E41E3F] text-white rounded-full">
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 text-xs text-taupe hover:text-ink px-2 py-1 rounded-lg hover:bg-sunken transition-colors"
                >
                  <CheckCheck size={13} />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-sunken text-ink-faint hover:text-ink-body transition-colors"
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mb-3">
                  <Bell size={20} className="text-[#C4B8AE]" />
                </div>
                <p className="text-sm font-medium text-ink-body">All caught up!</p>
                <p className="text-xs text-ink-faint mt-0.5">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0EAE3]">
                {notifications.map(notif => {
                  const cfg = getTypeConfig(notif.data?.type);
                  const Icon = cfg.icon;
                  const isDismissing = dismissing === notif.id;
                  const isRead = !!notif.read_at;
                  const menuOpen = menuOpenFor === notif.id;
                  return (
                    <div
                      key={notif.id}
                      className={`relative w-full group flex items-start gap-3 px-4 py-3.5 hover:bg-canvas transition-colors ${isDismissing ? 'opacity-40' : ''}`}
                    >
                      {/* Main Clickable Area */}
                      <button
                        type="button"
                        className="flex-1 text-left flex items-start gap-3 min-w-0 focus:outline-none"
                        onClick={() => handleNotifClick(notif)}
                        aria-label={notif.data?.title ?? 'Notification'}
                      >
                        {/* Icon bubble */}
                        <div className={`relative w-9 h-9 shrink-0 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center mt-0.5`}>
                          <Icon size={16} />
                          {!isRead && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#E41E3F] rounded-full border-2 border-white" aria-hidden="true" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] truncate ${isRead ? 'font-medium text-ink-body' : 'font-semibold text-ink'}`}>
                            {notif.data?.title ?? cfg.label}
                          </p>
                          <p className="text-[12px] text-ink-muted leading-snug mt-0.5 line-clamp-2">
                            {notif.data?.message ?? 'New notification'}
                          </p>
                          <p className="text-[11px] text-ink-faint mt-1">
                            {relativeTime(notif.created_at)}
                          </p>
                        </div>
                      </button>

                      {/* "⋯" row menu — Mark as read/unread, Remove */}
                      <button
                        type="button"
                        onClick={() => setMenuOpenFor(prev => prev === notif.id ? null : notif.id)}
                        className={`shrink-0 p-1.5 rounded-lg hover:bg-line text-ink-faint hover:text-ink-body transition-all mt-0.5 focus:outline-none ${menuOpen ? 'opacity-100 bg-line' : 'opacity-0 group-hover:opacity-100'}`}
                        title="More actions"
                        aria-label="More actions"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {menuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute right-4 top-11 z-10 w-44 bg-surface border border-line rounded-xl overflow-hidden py-1"
                        >
                          <button
                            type="button"
                            onClick={() => void (isRead ? markAsUnread(notif.id) : markAsRead(notif.id))}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-ink-body hover:bg-canvas transition-colors"
                          >
                            <Check size={13} />
                            {isRead ? 'Mark as unread' : 'Mark as read'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeNotification(notif.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 transition-colors"
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div className="border-t border-line px-4 py-2.5 text-center">
              <p className="text-[11px] text-ink-faint">
                {count === 1 ? '1 unread notification' : `${count} unread notifications`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
