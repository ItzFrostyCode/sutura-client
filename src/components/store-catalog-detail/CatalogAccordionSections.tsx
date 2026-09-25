'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Ruler, Info, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { CatalogItem } from './types';

interface CatalogAccordionSectionsProps {
  item: CatalogItem;
}

export default function CatalogAccordionSections({ item }: CatalogAccordionSectionsProps) {
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showCare, setShowCare] = useState(false);

  const sizeChartColumns = item.size_chart_columns || [];
  const sizeChartRows = item.size_chart_rows || [];
  const sizeChartImage = item.size_chart_image_url || '';

  let featuresList: string[] = [];
  let featuresImage = '';
  if (item.features) {
    if (Array.isArray(item.features)) {
      featuresList = item.features;
    } else if (typeof item.features === 'object') {
      featuresList = (item.features as { bullets: string[] }).bullets || [];
      featuresImage = (item.features as { image_url: string }).image_url || '';
    } else {
      try {
        const parsed = JSON.parse(item.features as unknown as string);
        if (Array.isArray(parsed)) {
          featuresList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          featuresList = parsed.bullets || [];
          featuresImage = parsed.image_url || '';
        }
      } catch {
        // Ignored
      }
    }
  }

  const specRows: [string, string][] = [];
  if (item.garment_type) specRows.push(['Garment Type', item.garment_type]);
  if (item.material) specRows.push(['Material', item.material]);
  if (item.color) specRows.push(['Color', item.color]);
  if (item.sizes && item.sizes.length > 0) specRows.push(['Sizes Available', item.sizes.join(', ')]);
  specRows.push(['Estimated Completion', `${item.estimated_days ?? 7} day${(item.estimated_days ?? 7) === 1 ? '' : 's'}`]);

  let careText = '';
  let careImage = '';
  if (item.care_instructions) {
    try {
      const parsed = JSON.parse(item.care_instructions);
      if (parsed && typeof parsed === 'object' && ('text' in parsed || 'image_url' in parsed)) {
        careText = parsed.text || '';
        careImage = parsed.image_url || '';
      } else {
        careText = item.care_instructions;
      }
    } catch {
      careText = item.care_instructions;
    }
  }

  return (
    <div className="mt-4 border border-line bg-surface divide-y divide-line rounded-none overflow-hidden">
      {/* 1. Size Guide Accordion */}
      <div>
        <button
          type="button"
          onClick={() => setShowSizeGuide(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-canvas transition-colors"
        >
          <span className="text-sm font-semibold text-ink flex items-center gap-2">
            <Ruler size={18} className="text-taupe" /> Size Guide
          </span>
          {showSizeGuide ? <ChevronUp size={18} className="text-ink-faint" /> : <ChevronDown size={18} className="text-ink-faint" />}
        </button>
        {showSizeGuide && (
          <div className="px-4 pb-4 pt-3 border-t border-line">
            {sizeChartImage && (
              <div className="relative w-full h-[200px] rounded-none overflow-hidden border border-line bg-canvas">
                <Image src={sizeChartImage} alt="Size Guide visual" className="object-cover object-center" fill />
              </div>
            )}
            {sizeChartColumns.length > 0 ? (
              // overflow-x-auto so a size chart with many columns scrolls
              // horizontally instead of squeezing/wrapping.
              <div className={`overflow-x-auto border border-line rounded-none ${sizeChartImage ? 'mt-3' : ''}`}>
                <table className="w-full mobile-body-sm">
                  <thead>
                    <tr className="bg-canvas">
                      {/* "Size" is sticky/frozen on the left — without it,
                          scrolling right on a wide chart loses track of
                          which row is which size, a common table UX bug. */}
                      <th className="sticky left-0 z-10 bg-canvas px-3 py-2 text-left font-semibold text-ink-body whitespace-nowrap">Size</th>
                      {sizeChartColumns.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-semibold text-ink-body whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChartRows.map(row => (
                      <tr key={row.size} className="border-t border-line">
                        <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-semibold text-ink whitespace-nowrap">{row.size}</td>
                        {row.values.map((val, ci) => (
                          <td key={`${row.size}-${ci}`} className="px-3 py-2 text-ink-body font-normal whitespace-nowrap">{val || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {/* Scrollbars are often invisible on mobile/trackpad, so
                without this a table wider than the screen just looks
                "complete" even though there's more off to the right. */}
            {sizeChartColumns.length > 3 && (
              <p className="mt-1.5 text-[11px] text-ink-faint">Swipe to see more sizes →</p>
            )}
            {sizeChartColumns.length === 0 && !sizeChartImage ? (
              <p className="mobile-body-sm text-ink-faint font-normal">No size guide available yet for this item — sizes follow this store&apos;s own standard. Contact the store if you&apos;re unsure.</p>
            ) : null}
          </div>
        )}
      </div>

      {/* 2. Specs & Description Accordion */}
      <div>
        <button
          type="button"
          onClick={() => setShowSpecs(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-canvas transition-colors"
        >
          <span className="text-sm font-semibold text-ink flex items-center gap-2">
            <Info size={18} className="text-taupe" /> Specs &amp; Description
          </span>
          {showSpecs ? <ChevronUp size={18} className="text-ink-faint" /> : <ChevronDown size={18} className="text-ink-faint" />}
        </button>
        {showSpecs && (
          <div className="px-4 pb-4 pt-2 border-t border-line space-y-4">
            {item.description && (
              <p className="mobile-body-sm text-ink-muted leading-relaxed whitespace-pre-wrap font-normal">{item.description}</p>
            )}

            {specRows.length > 0 && (
              <table className="w-full mobile-body-sm">
                <tbody>
                  {specRows.map(([label, value]) => (
                    <tr key={label} className="border-b border-line last:border-0">
                      <td className="py-2 pr-4 text-ink-faint font-medium w-2/5 align-top">{label}</td>
                      <td className="py-2 text-ink-body font-normal">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {featuresList.length > 0 && (
              <div className="pt-3 border-t border-line">
                <h4 className="mobile-overline text-ink-faint mb-2">Additional Details</h4>
                <ul className="space-y-2 mobile-body-sm text-ink-muted font-normal">
                  {featuresList.map((feat: string) => (
                    <li key={feat}>• {feat}</li>
                  ))}
                </ul>
              </div>
            )}
            {featuresImage && (
              <div className="relative w-full h-[200px] rounded-none overflow-hidden border border-line bg-canvas">
                <Image src={featuresImage} alt="Specifications visual guide" className="object-cover object-center" fill />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Garment Care Accordion */}
      <div>
        <button
          type="button"
          onClick={() => setShowCare(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-canvas transition-colors"
        >
          <span className="text-sm font-semibold text-ink flex items-center gap-2 whitespace-nowrap">
            <ShieldCheck size={18} className="text-taupe shrink-0" /> Garment Care &amp; Alterations
          </span>
          {showCare ? <ChevronUp size={18} className="text-ink-faint" /> : <ChevronDown size={18} className="text-ink-faint" />}
        </button>
        {showCare && (
          <div className="px-4 pb-4 pt-2 mobile-body-sm text-ink-muted leading-relaxed whitespace-pre-wrap border-t border-line space-y-4 font-normal">
            <div>
              {careText || "Professional dry-clean only. Altered garments are final sale."}
            </div>
            {careImage && (
              <div className="relative w-full h-[200px] rounded-none overflow-hidden border border-line bg-canvas">
                <Image src={careImage} alt="Garment Care guide" className="object-cover object-center" fill />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
