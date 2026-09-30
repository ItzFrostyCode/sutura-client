'use client';

import React, { useState } from 'react';
import { RotateCcw, Star, SlidersHorizontal, Check, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
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
import { DISTRICTS, SearchActiveTab } from './types';

interface SearchWebFilterSidebarProps {
  specialization: string;
  setSpecialization: (val: string) => void;
  department?: string;
  setDepartment?: (val: string) => void;
  subcategory?: string;
  setSubcategory?: (val: string) => void;
  structure?: string;
  setStructure?: (val: string) => void;
  garmentType?: string;
  setGarmentType?: (val: string) => void;
  serviceCategory?: string;
  setServiceCategory?: (val: string) => void;
  serviceType?: string;
  setServiceType?: (val: string) => void;
  onSelectQuery?: (q: string) => void;
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
  setDepartment,
  subcategory = '',
  setSubcategory,
  structure = '',
  setStructure,
  garmentType = '',
  setGarmentType,
  serviceCategory = '',
  setServiceCategory,
  serviceType = '',
  setServiceType,
  onSelectQuery,
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
  const collections = getCategoryCollections(garmentType || specialization);

  const availableSubcategories = isDepartment(department) ? subcategoriesFor(department) : [];
  const availableStructures = isDepartment(department) && subcategory ? structuresFor(department, subcategory) : [];
  const availableGarmentTypes = isDepartment(department) && subcategory && structure
    ? garmentTypesFor(department, subcategory, structure as GarmentStructure)
    : [];
  const availableServiceTypes = serviceCategory ? serviceTypesFor(serviceCategory as ServiceCategory) : [];

  const departmentOptions = DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d] }));

  // All sections are OPEN by default as requested ("naka default na open lahat makita lahat")
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

  const handleDeptClick = (deptKey: string) => {
    const next = department === deptKey ? '' : deptKey;
    setDepartment?.(next);
    setSubcategory?.('');
    setStructure?.('');
    setGarmentType?.('');
    setSpecialization('');
  };

  const handleSubcatClick = (subcatKey: string) => {
    const next = subcategory === subcatKey ? '' : subcatKey;
    setSubcategory?.(next);
    setStructure?.('');
    setGarmentType?.('');
  };

  const handleStructureClick = (structureKey: string) => {
    const next = structure === structureKey ? '' : structureKey;
    setStructure?.(next);
    setGarmentType?.('');
  };

  const handleGarmentTypeClick = (typeKey: string) => {
    setGarmentType?.(garmentType === typeKey ? '' : typeKey);
  };

  const handleServiceCategoryClick = (catKey: string) => {
    setServiceCategory?.(serviceCategory === catKey ? '' : catKey);
    setServiceType?.('');
  };

  const handleServiceTypeClick = (typeKey: string) => {
    setServiceType?.(serviceType === typeKey ? '' : typeKey);
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

      {activeTab === 'services' ? (
        <>
          {/* 2. Service Category (Custom Tailoring, Alterations & Repairs...) */}
          <RadioFilterSection
            title="Service Category"
            sectionKey="serviceCategory"
            isOpen={openSections.serviceCategory}
            onToggle={toggleSection}
            options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: SERVICE_CATEGORY_LABELS[c] }))}
            selected={serviceCategory}
            onSelect={handleServiceCategoryClick}
            allLabel="All Service Categories"
          />

          {/* 3. Service Type (leaf) — only once a Service Category is picked */}
          {serviceCategory && availableServiceTypes.length > 0 && (
            <RadioFilterSection
              title="Service Type"
              sectionKey="serviceType"
              isOpen={openSections.serviceType}
              onToggle={toggleSection}
              options={availableServiceTypes.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] ?? t }))}
              selected={serviceType}
              onSelect={handleServiceTypeClick}
              allLabel="All Service Types"
            />
          )}
        </>
      ) : (
        <>
          {/* 2. Department (Men/Women/Kids, +Services on the Stores tab) */}
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

          {/* 3. Subcategory (e.g. Formal Wear, Traditional Wear...) — only once a real Department (not "Services") is picked */}
          {department && availableSubcategories.length > 0 && (
            <RadioFilterSection
              title="Subcategory"
              sectionKey="subcategory"
              isOpen={openSections.subcategory}
              onToggle={toggleSection}
              options={availableSubcategories.map((s) => ({ value: s, label: SUBCATEGORY_LABELS[s] ?? s }))}
              selected={subcategory}
              onSelect={handleSubcatClick}
              allLabel="All Subcategories"
            />
          )}

          {/* 4. Garment Structure (Top Wear/Bottom Wear/Sets/One-Piece) — only once a Subcategory is picked */}
          {subcategory && availableStructures.length > 0 && (
            <RadioFilterSection
              title="Garment Structure"
              sectionKey="structure"
              isOpen={openSections.structure}
              onToggle={toggleSection}
              options={availableStructures.map((s) => ({ value: s, label: GARMENT_STRUCTURE_LABELS[s] }))}
              selected={structure}
              onSelect={handleStructureClick}
              allLabel="All Structures"
            />
          )}

          {/* 5. Garment Type (leaf) — only once a Structure is picked */}
          {structure && availableGarmentTypes.length > 0 && (
            <RadioFilterSection
              title="Garment Type"
              sectionKey="garmentType"
              isOpen={openSections.garmentType}
              onToggle={toggleSection}
              options={availableGarmentTypes.map((t) => ({ value: t, label: GARMENT_TYPE_LABELS[t] ?? t }))}
              selected={garmentType}
              onSelect={handleGarmentTypeClick}
              allLabel="All Garment Types"
            />
          )}
        </>
      )}

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

      {/* 5. Price Range (₱min - ₱max) */}
      <div className="border-b border-[#EBE6E0]">
        <div
          onClick={() => toggleSection('price')}
          className="bg-[#F5F1EC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#827A73] border-b border-[#EBE6E0] flex items-center justify-between hover:bg-[#EBE6E0] transition-colors cursor-pointer select-none"
        >
          <span>Price Range</span>
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

            {/* 2nd: ₱min - ₱max Price Inputs */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#827A73]">₱</span>
                <input
                  type="number"
                  min={0}
                  placeholder="min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-8 pl-6 pr-2 bg-white border border-[#D1C7BD] rounded-none text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
                />
              </div>
              <span className="text-xs text-[#827A73] font-bold shrink-0">—</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#827A73]">₱</span>
                <input
                  type="number"
                  min={0}
                  placeholder="max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-8 pl-6 pr-2 bg-white border border-[#D1C7BD] rounded-none text-xs text-[#2D2A26] placeholder:text-[#A8A19A] focus:outline-none focus:border-[#2D2A26]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

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

