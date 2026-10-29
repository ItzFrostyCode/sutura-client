'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Ruler, Scissors } from 'lucide-react';
import { MeasurementProfile } from './customerTypes';
import { MeasurementRecord } from '@/components/measurements/measurementTypes';
import { useShopRole } from '@/hooks/useShopRole';
import MeasurementList from '@/components/measurements/MeasurementList';

interface CustomerMeasurementsTabProps {
  readonly customerId: number;
  readonly customerName: string;
  readonly measurements: MeasurementProfile[];
}

// Look-up only: measurements are taken on a job order (Take measurements now), so there is one place to record them.
export default function CustomerMeasurementsTab({ customerId, customerName, measurements }: CustomerMeasurementsTabProps) {
  const { isOwnerOrManager } = useShopRole();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedVersionIds, setSelectedVersionIds] = useState<Record<string, number>>({});

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const grouped = { [customerName]: measurements as unknown as MeasurementRecord[] };
  const newOrder = `/dashboard/jobs/new?customer_id=${customerId}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-surface border border-line rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-ink-muted shrink-0">
              <Ruler size={15} />
            </div>
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink">Measurements &amp; Specs</h2>
              <p className="text-xs text-ink-muted">Saved from this client&apos;s job orders. To take new ones, start a job order and choose Take measurements now.</p>
            </div>
          </div>
          {isOwnerOrManager && (
            <Link
              href={newOrder}
              className="inline-flex items-center gap-2 rounded-lg bg-espresso px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Scissors size={14} /> New Job Order
            </Link>
          )}
        </div>

        {measurements.length === 0 ? (
          <div className="m-5 sm:m-6 border border-dashed border-line rounded-xl bg-canvas/40 p-10 text-center">
            <div className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink-muted mx-auto mb-2 shadow-2xs">
              <Ruler size={15} />
            </div>
            <span className="text-xs font-bold text-ink">No measurements recorded for this client yet.</span>
            <p className="text-[11px] text-ink-muted mt-0.5 mb-3.5">
              {isOwnerOrManager
                ? 'Start a job order and choose Take measurements now to record them.'
                : 'They are recorded on a job order.'}
            </p>
            {isOwnerOrManager && (
              <Link
                href={newOrder}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-espresso hover:bg-espresso/90 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Plus size={13} /> New Job Order
              </Link>
            )}
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <MeasurementList
              grouped={grouped}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              selectedVersionIds={selectedVersionIds}
              setSelectedVersionIds={setSelectedVersionIds}
            />
          </div>
        )}
      </div>
    </div>
  );
}
