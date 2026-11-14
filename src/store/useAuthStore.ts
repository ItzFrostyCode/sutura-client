import { create } from 'zustand';
import { clearAuth, migrateOldAuth, readAuth, writeAuth } from '@/lib/authStorage';
import { forgetAllAccounts } from '@/lib/savedAccounts';

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
  gender?: 'male' | 'female' | null;
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
  owner_id?: number;
  owner?: { id: number; name: string; email?: string } | null;
  name: string;
  slug: string;
  store_code?: string;
  /** The unit the shop measures in (inches or centimeters). */
  default_measurement_unit?: 'in' | 'cm';
  /** Whether orders need body measurements when neither the design nor its service says. */
  default_measurement_requirement?: 'none' | 'existing' | 'shop';
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
//
// One login per browser, shared by every tab (like Facebook) — see lib/authStorage.ts. Two different accounts at
// once need a private window or another browser. Tab sync lives in AuthHydrator.

const SIGNED_OUT = { user: null, store: null, staffProfile: null, token: null, isAuthenticated: false, hydrated: true } as const;

// Lists a page kept in this tab for quick reopening (e.g. Appointments) belong to the account that signed out.
export function clearTabCaches() {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith('sutura_appts:')) sessionStorage.removeItem(k);
  } catch {
    // Storage blocked
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  store: null,
  staffProfile: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user, token, store, staffProfile) => {
    if (globalThis.window !== undefined) writeAuth({ token, user, store: store ?? null, staffProfile: staffProfile ?? null });
    set({ user, token, store: store || null, staffProfile: staffProfile || null, isAuthenticated: true, hydrated: true });
  },

  logout: () => {
    if (globalThis.window !== undefined) {
      clearAuth(get().token);
      clearTabCaches();
      // Log out means out of every account this browser remembers (Log in as Shop Owner), not just this one.
      forgetAllAccounts();
    }
    set(SIGNED_OUT);
  },

  hydrate: () => {
    if (globalThis.window === undefined) return;
    migrateOldAuth();
    const saved = readAuth();
    set(saved
      ? { token: saved.token, user: saved.user, store: saved.store, staffProfile: saved.staffProfile, isAuthenticated: true, hydrated: true }
      : SIGNED_OUT);
  },
}));
