import React from 'react';
import { TABS } from './dashboardHelpers';
import ShopVisibilityPill from './ShopVisibilityPill';

interface DashboardHeaderProps {
  readonly userName: string;
  readonly activeTab: 'dashboard' | 'news' | 'welcome';
  readonly setActiveTab: (tab: 'dashboard' | 'news' | 'welcome') => void;
  readonly shopVisible: boolean | null;
  readonly toggleVisibility: () => Promise<void>;
  readonly visibilityLoading: boolean;
}

// Clock-driven greeting — the dashboard gets opened at all hours of a real
// shop day, and a fixed "Welcome back" reads as decoration rather than
// something that actually looked at the time.
function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardHeader({
  userName,
  activeTab,
  setActiveTab,
  shopVisible,
  toggleVisibility,
  visibilityLoading,
}: Readonly<DashboardHeaderProps>) {
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="flex flex-col gap-4 pb-4 border-b border-line">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-display text-2xl sm:text-3xl font-semibold text-ink">
            {timeGreeting()}, {userName.split(' ')[0] || 'there'}.
          </h1>
          <p className="text-eyebrow mt-1">{today}</p>
        </div>
        <ShopVisibilityPill
          shopVisible={shopVisible}
          toggleVisibility={toggleVisibility}
          visibilityLoading={visibilityLoading}
        />
      </div>

      {/* Underline tabs — scrolls cleanly on narrow screens, active rule
          sits flush with the header's bottom border. */}
      <nav
        className="flex items-center gap-1 -mb-4 overflow-x-auto hide-scrollbar shrink-0"
        aria-label="Dashboard views"
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 pb-3 pt-2 text-[13px] font-semibold border-b-2 transition-colors min-h-[44px] ${
                active
                  ? 'border-taupe text-taupe'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
