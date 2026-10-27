'use client';

import React, { useRef } from 'react';
import {
  Sparkles,
  Scissors,
  Wrench,
  Shirt,
  Upload,
  Link as LinkIcon,
  X,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Layers,
  FileText,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import type { ServiceData, JobCreateFormData } from '../form/types';
import type { Staff } from '@/components/staff/staffHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';
import { GARMENT_CATEGORY_LABELS, GARMENT_TYPE_OPTIONS } from '../jobHelpers';

interface Step3OrderSpecsProps {
  orderType: 'catalog' | 'custom' | 'alteration';
  setOrderType: (type: 'catalog' | 'custom' | 'alteration') => void;
  // Catalog Items
  catalogItems: CatalogItem[];
  selectedCatalogItemId: string;
  onSelectCatalogItem: (item: CatalogItem) => void;
  // Services & Garment Type
  services: ServiceData[];
  selectedServiceId: string;
  onSelectService: (serviceId: string) => void;
  garmentCategory: string;
  setGarmentCategory: (category: JobCreateFormData['garment_category']) => void;
  // Fabric Source
  fabricSource: 'store_supplied' | 'customer_supplied';
  setFabricSource: (source: 'store_supplied' | 'customer_supplied') => void;
  // Reference Materials
  referenceImages: string[];
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  referenceLink: string;
  setReferenceLink: (link: string) => void;
  uploadingPhoto: boolean;
  onUploadPhoto: (file: File) => Promise<void>;
  // Staff Assignment
  staffList?: Staff[];
  assignedStaffId: string;
  setAssignedStaffId: (id: string) => void;
  // Notes
  notes: string;
  setNotes: (notes: string) => void;
  preExistingDamageNotes: string;
  setPreExistingDamageNotes: (notes: string) => void;
  // Navigation
  onBack: () => void;
  onProceed: () => void;
}


export default function Step3OrderSpecs({
  orderType,
  setOrderType,
  catalogItems,
  selectedCatalogItemId,
  onSelectCatalogItem,
  services,
  selectedServiceId,
  onSelectService,
  garmentCategory,
  setGarmentCategory,
  fabricSource,
  setFabricSource,
  referenceImages,
  setReferenceImages,
  referenceLink,
  setReferenceLink,
  uploadingPhoto,
  onUploadPhoto,
  staffList = [],
  assignedStaffId,
  setAssignedStaffId,
  notes,
  setNotes,
  preExistingDamageNotes,
  setPreExistingDamageNotes,
  onBack,
  onProceed,
}: Step3OrderSpecsProps) {
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await onUploadPhoto(files[i]);
    }
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-ink">Order Type & Specifications</h2>
        <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
          Define whether this is a catalog design, bespoke custom make, or repair, and configure garment details.
        </p>
      </div>

      {/* 3 Order Type Cards */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
          Order Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Catalog */}
          <button
            type="button"
            onClick={() => {
              setOrderType('catalog');
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-3 ${
              orderType === 'catalog'
                ? 'bg-taupe/10 border-taupe ring-2 ring-taupe'
                : 'bg-surface border-line hover:bg-canvas'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  orderType === 'catalog' ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'
                }`}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-ink">From Our Catalog</p>
                <p className="text-[11px] text-ink-muted">Pick from saved designs</p>
              </div>
            </div>
            <p className="text-[11px] text-ink-muted/80">
              Pre-designed barongs, gowns, and uniforms ready for tailoring.
            </p>
          </button>

          {/* Card 2: Custom */}
          <button
            type="button"
            onClick={() => {
              setOrderType('custom');
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-3 ${
              orderType === 'custom'
                ? 'bg-taupe/10 border-taupe ring-2 ring-taupe'
                : 'bg-surface border-line hover:bg-canvas'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  orderType === 'custom' ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'
                }`}
              >
                <Scissors size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-ink">Custom</p>
                <p className="text-[11px] text-ink-muted">Client describes what they want</p>
              </div>
            </div>
            <p className="text-[11px] text-ink-muted/80">
              Made-to-order bespoke tailoring created from scratch or photo.
            </p>
          </button>

          {/* Card 3: Alterations & Repair */}
          <button
            type="button"
            onClick={() => {
              setOrderType('alteration');
              setGarmentCategory('alteration_repair');
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-3 ${
              orderType === 'alteration'
                ? 'bg-taupe/10 border-taupe ring-2 ring-taupe'
                : 'bg-surface border-line hover:bg-canvas'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  orderType === 'alteration' ? 'bg-taupe text-white' : 'bg-canvas text-ink-muted'
                }`}
              >
                <Wrench size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-ink">Alterations & Repair</p>
                <p className="text-[11px] text-ink-muted">Fix or resize an existing garment</p>
              </div>
            </div>
            <p className="text-[11px] text-ink-muted/80">
              Hemming, tapering, zipper replacement, or patch restorations.
            </p>
          </button>
        </div>
      </div>

      {/* If Catalog: Pick Catalog Item */}
      {orderType === 'catalog' && (
        <div className="p-4 bg-canvas/40 border border-line rounded-xl space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
            Select Catalog Design
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
            {catalogItems.map((item) => {
              const isSelected = selectedCatalogItemId === item.id.toString();
              const primaryImage =
                item.images?.find((img) => Boolean(img.is_primary))?.image_url ||
                item.images?.[0]?.image_url ||
                item.fabric_image_url;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCatalogItem(item)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-taupe/15 border-taupe ring-2 ring-taupe shadow-xs'
                      : 'bg-surface border-line hover:bg-canvas'
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg bg-sunken overflow-hidden mb-2 border border-line/60">
                    {primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={primaryImage} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <Shirt size={22} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-ink truncate">{item.name}</p>
                  <p className="text-[11px] text-taupe font-semibold mt-0.5">
                    ₱{Number(item.price || 0).toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Garment & Service Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type of Service Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Type of Service <span className="text-danger">*</span>
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => onSelectService(e.target.value)}
            className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe cursor-pointer shadow-2xs"
          >
            <option value="">-- Choose Tailoring Service --</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id.toString()}>
                {svc.name} {svc.base_price ? `(from ₱${Number(svc.base_price).toLocaleString()})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Garment Type Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Garment Type
          </label>
          <select
            value={garmentCategory}
            onChange={(e) => setGarmentCategory(e.target.value as JobCreateFormData['garment_category'])}
            aria-describedby="garment-type-examples"
            className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe cursor-pointer shadow-2xs"
          >
            <option value="">-- Select Garment Type --</option>
            {GARMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {/* Set by the "Alterations & Repair" order type above, not picked here. */}
            {garmentCategory === 'alteration_repair' && (
              <option value="alteration_repair">{GARMENT_CATEGORY_LABELS.alteration_repair}</option>
            )}
          </select>
          <p id="garment-type-examples" className="mt-1.5 text-[11px] text-ink-muted">
            {GARMENT_TYPE_OPTIONS.find((o) => o.value === garmentCategory)?.examples
              ?? 'Pick the broad type: Top, Bottom, Full Set, Gown, Outerwear or Others.'}
          </p>
        </div>
      </div>

      {/* Fabric Source Segmented Control */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
          Fabric Source
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setFabricSource('store_supplied')}
            className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              fabricSource === 'store_supplied'
                ? 'bg-taupe text-white border-taupe shadow-xs'
                : 'bg-surface border-line text-ink-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            Store-Supplied Fabric
          </button>
          <button
            type="button"
            onClick={() => setFabricSource('customer_supplied')}
            className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              fabricSource === 'customer_supplied'
                ? 'bg-taupe text-white border-taupe shadow-xs'
                : 'bg-surface border-line text-ink-muted hover:text-ink hover:bg-canvas'
            }`}
          >
            Customer Brings Own Fabric
          </button>
        </div>
      </div>

      {/* If Alterations: Pre-existing Damage Notes */}
      {orderType === 'alteration' && (
        <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle size={15} className="text-amber-700" />
            <span>Pre-Existing Garment Condition / Damage Notes (Required)</span>
          </div>
          <p className="text-[11px] text-amber-800/90">
            Document any stains, tears, missing buttons, or existing wear before intake to protect your shop.
          </p>
          <textarea
            rows={2}
            value={preExistingDamageNotes}
            onChange={(e) => setPreExistingDamageNotes(e.target.value)}
            placeholder="e.g. Small yellow stain near collar, loose bottom button, right pocket frayed."
            className="w-full p-3 bg-surface border border-amber-300 rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
          />
        </div>
      )}

      {/* Reference Materials (Photos + Inspiration Link) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
          Reference Materials (Style Inspiration)
        </label>

        {/* Inspiration Photos Upload */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto || referenceImages.length >= 10}
            className="h-10 px-4 rounded-xl border border-line bg-surface hover:bg-canvas text-ink text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
          >
            {uploadingPhoto ? (
              <Loader2 size={15} className="animate-spin text-taupe" />
            ) : (
              <Upload size={15} className="text-taupe" />
            )}
            <span>{uploadingPhoto ? 'Uploading...' : '+ Add Style Photo'}</span>
          </button>
          <span className="text-[11px] text-ink-muted">
            Attach screenshots, sketch renders, or catalog reference photos.
          </span>
        </div>

        {/* Uploaded Images Thumbnails */}
        {referenceImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
            {referenceImages.map((url) => (
              <div
                key={url}
                className="relative group rounded-xl overflow-hidden border border-line bg-surface shadow-2xs aspect-square flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Style Reference" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setReferenceImages((prev) => prev.filter((u) => u !== url))}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/80 text-white flex items-center justify-center hover:bg-danger transition-colors cursor-pointer shadow-xs"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reference Link Input */}
        <div className="relative pt-1">
          <LinkIcon
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          />
          <input
            type="url"
            value={referenceLink}
            onChange={(e) => setReferenceLink(e.target.value)}
            placeholder="Style inspiration link (Pinterest, Google Drive, Facebook post, etc.)..."
            className="w-full h-10.5 pl-9 pr-4 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
          />
        </div>
      </div>

      {/* Custom Tailoring Notes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
          Custom Tailoring Notes & Specifications
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special embroidery requests, collar cuts, button preferences, lining materials..."
          className="w-full p-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
        />
      </div>

      {/* Staff & Tailor Assignment */}
      <div className="p-4 rounded-xl bg-canvas/40 border border-line/80 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
          <div className="flex items-center gap-2">
            <Scissors size={16} className="text-taupe" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Assign Tailor / Staff
            </h3>
          </div>
          {assignedStaffId && (
            <span className="text-[11px] font-semibold text-taupe flex items-center gap-1">
              <UserCheck size={13} />
              <span>Assigned</span>
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="create-order-assign-tailor-select"
            className="block text-xs font-medium text-ink-muted mb-1.5"
          >
            Designate a lead tailor or artisan to fulfill this order
          </label>
          <select
            id="create-order-assign-tailor-select"
            aria-label="Assign Tailor / Staff"
            value={assignedStaffId}
            onChange={(e) => setAssignedStaffId(e.target.value)}
            className="w-full h-11 px-3.5 bg-surface border border-line rounded-xl text-xs sm:text-sm font-medium text-ink focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs cursor-pointer transition-colors"
          >
            <option value="">— Unassigned (Queue on Production Board) —</option>
            {staffList.map((s) => {
              const sUserId = s.user_id ?? s.user?.id;
              const sName = s.user?.name || `Tailor #${sUserId}`;
              const sRole = s.role ? ` — ${roleLabel(s.role)}` : '';
              return (
                <option key={sUserId} value={String(sUserId)}>
                  {sName}{sRole}
                </option>
              );
            })}
          </select>
          <p className="text-[11px] text-ink-muted/80 mt-1.5">
            Orders assigned here will be immediately routed to the selected tailor&apos;s workspace pipeline upon creation.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 border-t border-line flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-5 rounded-xl border border-line bg-surface hover:bg-canvas text-ink text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="h-11 px-6 rounded-xl bg-taupe hover:bg-taupe-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
        >
          <span>Next: Invoice & Payment</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
