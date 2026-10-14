'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ruler, Search, X } from 'lucide-react';
import api from '@/lib/axios';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import MeasurementProfileCard from '@/components/account/measurements/MeasurementProfileCard';
import OrderMeasurementCard from '@/components/account/measurements/OrderMeasurementCard';
import {
  type MyMeasurement,
  groupMeasurements,
  ordersWithMeasurements,
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

  // Read order by order (what each order is being made with); measurements no order has used yet are listed after them.
  const byOrder = useMemo(() => ordersWithMeasurements(records), [records]);
  const groups = useMemo(() => groupMeasurements(records.filter((r) => !(r.job_orders?.length))), [records]);

  const q = search.trim().toLowerCase();
  const filteredOrders = byOrder.filter(({ order, measurement }) => !q || [measurement.profile_name, order.order_number, order.catalog_item?.name, order.service?.name, order.garment_category, measurement.store?.name].some((t) => t?.toLowerCase().includes(q)));
  const filteredGroups = groups.filter((g) => !q || g.profileName.toLowerCase().includes(q) || g.storeName.toLowerCase().includes(q));

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AccountHeader title="My Measurements" backHref="/account" />

      <p className="mobile-body-sm mb-4 text-ink-muted">
        Recorded by store staff during your fittings. Private to you — only shown to a store after you have an active order or appointment with them.
      </p>

      {!loading && records.length > 0 && (
        <div className="mb-4 flex h-12 items-center gap-2.5 rounded-full border border-line/60 bg-surface px-4 shadow-[0_1px_2px_rgba(45,42,38,0.04),0_8px_24px_rgba(45,42,38,0.06)] transition-colors focus-within:border-line-strong">
          <Search size={20} className="shrink-0 text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search measurements..."
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="touch-target-44 flex shrink-0 items-center justify-center text-ink-faint hover:text-ink"
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
        <EmptyState Icon={Ruler} title="No measurements on file yet" message="A store's staff records this during a fitting appointment." action={{ href: '/search', label: 'Browse Stores' }} />
      )}

      {!loading && records.length > 0 && filteredOrders.length === 0 && filteredGroups.length === 0 && (
        <p className="mobile-body-sm py-10 text-center text-ink-muted">No measurements match &quot;{search.trim()}&quot;.</p>
      )}

      {!loading && filteredOrders.length > 0 && (
        <section className="mb-5">
          <h2 className="mobile-overline mb-2 ml-4 text-ink-faint">By order</h2>
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            {filteredOrders.map(({ order, measurement }) => <OrderMeasurementCard key={order.id} order={order} measurement={measurement} />)}
          </div>
        </section>
      )}

      {!loading && filteredGroups.length > 0 && (
        <section>
          <h2 className="mobile-overline mb-2 ml-4 text-ink-faint">{byOrder.length > 0 ? 'Not used in an order yet' : 'On file'}</h2>
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            {filteredGroups.map((g) => <MeasurementProfileCard key={`${g.storeId}-${g.profileName}`} group={g} />)}
          </div>
        </section>
      )}
    </div>
  );
}
