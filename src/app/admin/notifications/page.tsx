'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  CreditCard,
  FileCheck2,
  LifeBuoy,
  MapPin,
  Search,
  Shirt,
  Sparkles,
  Store,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { FilterTabs, StatCard } from '@/components/admin/ui/AdminPrimitives';
import { relativeTime } from '@/lib/notificationHelpers';
import { useAdminNotificationStore } from '@/store/useAdminNotificationStore';

const CATEGORY_TABS = [
  { value: '', label: 'All Alerts' },
  { value: 'applications', label: 'Shop Applications' },
  { value: 'branches', label: 'Branch Locations' },
  { value: 'upgrades', label: 'Plan Payments' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'apparel', label: 'Apparel Categories' },
  { value: 'support', label: 'Support Tickets' },
];

export default function AdminNotificationsPage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const {
    notifications,
    counts,
    unreadCount,
    markAllAsRead,
    markAsRead,
  } = useAdminNotificationStore();

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (category && item.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMessage = item.message.toLowerCase().includes(q);
        const matchesDetail = item.detail ? item.detail.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesMessage && !matchesDetail) return false;
      }
      return true;
    });
  }, [notifications, category, search]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'applications':
        return <Store size={18} className="text-amber-700" />;
      case 'branches':
        return <MapPin size={18} className="text-sky-700" />;
      case 'upgrades':
        return <CreditCard size={18} className="text-emerald-700" />;
      case 'subscriptions':
        return <Sparkles size={18} className="text-purple-700" />;
      case 'apparel':
        return <Shirt size={18} className="text-indigo-700" />;
      case 'support':
        return <LifeBuoy size={18} className="text-rose-700" />;
      default:
        return <FileCheck2 size={18} className="text-taupe" />;
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Notifications & Alerts"
          description="Platform events, merchant shop applications, branch verifications, and subscription updates."
        />
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sunken shadow-2xs transition-colors"
          >
            <CheckCheck size={16} className="text-sage" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Overview queue stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/admin/applications" className="block hover:opacity-90">
          <StatCard
            label="Pending Applications"
            value={counts.applications}
            hint={counts.applications ? 'Waiting for review' : 'All caught up'}
          />
        </Link>
        <Link href="/admin/branches" className="block hover:opacity-90">
          <StatCard
            label="Branches to check"
            value={counts.branches}
            hint={counts.branches ? 'Pins waiting' : 'All caught up'}
          />
        </Link>
        <Link href="/admin/upgrades" className="block hover:opacity-90">
          <StatCard
            label="Plan Payments"
            value={counts.upgrades}
            hint={counts.upgrades ? 'Receipts waiting' : 'All caught up'}
          />
        </Link>
        <Link href="/admin/tickets" className="block hover:opacity-90">
          <StatCard
            label="Open Tickets"
            value={counts.tickets}
            hint={counts.tickets ? 'Requires attention' : 'All resolved'}
          />
        </Link>
      </div>

      {/* Filters and search */}
      <div className="space-y-4">
        <FilterTabs
          options={CATEGORY_TABS}
          value={category}
          onChange={(val) => setCategory(val)}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search notifications or shop names..."
            className="sm:max-w-md"
          />
          <p className="text-xs text-ink-muted">
            Showing <strong className="text-ink">{filtered.length}</strong> of{' '}
            {notifications.length} alerts
          </p>
        </div>
      </div>

      {/* Notifications list */}
      <div className="border-2 border-line-strong bg-surface rounded-xl overflow-hidden shadow-2xs">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-ink-muted">
              <Bell size={22} />
            </div>
            <p className="text-base font-semibold text-ink">No alerts match your criteria</p>
            <p className="mt-1 text-sm text-ink-muted">
              All platform review queues and subscription updates are up to date.
            </p>
          </div>
        ) : (
          <ul className="divide-y-2 divide-line-strong">
            {filtered.map((item) => {
              const isRead = !!item.read_at;
              return (
                <li
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-canvas ${
                    !isRead ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`relative shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border ${getCategoryBg(
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
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-body">
                            {item.badge}
                          </span>
                        )}
                        {!isRead && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-500/30">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-ink">{item.message}</p>
                      {item.detail && (
                        <p className="mt-0.5 text-xs text-ink-muted">{item.detail}</p>
                      )}
                      <p className="mt-1.5 text-xs text-ink-faint">
                        {relativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => void markAsRead(item.id)}
                      title={isRead ? 'Already marked as read' : 'Mark as read'}
                      aria-label="Mark notification as read"
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isRead
                          ? 'text-ink-muted hover:bg-sunken'
                          : 'text-taupe bg-sunken hover:bg-line-strong'
                      }`}
                    >
                      <Check size={14} className="inline mr-1" />
                      {isRead ? 'Read' : 'Mark read'}
                    </button>

                    <Link
                      href={item.link}
                      onClick={() => void markAsRead(item.id)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-ink-body transition-colors"
                    >
                      <span>{item.action_label ?? 'Review'}</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
