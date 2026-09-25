'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Ruler, ChevronDown } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { MetricPill, humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import { type ProfileGroup, SOURCE_LABELS } from './measurementAccountTypes';

export default function MeasurementProfileCard({ group }: Readonly<{ group: ProfileGroup }>) {
  const [selectedId, setSelectedId] = useState(group.versions.at(-1)!.id);
  const active = group.versions.find((v) => v.id === selectedId) ?? group.versions.at(-1)!;
  const activeIndex = group.versions.indexOf(active);
  const metricEntries = Object.entries(active.metrics || {}).filter(([, v]) => v);

  return (
    <div className="bg-surface border border-line p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-sunken overflow-hidden relative shrink-0">
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
              className="mobile-caption font-semibold text-ink-muted hover:text-taupe truncate"
            >
              {group.storeName}
            </Link>
          ) : (
            <span className="mobile-caption font-semibold text-ink-muted truncate">{group.storeName}</span>
          )}
        </div>

        {group.versions.length > 1 && (
          <div className="relative shrink-0">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="appearance-none pl-2.5 pr-7 h-9 bg-canvas border border-line text-xs font-semibold text-ink-muted focus:outline-none focus:border-taupe"
            >
              {group.versions.map((v, idx) => (
                <option key={v.id} value={v.id}>
                  Version {idx + 1} of {group.versions.length}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Ruler size={16} className="text-taupe shrink-0" />
        <h3 className="mobile-h4 font-semibold text-ink leading-snug">{group.profileName}</h3>
      </div>

      {active.source && (
        <p className="mobile-caption text-ink-faint mb-3 font-normal">
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
        <p className="mobile-caption text-ink-faint font-normal">No metrics recorded for this version.</p>
      )}

      {active.notes && (
        <p className="mobile-caption text-ink-muted mt-3 pt-3 border-t border-line italic font-normal">
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
