'use client';

import React from 'react';
import { Store } from 'lucide-react';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';

export default function ProductionFulfillmentSection() {
  return (
    <CollapsibleSection
      icon={<Store size={16} className="text-blue-700" />}
      iconBoxClassName="bg-blue-50 border border-blue-200"
      title="Production & Fulfillment"
      defaultOpen={false}
    >
      <div className="bg-canvas/50 border border-line/60 rounded-xl p-4">
        <span className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
          Fulfillment Method
        </span>
        <div className="bg-canvas/60 border border-line/60 rounded-lg p-3 text-xs text-ink-muted flex items-center gap-2">
          <Store size={16} className="shrink-0" />
          <span>
            Customer will pick up the garments in-store. (Store address will be used)
          </span>
        </div>
      </div>
    </CollapsibleSection>
  );
}
