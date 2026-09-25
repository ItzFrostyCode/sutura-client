'use client';

import React from 'react';
import Link from 'next/link';
import { Job } from '../jobTypes';
import { GARMENT_CATEGORY_LABELS } from '../jobHelpers';

interface JobSpecCardProps {
  job: Job;
}

export default function JobSpecCard({ job }: JobSpecCardProps) {
  const resolvedCategory =
    job.service?.category ||
    (job.service?.categories && job.service.categories.length > 0 ? job.service.categories.join(', ') : null) ||
    (job.garment_category ? (GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category) : null) ||
    'Custom Apparel & Tailoring';

  const customSpecEntries = job.custom_order_data
    ? Object.entries(job.custom_order_data).filter(
        ([label]) => !['roster', 'team_roster', 'fabric_preference', 'team_name', 'size_breakdown', 'personalization_config'].includes(label)
      )
    : [];

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-base font-bold text-ink">Garment & Order Specifications</h2>
          <p className="text-xs text-ink-muted mt-0.5">Primary tailoring requirements and fabric allocation</p>
        </div>
        {job.customer && (
          <Link
            href={`/dashboard/customers/${job.customer.id}`}
            className="text-xs font-bold text-taupe hover:text-taupe-hover hover:underline"
          >
            View Customer Profile →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm py-1">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Customer</span>
          <div className="flex items-center gap-2">
            <p className="font-bold text-ink text-sm">{job.customer?.name || 'Walk-in Customer'}</p>
            {job.customer?.suki_tag && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                {job.customer.suki_tag.toUpperCase()}
              </span>
            )}
          </div>
          {job.customer?.email && (
            <p className="text-xs text-ink-muted">{job.customer.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Service & Category</span>
          <p className="font-bold text-ink text-sm">{job.service?.name || 'Custom Garment'}</p>
          <p className="text-xs text-ink-muted font-medium">
            Category: <strong className="text-ink-body font-semibold">{resolvedCategory}</strong>
          </p>
        </div>

        <div className="space-y-1 border-t border-line/60 pt-3 sm:border-0 sm:pt-0">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Branch</span>
          <p className="font-bold text-ink text-sm">{job.branch?.name || 'Unassigned'}</p>
          <p className="text-xs text-ink-muted">Where this job is being fulfilled</p>
        </div>

        <div className="space-y-1 border-t border-line/60 pt-3 sm:border-0 sm:pt-0">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Fabric & Material</span>
          <p className="font-bold text-ink text-sm">
            {job.material_source === 'customer_supplied'
              ? "Customer's Own Fabric"
              : (job.custom_order_data?.fabric_preference
                  ? `${String(job.custom_order_data.fabric_preference)} (Store Supplied)`
                  : 'Store Supplied Material')}
          </p>
          <p className="text-xs text-ink-muted">
            {job.material_source === 'customer_supplied'
              ? 'Customer dropped off fabric material'
              : 'In-house fabric & sublimation inventory'}
          </p>
        </div>

        <div className="space-y-1 border-t border-line/60 pt-3 sm:border-0 sm:pt-0">
          <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">Assigned Staff</span>
          <p className="font-bold text-ink text-sm">{job.assigned_staff?.name || 'Unassigned'}</p>
          <p className="text-xs text-ink-muted">
            {job.staff_stages && job.staff_stages.length > 0
              ? `${job.staff_stages.length} multi-stage role(s) assigned`
              : 'Assigned to primary store queue'}
          </p>
        </div>
      </div>

      {customSpecEntries.length > 0 && (
        <div className="pt-3 border-t border-line">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Custom Design Specifications</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {customSpecEntries.map(([label, value]) => (
              <div key={label} className="text-xs">
                <span className="text-[10px] font-bold text-ink-muted uppercase block truncate">{label.replaceAll('_', ' ')}</span>
                <span className="font-semibold text-ink block truncate">
                  {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
