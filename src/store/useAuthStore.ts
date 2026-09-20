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

export interface Shop {
  id: number;
  name: string;
  slug: string;
  shop_code?: string;
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
  role: string;
  shop?: Shop;
  is_available?: boolean;
}

interface AuthState {
  user: User | null;
  shop: Shop | null;
  staffProfile: StaffProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setAuth: (user: User, token: string, shop?: Shop, staffProfile?: StaffProfile) => void;
  logout: () => void;
  hydrate: () => void;
}

// Initial state is ALWAYS the SSR-safe "logged out" shape, even on the
// client — reading localStorage synchronously here (as this used to do)
// made the client's very first paint diverge from the server-rendered HTML
// whenever a token was already stored, which is exactly a React hydration
// mismatch, not just a later state update. `hydrate()` is called once from
// a client-only effect (see useAuthHydration.ts) so the *real* auth state
// only ever lands via a normal post-mount re-render, never during the
// hydration pass itself.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  shop: null,
  staffProfile: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user, token, shop, staffProfile) => {
    if (globalThis.window !== undefined) {
      sessionStorage.setItem('sutura_token', token);
      sessionStorage.setItem('sutura_user', JSON.stringify(user));
      if (shop) sessionStorage.setItem('sutura_shop', JSON.stringify(shop));
      else sessionStorage.removeItem('sutura_shop');
      if (staffProfile) sessionStorage.setItem('sutura_staff', JSON.stringify(staffProfile));
      else sessionStorage.removeItem('sutura_staff');
    }
    set({ user, token, shop: shop || null, staffProfile: staffProfile || null, isAuthenticated: true, hydrated: true });
  },

  logout: () => {
    if (globalThis.window !== undefined) {
      sessionStorage.removeItem('sutura_token');
      sessionStorage.removeItem('sutura_user');
      sessionStorage.removeItem('sutura_shop');
      sessionStorage.removeItem('sutura_staff');
    }
    set({ user: null, shop: null, staffProfile: null, token: null, isAuthenticated: false, hydrated: true });
  },

  hydrate: () => {
    if (globalThis.window === undefined) return;
    const token = sessionStorage.getItem('sutura_token');
    const userStr = sessionStorage.getItem('sutura_user');
    const shopStr = sessionStorage.getItem('sutura_shop');
    const staffStr = sessionStorage.getItem('sutura_staff');
    let user: User | null = null;
    let shop: Shop | null = null;
    let staffProfile: StaffProfile | null = null;
    try { if (userStr) user = JSON.parse(userStr); } catch {}
    try { if (shopStr) shop = JSON.parse(shopStr); } catch {}
    try { if (staffStr) staffProfile = JSON.parse(staffStr); } catch {}
    set({
      token,
      user,
      shop,
      staffProfile,
      isAuthenticated: token !== null,
      hydrated: true,
    });
  },
}));
