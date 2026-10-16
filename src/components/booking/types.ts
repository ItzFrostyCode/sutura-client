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
  // Real functional taxonomy (Service::SERVICE_TYPES on the backend) — the
  // source of truth for whether this service is bulk/alteration/etc., not
  // the service's own display name.
  service_types?: string[] | null;
  min_order_qty?: number;
  // Same shape as ServiceField (components/services/serviceHelpers.tsx) —
  // duplicated here rather than imported since that module also pulls in
  // owner-dashboard-only dependencies the public booking bundle shouldn't carry.
  custom_fields?: { id: string; label: string; type: 'text' | 'number' | 'select' | 'radio' | 'checkbox'; required: boolean; options?: string[] }[] | null;
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
  booking_policy?: string | null;
  booking_questions?: string[] | null;
  max_appointments_per_day?: number | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }> | string | null;
  branches?: Branch[];
  services?: Service[];
  special_hours?: SpecialHour[];
  /** Minutes per purpose: one table on the server for online and walk-in. */
  durations?: Record<string, number>;
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
