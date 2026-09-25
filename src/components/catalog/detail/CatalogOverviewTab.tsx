'use client';

import React from 'react';
import {
  ImageIcon, Shirt, Clock, Ruler, Sparkles, CheckCircle2, ExternalLink
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { parseFeatures, parseCareInstructions, formatCatalogPrice } from '../catalogHelpers';
import { DetailedCatalogItem } from './detailTypes';

interface CatalogOverviewTabProps {
  item: DetailedCatalogItem;
  selectedImageIndex: number;
  setSelectedImageIndex: (idx: number) => void;
}

export default function CatalogOverviewTab({
  item,
  selectedImageIndex,
  setSelectedImageIndex,
}: CatalogOverviewTabProps) {
  const images = item.images && item.images.length > 0 ? item.images : [];
  const activeImage = images[selectedImageIndex] || images[0];
  const { bullets: featuresList } = parseFeatures(item.features);
  const { text: careText } = parseCareInstructions(item.care_instructions);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Visual Gallery (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-line">
          <div className="aspect-3/4 rounded-xl overflow-hidden bg-sunken relative">
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getMediaUrl(activeImage.image_url)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
                <ImageIcon size={40} className="mb-2 text-ink-faint" />
                <span className="text-xs font-semibold">No images uploaded</span>
              </div>
            )}
            {activeImage?.view_angle && (
              <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {activeImage.view_angle} View
              </span>
            )}
            {activeImage?.is_primary && (
              <span className="absolute top-3 right-3 bg-taupe text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                Primary Cover
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx ? 'border-taupe shadow-xs scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(img.image_url)}
                    alt={`Angle ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {item.fabric_image_url && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Shirt size={14} className="text-taupe" /> Fabric Sample Swatch
              </span>
              <span className="text-[11px] text-ink-muted">{item.material || 'Custom Material'}</span>
            </div>
            <div className="h-32 rounded-xl overflow-hidden bg-sunken border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(item.fabric_image_url)}
                alt="Fabric swatch"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Commercial & Technical Specifications (7 cols) */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-5">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Garment Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Pricing Model</span>
              <span className="text-sm font-bold text-ink">{formatCatalogPrice(item.price)}</span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Production Time</span>
              <span className="text-sm font-bold text-ink flex items-center gap-1">
                <Clock size={13} className="text-taupe" /> Est. {item.estimated_days ?? 7} Days
              </span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Primary Material</span>
              <span className="text-sm font-bold text-ink truncate block">{item.material || 'Custom Tailored'}</span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Garment Type</span>
              <span className="text-sm font-bold text-ink capitalize truncate block">
                {(item.garment_type || 'General Apparel').replaceAll('_', ' ')}
              </span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Color Scheme</span>
              <span className="text-sm font-bold text-ink truncate block">{item.color || 'Customizable'}</span>
            </div>
            <div className="bg-canvas p-3.5 rounded-xl border border-line/60">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">Listing Type</span>
              <span className="text-sm font-bold text-taupe uppercase tracking-wider text-[11px]">Made to Order</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-ink uppercase tracking-wider block mb-2">Available Size Range</span>
            {item.sizes && item.sizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((size) => (
                  <span
                    key={size}
                    className="px-3 py-1.5 bg-canvas border border-line rounded-lg text-xs font-bold text-ink shadow-2xs"
                  >
                    {size}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-ink-muted italic">Fully customizable to client measurements</span>
            )}
          </div>

          {item.description && (
            <div className="pt-2 border-t border-line/60">
              <span className="text-xs font-bold text-ink uppercase tracking-wider block mb-2">Description & Notes</span>
              <p className="text-sm text-ink-body leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}
        </div>

        {item.size_chart_rows && item.size_chart_rows.length > 0 && item.size_chart_columns && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                <Ruler size={16} className="text-taupe" /> Standard Size Chart Matrix
              </h3>
              <span className="text-xs text-ink-muted">Inches (in)</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sunken border-b border-line text-ink font-bold">
                    <th className="py-2.5 px-3">Size</th>
                    {item.size_chart_columns.map((col) => (
                      <th key={col} className="py-2.5 px-3 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {item.size_chart_rows.map((row) => (
                    <tr key={row.size} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-ink bg-canvas/30">{row.size}</td>
                      {row.values.map((val, vIdx) => (
                        <td key={`${row.size}-${vIdx}`} className="py-2 px-3 text-ink-body font-mono">
                          {val || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {featuresList.some(f => f.text.trim()) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-3">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-taupe" /> Design Features & Tailoring Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {featuresList.filter(f => f.text.trim()).map((feat) => (
                <div key={feat.id} className="flex items-start gap-2 text-xs text-ink-body bg-canvas p-2.5 rounded-xl border border-line/60">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(careText || item.external_gallery_url) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-line space-y-4">
            {careText && (
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider block mb-1.5">Garment Care Guidelines</h3>
                <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-wrap">{careText}</p>
              </div>
            )}
            {item.external_gallery_url && (
              <div className="pt-3 border-t border-line/60 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-ink">External Media Gallery</span>
                <a
                  href={item.external_gallery_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-canvas border border-line text-taupe font-bold text-xs hover:bg-sunken flex items-center gap-1.5 transition-all"
                >
                  <span>Open Link</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
