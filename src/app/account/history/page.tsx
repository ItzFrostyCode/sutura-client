'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, CalendarClock, Ruler, Store, Layers } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import AccountHeader from '@/components/account/AccountHeader';
import EmptyState from '@/components/account/EmptyState';
import HubGroup from '@/components/account/hub/HubGroup';
import HistoryRow from '@/components/account/history/HistoryRow';
import { useAccountHistory } from '@/components/account/history/useAccountHistory';
import { getPhaseMeta } from '@/components/account/orders/ordersTypes';
import { STATUS_META as APPOINTMENT_STATUS_META } from '@/components/account/appointments/appointmentTypes';

export default function AccountHistoryPage() {
  const { orders, appointments, measurements, shops, loading } = useAccountHistory();
  const empty = !loading && orders.length === 0 && appointments.length === 0 && measurements.length === 0;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <AccountHeader title="My History" backHref="/account" />

      <p className="mobile-body-sm mb-4 text-ink-muted">
        A read-only view of your orders, appointments, and measurements across every shop — the same data shown on each page individually.
      </p>

      {loading && <div className="py-16 text-center mobile-body-sm text-ink-muted">Loading your history…</div>}

      {empty && <EmptyState Icon={Layers} title="Nothing here yet" message="Your orders, appointments, and measurements will show up here once you have some." action={{ href: '/stores', label: 'Browse Stores' }} />}

      {!loading && !empty && (
        <div className="space-y-4">
          {orders.length > 0 && (
            <HubGroup title={`Orders · ${orders.length}`}>
              {orders.map((o) => (
                <HistoryRow
                  key={o.id}
                  href={`/account/orders/${o.id}`}
                  Icon={Package}
                  title={o.catalog_item_name ?? o.service_name ?? o.garment_category ?? 'Order'}
                  subtitle={`${o.store?.name ?? 'Store'} · ${o.order_number} · ₱${o.balance.toLocaleString()} balance`}
                  status={getPhaseMeta(o.status)}
                />
              ))}
            </HubGroup>
          )}

          {appointments.length > 0 && (
            <HubGroup title={`Appointments · ${appointments.length}`}>
              {appointments.map((a) => (
                <HistoryRow
                  key={a.id}
                  href={`/account/appointments/${a.id}`}
                  Icon={CalendarClock}
                  title={a.appointment_type.charAt(0).toUpperCase() + a.appointment_type.slice(1)}
                  subtitle={`${a.store?.name ?? 'Store'} · ${new Date(a.scheduled_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  status={APPOINTMENT_STATUS_META[a.status] ?? APPOINTMENT_STATUS_META.pending}
                />
              ))}
            </HubGroup>
          )}

          {measurements.length > 0 && (
            <div>
              <HubGroup title={`Measurements · ${measurements.length}`}>
                {measurements.map((m) => (
                  <HistoryRow key={m.id} Icon={Ruler} title={m.profile_name} subtitle={`${m.store?.name ?? 'Store'} · Version ${m.version}${m.superseded_at ? ' (past)' : ''}`} />
                ))}
              </HubGroup>
              <Link href="/account/measurements" className="mobile-caption mt-2 ml-4 inline-block text-taupe hover:text-taupe-hover">View full measurement profiles →</Link>
            </div>
          )}

          {shops.length > 0 && (
            <section>
              <h2 className="mobile-overline mb-2 ml-4 text-ink-faint">Shops · {shops.length}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {shops.map((s) => (
                  <Link key={s.slug} href={`/store/${s.slug}`} className="card-soft flex items-center gap-2 px-3 py-2.5 transition-opacity active:opacity-80">
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken">
                      {s.logo_path ? <Image src={getMediaUrl(s.logo_path)} alt="" fill className="object-cover" /> : <Store size={14} className="text-ink-faint" />}
                    </span>
                    <span className="mobile-caption truncate text-ink">{s.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
