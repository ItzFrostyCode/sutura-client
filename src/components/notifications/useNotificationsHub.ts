'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import type { AppNotification } from '@/lib/notificationHelpers';
import type { PreferenceItem } from './notificationTypes';
import { useOptionalBranch } from '@/context/BranchContext';

export function useNotificationsHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Same branch scope as the bell (see NotificationBell).
  const selectedBranchId = useOptionalBranch()?.selectedBranchId ?? null;
  const branchParams = selectedBranchId === null ? undefined : { branch_id: selectedBranchId };

  const activeTab: 'list' | 'configure' = searchParams.get('tab') === 'configure' ? 'configure' : 'list';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);

  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSavedMessage, setPrefsSavedMessage] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (page = 1, search = '') => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', String(perPage));
        if (search.trim()) params.set('search', search.trim());
        if (selectedBranchId !== null) params.set('branch_id', String(selectedBranchId));

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
    [perPage, selectedBranchId]
  );

  useEffect(() => { setCurrentPage(1); }, [selectedBranchId]);

  useEffect(() => {
    if (activeTab === 'list') {
      void fetchNotifications(currentPage, searchQuery);
    }
  }, [activeTab, currentPage, searchQuery, fetchNotifications]);

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

  const switchTab = (tab: 'list' | 'configure') => {
    if (tab === 'configure') {
      router.push('/dashboard/notifications?tab=configure');
    } else {
      router.push('/dashboard/notifications');
    }
  };

  const isAllSelected =
    notifications.length > 0 &&
    notifications.every((n) => selectedIds.includes(n.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkRead = async () => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await api.post('/notifications/bulk-read', { ids: selectedIds });
      setNotifications((prev) =>
        prev.map((n) =>
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

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await api.post('/notifications/bulk-delete', { ids: selectedIds });
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      setSelectedIds([]);
      void fetchNotifications(currentPage, searchQuery);
    } catch (err) {
      console.error('Failed bulk delete', err);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleClearAll = async () => {
    setClearBusy(true);
    try {
      await api.delete('/notifications/clear-all', { params: branchParams });
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

  const handleOpenDetailModal = (notif: AppNotification) => {
    if (!notif.read_at) {
      void api.post(`/notifications/${notif.id}/read`, null, { params: branchParams });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setSelectedNotif(notif);
  };

  const handleDeleteDetailNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
  };

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
    setPreferences((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [channel]: !item[channel] } : item))
    );
  };

  return {
    activeTab,
    switchTab,
    notifications,
    totalCount,
    unreadCount,
    loading,
    currentPage,
    lastPage,
    setCurrentPage,
    perPage,
    searchQuery,
    setSearchQuery,
    selectedIds,
    bulkBusy,
    isAllSelected,
    toggleSelectAll,
    toggleSelectOne,
    handleBulkRead,
    handleBulkDelete,
    selectedNotif,
    setSelectedNotif,
    handleOpenDetailModal,
    handleDeleteDetailNotif,
    isClearDialogOpen,
    setIsClearDialogOpen,
    clearBusy,
    handleClearAll,
    preferences,
    prefsLoading,
    prefsSaving,
    prefsSavedMessage,
    togglePref,
    handleSavePreferences,
  };
}
