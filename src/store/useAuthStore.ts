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
  business_type?: string;
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

      localStorage.setItem('sutura_token', token);
      localStorage.setItem('sutura_user', JSON.stringify(user));
      if (store) localStorage.setItem('sutura_store', JSON.stringify(store));
      else localStorage.removeItem('sutura_store');
      if (staffProfile) localStorage.setItem('sutura_staff_profile', JSON.stringify(staffProfile));
      else localStorage.removeItem('sutura_staff_profile');
    }
    set({ user, token, store: store || null, staffProfile: staffProfile || null, isAuthenticated: true, hydrated: true });
  },

  logout: () => {
    if (globalThis.window !== undefined) {
      sessionStorage.removeItem('sutura_token');
      sessionStorage.removeItem('sutura_user');
      sessionStorage.removeItem('sutura_store');
      sessionStorage.removeItem('sutura_staff');
      localStorage.removeItem('sutura_token');
      localStorage.removeItem('sutura_user');
      localStorage.removeItem('sutura_store');
      localStorage.removeItem('sutura_staff_profile');
    }
    set({ user: null, store: null, staffProfile: null, token: null, isAuthenticated: false, hydrated: true });
  },

  hydrate: () => {
    if (globalThis.window === undefined) return;
    const token = sessionStorage.getItem('sutura_token') || localStorage.getItem('sutura_token');
    const userStr = sessionStorage.getItem('sutura_user') || localStorage.getItem('sutura_user');
    const storeStr = sessionStorage.getItem('sutura_store') || localStorage.getItem('sutura_store');
    const staffStr = sessionStorage.getItem('sutura_staff') || localStorage.getItem('sutura_staff_profile');
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
