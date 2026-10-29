'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { unitNoun } from '@/lib/orderUnits';
import SectionHeader from '../ui/SectionHeader';
import { Job } from '../jobTypes';
import TeamListCard from './TeamListCard';

interface JobRosterCardProps {
  job: Job;
  onToggleRosterItem: (index: number) => void;
  /** A completed order: the done marks show but cannot be changed. */
  readOnly?: boolean;
  /** "Edit team list", while the order can still be changed. */
  action?: React.ReactNode;
}

/** A group order's people (one team list), or, for an order with no names, its size breakdown. */
export default function JobRosterCard({ job, onToggleRosterItem, readOnly, action }: JobRosterCardProps) {
  const teamRoster = job.custom_order_data?.team_roster || job.custom_order_data?.roster;
  if (Array.isArray(teamRoster) && teamRoster.length > 0) {
    return <TeamListCard job={job} onToggle={onToggleRosterItem} readOnly={readOnly} action={action} />;
  }

  // Otherwise check for non-personalized Bulk Size Breakdown
  const sizeBreakdown = job.custom_order_data?.size_breakdown as Record<string, number> | undefined;
  if (!sizeBreakdown || typeof sizeBreakdown !== 'object') return null;
  const entries = Object.entries(sizeBreakdown).filter(([, qty]) => Number(qty) > 0);
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, qty]) => sum + Number(qty), 0);
  // Top & bottom: a second count per bottom size, for the same number of sets.
  const bottom = Object.entries((job.custom_order_data?.size_breakdown_bottom as Record<string, number> | undefined) ?? {}).filter(([, qty]) => Number(qty) > 0);
  const both = job.custom_order_data?.measure_area === 'both' && bottom.length > 0;
  const garmentType = job.custom_order_data?.garment_type as string | undefined;
  const orderPurpose = job.custom_order_data?.order_purpose as string | undefined;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <SectionHeader
        icon={Users}
        title="Size Breakdown"
        subtitle={(garmentType || orderPurpose) ? [garmentType, orderPurpose].filter(Boolean).join(' — ') : undefined}
        badge={(
          <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0 bg-sunken text-ink-muted uppercase tracking-wider text-[11px]">
            {total} {unitNoun(both ? 'set' : null, total)} total
          </span>
        )}
      />
      {[[both ? 'Top sizes' : '', entries], ...(both ? [['Bottom sizes', bottom]] : [])].map(([title, list]) => (
        <div key={title as string} className="space-y-1.5">
          {title && <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{title as string}</p>}
          <div className="flex flex-wrap gap-2">
            {(list as [string, number][]).map(([size, qty]) => (
              <span key={size} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sunken text-ink">
                {size} <span className="text-ink-muted font-semibold">× {qty}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
