import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

export interface AdminNotificationItem {
  id: string;
  type: string;
  category: 'applications' | 'branches' | 'upgrades' | 'subscriptions' | 'apparel' | 'support';
  title: string;
  message: string;
  detail: string | null;
  link: string;
  action_label?: string;
  created_at: string;
  badge?: string;
  severity?: 'amber' | 'blue' | 'emerald' | 'purple' | 'indigo' | 'rose';
  read_at: string | null;
}

export interface AdminPendingCounts {
  applications: number;
  branches: number;
  upgrades: number;
  apparel: number;
  tickets: number;
  total_pending: number;
}

interface AdminNotificationState {
  notifications: AdminNotificationItem[];
  unreadCount: number;
  counts: AdminPendingCounts;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useAdminNotificationStore = create<AdminNotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  counts: {
    applications: 0,
    branches: 0,
    upgrades: 0,
    apparel: 0,
    tickets: 0,
    total_pending: 0,
  },
  loading: false,
  error: null,

  fetchNotifications: async () => {
    try {
      const res = await adminApi.get('/admin/notifications');
      if (res.data?.success && res.data?.data) {
        set({
          notifications: res.data.data.notifications ?? [],
          unreadCount: res.data.data.unread_count ?? 0,
          counts: res.data.data.counts ?? {
            applications: 0,
            branches: 0,
            upgrades: 0,
            apparel: 0,
            tickets: 0,
            total_pending: 0,
          },
          loading: false,
          error: null,
        });
      }
    } catch {
      set({ loading: false, error: 'Failed to load notifications' });
    }
  },

  markAllAsRead: async () => {
    const current = get().notifications;
    const nowIso = new Date().toISOString();
    // Optimistic update
    set({
      unreadCount: 0,
      notifications: current.map((n) => ({ ...n, read_at: n.read_at ?? nowIso })),
    });

    try {
      await adminApi.post('/admin/notifications/mark-all-read');
    } catch {
      // Refresh on failure
      void get().fetchNotifications();
    }
  },

  markAsRead: async (id: string) => {
    const current = get().notifications;
    const target = current.find((n) => n.id === id);
    if (!target || target.read_at) return;

    const nowIso = new Date().toISOString();
    // Optimistic update
    set({
      unreadCount: Math.max(0, get().unreadCount - 1),
      notifications: current.map((n) => (n.id === id ? { ...n, read_at: nowIso } : n)),
    });

    try {
      await adminApi.post(`/admin/notifications/${id}/read`);
    } catch {
      // Revert on failure
      void get().fetchNotifications();
    }
  },
}));
