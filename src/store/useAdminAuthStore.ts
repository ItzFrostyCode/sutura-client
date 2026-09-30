import { create } from 'zustand';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from '@/lib/adminApi';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
}

interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  hydrated: boolean;
  setSession: (user: AdminUser, token: string) => void;
  clear: () => void;
  hydrate: () => void;
}

// Separate from useAuthStore on purpose — see adminApi.ts. Starts logged
// out for SSR; AdminShell calls hydrate() after mount.
export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  setSession: (user, token) => {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    set({ user, token, hydrated: true });
  },

  clear: () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
    set({ user: null, token: null, hydrated: true });
  },

  hydrate: () => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    let user: AdminUser | null = null;
    try {
      const raw = sessionStorage.getItem(ADMIN_USER_KEY);
      if (raw) user = JSON.parse(raw);
    } catch { /* corrupt entry — treated as signed out */ }
    set({ token, user: token ? user : null, hydrated: true });
  },
}));
