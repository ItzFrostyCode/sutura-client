'use client';

import React from 'react';
import { Users } from 'lucide-react';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';
import { STAFF_STAGES, STAFF_STAGE_LABELS } from '@/components/jobs/jobHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';
import { StaffData } from './types';

interface StaffAssignmentSectionProps {
  readonly staff: StaffData[];
  readonly staffStageAssignments: Record<string, string>;
  readonly setStaffStageAssignments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function StaffAssignmentSection({
  staff,
  staffStageAssignments,
  setStaffStageAssignments,
}: StaffAssignmentSectionProps) {
  return (
    <CollapsibleSection
      icon={<Users size={16} className="text-taupe" />}
      iconBoxClassName="bg-taupe/10 border border-taupe/20"
      title={
        <span className="flex items-center gap-2 flex-wrap">
          Multi-Stage Staff Assignment <span className="font-normal text-ink-faint text-xs">(Optional)</span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Owner/Manager Only
          </span>
        </span>
      }
      defaultOpen={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STAFF_STAGES.map((stage) => (
          <div key={stage}>
            <label
              htmlFor={`stage_${stage}`}
              className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider"
            >
              {STAFF_STAGE_LABELS[stage]} Staff
            </label>
            <select
              id={`stage_${stage}`}
              value={staffStageAssignments[stage] || ''}
              onChange={(e) =>
                setStaffStageAssignments((prev) => ({
                  ...prev,
                  [stage]: e.target.value,
                }))
              }
              className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            >
              <option value="">Unassigned</option>
              {(Array.isArray(staff) ? staff : []).map((s) => {
                if (!s || !s.user) return null;
                const roles = [s.role, ...(s.additional_roles || [])].filter(Boolean).map(roleLabel).join(', ');
                return (
                  <option key={s.id} value={s.user.id}>
                    {s.user.name} ({roles})
                  </option>
                );
              })}
            </select>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
