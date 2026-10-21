'use client';

import { unitOfMetrics } from '@/lib/measurementUnit';
import { MeasurementStatusBadge } from '@/components/measurements/MeasurementStatus';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Ruler, ChevronDown } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { MetricPill, humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import MeasurementPurpose from '@/components/measurements/MeasurementPurpose';
import { type ProfileGroup, SOURCE_LABELS } from './measurementAccountTypes';

export default function MeasurementProfileCard({ group, showIn = '' }: Readonly<{ group: ProfileGroup; showIn?: 'in' | 'cm' | '' }>) {
  const [selectedId, setSelectedId] = useState(group.versions.at(-1)!.id);
  const active = group.versions.find((v) => v.id === selectedId) ?? group.versions.at(-1)!;
  const activeIndex = group.versions.indexOf(active);
  const metricEntries = Object.entries(active.metrics || {}).filter(([k, v]) => Boolean(v) && !k.startsWith('_'));

  return (
    <div className="card-soft p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-sunken">
            {group.storeLogo ? (
              <Image
                src={getMediaUrl(group.storeLogo)}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store size={14} className="text-ink-faint" />
              </div>
            )}
          </div>
          {group.storeSlug ? (
            <Link
              href={`/store/${group.storeSlug}`}
              className="mobile-caption truncate text-ink-muted hover:text-taupe"
            >
              {group.storeName}
            </Link>
          ) : (
            <span className="mobile-caption truncate text-ink-muted">{group.storeName}</span>
          )}
        </div>

        {group.versions.length > 1 && (
          <div className="relative shrink-0">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="h-9 appearance-none rounded-full bg-sunken pl-3.5 pr-8 text-xs font-semibold text-ink-muted focus:outline-none focus:ring-2 focus:ring-line-strong"
            >
              {group.versions.map((v, idx) => (
                <option key={v.id} value={v.id}>
                  Version {idx + 1} of {group.versions.length}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Ruler size={16} className="text-taupe shrink-0" />
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="mobile-h4 font-semibold text-ink leading-snug">{group.profileName}</h3>
          <MeasurementStatusBadge status={active.status} />
        </div>
      </div>

      <MeasurementPurpose record={active} className="mb-1" />

      {active.source && (
        <p className="mobile-caption text-ink-faint mb-3 font-normal">
          {SOURCE_LABELS[active.source] ?? active.source} · {new Date(active.updated_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}

      {metricEntries.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {metricEntries.map(([key, value]) => (
            <MetricPill key={key} label={humanizeMetricKey(key)} value={value} unit={unitOfMetrics(active.metrics)} showIn={showIn} />
          ))}
        </div>
      ) : (
        <p className="mobile-caption text-ink-faint font-normal">No metrics recorded for this version.</p>
      )}

      {active.notes && (
        <p className="mobile-caption mt-3 rounded-xl bg-sunken px-3 py-2.5 italic text-ink-muted">
          &ldquo;{active.notes}&rdquo;
        </p>
      )}

      {group.versions.length > 1 && (
        <p className="mobile-caption text-ink-faint mt-3 font-normal">
          Version {activeIndex + 1} of {group.versions.length}
        </p>
      )}
    </div>
  );
}
