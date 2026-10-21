import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export interface StaffPerson {
  id: number;
  name: string;
  /** Jobs they are on right now, when the server says. */
  active: number | null;
  /** The branch they work in; null for the owner. */
  branchId: number | null;
  branch: string | null;
  /** What they are good at, as the owner wrote it on the Staff page. */
  skills: string[];
  /** Their position in the shop: Owner, Branch manager, or the role the owner gave them (Tailor, Cutter…). */
  role: string;
}

const titleCase = (v?: string | null) => (v ?? '').replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** The people an order can be planned for or a correction assigned to: active staff, plus the owner when the owner is the one asking. */
export function useStoreStaff(storeId: number): StaffPerson[] {
  const me = useAuthStore((s) => s.user);
  const isOwner = Boolean(me?.roles?.some((r) => r.name === 'store_owner'));
  const [people, setPeople] = useState<StaffPerson[]>([]);

  useEffect(() => {
    api.get(`/stores/${storeId}/staff`).then((res) => {
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      const staff: StaffPerson[] = rows
        .filter((r: { is_active?: boolean }) => r.is_active !== false)
        .map((r: { user: { id: number; name: string }; role?: string | null; is_branch_manager?: boolean; active_jobs?: number; store_branch_id?: number | null; branch?: { name: string } | null; specialization?: string | string[] | null }) => ({
          id: r.user.id, name: r.user.name, active: r.active_jobs ?? null, branchId: r.store_branch_id ?? null, branch: r.branch?.name ?? null,
          skills: ([] as string[]).concat(r.specialization ?? []).map((x) => x.trim()).filter(Boolean),
          role: r.is_branch_manager ? 'Branch manager' : titleCase(r.role) || 'Staff',
        }));
      // The owner is a real person in the list, not a label on someone else: added once, with their own role.
      setPeople(isOwner && me ? [{ id: me.id, name: me.name, active: null, branchId: null, branch: null, skills: [], role: 'Owner' }, ...staff.filter((p) => p.id !== me.id)] : staff);
    }).catch(() => setPeople([]));
  }, [storeId, isOwner, me]);

  return people;
}
