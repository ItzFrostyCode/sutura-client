'use client';

import React, { useEffect, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import type { Staff } from '@/components/staff/staffHelpers';
import { staffForBranch, staffOptionLabel } from '@/components/staff/staffHelpers';
import type { Job } from '../jobTypes';

const CLOSED = ['completed', 'cancelled', 'rejected', 'pending'];

/**
 * Due date + assigned staff, editable by the owner/manager on an active order —
 * the two things a walk-in order is created with that an online order usually
 * arrives without. (Pending orders get them on Approve instead.)
 */
export default function JobScheduleCard({ job, onSaved }: Readonly<{ job: Job; onSaved: () => void | Promise<void> }>) {
  const store = useAuthStore((s) => s.store);
  const toast = useToast();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const currentStaff = job.assigned_staff?.id ?? null;
  const [dueDate, setDueDate] = useState(job.due_date?.slice(0, 10) ?? '');
  const [staffId, setStaffId] = useState(currentStaff ? String(currentStaff) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/staff`)
      .then((res) => {
        const list: Staff[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setStaffList(list.filter((s) => s.is_active !== false));
      })
      .catch(() => {});
  }, [store?.id]);

  if (CLOSED.includes(job.status)) return null;

  const dirty = dueDate !== (job.due_date?.slice(0, 10) ?? '') || staffId !== (currentStaff ? String(currentStaff) : '');

  const save = async () => {
    if (!store || !dirty) return;
    setSaving(true);
    try {
      const staff = staffId ? Number(staffId) : null;
      await api.put(`/stores/${store.id}/jobs/${job.id}`, {
        due_date: dueDate || null,
        assigned_staff_id: staff,
        assigned_to: staff,
      });
      await onSaved();
      toast.success('Due date and staff saved.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Could not save the due date and staff.');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full min-h-11 bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe';

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3.5">
      <h3 className="font-bold text-sm text-ink flex items-center gap-2 border-b border-line pb-3">
        <CalendarClock size={15} className="text-taupe" /> Due Date & Staff
      </h3>
      {(!job.due_date || !currentStaff) && (
        <p className="text-xs text-amber-700">
          {!job.due_date && !currentStaff ? 'No due date or staff set yet.' : !job.due_date ? 'No due date set yet.' : 'No staff assigned yet.'}
        </p>
      )}
      <div>
        <label htmlFor="schedule-due-date" className="block text-xs font-semibold text-ink-muted mb-1">Due date</label>
        <input id="schedule-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="schedule-staff" className="block text-xs font-semibold text-ink-muted mb-1">Assigned staff</label>
        <select id="schedule-staff" value={staffId} onChange={(e) => setStaffId(e.target.value)} className={field}>
          <option value="">Unassigned</option>
          {staffForBranch(staffList, job.store_branch_id, currentStaff).map((s) => {
            const uid = s.user_id ?? s.user?.id;
            return uid ? <option key={uid} value={uid}>{staffOptionLabel(s)}</option> : null;
          })}
        </select>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={!dirty || saving}
        className="w-full min-h-11 bg-ink hover:bg-ink/90 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        Save
      </button>
    </div>
  );
}
