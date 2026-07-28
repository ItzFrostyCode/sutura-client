'use client';

import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Eye, 
  Heart, 
  ExternalLink, 
  Scissors, 
  Ruler, 
  Shirt, 
  Sparkles, 
  Check, 
  Pencil,
  ShoppingBag,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import {
  CatalogItem,
  formatCatalogPrice,
  parseFeatures,
  parseCareInstructions
} from './catalogHelpers';

interface CatalogPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly item: CatalogItem | null;
}

export default function CatalogPreviewModal({ isOpen, onClose, item }: CatalogPreviewModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !item) return null;

  const featuresData = parseFeatures(item.features);
  const careData = parseCareInstructions(item.care_instructions);
  const sizeChartColumns = item.size_chart_columns ?? [];
  const sizeChartRows = item.size_chart_rows ?? [];

  // Defensive helper: handles both string bullets and {id, text} objects
  // Fixes the [object Object] rendering bug for legacy data
  const safeText = (bullet: unknown): string => {
    if (typeof bullet === 'string') return bullet;
    if (bullet && typeof bullet === 'object') {
      const b = bullet as Record<string, unknown>;
      return typeof b.text === 'string' ? b.text : JSON.stringify(b);
    }
    return String(bullet ?? '');
  };

  const visibleFeatureBullets = featuresData.bullets.filter(b => safeText(b).trim() !== '');

  const images = item.images && item.images.length > 0 
    ? item.images 
    : [{ id: 0, image_url: '', is_primary: true }];
  
  const currentImage = images[activeImageIndex]?.image_url;

  return (
    <div className="fixed inset-0 bg-[#2D2A26]/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-[#2D2A26]">
      <div className="bg-[#FAF6F3] w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-[#EBE6E0] animate-scale-up">
        {/* Header Block */}
        <div className="px-8 py-5 border-b border-[#EBE6E0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-taupe bg-[#9A8073]/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Made to Order
            </span>
            <span className="text-[10px] font-bold text-[#B26959] bg-[#B26959]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {item.garment_type || 'Custom Garment'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#827A73] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Gallery & Preview */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="aspect-3/4 bg-[#F0EAE3] rounded-2xl overflow-hidden relative border border-[#EBE6E0] shadow-sm flex items-center justify-center">
              {currentImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={currentImage} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-[#827A73] text-sm">No Preview Image</div>
              )}
            </div>

            {/* Thumbnail Selectors */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      activeImageIndex === idx ? 'border-taupe scale-95' : 'border-[#EBE6E0] hover:border-taupe/50'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={img.image_url} 
                      alt={`Angle ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Admin Stats Grid */}
            <div className="bg-white border border-[#EBE6E0] rounded-2xl p-4 mt-2 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#A8A19A]">Design Performance</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#FAF6F3] p-2.5 rounded-xl border border-[#EBE6E0]/60">
                  <span className="flex items-center justify-center text-[#827A73] gap-1 mb-1">
                    <Eye size={12} />
                    <span className="text-[10px] font-medium">Views</span>
                  </span>
                  <p className="text-sm font-bold text-[#2D2A26]">{item.views_count || 0}</p>
                </div>
                <div className="bg-[#FAF6F3] p-2.5 rounded-xl border border-[#EBE6E0]/60">
                  <span className="flex items-center justify-center text-[#827A73] gap-1 mb-1">
                    <Heart size={12} />
                    <span className="text-[10px] font-medium">Saves</span>
                  </span>
                  <p className="text-sm font-bold text-[#2D2A26]">{item.saves_count || 0}</p>
                </div>
                <div className="bg-[#FAF6F3] p-2.5 rounded-xl border border-[#EBE6E0]/60">
                  <span className="flex items-center justify-center text-[#827A73] gap-1 mb-1">
                    <Star size={12} className="text-[#BCA89F]" />
                    <span className="text-[10px] font-medium">Rating</span>
                  </span>
                  <p className="text-sm font-bold text-[#2D2A26]">
                    {item.reviews_avg_rating ? item.reviews_avg_rating : '0.0'}
                  </p>
                </div>
              </div>

              {/* Financial Performance Row */}
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-[#FAF6F3] p-2.5 rounded-xl border border-[#EBE6E0]/60">
                  <span className="flex items-center justify-center text-[#827A73] gap-1 mb-1">
                    <ShoppingBag size={12} />
                    <span className="text-[10px] font-medium">Total Orders</span>
                  </span>
                  <p className="text-sm font-bold text-[#2D2A26]">{item.order_count || 0}</p>
                </div>
                <div className="bg-[#FAF6F3] p-2.5 rounded-xl border border-[#EBE6E0]/60">
                  <span className="flex items-center justify-center text-[#827A73] gap-1 mb-1">
                    <Wallet size={12} />
                    <span className="text-[10px] font-medium">Total Revenue</span>
                  </span>
                  <p className="text-sm font-bold text-taupe">
                    ₱{Number(item.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Specifications & Metadata */}
          <div className="md:col-span-7 flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">{item.name}</h2>
              <div className="mt-2 text-lg font-bold text-taupe">
                {formatCatalogPrice(item.price)}
              </div>
            </div>

            {/* Basic Info Table */}
            <div className="grid grid-cols-2 gap-4 bg-white border border-[#EBE6E0] p-4 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Fabric / Material</span>
                <p className="text-sm font-medium text-[#2D2A26] mt-0.5">{item.material || 'Not specified'}</p>
                {/* Fabric texture image */}
                {item.fabric_image_url && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.fabric_image_url} alt="Fabric texture" className="w-16 h-16 object-cover rounded-lg border border-[#EBE6E0] shadow-sm" />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Garment Category</span>
                <p className="text-sm font-medium text-[#2D2A26] mt-0.5 capitalize">{item.garment_type || 'Custom Design'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Estimated Completion</span>
                <p className="text-sm font-medium text-[#2D2A26] mt-0.5">
                  {item.estimated_days ?? 7} day{(item.estimated_days ?? 7) === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Description Section */}
            {item.description && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#524A44] uppercase tracking-wider flex items-center gap-1.5">
                  <Shirt size={14} className="text-taupe" />
                  Styling Notes / Description
                </h3>
                <p className="text-sm text-[#524A44] leading-relaxed bg-white border border-[#EBE6E0]/60 p-4 rounded-2xl">
                  {item.description}
                </p>
              </div>
            )}
                  {/* Product Specifications bullets */}
            {visibleFeatureBullets.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#524A44] uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors size={14} className="text-taupe" />
                  Design & Specifications
                </h3>
                <div className="bg-white border border-[#EBE6E0]/60 p-4 rounded-2xl space-y-2.5">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#524A44]">
                    {visibleFeatureBullets.map((bullet, idx) => (
                      <li key={(bullet as {id?: string}).id || idx} className="flex items-start gap-2">
                        <Check size={14} className="text-taupe mt-0.5 shrink-0" />
                        <span>{safeText(bullet)}</span>
                      </li>
                    ))}
                  </ul>
                  {featuresData.imageUrl && (
                    <div className="mt-3 aspect-video max-w-sm rounded-lg overflow-hidden border border-[#EBE6E0] bg-[#FAF6F3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={featuresData.imageUrl} alt="Specs Guide" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sizing & Guidelines */}
            {(sizeChartColumns.length > 0 || item.size_chart_image_url) && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#524A44] uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler size={14} className="text-taupe" />
                  Fit & Sizing Guidelines
                </h3>
                <div className="bg-white border border-[#EBE6E0]/60 p-4 rounded-2xl space-y-3">
                  {item.size_chart_image_url && (
                    <div className="aspect-video max-w-sm rounded-lg overflow-hidden border border-[#EBE6E0] bg-[#FAF6F3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.size_chart_image_url} alt="Sizing Guide" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {sizeChartColumns.length > 0 && (
                    <div className="overflow-x-auto border border-[#EBE6E0] rounded-lg">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#FAF6F3]">
                            <th className="px-3 py-2 text-left font-semibold text-[#827A73]">Size</th>
                            {sizeChartColumns.map(col => (
                              <th key={col} className="px-3 py-2 text-left font-semibold text-[#827A73]">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sizeChartRows.map(row => (
                            <tr key={row.size} className="border-t border-[#EBE6E0]">
                              <td className="px-3 py-2 font-semibold text-[#2D2A26] whitespace-nowrap">{row.size}</td>
                              {row.values.map((val, ci) => (
                                <td key={`${row.size}-${ci}`} className="px-3 py-2 text-[#524A44]">{val || '—'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Care Instructions */}
            {careData.text && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#524A44] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-taupe" />
                  Care & Maintenance Instructions
                </h3>
                <div className="bg-white border border-[#EBE6E0]/60 p-4 rounded-2xl space-y-2.5">
                  <p className="text-sm text-[#524A44] leading-relaxed">
                    {careData.text}
                  </p>
                  {careData.imageUrl && (
                    <div className="mt-3 aspect-video max-w-sm rounded-lg overflow-hidden border border-[#EBE6E0] bg-[#FAF6F3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={careData.imageUrl} alt="Care Guidelines" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* External Links */}
            {item.external_gallery_url && (
              <div className="bg-white border border-[#EBE6E0]/60 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-[#524A44] uppercase tracking-wider">External Asset Link</span>
                <a 
                  href={item.external_gallery_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-xs font-semibold text-taupe hover:text-taupe/80 transition-colors"
                >
                  Open External Gallery
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-[#EBE6E0] bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#EBE6E0] hover:bg-[#FAF6F3] rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Close Preview
          </button>
          <Link
            href={`/dashboard/catalog/${item.id}/edit`}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Pencil size={16} />
            Edit Catalog Item
          </Link>
        </div>

      </div>
    </div>
  );
}
