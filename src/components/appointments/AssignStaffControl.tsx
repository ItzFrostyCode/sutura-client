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
  readonly canAssign: boolean;
  /** Resolves true when saved. null = unassign. */
  readonly onAssign: (staffId: number | null) => Promise<boolean>;
  readonly disabled?: boolean;
}

// Approving a request and choosing who handles it are two separate steps — an appointment may stay
// confirmed and unassigned. Assigning notifies that staff member.
export default function AssignStaffControl({ assignedStaffId, assignedName, branchId, staff, canAssign, onAssign, disabled }: Readonly<AssignStaffControlProps>) {
  const [value, setValue] = useState<string>(assignedStaffId ? String(assignedStaffId) : '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(assignedStaffId ? String(assignedStaffId) : ''), [assignedStaffId]);

  if (!canAssign) {
    return <p className="text-ink font-medium mt-0.5">{assignedName ?? <span className="text-ink-faint font-normal">Not assigned yet</span>}</p>;
  }

  // Staff pinned to another branch can't take this branch's appointment.
  const options = staff.filter(s => !branchId || !s.branch?.id || s.branch.id === branchId);
  const changed = value !== (assignedStaffId ? String(assignedStaffId) : '');
  const save = async () => { setSaving(true); await onAssign(value ? Number(value) : null); setSaving(false); };

  return (
    <div className="flex items-center gap-2 mt-1">
      <select value={value} onChange={e => setValue(e.target.value)} disabled={disabled || saving} aria-label="Assigned staff" className="flex-1 min-w-0 h-11 px-3 bg-surface border border-line text-sm text-ink focus:outline-none focus:border-taupe">
        <option value="">Not assigned yet</option>
        {options.map(s => {
          const name = s.user?.name || `Staff #${s.user_id}`;
          const role = s.role ? ` — ${roleLabel(s.role)}` : '';
          return <option key={s.user_id} value={s.user_id}>{name}{role}</option>;
        })}
      </select>
      <button type="button" onClick={save} disabled={!changed || saving || disabled} className="h-11 px-4 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
        {saving && <Loader2 size={14} className="animate-spin" />} {value ? 'Assign' : 'Unassign'}
      </button>
    </div>
  );
}
