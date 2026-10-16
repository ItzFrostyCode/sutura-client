'use client';

import React from 'react';
import { LayoutGrid, CreditCard, ClipboardCheck } from 'lucide-react';

export type JobDetailTabKey = 'steps' | 'details' | 'payments';

interface JobDetailTabsNavProps {
  activeTab: JobDetailTabKey;
  onSelectTab: (tab: JobDetailTabKey) => void;
  dirtyTabs: Record<string, boolean>;
  // Financials is the real money ledger (charge/discount/edit/reject
  // payment) — Owner/Branch-Manager-exclusive under the finalized target
  // (PAYMENT-WORKFLOW.md Part B). Staff's read-only view of balance/paid-
  // so-far already lives on the Overview tab's Financial Breakdown card.
  showFinancials: boolean;
  // Orders that use the ordering flow get an extra first tab with the steps to confirm and start them.
  showReadiness?: boolean;
}

const TABS = [
  { key: 'steps', label: 'Steps', icon: ClipboardCheck },
  { key: 'details', label: 'Details', icon: LayoutGrid },
  { key: 'payments', label: 'Payments', icon: CreditCard },
] as const;

export default function JobDetailTabsNav({
  activeTab,
  onSelectTab,
  dirtyTabs,
  showFinancials,
  showReadiness = false,
}: JobDetailTabsNavProps) {
  return (
    <div className="flex items-center gap-1 border-b border-line overflow-x-auto hide-scrollbar">
      {TABS.filter(tab => tab.key !== 'payments' || showFinancials).map(tab => {
        const TabIcon = tab.icon;
        const active = activeTab === tab.key;
        const isTabDirty = Boolean(dirtyTabs[tab.key]);
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 -mb-px transition-colors shrink-0 ${
              active
                ? 'border-taupe text-ink bg-surface/40 rounded-t-lg'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <TabIcon size={15} />
            <span>{tab.label}</span>
            {isTabDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes in this tab" />
            )}
          </button>
        );
      })}
    </div>
  );
}
