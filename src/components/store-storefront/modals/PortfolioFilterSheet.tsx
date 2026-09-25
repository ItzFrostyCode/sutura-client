import React from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X, Minus, TrendingUp, TrendingDown, Star } from 'lucide-react';

interface ColorOption {
  label: string;
  hex: string;
}

interface GarmentOption {
  id: string;
  label: string;
}

interface PortfolioFilterSheetProps {
  readonly isOpen: boolean;
  readonly mounted: boolean;
  readonly onClose: () => void;
  readonly activeFilterCount: number;
  readonly draftPriceSort: '' | 'price_asc' | 'price_desc';
  readonly setDraftPriceSort: (val: '' | 'price_asc' | 'price_desc') => void;
  readonly draftMinPrice: string;
  readonly setDraftMinPrice: (val: string) => void;
  readonly draftMaxPrice: string;
  readonly setDraftMaxPrice: (val: string) => void;
  readonly draftColorFilter: string;
  readonly setDraftColorFilter: (val: string) => void;
  readonly availableColors: ColorOption[];
  readonly draftRatingFilter: string;
  readonly setDraftRatingFilter: (val: string) => void;
  readonly garmentTypeOptions: GarmentOption[];
  readonly draftGarmentTypeFilters: Set<string>;
  readonly setDraftGarmentTypeFilters: React.Dispatch<React.SetStateAction<Set<string>>>;
  readonly garmentTypeTally: Record<string, number>;
  readonly onReset: () => void;
  readonly onApply: () => void;
}

export default function PortfolioFilterSheet({
  isOpen,
  mounted,
  onClose,
  activeFilterCount,
  draftPriceSort,
  setDraftPriceSort,
  draftMinPrice,
  setDraftMinPrice,
  draftMaxPrice,
  setDraftMaxPrice,
  draftColorFilter,
  setDraftColorFilter,
  availableColors,
  draftRatingFilter,
  setDraftRatingFilter,
  garmentTypeOptions,
  draftGarmentTypeFilters,
  setDraftGarmentTypeFilters,
  garmentTypeTally,
  onReset,
  onApply,
}: PortfolioFilterSheetProps) {
  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center pointer-events-auto">
      {/* Backdrop Scrim */}
      <button
        type="button"
        aria-label="Close filter"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 focus:outline-none"
      />

      {/* Bottom Sheet Container */}
      <div className="relative bg-canvas rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] sm:max-w-md w-full overflow-hidden z-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 border-t sm:border border-line">
        {/* Grab Handle */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden bg-surface">
          <div className="w-10 h-1 rounded-full bg-line-strong" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-line shrink-0 bg-surface">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-taupe" />
            <span className="text-sm font-bold text-ink">Filter Catalog</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-taupe text-canvas text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1 rounded-full text-ink-muted hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1-Column Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 1. PRICE */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink mb-2.5">
              1. Price &amp; Sorting
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { key: '' as const, label: 'Default', Icon: Minus },
                { key: 'price_asc' as const, label: 'Low to High', Icon: TrendingUp },
                { key: 'price_desc' as const, label: 'High to Low', Icon: TrendingDown },
              ].map((opt) => {
                const isSelected = draftPriceSort === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDraftPriceSort(opt.key)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-taupe text-canvas border-taupe shadow-xs'
                        : 'bg-surface text-ink-body border-line hover:border-taupe/60'
                    }`}
                  >
                    <opt.Icon size={16} />
                    <span className="whitespace-nowrap">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-faint">₱</span>
                <input
                  type="number"
                  min={0}
                  value={draftMinPrice}
                  onChange={(e) => setDraftMinPrice(e.target.value)}
                  placeholder="Min Price"
                  className="w-full pl-7 pr-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe"
                />
              </div>
              <span className="text-ink-faint text-sm font-semibold">–</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-faint">₱</span>
                <input
                  type="number"
                  min={0}
                  value={draftMaxPrice}
                  onChange={(e) => setDraftMaxPrice(e.target.value)}
                  placeholder="Max Price"
                  className="w-full pl-7 pr-3 py-2 bg-surface border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe"
                />
              </div>
            </div>
          </div>

          {/* 2. COLOR */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-ink">2. Color</p>
              {draftColorFilter && (
                <button
                  type="button"
                  onClick={() => setDraftColorFilter('')}
                  className="text-[11px] font-medium text-taupe hover:underline cursor-pointer"
                >
                  Clear color
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraftColorFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  !draftColorFilter
                    ? 'bg-taupe text-canvas border-taupe font-semibold shadow-xs'
                    : 'bg-surface text-ink-body border-line hover:border-taupe'
                }`}
              >
                All Colors
              </button>
              {availableColors.map((c) => {
                const isSelected = draftColorFilter.toLowerCase() === c.label.toLowerCase();
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setDraftColorFilter(isSelected ? '' : c.label)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-canvas border-ink shadow-xs ring-1 ring-taupe'
                        : 'bg-surface text-ink-body border-line hover:border-taupe'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. RATING */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-ink">3. Rating</p>
              {draftRatingFilter && (
                <button
                  type="button"
                  onClick={() => setDraftRatingFilter('')}
                  className="text-[11px] font-medium text-taupe hover:underline cursor-pointer"
                >
                  Clear rating
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {[
                { value: '5', label: '5 Stars only' },
                { value: '4', label: '4 Stars & Up' },
                { value: '3', label: '3 Stars & Up' },
                { value: '2', label: '2 Stars & Up' },
                { value: '1', label: '1 Star & Up' },
              ].map((opt) => {
                const isSelected = draftRatingFilter === opt.value;
                const num = Number(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftRatingFilter(isSelected ? '' : opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-taupe/10 border-taupe text-ink font-semibold'
                        : 'bg-surface border-line text-ink-body hover:bg-sunken'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          className={star <= num ? 'text-amber-500 fill-amber-500' : 'text-line-strong'}
                        />
                      ))}
                      <span className="ml-2 font-medium text-ink">{opt.label}</span>
                    </div>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-taupe" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. GARMENT TYPE */}
          {garmentTypeOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink">4. Garment Type</p>
                {draftGarmentTypeFilters.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraftGarmentTypeFilters(new Set())}
                    className="text-[11px] font-medium text-taupe hover:underline cursor-pointer"
                  >
                    Clear garment types
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {garmentTypeOptions.map((opt) => {
                  const isSelected = draftGarmentTypeFilters.has(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDraftGarmentTypeFilters((prev) => {
                          const next = new Set(prev);
                          if (next.has(opt.id)) next.delete(opt.id);
                          else next.add(opt.id);
                          return next;
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-taupe text-canvas border-taupe font-semibold shadow-xs'
                          : 'bg-surface text-ink-body border-line hover:border-taupe'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-canvas/80' : 'text-ink-faint'}`}>
                        ({garmentTypeTally[opt.id] || 0})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-line bg-surface flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2.5 rounded-xl border border-line bg-canvas text-ink text-xs font-semibold hover:bg-sunken active:scale-95 transition-all cursor-pointer"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 py-2.5 rounded-xl bg-taupe hover:bg-taupe-hover text-canvas text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
