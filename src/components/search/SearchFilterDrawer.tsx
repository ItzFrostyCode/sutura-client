'use client';

import React, { useRef, useState } from 'react';
import { X, RotateCcw, TrendingUp, TrendingDown, Star, Clock, Check, Sparkles, ChevronDown } from 'lucide-react';
import { FILTER_TABS, FilterTabKey, DISTRICTS } from './types';
import { SEARCH_DEPARTMENTS, getCategoryCollections } from '@/lib/navSearchCategories';
import { PORTFOLIO_COLOR_OPTIONS } from '@/components/store-storefront/types';
import ColorFamilyFilterSection from './ColorFamilyFilterSection';

interface SearchFilterDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly activeFilterTab: FilterTabKey;
  readonly setActiveFilterTab: (tab: FilterTabKey) => void;
  readonly draftSpecialization: string;
  readonly setDraftSpecialization: (val: string) => void;
  readonly department?: string;
  readonly draftColor?: string;
  readonly setDraftColor?: (val: string) => void;
  readonly draftOpenNow: boolean;
  readonly setDraftOpenNow: (val: boolean) => void;
  readonly draftMinPrice: string;
  readonly setDraftMinPrice: (val: string) => void;
  readonly draftMaxPrice: string;
  readonly setDraftMaxPrice: (val: string) => void;
  readonly draftMinRating: string;
  readonly setDraftMinRating: (val: string) => void;
  readonly draftDistrict: string;
  readonly setDraftDistrict: (val: string) => void;
  readonly sortBy: string;
  readonly setSortBy: (val: string) => void;
  readonly onReset: () => void;
  readonly onApply: () => void;
}

export default function SearchFilterDrawer({
  isOpen,
  onClose,
  activeFilterTab,
  setActiveFilterTab,
  draftSpecialization,
  setDraftSpecialization,
  department = '',
  draftColor = '',
  setDraftColor,
  draftOpenNow,
  setDraftOpenNow,
  draftMinPrice,
  setDraftMinPrice,
  draftMaxPrice,
  setDraftMaxPrice,
  draftMinRating,
  setDraftMinRating,
  draftDistrict,
  setDraftDistrict,
  sortBy,
  setSortBy,
  onReset,
  onApply,
}: SearchFilterDrawerProps) {
  const [activeDept, setActiveDept] = useState<string>(department || 'all');
  const currentDept = SEARCH_DEPARTMENTS.find((d) => d.key === activeDept) ?? SEARCH_DEPARTMENTS[0];
  const collections = getCategoryCollections(draftSpecialization);

  // Same-route navigations (e.g. clicking Men/Women/Wedding/Office in the
  // header while already on /search) don't remount this component — sync
  // the Department selector whenever the URL-derived department changes,
  // during render rather than an effect (avoids a cascading re-render).
  const [prevDepartment, setPrevDepartment] = useState(department);
  if (department && department !== prevDepartment) {
    setPrevDepartment(department);
    setActiveDept(department);
  }
  // Full color list, same as the desktop sidebar — not a curated per-category subset.
  const categoryColors = PORTFOLIO_COLOR_OPTIONS;

  // All sections are OPEN by default ("naka default na open lahat makita lahat")
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    department: true,
    category: true,
    collections: true,
    color: true,
    price: true,
    rating: true,
    district: true,
    availability: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filterScrollRef = useRef<HTMLDivElement>(null);
  const specializationRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const openNowRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<FilterTabKey, React.RefObject<HTMLDivElement | null>> = {
    specialization: specializationRef,
    color: colorRef,
    price: priceRef,
    rating: ratingRef,
    district: districtRef,
    openNow: openNowRef,
  };

  function sectionTopInContainer(el: HTMLDivElement, container: HTMLDivElement) {
    return el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  }

  function handleFilterScroll() {
    const container = filterScrollRef.current;
    if (!container) return;
    const scrollPos = container.scrollTop + 12;
    let current: FilterTabKey = 'specialization';
    for (const tab of FILTER_TABS) {
      const el = sectionRefs[tab.key]?.current;
      if (el && sectionTopInContainer(el, container) <= scrollPos) current = tab.key;
    }
    setActiveFilterTab(current);
  }

  function scrollToFilterSection(key: FilterTabKey) {
    // If target section is currently collapsed, expand it automatically
    if (!openSections[key]) {
      setOpenSections((prev) => ({ ...prev, [key]: true }));
    }
    const container = filterScrollRef.current;
    const el = sectionRefs[key]?.current;
    if (container && el) {
      container.scrollTo({ top: sectionTopInContainer(el, container) - 8, behavior: 'smooth' });
    }
    setActiveFilterTab(key);
  }

  const handleDeptClick = (deptKey: string) => {
    setActiveDept(deptKey);
    const targetDept = SEARCH_DEPARTMENTS.find((d) => d.key === deptKey);
    if (targetDept && deptKey !== 'all') {
      const hasCat = targetDept.categories.some(
        (c) => c.value.toLowerCase() === draftSpecialization.toLowerCase()
      );
      if (!hasCat) {
        setDraftSpecialization('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 max-w-[599px] sm:max-w-2xl mx-auto z-[70] flex flex-col border-x border-[#D1C7BD] rounded-none"
    >
      <button
        type="button"
        aria-label="Close filter"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer rounded-none"
      />

      {/* Full device height on mobile (not a capped max-h) so Reset/Apply
          always sit flush at the true bottom edge instead of floating above
          a visible strip of the dark overlay — device height dictates it,
          not content height. Desktop/tablet keeps the shorter dialog cap. */}
      <div className="relative bg-white rounded-none shadow-xl flex flex-col h-full sm:h-auto sm:max-h-[85%] overflow-hidden border-b border-[#D1C7BD]">
        {/* Header Bar in SUTURA Theme */}
        <div className="flex items-center justify-between px-3.5 h-12 bg-[#2D2A26] text-white border-b border-[#2D2A26] shrink-0 rounded-none">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Filters</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-[#D1C7BD] hover:text-white cursor-pointer rounded-none"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left rail navigation */}
          <nav className="w-[105px] shrink-0 bg-[#F5F1EC] border-r border-[#EBE6E0] overflow-y-auto rounded-none">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilterTab === tab.key;
              const hasValue =
                (tab.key === 'specialization' && !!draftSpecialization) ||
                (tab.key === 'color' && !!draftColor) ||
                (tab.key === 'price' && !!(draftMinPrice || draftMaxPrice || sortBy)) ||
                (tab.key === 'rating' && !!draftMinRating) ||
                (tab.key === 'district' && !!draftDistrict) ||
                (tab.key === 'openNow' && draftOpenNow);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => scrollToFilterSection(tab.key)}
                  className={`w-full text-left px-3 py-3 text-xs font-semibold border-l-2 transition-colors cursor-pointer rounded-none ${
                    isActive
                      ? 'bg-white border-[#2D2A26] text-[#2D2A26] font-bold'
                      : 'border-transparent text-[#524A44] hover:bg-[#EBE6E0]'
                  }`}
                >
                  {tab.label}
                  {hasValue && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-none bg-[#9A8073] align-middle" />}
                </button>
              );
            })}
          </nav>

          {/* Scrollable sections */}
          <div ref={filterScrollRef} onScroll={handleFilterScroll} className="flex-1 overflow-y-auto p-4 bg-white">
            {/* 1. Category / Department section */}
            <div ref={specializationRef}>
              {/* Department Dropdown Header */}
              <div
                onClick={() => toggleSection('department')}
                className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border border-[#D1C7BD] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none mb-1"
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
                <div className="border border-[#D1C7BD] divide-y divide-[#EBE6E0] rounded-none mb-4 bg-white">
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

              {/* Narrow by Category Dropdown Header */}
              <div
                onClick={() => toggleSection('category')}
                className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border border-[#D1C7BD] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none mb-1"
              >
                <span>Narrow by Category</span>
                <div className="flex items-center gap-2">
                  {draftSpecialization && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftSpecialization('');
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
                <div className="border border-[#EBE6E0] divide-y divide-[#F5F1EC] rounded-none">
                  <button
                    type="button"
                    onClick={() => setDraftSpecialization('')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                      !draftSpecialization ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-colors ${
                        !draftSpecialization
                          ? 'bg-[#2D2A26] border-[#2D2A26] text-white'
                          : 'bg-white border-[#D1C7BD] group-hover:border-[#827A73]'
                      }`}
                    >
                      {!draftSpecialization && <Check size={10} strokeWidth={3.5} className="text-white" />}
                    </span>
                    <span>All Categories</span>
                  </button>
                  {currentDept.categories.map((cat) => {
                    const isSelected = draftSpecialization.toLowerCase() === cat.value.toLowerCase();
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setDraftSpecialization(isSelected ? '' : cat.value)}
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
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Collections & Styles */}
              {collections.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#EBE6E0]">
                  <div
                    onClick={() => toggleSection('collections')}
                    className="flex items-center justify-between mb-2 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#827A73]" />
                      <p className="text-xs font-bold uppercase tracking-widest text-[#2D2A26]">Collections</p>
                    </div>
                    <ChevronDown
                      size={13}
                      className={`text-[#827A73] transition-transform duration-200 ${
                        openSections.collections ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {openSections.collections && (
                    <div className="flex flex-wrap gap-1.5">
                      {collections.map((col) => (
                        <span
                          key={col.label}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#F5F1EC] text-[#2D2A26] border border-[#D1C7BD] rounded-none"
                        >
                          {col.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Color section (Collapsible Dropdown) */}
            <div ref={colorRef} className="mt-6 border border-[#EBE6E0]">
              <div
                onClick={() => toggleSection('color')}
                className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
              >
                <span>Color</span>
                <div className="flex items-center gap-2">
                  {draftColor && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftColor?.('');
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
                    selectedColor={draftColor}
                    onColorChange={(val) => setDraftColor?.(val)}
                  />
                </div>
              )}
            </div>

            {/* 3. Price section (Collapsible Dropdown) */}
            <div ref={priceRef} className="mt-6 border border-[#EBE6E0]">
              <div
                onClick={() => toggleSection('price')}
                className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
              >
                <span>Price Range (₱)</span>
                <div className="flex items-center gap-2">
                  {(draftMinPrice || draftMaxPrice || sortBy) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftMinPrice('');
                        setDraftMaxPrice('');
                        setSortBy('');
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
                <div className="p-3 bg-white space-y-3">
                  {/* 1st: Low to High / High to Low buttons */}
                  <div className="grid grid-cols-2 border border-[#D1C7BD] divide-x divide-[#D1C7BD] rounded-none">
                    <button
                      type="button"
                      onClick={() => setSortBy(sortBy === 'price_asc' ? '' : 'price_asc')}
                      className={`py-2 flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded-none ${
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
                      className={`py-2 flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer rounded-none ${
                        sortBy === 'price_desc'
                          ? 'bg-[#2D2A26] text-white'
                          : 'bg-white text-[#524A44] hover:bg-[#F0EAE3]'
                      }`}
                    >
                      <TrendingDown size={12} />
                      <span>High to Low</span>
                    </button>
                  </div>

                  {/* 2nd: Min - Max Price Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      placeholder="Min ₱"
                      className="w-full h-8 px-2 bg-white border border-[#D1C7BD] rounded-none text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
                    />
                    <input
                      type="number"
                      min={0}
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      placeholder="Max ₱"
                      className="w-full h-8 px-2 bg-white border border-[#D1C7BD] rounded-none text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Rating section (Collapsible Dropdown) */}
            <div ref={ratingRef} className="mt-6 border border-[#EBE6E0]">
              <div
                onClick={() => toggleSection('rating')}
                className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
              >
                <span>Rating</span>
                <div className="flex items-center gap-2">
                  {draftMinRating && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftMinRating('');
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
                    { value: '5', label: '5 only', count: 5 },
                    { value: '4', label: '4 & up', count: 4 },
                    { value: '3', label: '3 & up', count: 3 },
                    { value: '2', label: '2 & up', count: 2 },
                    { value: '1', label: '1 & up', count: 1 },
                  ].map((r) => {
                    const isSelected = draftMinRating === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setDraftMinRating(isSelected ? '' : r.value)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                          isSelected ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#2D2A26] border-[#2D2A26] text-white' : 'bg-white border-[#D1C7BD]'
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

            {/* 5. Location section (Collapsible Dropdown) */}
            <div ref={districtRef} className="mt-6 border border-[#EBE6E0]">
              <div
                onClick={() => toggleSection('district')}
                className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
              >
                <span>Location (Davao City)</span>
                <div className="flex items-center gap-2">
                  {draftDistrict && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraftDistrict('');
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
                  <button
                    type="button"
                    onClick={() => setDraftDistrict('')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                      !draftDistrict ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                        !draftDistrict ? 'bg-[#2D2A26] border-[#2D2A26] text-white' : 'bg-white border-[#D1C7BD]'
                      }`}
                    >
                      {!draftDistrict && <Check size={10} strokeWidth={3.5} className="text-white" />}
                    </span>
                    <span>All Davao City</span>
                  </button>
                  {DISTRICTS.map((d) => {
                    const isSelected = draftDistrict.toLowerCase() === d.toLowerCase();
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDraftDistrict(isSelected ? '' : d)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-none group ${
                          isSelected ? 'bg-[#F0EAE3] font-bold text-[#2D2A26]' : 'hover:bg-[#FAF6F3] text-[#524A44]'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#2D2A26] border-[#2D2A26] text-white' : 'bg-white border-[#D1C7BD]'
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

            {/* 6. Hours / Open Now section (Collapsible Dropdown) */}
            <div ref={openNowRef} className="mt-6 border border-[#EBE6E0]">
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
                <label className="flex items-center gap-2.5 px-3 py-2.5 bg-white hover:bg-[#FAF6F3] cursor-pointer rounded-none select-none">
                  <input
                    type="checkbox"
                    checked={draftOpenNow}
                    onChange={(e) => setDraftOpenNow(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                      draftOpenNow ? 'bg-[#2D2A26] border-[#2D2A26] text-white' : 'bg-white border-[#D1C7BD]'
                    }`}
                  >
                    {draftOpenNow && <Check size={10} strokeWidth={3.5} className="text-white" />}
                  </span>
                  <Clock size={14} className={draftOpenNow ? 'text-[#2D2A26]' : 'text-[#827A73]'} />
                  <span className={`text-xs ${draftOpenNow ? 'font-bold text-[#2D2A26]' : 'font-normal text-[#524A44]'}`}>
                    Open Now
                  </span>
                </label>
              )}
            </div>

            <div className="h-16" aria-hidden="true" />
          </div>
        </div>

        {/* Action buttons (SUTURA Flat Buttons) */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-[#EBE6E0] bg-[#F5F1EC] shrink-0 rounded-none">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-white hover:bg-[#F0EAE3] border border-[#D1C7BD] text-xs font-bold uppercase tracking-wider text-[#2D2A26] cursor-pointer rounded-none transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 h-9 bg-[#2D2A26] hover:bg-[#9A8073] text-white text-xs font-bold uppercase tracking-wider cursor-pointer rounded-none transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
