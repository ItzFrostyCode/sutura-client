'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';
import { DetailedCatalogItem, OtherCatalogOption, ConnectedOrder } from '@/components/catalog/detail/detailTypes';
import CatalogItemHeader from '@/components/catalog/detail/CatalogItemHeader';
import CatalogKPIBand from '@/components/catalog/detail/CatalogKPIBand';
import CatalogDetailTabsNav, { CatalogDetailTab } from '@/components/catalog/detail/CatalogDetailTabsNav';
import CatalogOverviewTab from '@/components/catalog/detail/CatalogOverviewTab';
import CatalogOrdersTab from '@/components/catalog/detail/CatalogOrdersTab';
import CatalogReviewsTab from '@/components/catalog/detail/CatalogReviewsTab';
import CatalogRecommendationsTab from '@/components/catalog/detail/CatalogRecommendationsTab';
import LinkRecommendationsModal from '@/components/catalog/detail/LinkRecommendationsModal';

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
  const [activeTab, setActiveTab] = useState<CatalogDetailTab>('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Recommendations management modal state
  const [isAddRecModalOpen, setIsAddRecModalOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<OtherCatalogOption[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [recSearch, setRecSearch] = useState('');
  const [selectedRecItemIds, setSelectedRecItemIds] = useState<number[]>([]);
  const [selectedRecType, setSelectedRecType] = useState('similar');
  const [savingRec, setSavingRec] = useState(false);

  const reloadItem = useCallback(async () => {
    if (!store || !id) return;
    try {
      const res = await api.get(`/stores/${store.id}/catalog/${id}`);
      setItem(res.data.data);
    } catch (err) {
      console.error('Failed to reload catalog item', err);
    }
  }, [store, id]);

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

  const openAddRecModal = async () => {
    setIsAddRecModalOpen(true);
    setSelectedRecItemIds([]);
    setRecSearch('');
    if (!store) return;
    setLoadingAvailable(true);
    try {
      const res = await api.get(`/stores/${store.id}/catalog`);
      const all: OtherCatalogOption[] = res.data.data || [];
      const others = all.filter(i => i.id !== Number(id));
      setAvailableItems(others);
    } catch {
      toast.error('Failed to load catalog items for recommendations.');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const toggleRecSelection = (recId: number) => {
    setSelectedRecItemIds(prev =>
      prev.includes(recId) ? prev.filter(i => i !== recId) : [...prev, recId]
    );
  };

  const handleSaveRecommendations = async () => {
    if (!store || !item || selectedRecItemIds.length === 0) return;
    setSavingRec(true);

    const currentRecs = (item.recommendations || []).map(r => ({
      id: r.recommended_item?.id || r.recommended_item_id,
      type: r.recommendation_type || 'similar',
    })).filter(r => r.id);

    const newEntries = selectedRecItemIds
      .filter(recId => !currentRecs.some(r => Number(r.id) === recId))
      .map(recId => ({ id: recId, type: selectedRecType }));

    if (newEntries.length === 0) {
      toast.error('Selected design(s) are already linked.');
      setSavingRec(false);
      return;
    }

    const updatedRecs = [...currentRecs, ...newEntries];

    try {
      await api.put(`/stores/${store.id}/catalog/${item.id}`, {
        recommendations: updatedRecs,
      });
      toast.success(`${newEntries.length} related design(s) linked successfully.`);
      setIsAddRecModalOpen(false);
      await reloadItem();
    } catch {
      toast.error('Failed to save recommendations.');
    } finally {
      setSavingRec(false);
    }
  };

  const handleRemoveRecommendation = async (recItemId: number) => {
    if (!store || !item) return;
    const currentRecs = (item.recommendations || []).map(r => ({
      id: r.recommended_item?.id || r.recommended_item_id,
      type: r.recommendation_type || 'similar',
    })).filter(r => r.id && Number(r.id) !== recItemId);

    try {
      await api.put(`/stores/${store.id}/catalog/${item.id}`, {
        recommendations: currentRecs,
      });
      toast.success('Related design unlinked.');
      await reloadItem();
    } catch {
      toast.error('Failed to unlink recommendation.');
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
          This catalog item may have been removed or does not belong to your store.
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

  const allOrders: ConnectedOrder[] = [
    ...(item.catalog_orders || []).map(o => ({ ...o, type: 'Walk-in Order' })),
    ...(item.job_orders || []).map(o => ({ ...o, type: 'Custom Job Order' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const reviews = item.reviews || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-ink pb-12">
      <CatalogItemHeader
        item={item}
        storeSlug={store?.slug}
        togglingStatus={togglingStatus}
        onToggleStatus={handleToggleStatus}
        onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
      />

      <CatalogKPIBand item={item} />

      <CatalogDetailTabsNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        ordersCount={allOrders.length}
        reviewsCount={reviews.length}
        recommendationsCount={(item.recommendations || []).length}
      />

      {activeTab === 'overview' && (
        <CatalogOverviewTab
          item={item}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndex}
        />
      )}

      {activeTab === 'orders' && (
        <CatalogOrdersTab allOrders={allOrders} />
      )}

      {activeTab === 'reviews' && (
        <CatalogReviewsTab
          reviews={reviews}
          reviewsAvgRating={item.reviews_avg_rating}
        />
      )}

      {activeTab === 'recommendations' && (
        <CatalogRecommendationsTab
          recommendations={item.recommendations}
          onOpenAddRecModal={openAddRecModal}
          onRemoveRecommendation={handleRemoveRecommendation}
        />
      )}

      <LinkRecommendationsModal
        isOpen={isAddRecModalOpen}
        onClose={() => setIsAddRecModalOpen(false)}
        availableItems={availableItems}
        loadingAvailable={loadingAvailable}
        recSearch={recSearch}
        setRecSearch={setRecSearch}
        selectedRecItemIds={selectedRecItemIds}
        toggleRecSelection={toggleRecSelection}
        setSelectedRecItemIds={setSelectedRecItemIds}
        selectedRecType={selectedRecType}
        setSelectedRecType={setSelectedRecType}
        onSaveRecommendations={handleSaveRecommendations}
        savingRec={savingRec}
      />

      <CatalogDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
