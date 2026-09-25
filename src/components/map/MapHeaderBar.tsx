import { ArrowLeft, Search, X, SlidersHorizontal, MapPin, PanelRight } from 'lucide-react';

interface MapHeaderBarProps {
  onBack: () => void;
  q: string;
  onQueryChange: (val: string) => void;
  onSubmitSearch: () => void;
  isSelectMode: boolean;
  hasActiveFilters: boolean;
  onToggleFilter: () => void;
  storeCount?: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function MapHeaderBar({
  onBack,
  q,
  onQueryChange,
  onSubmitSearch,
  isSelectMode,
  hasActiveFilters,
  onToggleFilter,
  storeCount,
  isSidebarOpen = true,
  onToggleSidebar,
}: MapHeaderBarProps) {
  return (
    <header className="relative z-[1100] flex items-center justify-between gap-3 px-3 sm:px-6 h-14 sm:h-16 border-b border-line shrink-0 bg-canvas">
      {/* Left: Back button & Desktop Branding */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="p-1.5 text-ink-muted hover:text-ink shrink-0 cursor-pointer rounded-lg hover:bg-sunken transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="hidden md:flex flex-col">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-taupe" />
            <h1 className="text-sm font-bold text-ink tracking-tight">
              {isSelectMode ? 'Choose Location' : 'Tailor Locator'}
            </h1>
          </div>
          <span className="text-[11px] text-ink-faint leading-none">
            {isSelectMode ? 'Select a branch or address' : 'Explore nearby shops'}
          </span>
        </div>
      </div>

      {/* Center: Constrained Search Bar */}
      <div className="flex-1 flex justify-center max-w-xs sm:max-w-sm md:max-w-md w-full relative min-w-0">
        <div className="relative w-full">
          <button
            type="button"
            onClick={onSubmitSearch}
            aria-label="Search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink cursor-pointer"
          >
            <Search size={15} />
          </button>
          <input
            type="text"
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmitSearch();
            }}
            placeholder={
              isSelectMode
                ? 'Search address, store, or Maps link…'
                : 'Search stores, garment type…'
            }
            className="w-full bg-sunken border border-line rounded-full pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe focus:bg-surface transition-all shadow-2xs"
          />
          {q && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink cursor-pointer p-0.5 rounded-full hover:bg-canvas"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Right: Mobile Filter Button & Desktop Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Desktop Store Count & Sidebar Toggle */}
        <div className="hidden md:flex items-center gap-2">
          {storeCount !== undefined && (
            <span className="text-[11px] font-medium text-ink-muted bg-sunken px-2.5 py-1 rounded-full border border-line">
              {storeCount} {storeCount === 1 ? 'store' : 'stores'}
            </span>
          )}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isSidebarOpen
                  ? 'bg-surface text-ink border-line hover:border-taupe'
                  : 'bg-canvas text-ink-muted border-line hover:border-taupe'
              }`}
            >
              <PanelRight size={16} />
            </button>
          )}
        </div>

        {/* Mobile Filter Button (hidden on tablet/desktop) */}
        <button
          type="button"
          onClick={onToggleFilter}
          aria-label="Filter stores and districts"
          className={`md:hidden relative z-[1100] p-2 rounded-full border transition-colors shrink-0 cursor-pointer ${
            hasActiveFilters
              ? 'bg-taupe text-white border-taupe shadow-xs'
              : 'bg-surface text-ink-muted border-line hover:border-taupe'
          }`}
        >
          <SlidersHorizontal size={15} />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-canvas" />
          )}
        </button>
      </div>
    </header>
  );
}
