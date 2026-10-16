import { Star, Store, User, type LucideIcon } from 'lucide-react';

export const isWalkInEmail = (email?: string) => 
  email ? (email.startsWith('walkin_') && email.endsWith('@sutura.com')) : false;

export const isWalkInCustomer = (customer?: { email?: string; is_walk_in?: boolean; intake_channel?: string; suki_tag?: string | null } | null) => {
  if (!customer) return false;
  if (customer.is_walk_in === true || customer.intake_channel === 'walk_in') return true;
  if (customer.email && customer.email.startsWith('walkin_') && customer.email.endsWith('@sutura.com')) return true;
  if (!customer.email || customer.email.trim() === '') return true;
  return false;
};

export const SUKI_TAG_CONFIG: Record<string, { label: string; cls: string; badgeCls: string; Icon: LucideIcon }> = {
  b2b_suki: {
    label: 'B2B Suki',
    cls: 'text-amber-700',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Star
  },
  reseller: {
    label: 'Reseller',
    cls: 'text-purple-700',
    badgeCls: 'bg-purple-50 text-purple-800 border-purple-200',
    Icon: Store
  },
  walk_in_retail: {
    label: 'Walk-in Retail',
    cls: 'text-ink-muted',
    badgeCls: 'bg-sunken text-ink-muted border-line',
    Icon: User
  },
};

/** A Philippine mobile number as people write it: 0917 123 4567, 917-123-4567, +63 917 123 4567. */
export const isMobileNumber = (value: string) => /^(09\d{9}|9\d{9}|639\d{9})$/.test(value.replace(/\D+/g, ''));

/** What is missing before a customer can be saved, in words for the form; null when it is complete. */
export function customerFormProblem(f: { name: string; phone: string; gender: string }): string | null {
  if (!f.name.trim()) return 'Enter the customer’s full name.';
  if (!isMobileNumber(f.phone)) return 'Enter a valid mobile number, e.g. 0917 123 4567.';
  if (!f.gender) return 'Choose the customer’s gender.';
  return null;
}
