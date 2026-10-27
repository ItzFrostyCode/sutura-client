'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  ExternalLink,
  FileCheck2,
  LifeBuoy,
  MapPin,
  Shirt,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import {
  AdminNotificationItem,
  useAdminNotificationStore,
} from '@/store/useAdminNotificationStore';
import { relativeTime } from '@/lib/notificationHelpers';

interface AdminNotificationBellProps {
  variant?: 'light' | 'dark';
}

export default function AdminNotificationBell({ variant = 'light' }: AdminNotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'plans'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
  } = useAdminNotificationStore();

  // Initial fetch and auto-refresh every 30s
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when dropdown opens for fresh data
  useEffect(() => {
    if (open) {
      void fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Click outside and escape key handling
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Filter items
  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'pending') {
      return ['applications', 'branches', 'upgrades', 'apparel'].includes(item.category);
    }
    if (filter === 'plans') {
      return ['upgrades', 'subscriptions'].includes(item.category);
    }
    return true;
  });

  const handleItemClick = (item: AdminNotificationItem) => {
    void markAsRead(item.id);
    setOpen(false);
    router.push(item.link);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'applications':
        return <Store size={16} className="text-amber-700" />;
      case 'branches':
        return <MapPin size={16} className="text-sky-700" />;
      case 'upgrades':
        return <CreditCard size={16} className="text-emerald-700" />;
      case 'subscriptions':
        return <Sparkles size={16} className="text-purple-700" />;
      case 'apparel':
        return <Shirt size={16} className="text-indigo-700" />;
      case 'support':
        return <LifeBuoy size={16} className="text-rose-700" />;
      default:
        return <FileCheck2 size={16} className="text-taupe" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category) {
      case 'applications':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'branches':
        return 'bg-sky-500/10 border-sky-500/20';
      case 'upgrades':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'subscriptions':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'apparel':
        return 'bg-indigo-500/10 border-indigo-500/20';
      case 'support':
        return 'bg-rose-500/10 border-rose-500/20';
      default:
        return 'bg-sunken border-line';
    }
  };

  const buttonStyle =
    variant === 'dark'
      ? 'relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white transition-colors focus:outline-hidden focus:ring-2 focus:ring-taupe'
      : 'relative flex items-center justify-center w-10 h-10 rounded-xl bg-surface hover:bg-sunken border border-line text-ink hover:text-ink transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-taupe';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        id="admin-notification-bell-btn"
        type="button"
        aria-label={unreadCount > 0 ? `${unreadCount} unread platform alerts` : 'Platform notifications'}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={buttonStyle}
      >
        <Bell size={18} className={unreadCount > 0 ? 'text-amber-500' : ''} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-[#E41E3F] text-white text-[10px] font-bold border-2 border-surface shadow-xs"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          role="region"
          aria-label="Platform alerts"
          className="absolute right-0 mt-2 w-[410px] max-w-[calc(100vw-1.5rem)] rounded-2xl border-2 border-line-strong bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-ink">Notifications</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-500/20">
                  {unreadCount} action needed
                </span>
              ) : (
                <span className="rounded-full bg-sunken px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                  All caught up
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-taupe hover:bg-sunken hover:text-taupe-dark transition-colors"
                  title="Mark all notifications as read"
                >
                  <CheckCheck size={14} />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-sunken hover:text-ink transition-colors"
                aria-label="Close notifications dropdown"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Sub-nav */}
          <div className="flex items-center gap-1 border-b border-line bg-canvas/60 px-3 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                filter === 'pending'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Action Required
            </button>
            <button
              type="button"
              onClick={() => setFilter('plans')}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                filter === 'plans'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Plans & Subscriptions
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-[380px] overflow-y-auto divide-y-2 divide-line-strong">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-sunken text-ink-muted">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-semibold text-ink">No alerts right now</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {filter === 'all'
                    ? 'All shop applications, branch pins, and reviews are handled.'
                    : 'No pending items matching this filter.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isRead = !!item.read_at;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-canvas ${
                      !isRead ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div
                      className={`relative shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border ${getCategoryBg(
                        item.category
                      )}`}
                    >
                      {getCategoryIcon(item.category)}
                      {!isRead && (
                        <span
                          className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#E41E3F] border-2 border-surface"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-semibold text-ink-body">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Primary Message */}
                      <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink line-clamp-2">
                        {item.message}
                      </p>

                      {/* Detail Subtext */}
                      {item.detail && (
                        <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
                          {item.detail}
                        </p>
                      )}

                      {/* Action Prompt & Timestamp */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
                        <span>{relativeTime(item.created_at)}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-taupe group-hover:text-taupe-dark">
                          {item.action_label ?? 'Review'} <ExternalLink size={12} />
                        </span>
                      </div>
                    </div>

                    {/* Inline Quick Read Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void markAsRead(item.id);
                      }}
                      title={isRead ? 'Already read' : 'Mark as read'}
                      aria-label="Mark notification as read"
                      className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                        isRead
                          ? 'text-ink-faint opacity-0 group-hover:opacity-100 hover:text-ink'
                          : 'text-taupe hover:bg-sunken hover:text-taupe-dark'
                      }`}
                    >
                      <Check size={14} className={isRead ? '' : 'stroke-[2.5]'} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Toolbar */}
          <div className="flex items-center justify-between border-t border-line bg-canvas/80 px-4 py-2.5 text-xs">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 font-bold text-ink hover:text-taupe transition-colors"
            >
              <span>View all notifications</span>
              <ExternalLink size={13} />
            </Link>

            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className="inline-flex items-center gap-1 font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              <CheckCheck size={14} className="text-sage" />
              <span>Mark all as read</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
