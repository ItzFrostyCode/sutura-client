import { Star, Store, User, type LucideIcon } from 'lucide-react';

export const isWalkInEmail = (email?: string) => 
  email ? (email.startsWith('walkin_') && email.endsWith('@sutura.com')) : false;

/**
 * The email this customer actually gets order updates at: their notification
 * email (contact_email — what staff typed for a walk-in, may be shared with
 * a family member), else their login email. '' for a walk-in with none.
 */
export const customerEmail = (customer?: { email?: string | null; contact_email?: string | null } | null): string => {
  if (!customer) return '';
  if (customer.contact_email) return customer.contact_email;
  return customer.email && !isWalkInEmail(customer.email) ? customer.email : '';
};

/** Philippine mobile number: 11 digits starting with 09 (e.g. 09663946888). */
export const PH_MOBILE_PATTERN = /^09\d{9}$/;
export const PH_MOBILE_ERROR = 'Phone number must be 11 digits starting with 09, e.g. 09171234567.';

/**
 * Keeps a phone field to a PH mobile as it's typed or pre-filled: digits only,
 * "+63 917…" becomes "0917…", and never more than 11 digits.
 */
export const toPhMobileInput = (value: string) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('63')) digits = `0${digits.slice(2)}`;
  return digits.slice(0, 11);
};

/** Props for a PH mobile <input>: numeric keypad, 11-digit cap, and the browser blocks submit on a bad number. */
export const PH_MOBILE_INPUT_PROPS = {
  type: 'tel',
  inputMode: 'numeric',
  maxLength: 11,
  pattern: '09[0-9]{9}',
  title: PH_MOBILE_ERROR,
  placeholder: '09171234567',
} as const;

export const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isWalkInCustomer =(customer?: { email?: string; is_walk_in?: boolean; intake_channel?: string; suki_tag?: string | null } | null) => {
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
