'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X, Scissors, Sparkles, Plus, Loader2, Clock, FileText, ArrowLeft, Check } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { getServicePriceLabel } from '@/lib/servicePricing';
import { Service } from './types';
import ItemQuantitySelector from '@/components/shared/ItemQuantitySelector';

export interface CatalogDesignItem {
  id: number;
  name: string;
  price: number | string | null;
  service_id?: number | null;
  service?: { id: number; name: string; min_order_qty?: number } | null;
  images?: Array<{ id: number; image_url: string; is_primary?: boolean }>;
  garment_type?: string | null;
  sizes?: string[] | null;
  color?: string | null;
}

export interface AddRequestedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  services: Service[];
  prefilterServiceId?: number | null;
  onAddService: (service: Service, quantity?: number, customDetails?: string) => void;
  onAddCatalogDesign: (
    item: CatalogDesignItem,
    options: { quantity: number; size?: string; color?: string; customDetails?: string }
  ) => void;
}

export default function AddRequestedItemModal({
  isOpen,
  onClose,
  storeId,
  services,
  prefilterServiceId = null,
  onAddService,
  onAddCatalogDesign,
}: AddRequestedItemModalProps) {
  const [tab, setTab] = useState<'services' | 'designs'>('services');
  const [designs, setDesigns] = useState<CatalogDesignItem[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [designsLoaded, setDesignsLoaded] = useState(false);

  // Selected Service configuration state (Combination 1 & 2: Service + Quantity ± Custom Details)
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceQty, setServiceQty] = useState(1);
  const [serviceNotes, setServiceNotes] = useState('');

  // Selected Design configuration state (Combination 3 & 4: Service + Quantity + Design ± Custom Details)
  const [selectedDesign, setSelectedDesign] = useState<CatalogDesignItem | null>(null);
  const [designQty, setDesignQty] = useState(1);
  const [chosenSize, setChosenSize] = useState<string>('');
  const [chosenColor, setChosenColor] = useState<string>('');
  const [designNotes, setDesignNotes] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedService(null);
      setSelectedDesign(null);
      setServiceNotes('');
      setDesignNotes('');
      return;
    }

    if (prefilterServiceId) {
      setTab('designs');
    } else {
      setTab('services');
    }
  }, [isOpen, prefilterServiceId]);

  useEffect(() => {
    if (!isOpen) return;

    if (tab === 'designs' && !designsLoaded) {
      setLoadingDesigns(true);
      api
        .get(`/catalog/${storeId}`)
        .then((res) => {
          setDesigns(res.data?.data || []);
          setDesignsLoaded(true);
        })
        .catch((err) => {
          console.error('Failed to load catalog designs:', err);
        })
        .finally(() => {
          setLoadingDesigns(false);
        });
    }
  }, [isOpen, tab, designsLoaded, storeId]);

  // Filter designs if prefilterServiceId is provided
  const visibleDesigns = useMemo(() => {
    if (!prefilterServiceId) return designs;
    return designs.filter(
      (d) => d.service_id === prefilterServiceId || d.service?.id === prefilterServiceId
    );
  }, [designs, prefilterServiceId]);

  if (!isOpen) return null;

  const handlePickService = (svc: Service) => {
    setSelectedService(svc);
    const minQ = Math.max(1, Number(svc.min_order_qty) || 1);
    setServiceQty(minQ);
    setServiceNotes('');
  };

  const handleConfirmService = () => {
    if (!selectedService) return;
    onAddService(selectedService, serviceQty, serviceNotes.trim() || undefined);
    setSelectedService(null);
    setServiceNotes('');
    onClose();
  };

  const handlePickDesign = (d: CatalogDesignItem) => {
    setSelectedDesign(d);
    const parentSvc = services.find((s) => s.id === d.service_id) || d.service;
    const minQ = Math.max(1, Number(parentSvc?.min_order_qty) || 1);
    setDesignQty(minQ);
    setChosenSize(d.sizes?.[0] || '');
    setChosenColor(d.color || '');
    setDesignNotes('');
  };

  const handleConfirmDesign = () => {
    if (!selectedDesign) return;
    onAddCatalogDesign(selectedDesign, {
      quantity: designQty,
      size: chosenSize || undefined,
      color: chosenColor || undefined,
      customDetails: designNotes.trim() || undefined,
    });
    setSelectedDesign(null);
    setDesignNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[599px] sm:max-w-2xl bg-surface border border-line rounded-2xl shadow-xl flex flex-col max-h-[90dvh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-surface shrink-0">
          <div>
            <h2 id="add-item-modal-title" className="mobile-h3 sm:tablet-h3 text-ink font-semibold">
              Add Service or Design
            </h2>
            <p className="mobile-caption text-ink-muted mt-0.5 font-normal">
              Select what you want made. The shop tailor confirms final specs and price during consultation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-canvas text-ink-muted hover:text-ink transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        {!selectedService && !selectedDesign && (
          <div className="p-3 sm:p-4 border-b border-line bg-canvas/40 shrink-0">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-sunken rounded-xl border border-line">
              <button
                type="button"
                onClick={() => setTab('services')}
                className={`h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  tab === 'services'
                    ? 'bg-surface text-ink shadow-xs border border-line/60'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                }`}
              >
                <Scissors size={16} className={tab === 'services' ? 'text-taupe' : ''} />
                <span>Tailoring Services ({services.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('designs')}
                className={`h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  tab === 'designs'
                    ? 'bg-surface text-ink shadow-xs border border-line/60'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/50'
                }`}
              >
                <Sparkles size={16} className={tab === 'designs' ? 'text-taupe' : ''} />
                <span>
                  Catalog Designs {prefilterServiceId ? `(${visibleDesigns.length})` : ''}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {/* TAB 1: TAILORING SERVICES */}
          {tab === 'services' && (
            <>
              {selectedService ? (
                /* Selected Service Configuration Sheet (Service + Quantity + Optional Custom Details) */
                <div className="p-4 rounded-xl border border-line bg-surface space-y-4 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      className="text-xs font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back to all services
                    </button>
                    <span className="text-[10px] uppercase font-bold text-taupe px-2 py-0.5 rounded bg-taupe/10">
                      Service Requirement
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="mobile-h3 font-semibold text-ink">{selectedService.name}</h3>
                    <p className="mobile-caption text-taupe font-semibold">
                      {getServicePriceLabel(selectedService.base_price)}
                    </p>
                    <p className="text-xs text-ink-muted font-normal mt-1">
                      No design required. You can discuss custom tailoring, provide your own fabric, or request measurements during the appointment.
                    </p>
                  </div>

                  {/* Quantity Field (Required) */}
                  <div className="pt-2 border-t border-line space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="mobile-caption font-semibold text-ink block">
                        Quantity of Garments <span className="text-danger">*</span>
                      </label>
                      {Number(selectedService.min_order_qty) > 1 && (
                        <span className="text-[11px] text-taupe font-medium">
                          Usually at least {selectedService.min_order_qty} pcs
                        </span>
                      )}
                    </div>
                    <ItemQuantitySelector
                      quantity={serviceQty}
                      minQuantity={Math.max(1, Number(selectedService.min_order_qty) || 1)}
                      onChange={setServiceQty}
                      hideLabel={true}
                    />
                  </div>

                  {/* Custom Details Field (Optional) */}
                  <div className="pt-2 border-t border-line space-y-1.5">
                    <label className="mobile-caption font-semibold text-ink flex items-center gap-1.5">
                      <FileText size={13} className="text-taupe" />
                      Custom Details &amp; Tailoring Notes <span className="text-ink-muted font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={serviceNotes}
                      onChange={(e) => setServiceNotes(e.target.value)}
                      placeholder="e.g. Preferred fabric, collar style, chest logo embroidery, or specific measurements..."
                      className="w-full form-input-mobile bg-white border border-line rounded-xl text-sm p-3 text-ink placeholder:text-ink-faint focus:border-taupe focus:ring-1 focus:ring-taupe outline-none transition-all"
                    />
                    <p className="text-[11px] text-ink-muted font-normal">
                      The tailor will review these requirements during your consultation.
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleConfirmService}
                    className="w-full min-h-[48px] h-[52px] flex items-center justify-center gap-2 bg-taupe hover:bg-ink text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs mt-2"
                  >
                    <Plus size={16} /> Add Service ({serviceQty} {serviceQty === 1 ? 'piece' : 'pieces'})
                  </button>
                </div>
              ) : services.length === 0 ? (
                <div className="py-12 text-center text-ink-muted mobile-body-sm">
                  No active tailoring services listed for this store.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((svc) => {
                    const minQ = Math.max(1, Number(svc.min_order_qty) || 1);
                    return (
                      <div
                        key={svc.id}
                        className="p-3.5 rounded-xl border border-line bg-surface hover:border-taupe/60 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="mobile-h4 font-semibold text-ink line-clamp-1">{svc.name}</h3>
                            <span className="text-[10px] uppercase font-bold text-taupe px-1.5 py-0.5 rounded bg-taupe/10 shrink-0">
                              Service
                            </span>
                          </div>
                          <p className="mobile-caption font-semibold text-taupe mt-1">
                            {getServicePriceLabel(svc.base_price)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-ink-muted">
                            {svc.estimated_days && (
                              <span className="flex items-center gap-1 font-normal">
                                <Clock size={11} className="text-taupe" /> Est. {svc.estimated_days}d
                              </span>
                            )}
                            {minQ > 1 && (
                              <span className="bg-sunken px-1.5 py-0.5 rounded font-medium text-ink-body">
                                Min: {minQ} pcs
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePickService(svc)}
                          className="w-full h-10 flex items-center justify-center gap-1.5 text-xs font-semibold text-taupe border border-taupe hover:bg-taupe/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus size={14} /> Configure &amp; Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: CATALOG DESIGNS */}
          {tab === 'designs' && (
            <>
              {loadingDesigns ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-ink-muted">
                  <Loader2 size={24} className="animate-spin text-taupe" />
                  <span className="mobile-caption font-normal">Loading designs...</span>
                </div>
              ) : visibleDesigns.length === 0 ? (
                <div className="py-12 text-center text-ink-muted mobile-body-sm">
                  {prefilterServiceId
                    ? 'No specific catalog designs under this service. You can request it as a custom service.'
                    : 'No catalog designs available for this shop.'}
                </div>
              ) : selectedDesign ? (
                /* Selected Design Configuration Sheet (Service + Quantity + Design + Optional Custom Details) */
                <div className="p-4 rounded-xl border border-line bg-surface space-y-4 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDesign(null)}
                      className="text-xs font-semibold text-taupe hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Back to all designs
                    </button>
                    <span className="text-[10px] uppercase font-bold text-taupe px-2 py-0.5 rounded bg-taupe/10">
                      Design Specification
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    {selectedDesign.images?.[0]?.image_url ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-line shrink-0 bg-sunken">
                        <Image
                          src={getMediaUrl(selectedDesign.images[0].image_url)}
                          alt={selectedDesign.name}
                          fill
                          className="object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-line shrink-0 bg-sunken flex items-center justify-center text-ink-faint">
                        <Sparkles size={24} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="mobile-h4 font-semibold text-ink truncate">{selectedDesign.name}</h3>
                      <p className="mobile-caption text-ink-muted mt-0.5 font-normal">
                        Parent Service: <span className="font-medium text-ink">{selectedDesign.service?.name || 'General Tailoring'}</span>
                      </p>
                      {selectedDesign.price != null && (
                        <p className="mobile-caption font-semibold text-taupe mt-1">
                          From ₱{Number(selectedDesign.price).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Size Options if any */}
                  {selectedDesign.sizes && selectedDesign.sizes.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-line">
                      <label className="mobile-caption font-semibold text-ink block">
                        Select Size (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedDesign.sizes.map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setChosenSize(s)}
                            className={`min-h-[38px] px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                              chosenSize === s
                                ? 'border-taupe bg-taupe/10 text-taupe ring-1 ring-taupe'
                                : 'border-line bg-surface hover:border-taupe/40 text-ink-body'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Option if any */}
                  {selectedDesign.color && (
                    <div className="space-y-1.5 pt-2 border-t border-line">
                      <label className="mobile-caption font-semibold text-ink block">
                        Color (Optional)
                      </label>
                      <input
                        type="text"
                        value={chosenColor}
                        onChange={(e) => setChosenColor(e.target.value)}
                        placeholder="e.g. Navy Blue"
                        className="w-full form-input-mobile bg-white border border-line rounded-lg text-sm px-3 h-10 text-ink"
                      />
                    </div>
                  )}

                  {/* Quantity Field (Required) */}
                  <div className="space-y-1.5 pt-2 border-t border-line">
                    <div className="flex items-center justify-between">
                      <label className="mobile-caption font-semibold text-ink block">
                        Quantity of Garments <span className="text-danger">*</span>
                      </label>
                      {Number(selectedDesign.service?.min_order_qty) > 1 && (
                        <span className="text-[11px] text-taupe font-medium">
                          Usually at least {selectedDesign.service?.min_order_qty} pcs
                        </span>
                      )}
                    </div>
                    <ItemQuantitySelector
                      quantity={designQty}
                      minQuantity={Math.max(1, Number(selectedDesign.service?.min_order_qty) || 1)}
                      onChange={setDesignQty}
                      hideLabel={true}
                    />
                  </div>

                  {/* Custom Details Field (Optional) */}
                  <div className="space-y-1.5 pt-2 border-t border-line">
                    <label className="mobile-caption font-semibold text-ink flex items-center gap-1.5">
                      <FileText size={13} className="text-taupe" />
                      Custom Details &amp; Tailoring Notes <span className="text-ink-muted font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={designNotes}
                      onChange={(e) => setDesignNotes(e.target.value)}
                      placeholder="e.g. Specific fabric preference, custom logo embroidery on chest/back, modified length..."
                      className="w-full form-input-mobile bg-white border border-line rounded-xl text-sm p-3 text-ink placeholder:text-ink-faint focus:border-taupe focus:ring-1 focus:ring-taupe outline-none transition-all"
                    />
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleConfirmDesign}
                    className="w-full min-h-[48px] h-[52px] flex items-center justify-center gap-2 bg-taupe hover:bg-ink text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs mt-2"
                  >
                    <Plus size={16} /> Add Design to Appointment
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleDesigns.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => handlePickDesign(d)}
                      className="p-3 rounded-xl border border-line bg-surface hover:border-taupe/60 transition-all flex items-start gap-3 text-left cursor-pointer group shadow-2xs"
                    >
                      {d.images?.[0]?.image_url ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
                          <Image
                            src={getMediaUrl(d.images[0].image_url)}
                            alt={d.name}
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg border border-line shrink-0 bg-sunken flex items-center justify-center text-ink-faint">
                          <Sparkles size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="mobile-h4 font-medium text-ink group-hover:text-taupe transition-colors truncate">
                          {d.name}
                        </h3>
                        <p className="text-[11px] text-ink-muted truncate mt-0.5 font-normal">
                          Service: <span className="font-medium text-ink">{d.service?.name || 'General Tailoring'}</span>
                        </p>
                        {d.price != null && (
                          <p className="mobile-caption font-semibold text-taupe mt-1">
                            ₱{Number(d.price).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-line bg-canvas/30 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
