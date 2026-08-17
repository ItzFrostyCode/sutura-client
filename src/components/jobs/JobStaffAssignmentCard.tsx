import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Staff } from './jobTypes';
import { STAFF_STAGES, STAFF_STAGE_LABELS } from './jobHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';

interface JobStaffAssignmentCardProps {
  readonly allStaff: Staff[];
  readonly staffAssignments: Record<string, string>;
  readonly setStaffAssignments: (assignments: Record<string, string>) => void;
  readonly staffCompletions: Record<string, string | null>;
  readonly handleUpdateStaff: () => Promise<void>;
  readonly savingStaff: boolean;
}

export default function JobStaffAssignmentCard({
  allStaff,
  staffAssignments,
  setStaffAssignments,
  staffCompletions,
  handleUpdateStaff,
  savingStaff,
}: JobStaffAssignmentCardProps) {
  return (
    <div className="bg-surface border border-line rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-ink">Multi-Stage Staff Assignment</h2>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          Owner/Manager Only
        </span>
      </div>
      <div className="space-y-4">
        {STAFF_STAGES.map(stage => (
          <div key={stage} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-ink-body">
                {STAFF_STAGE_LABELS[stage]} Staff
              </label>
              {staffAssignments[stage] && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  staffCompletions[stage] 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {staffCompletions[stage] ? 'Completed' : 'In Progress'}
                </span>
              )}
            </div>
            <select
              value={staffAssignments[stage]}
              onChange={(e) => setStaffAssignments({...staffAssignments, [stage]: e.target.value})}
              className="w-full px-4 py-2 bg-canvas border border-line rounded-lg text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            >
              <option value="">Unassigned</option>
              {allStaff.map(staff => {
                const roleLabels = [staff.role, ...(staff.additional_roles || [])].filter(Boolean).map(roleLabel).join(', ') || 'Staff';
                let specArray: string[] = [];
                if (Array.isArray(staff.specialization)) {
                  specArray = staff.specialization;
                } else if (staff.specialization) {
                  specArray = [staff.specialization];
                }
                const specLabel = specArray.length > 0 ? ` - ${specArray.join(', ')}` : '';
                // Staff pinned to a branch can only be assigned to that
                // branch's jobs (server-side rejects a mismatch) — showing
                // the branch here lets the owner pick correctly the first
                // time instead of hitting a confusing rejection after saving.
                const branchLabel = staff.branch ? ` (${staff.branch.name})` : '';
                // Same ≥5 "overloaded" threshold as the Staff dashboard page —
                // lets the owner see who's already stretched thin right where
                // they're picking, instead of only finding out after the fact.
                const workloadLabel = staff.active_jobs
                  ? ` — ${staff.active_jobs} active${staff.active_jobs >= 5 ? ' ⚠' : ''}`
                  : '';
                // Surfaced, not enforced — same "warn don't block" pattern
                // as the workload flag above. A staff member on leave can
                // still be picked (e.g. a short absence, or the owner knows
                // better), but the owner should see it before choosing.
                const availabilityLabel = staff.is_active && staff.is_available === false ? ' (On Leave)' : '';
                return (
                  <option key={staff.id} value={staff.user.id}>
                    [{roleLabels}] {staff.user.name}{specLabel}{branchLabel}{workloadLabel}{availabilityLabel}
                  </option>
                );
              })}
            </select>
          </div>
        ))}
        <div className="pt-2">
          <button
            onClick={handleUpdateStaff}
            disabled={savingStaff}
            className="w-full bg-sunken hover:bg-line border border-line-strong text-ink px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            type="button"
          >
            {savingStaff ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            Save Staff Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
