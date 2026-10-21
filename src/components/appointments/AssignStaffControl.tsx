'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { roleLabel } from '@/components/staff/staffHelpers';
import type { StaffData } from './appointmentHelpers';

interface AssignStaffControlProps {
  readonly assignedStaffId?: number | null;
  readonly assignedName?: string | null;
  readonly branchId?: number | null;
  readonly staff: StaffData[];
  readonly storeOwner?: { id: number; name: string } | null;
  readonly canAssign: boolean;
  /** Resolves true when saved. null = unassign. */
  readonly onAssign: (staffId: number | null) => Promise<boolean>;
  readonly disabled?: boolean;
}

// Approving a request and choosing who handles it are two separate steps — an appointment may stay
// confirmed and unassigned. Assigning notifies that person. Can be Shop Owner, Branch Manager, or Branch Staff.
export default function AssignStaffControl({
  assignedStaffId,
  assignedName,
  branchId,
  staff,
  storeOwner,
  canAssign,
  onAssign,
  disabled,
}: Readonly<AssignStaffControlProps>) {
  const [value, setValue] = useState<string>(assignedStaffId ? String(assignedStaffId) : '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(assignedStaffId ? String(assignedStaffId) : ''), [assignedStaffId]);

  if (!canAssign) {
    return (
      <p className="text-ink font-medium mt-0.5">
        {assignedName ?? <span className="text-ink-faint font-normal">Not assigned yet</span>}
      </p>
    );
  }

  // Filter staff:
  // If an appointment belongs to a branch, exclude staff assigned to another branch.
  const branchStaff = staff.filter(s => {
    const staffBranchId = s.branch?.id ?? s.store_branch_id;
    if (branchId && staffBranchId && Number(staffBranchId) !== Number(branchId)) {
      return false;
    }
    // Prevent duplicate owner entry if owner exists in staff profile list
    if (storeOwner && Number(s.user_id) === Number(storeOwner.id)) {
      return false;
    }
    return true;
  });

  const branchManagers = branchStaff.filter(s => s.is_branch_manager);
  const regularStaff = branchStaff.filter(s => !s.is_branch_manager);

  // Check if currently assigned handler is present in the list
  const isOwnerAssigned = storeOwner && assignedStaffId && Number(assignedStaffId) === Number(storeOwner.id);
  const isStaffAssigned = branchStaff.some(s => Number(s.user_id) === Number(assignedStaffId));
  const hasFallback = assignedStaffId && !isOwnerAssigned && !isStaffAssigned;

  const changed = value !== (assignedStaffId ? String(assignedStaffId) : '');
  const save = async () => {
    setSaving(true);
    await onAssign(value ? Number(value) : null);
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <select
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={disabled || saving}
        aria-label="Assigned to"
        className="flex-1 min-w-0 h-11 px-3 bg-surface border border-line text-base sm:text-sm text-ink rounded-xl focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors"
      >
        <option value="">Not assigned yet</option>
        {storeOwner && (
          <option value={storeOwner.id}>
            {storeOwner.name} — Shop Owner
          </option>
        )}
        {branchManagers.map(s => {
          const name = s.user?.name || `Manager #${s.user_id}`;
          return (
            <option key={`bm-${s.user_id}`} value={s.user_id}>
              {name} — Branch Manager
            </option>
          );
        })}
        {regularStaff.map(s => {
          const name = s.user?.name || `Staff #${s.user_id}`;
          const role = s.role ? ` — ${roleLabel(s.role)}` : ' — Staff';
          return (
            <option key={`staff-${s.user_id}`} value={s.user_id}>
              {name}{role}
            </option>
          );
        })}
        {hasFallback && (
          <option value={assignedStaffId}>
            {assignedName ? `${assignedName} (Current)` : `Assigned (#${assignedStaffId})`}
          </option>
        )}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={!changed || saving || disabled}
        className="h-11 px-4 bg-espresso hover:bg-espresso/90 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-colors shrink-0"
      >
        {saving && <Loader2 size={14} className="animate-spin" />} {value ? 'Assign' : 'Unassign'}
      </button>
    </div>
  );
}
