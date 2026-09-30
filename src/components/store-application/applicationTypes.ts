import type { SavedLocation } from '@/lib/customerLocation';

export type ApplicationStep = 1 | 2 | 3 | 4;
export type BillingCycle = 'monthly' | 'yearly';
export type PaymentMethod = 'gcash' | 'bank_transfer';

export const STEP_LABELS: Record<ApplicationStep, string> = {
  1: 'Owner',
  2: 'Shop',
  3: 'Documents',
  4: 'Plan',
};

export interface PublicPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: string;
  price_yearly: string;
  features: string[] | null;
}

export interface OwnerFields {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  birthday: string;
  email: string;
  contact_number: string;
}

export interface ShopFields {
  store_name: string;
  address: string;
  city: string;
  province: string;
  specializations: string[];
  location: SavedLocation | null;
}

/** Keys match the API's multipart field names. */
export type DocumentKey = 'landmark_image' | 'dti_registration' | 'tin_id' | 'brgy_clearance' | 'government_id' | 'payment_receipt';

export const REQUIRED_DOCUMENTS: { key: Exclude<DocumentKey, 'payment_receipt'>; label: string; hint: string; accept: string }[] = [
  { key: 'dti_registration', label: 'DTI Business Name Registration', hint: 'Certificate photo or PDF', accept: 'image/*,.pdf' },
  { key: 'tin_id', label: 'TIN ID or BIR Form 2303', hint: 'Photo or PDF', accept: 'image/*,.pdf' },
  { key: 'brgy_clearance', label: 'Barangay Business Clearance', hint: 'Photo or PDF', accept: 'image/*,.pdf' },
  { key: 'landmark_image', label: 'Shop Front Photo', hint: 'Helps customers find you — JPG, PNG, or WEBP', accept: 'image/*' },
];

export const GOVERNMENT_ID_TYPES = [
  "Driver's License",
  'Passport',
  'PhilID / National ID',
  'UMID',
  'Postal ID',
  'PRC ID',
  "Voter's ID",
];

export const EMPTY_OWNER: OwnerFields = {
  first_name: '', middle_name: '', last_name: '', suffix: '', birthday: '',
  email: '', contact_number: '',
};

export const EMPTY_SHOP: ShopFields = {
  store_name: '', address: '', city: 'Davao City', province: 'Davao del Sur',
  specializations: [], location: null,
};

export function formatPeso(value: string | number): string {
  return `₱${Number(value).toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}
