import React from 'react';
import { LayoutDashboard, Scissors, CreditCard, CalendarDays, Ruler, History, MessageSquare } from 'lucide-react';
import ScrollNav from '@/components/shared/ScrollNav';

export type CustomerTabType = 'overview' | 'orders' | 'payments' | 'appointments' | 'measurements' | 'activity' | 'texts';

interface CustomerTabNavProps {
  readonly activeTab: CustomerTabType;
  readonly setActiveTab: (tab: CustomerTabType) => void;
  /** Owner / branch manager only: texts go through the shop's outbox. */
  readonly showTexts?: boolean;
  /** Shown beside Payments & Billing when the customer owes money. */
  readonly balanceDue?: string;
  /** Live job orders, shown beside Job Orders & Production. */
  readonly ordersCount?: number;
}

export default function CustomerTabNav({ activeTab, setActiveTab, showTexts = false, balanceDue, ordersCount }: CustomerTabNavProps) {
  const tabs: {
    id: CustomerTabType;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    chip?: string;
    chipCls?: string;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Job Orders & Production',
      icon: Scissors,
      chip: ordersCount ? String(ordersCount) : undefined,
      chipCls: 'bg-sunken text-ink-muted',
    },
    {
      id: 'payments',
      label: 'Payments & Billing',
      icon: CreditCard,
      chip: balanceDue,
      chipCls: 'bg-red-50 text-danger font-bold',
    },
    { id: 'appointments', label: 'Appointments & Fitting', icon: CalendarDays },
    { id: 'measurements', label: 'Measurements & Specs', icon: Ruler },
    { id: 'activity', label: 'Recent Activity', icon: History },
    ...(showTexts ? [{ id: 'texts' as const, label: 'SMS', icon: MessageSquare }] : []),
  ];

  return (
    <div className="border-b border-line w-full">
      <nav aria-label="Customer detail views">
        <ScrollNav className="flex items-center gap-5 sm:gap-7 whitespace-nowrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 py-3 px-1 text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink font-medium'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-ink' : 'text-ink-faint'} />
              <span>{tab.label}</span>
              {tab.chip && <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tab.chipCls}`}>{tab.chip}</span>}
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-ink" />}
            </button>
          );
        })}
      </ScrollNav>
      </nav>
    </div>
  );
}
