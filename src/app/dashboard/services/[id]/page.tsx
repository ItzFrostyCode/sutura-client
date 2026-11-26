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

// Phones: the photo alone runs edge to edge (like the customer page); every other block keeps the dashboard's side
// margin, the same as the header's.
const PAD = 'px-[var(--dash-gutter)] min-[600px]:px-0';

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
      const [ownRes, pub] = await Promise.all([
        api.get(`/stores/${store.id}/services/${id}`).catch(async () => {
          const list = await api.get(`/stores/${store.id}/services`);
          const matched = ((list.data.data ?? []) as Service[]).find((s) => s.id === Number(id)) ?? null;
          return { data: { data: matched } };
        }),
        api.get(`/public/stores/${store.slug}/services`).catch(() => ({ data: { data: [] } })),
      ]);
      const found = (ownRes.data.data ?? null) as Service | null;
      setService(found);
      setPublicView(((pub.data.data ?? []) as PublicService[]).find((s) => s.id === Number(id)) ?? null);
    } catch {
      toast.error('Failed to load this service.');
    } finally {
      setLoading(false);
    }
  }, [store?.id, store?.slug, id, toast]);

  const onSavedSection = useCallback(async (updated?: Service) => {
    if (updated) {
      setService(updated);
    }
    await reload();
  }, [reload]);

  useEffect(() => {
    reload();
  }, [reload]);

  const canManage = useCanManageOfferings();
  const edit = useServiceSectionEdit(service, onSavedSection, canManage);
  const { guard, pending, clearPending } = useUnsavedChangesGuard(edit.isDirty);

  // Ratings come from the service's own loaded reviews or public list fallback
  const ratingsView = useMemo<PublicService | null>(() => {
    if (!service) return null;
    return {
      ...toPublicService(service),
      reviews: service.reviews ?? publicView?.reviews ?? [],
      reviews_count: service.reviews_count ?? publicView?.reviews_count ?? 0,
      reviews_avg_rating: service.reviews_avg_rating ?? publicView?.reviews_avg_rating ?? null,
    };
  }, [service, publicView]);

  // Lifecycle move (S2). Publishing runs the server's publish check (S3); its reasons are shown as they are.
  const saveWithActive = async (isActive: boolean): Promise<boolean> => {
    if (!store?.id || !service) return false;
    setToggling(true);
    try {
      const res = await api.put(`/stores/${store.id}/services/${service.id}`, buildServicePayload(service, toDraft(service), isActive, isActive ? 'published' : 'unpublished'));
      toast.success(isActive ? 'Service published. Customers can see it and book.' : 'Service unpublished. Existing bookings and orders are not affected.');
      if (res.data?.data) {
        setService(res.data.data);
      }
      await reload();
      return true;
    } catch (err) {
      const reasons = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      toast.error(reasons ? `To publish: ${Object.values(reasons).flat().join(' ')}` : getErrorMessage(err, 'Could not change the service status.'));
      return false;
    } finally {
      setToggling(false);
    }
  };

  const confirmDelete = async () => {
    if (!store?.id || !service) return;
    setModalBusy(true);
    try {
      await api.delete(`/stores/${store.id}/services/${service.id}`);
      toast.success('Service archived. Restore it any time from Services › Archived.');
      router.push('/dashboard/services');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to archive service.'));
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
        <Link href="/dashboard/services" className="px-5 py-2.5 bg-espresso text-white text-xs font-bold hover:bg-taupe transition-colors inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    // Cancels the dashboard shell's padding so the photo can run edge to edge on phones; from 600px the page keeps the
    // shell's side margin (--dash-gutter), so it lines up with the header.
    <div className="-my-4 -mx-[var(--dash-gutter)] animate-in fade-in duration-300 text-ink">
      <div className="w-full max-w-7xl px-0 min-[600px]:px-[var(--dash-gutter)] py-0 min-[600px]:py-4 space-y-4 pb-24 min-[600px]:pb-10">
        <div className={`${PAD} pt-3 min-[600px]:pt-0`}>
          <ServiceDetailHeader
            isActive={service.is_active}
            status={service.status ?? (service.is_active ? 'published' : 'unpublished')}
            toggling={toggling}
            showActions={activeTab === 'overview' && canManage}
            onBack={() => guard(() => router.push('/dashboard/services'))}
            onToggle={() => (service.status === 'published' || (!service.status && service.is_active)
              ? setPauseOpen(true)
              : void saveWithActive(true))}
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
        verb="Unpublish"
        pausing={toggling}
        onCancel={() => setPauseOpen(false)}
        onConfirm={async () => {
          await saveWithActive(false);
          setPauseOpen(false);
        }}
      />

      <ServiceDeleteModal archive isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} isSubmitting={modalBusy} />


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
