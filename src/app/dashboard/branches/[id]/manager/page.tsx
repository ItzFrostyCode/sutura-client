'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import ApplePage, { AppleBar } from '@/components/jobs/ui/ApplePage';
import { BTN_PRIMARY, BTN } from '@/components/shared/plainForm';
import BranchManagerSection from '@/components/branches/BranchManagerSection';
import { meetsPasswordRules } from '@/lib/passwordRules';
import type { AccountValues } from '@/components/auth/AccountFields';
import type { Staff } from '@/components/staff/staffHelpers';
import { getErrorMessage } from '@/lib/apiError';

const EMPTY_MANAGER: AccountValues = { name: '', gender: '', email: '', password: '', password_confirmation: '' };

export default function AssignManagerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const branchId = params.id;
  const toast = useToast();
  const { store, user } = useAuthStore();

  const isOwner = user?.roles?.some((r: { name: string }) => r.name === 'store_owner') ?? false;

  const [branchName, setBranchName] = useState('');
  const [mode, setMode] = useState<'new' | 'pick' | 'none'>('new');
  const [managerAccount, setManagerAccount] = useState<AccountValues>(EMPTY_MANAGER);
  const [pickedStaffId, setPickedStaffId] = useState('');
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    if (!store?.id || !branchId) return;
    api.get(`/stores/${store.id}/branches`).then(res => {
      const all = Array.isArray(res.data?.data) ? res.data.data : [];
      const found = all.find((b: { id: number; name: string }) => String(b.id) === String(branchId));
      if (found) setBranchName(found.name);
    }).catch(() => {});

    api.get(`/stores/${store.id}/staff`).then(res => {
      const raw: Staff[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setAvailableStaff(raw.filter(s => s.is_active && !s.is_branch_manager));
    }).catch(() => setAvailableStaff([]));
  }, [store?.id, branchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isOwner) {
    return (
      <ApplePage>
        <AppleBar>
          <Link href="/dashboard/branches" aria-label="Back"><ArrowLeft size={20} /></Link>
          <h1 className="text-base font-semibold text-ink">Assign Manager</h1>
        </AppleBar>
        <div className="px-4 py-12 text-center text-sm text-ink-muted">
          Only the shop owner can assign a branch manager.
        </div>
      </ApplePage>
    );
  }

  const canSubmit = (() => {
    if (mode === 'new') {
      return !!(
        managerAccount.name && managerAccount.email && managerAccount.password &&
        meetsPasswordRules(managerAccount.password) &&
        managerAccount.password === managerAccount.password_confirmation
      );
    }
    if (mode === 'pick') return !!pickedStaffId;
    return false; // 'none' is not valid here — must pick one
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !canSubmit) return;
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {};
      if (mode === 'new') {
        payload.manager = {
          name: managerAccount.name,
          email: managerAccount.email,
          password: managerAccount.password,
          password_confirmation: managerAccount.password_confirmation,
          gender: managerAccount.gender || null,
        };
      } else {
        payload.manager_id = Number(pickedStaffId);
      }
      await api.post(`/stores/${store.id}/branches/${branchId}/manager`, payload);
      toast.success(`Manager assigned to ${branchName || 'branch'}.`);
      router.push('/dashboard/branches');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to assign manager.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ApplePage>
      <AppleBar stuck>
        <Link href="/dashboard/branches" className="mr-2 text-ink-muted hover:text-ink" aria-label="Back to branches">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="flex-1 text-base font-semibold text-ink">
          Assign Manager{branchName ? ` — ${branchName}` : ''}
        </h1>
        <button type="submit" form="assign-manager-form" disabled={saving || !canSubmit} className={BTN_PRIMARY}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Saving…' : 'Assign manager'}
        </button>
      </AppleBar>

      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <p className="mb-6 text-sm text-ink-muted">
          {branchName ? `"${branchName}" doesn't have a manager yet.` : 'This branch doesn\'t have a manager yet.'}{' '}
          Choose how to assign one below.
        </p>

        <form id="assign-manager-form" onSubmit={handleSubmit}>
          <BranchManagerSection
            mode={mode}
            onMode={m => { if (m !== 'none') setMode(m); }}
            newAccount={managerAccount}
            onNewAccount={delta => setManagerAccount(prev => ({ ...prev, ...delta }))}
            availableStaff={availableStaff}
            pickedStaffId={pickedStaffId}
            onPickedStaffId={setPickedStaffId}
            idPrefix="am-mgr"
          />

          <div className="mt-8 flex gap-3">
            <Link href="/dashboard/branches" className={BTN}>Cancel</Link>
            <button type="submit" disabled={saving || !canSubmit} className={BTN_PRIMARY}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Saving…' : 'Assign manager'}
            </button>
          </div>
        </form>
      </div>
    </ApplePage>
  );
}
