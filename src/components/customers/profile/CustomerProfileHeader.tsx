import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Mail, Phone, Clock, Scissors, Trash2, CalendarPlus, MessageSquare, Printer, UserCircle } from 'lucide-react';
import { CustomerData } from '../customerTypes';
import { isWalkInCustomer, isWalkInEmail } from '../customerHelpers';
import { printInPlace } from '@/lib/printInPlace';
import { useShopRole } from '@/hooks/useShopRole';

interface CustomerProfileHeaderProps {
  readonly customer: CustomerData | null;
  readonly onBack: () => void;
  readonly onEditProfile: () => void;
  readonly onDelete: () => void;
  /** Opens the Texts tab; only given to people who may text customers. */
  readonly onText?: () => void;
}

const ACTION = 'h-9 px-3.5 rounded-xl bg-surface hover:bg-canvas border border-line text-ink font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer';

export default function CustomerProfileHeader({
  customer,
  onBack,
  onEditProfile,
  onDelete,
  onText,
}: CustomerProfileHeaderProps) {
  const { isOwnerOrManager } = useShopRole();
  const sukiTagMap: Record<string, { label: string; badgeCls: string }> = {
    b2b_suki: { label: 'B2B Suki ⭐', badgeCls: 'bg-amber-50 text-amber-800 border-amber-200' },
    reseller: { label: 'Reseller 🏬', badgeCls: 'bg-purple-50 text-purple-800 border-purple-200' },
    walk_in_retail: { label: 'Walk-in Retail', badgeCls: 'bg-sunken text-ink-muted border-line' },
  };

  const sukiBadge = customer?.suki_tag ? sukiTagMap[customer.suki_tag] ?? { label: customer.suki_tag, badgeCls: 'bg-sunken text-ink-muted border-line' } : null;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-canvas border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Back to Client Book"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">{customer?.name}</h1>
              {customer?.gender && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-canvas border border-line text-ink-muted">
                  {customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1)}
                </span>
              )}
              {sukiBadge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${sukiBadge.badgeCls}`}>
                  {sukiBadge.label}
                </span>
              )}
              <button
                type="button"
                onClick={onEditProfile}
                className="h-7 w-7 rounded-lg border border-line text-ink-muted hover:bg-canvas hover:text-ink flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Edit Client Info"
              >
                <Edit2 size={12} />
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
              {/* Online = came from an online appointment or order; everyone else is a walk-in, with or without an email. */}
              <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${isWalkInCustomer(customer) ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {isWalkInCustomer(customer) ? 'Walk-in Client' : 'Online Client'}
              </span>
              {customer?.email && !isWalkInEmail(customer.email) && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-taupe transition-colors">
                  <Mail size={12} className="text-ink-faint shrink-0" /> {customer.email}
                </a>
              )}
              {customer?.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-taupe transition-colors font-mono">
                  <Phone size={12} className="text-ink-faint shrink-0" /> {customer.phone}
                </a>
              )}
              <span className="flex items-center gap-1 text-ink-faint">
                <Clock size={12} className="shrink-0" /> Customer since{' '}
                {customer?.created_at ? new Date(customer.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </span>
              <span className="text-ink-faint font-mono text-[11px]">Customer No. #{customer?.shop_number ?? customer?.id}</span>
            </div>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isOwnerOrManager && (
            <Link
              href={`/dashboard/jobs/new?customer_id=${customer?.id}`}
              className="h-9 px-3.5 rounded-xl bg-espresso hover:bg-espresso/90 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Scissors size={13} />
              <span>New Order</span>
            </Link>
          )}
          <Link href={`/dashboard/appointments?customer_id=${customer?.id}`} className={ACTION}>
            <CalendarPlus size={13} /> <span>Book</span>
          </Link>
          {onText && (
            <button type="button" onClick={onText} className={ACTION}>
              <MessageSquare size={13} /> <span>Text</span>
            </button>
          )}
          <button type="button" onClick={() => printInPlace(`/print/customers/${customer?.id}/statement`)} className={ACTION}>
            <Printer size={13} /> <span>Statement</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Remove customer"
            title="Remove customer"
            className="h-9 w-9 rounded-xl bg-surface hover:bg-danger/10 border border-line text-ink-muted hover:text-danger flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
