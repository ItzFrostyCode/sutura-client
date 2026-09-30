'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/apiError';
import type { Service } from '@/components/services/serviceHelpers';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import ServiceDetailHeader from '@/components/services/detail/ServiceDetailHeader';
import ServiceEditableOverview from '@/components/services/detail/ServiceEditableOverview';
import { useServiceSectionEdit } from '@/components/services/detail/useServiceSectionEdit';
import { buildServicePayload, toDraft, toPublicService } from '@/components/services/detail/serviceEditing';
import CatalogDetailTabsNav, { type CatalogDetailTab } from '@/components/catalog/detail/CatalogDetailTabsNav';
import PauseDesignModal from '@/components/catalog/detail/PauseDesignModal';
import UnsavedChangesModal from '@/components/catalog/editable/UnsavedChangesModal';
import { useCanManageOfferings } from '@/hooks/useCanManageOfferings';
import { useUnsavedChangesGuard } from '@/components/catalog/editable/useUnsavedChangesGuard';
import ServiceRatingsSection from '@/components/store-service-detail/ServiceRatingsSection';
import type { PublicService } from '@/components/store-storefront/types';

// Same side padding the customer page gives its content blocks on phones
// (the photo alone runs edge-to-edge).
const PAD = 'px-4 min-[375px]:px-6 min-[600px]:px-0';

export default function ServiceDetailOwnerPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { store } = useAuthStore();

  const [service, setService] = useState<Service | null>(null);
  const [publicView, setPublicView] = useState<PublicService | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CatalogDetailTab>('overview');
  const [toggling, setToggling] = useState(false);

  const [pauseOpen, setPauseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  const reload = useCallback(async () => {
    if (!store?.id) return;
    try {
      const [own, pub] = await Promise.all([
        api.get(`/stores/${store.id}/services`),
        api.get(`/public/stores/${store.slug}/services`).catch(() => ({ data: { data: [] } })),
      ]);
      const found = ((own.data.data ?? []) as Service[]).find((s) => s.id === Number(id)) ?? null;
      setService(found);
      setPublicView(((pub.data.data ?? []) as PublicService[]).find((s) => s.id === Number(id)) ?? null);
    } catch {
      toast.error('Failed to load this service.');
    } finally {
      setLoading(false);
    }
  }, [store?.id, store?.slug, id, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const canManage = useCanManageOfferings();
  const edit = useServiceSectionEdit(service, reload, canManage);
  const { guard, pending, clearPending } = useUnsavedChangesGuard(edit.isDirty);

  // Ratings come from the public list (it carries each rating); the owner's
  // own list carries the rest.
  const ratingsView = useMemo<PublicService | null>(() => {
    if (!service) return null;
    return { ...toPublicService(service), reviews: publicView?.reviews ?? [], reviews_count: publicView?.reviews_count ?? service.reviews_count ?? 0, reviews_avg_rating: publicView?.reviews_avg_rating ?? service.reviews_avg_rating ?? null };
  }, [service, publicView]);

  // A combo needs 2+ orderable services; the server pauses any that fall short and says which.
  const notePausedPackages = (names?: string[]) => {
    if (names?.length) toast.info(`Paused ${names.length === 1 ? 'the combo' : 'these combos'} because fewer than 2 services are left: ${names.join(', ')}.`);
  };

  const saveWithActive = async (isActive: boolean) => {
    if (!store?.id || !service) return;
    setToggling(true);
    try {
      const res = await api.put(`/stores/${store.id}/services/${service.id}`, buildServicePayload(service, toDraft(service), isActive));
      toast.success(isActive ? 'Service is live again.' : 'Service paused.');
      notePausedPackages(res.data?.paused_packages);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change the service status.'));
    } finally {
      setToggling(false);
    }
  };

  const confirmDelete = async () => {
    if (!store?.id || !service) return;
    setModalBusy(true);
    try {
      const res = await api.delete(`/stores/${store.id}/services/${service.id}`);
      toast.success('Service deleted.');
      notePausedPackages(res.data?.paused_packages);
      router.push('/dashboard/services');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete service.'));
      setModalBusy(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-ink-muted">
        <Loader2 className="w-9 h-9 animate-spin text-taupe mb-3" />
        <span className="text-sm font-semibold">Loading service…</span>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-white border border-line p-12 text-center max-w-lg mx-auto my-12">
        <AlertCircle size={44} className="text-ink-muted mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink">Service not found</h2>
        <p className="text-xs text-ink-muted mt-1 mb-6">It may have been removed or does not belong to your store.</p>
        <Link href="/dashboard/services" className="px-5 py-2.5 bg-taupe text-white text-xs font-bold hover:bg-[#8A7063] transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    // -m-4 cancels the dashboard shell's p-4; then the page takes the exact
    // container the customer's Service Detail uses at each width.
    <div className="-m-4 animate-in fade-in duration-300 text-ink">
      <div className="w-full max-w-7xl mx-auto px-0 min-[600px]:px-[10px] md:px-8 py-0 min-[600px]:py-[10px] md:py-6 pb-24 min-[600px]:pb-10 space-y-4">
        <div className={`${PAD} pt-3 min-[600px]:pt-0`}>
          <ServiceDetailHeader
            isActive={service.is_active}
            toggling={toggling}
            showActions={activeTab === 'overview' && canManage}
            onBack={() => guard(() => router.push('/dashboard/services'))}
            onToggle={() => (service.is_active ? setPauseOpen(true) : saveWithActive(true))}
            onDelete={() => setDeleteOpen(true)}
          />
        </div>

        <div className={PAD}>
          <CatalogDetailTabsNav
            activeTab={activeTab}
            onSelectTab={(tab) => guard(() => setActiveTab(tab))}
            ordersCount={0}
            reviewsCount={ratingsView?.reviews_count ?? 0}
            showOrders={false}
          />
        </div>

        {activeTab === 'overview' && (
          <ServiceEditableOverview service={service} edit={edit} />
        )}

        {activeTab === 'reviews' && ratingsView && (
          <div className={PAD}>
            <ServiceRatingsSection service={ratingsView} />
          </div>
        )}
      </div>

      <PauseDesignModal
        open={pauseOpen}
        designName={service.name}
        noun="service"
        pausing={toggling}
        onCancel={() => setPauseOpen(false)}
        onConfirm={async () => {
          await saveWithActive(false);
          setPauseOpen(false);
        }}
      />

      <ServiceDeleteModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} isSubmitting={modalBusy} />


      <UnsavedChangesModal
        open={pending !== null}
        saving={edit.saving}
        onKeepEditing={clearPending}
        onDiscard={() => {
          const proceed = pending;
          edit.discard();
          clearPending();
          proceed?.();
        }}
        onSave={async () => {
          const proceed = pending;
          if (await edit.saveCurrent()) {
            clearPending();
            proceed?.();
          }
        }}
      />
    </div>
  );
}
