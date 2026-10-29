import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Edit2, Mail, Phone, Scissors, Trash2, CalendarPlus, MessageSquare, Printer, CalendarDays, Hash } from 'lucide-react';
import { CustomerData } from '../customerTypes';
import { isWalkInCustomer, isWalkInEmail } from '../customerHelpers';
import { printInPlace } from '@/lib/printInPlace';
import { useShopRole } from '@/hooks/useShopRole';

const PRIMARY = 'flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-espresso px-4 text-[13px] font-medium text-white shadow-sm transition-opacity hover:opacity-95 sm:px-5';
const SECONDARY = 'flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[13px] font-medium text-ink shadow-sm hover:bg-espresso/[0.03] sm:px-4';
const ICON_BTN = 'flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-ink-muted shadow-sm hover:bg-espresso/[0.03] hover:text-ink';

/**
 * The title row of the customer profile: who this is, how to reach them, and the quick actions — the same
 * header shape as the Appointments and Job Orders screens (title + subtitle on the left, buttons on the right).
 * The labels say the whole thing in one place: New Job Order, Book Appointment, Send Text, Print Statement.
 */
export default function CustomerProfileHeader({
  customer,
  onBack,
  onEditProfile,
  onDelete,
  onText,
}: Readonly<{
  readonly customer: CustomerData | null;
  readonly onBack: () => void;
  readonly onEditProfile: () => void;
  readonly onDelete: () => void;
  /** Opens the Texts tab; only given to people who may text customers. */
  readonly onText?: () => void;
}>) {
  const { isOwnerOrManager } = useShopRole();
  const sukiTagMap: Record<string, { label: string; badgeCls: string }> = {
    b2b_suki: { label: 'B2B Suki', badgeCls: 'bg-amber-50 text-amber-800 border-amber-200' },
    reseller: { label: 'Reseller', badgeCls: 'bg-purple-50 text-purple-800 border-purple-200' },
    walk_in_retail: { label: 'Walk-in Retail', badgeCls: 'bg-sunken text-ink-muted border-line' },
  };
  const sukiBadge = customer?.suki_tag ? sukiTagMap[customer.suki_tag] ?? { label: customer.suki_tag, badgeCls: 'bg-sunken text-ink-muted border-line' } : null;

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          title="Back to Client Book"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-ink-muted shadow-sm hover:text-ink"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{customer?.name}</h1>
          {customer?.gender && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{customer.gender}</span>
          )}
          {sukiBadge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${sukiBadge.badgeCls}`}>{sukiBadge.label}</span>
          )}
          <button
            type="button"
            onClick={onEditProfile}
            title="Edit client info"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-faint hover:bg-espresso/[0.05] hover:text-ink"
          >
            <Edit2 size={15} />
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isWalkInCustomer(customer) ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
            {isWalkInCustomer(customer) ? 'Walk-in client' : 'Online client'}
          </span>
          {customer?.email && !isWalkInEmail(customer.email) && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-ink transition-colors">
              <Mail size={13} className="text-ink-faint shrink-0" /> {customer.email}
            </a>
          )}
          {customer?.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-ink transition-colors font-mono text-[13px]">
              <Phone size={13} className="text-ink-faint shrink-0" /> {customer.phone}
            </a>
          )}
          <span className="flex items-center gap-1.5 text-ink-faint">
            <CalendarDays size={13} className="text-ink-faint shrink-0" />
            Customer since {customer?.created_at ? new Date(customer.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[12px] text-ink-faint">
            <Hash size={13} className="text-ink-faint shrink-0" />
            {customer?.shop_number ?? customer?.id}
          </span>
        </div>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2 shrink-0">
        {isOwnerOrManager && (
          <Link href={`/dashboard/jobs/new?customer_id=${customer?.id}`} className={PRIMARY}>
            <Scissors size={15} /> New Job Order
          </Link>
        )}
        <Link href={`/dashboard/appointments?customer_id=${customer?.id}`} className={SECONDARY}>
          <CalendarPlus size={15} /> Book Appointment
        </Link>
        {onText && (
          <button type="button" onClick={onText} className={SECONDARY}>
            <MessageSquare size={15} /> Send Text
          </button>
        )}
        <button type="button" onClick={() => printInPlace(`/print/customers/${customer?.id}/statement`)} className={SECONDARY}>
          <Printer size={15} /> Print Statement
        </button>
        <button type="button" onClick={onDelete} title="Remove customer" aria-label="Remove customer" className={ICON_BTN}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
