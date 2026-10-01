'use client';

import React from 'react';
import { Receipt, CreditCard, ShoppingBag, Wallet } from 'lucide-react';
import { Tab } from './usePayments';

interface PaymentTabsNavProps {
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
  pendingCount: number;
}

const TAB_DEFS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'receipts', label: 'Digital Receipts', icon: Receipt },
  { id: 'job_balances', label: 'Job Balances', icon: CreditCard },
  { id: 'catalog_orders', label: 'Catalog Orders', icon: ShoppingBag },
  { id: 'methods', label: 'Payment Methods', icon: Wallet },
];

export default function PaymentTabsNav({
  activeTab,
  onSelectTab,
  pendingCount,
}: PaymentTabsNavProps) {
  return (
    // overflow-x-auto + shrink-0/whitespace-nowrap on each tab — same fix
    // already applied to Appointments' status tabs and the Jobs list tab
    // bar (see CLAUDE.md's "Mobile-responsive patterns" note): "Digital
    // Receipts" + "Job Balances" + "Catalog Orders" together are wider than
    // a phone screen, and this bar had no wrap or scroll fallback at all,
    // so the third tab was pushed off-screen with no way to reach it.
    <div className="flex items-center gap-2 border-b border-line px-1 overflow-x-auto hide-scrollbar">
      {TAB_DEFS.map(t => {
        const Icon = t.icon;
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTab(t.id)}
            className={`flex items-center gap-2 pb-3 pt-1 px-3 text-xs font-bold transition-all relative border-b-2 -mb-px shrink-0 whitespace-nowrap ${
              active
                ? 'border-taupe text-ink'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
            }`}
          >
            <Icon size={14} className={active ? 'text-taupe' : 'text-ink-faint'} />
            <span>{t.label}</span>
            {t.id === 'receipts' && pendingCount > 0 && (
              <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 shadow-xs" title={`${pendingCount} pending`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
