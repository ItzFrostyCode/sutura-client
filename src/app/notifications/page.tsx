'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bell, MoreVertical, MailOpen, Check, Trash2,
  Calendar, CreditCard, Scissors, Package, XCircle, Star, MessageCircle, Info, Store, ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import PublicNav from '@/components/shared/PublicNav';
import AccountWebSidebar from '@/components/account/hub/AccountWebSidebar';

interface NotifData {
  type?: string;
  title?: string;
  message?: string;
  action_url?: string;
  store?: { id: number; name: string; slug: string; logo_path: string | null } | null;
  // Which staff/owner performed the action (mark ready, confirm, cancel,
  // etc.) — only populated for the notification types that carry a real
  // human actor (appointments, job orders). Takes priority over the store
  // logo when present, since it answers "who did this" more specifically.
  actor?: { id: number; name: string; profile_picture: string | null } | null;
  [key: string]: unknown;
}

interface AppNotification {
  id: string;
  created_at: string;
  read_at: string | null;
  data: NotifData;
}

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

// Mirrors NotificationBell.tsx's TYPE_CONFIG (the store-owner side) — same
// icon language, adapted to the notification types the customer side
// actually fires (see sutura-server/app/Notifications/*.php's 'type' keys).
const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  order_ready: { icon: Package, bg: 'bg-amber-50', color: 'text-amber-600' },
  customer_payment_rejected: { icon: XCircle, bg: 'bg-red-50', color: 'text-red-600' },
  catalog_item_review_reply: { icon: Star, bg: 'bg-amber-50', color: 'text-amber-600' },
  support_ticket_reply: { icon: MessageCircle, bg: 'bg-blue-50', color: 'text-blue-600' },
  default: { icon: Info, bg: 'bg-sunken', color: 'text-ink-muted' },
};

function getTypeConfig(type?: string) {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type];
  if (type?.startsWith('appointment_')) return { icon: Calendar, bg: 'bg-blue-50', color: 'text-blue-600' };
  if (type?.startsWith('job_')) return { icon: Scissors, bg: 'bg-sunken', color: 'text-taupe' };
  if (type?.startsWith('catalog_order_payment_')) return { icon: Package, bg: 'bg-violet-50', color: 'text-violet-600' };
  if (type?.includes('payment')) return { icon: CreditCard, bg: 'bg-emerald-50', color: 'text-emerald-600' };
  return TYPE_CONFIG.default;
}

// Flat, chronological list — same shape as the store-owner side's
// NotificationBell dropdown, just rendered full-page instead of a panel
// (this IS the main panel here, mobile has no room for a side dropdown).
// No store-grouping/drill-down: tapping a row marks it read and navigates
// straight to its action_url, exactly like the owner side's bell.
//
// Desktop/tablet (md+): shares the same persistent AccountWebSidebar as
// /account, matching the reference "My Account" layout — one section of
// the site, one nav rail. Below md: no sidebar, full-width list.
export default function NotificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const showSidebar = hydrated && isAuthenticated && !!user;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) {
      setLoading(false);
      return;
    }
    api.get('/notifications')
      .then((res) => {
        const raw = res.data.data;
        const list: AppNotification[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        setNotifications(list);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [hydrated, isAuthenticated]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const markAsRead = async (id: string) => {
    setMenuOpenFor(null);
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      // Keep UI state optimistic or silent
    }
  };

  const markAsUnread = async (id: string) => {
    setMenuOpenFor(null);
    try {
      await api.post(`/notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: null } : n))
      );
    } catch {
      // Keep UI state optimistic or silent
    }
  };

  const removeNotification = async (id: string) => {
    setMenuOpenFor(null);
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Keep UI state optimistic or silent
    }
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.read_at) {
      void markAsRead(notif.id);
    }
    if (notif.data?.action_url) router.push(notif.data.action_url);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 w-full max-w-7xl mx-auto mobile-screen-margins py-4 md:py-6">
        <div className={showSidebar ? 'flex flex-col md:flex-row md:items-start md:gap-8' : ''}>
          {showSidebar && (
            <div className="hidden md:block">
              <AccountWebSidebar user={user} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="mobile-h2 sm:tablet-h2 text-ink mb-3">Notifications</h1>

            {!hydrated && null}

            {/* Guest Mode: no real notifications exist yet, so this isn't an
                empty state — it's two standing engagement cards, styled like
                real notification rows so they read as part of this list rather
                than a dead-end wall. */}
            {hydrated && !isAuthenticated && (
              <div className="space-y-2.5">
                <Link
                  href="/login"
                  className="flex items-start gap-3 bg-surface border border-line px-4 py-3.5 hover:border-line-strong transition-colors"
                >
                  <div className="w-9 h-9 shrink-0 rounded-full bg-sunken text-taupe flex items-center justify-center mt-0.5">
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink">Never miss an update</p>
                    <p className="text-xs text-ink-muted leading-snug mt-0.5">
                      Sign up and log in to get notified about your appointments and orders here.
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-ink-faint shrink-0 mt-1" />
                </Link>

                <Link
                  href="/register?as=store_owner"
                  className="flex items-start gap-3 bg-surface border border-line px-4 py-3.5 hover:border-line-strong transition-colors"
                >
                  <div className="w-9 h-9 shrink-0 rounded-full bg-sunken text-taupe flex items-center justify-center mt-0.5">
                    <Store size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink">Are you a store owner?</p>
                    <p className="text-xs text-ink-muted leading-snug mt-0.5">
                      List your tailoring store on SUTURA and start managing orders online.
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-ink-faint shrink-0 mt-1" />
                </Link>
              </div>
            )}

            {hydrated && isAuthenticated && loading && (
              <div className="text-center py-16 text-sm text-ink-muted">Loading your notifications…</div>
            )}

            {hydrated && isAuthenticated && !loading && sorted.length === 0 && (
              <div className="bg-surface border border-line p-10 text-center">
                <Bell size={28} className="text-ink-faint mx-auto mb-3" />
                <p className="text-sm font-medium text-ink-body mb-1">All caught up!</p>
                <p className="text-xs text-ink-muted">No notifications yet.</p>
              </div>
            )}

            {hydrated && isAuthenticated && !loading && sorted.length > 0 && (
              <div className="space-y-2.5">
                {sorted.map((notif) => {
                  const cfg = getTypeConfig(notif.data?.type);
                  const Icon = cfg.icon;
                  const isRead = !!notif.read_at;
                  const menuOpen = menuOpenFor === notif.id;
                  const store = notif.data?.store;
                  const actor = notif.data?.actor;
                  const storeName = store?.name;

                  return (
                    <div
                      key={notif.id}
                      className={`relative flex items-center border transition-colors ${!isRead ? 'bg-taupe/5 border-taupe/20' : 'bg-surface border-line'}`}
                    >
                      <button
                        type="button"
                        onClick={() => void handleItemClick(notif)}
                        className="flex-1 min-w-0 flex items-start gap-3 pl-4 pr-11 py-3.5 text-left"
                      >
                        <div className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden bg-sunken border border-line mt-0.5">
                          {actor?.profile_picture ? (
                            <Image
                              src={getMediaUrl(actor.profile_picture)}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : actor ? (
                            <div className="w-full h-full flex items-center justify-center text-ink-faint">
                              <UserIcon size={16} />
                            </div>
                          ) : store?.logo_path ? (
                            <Image
                              src={getMediaUrl(store.logo_path)}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : store ? (
                            <div className="w-full h-full flex items-center justify-center text-ink-faint">
                              <Store size={16} />
                            </div>
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${cfg.bg} ${cfg.color}`}>
                              <Icon size={16} />
                            </div>
                          )}
                          {!isRead && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-alert rounded-full border-2 border-surface" aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {storeName && (
                            <p className="text-[10px] font-semibold text-taupe uppercase tracking-wide truncate">{storeName}</p>
                          )}
                          <p className={`text-[13px] truncate ${isRead ? 'font-medium text-ink-body' : 'font-semibold text-ink'}`}>
                            {notif.data?.title ?? 'Update'}
                          </p>
                          <p className="text-xs text-ink-muted leading-snug mt-0.5 line-clamp-2">
                            {notif.data?.message ?? 'New notification'}
                          </p>
                          <p className="text-[11px] text-ink-faint mt-1">{relativeTime(notif.created_at)}</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMenuOpenFor((prev) => (prev === notif.id ? null : notif.id))}
                        className="absolute top-3.5 right-3 p-1 text-ink-faint hover:text-ink-body hover:bg-sunken transition-colors"
                        aria-label="More actions"
                      >
                        <MoreVertical size={15} />
                      </button>

                      {menuOpen && (
                        <div ref={menuRef} className="absolute right-3 top-11 z-10 w-44 bg-surface border border-line overflow-hidden py-1">
                          <button
                            type="button"
                            onClick={() => void (isRead ? markAsUnread(notif.id) : markAsRead(notif.id))}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-ink-body hover:bg-canvas transition-colors"
                          >
                            {isRead ? <MailOpen size={13} /> : <Check size={13} />}
                            {isRead ? 'Mark as unread' : 'Mark as read'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeNotification(notif.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/5 transition-colors"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
