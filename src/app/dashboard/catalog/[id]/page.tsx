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

// Same side padding the customer page gives its content blocks on phones
// (the hero photo alone runs edge-to-edge).
const PAD = 'px-4 min-[375px]:px-6 min-[600px]:px-0';

export default function CatalogItemDetailPage({
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
          className="px-5 py-2.5 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-[#8A7063] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    // -m-4 cancels the dashboard shell's own p-4, then the page takes the exact
    // container the customer's Catalog Design Detail uses at each width:
    // edge-to-edge on phones (content px-4 → px-6 from 375px), 10px at 600px,
    // 32px from md, capped at max-w-7xl.
    <div className="-m-4 animate-in fade-in duration-300 text-ink">
    <div className="w-full max-w-7xl mx-auto px-0 min-[600px]:px-[10px] md:px-8 py-0 min-[600px]:py-[10px] md:py-6 pb-24 min-[600px]:pb-10 space-y-4">
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
