'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Ruler, Search, X } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
import MeasurementProfileCard from '@/components/account/measurements/MeasurementProfileCard';
import {
  type MyMeasurement,
  groupMeasurements,
} from '@/components/account/measurements/measurementAccountTypes';

export default function MyMeasurementsPage() {
  const [records, setRecords] = useState<MyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/my-measurements')
      .then((res) => setRecords(res.data.data ?? []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => groupMeasurements(records), [records]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => !q || g.profileName.toLowerCase().includes(q));
  }, [groups, search]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AccountHeader title="My Measurements" backHref="/account" />

      <p className="mobile-body-sm text-ink-muted mb-4 font-normal space-headline-para">
        Recorded by store staff during your fittings. Private to you — only shown to a store after you have an active order or appointment with them.
      </p>

      {!loading && records.length > 0 && (
        <div className="relative mb-4 flex items-center gap-2.5 h-[52px] px-3.5 bg-surface border border-line focus-within:border-taupe focus-within:ring-1 focus-within:ring-taupe transition-all shadow-2xs">
          <Search size={18} className="text-ink-faint shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search measurements..."
            className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-ink-faint font-normal focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-ink-faint hover:text-ink transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-16 mobile-body-sm text-ink-muted">Loading your measurements…</div>
      )}

      {!loading && records.length === 0 && (
        <div className="bg-surface border border-line p-8 text-center">
          <Ruler size={28} className="text-ink-faint mx-auto mb-3" />
          <h2 className="mobile-h3 font-semibold text-ink mb-1">No measurements on file yet</h2>
          <p className="mobile-body-sm text-ink-muted mb-6 font-normal space-headline-para">
            A store&apos;s staff records this during a fitting appointment.
          </p>
          <Link
            href="/stores"
            className="btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white max-w-[180px] mx-auto"
          >
            Browse Stores →
          </Link>
        </div>
      )}

      {!loading && records.length > 0 && filteredGroups.length === 0 && (
        <p className="mobile-body-sm text-ink-muted text-center py-10 font-normal">
          No measurements match &quot;{search.trim()}&quot;.
        </p>
      )}

      {!loading && filteredGroups.length > 0 && (
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
          {filteredGroups.map((g) => (
            <MeasurementProfileCard key={`${g.storeId}-${g.profileName}`} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
