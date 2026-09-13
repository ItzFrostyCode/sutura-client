'use client';

import React, { useMemo } from 'react';
import {
  Shirt,
  AlertTriangle,
  Trash2,
  Loader2,
  Sparkles,
  Scissors,
  Wrench,
  Ruler,
  ExternalLink,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';
import SearchableCombobox, { ComboboxOption } from '@/components/shared/SearchableCombobox';
import { JobCreateFormData } from './types';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;

interface GarmentDesignSectionProps {
  readonly formData: JobCreateFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<JobCreateFormData>>;
  readonly catalogItems: CatalogItem[];
  readonly catalogItemId: string;
  readonly setCatalogItemId: (id: string) => void;
  readonly onSelectCatalogItem?: (id: string) => void;
  readonly standardSize?: string;
  readonly setStandardSize?: (size: string) => void;
  readonly isSelectedAlterationRepair: boolean;
  readonly appointmentId: string | null;
  readonly referenceImages: string[];
  readonly setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  readonly referenceLink: string;
  readonly setReferenceLink: (link: string) => void;
  readonly uploadingReference: boolean;
  readonly setUploadingReference: (loading: boolean) => void;
  readonly shopId?: number;
}

export default function GarmentDesignSection({
  formData,
  setFormData,
  catalogItems,
  catalogItemId,
  setCatalogItemId,
  onSelectCatalogItem,
  standardSize = 'Custom Measurements',
  setStandardSize,
  isSelectedAlterationRepair,
  appointmentId,
  referenceImages,
  setReferenceImages,
  referenceLink,
  setReferenceLink,
  uploadingReference,
  setUploadingReference,
  shopId,
}: GarmentDesignSectionProps) {
  // Stateful design mode so clicking Showroom Lookbook immediately activates catalog mode
  const [selectedMode, setSelectedMode] = React.useState<'catalog' | 'custom' | 'alteration'>(() => {
    if (catalogItemId) return 'catalog';
    if (isSelectedAlterationRepair) return 'alteration';
    return 'custom';
  });

  // Sync state if catalogItemId or isSelectedAlterationRepair changes from props
  React.useEffect(() => {
    if (catalogItemId) {
      setSelectedMode('catalog');
    } else if (isSelectedAlterationRepair) {
      setSelectedMode('alteration');
    }
  }, [catalogItemId, isSelectedAlterationRepair]);

  const activeDesignMode = selectedMode;

  const handleModeChange = (mode: 'catalog' | 'custom' | 'alteration') => {
    setSelectedMode(mode);
    if (mode === 'catalog') {
      if (formData.garment_category === 'alteration_repair') {
        setFormData((prev) => ({ ...prev, garment_category: '' }));
      }
    } else if (mode === 'custom') {
      if (catalogItemId) {
        if (onSelectCatalogItem) onSelectCatalogItem('');
        else setCatalogItemId('');
      }
      if (formData.garment_category === 'alteration_repair') {
        setFormData((prev) => ({ ...prev, garment_category: '' }));
      }
    } else if (mode === 'alteration') {
      if (catalogItemId) {
        if (onSelectCatalogItem) onSelectCatalogItem('');
        else setCatalogItemId('');
      }
      setFormData((prev) => ({ ...prev, garment_category: 'alteration_repair' }));
    }
  };

  // Convert catalogItems into ComboboxOption with thumbnails, category, and non-truncating price
  const catalogOptions: ComboboxOption<CatalogItem>[] = useMemo(() => {
    return catalogItems.map((item) => {
      const primaryImage =
        item.images?.find((img) => img.is_primary)?.image_url ||
        item.images?.[0]?.image_url ||
        item.fabric_image_url;
      const numPrice = Number(item.price);
      return {
        id: item.id.toString(),
        label: item.name,
        sublabel: item.material
          ? `${item.category ? item.category.toUpperCase() + ' • ' : ''}${item.material}`
          : item.category ? item.category.toUpperCase() : undefined,
        badge: item.category,
        badgeColor: 'bg-taupe/10 text-taupe border-taupe/20',
        price: numPrice > 0 ? `₱${numPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : undefined,
        imageUrl: primaryImage ? getMediaUrl(primaryImage) : null,
        raw: item,
      };
    });
  }, [catalogItems]);

  // Selected catalog item object
  const selectedCatalogItem = useMemo(() => {
    if (!catalogItemId) return null;
    return catalogItems.find((c) => c.id.toString() === catalogItemId) || null;
  }, [catalogItems, catalogItemId]);

  const selectedPrimaryImage = useMemo(() => {
    if (!selectedCatalogItem) return null;
    return (
      selectedCatalogItem.images?.find((img) => img.is_primary)?.image_url ||
      selectedCatalogItem.images?.[0]?.image_url ||
      selectedCatalogItem.fabric_image_url
    );
  }, [selectedCatalogItem]);

  // Category filter state for quick pick gallery
  const [galleryCategoryFilter, setGalleryCategoryFilter] = React.useState<string>('all');

  const catalogCategories = useMemo(() => {
    const cats = new Map<string, number>();
    catalogItems.forEach((item) => {
      const rawCat = item.category || item.garment_type || 'Custom';
      const c = rawCat.trim();
      const lower = c.toLowerCase();
      cats.set(lower, (cats.get(lower) || 0) + 1);
    });
    return Array.from(cats.entries()).map(([lower, count]) => {
      const matchingItem = catalogItems.find(
        (i) => (i.category || i.garment_type || '').toLowerCase() === lower
      );
      const display = matchingItem?.category || matchingItem?.garment_type || lower;
      return { key: lower, label: display, count };
    });
  }, [catalogItems]);

  const displayedCatalogItems = useMemo(() => {
    if (galleryCategoryFilter === 'all') return catalogItems;
    return catalogItems.filter((item) => {
      const c = (item.category || item.garment_type || '').toLowerCase();
      return c === galleryCategoryFilter.toLowerCase();
    });
  }, [catalogItems, galleryCategoryFilter]);

  return (
    <CollapsibleSection
      icon={<Shirt size={16} className="text-taupe" />}
      title="Garment Type & Design Origin"
      description="Select whether this is from your Showroom lookbook, bespoke from scratch, or an alteration."
      defaultOpen={true}
    >
      {/* ── Design Origin Selector (Option A Unified Pipeline) ── */}
      <div className="mb-6 space-y-2">
        <label className="text-sm font-semibold text-ink flex items-center justify-between">
          <span>Design Source / Order Nature</span>
          <span className="text-[11px] font-normal text-ink-faint">All flow through tailoring production</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleModeChange('catalog')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
              activeDesignMode === 'catalog'
                ? 'border-taupe bg-taupe/10 text-taupe shadow-xs ring-1 ring-taupe/30'
                : 'border-line bg-surface hover:bg-canvas text-ink-muted'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activeDesignMode === 'catalog' ? 'bg-taupe text-white' : 'bg-sunken text-ink-muted'}`}>
              <Sparkles size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Showroom Lookbook</div>
              <div className="text-[10px] text-ink-muted leading-tight mt-0.5">Pick from curated catalog designs</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('custom')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
              activeDesignMode === 'custom'
                ? 'border-taupe bg-taupe/10 text-taupe shadow-xs ring-1 ring-taupe/30'
                : 'border-line bg-surface hover:bg-canvas text-ink-muted'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activeDesignMode === 'custom' ? 'bg-taupe text-white' : 'bg-sunken text-ink-muted'}`}>
              <Scissors size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Custom / Bespoke</div>
              <div className="text-[10px] text-ink-muted leading-tight mt-0.5">From scratch with client specs</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('alteration')}
            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
              activeDesignMode === 'alteration'
                ? 'border-taupe bg-taupe/10 text-taupe shadow-xs ring-1 ring-taupe/30'
                : 'border-line bg-surface hover:bg-canvas text-ink-muted'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${activeDesignMode === 'alteration' ? 'bg-taupe text-white' : 'bg-sunken text-ink-muted'}`}>
              <Wrench size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Alterations & Repair</div>
              <div className="text-[10px] text-ink-muted leading-tight mt-0.5">Adjustment on existing piece</div>
            </div>
          </button>
        </div>
      </div>

      {/* ── Catalog Lookbook Selection (When Catalog Mode is active) ── */}
      {activeDesignMode === 'catalog' && (
        <div className="mb-6 p-4 rounded-xl bg-canvas/40 border border-line space-y-3.5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Sparkles size={13} className="text-taupe" />
              Select Showroom Design Reference
            </span>
            <p className="text-[11px] text-ink-faint">
              Auto-populates base price, garment category, turnaround time, and reference photo for cutting and sewing.
            </p>
          </div>

          <SearchableCombobox<CatalogItem>
            items={catalogOptions}
            value={catalogItemId}
            onChange={(val) => {
              const strVal = String(val || '');
              if (onSelectCatalogItem) {
                onSelectCatalogItem(strVal);
              } else {
                setCatalogItemId(strVal);
              }
            }}
            placeholder="Search or pick a design (e.g. Andrea & Leo Gown, Barong Tagalog)..."
            searchPlaceholder="Type to search by design name, category, or fabric..."
            autoHighlightFirst={true}
            allowClear={true}
          />

          {/* Quick Pick Gallery Cards when no item is selected yet */}
          {!selectedCatalogItem && catalogItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-line/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    Showroom Collection ({displayedCatalogItems.length} of {catalogItems.length})
                  </span>
                </div>
                <span className="text-[10px] text-ink-faint">Click any design to auto-select</span>
              </div>

              {/* Category Filter Chips */}
              {catalogCategories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    type="button"
                    onClick={() => setGalleryCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      galleryCategoryFilter === 'all'
                        ? 'bg-taupe text-white shadow-2xs'
                        : 'bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    All ({catalogItems.length})
                  </button>
                  {catalogCategories.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setGalleryCategoryFilter(cat.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer capitalize ${
                        galleryCategoryFilter === cat.key
                          ? 'bg-taupe text-white shadow-2xs'
                          : 'bg-surface hover:bg-canvas border border-line text-ink-muted hover:text-ink'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Grid of ALL matching catalog items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1 border border-line/50 rounded-xl bg-canvas/20">
                {displayedCatalogItems.map((item) => {
                  const thumb =
                    item.images?.find((img) => img.is_primary)?.image_url ||
                    item.images?.[0]?.image_url ||
                    item.fabric_image_url;
                  const itemPrice = Number(item.price);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (onSelectCatalogItem) onSelectCatalogItem(item.id.toString());
                        else setCatalogItemId(item.id.toString());
                      }}
                      className="group p-2.5 rounded-xl bg-surface hover:bg-canvas border border-line hover:border-taupe text-left transition-all flex flex-col gap-2 cursor-pointer shadow-2xs hover:shadow-sm"
                    >
                      <div className="aspect-square w-full rounded-lg bg-sunken overflow-hidden relative border border-line/60">
                        {thumb ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={getMediaUrl(thumb)}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-faint">
                            <Shirt size={18} />
                          </div>
                        )}
                        {item.category && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white uppercase tracking-wider">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink truncate group-hover:text-taupe transition-colors" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-taupe mt-0.5">
                          {itemPrice > 0 ? `₱${itemPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Custom Price'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Catalog Design Preview Card */}
          {selectedCatalogItem && (
            <div className="mt-3 p-3.5 rounded-xl bg-surface border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-lg bg-sunken overflow-hidden border border-line shrink-0">
                  {selectedPrimaryImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getMediaUrl(selectedPrimaryImage)}
                      alt={selectedCatalogItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-faint">
                      <Shirt size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-ink truncate">{selectedCatalogItem.name}</h4>
                    {selectedCatalogItem.category && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-taupe/10 text-taupe uppercase border border-taupe/20">
                        {selectedCatalogItem.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted truncate mt-0.5">
                    {selectedCatalogItem.material || 'Standard Tailoring Fabric'}
                    {selectedCatalogItem.estimated_days ? ` • Est. ${selectedCatalogItem.estimated_days} days` : ''}
                  </p>
                  <div className="text-xs font-mono font-bold text-taupe mt-1">
                    Base: ₱{Number(selectedCatalogItem.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Link
                  href={`/dashboard/catalog/${selectedCatalogItem.id}`}
                  target="_blank"
                  className="px-2.5 py-1.5 rounded-lg border border-line bg-canvas hover:bg-sunken text-ink text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={11} />
                  <span>Showroom Specs</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectCatalogItem) onSelectCatalogItem('');
                    else setCatalogItemId('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-line hover:border-danger/30 text-ink-muted hover:text-danger text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Sizing Selection (Standard Size vs Custom Measurements) */}
          {selectedCatalogItem && setStandardSize && (
            <div className="mt-3 pt-3 border-t border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Ruler size={13} className="text-taupe" />
                  Sizing Specification
                </span>
                <span className="text-[10px] text-ink-faint">Select standard sizing or customer profile</span>
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                {STANDARD_SIZES.map((size) => {
                  const isSelected = standardSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setStandardSize(size)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-taupe text-white shadow-2xs'
                          : 'bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setStandardSize('Custom Measurements')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    standardSize === 'Custom Measurements'
                      ? 'bg-taupe text-white shadow-2xs'
                      : 'bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas'
                  }`}
                >
                  {standardSize === 'Custom Measurements' && <Check size={12} />}
                  <span>Custom Measurements</span>
                </button>
              </div>

              <p className="text-[10px] text-ink-faint">
                {standardSize === 'Custom Measurements'
                  ? 'Will link to the customer’s body measurement profile in Section 2.'
                  : `Tailoring will follow Standard ${standardSize} pattern blocks.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Garment Category ── */}
      <div className="mb-6 space-y-1.5">
        <label htmlFor="garment_category" className="text-sm font-medium text-ink-body">
          Garment Category <span className="text-xs font-normal text-ink-faint">(optional)</span>
        </label>
        <p className="text-[11px] text-ink-faint">
          Matches this job to your shop&apos;s garment specializations — helps staff assign the right cutters and tailors.
        </p>
        <select
          id="garment_category"
          value={formData.garment_category}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              garment_category: e.target.value as typeof prev.garment_category,
            }))
          }
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        >
          <option value="">Not specified</option>
          <option value="barong">Barong Tagalog</option>
          <option value="gown">Gown</option>
          <option value="suit">Suit</option>
          <option value="filipiniana">Filipiniana</option>
          <option value="uniform">School Uniform</option>
          <option value="lab_gown">Lab Gown</option>
          <option value="scrub_suit">Scrub Suit</option>
          <option value="corporate_wear">Corporate Wear</option>
          <option value="alteration_repair">Alterations & Repair</option>
        </select>
      </div>

      {/* ── Fabric / Material Source ── */}
      <div className="mb-6 space-y-1.5">
        <span className="text-sm font-medium text-ink-body">Fabric / Material Source</span>
        <p className="text-[11px] text-ink-faint">
          Some walk-ins bring their own fabric or an existing garment instead of using shop stock — flagging it here keeps it from getting mixed up with other jobs during cutting.
        </p>
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, material_source: 'shop_supplied' }))}
            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              formData.material_source === 'shop_supplied'
                ? 'border-taupe bg-taupe/10 text-taupe'
                : 'border-line text-ink-muted hover:bg-canvas'
            }`}
          >
            Shop-Supplied
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, material_source: 'customer_supplied' }))}
            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              formData.material_source === 'customer_supplied'
                ? 'border-taupe bg-taupe/10 text-taupe'
                : 'border-line text-ink-muted hover:bg-canvas'
            }`}
          >
            Customer&apos;s Own Fabric/Garment
          </button>
        </div>
        {formData.material_source === 'customer_supplied' && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5 flex items-start gap-2">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>
              Add a photo of the fabric/garment they brought in the <strong>Design Reference / Notes Photo</strong> section below — it will print on the Work Ticket so whoever cuts and sews this doesn&apos;t reach for shop stock.
            </span>
          </p>
        )}
      </div>

      {/* ── Reference Photos & Links ── */}
      <div className="mb-6 space-y-1.5">
        <span className="text-sm font-medium text-ink-body flex items-center gap-1.5">
          {isSelectedAlterationRepair ? 'Damage / Condition Photo' : 'Design Reference / Notes Photo'}{' '}
          <span className="text-xs font-normal text-ink-faint">(optional)</span>
        </span>
        <p className="text-[11px] text-ink-faint">
          {(() => {
            if (isSelectedAlterationRepair) {
              return 'A photo of the garment as received — pairs with the Pre-Existing Damage notes as evidence if the customer disputes when a stain/tear happened.';
            }
            if (appointmentId) {
              return 'Photos/link the customer attached when booking — carries over automatically to this job.';
            }
            return 'A photo the customer showed you, a link to what they want made (e.g. a jersey design or gown reference) — or snap a photo of paper notes so it stays attached to the job.';
          })()}
        </p>
        {referenceImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {referenceImages.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getMediaUrl(url)}
                  alt="Design reference"
                  className="h-20 w-20 object-cover rounded-lg border border-line"
                />
                <button
                  type="button"
                  onClick={() => setReferenceImages((prev) => prev.filter((u) => u !== url))}
                  className="absolute -top-2 -right-2 bg-surface border border-line text-ink-muted hover:text-danger rounded-full p-1 cursor-pointer shadow-xs"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-taupe hover:text-[#8A7063] bg-canvas hover:bg-sunken border border-line px-3 py-1.5 rounded-lg transition-colors mt-1">
          {uploadingReference ? <Loader2 size={14} className="animate-spin text-taupe" /> : null}
          <span>{uploadingReference ? 'Uploading...' : '+ Add reference photo'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingReference || referenceImages.length >= 10}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !shopId) return;
              setUploadingReference(true);
              const fd = new FormData();
              fd.append('file', file);
              try {
                const res = await api.post(`/shops/${shopId}/upload`, fd, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                const url = res.data?.data?.url || res.data?.url;
                if (url) setReferenceImages((prev) => [...prev, url]);
              } catch {
                alert('Failed to upload reference photo.');
              } finally {
                setUploadingReference(false);
              }
            }}
          />
        </label>
        <input
          type="text"
          value={referenceLink}
          onChange={(e) => setReferenceLink(e.target.value)}
          placeholder="Reference link (Pinterest, Facebook post, Google Drive, etc.)"
          className="w-full mt-1.5 px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
        />
      </div>
    </CollapsibleSection>
  );
}

