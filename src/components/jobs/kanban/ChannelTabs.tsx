import React from 'react';
import { ShoppingBag, Store } from 'lucide-react';

type Tab = 'all' | 'walk_in' | 'online';

interface ChannelTabsProps {
  readonly tab: Tab;
  readonly setTab: (tab: Tab) => void;
  readonly total: number;
  readonly walkIn: number;
  readonly online: number;
}

/** All Orders / Walk-in / Online. */
export default function ChannelTabs({ tab, setTab, total, walkIn, online }: ChannelTabsProps) {
  const items = [
    { id: 'all' as const, label: 'All Orders', count: total, icon: null },
    { id: 'walk_in' as const, label: 'Walk-in', count: walkIn, icon: <Store size={12} /> },
    { id: 'online' as const, label: 'Online', count: online, icon: <ShoppingBag size={12} /> },
  ];
  return (
    <div role="group" aria-label="Order channel" className="flex h-9.5 shrink-0 items-center gap-1 rounded-lg border border-line bg-canvas p-1">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          aria-pressed={tab === i.id}
          onClick={() => setTab(i.id)}
          className={`flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs font-bold transition-all ${
            tab === i.id ? 'border border-line/80 bg-surface text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {i.icon}
          <span>{i.label}</span>
          <span className="rounded-full bg-sunken px-1.5 text-[10px] font-black tabular-nums text-ink-muted">{i.count}</span>
        </button>
      ))}
    </div>
  );
}
