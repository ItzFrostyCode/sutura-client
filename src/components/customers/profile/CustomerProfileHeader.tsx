import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit2, Mail, Phone, Clock, Scissors } from 'lucide-react';
import { CustomerData } from '../customerTypes';
import { isWalkInEmail } from '../customerHelpers';

interface CustomerProfileHeaderProps {
  readonly customer: CustomerData | null;
  readonly onBack: () => void;
  readonly onEditProfile: () => void;
  readonly onViewMeasurements: () => void;
}

export default function CustomerProfileHeader({
  customer,
  onBack,
  onEditProfile,
  onViewMeasurements,
}: CustomerProfileHeaderProps) {
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
              {customer?.email && !isWalkInEmail(customer.email) ? (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-taupe transition-colors">
                  <Mail size={12} className="text-ink-faint shrink-0" /> {customer.email}
                </a>
              ) : (
                <span className="inline-flex items-center text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200 uppercase tracking-wider">
                  Walk-in Client
                </span>
              )}
              {customer?.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-taupe transition-colors font-mono">
                  <Phone size={12} className="text-ink-faint shrink-0" /> {customer.phone}
                </a>
              )}
              <span className="flex items-center gap-1 text-ink-faint">
                <Clock size={12} className="shrink-0" /> Client since{' '}
                {new Date(customer?.created_at || '').toLocaleDateString('en-PH', { year: 'numeric', month: 'short' })}
              </span>
              <span className="text-ink-faint font-mono text-[11px]">ID #{customer?.id}</span>
            </div>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/jobs/new?customer_id=${customer?.id}`}
            className="h-9 px-3.5 rounded-xl bg-taupe hover:bg-taupe-hover text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
          >
            <Scissors size={13} />
            <span>New Order</span>
          </Link>
          <button
            type="button"
            onClick={onViewMeasurements}
            className="h-9 px-3.5 rounded-xl bg-surface hover:bg-canvas border border-line text-ink font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <span>Measurements</span>
          </button>
        </div>
      </div>
    </div>
  );
}
