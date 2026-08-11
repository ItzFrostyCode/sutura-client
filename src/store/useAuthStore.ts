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
  setAuth: (user: User, token: string, shop?: Shop, staffProfile?: StaffProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  shop: null,
  staffProfile: null,
  token: globalThis.window === undefined ? null : localStorage.getItem('sutura_token'),
  isAuthenticated: globalThis.window !== undefined && localStorage.getItem('sutura_token') !== null,
  
  setAuth: (user, token, shop, staffProfile) => {
    if (globalThis.window !== undefined) {
      localStorage.setItem('sutura_token', token);
    }
    set({ user, token, shop: shop || null, staffProfile: staffProfile || null, isAuthenticated: true });
  },

  logout: () => {
    if (globalThis.window !== undefined) {
      localStorage.removeItem('sutura_token');
    }
    set({ user: null, shop: null, staffProfile: null, token: null, isAuthenticated: false });
  },
}));
