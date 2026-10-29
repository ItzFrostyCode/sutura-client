'use client';

import React from 'react';
import { ListChecks, FileText, Wallet } from 'lucide-react';
import ScrollNav from '@/components/shared/ScrollNav';

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
  /** How many payments the order has; shown as a small count after "Payments". */
  paymentsCount?: number;
}

const TABS = [
  { key: 'steps', label: 'Steps', icon: ListChecks },
  { key: 'details', label: 'Details', icon: FileText },
  { key: 'payments', label: 'Payments', icon: Wallet },
] as const;

export default function JobDetailTabsNav({
  activeTab,
  onSelectTab,
  dirtyTabs,
  showFinancials,
  paymentsCount = 0,
}: JobDetailTabsNavProps) {
  return (
    <ScrollNav wrapperClassName="border-b border-line" className="flex">
      {TABS.filter(tab => tab.key !== 'payments' || showFinancials).map(tab => {
        const TabIcon = tab.icon;
        const active = activeTab === tab.key;
        const isTabDirty = Boolean(dirtyTabs[tab.key]);
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectTab(tab.key)}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px mr-6 flex h-12 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-1 text-[15px] transition-colors ${
              active
                ? 'border-espresso font-semibold text-ink'
                : 'border-transparent font-medium text-ink-muted hover:text-ink'
            }`}
          >
            <TabIcon size={17} />
            <span>{tab.label}</span>
            {tab.key === 'payments' && paymentsCount > 0 && (
              <span className="rounded-full bg-amber-500/15 px-1.5 text-xs font-medium text-amber-800">{paymentsCount}</span>
            )}
            {isTabDirty && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Unsaved changes in this tab" />
            )}
          </button>
        );
      })}
    </ScrollNav>
  );
}
