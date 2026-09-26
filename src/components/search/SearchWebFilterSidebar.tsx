'use client';

import React, { useState } from 'react';
import { RotateCcw, Star, SlidersHorizontal, Check, Clock, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { SEARCH_DEPARTMENTS, getCategoryCollections } from '@/lib/navSearchCategories';
import { PORTFOLIO_COLOR_OPTIONS } from '@/components/store-storefront/types';
import ColorFamilyFilterSection from './ColorFamilyFilterSection';
import { DISTRICTS, SearchActiveTab } from './types';

interface SearchWebFilterSidebarProps {
  specialization: string;
  setSpecialization: (val: string) => void;
  department?: string;
  color?: string;
  setColor?: (val: string) => void;
  onSelectQuery?: (q: string) => void;
  openNow: boolean;
  setOpenNow: (val: boolean) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  sortBy?: string;
  setSortBy?: (val: string) => void;
  minRating: string;
  setMinRating: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  onReset: () => void;
  activeFilterCount: number;
  activeTab?: SearchActiveTab;
}

export default function SearchWebFilterSidebar({
  specialization,
  setSpecialization,
  department = '',
  color,
  setColor,
  onSelectQuery,
  openNow,
  setOpenNow,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy = '',
  setSortBy,
  minRating,
  setMinRating,
  district,
  setDistrict,
  onReset,
  activeFilterCount,
  activeTab = 'store',
}: Readonly<SearchWebFilterSidebarProps>) {
  const [activeDept, setActiveDept] = useState<string>(department || 'all');
  const currentDept = SEARCH_DEPARTMENTS.find((d) => d.key === activeDept) ?? SEARCH_DEPARTMENTS[0];

  // Same-route navigations (e.g. clicking Men/Women/Wedding/Office in the
  // header while already on /search) don't remount this component — sync
  // the Department selector whenever the URL-derived department changes,
  // during render rather than an effect (avoids a cascading re-render).
  const [prevDepartment, setPrevDepartment] = useState(department);
  if (department && department !== prevDepartment) {
    setPrevDepartment(department);
    setActiveDept(department);
  }

  // Full color list — same complete reference palette the store profile's
  // own filter uses, not a curated per-category subset. A category-scoped
  // palette meant a color could be unpickable just because it wasn't
  // pre-assigned to whatever department/category was active.
  const categoryColors = PORTFOLIO_COLOR_OPTIONS;
  const collections = getCategoryCollections(specialization);

  // All sections are OPEN by default as requested ("naka default na open lahat makita lahat")
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    department: true,
    category: true,
    collections: true,
    color: true,
    availability: true,
    price: true,
    rating: true,
    district: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeptClick = (deptKey: string) => {
    setActiveDept(deptKey);
    const targetDept = SEARCH_DEPARTMENTS.find((d) => d.key === deptKey);
    if (targetDept && deptKey !== 'all') {
      const hasCat = targetDept.categories.some(
        (c) => c.value.toLowerCase() === specialization.toLowerCase()
      );
      if (!hasCat) {
        setSpecialization('');
      }
    }
  };

  return (
    <aside className="w-[250px] lg:w-[270px] shrink-0 sticky top-[196px] self-start border border-[#D1C7BD] bg-white rounded-none shadow-none text-[#2D2A26] select-none">
      {/* 1. Header Bar - SUTURA Warm Ink Theme */}
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

      {/* 2. Department Selector: 1 Column with 5 Rows (Collapsible Dropdown) */}
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
            {SEARCH_DEPARTMENTS.map((dept) => {
              const isSelected = activeDept === dept.key;
              return (
                <button
                  key={dept.key}
                  type="button"
                  onClick={() => handleDeptClick(dept.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                    isSelected
                      ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]'
                      : 'hover:bg-[#FAF6F3] text-[#524A44]'
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

      {/* 3. Categories (Collapsible Dropdown - ALL VISIBLE, NO SCROLL) */}
      <div className="border-b border-[#EBE6E0]">
        <div
          onClick={() => toggleSection('category')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Narrow by Category</span>
          <div className="flex items-center gap-2">
            {specialization && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSpecialization('');
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
            {/* All Categories Option */}
            <button
              type="button"
              onClick={() => setSpecialization('')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                !specialization ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                  !specialization
                    ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                    : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
                }`}
              >
                {!specialization && <Check size={10} strokeWidth={3.5} className="text-white" />}
              </span>
              <span className="truncate">All Categories</span>
            </button>

            {/* Department Categories */}
            {currentDept.categories.map((cat) => {
              const isSelected = specialization.toLowerCase() === cat.value.toLowerCase();
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSpecialization(isSelected ? '' : cat.value)}
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

      {/* 4. Collections & Styles (Collapsible Dropdown — Catalog only) */}
      {activeTab === 'showroom' && collections.length > 0 && (
        <div className="border-b border-[#EBE6E0]">
          <div
            onClick={() => toggleSection('collections')}
            className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
          >
            <span>Collections & Styles</span>
            <ChevronDown
              size={13}
              className={`text-[#827A73] transition-transform duration-200 ${
                openSections.collections ? 'rotate-180' : ''
              }`}
            />
          </div>
          {openSections.collections && (
            <div className="divide-y divide-[#F5F1EC] bg-white">
              {collections.map((col) => (
                <button
                  key={col.label}
                  type="button"
                  onClick={() => onSelectQuery?.(col.q)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left text-[#524A44] hover:bg-[#FAF6F3] transition-colors cursor-pointer rounded-none group"
                >
                  <span className="w-3.5 h-3.5 rounded-none border border-[#D1C7BD] bg-white group-hover:border-[#827A73] shrink-0" />
                  <span className="truncate">{col.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Color Swatches (Collapsible Dropdown — Catalog only) */}
      {activeTab === 'showroom' && (
        <div className="border-b border-[#EBE6E0]">
        <div
          onClick={() => toggleSection('color')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Color</span>
          <div className="flex items-center gap-2">
            {color && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setColor?.('');
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
              selectedColor={color ?? ''}
              onColorChange={(val) => setColor?.(val)}
            />
          </div>
        )}
      </div>
      )}

      {/* 6. Availability (Collapsible Dropdown) */}
      <div className="border-b border-[#EBE6E0]">
        <div
          onClick={() => toggleSection('availability')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Availability</span>
          <ChevronDown
            size={13}
            className={`text-[#827A73] transition-transform duration-200 ${
              openSections.availability ? 'rotate-180' : ''
            }`}
          />
        </div>
        {openSections.availability && (
          <label className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#2D2A26] hover:bg-[#FAF6F3] cursor-pointer rounded-none select-none">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                openNow ? 'bg-[#2D2A26] border-[#2D2A26] text-white' : 'bg-white border-[#D1C7BD]'
              }`}
            >
              {openNow && <Check size={10} strokeWidth={3.5} className="text-white" />}
            </span>
            <Clock size={13} className={openNow ? 'text-[#2D2A26]' : 'text-[#827A73]'} />
            <span className={openNow ? 'font-bold text-[#2D2A26]' : 'font-normal text-[#524A44]'}>
              Open Now
            </span>
          </label>
        )}
      </div>

      {/* 7. Price Range (Collapsible Dropdown: 1st Low to High/High to Low, 2nd Min - Max — Catalog & Services) */}
      {(activeTab === 'showroom' || activeTab === 'services') && (
        <div className="border-b border-[#EBE6E0]">
        <div
          onClick={() => toggleSection('price')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Price Range (₱)</span>
          <div className="flex items-center gap-2">
            {(minPrice || maxPrice || sortBy) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinPrice('');
                  setMaxPrice('');
                  setSortBy?.('');
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
            {/* 1st: Low to High / High to Low buttons */}
            {setSortBy && (
              <div className="grid grid-cols-2 border border-[#D1C7BD] divide-x divide-[#D1C7BD] rounded-none">
                <button
                  type="button"
                  onClick={() => setSortBy(sortBy === 'price_asc' ? '' : 'price_asc')}
                  className={`py-1.5 flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded-none ${
                    sortBy === 'price_asc'
                      ? 'bg-[#2D2A26] text-white'
                      : 'bg-white text-[#524A44] hover:bg-[#F0EAE3]'
                  }`}
                >
                  <TrendingUp size={12} />
                  <span>Low to High</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy(sortBy === 'price_desc' ? '' : 'price_desc')}
                  className={`py-1.5 flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded-none ${
                    sortBy === 'price_desc'
                      ? 'bg-[#2D2A26] text-white'
                      : 'bg-white text-[#524A44] hover:bg-[#F0EAE3]'
                  }`}
                >
                  <TrendingDown size={12} />
                  <span>High to Low</span>
                </button>
              </div>
            )}

            {/* 2nd: Min - Max Price Inputs */}
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
      )}

      {/* 8. Rating (Collapsible Dropdown: 5 only, 4 & up, 3 & up, 2 & up, 1 & up) */}
      <div className="border-b border-[#EBE6E0]">
        <div
          onClick={() => toggleSection('rating')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Rating</span>
          <div className="flex items-center gap-2">
            {minRating && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMinRating('');
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
              const isSelected = minRating === r.val;
              return (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setMinRating(isSelected ? '' : r.val)}
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
                          className={
                            star <= r.count
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-[#D1C7BD]'
                          }
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

      {/* 9. Davao City District (Collapsible Dropdown: All visible, no inner scroll) */}
      <div>
        <div
          onClick={() => toggleSection('district')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Davao City District</span>
          <div className="flex items-center gap-2">
            {district && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDistrict('');
                }}
                className="text-[10px] font-semibold text-[#9A8073] hover:text-[#2D2A26] hover:underline cursor-pointer lowercase"
              >
                (all)
              </button>
            )}
            <ChevronDown
              size={13}
              className={`text-[#827A73] transition-transform duration-200 ${
                openSections.district ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
        {openSections.district && (
          <div className="divide-y divide-[#F5F1EC] bg-white">
            {/* All Districts */}
            <button
              type="button"
              onClick={() => setDistrict('')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                !district ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                  !district
                    ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                    : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
                }`}
              >
                {!district && <Check size={10} strokeWidth={3.5} className="text-white" />}
              </span>
              <span>All Davao City</span>
            </button>

            {/* District list - all visible, no overflow scroll */}
            {DISTRICTS.map((d) => {
              const isSelected = district.toLowerCase() === d.toLowerCase();
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistrict(isSelected ? '' : d)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer rounded-none group ${
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
                  <span>{d}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
