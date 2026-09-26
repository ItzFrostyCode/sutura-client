'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, RotateCcw, Check, Star, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { SEARCH_DEPARTMENTS } from '@/lib/navSearchCategories';
import ColorFamilyFilterSection from '@/components/search/ColorFamilyFilterSection';

interface ColorOption {
  label: string;
  hex: string;
}

interface StoreCatalogFilterSidebarProps {
  readonly activeFilterCount: number;
  readonly priceSort: '' | 'price_asc' | 'price_desc';
  readonly setPriceSort: (val: '' | 'price_asc' | 'price_desc') => void;
  readonly minPrice: string;
  readonly setMinPrice: (val: string) => void;
  readonly maxPrice: string;
  readonly setMaxPrice: (val: string) => void;
  readonly colorFilter: string;
  readonly setColorFilter: (val: string) => void;
  readonly availableColors: ColorOption[];
  readonly ratingFilter: string;
  readonly setRatingFilter: (val: string) => void;
  readonly garmentTypeTally: Record<string, number>;
  readonly garmentTypeFilters: Set<string>;
  readonly toggleGarmentType: (id: string) => void;
  readonly onReset: () => void;
}

/**
 * Persistent tablet/desktop counterpart to PortfolioFilterSheet (the mobile
 * bottom sheet) — deliberately built section-for-section identical to
 * SearchWebFilterSidebar (same collapsible dropdown header bar, same
 * checkbox-row list pattern, same Department + Narrow by Category picker
 * instead of a flat "Garment Type" list) so a customer doesn't get two
 * different filter languages depending on which page they filtered from.
 * garment_type values already match SEARCH_DEPARTMENTS' category slugs
 * ('barong', 'suit', 'gown', ...) directly — no remapping needed, just
 * cross-referenced against this store's own real tally so an empty
 * category never shows as a selectable option.
 */
export default function StoreCatalogFilterSidebar({
  activeFilterCount,
  priceSort,
  setPriceSort,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  colorFilter,
  setColorFilter,
  availableColors,
  ratingFilter,
  setRatingFilter,
  garmentTypeTally,
  garmentTypeFilters,
  toggleGarmentType,
  onReset,
}: StoreCatalogFilterSidebarProps) {
  const [activeDept, setActiveDept] = useState<string>('all');
  const currentDept = SEARCH_DEPARTMENTS.find((d) => d.key === activeDept) ?? SEARCH_DEPARTMENTS[0];
  const categoriesInStock = currentDept.categories.filter((cat) => (garmentTypeTally[cat.value] ?? 0) > 0);
  const departmentsInStock = SEARCH_DEPARTMENTS.filter(
    (d) => d.key === 'all' || d.categories.some((cat) => (garmentTypeTally[cat.value] ?? 0) > 0)
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    department: true,
    category: true,
    color: true,
    price: true,
    rating: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-[250px] lg:w-[270px] shrink-0 sticky top-20 self-start border border-[#D1C7BD] bg-white rounded-none shadow-none text-[#2D2A26] select-none">
      {/* Header Bar */}
      <div className="bg-[#2D2A26] text-white px-3.5 py-2.5 flex items-center justify-between rounded-none border-b border-[#2D2A26]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#D1C7BD]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.2 bg-[#9A8073] text-white text-[10px] font-black rounded-none">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-[#D1C7BD] hover:text-white underline cursor-pointer flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Department (Collapsible Dropdown) */}
      {departmentsInStock.length > 1 && (
        <div className="border-b border-[#EBE6E0]">
          <div
            onClick={() => toggleSection('department')}
            className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
          >
            <span>Department</span>
            <ChevronDown
              size={13}
              className={`text-[#827A73] transition-transform duration-200 ${
                openSections.department ? 'rotate-180' : ''
              }`}
            />
          </div>
          {openSections.department && (
            <div className="divide-y divide-[#F5F1EC] bg-white">
              {departmentsInStock.map((dept) => {
                const isSelected = activeDept === dept.key;
                return (
                  <button
                    key={dept.key}
                    type="button"
                    onClick={() => setActiveDept(dept.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                      isSelected ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                          : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3.5} className="text-white" />}
                    </span>
                    <span className="truncate">{dept.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Narrow by Category (Collapsible Dropdown) */}
      {categoriesInStock.length > 0 && (
        <div className="border-b border-[#EBE6E0]">
          <div
            onClick={() => toggleSection('category')}
            className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
          >
            <span>Narrow by Category</span>
            <div className="flex items-center gap-2">
              {garmentTypeFilters.size > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    Array.from(garmentTypeFilters).forEach((id) => toggleGarmentType(id));
                  }}
                  className="text-[10px] font-semibold text-[#9A8073] hover:text-[#2D2A26] hover:underline cursor-pointer lowercase"
                >
                  (all)
                </button>
              )}
              <ChevronDown
                size={13}
                className={`text-[#827A73] transition-transform duration-200 ${
                  openSections.category ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
          {openSections.category && (
            <div className="divide-y divide-[#F5F1EC] bg-white">
              {categoriesInStock.map((cat) => {
                const isSelected = garmentTypeFilters.has(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleGarmentType(cat.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                      isSelected ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                          : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3.5} className="text-white" />}
                    </span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Color Swatches (Collapsible Dropdown) */}
      {availableColors.length > 0 && (
        <div className="border-b border-[#EBE6E0]">
          <div
            onClick={() => toggleSection('color')}
            className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
          >
            <span>Color</span>
            <div className="flex items-center gap-2">
              {colorFilter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setColorFilter('');
                  }}
                  className="text-[10px] font-semibold text-[#9A8073] hover:text-[#2D2A26] hover:underline cursor-pointer lowercase"
                >
                  (clear)
                </button>
              )}
              <ChevronDown
                size={13}
                className={`text-[#827A73] transition-transform duration-200 ${
                  openSections.color ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
          {openSections.color && (
            <div className="p-3 bg-white">
              <ColorFamilyFilterSection
                selectedColor={colorFilter}
                onColorChange={(val) => setColorFilter(val)}
              />
            </div>
          )}
        </div>
      )}

      {/* Price Range (Collapsible Dropdown) */}
      <div className="border-b border-[#EBE6E0]">
        <div
          onClick={() => toggleSection('price')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Price Range (₱)</span>
          <div className="flex items-center gap-2">
            {(minPrice || maxPrice || priceSort) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinPrice('');
                  setMaxPrice('');
                  setPriceSort('');
                }}
                className="text-[10px] font-semibold text-[#9A8073] hover:text-[#2D2A26] hover:underline cursor-pointer lowercase"
              >
                (clear)
              </button>
            )}
            <ChevronDown
              size={13}
              className={`text-[#827A73] transition-transform duration-200 ${
                openSections.price ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
        {openSections.price && (
          <div className="p-3 bg-white space-y-2.5">
            <div className="grid grid-cols-2 border border-[#D1C7BD] divide-x divide-[#D1C7BD] rounded-none">
              <button
                type="button"
                onClick={() => setPriceSort(priceSort === 'price_asc' ? '' : 'price_asc')}
                className={`py-1.5 flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded-none ${
                  priceSort === 'price_asc' ? 'bg-[#2D2A26] text-white' : 'bg-white text-[#524A44] hover:bg-[#F0EAE3]'
                }`}
              >
                <TrendingUp size={12} />
                <span>Low to High</span>
              </button>
              <button
                type="button"
                onClick={() => setPriceSort(priceSort === 'price_desc' ? '' : 'price_desc')}
                className={`py-1.5 flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded-none ${
                  priceSort === 'price_desc' ? 'bg-[#2D2A26] text-white' : 'bg-white text-[#524A44] hover:bg-[#F0EAE3]'
                }`}
              >
                <TrendingDown size={12} />
                <span>High to Low</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₱"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full h-8 px-2 bg-white border border-[#D1C7BD] rounded-none text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
              />
              <input
                type="number"
                placeholder="Max ₱"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full h-8 px-2 bg-white border border-[#D1C7BD] rounded-none text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Rating (Collapsible Dropdown) */}
      <div>
        <div
          onClick={() => toggleSection('rating')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Rating</span>
          <div className="flex items-center gap-2">
            {ratingFilter && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRatingFilter('');
                }}
                className="text-[10px] font-semibold text-[#9A8073] hover:text-[#2D2A26] hover:underline cursor-pointer lowercase"
              >
                (clear)
              </button>
            )}
            <ChevronDown
              size={13}
              className={`text-[#827A73] transition-transform duration-200 ${
                openSections.rating ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
        {openSections.rating && (
          <div className="divide-y divide-[#F5F1EC] bg-white">
            {[
              { val: '5', label: '5 only', count: 5 },
              { val: '4', label: '4 & up', count: 4 },
              { val: '3', label: '3 & up', count: 3 },
              { val: '2', label: '2 & up', count: 2 },
              { val: '1', label: '1 & up', count: 1 },
            ].map((r) => {
              const isSelected = ratingFilter === r.val;
              return (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setRatingFilter(isSelected ? '' : r.val)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                    isSelected ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                        : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
                    }`}
                  >
                    {isSelected && <Check size={10} strokeWidth={3.5} className="text-white" />}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={11}
                          className={star <= r.count ? 'text-amber-500 fill-amber-500' : 'text-[#D1C7BD]'}
                        />
                      ))}
                    </div>
                    <span className="text-[11px]">{r.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
