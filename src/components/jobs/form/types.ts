import { CatalogItem } from '@/components/catalog/catalogHelpers';

export interface CustomerData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface ServiceData {
  id: number;
  name: string;
  category?: string;
  service_type?: 'custom_tailoring' | 'bulk_sublimation' | 'fashion_bridal' | 'alteration_repair' | null;
  base_price?: string | number;
  min_order_qty?: number;
  custom_fields?: ServiceField[] | null;
  tags?: string[];
  estimated_days?: number | null;
}

export interface StaffData {
  id: number;
  user: {
    id: number;
    name: string;
  };
  role: string;
  additional_roles?: string[] | null;
}

export interface CustomerMeasurement {
  id: number;
  profile_name: string;
  updated_at: string;
  metrics?: Record<string, string | undefined>;
  notes?: string | null;
  superseded_at?: string | null;
  version?: number;
}

export interface RosterMember {
  id: string;
  name: string;
  print_name: string;
  number: string;
  size: string;
}

export interface JobCreateFormData {
  customer_id: string;
  service_id: string;
  measurement_id: string;
  total_amount: string;
  downpayment: string;
  due_date: string;
  notes: string;
  po_number: string;
  is_outsourced: boolean;
  partner_shop_name: string;
  outsourcing_cost: string;
  is_rush: boolean;
  rush_fee: string;
  material_source: 'shop_supplied' | 'customer_supplied';
  garment_category: '' | 'barong' | 'gown' | 'suit' | 'filipiniana' | 'uniform' | 'lab_gown' | 'scrub_suit' | 'corporate_wear' | 'alteration_repair';
  discount_amount?: string;
  discount_reason?: string;
}
