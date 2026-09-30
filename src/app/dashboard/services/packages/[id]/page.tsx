'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import type { Service, ServicePackage } from '@/components/services/serviceHelpers';
import ServiceDetailHeader from '@/components/services/detail/ServiceDetailHeader';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import PackageEditableOverview from '@/components/services/packages/PackageEditableOverview';
import { usePackageSectionEdit } from '@/components/services/packages/usePackageSectionEdit';
import { buildPackagePayload, toPackageDraft } from '@/components/services/packages/packageEditing';
import PauseDesignModal from '@/components/catalog/detail/PauseDesignModal';
import UnsavedChangesModal from '@/components/catalog/editable/UnsavedChangesModal';
import { useCanManageOfferings } from '@/hooks/useCanManageOfferings';
import { useUnsavedChangesGuard } from '@/components/catalog/editable/useUnsavedChangesGuard';

const PAD = 'px-4 min-[375px]:px-6 min-[600px]:px-0';

export default function PackageDetailOwnerPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { store } = useAuthStore();
  const [pkg, setPkg] = useState<ServicePackage | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!store?.id) return;
    try {
      const [pk, sv] = await Promise.all([api.get(`/stores/${store.id}/service-packages`), api.get(`/stores/${store.id}/services`)]);
      setPkg(((pk.data.data ?? []) as ServicePackage[]).find((p) => p.id === Number(id)) ?? null);
      setServices((sv.data.data ?? []) as Service[]);
    } catch {
      toast.error('Failed to load this package.');
    } finally {
      setLoading(false);
    }
  }, [store?.id, id, toast]);

  useEffect(() => { reload(); }, [reload]);

  const canManage = useCanManageOfferings();
  const edit = usePackageSectionEdit(pkg, services, reload, canManage);
  const { guard, pending, clearPending } = useUnsavedChangesGuard(edit.isDirty);

  const setActive = async (isActive: boolean) => {
    if (!store?.id || !pkg) return;
    setBusy(true);
    try {
      await api.put(`/stores/${store.id}/service-packages/${pkg.id}`, buildPackagePayload(toPackageDraft(pkg), isActive));
      toast.success(isActive ? 'Package is live again.' : 'Package paused.');
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change the package status.'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!store?.id || !pkg) return;
    setBusy(true);
    try {
      await api.delete(`/stores/${store.id}/service-packages/${pkg.id}`);
      toast.success('Package deleted.');
      router.push('/dashboard/services?tab=packages');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete package.'));
      setBusy(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-ink-muted">
        <Loader2 className="w-9 h-9 animate-spin text-taupe mb-3" />
        <span className="text-sm font-semibold">Loading package…</span>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="bg-white border border-line p-12 text-center max-w-lg mx-auto my-12">
        <AlertCircle size={44} className="text-ink-muted mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink">Package not found</h2>
        <Link href="/dashboard/services" className="mt-6 px-5 py-2.5 bg-taupe text-white text-xs font-bold inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="-m-4 animate-in fade-in duration-300 text-ink">
      <div className="w-full max-w-7xl mx-auto px-0 min-[600px]:px-[10px] md:px-8 py-0 min-[600px]:py-[10px] md:py-6 pb-24 min-[600px]:pb-10 space-y-4">
        <div className={`${PAD} pt-3 min-[600px]:pt-0`}>
          <ServiceDetailHeader
            isActive={pkg.is_active}
            toggling={busy}
            showActions={canManage}
            noun="package"
            onBack={() => guard(() => router.push('/dashboard/services?tab=packages'))}
            onToggle={() => (pkg.is_active ? setPauseOpen(true) : setActive(true))}
            onDelete={() => setDeleteOpen(true)}
          />
        </div>
        <PackageEditableOverview pkg={pkg} edit={edit} />
      </div>

      <PauseDesignModal
        open={pauseOpen}
        designName={pkg.name}
        noun="package"
        pausing={busy}
        onCancel={() => setPauseOpen(false)}
        onConfirm={async () => { await setActive(false); setPauseOpen(false); }}
      />
      <ServiceDeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} isSubmitting={busy} label="package" />
      <UnsavedChangesModal
        open={pending !== null}
        saving={edit.saving}
        onKeepEditing={clearPending}
        onDiscard={() => { const proceed = pending; edit.discard(); clearPending(); proceed?.(); }}
        onSave={async () => { const proceed = pending; if (await edit.saveCurrent()) { clearPending(); proceed?.(); } }}
      />
    </div>
  );
}
