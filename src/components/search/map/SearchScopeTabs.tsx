import type { SearchActiveTab } from '../types';

interface SearchScopeTabsProps {
  readonly active: SearchActiveTab;
  readonly onChange: (tab: SearchActiveTab) => void;
}

/**
 * What the search looks through: Shops (first, and the default — the adviser wants the shops to come out first),
 * Services and Designs. Thesis objective "search for tailoring services by specific garment type": a garment typed in
 * the bar can be answered as shops, as the designs that show it, or as the services that make it.
 */
const TABS: { id: SearchActiveTab; label: string }[] = [
  { id: 'store', label: 'Shops' },
  { id: 'services', label: 'Services' },
  { id: 'showroom', label: 'Designs' },
];

export default function SearchScopeTabs({ active, onChange }: SearchScopeTabsProps) {
  const current = active === 'all' ? 'store' : active;
  return (
    <div role="tablist" aria-label="Search in" className="flex border-b border-line">
      {TABS.map((t) => {
        const on = current === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => { if (!on) onChange(t.id); }}
            className={`-mb-px flex h-11 flex-1 items-center justify-center border-b-2 text-sm transition-colors ${
              on ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
