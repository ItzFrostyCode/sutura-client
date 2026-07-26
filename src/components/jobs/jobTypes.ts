export interface RosterItem {
  name: string;
  print_name?: string;
  number?: string | number;
  size: string;
}

export interface Payment {
  id: number;
  amount: string | number;
  payment_method: string;
  reference?: string | null;
  receipt_path?: string | null;
  created_at: string;
  notes?: string;
  recorded_by?: { name: string; id: number };
  rejected_at?: string | null;
  rejected_reason?: string | null;
  rejected_by?: { name: string; id: number } | null;
}

export interface Job {
  id: number;
  order_number: string;
  intake_channel: string;
  fulfillment_type: string;
  status: string;
  payment_status: string;
  balance: number | string;
  total_amount: number | string;
  notes?: string;
  deadline?: string;
  due_date?: string;
  courier_name?: string;
  courier_tracking_number?: string;
  shipping_address?: string;
  customer?: { name: string; id: number; suki_tag?: string | null };
  service?: { name: string; id: number; service_type?: string | null };
  assigned_staff?: { name: string; id: number };
  staff_stages?: { id: number; pivot: { stage: string; completed_at?: string } }[];
  custom_order_data?: Record<string, unknown> | null;
  payments?: Payment[];
  is_outsourced?: boolean;
  partner_shop_name?: string | null;
  outsourcing_cost?: number | string | null;
  is_rush?: boolean;
  rush_fee?: number | string;
  completion_photo_url?: string | null;
  reference_images?: string[] | null;
  reference_link?: string | null;
  material_source?: 'shop_supplied' | 'customer_supplied' | null;
  rejection_reason?: string | null;
  cancellation_reason?: string | null;
  hold_reason?: string | null;
  discount_amount?: number | string | null;
  customer_job_count?: number;
  garment_category?: 'barong' | 'gown' | 'suit' | 'filipiniana' | 'uniform' | 'lab_gown' | 'scrub_suit' | 'corporate_wear' | null;
  progress_photos?: { url: string; stage: string; uploaded_at: string }[] | null;
  measurement?: {
    id: number;
    profile_name: string;
    metrics: Record<string, number | string>;
    notes?: string | null;
  } | null;
  catalog_item?: {
    id: number;
    name: string;
    fabric_image_url?: string | null;
    images?: { id: number; image_url: string; is_primary: boolean }[];
  } | null;
}

export interface Staff {
  id: number;
  role: string;
  additional_roles?: string[] | null;
  specialization?: string | string[];
  user: {
    id: number;
    name: string;
    email: string;
  };
}
