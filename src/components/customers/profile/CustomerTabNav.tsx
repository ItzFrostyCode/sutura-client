import React from 'react';
import { User, Ruler, Scissors, Calendar, History, HandCoins, MessageSquare } from 'lucide-react';

export type CustomerTabType = 'overview' | 'measurements' | 'orders' | 'payments' | 'appointments' | 'texts' | 'history';

interface CustomerTabNavProps {
  readonly activeTab: CustomerTabType;
  readonly setActiveTab: (tab: CustomerTabType) => void;
  /** Owner / branch manager only: texts go through the shop's outbox. */
  readonly showTexts?: boolean;
  /** Shown beside Payments when the customer owes money. */
  readonly balanceDue?: string;
}

export default function CustomerTabNav({ activeTab, setActiveTab, showTexts = false, balanceDue }: CustomerTabNavProps) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'measurements' as const, label: 'Measurements & Specs', icon: Ruler },
    { id: 'orders' as const, label: 'Job Orders', icon: Scissors },
    { id: 'payments' as const, label: 'Payments', icon: HandCoins },
    { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
    ...(showTexts ? [{ id: 'texts' as const, label: 'Texts', icon: MessageSquare }] : []),
    { id: 'history' as const, label: 'Activity History', icon: History },
  ];

  return (
    <div className="border-b border-line w-full">
      <nav
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap"
        aria-label="Customer detail views"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 py-3 px-1 text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'text-ink font-bold' : 'text-ink-muted hover:text-ink font-medium'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-ink' : 'text-ink-muted'} />
              <span>{tab.label}</span>
              {tab.id === 'payments' && balanceDue && <span className="text-[11px] font-bold text-danger">{balanceDue}</span>}

              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-espresso rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
