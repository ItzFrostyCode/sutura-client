'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Ruler, Search, Loader2, ArrowLeft } from 'lucide-react';
import { MeasurementRecord } from '@/components/measurements/measurementTypes';
import MeasurementList from '@/components/measurements/MeasurementList';
import CustomersModuleTabs from '@/components/customers/CustomersModuleTabs';
import PageHeader from '@/components/shared/PageHeader';

// Look-up only. Measurements are taken on the job order (New Job Order → Take measurements now), so there is one place to record them.
function MeasurementsContent() {
  const { store, user } = useAuthStore();
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedVersionIds, setSelectedVersionIds] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!store) {
      if (!user) return;
      setTimeout(() => setLoading(false), 0);
      return;
    }
    api.get(`/stores/${store.id}/measurements`)
      .then((res) => setRecords(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [store, user]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const q = search.toLowerCase();
  const filtered = records.filter(r => !q
    || r.profile_name.toLowerCase().includes(q)
    || r.service?.name?.toLowerCase().includes(q)
    || r.catalog_item?.name?.toLowerCase().includes(q)
    || r.customer?.name?.toLowerCase().includes(q));

  const grouped = filtered.reduce((acc, r) => {
    const key = r.customer?.name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, MeasurementRecord[]>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Measurements"
        description="Every customer's saved measurements. They are taken on a job order: New Job Order → Take measurements now."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/customers" className="flex items-center gap-2 bg-surface hover:bg-sunken border border-line text-ink px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors min-h-10.5 shadow-2xs cursor-pointer">
              <ArrowLeft size={14} />
              <span>Back to Client Book</span>
            </Link>
          </div>
        }
      >
        <CustomersModuleTabs activeTab="measurements" />
      </PageHeader>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
          <input
            type="text"
            placeholder="Search by name, service, design or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30 shadow-sm"
          />
        </div>
        <div className="text-sm text-ink-faint font-medium">{filtered.length} profile{filtered.length === 1 ? '' : 's'}</div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-taupe animate-spin" />
          <p className="text-ink-faint text-sm">Loading measurements…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-sunken rounded-full flex items-center justify-center mx-auto mb-4">
            <Ruler size={26} className="text-taupe" />
          </div>
          <h3 className="text-ink font-semibold mb-1">No measurements yet</h3>
          <p className="text-ink-faint text-sm mb-5">Take them when you write up a job order, and they appear here.</p>
          <Link href="/dashboard/jobs/new" className="inline-flex items-center gap-2 bg-espresso text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-taupe/90 transition-colors cursor-pointer">New Job Order</Link>
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

export default function MeasurementsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-ink-faint animate-pulse">Loading measurements...</div>}>
      <MeasurementsContent />
    </Suspense>
  );
}
