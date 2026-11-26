'use client';

import { useEffect, useRef, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useCanManageOfferings } from '@/hooks/useCanManageOfferings';
import { useToast } from '@/context/ToastContext';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';
import { DetailedCatalogItem } from '@/components/catalog/detail/detailTypes';
import CatalogItemHeader from '@/components/catalog/detail/CatalogItemHeader';
import { useCatalogSectionEdit } from '@/components/catalog/editable/useCatalogSectionEdit';
import { useUnsavedChangesGuard } from '@/components/catalog/editable/useUnsavedChangesGuard';
import UnsavedChangesModal from '@/components/catalog/editable/UnsavedChangesModal';
import PauseDesignModal from '@/components/catalog/detail/PauseDesignModal';
import CatalogOverviewTab from '@/components/catalog/detail/CatalogOverviewTab';
import ApparelReviewNotice from '@/components/catalog/ApparelReviewNotice';
import SubscriptionGate from '@/components/SubscriptionGate';
import type React from 'react';

// Same side padding the customer page gives its content blocks on phones
// (the hero photo alone runs edge-to-edge).
const PAD = 'px-[var(--dash-gutter)] min-[600px]:px-0';

function CatalogItemDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { store } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const [item, setItem] = useState<DetailedCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);


  const reloadItem = useCallback(async () => {
    if (!store || !id) return;
    try {
      const res = await api.get(`/stores/${store.id}/catalog/${id}`);
      setItem(res.data.data);
    } catch (err) {
      console.error('Failed to reload catalog item', err);
    }
  }, [store, id]);

  const canManage = useCanManageOfferings();
  const edit = useCatalogSectionEdit(item, reloadItem, canManage);

  // Coming back from Services after adding one via the "+" in Specification:
  // link it to this design right away, so nothing is left to save.
  const linkedRef = useRef(false);
  useEffect(() => {
    if (linkedRef.current || !store?.id || !item) return;
    const serviceId = new URLSearchParams(window.location.search).get('linked_service');
    if (!serviceId) return;
    linkedRef.current = true;
    api.put(`/stores/${store.id}/catalog/${item.id}`, { service_id: Number(serviceId) })
      .then(async () => {
        toast.success('Service added and linked to this design.');
        await reloadItem();
      })
      .catch(() => toast.error('The service was added, but linking it failed — pick it in Specification.'))
      .finally(() => window.history.replaceState(null, '', window.location.pathname));
  }, [store?.id, item, reloadItem, toast]);
  const { guard, pending, clearPending } = useUnsavedChangesGuard(edit.isDirty);

  useEffect(() => {
    let isMounted = true;
    if (!store?.id || !id) return;

    api.get(`/stores/${store.id}/catalog/${id}`)
      .then(res => {
        if (isMounted) {
          setItem(res.data.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to load catalog item', err);
          toast.error('Failed to load catalog item details.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [store?.id, id, toast]);

  const handleToggleStatus = async () => {
    if (!store || !item) return;
    setTogglingStatus(true);
    const nextStatus = !item.is_active;
    try {
      await api.put(`/stores/${store.id}/catalog/${item.id}`, {
        is_active: nextStatus,
      });
      setItem(prev => prev ? { ...prev, is_active: nextStatus } : null);
      toast.success(nextStatus ? 'Design published & visible.' : 'Design paused.');
    } catch {
      toast.error('Failed to update design status.');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!store || !item) return;
    setIsDeleting(true);
    try {
      await api.delete(`/stores/${store.id}/catalog/${item.id}`);
      toast.success('Catalog item deleted successfully.');
      router.push('/dashboard/catalog');
    } catch {
      toast.error('Failed to delete catalog item.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-ink-muted">
        <Loader2 className="w-9 h-9 animate-spin text-taupe mb-3" />
        <span className="text-sm font-semibold">Loading design details...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white border border-line rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <AlertCircle size={44} className="text-ink-muted mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink">Design Not Found</h2>
        <p className="text-xs text-ink-muted mt-1 mb-6">
          This catalog item may have been removed or does not belong to your shop.
        </p>
        <Link
          href="/dashboard/catalog"
          className="px-5 py-2.5 bg-espresso text-white text-xs font-bold rounded-xl hover:bg-taupe transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    // Cancels the dashboard shell's padding so the photo can run edge to edge on phones (like the customer's page);
    // every other block keeps the shell's side margin (--dash-gutter), so it lines up with the header.
    <div className="-my-4 -mx-[var(--dash-gutter)] animate-in fade-in duration-300 text-ink">
    <div className="w-full max-w-7xl px-0 min-[600px]:px-[var(--dash-gutter)] py-0 min-[600px]:py-4 pb-24 min-[600px]:pb-10 space-y-4">
      <div className={`${PAD} pt-3 min-[600px]:pt-0`}>
      <CatalogItemHeader
        item={item}
        togglingStatus={togglingStatus}
        // Pausing hides the design from customers, so confirm it first; turning it back on is safe.
        onToggleStatus={() => (item.is_active === false ? handleToggleStatus() : setIsPauseModalOpen(true))}
        onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
        onBack={() => guard(() => router.push('/dashboard/catalog'))}
        showActions={canManage}
      />
      {item.apparel_review && <div className="mt-3"><ApparelReviewNotice review={item.apparel_review} /></div>}
      </div>

      {/* Photos and description only: no Orders / Reviews tabs. */}
      <CatalogOverviewTab item={item} edit={edit} />
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
      <CatalogDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isDeleting}
      />
      <PauseDesignModal
        open={isPauseModalOpen}
        designName={item.name}
        pausing={togglingStatus}
        onCancel={() => setIsPauseModalOpen(false)}
        onConfirm={async () => {
          await handleToggleStatus();
          setIsPauseModalOpen(false);
        }}
      />
    </div>
    </div>
  );
}

/** Opening / editing a design is a Pro feature (the server refuses edits too). */
export default function CatalogItemDetailPageGated(props: React.ComponentProps<typeof CatalogItemDetailPage>) {
  return <SubscriptionGate feature="catalog"><CatalogItemDetailPage {...props} /></SubscriptionGate>;
}
