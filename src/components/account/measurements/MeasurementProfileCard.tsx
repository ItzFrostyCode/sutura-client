'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { MeasurementStatusBadge } from '@/components/measurements/MeasurementStatus';
import MeasurementPurpose from '@/components/measurements/MeasurementPurpose';
import MeasurementSheet from './MeasurementSheet';
import type { ProfileGroup } from './measurementAccountTypes';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/** A measurement the shop has on file that no job order uses yet: the shop, its versions, then the sizes. */
export default function MeasurementProfileCard({ group }: Readonly<{ group: ProfileGroup }>) {
  const [selectedId, setSelectedId] = useState(group.versions.at(-1)!.id);
  const active = group.versions.find((v) => v.id === selectedId) ?? group.versions.at(-1)!;

  return (
    <article className="card-soft p-4">
      <div className="flex items-center gap-3">
        <StoreLogoAvatar src={group.storeLogo} name={group.storeName} className="h-10 w-10 rounded-full border border-line-strong shadow-none" textClassName="text-sm font-serif font-bold text-taupe-dark" />
        <div className="min-w-0 flex-1">
          <h3 className="mobile-h4 break-words text-ink">{group.profileName}</h3>
          {group.storeSlug
            ? <Link href={`/store/${group.storeSlug}`} className="mobile-caption text-ink-muted underline-offset-2 hover:underline">{group.storeName}</Link>
            : <p className="mobile-caption text-ink-muted">{group.storeName}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-line pt-3">
        <MeasurementStatusBadge status={active.status} />
        <span className="mobile-caption text-ink-muted">Recorded {day(active.updated_at)}</span>
        {group.versions.length > 1 && (
          <div className="relative ml-auto">
            <label htmlFor={`ver-${group.storeId}-${group.profileName}`} className="sr-only">Version</label>
            <select id={`ver-${group.storeId}-${group.profileName}`} value={selectedId} onChange={(e) => setSelectedId(Number(e.target.value))}
              className="h-11 appearance-none rounded-full bg-sunken pl-4 pr-9 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-line-strong">
              {group.versions.map((v, i) => <option key={v.id} value={v.id}>Version {i + 1} of {group.versions.length}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          </div>
        )}
      </div>
      <MeasurementPurpose record={active} className="mt-2" />

      <div className="mt-3">
        <MeasurementSheet record={active} />
      </div>
    </article>
  );
}
