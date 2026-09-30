import { create } from 'zustand';

export interface UserSocialLink {
  label: string;
  url: string;
}

export interface UserExperience {
  title: string;
  company: string;
  duration: string;
}

export interface UserEducation {
  degree: string;
  school: string;
  year: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_picture?: string;
  cover_photo?: string;
  roles: { id: number; name: string }[];
  /** Admin-issued temporary password not yet replaced (shop accounts). */
  must_change_password?: boolean;
  bio?: string;
  skills?: string[];
  social_links?: UserSocialLink[];
  experience?: UserExperience[];
  education?: UserEducation[];
  creations_gallery?: string[];
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  store_code?: string;
  status: string;
  rejection_reason?: string | null;
  business_type?: string;
  repair_requires_downpayment?: boolean;
  fitting_limit_policy?: 'fee' | 'block';
  description?: string;
  address?: string;
  landmark?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  logo_path?: string;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }>;
  active_special_hours?: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
  } | null;
  special_hours?: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
  }>;
  social_links?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  gcash_number?: string | null;
  gcash_account_name?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  gcash_qr_path?: string | null;
  bank_qr_path?: string | null;
}

export interface StaffProfile {
  id: number;
  user_id?: number;
  role: string;
  additional_roles?: string[];
  specialization?: string[];
  bio?: string | null;
  store_branch_id?: number | null;
  is_branch_manager?: boolean;
  is_active?: boolean;
  is_available?: boolean;
  store?: Store;
}

interface AuthState {
  user: User | null;
  store: Store | null;
  staffProfile: StaffProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setAuth: (user: User, token: string, store?: Store, staffProfile?: StaffProfile) => void;
  logout: () => void;
  hydrate: () => void;
}

// Initial state is ALWAYS the SSR-safe "logged out" shape, even on the
// client — reading localStorage synchronously here made the client's very
// first paint diverge from the server-rendered HTML whenever a token was already
// stored, causing React hydration mismatches. `hydrate()` is called once from
// a client-only effect (see AuthHydrator.tsx) so auth state updates safely post-mount.
// Each browser tab is its own login. Auth used to be mirrored into localStorage, which every tab
// shares — so signing in as a shop owner in one tab and a customer in another overwrote each other,
// and a fresh tab or a browser restart woke up as whichever account signed in last. These keys are
// only ever removed now (old builds may have left them behind).
function clearLegacySharedAuth() {
  if (globalThis.window === undefined) return;
  for (const key of ['sutura_token', 'sutura_user', 'sutura_store', 'sutura_staff_profile']) localStorage.removeItem(key);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  store: null,
  staffProfile: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user, token, store, staffProfile) => {
    if (globalThis.window !== undefined) {
      sessionStorage.setItem('sutura_token', token);
      sessionStorage.setItem('sutura_user', JSON.stringify(user));
      if (store) sessionStorage.setItem('sutura_store', JSON.stringify(store));
      else sessionStorage.removeItem('sutura_store');
      if (staffProfile) sessionStorage.setItem('sutura_staff', JSON.stringify(staffProfile));
      else sessionStorage.removeItem('sutura_staff');

    }
    set({ user, token, store: store || null, staffProfile: staffProfile || null, isAuthenticated: true, hydrated: true });
  },

  logout: () => {
    if (globalThis.window !== undefined) {
      sessionStorage.removeItem('sutura_token');
      sessionStorage.removeItem('sutura_user');
      sessionStorage.removeItem('sutura_store');
      sessionStorage.removeItem('sutura_staff');
      clearLegacySharedAuth();
    }
    set({ user: null, store: null, staffProfile: null, token: null, isAuthenticated: false, hydrated: true });
  },

  hydrate: () => {
    if (globalThis.window === undefined) return;
    clearLegacySharedAuth();
    const token = sessionStorage.getItem('sutura_token');
    const userStr = sessionStorage.getItem('sutura_user');
    const storeStr = sessionStorage.getItem('sutura_store');
    const staffStr = sessionStorage.getItem('sutura_staff');
    let user: User | null = null;
    let store: Store | null = null;
    let staffProfile: StaffProfile | null = null;
    try { if (userStr) user = JSON.parse(userStr); } catch {}
    try { if (storeStr) store = JSON.parse(storeStr); } catch {}
    try { if (staffStr) staffProfile = JSON.parse(staffStr); } catch {}
    set({
      token,
      user,
      store,
      staffProfile,
      isAuthenticated: token !== null,
      hydrated: true,
    });
  },
}));
