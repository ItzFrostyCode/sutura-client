'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, CalendarClock, Ruler, Store, ChevronRight, Layers } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import AccountHeader from '@/components/account/AccountHeader';
import { useAccountHistory } from '@/components/account/history/useAccountHistory';
import { getPhaseMeta } from '@/components/account/orders/ordersTypes';
import { STATUS_META as APPOINTMENT_STATUS_META } from '@/components/account/appointments/appointmentTypes';

function SectionHeader({ title, count }: Readonly<{ title: string; count: number }>) {
  return (
    <div className="flex items-center justify-between mb-2 mt-5 first:mt-0">
      <h2 className="mobile-h3 font-semibold text-ink">{title}</h2>
      <span className="mobile-caption text-ink-muted font-normal">{count}</span>
    </div>
  );
}

export default function AccountHistoryPage() {
  const { orders, appointments, measurements, shops, loading } = useAccountHistory();

  const empty = !loading && orders.length === 0 && appointments.length === 0 && measurements.length === 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AccountHeader title="My History" backHref="/account" />

      <p className="mobile-body-sm text-ink-muted mb-4 font-normal space-headline-para">
        A read-only view of your orders, appointments, and measurements across every shop — nothing here is a separate record, it&apos;s the same data shown on each page individually.
      </p>

      {loading && (
        <div className="text-center py-16 mobile-body-sm text-ink-muted">Loading your history…</div>
      )}

      {empty && (
        <div className="bg-surface border border-line p-8 text-center">
          <Layers size={28} className="text-ink-faint mx-auto mb-3" />
          <h2 className="mobile-h3 font-semibold text-ink mb-1">Nothing here yet</h2>
          <p className="mobile-body-sm text-ink-muted mb-6 font-normal space-headline-para">
            Your orders, appointments, and measurements will show up here once you have some.
          </p>
          <Link href="/stores" className="btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white max-w-[180px] mx-auto">
            Browse Stores →
          </Link>
        </div>
      )}

      {!loading && !empty && (
        <>
          {orders.length > 0 && (
            <>
              <SectionHeader title="Orders" count={orders.length} />
              <div className="divide-y divide-line border border-line bg-surface">
                {orders.map((o) => {
                  const meta = getPhaseMeta(o.status);
                  const Icon = meta.Icon;
                  const itemName = o.catalog_item_name ?? o.service_name ?? o.garment_category ?? 'Order';
                  return (
                    <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas transition-colors">
                      <Package size={16} className="text-ink-faint shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="mobile-body-sm font-medium text-ink truncate">{itemName}</p>
                        <p className="mobile-caption text-ink-muted font-normal truncate">
                          {o.store?.name ?? 'Store'} · {o.order_number} · ₱{o.balance.toLocaleString()} balance
                        </p>
                      </div>
                      <span className={`mobile-caption font-semibold shrink-0 px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.tone}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                      <ChevronRight size={16} className="text-ink-faint shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {appointments.length > 0 && (
            <>
              <SectionHeader title="Appointments" count={appointments.length} />
              <div className="divide-y divide-line border border-line bg-surface">
                {appointments.map((a) => {
                  const meta = APPOINTMENT_STATUS_META[a.status] ?? APPOINTMENT_STATUS_META.pending;
                  const Icon = meta.Icon;
                  return (
                    <Link key={a.id} href={`/account/appointments/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas transition-colors">
                      <CalendarClock size={16} className="text-ink-faint shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="mobile-body-sm font-medium text-ink truncate capitalize">{a.appointment_type}</p>
                        <p className="mobile-caption text-ink-muted font-normal truncate">
                          {a.store?.name ?? 'Store'} · {new Date(a.scheduled_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`mobile-caption font-semibold shrink-0 px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.tone}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                      <ChevronRight size={16} className="text-ink-faint shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {measurements.length > 0 && (
            <>
              <SectionHeader title="Measurements" count={measurements.length} />
              <div className="divide-y divide-line border border-line bg-surface">
                {measurements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <Ruler size={16} className="text-ink-faint shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="mobile-body-sm font-medium text-ink truncate">{m.profile_name}</p>
                      <p className="mobile-caption text-ink-muted font-normal truncate">
                        {m.store?.name ?? 'Store'} · Version {m.version}{m.superseded_at ? ' (past)' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/account/measurements" className="mobile-caption text-taupe hover:text-taupe-hover font-medium inline-block mt-2">
                View full measurement profiles →
              </Link>
            </>
          )}

          {shops.length > 0 && (
            <>
              <SectionHeader title="Shops" count={shops.length} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {shops.map((s) => (
                  <Link key={s.slug} href={`/store/${s.slug}`} className="flex items-center gap-2 px-3 py-2.5 border border-line bg-surface hover:border-line-strong transition-colors">
                    <div className="w-8 h-8 rounded-full bg-sunken overflow-hidden relative shrink-0 border border-line">
                      {s.logo_path ? (
                        <Image src={getMediaUrl(s.logo_path)} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store size={14} className="text-ink-faint" />
                        </div>
                      )}
                    </div>
                    <span className="mobile-caption font-medium text-ink truncate">{s.name}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
