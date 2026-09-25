import React from 'react';

export interface Branch {
  id: number;
  slug?: string;
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
}

export interface Service {
  id: number;
  name: string;
  base_price?: string | number;
  estimated_days?: number;
  description?: string | null;
}

export interface SpecialHour {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  special_open_time: string | null;
  special_close_time: string | null;
  announcement_message: string | null;
}

export interface StoreSettings {
  name: string;
  description?: string | null;
  business_type?: string | null;
  specializations?: string[] | null;
  gcash_number?: string | null;
  gcash_account_name?: string | null;
  gcash_qr_path?: string | null;
  paymaya_number?: string | null;
  paymaya_account_name?: string | null;
  paymaya_qr_path?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_qr_path?: string | null;
  fitting_fee?: number | string | null;
  booking_policy?: string | null;
  booking_questions?: string[] | null;
  max_appointments_per_day?: number | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }> | string | null;
  branches?: Branch[];
  services?: Service[];
  special_hours?: SpecialHour[];
}

export interface PackageInfo {
  id: number;
  name: string;
  bundle_price: string | null;
  services: { id: number; name: string; base_price: string | null }[];
}

export interface CalendarAppointment {
  scheduled_at: string;
  duration_minutes: number;
  store_branch_id: number | null;
}

export interface BookingCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface BookingTypeOption {
  value: string;
  label: string;
  duration: number;
  icon: React.ReactNode;
  hint: string;
}
