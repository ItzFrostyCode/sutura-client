'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  List as ListIcon,
  X,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import NotificationDetailModal from '@/components/notifications/NotificationDetailModal';
import api from '@/lib/axios';
import {
  AppNotification,
  getSenderInfo,
  formatDateTime,
} from '@/lib/notificationHelpers';

interface PreferenceItem {
  id: string;
  event: string;
  email: boolean;
  mobile: boolean;
}

function NotificationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab state: 'list' | 'configure'
  const activeTab = searchParams.get('tab') === 'configure' ? 'configure' : 'list';

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Modal inspection state (Screenshot 3 Reference)
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  // Clear all confirmation
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);

  // Configure Preferences State (Screenshot 5 Reference)
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSavedMessage, setPrefsSavedMessage] = useState<string | null>(null);

  // ── Fetch Notifications ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(
    async (page = 1, search = '') => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(perPage));
        if (search.trim()) params.set('search', search.trim());

        const res = await api.get(`/notifications?${params.toString()}`);
        const items: AppNotification[] = Array.isArray(res.data?.data)
          ? res.data.data
          : res.data?.data?.data ?? [];

        setNotifications(items);
        setCurrentPage(res.data?.meta?.current_page ?? page);
        setLastPage(res.data?.meta?.last_page ?? 1);
        setTotalCount(res.data?.meta?.total ?? items.length);
        if (typeof res.data?.unread_count === 'number') {
          setUnreadCount(res.data.unread_count);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    },
    [perPage]
  );

  useEffect(() => {
    if (activeTab === 'list') {
      void fetchNotifications(currentPage, searchQuery);
    }
  }, [activeTab, currentPage, searchQuery, fetchNotifications]);

  // ── Fetch Preferences (for Configure tab) ────────────────────────────────
  const fetchPreferences = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const res = await api.get('/notifications/preferences');
      if (Array.isArray(res.data?.data)) {
        setPreferences(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch preferences', err);
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'configure') {
      void fetchPreferences();
    }
  }, [activeTab, fetchPreferences]);

  // ── Tab Navigation ───────────────────────────────────────────────────────
  const switchTab = (tab: 'list' | 'configure') => {
    if (tab === 'configure') {
      router.push('/dashboard/notifications?tab=configure');
    } else {
      router.push('/dashboard/notifications');
    }
  };

  // ── Checkbox Selection ───────────────────────────────────────────────────
  const isAllSelected =
    notifications.length > 0 &&
    notifications.every(n => selectedIds.includes(n.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // ── Bulk Mark as Read ────────────────────────────────────────────────────
  const handleBulkRead = async () => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await api.post('/notifications/bulk-read', { ids: selectedIds });
      setNotifications(prev =>
        prev.map(n =>
          selectedIds.includes(n.id)
            ? { ...n, read_at: n.read_at ?? new Date().toISOString() }
            : n
        )
      );
      setSelectedIds([]);
      void fetchNotifications(currentPage, searchQuery);
    } catch (err) {
      console.error('Failed bulk mark read', err);
    } finally {
      setBulkBusy(false);
    }
  };

  // ── Bulk Delete ──────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await api.post('/notifications/bulk-delete', { ids: selectedIds });
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      void fetchNotifications(currentPage, searchQuery);
    } catch (err) {
      console.error('Failed bulk delete', err);
    } finally {
      setBulkBusy(false);
    }
  };

  // ── Clear All Notifications ──────────────────────────────────────────────
  const handleClearAll = async () => {
    setClearBusy(true);
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
      setSelectedIds([]);
      setIsClearDialogOpen(false);
    } catch (err) {
      console.error('Failed clear all notifications', err);
    } finally {
      setClearBusy(false);
    }
  };

  // ── Row Click -> Open Modal (Screenshot 3 Reference) ─────────────────────
  const handleOpenDetailModal = (notif: AppNotification) => {
    // Optimistically mark as read
    if (!notif.read_at) {
      void api.post(`/notifications/${notif.id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(c => Math.max(0, c - 1));
    }
    setSelectedNotif(notif);
  };

  // ── Save Preferences (Screenshot 5 Reference) ────────────────────────────
  const handleSavePreferences = async () => {
    setPrefsSaving(true);
    setPrefsSavedMessage(null);
    try {
      await api.post('/notifications/preferences', { preferences });
      setPrefsSavedMessage('Notification preferences successfully saved.');
      setTimeout(() => setPrefsSavedMessage(null), 3500);
    } catch (err) {
      console.error('Failed to save preferences', err);
    } finally {
      setPrefsSaving(false);
    }
  };

  const togglePref = (id: string, channel: 'email' | 'mobile') => {
    setPreferences(prev =>
      prev.map(item => (item.id === id ? { ...item, [channel]: !item[channel] } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header with Tab Pills & Clear Button ── */}
      <PageHeader
        eyebrow="ALERTS & ACTIVITY"
        title="Notifications"
        description="Review your order activity, customer appointments, and pickup notifications."
        actions={
          activeTab === 'list' && totalCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsClearDialogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 border border-danger/25 rounded-xl transition-colors"
              title="Clear all notifications"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          ) : null
        }
      >
        {/* Navigation Tabs (Screenshot 2 / 5 Reference) */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto hide-scrollbar">
          <button
            type="button"
            onClick={() => switchTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors shrink-0 ${
              activeTab === 'list'
                ? 'bg-taupe text-white'
                : 'bg-surface text-ink-body hover:bg-sunken border border-line'
            }`}
          >
            <ListIcon size={14} />
            <span>List</span>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                activeTab === 'list' ? 'bg-white/25 text-white' : 'bg-sunken text-ink-muted'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('configure')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors shrink-0 ${
              activeTab === 'configure'
                ? 'bg-taupe text-white'
                : 'bg-surface text-ink-body hover:bg-sunken border border-line'
            }`}
          >
            <Settings size={14} />
            <span>Configure</span>
          </button>
        </div>
      </PageHeader>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: LIST VIEW (Screenshot 2 Reference) ─────────────────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Action Toolbar - clean flat flex row, no outer boxed card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left: Bulk Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBulkRead}
                disabled={selectedIds.length === 0 || bulkBusy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-line bg-surface hover:bg-sunken text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <CheckCheck size={14} className="text-sage" />
                <span>Mark as read</span>
                {selectedIds.length > 0 && (
                  <span className="ml-1 text-[10px] bg-sunken px-1.5 py-0.5 rounded-full font-bold">
                    ({selectedIds.length})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0 || bulkBusy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-line bg-surface hover:bg-danger/10 text-danger transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <Trash2 size={14} />
                <span>Delete</span>
                {selectedIds.length > 0 && (
                  <span className="ml-1 text-[10px] bg-danger/10 px-1.5 py-0.5 rounded-full font-bold">
                    ({selectedIds.length})
                  </span>
                )}
              </button>
            </div>

            {/* Right: Search Filter */}
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={val => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table Surface */}
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={28} className="text-taupe animate-spin mb-3" />
                <p className="text-sm font-semibold text-ink">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4">
                <EmptyState
                  icon={Bell}
                  title={searchQuery ? 'No matching notifications' : 'No notifications yet'}
                  description={
                    searchQuery
                      ? 'Try adjusting your search query or clear the filter.'
                      : 'You are completely caught up! New orders, stage changes, and appointments will appear here.'
                  }
                  actionLabel={searchQuery ? 'Clear search' : undefined}
                  onAction={searchQuery ? () => setSearchQuery('') : undefined}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-line bg-[#FAF6F3]/75 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      {/* Checkbox */}
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all notifications"
                          className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                        />
                      </th>
                      {/* # Number */}
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      {/* From */}
                      <th className="py-3 px-4 w-52">From</th>
                      {/* Subject */}
                      <th className="py-3 px-4">Subject</th>
                      {/* Sent */}
                      <th className="py-3 px-4 w-40">Sent</th>
                      {/* Read? */}
                      <th className="py-3 px-4 w-20 text-center">Read?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {notifications.map((notif, index) => {
                      const sender = getSenderInfo(notif);
                      const isRead = !!notif.read_at;
                      const isSelected = selectedIds.includes(notif.id);
                      const rowNumber = (currentPage - 1) * perPage + index + 1;

                      return (
                        <tr
                          key={notif.id}
                          className={`hover:bg-[#FAF6F3] transition-colors group ${
                            isSelected ? 'bg-taupe/5' : !isRead ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(notif.id)}
                              aria-label={`Select notification ${notif.data?.title ?? ''}`}
                              className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                            />
                          </td>

                          {/* Index # */}
                          <td className="py-3.5 px-3 text-center text-xs font-semibold text-ink-muted">
                            {rowNumber}
                          </td>

                          {/* From Column */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-xs font-black text-taupe shrink-0 shadow-2xs">
                                {sender.initial}
                              </div>
                              <span className="font-semibold text-ink text-[13px] truncate">
                                {sender.name}
                              </span>
                            </div>
                          </td>

                          {/* Subject Column (Clickable -> Opens Modal from Screenshot 3) */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(notif)}
                              className="text-left font-medium text-[13px] text-[#0B7D8C] hover:text-[#096774] hover:underline cursor-pointer line-clamp-1 group-hover:underline transition-colors"
                            >
                              {notif.data?.title || notif.data?.message || 'Notification Update'}
                            </button>
                          </td>

                          {/* Sent Column */}
                          <td className="py-3.5 px-4 text-xs text-ink-muted whitespace-nowrap">
                            {formatDateTime(notif.created_at)}
                          </td>

                          {/* Read? Status Icon (Red ✕ if unread, Green ✓ if read) */}
                          <td className="py-3.5 px-4 text-center">
                            {isRead ? (
                              <span
                                className="inline-flex items-center justify-center text-emerald-600 font-bold text-sm"
                                title="Read"
                              >
                                ✓
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center justify-center text-danger font-bold text-sm"
                                title="Unread"
                              >
                                ✕
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls (Screenshot 2 Reference) */}
            {lastPage > 1 && (
              <div className="px-4 py-3 border-t border-line bg-[#FAF6F3]/50 flex items-center justify-between gap-3">
                <p className="text-xs text-ink-muted">
                  Page <strong className="text-ink">{currentPage}</strong> of{' '}
                  <strong className="text-ink">{lastPage}</strong> ({totalCount} total)
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-line bg-surface text-ink-body hover:bg-sunken disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: lastPage }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                        pageNum === currentPage
                          ? 'bg-taupe text-white'
                          : 'bg-surface text-ink hover:bg-sunken border border-line'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage >= lastPage}
                    onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                    className="p-1.5 rounded-lg border border-line bg-surface text-ink-body hover:bg-sunken disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: CONFIGURE PREFERENCES (Screenshot 5 Reference) ─────────────── */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'configure' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              Select the notifications that you want to receive an email copy or mobile notification of:
            </p>

            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={prefsSaving}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-xs font-bold bg-taupe hover:bg-taupe-hover text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              {prefsSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>{prefsSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>

          {prefsSavedMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check size={16} className="text-emerald-600 shrink-0" />
              <span>{prefsSavedMessage}</span>
            </div>
          )}

          {/* Configuration Matrix Table (Screenshot 5 Reference) */}
          <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
            {prefsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 size={28} className="text-taupe animate-spin mb-3" />
                <p className="text-sm font-semibold text-ink">Loading notification settings...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[550px]">
                  <thead>
                    <tr className="border-b border-line bg-[#FAF6F3]/75 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <th className="py-3 px-5 w-20 text-center">Email</th>
                      <th className="py-3 px-5 w-24 text-center">Mobile</th>
                      <th className="py-3 px-5">Event</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {preferences.map(item => (
                      <tr key={item.id} className="hover:bg-[#FAF6F3]/50 transition-colors">
                        {/* Email Checkbox */}
                        <td className="py-3.5 px-5 text-center">
                          <input
                            type="checkbox"
                            checked={item.email}
                            onChange={() => togglePref(item.id, 'email')}
                            aria-label={`Enable email for ${item.event}`}
                            className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                          />
                        </td>

                        {/* Mobile Checkbox */}
                        <td className="py-3.5 px-5 text-center">
                          <input
                            type="checkbox"
                            checked={item.mobile}
                            onChange={() => togglePref(item.id, 'mobile')}
                            aria-label={`Enable mobile for ${item.event}`}
                            className="w-4 h-4 rounded border-line text-taupe focus:ring-taupe cursor-pointer"
                          />
                        </td>

                        {/* Event Name */}
                        <td className="py-3.5 px-5 font-medium text-ink text-[13px]">
                          {item.event}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
          setTotalCount(c => Math.max(0, c - 1));
        }}
      />

      {/* ── Clear All Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={handleClearAll}
        tone="danger"
        title="Clear all notifications?"
        message="This will permanently remove all notifications from your history. This action cannot be undone."
        confirmLabel="Clear All"
        busy={clearBusy}
      />
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 size={32} className="text-taupe animate-spin mb-3" />
          <p className="text-sm font-semibold text-ink">Loading notifications hub...</p>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}
