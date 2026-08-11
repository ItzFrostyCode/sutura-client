import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export interface ShopBranch {
  id: number;
  slug?: string;
  name: string;
  address: string;
  landmark?: string | null;
  city: string;
  contact_number: string | null;
  is_main: boolean;
  latitude?: string | null;
  longitude?: string | null;
  operating_hours?: string | null;
  status?: string;
  staff_profiles_count?: number;
  job_orders_count?: number;
  guide_image_url?: string | null;
}

export const EMPTY_FORM = {
  name: '',
  address: '',
  landmark: '',
  city: '',
  contact_number: '',
  latitude: '',
  longitude: '',
  operating_hours: '',
  status: 'active',
  guide_image_url: '',
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

export const getMapUrl = (branch: ShopBranch) => {
  if (branch.latitude && branch.longitude) {
    return `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${branch.address}, ${branch.city}`
  )}`;
};
