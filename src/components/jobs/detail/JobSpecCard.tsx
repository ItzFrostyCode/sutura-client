'use client';

import React from 'react';
import Link from 'next/link';
import { Shirt } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import { Job } from '../jobTypes';
import { GARMENT_CATEGORY_LABELS } from '../jobHelpers';
import { GARMENT_CATEGORIES } from '@/lib/garmentTaxonomy';

interface JobSpecCardProps {
  job: Job;
}

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted';

const humanize = (v: string) => {
  const t = v.replaceAll('_', ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** The value to show for one custom-order entry, or null when there is nothing worth showing. */
function specValue(key: string, value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return null;
  const text = String(value);
  if (text === '') return null;
  if (key === 'garment_group') return (GARMENT_CATEGORIES as Record<string, { label: string }>)[text]?.label ?? humanize(text);
  return text;
}

function InfoItem({ label, value, sub, extra, divided }: Readonly<{ label: string; value: string; sub: string; extra?: React.ReactNode; divided?: 'mobile' | 'all' }>) {
  return (
    <div className={`space-y-1 ${divided === 'all' ? 'border-t border-line pt-4' : divided === 'mobile' ? 'border-t border-line pt-4 sm:border-0 sm:pt-0' : ''}`}>
      <span className={`${LABEL} block`}>{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[15px] font-medium text-ink">{value}</p>
        {extra}
      </div>
      {sub && <p className="text-[13px] text-ink-muted">{sub}</p>}
    </div>
  );
}

export default function JobSpecCard({ job }: JobSpecCardProps) {
  const resolvedCategory =
    job.service?.category ||
    (job.service?.categories && job.service.categories.length > 0 ? job.service.categories.join(', ') : null) ||
    (job.garment_category ? (GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category) : null) ||
    'Custom Apparel & Tailoring';

  const data = job.custom_order_data ?? {};
  const customSpecEntries = Object.entries(data)
    .filter(([label]) => !['roster', 'team_roster', 'fabric_preference', 'team_name', 'size_breakdown', 'personalization_config'].includes(label))
    .filter(([label]) => !(label === 'garment' && 'garment_type' in data))
    .map(([label, value]) => [label, specValue(label, value)] as const)
    .filter((e): e is readonly [string, string] => e[1] !== null);

  const fabric = job.material_source === 'customer_supplied'
    ? "Customer's Own Fabric"
    : (data.fabric_preference ? `${String(data.fabric_preference)} (Store Supplied)` : 'Store Supplied Material');

  return (
    <div className="h-full space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-2xs sm:p-6">
      <SectionHeader
        icon={Shirt}
        title="Garment & Order Specifications"
        subtitle="Primary tailoring requirements and fabric allocation"
        actions={job.customer && (
          <Link href={`/dashboard/customers/${job.customer.id}`} className="shrink-0 py-1 text-[13px] font-medium text-espresso hover:underline">
            View Customer Profile →
          </Link>
        )}
      />

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <InfoItem
          label="Customer"
          value={job.customer?.name || 'Walk-in Customer'}
          sub={job.customer?.email ?? ''}
          extra={job.customer?.suki_tag && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium uppercase text-amber-700">{job.customer.suki_tag}</span>
          )}
        />
        <InfoItem divided="mobile" label="Service & Category" value={job.service?.name || 'Custom Garment'} sub={`Category: ${resolvedCategory}`} />
        <InfoItem divided="all" label="Branch" value={job.branch?.name || 'Unassigned'} sub="Where this job is being fulfilled" />
        <InfoItem
          divided="all"
          label="Fabric & Material"
          value={fabric}
          sub={job.material_source === 'customer_supplied' ? 'Customer dropped off fabric material' : 'Fabric supplied by the shop'}
        />
        <InfoItem
          divided="all"
          label="Last Updated By"
          value={job.assigned_staff?.name || 'Not yet touched'}
          sub={job.staff_stages && job.staff_stages.length > 0 ? `${job.staff_stages.length} production stage(s) recorded` : 'No production stage recorded yet'}
        />
      </div>

      {customSpecEntries.length > 0 && (
        <div className="border-t border-line pt-4">
          <h3 className={`${LABEL} mb-3`}>Custom Design Specifications</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {customSpecEntries.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl bg-sunken/70 px-3.5 py-3">
                <span className={`${LABEL} block truncate`}>{label.replaceAll('_', ' ')}</span>
                <span title={value} className="mt-0.5 block truncate text-[15px] text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
