'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Measurements</h2>
          <p className="text-xs text-ink-muted mt-0.5">Saved from this client&apos;s job orders. To take new ones, start a job order and choose Take measurements now.</p>
        </div>
        {isOwnerOrManager && (
          <Link href={newOrder} className="flex items-center gap-1.5 bg-espresso hover:bg-taupe/90 text-white px-3.5 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer">
            <Plus size={14} /> New Job Order
          </Link>
        )}
      </div>

      {measurements.length === 0 ? (
        <div className="bg-canvas/50 border border-line border-dashed rounded-xl p-12 text-center text-sm text-ink-faint">
          No measurements recorded for this client yet.{' '}
          {isOwnerOrManager && <Link href={newOrder} className="font-semibold text-taupe hover:underline">Start a job order to take them.</Link>}
        </div>
      ) : (
        <MeasurementList
          grouped={grouped}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
          selectedVersionIds={selectedVersionIds}
          setSelectedVersionIds={setSelectedVersionIds}
        />
      )}

    </div>
  );
}
