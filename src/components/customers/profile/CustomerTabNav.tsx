import React from 'react';
import { User, Ruler, Scissors, Calendar, History } from 'lucide-react';

export type CustomerTabType = 'overview' | 'measurements' | 'orders' | 'appointments' | 'history';

interface CustomerTabNavProps {
  readonly activeTab: CustomerTabType;
  readonly setActiveTab: (tab: CustomerTabType) => void;
}

export default function CustomerTabNav({ activeTab, setActiveTab }: CustomerTabNavProps) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'measurements' as const, label: 'Measurements & Specs', icon: Ruler },
    { id: 'orders' as const, label: 'Job Orders', icon: Scissors },
    { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
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

              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-taupe rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
