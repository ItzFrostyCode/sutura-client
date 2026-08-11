export interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_picture?: string;
  suki_tag?: string | null;
  shop_notes?: string | null;
  total_spend?: number;
  active_jobs?: number;
  completed_jobs?: number;
  created_at: string;
}

export interface MeasurementProfile {
  id: number;
  profile_name: string;
  metrics: Record<string, number | string>;
  customer: { id: number; name: string };
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobOrder {
  id: number;
  order_number: string;
  intake_channel: 'walk_in' | 'online';
  fulfillment_type: 'pickup';
  status: string;
  payment_status: string;
  total_amount: string | number;
  balance: string | number;
  due_date: string | null;
  shop_branch_id?: number | null;
  service?: { name: string };
  customer?: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: number;
  status: string;
  scheduled_at: string;
  notes?: string;
  shop_branch_id?: number | null;
  service?: { name: string };
  customer?: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
}

export interface MetricRow {
  key: string;
  value: string;
}
