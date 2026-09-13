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
  shop_branch_id?: number | null;
  is_branch_manager?: boolean;
  is_active?: boolean;
  is_available?: boolean;
  shop?: Shop;
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

const getInitialAuthState = (): {
  user: User | null;
  shop: Shop | null;
  staffProfile: StaffProfile | null;
  token: string | null;
  isAuthenticated: boolean;
} => {
  if (globalThis.window === undefined) {
    return { user: null, shop: null, staffProfile: null, token: null, isAuthenticated: false };
  }
  const token = localStorage.getItem('sutura_token');
  let user: User | null = null;
  let shop: Shop | null = null;
  let staffProfile: StaffProfile | null = null;
  try {
    const rawUser = localStorage.getItem('sutura_user');
    if (rawUser) user = JSON.parse(rawUser);
    const rawShop = localStorage.getItem('sutura_shop');
    if (rawShop) shop = JSON.parse(rawShop);
    const rawStaff = localStorage.getItem('sutura_staff_profile');
    if (rawStaff) staffProfile = JSON.parse(rawStaff);
  } catch {
    // Ignore JSON parsing errors
  }
  return {
    user,
    shop,
    staffProfile,
    token,
    isAuthenticated: token !== null,
  };
};

const initialAuth = getInitialAuthState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  shop: initialAuth.shop,
  staffProfile: initialAuth.staffProfile,
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  
  setAuth: (user, token, shop, staffProfile) => {
    if (globalThis.window !== undefined) {
      localStorage.setItem('sutura_token', token);
      localStorage.setItem('sutura_user', JSON.stringify(user));
      if (shop) {
        localStorage.setItem('sutura_shop', JSON.stringify(shop));
      } else {
        localStorage.removeItem('sutura_shop');
      }
      if (staffProfile) {
        localStorage.setItem('sutura_staff_profile', JSON.stringify(staffProfile));
      } else {
        localStorage.removeItem('sutura_staff_profile');
      }
    }
    set({ user, token, shop: shop || null, staffProfile: staffProfile || null, isAuthenticated: true });
  },

  logout: () => {
    if (globalThis.window !== undefined) {
      localStorage.removeItem('sutura_token');
      localStorage.removeItem('sutura_user');
      localStorage.removeItem('sutura_shop');
      localStorage.removeItem('sutura_staff_profile');
    }
    set({ user: null, shop: null, staffProfile: null, token: null, isAuthenticated: false });
  },
}));
