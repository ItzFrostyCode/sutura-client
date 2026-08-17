import { Star, Store, User, type LucideIcon } from 'lucide-react';

export const isWalkInEmail = (email?: string) => 
  email ? (email.startsWith('walkin_') && email.endsWith('@sutura.com')) : false;

export const isWalkInCustomer = (customer?: { email?: string; is_walk_in?: boolean; intake_channel?: string; suki_tag?: string | null } | null) => {
  if (!customer) return false;
  if (customer.is_walk_in === true || customer.intake_channel === 'walk_in') return true;
  if (customer.email && customer.email.startsWith('walkin_') && customer.email.endsWith('@sutura.com')) return true;
  if (!customer.email || customer.email.trim() === '') return true;
  if (customer.suki_tag === 'walk_in_retail') return true;
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
