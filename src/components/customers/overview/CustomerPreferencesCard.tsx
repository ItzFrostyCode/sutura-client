import React from 'react';
import { SlidersHorizontal, PenLine } from 'lucide-react';
import { CustomerData } from '../customerTypes';
import TrustedCustomerRow from './TrustedCustomerRow';

interface CustomerPreferencesCardProps {
  readonly customer: CustomerData | null;
  readonly canTrust?: boolean;
  readonly onTrustChanged?: () => void;
  /** Opens the profile edit dialog. */
  readonly onEdit?: () => void;
}

/** How this client's orders start: trusted-customer toggle plus the shop's private notes on them. */
export default function CustomerPreferencesCard({ customer, canTrust = false, onTrustChanged, onEdit }: CustomerPreferencesCardProps) {
  const notes = customer?.store_notes ?? '';

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal size={16} className="text-taupe shrink-0" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink">Preferences &amp; Account Settings</h3>
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer">
            <PenLine size={13} /> Edit
          </button>
        )}
      </div>

      {customer && (
        <div className="p-3.5 bg-canvas border border-line rounded-xl">
          <TrustedCustomerRow customerId={customer.id} trusted={!!customer.is_trusted} canChange={canTrust} onChanged={() => onTrustChanged?.()} />
        </div>
      )}

      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Private Notes &amp; Fit Preferences</span>
        {notes ? (
          <div className="p-3.5 bg-canvas border border-line rounded-xl text-xs text-ink-body whitespace-pre-wrap leading-relaxed">
            {notes}
          </div>
        ) : (
          <div className="p-3.5 bg-canvas/40 border border-dashed border-line rounded-xl text-xs text-ink-faint italic min-h-[64px] flex items-center">
            No notes or fit preferences recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
