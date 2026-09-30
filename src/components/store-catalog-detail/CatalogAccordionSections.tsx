'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CatalogItem } from './types';
import { SizeChartBlock, MeasurementGuideBlock, hasMeasurementGuide } from './CatalogGuideBlocks';
import { CatalogSpecTable, CatalogDescriptionBlock } from './CatalogSpecAndDescription';

interface CatalogAccordionSectionsProps {
  item: CatalogItem;
}

interface SectionCardProps {
  readonly number: number;
  readonly title: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}

function SectionCard({ number, title, open, onToggle, children }: SectionCardProps) {
  return (
    <div className="border border-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-canvas transition-colors"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-ink whitespace-nowrap">
          <span className="w-5 h-5 rounded-full bg-taupe text-white text-[11px] font-bold flex items-center justify-center shrink-0">{number}</span>
          {title}
        </span>
        {open ? <ChevronUp size={16} className="text-ink-faint" /> : <ChevronDown size={16} className="text-ink-faint" />}
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-line">{children}</div>}
    </div>
  );
}

export default function CatalogAccordionSections({ item }: CatalogAccordionSectionsProps) {
  // Default all sections open — desktop/tablet users see content immediately;
  // mobile can still collapse via the toggle button.
  const [showSizeGuide, setShowSizeGuide] = useState(true);
  const [showSpecs, setShowSpecs] = useState(true);
  const [showDescription, setShowDescription] = useState(true);

  return (
    <div className="mt-4 space-y-3">
      <SectionCard number={1} title="Size Guide" open={showSizeGuide} onToggle={() => setShowSizeGuide(v => !v)}>
        <div className="space-y-4">
          <SizeChartBlock item={item} />
          {hasMeasurementGuide(item) && (
            <div className="pt-4 border-t border-line">
              <MeasurementGuideBlock item={item} />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard number={2} title="Specification" open={showSpecs} onToggle={() => setShowSpecs(v => !v)}>
        <CatalogSpecTable item={item} />
      </SectionCard>

      <SectionCard number={3} title="Description" open={showDescription} onToggle={() => setShowDescription(v => !v)}>
        <CatalogDescriptionBlock item={item} />
      </SectionCard>
    </div>
  );
}
