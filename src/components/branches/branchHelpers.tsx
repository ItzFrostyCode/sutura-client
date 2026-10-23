import { formatAddress } from '@/lib/formatAddress';
import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface BranchManagerUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  profile_picture?: string | null;
}

export interface BranchManager {
  id: number;
  role: string;
  user?: BranchManagerUser | null;
}

export interface StoreBranch {
  id: number;
  slug?: string;
  name: string;
  address: string;
  landmark?: string | null;
  barangay?: string | null;
  city: string;
  district?: string | null;
  contact_number?: string | null;
  is_main?: boolean | number;
  latitude?: string | null;
  longitude?: string | null;
  operating_hours?: string | null;
  status?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
  verification_note?: string | null;
  staff_profiles_count?: number;
  job_orders_count?: number;
  guide_image_url?: string | null;
  manager?: BranchManager | null;
  manager_id?: number | null;
}

export interface BranchFormData {
  name: string;
  address: string;
  landmark: string;
  barangay: string;
  city: string;
  district: string;
  contact_number: string;
  latitude: string;
  longitude: string;
  operating_hours: string;
  status: string;
  guide_image_url: string;
  /** Shown only while editing: who manages the branch now. */
  manager_current: string;
  /** 'new' = create a login, 'pick' = promote existing staff, 'none' = no manager yet. */
  manager_mode: 'new' | 'pick' | 'none';
  /** Staff profile id when manager_mode === 'pick'. */
  manager_staff_id: string;
  /** A new branch manager's login, made right here by the owner. */
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  manager_password: string;
  manager_password_confirmation: string;
}

export const EMPTY_FORM: BranchFormData = {
  name: '',
  address: '',
  landmark: '',
  barangay: '',
  city: '',
  district: '',
  contact_number: '',
  latitude: '',
  longitude: '',
  operating_hours: '',
  status: 'active',
  guide_image_url: '',
  manager_current: '',
  manager_mode: 'none',
  manager_staff_id: '',
  manager_name: '',
  manager_email: '',
  manager_phone: '',
  manager_password: '',
  manager_password_confirmation: '',
};

export function StatusBadge({ status }: Readonly<{ status?: string }>) {
  if (status === 'active') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle size={11} className="fill-emerald-200" /> Active
      </span>
    );
  }
  if (status === 'inactive') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
        <XCircle size={11} /> Inactive
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <AlertCircle size={11} /> Pending Verification
    </span>
  );
}

export const getMapUrl = (branch: StoreBranch) => {
  if (branch.latitude && branch.longitude) {
    return `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    formatAddress(branch)
  )}`;
};
