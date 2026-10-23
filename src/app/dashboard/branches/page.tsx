'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { Lock, Plus, Map as MapIcon, LayoutGrid } from 'lucide-react';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { StoreBranch, EMPTY_FORM } from '@/components/branches/branchHelpers';
import BranchFormModal from '@/components/branches/BranchFormModal';
import BranchDeleteModal from '@/components/branches/BranchDeleteModal';
import BranchListView from '@/components/branches/BranchListView';
import { useToast } from '@/context/ToastContext';
import { useBranch } from '@/context/BranchContext';
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
  const router = useRouter();
  const { store, user, staffProfile } = useAuthStore();
  const { refreshBranches } = useBranch();
  const toast = useToast();
  const isStoreOwner = user?.roles?.[0]?.name === 'store_owner';
  // A branch manager may only edit their OWN branch — matches
  // StoreBranchController::branchManagerCrudDenied() on the backend.
  // Adding/deleting a branch or designating the main one stay owner-only.
  const myBranchId = staffProfile?.store_branch_id ?? null;
  const [branches, setBranches] = useState<StoreBranch[]>([]);
  const [loading, setLoading] = useState(true);
  // Same rule as StoreBranchController::store(): the plan's branch limit,
  // set on the admin Plans page (-1 = unlimited). Lock the add buttons up
  // front instead of letting the owner fill in the whole form to hit a 403.
  const { maxBranches, loading: tierLoading } = useSubscriptionTier();
  const addLocked = isStoreOwner && !tierLoading && maxBranches !== -1 && branches.length >= maxBranches;
  const limitText = `Your plan allows ${maxBranches === 1 ? '1 branch' : `up to ${maxBranches} branches`}`;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  const fetchBranches = useCallback(() => {
    if (store?.id) {
      api
        .get(`/stores/${store.id}/branches`)
        .then(res => {
          setBranches(Array.isArray(res.data?.data) ? res.data.data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id && !store?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [store, user]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const openAddModal = () => {
    router.push('/dashboard/branches/new');
  };

  const handleEditClickGated = (branch: StoreBranch) => {
    if (!isStoreOwner && branch.id !== myBranchId) {
      toast.error('You can only edit your own branch.');
      return;
    }
    handleEditClick(branch);
  };

  const handleEditClick = (branch: StoreBranch) => {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      address: branch.address,
      landmark: branch.landmark || '',
      barangay: branch.barangay || '',
      city: branch.city,
      district: branch.district || '',
      contact_number: branch.contact_number || '',
      latitude: branch.latitude || '',
      longitude: branch.longitude || '',
      operating_hours: branch.operating_hours || '',
      status: branch.status || 'active',
      guide_image_url: branch.guide_image_url || '',
      manager_current: branch.manager?.user?.name ? `${branch.manager.user.name} (${branch.manager.user.email})` : '',
      manager_mode: 'none',
      manager_staff_id: '',
      manager_name: '',
      manager_email: '',
      manager_phone: '',
      manager_password: '',
      manager_password_confirmation: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!store) return;

    // The pin is what puts a branch on the map and in "near me" — it cannot be left out.
    if (!Number.isFinite(Number.parseFloat(formData.latitude)) || !Number.isFinite(Number.parseFloat(formData.longitude))) {
      setErrorMsg('Set the branch location first: paste its Google Maps link or pick the spot on the map.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // The manager's login is sent only when the owner filled it in (edit mode).
    const {
      manager_current: _current, manager_mode: _mode, manager_staff_id: _sid,
      manager_name, manager_email, manager_phone, manager_password, manager_password_confirmation: _confirm,
      ...branchFields
    } = formData;
    const payload = manager_name && manager_email && manager_password
      ? { ...branchFields, manager: { name: manager_name, email: manager_email, phone: manager_phone || undefined, password: manager_password } }
      : branchFields;

    try {
      if (editingId) {
        const res = await api.put(`/stores/${store.id}/branches/${editingId}`, payload);
        const updated = res.data?.data;
        if (updated) {
          setBranches(prev => prev.map(b => (b.id === editingId ? { ...b, ...updated } : b)));
        }
        toast.success('Branch details updated successfully.');
      } else {
        const res = await api.post(`/stores/${store.id}/branches`, payload);
        const created = res.data?.data;
        if (created) {
          setBranches(prev => [...prev, created]);
        }
        toast.success('New branch registered successfully.');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      fetchBranches();
      refreshBranches();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to save branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetMain = async (branch: StoreBranch) => {
    if (!store) return;
    try {
      const res = await api.put(`/stores/${store.id}/branches/${branch.id}/set-main`);
      if (res.data?.success) {
        toast.success(`${branch.name} is now the main branch.`);
        fetchBranches();
        refreshBranches();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to designate as main branch.');
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!store || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/stores/${store.id}/branches/${deletingId}`);
      setBranches(prev => prev.filter(b => b.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      toast.success('Branch removed from network.');
      refreshBranches();
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
            <div className="h-7 bg-line rounded-lg w-36 mb-2"></div>
            <div className="h-4 bg-line rounded w-72 max-w-full"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 bg-line rounded-xl w-28"></div>
            <div className="h-9 bg-line rounded-xl w-28"></div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={`card-skel-${i}`} className="h-56 bg-surface border border-line rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-sunken rounded-xl"></div>
                  <div className="space-y-1.5">
                    <div className="h-4 bg-line rounded w-32"></div>
                    <div className="h-3 bg-line rounded w-20"></div>
                  </div>
                </div>
                <div className="w-14 h-5 bg-sunken rounded-full"></div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3.5 bg-line rounded w-full"></div>
                <div className="h-3.5 bg-line rounded w-2/3"></div>
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
        title="Branches"
        description="Manage your shop locations and customer visit spots."
        actions={
          <>
            <div className="flex items-center bg-sunken rounded-xl p-1 border border-line/60">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <LayoutGrid size={14} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-surface text-ink shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <MapIcon size={14} /> Map
              </button>
            </div>
            {isStoreOwner && (addLocked ? (
              <Link
                href="/dashboard/billing"
                title={`${limitText}. Upgrade to add more.`}
                className="flex items-center gap-1.5 border border-line bg-surface hover:bg-sunken text-ink px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-colors min-h-[38px]"
              >
                <Lock size={15} />
                Upgrade plan for more branches
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/dashboard/branches/new')}
                className="flex items-center gap-1.5 bg-espresso hover:bg-espresso/90 text-white px-3.5 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow-2xs transition-colors min-h-[38px]"
              >
                <Plus size={16} />
                Add Location
              </button>
            ))}
          </>
        }
      />

      {viewMode === 'map' ? (
        <BranchesMap branches={branches} />
      ) : (
        <BranchListView
          branches={branches}
          onAddClick={isStoreOwner ? openAddModal : undefined}
          addLocked={addLocked}
          lockedText={`${limitText}.`}
          onEdit={handleEditClickGated}
          onDelete={isStoreOwner ? handleDeleteClick : undefined}
          onSetMain={isStoreOwner ? handleSetMain : undefined}
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
        storeId={store?.id}
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
