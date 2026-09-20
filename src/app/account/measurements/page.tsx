'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Ruler, ChevronDown, Search } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/axios';
import { MetricPill, humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import type { MeasurementRecord } from '@/components/measurements/measurementTypes';
import AccountHeader from '@/components/account/AccountHeader';

interface MyMeasurement extends MeasurementRecord {
  shop_id: number;
  shop: { id: number; name: string; slug: string; logo_path: string | null } | null;
}

interface ProfileGroup {
  shopId: number;
  shopName: string;
  shopSlug: string;
  shopLogo: string | null;
  profileName: string;
  versions: MyMeasurement[];
}

const SOURCE_LABELS: Record<string, string> = {
  shop_owner: "Shop's own record",
  customer: 'Self-reported by you',
};

// Groups by shop + profile_name, versions sorted ascending (same shape
// MeasurementList.tsx already uses on the owner side) — a customer can be
// measured differently at different shops (a bridal atelier vs. a uniform
// shop), so both have to be in the key.
function groupMeasurements(records: MyMeasurement[]): ProfileGroup[] {
  const groups = new Map<string, ProfileGroup>();
  for (const r of records) {
    const key = `${r.shop_id}::${r.profile_name.trim()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.versions.push(r);
    } else {
      groups.set(key, {
        shopId: r.shop_id,
        shopName: r.shop?.name ?? 'Shop',
        shopSlug: r.shop?.slug ?? '',
        shopLogo: r.shop?.logo_path ?? null,
        profileName: r.profile_name,
        versions: [r],
      });
    }
  }
  for (const g of groups.values()) {
    g.versions.sort((a, b) => a.id - b.id);
  }
  return Array.from(groups.values());
}

function ProfileCard({ group }: { readonly group: ProfileGroup }) {
  const [selectedId, setSelectedId] = useState(group.versions.at(-1)!.id);
  const active = group.versions.find((v) => v.id === selectedId) ?? group.versions.at(-1)!;
  const activeIndex = group.versions.indexOf(active);
  const metricEntries = Object.entries(active.metrics || {}).filter(([, v]) => v);

  return (
    <div className="bg-surface border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-sunken overflow-hidden relative shrink-0">
            {group.shopLogo ? (
              <Image src={getMediaUrl(group.shopLogo)} alt="" fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store size={12} className="text-ink-faint" />
              </div>
            )}
          </div>
          {group.shopSlug ? (
            <Link href={`/shop/${group.shopSlug}`} className="text-xs font-semibold text-ink-muted hover:text-taupe truncate">
              {group.shopName}
            </Link>
          ) : (
            <span className="text-xs font-semibold text-ink-muted truncate">{group.shopName}</span>
          )}
        </div>
        {group.versions.length > 1 && (
          <div className="relative shrink-0">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="appearance-none pl-2.5 pr-6 py-1 bg-canvas border border-line rounded-lg text-[11px] font-semibold text-ink-muted focus:outline-none focus:border-taupe"
            >
              {group.versions.map((v, idx) => (
                <option key={v.id} value={v.id}>Version {idx + 1} of {group.versions.length}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Ruler size={14} className="text-taupe shrink-0" />
        <p className="text-sm font-bold text-ink">{group.profileName}</p>
      </div>

      {active.source && (
        <p className="text-[11px] text-ink-faint mb-3">
          {SOURCE_LABELS[active.source] ?? active.source} · {new Date(active.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      {metricEntries.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {metricEntries.map(([key, value]) => (
            <MetricPill key={key} label={humanizeMetricKey(key)} value={value} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-faint">No metrics recorded for this version.</p>
      )}

      {active.notes && (
        <p className="text-xs text-ink-muted mt-3 pt-3 border-t border-line italic">&ldquo;{active.notes}&rdquo;</p>
      )}

      {group.versions.length > 1 && (
        <p className="text-[11px] text-ink-faint mt-3">
          Version {activeIndex + 1} of {group.versions.length}
        </p>
      )}
    </div>
  );
}

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

  // Search is local to this page only — not the shared account header,
  // since no other /account/* page needs it.
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => !q || g.profileName.toLowerCase().includes(q));
  }, [groups, search]);

  return (
    <div>
      <AccountHeader title="My Measurements" backHref="/account" />
      <p className="text-sm text-ink-muted mb-4">
        Recorded by shop staff during your fittings. Private to you — only shown to a shop after you have an active order or appointment with them.
      </p>

      {!loading && records.length > 0 && (
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search measurements..."
            className="w-full pl-9 pr-3 h-10 bg-surface border border-line rounded-lg text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe"
          />
        </div>
      )}

      {loading && <div className="text-center py-16 text-sm text-ink-muted">Loading your measurements…</div>}

      {!loading && records.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl p-10 text-center">
          <Ruler size={28} className="text-ink-faint mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-body mb-1">No measurements on file yet</p>
          <p className="text-xs text-ink-muted mb-5">A shop&apos;s staff records this during a fitting appointment.</p>
          <Link href="/shops" className="text-sm font-semibold text-taupe hover:text-taupe-hover">
            Browse Shops →
          </Link>
        </div>
      )}

      {!loading && records.length > 0 && filteredGroups.length === 0 && (
        <p className="text-sm text-ink-muted text-center py-10">
          No measurements match &quot;{search.trim()}&quot;.
        </p>
      )}

      {!loading && filteredGroups.length > 0 && (
        <div className="space-y-3">
          {filteredGroups.map((g) => (
            <ProfileCard key={`${g.shopId}-${g.profileName}`} group={g} />
          ))}
        </div>
      )}
    </div>
  );
}
