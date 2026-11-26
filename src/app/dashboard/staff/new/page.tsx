'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
import AccountFields, { type AccountValues } from '@/components/auth/AccountFields';
import ApplePage, { AppleBar } from '@/components/jobs/ui/ApplePage';
import { BTN_PRIMARY, BTN, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { meetsPasswordRules } from '@/lib/passwordRules';

const EMPTY: AccountValues = { name: '', gender: '', email: '', password: '', password_confirmation: '' };

export default function NewStaffPage() {
  const router = useRouter();
  const toast = useToast();
  const { store, user } = useAuthStore();
  const { branches } = useBranch();

  const roleNames = user?.roles?.map((r: { name: string }) => r.name) ?? [];
  const isOwner = roleNames.includes('store_owner');
  const isManager = roleNames.includes('branch_manager');

  const [values, setValues] = useState<AccountValues>(EMPTY);
  const [branchId, setBranchId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Owner must pick a branch when the shop has 2+; auto when 1.
  // Branch manager: no picker, own branch.
  const ownerBranches = isOwner ? (branches ?? []) : [];
  const needsBranchPick = isOwner && ownerBranches.length > 1;
  const autoBranchId = isOwner && ownerBranches.length === 1 ? String(ownerBranches[0].id) : '';

  const canSubmit = meetsPasswordRules(values.password)
    && values.password === values.password_confirmation
    && values.name.trim()
    && values.email.trim()
    && (!needsBranchPick || branchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !canSubmit) return;
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        gender: values.gender || null,
      };
      if (isOwner) {
        payload.store_branch_id = needsBranchPick ? Number(branchId) : (autoBranchId ? Number(autoBranchId) : undefined);
      }
      const res = await api.post(`/stores/${store.id}/staff`, payload);
      const staffId: number | undefined = res.data?.data?.id;
      toast.success('Staff account created.');
      router.push(staffId ? `/dashboard/staff/${staffId}` : '/dashboard/staff');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setError(e2.response?.data?.message ?? 'Failed to create staff account.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner && !isManager) {
    return (
      <ApplePage>
        <AppleBar>
          <Link href="/dashboard/staff" className="mr-2 text-ink-muted hover:text-ink"><ArrowLeft size={20} /></Link>
          <h1 className="text-lg font-bold text-ink">Add Staff</h1>
        </AppleBar>
        <div className="px-4 py-12 text-center text-sm text-ink-muted">
          Only the shop owner or branch manager can add staff.
        </div>
      </ApplePage>
    );
  }

  return (
    <ApplePage>
      <AppleBar stuck>
        <Link href="/dashboard/staff" className="mr-2 text-ink-muted hover:text-ink" aria-label="Back to staff">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-base font-semibold text-ink">Add Staff Member</h1>
        <button
          type="submit"
          form="new-staff-form"
          disabled={saving || !canSubmit}
          className={BTN_PRIMARY}
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Creating…' : 'Create account'}
        </button>
      </AppleBar>

      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <form id="new-staff-form" onSubmit={handleSubmit}>
          <AccountFields
            values={values}
            onChange={delta => setValues(prev => ({ ...prev, ...delta }))}
            idPrefix="new-staff"
            after={
              /* Branch picker: only shown to owner with 2+ branches */
              isOwner && ownerBranches.length > 1 ? (
                <div>
                  <label htmlFor="new-staff-branch" className={PLAIN_LABEL}>
                    Branch <span className="text-danger">*</span>
                  </label>
                  <select
                    id="new-staff-branch"
                    required
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    className={PLAIN_FIELD}
                  >
                    <option value="">— pick a branch —</option>
                    {ownerBranches.map(b => (
                      <option key={b.id} value={String(b.id)}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ) : isOwner && ownerBranches.length === 1 ? (
                <p className="rounded-xl border border-line bg-canvas/60 px-4 py-3 text-sm text-ink-muted">
                  Branch: <span className="font-medium text-ink">{ownerBranches[0].name}</span>
                </p>
              ) : null
            }
          />

          <p className="mt-6 text-xs text-ink-muted leading-relaxed">
            A temporary password is set above. The staff member will be asked to choose their own password when they first sign in.
          </p>

          <div className="mt-8 flex gap-3">
            <Link href="/dashboard/staff" className={BTN}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className={BTN_PRIMARY}
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </ApplePage>
  );
}
