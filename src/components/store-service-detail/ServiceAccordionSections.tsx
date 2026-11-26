'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PublicService } from '@/components/store-storefront/types';
import { ServiceSpecBlock, ServiceChartBlock, ServiceDescriptionBlock, hasServiceChart } from './ServiceDetailBlocks';

interface ServiceAccordionSectionsProps {
  service: PublicService;
}

function SectionCard({ number, title, open, onToggle, children }: Readonly<{ number: number; title: string; open: boolean; onToggle: () => void; children: React.ReactNode }>) {
  return (
    <div className="border border-line bg-white">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-canvas transition-colors">
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

// Same numbered-card system as the Catalog Design page (1 Specification,
// 2 Reference Chart when the shop added one, then Description).
export default function ServiceAccordionSections({ service }: ServiceAccordionSectionsProps) {
  const [showSpecs, setShowSpecs] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [showDesc, setShowDesc] = useState(true);
  const chart = hasServiceChart(service);

  return (
    <div className="mt-4 space-y-3">
      <SectionCard number={1} title="Specification" open={showSpecs} onToggle={() => setShowSpecs((v) => !v)}>
        <ServiceSpecBlock service={service} />
      </SectionCard>

      {chart && (
        <SectionCard number={2} title="Reference Chart" open={showChart} onToggle={() => setShowChart((v) => !v)}>
          <ServiceChartBlock service={service} />
        </SectionCard>
      )}

      <SectionCard number={chart ? 3 : 2} title="Description" open={showDesc} onToggle={() => setShowDesc((v) => !v)}>
        <ServiceDescriptionBlock service={service} />
      </SectionCard>
    </div>
  );
}
