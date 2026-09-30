'use client';

import React, { useRef, useState } from 'react';
import { X, RotateCcw, TrendingUp, TrendingDown, Star, Check, Sparkles, ChevronDown } from 'lucide-react';
import { FILTER_TABS, FilterTabKey, DISTRICTS, SearchActiveTab } from './types';
import { getCategoryCollections } from '@/lib/navSearchCategories';
import {
  DEPARTMENTS,
  DEPARTMENT_LABELS,
  GARMENT_STRUCTURE_LABELS,
  GARMENT_TYPE_LABELS,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  SERVICE_TYPE_LABELS,
  SUBCATEGORY_LABELS,
  type GarmentStructure,
  type ServiceCategory,
  garmentTypesFor,
  isDepartment,
  serviceTypesFor,
  structuresFor,
  subcategoriesFor,
} from '@/lib/canonicalTaxonomy';
import RadioFilterSection from './RadioFilterSection';

interface SearchFilterDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly activeFilterTab: FilterTabKey;
  readonly setActiveFilterTab: (tab: FilterTabKey) => void;
  readonly draftSpecialization: string;
  readonly setDraftSpecialization: (val: string) => void;
  readonly department?: string;
  readonly setDepartment?: (val: string) => void;
  readonly draftSubcategory?: string;
  readonly setDraftSubcategory?: (val: string) => void;
  readonly draftStructure?: string;
  readonly setDraftStructure?: (val: string) => void;
  readonly draftGarmentType?: string;
  readonly setDraftGarmentType?: (val: string) => void;
  readonly draftServiceCategory?: string;
  readonly setDraftServiceCategory?: (val: string) => void;
  readonly draftServiceType?: string;
  readonly setDraftServiceType?: (val: string) => void;
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
  readonly activeTab?: SearchActiveTab;
}

export default function SearchFilterDrawer({
  isOpen,
  onClose,
  activeFilterTab,
  setActiveFilterTab,
  draftSpecialization,
  setDraftSpecialization,
  department = '',
  setDepartment,
  draftSubcategory = '',
  setDraftSubcategory,
  draftStructure = '',
  setDraftStructure,
  draftGarmentType = '',
  setDraftGarmentType,
  draftServiceCategory = '',
  setDraftServiceCategory,
  draftServiceType = '',
  setDraftServiceType,
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
  activeTab = 'store',
}: SearchFilterDrawerProps) {
  const collections = getCategoryCollections(draftGarmentType || draftSpecialization);

  const availableSubcategories = isDepartment(department) ? subcategoriesFor(department) : [];
  const availableStructures = isDepartment(department) && draftSubcategory ? structuresFor(department, draftSubcategory) : [];
  const availableGarmentTypes = isDepartment(department) && draftSubcategory && draftStructure
    ? garmentTypesFor(department, draftSubcategory, draftStructure as GarmentStructure)
    : [];

  const availableServiceTypes = draftServiceCategory
    ? serviceTypesFor(draftServiceCategory as ServiceCategory)
    : [];

  const departmentOptions = DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d] }));

  const handleDeptClick = (deptKey: string) => {
    const next = department === deptKey ? '' : deptKey;
    setDepartment?.(next);
    setDraftSubcategory?.('');
    setDraftStructure?.('');
    setDraftGarmentType?.('');
    setDraftSpecialization('');
  };

  const handleSubcatClick = (subcatKey: string) => {
    const next = draftSubcategory === subcatKey ? '' : subcatKey;
    setDraftSubcategory?.(next);
    setDraftStructure?.('');
    setDraftGarmentType?.('');
  };

  const handleStructureClick = (structureKey: string) => {
    const next = draftStructure === structureKey ? '' : structureKey;
    setDraftStructure?.(next);
    setDraftGarmentType?.('');
  };

  const handleGarmentTypeClick = (typeKey: string) => {
    setDraftGarmentType?.(draftGarmentType === typeKey ? '' : typeKey);
  };

  const handleServiceCategoryClick = (catKey: string) => {
    const next = draftServiceCategory === catKey ? '' : catKey;
    setDraftServiceCategory?.(next);
    setDraftServiceType?.('');
  };

  const handleServiceTypeClick = (typeKey: string) => {
    setDraftServiceType?.(draftServiceType === typeKey ? '' : typeKey);
  };

  // All sections are OPEN by default ("naka default na open lahat makita lahat")
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    department: true,
    subcategory: true,
    structure: true,
    garmentType: true,
    serviceCategory: true,
    serviceType: true,
    collections: true,
    price: true,
    rating: true,
    district: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filterScrollRef = useRef<HTMLDivElement>(null);
  const specializationRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<FilterTabKey, React.RefObject<HTMLDivElement | null>> = {
    specialization: specializationRef,
    price: priceRef,
    rating: ratingRef,
    district: districtRef,
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
                (tab.key === 'specialization' && !!(draftSpecialization || department || draftServiceCategory || draftSubcategory || draftStructure || draftGarmentType || draftServiceType)) ||
                (tab.key === 'price' && !!(draftMinPrice || draftMaxPrice || sortBy)) ||
                (tab.key === 'rating' && !!draftMinRating) ||
                (tab.key === 'district' && !!draftDistrict);
              const label = tab.key === 'specialization' && activeTab === 'services' ? 'Services' : tab.label;
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
                  {label}
                  {hasValue && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-none bg-[#9A8073] align-middle" />}
                </button>
              );
            })}
          </nav>

          {/* Scrollable sections */}
          <div ref={filterScrollRef} onScroll={handleFilterScroll} className="flex-1 overflow-y-auto p-4 bg-white">
            {/* 1. Category / Department / Services section */}
            <div ref={specializationRef} className="space-y-4 mb-4">
              {activeTab === 'services' ? (
                <>
                  <RadioFilterSection
                    title="Service Category"
                    sectionKey="serviceCategory"
                    isOpen={openSections.serviceCategory}
                    onToggle={toggleSection}
                    options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: SERVICE_CATEGORY_LABELS[c] }))}
                    selected={draftServiceCategory}
                    onSelect={handleServiceCategoryClick}
                    allLabel="All Service Categories"
                  />

                  {draftServiceCategory && availableServiceTypes.length > 0 && (
                    <RadioFilterSection
                      title="Service Type"
                      sectionKey="serviceType"
                      isOpen={openSections.serviceType}
                      onToggle={toggleSection}
                      options={availableServiceTypes.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] ?? t }))}
                      selected={draftServiceType}
                      onSelect={handleServiceTypeClick}
                      allLabel="All Service Types"
                    />
                  )}
                </>
              ) : (
                <>
                  <RadioFilterSection
                    title="Department"
                    sectionKey="department"
                    isOpen={openSections.department}
                    onToggle={toggleSection}
                    options={departmentOptions}
                    selected={department}
                    onSelect={handleDeptClick}
                    allLabel="All Departments"
                  />

                  {department && availableSubcategories.length > 0 && (
                    <RadioFilterSection
                      title="Subcategory"
                      sectionKey="subcategory"
                      isOpen={openSections.subcategory}
                      onToggle={toggleSection}
                      options={availableSubcategories.map((s) => ({ value: s, label: SUBCATEGORY_LABELS[s] ?? s }))}
                      selected={draftSubcategory}
                      onSelect={handleSubcatClick}
                      allLabel="All Subcategories"
                    />
                  )}

                  {draftSubcategory && availableStructures.length > 0 && (
                    <RadioFilterSection
                      title="Garment Structure"
                      sectionKey="structure"
                      isOpen={openSections.structure}
                      onToggle={toggleSection}
                      options={availableStructures.map((s) => ({ value: s, label: GARMENT_STRUCTURE_LABELS[s] }))}
                      selected={draftStructure}
                      onSelect={handleStructureClick}
                      allLabel="All Structures"
                    />
                  )}

                  {draftStructure && availableGarmentTypes.length > 0 && (
                    <RadioFilterSection
                      title="Garment Type"
                      sectionKey="garmentType"
                      isOpen={openSections.garmentType}
                      onToggle={toggleSection}
                      options={availableGarmentTypes.map((t) => ({ value: t, label: GARMENT_TYPE_LABELS[t] ?? t }))}
                      selected={draftGarmentType}
                      onSelect={handleGarmentTypeClick}
                      allLabel="All Garment Types"
                    />
                  )}
                </>
              )}

              {/* Collections & Styles — Catalog only */}
              {activeTab === 'showroom' && collections.length > 0 && (
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

            {/* 2. Price section (₱min - ₱max) */}
            <div ref={priceRef} className="mt-6 border border-[#EBE6E0]">
              <div
                onClick={() => toggleSection('price')}
                className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
              >
                <span>Price Range</span>
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

                  {/* 2nd: ₱min - ₱max Price Inputs */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#827A73]">₱</span>
                      <input
                        type="number"
                        min={0}
                        value={draftMinPrice}
                        onChange={(e) => setDraftMinPrice(e.target.value)}
                        placeholder="min"
                        aria-label="Minimum price in Pesos"
                        className="w-full h-10 sm:h-9 pl-7 pr-2 bg-white border border-[#D1C7BD] rounded-none text-[16px] sm:text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
                      />
                    </div>
                    <span className="text-sm text-[#827A73] font-bold shrink-0">—</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#827A73]">₱</span>
                      <input
                        type="number"
                        min={0}
                        value={draftMaxPrice}
                        onChange={(e) => setDraftMaxPrice(e.target.value)}
                        placeholder="max"
                        aria-label="Maximum price in Pesos"
                        className="w-full h-10 sm:h-9 pl-7 pr-2 bg-white border border-[#D1C7BD] rounded-none text-[16px] sm:text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
                      />
                    </div>
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

            {/* End of filter sections */}

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
