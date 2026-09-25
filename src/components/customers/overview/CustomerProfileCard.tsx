import React from 'react';
import { User, FileText } from 'lucide-react';
import { CustomerData } from '../customerTypes';
import { isWalkInEmail, SUKI_TAG_CONFIG } from '../customerHelpers';

interface CustomerProfileCardProps {
  readonly customer: CustomerData | null;
}

export default function CustomerProfileCard({ customer }: CustomerProfileCardProps) {
  const sukiCfg = customer?.suki_tag ? SUKI_TAG_CONFIG[customer.suki_tag] : null;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4 min-h-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
            <User size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Client Atelier Profile</h2>
            <p className="text-[11px] text-ink-muted">Contact details and loyalty tier</p>
          </div>
        </div>

        {sukiCfg && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${sukiCfg.badgeCls}`}>
            {sukiCfg.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Full Name</span>
          <span className="text-ink font-bold text-sm block">{customer?.name}</span>
        </div>

        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Email Contact</span>
          <span className="text-ink font-medium block truncate">
            {customer?.email && !isWalkInEmail(customer.email) ? customer.email : 'Walk-in Client (No Email)'}
          </span>
        </div>

        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Phone / Mobile</span>
          <span className="text-ink font-bold font-mono text-sm block">{customer?.phone || 'N/A'}</span>
        </div>

        <div className="p-3.5 bg-canvas border border-line rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">CRM Reference</span>
          <span className="text-ink font-semibold block">Customer ID #{customer?.id}</span>
        </div>
      </div>

      {/* Atelier Store Notes Callout */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider">
          <FileText size={13} className="text-taupe" />
          <span>Private Atelier Notes</span>
        </div>
        {customer?.store_notes ? (
          <div className="p-4 bg-canvas border border-line rounded-xl text-xs text-ink-body whitespace-pre-wrap leading-relaxed shadow-2xs">
            {customer.store_notes}
          </div>
        ) : (
          <div className="p-4 bg-canvas/40 border border-dashed border-line rounded-xl text-xs text-ink-faint italic">
            No special atelier instructions or fit preferences recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
