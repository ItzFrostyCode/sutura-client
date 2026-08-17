'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Map as MapIcon, LayoutGrid } from 'lucide-react';
import { ShopBranch, EMPTY_FORM } from '@/components/branches/branchHelpers';
import BranchFormModal from '@/components/branches/BranchFormModal';
import BranchDeleteModal from '@/components/branches/BranchDeleteModal';
import BranchListView from '@/components/branches/BranchListView';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';

// Leaflet touches `window`, so load the map client-only.
const BranchesMap = dynamic(() => import('@/components/branches/BranchesMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
      Loading map…
    </div>
  ),
});

export default function BranchesPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [branches, setBranches] = useState<ShopBranch[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  const fetchBranches = useCallback(() => {
    if (shop?.id) {
      api
        .get(`/shops/${shop.id}/branches`)
        .then(res => {
          setBranches(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id && !shop?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleEditClick = (branch: ShopBranch) => {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      address: branch.address,
      landmark: branch.landmark || '',
      city: branch.city,
      contact_number: branch.contact_number || '',
      latitude: branch.latitude || '',
      longitude: branch.longitude || '',
      operating_hours: branch.operating_hours || '',
      status: branch.status || 'active',
      guide_image_url: branch.guide_image_url || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/branches/${editingId}`, formData);
        const updated = res.data.data;
        setBranches(prev => prev.map(b => (b.id === editingId ? { ...b, ...updated } : b)));
      } else {
        const res = await api.post(`/shops/${shop.id}/branches`, formData);
        const created = res.data.data;
        setBranches(prev => [...prev, created]);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to save branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/branches/${deletingId}`);
      setBranches(prev => prev.filter(b => b.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 bg-line rounded w-48 mb-2"></div>
            <div className="h-4 bg-line rounded w-96 max-w-full"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-line rounded w-32"></div>
            <div className="h-9 bg-line rounded w-32"></div>
          </div>
        </div>
        
        {/* Summary Bar Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={`summary-skel-${i}`} className="bg-surface border border-line rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-sunken rounded-lg"></div>
              <div className="space-y-1">
                <div className="h-5 bg-line rounded w-8"></div>
                <div className="h-3 bg-line rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={`card-skel-${i}`} className="h-48 bg-surface border border-line rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-5 bg-line rounded w-32"></div>
                  <div className="h-4 bg-line rounded w-48"></div>
                </div>
                <div className="w-8 h-8 bg-sunken rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-line rounded w-full"></div>
                <div className="h-4 bg-line rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Locations"
        title="Shop Branches"
        description="Manage every physical location of your shop. Each branch appears on the customer discovery map."
        actions={
          <>
            <div className="flex items-center bg-sunken rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[38px] ${viewMode === 'cards' ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink'}`}
              >
                <LayoutGrid size={15} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[38px] ${viewMode === 'map' ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink'}`}
              >
                <MapIcon size={15} /> Map
              </button>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
            >
              <Plus size={17} />
              Add Branch
            </button>
          </>
        }
      />

      {viewMode === 'map' ? (
        <BranchesMap branches={branches} />
      ) : (
        <BranchListView
          branches={branches}
          onAddClick={openAddModal}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Add / Edit Modal */}
      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingId={editingId}
        isSubmitting={isSubmitting}
        errorMsg={errorMsg}
        shopId={shop?.id}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Delete Modal */}
      <BranchDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
