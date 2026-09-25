'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import { Plus } from 'lucide-react';
import SubscriptionGate from '@/components/SubscriptionGate';
import { Staff } from '@/components/staff/staffHelpers';
import StaffFormModal from '@/components/staff/StaffFormModal';
import StaffDeleteModal from '@/components/staff/StaffDeleteModal';
import StaffListView from '@/components/staff/StaffListView';

export default function StaffPage() {
  const { store, user } = useAuthStore();
  const toast = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'tailor',
    additional_roles: [] as string[],
    specialization: '',
    hired_at: new Date().toISOString().split('T')[0],
    is_active: true,
    store_branch_id: '',
    is_branch_manager: false,
    bio: '',
    is_available: true,
  });

  const fetchStaff = useCallback(() => {
    if (store?.id) {
      api
        .get(`/stores/${store.id}/staff`)
        .then(res => {
          const rawStaff = Array.isArray(res.data?.data)
            ? res.data.data
            : (Array.isArray(res.data) ? res.data : []);
          setStaff(rawStaff);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch staff:', err);
          setStaff([]);
          setLoading(false);
        });
    } else if (user?.id && !store?.id) {
      setStaff([]);
      setTimeout(() => setLoading(false), 0);
    }
  }, [store, user]);

  // Initial load + live refresh every 30 s so statuses stay current
  useEffect(() => {
    fetchStaff();
    const interval = setInterval(fetchStaff, 30_000);
    return () => clearInterval(interval);
  }, [fetchStaff]);

  const handleAddStaff = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);

    try {
      const payload: {
        name: string;
        email: string;
        phone: string;
        role: string;
        additional_roles: string[];
        specialization: string[];
        hired_at: string;
        password?: string;
        is_active?: boolean;
        is_available?: boolean;
        store_branch_id: number | null;
        is_branch_manager: boolean;
        bio: string;
      } = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        // Sent even when empty so clearing all secondary roles on an existing
        // profile actually takes — the backend uses request->only(), which
        // only touches keys present in the payload.
        additional_roles: formData.additional_roles.filter(r => r && r !== formData.role),
        specialization: formData.specialization
          ? formData.specialization.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        hired_at: formData.hired_at,
        store_branch_id: formData.store_branch_id ? Number.parseInt(formData.store_branch_id, 10) : null,
        is_branch_manager: formData.is_branch_manager,
        bio: formData.bio,
      };

      // Only send is_active/is_available on edit (new staff are always active + available)
      if (editingId) {
        payload.is_active = formData.is_active;
        payload.is_available = formData.is_available;
      }

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await api.put(`/stores/${store.id}/staff/${editingId}`, payload);
      } else {
        await api.post(`/stores/${store.id}/staff`, payload);
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'tailor',
        additional_roles: [],
        specialization: '',
        hired_at: new Date().toISOString().split('T')[0],
        is_active: true,
        store_branch_id: '',
        is_branch_manager: false,
        bio: '',
        is_available: true,
      });
      fetchStaff();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (member: Staff) => {
    setEditingId(member.id);
    setFormData({
      name: member.user?.name || '',
      email: member.user?.email || '',
      password: '',
      phone: member.user?.phone || '',
      role: member.role || 'tailor',
      additional_roles: member.additional_roles || [],
      specialization: Array.isArray(member.specialization)
        ? member.specialization.join(', ') 
        : (member.specialization || ''),
      hired_at: member.hired_at || new Date().toISOString().split('T')[0],
      is_active: member.is_active,
      store_branch_id: member.store_branch_id ? String(member.store_branch_id) : '',
      is_branch_manager: member.is_branch_manager || false,
      bio: member.bio || '',
      is_available: member.is_available !== false,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!store || !deletingId) return;
    setSaving(true);
    try {
      await api.delete(`/stores/${store.id}/staff/${deletingId}`);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchStaff();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to remove staff');
    } finally {
      setSaving(false);
    }
  };

  const roleNames = user?.roles?.map(r => r.name) || [];
  const isStoreOwner = roleNames.includes('store_owner');
  const isBranchManager = roleNames.includes('branch_manager') || (user as { staff_profile?: { is_branch_manager?: boolean } })?.staff_profile?.is_branch_manager;
  const canManageStaff = isStoreOwner || isBranchManager;

  const visibleStaff = Array.isArray(staff) ? staff : [];

  const activeStaff = visibleStaff.filter(s => s.is_active);
  const totalActiveJobs = visibleStaff.reduce((sum, s) => sum + (s.active_jobs || 0), 0);
  const avgJobs = activeStaff.length > 0 ? (totalActiveJobs / activeStaff.length).toFixed(1) : '0';
  const overloadedStaffCount = visibleStaff.filter(s => (s.active_jobs || 0) >= 5).length;

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      <PageHeader
        eyebrow="Staff Directory"
        title="Staff Management"
        description="Manage your tailors, cutters, seamstresses, and branch managers."
        actions={
          canManageStaff ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  phone: '',
                  role: 'tailor',
                  additional_roles: [],
                  specialization: '',
                  hired_at: new Date().toISOString().split('T')[0],
                  is_active: true,
                  store_branch_id: '',
                  is_branch_manager: false,
                  bio: '',
                  is_available: true,
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer min-h-11"
            >
              <Plus size={16} />
              <span>Add Staff Member</span>
            </button>
          ) : null
        }
      />

      {/* Workload Summary Cards */}
      <SubscriptionGate feature="staff">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={`workload-skel-${i}`} className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-line/70 rounded w-28" />
                  <div className="h-7 bg-line rounded w-20" />
                  <div className="h-3 bg-line/50 rounded w-44" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-line/50 shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Active Staff</span>
                <div className="text-2xl font-black font-mono text-ink">
                  {activeStaff.length}{' '}
                  <span className="text-xs font-normal font-sans text-ink-muted">/ {visibleStaff.length} total staff</span>
                </div>
                <div className="text-xs text-ink-muted">Active tailoring & production team</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs">
                <Plus size={20} className="hidden" />
                <span className="font-bold text-sm text-taupe font-mono">{activeStaff.length}</span>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Total Active Jobs Assigned</span>
                <div className="text-2xl font-black font-mono text-ink">{totalActiveJobs}</div>
                <div className="text-xs text-ink-muted">Live stages currently in workroom</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="font-bold text-sm font-mono">{totalActiveJobs}</span>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Avg Workload per Staff</span>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black font-mono text-ink">{avgJobs} <span className="text-xs font-normal font-sans text-ink-muted">jobs/staff</span></div>
                  {overloadedStaffCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase tracking-wider">
                      {overloadedStaffCount} Overloaded
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-muted">Balanced workroom capacity</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="font-bold text-xs font-mono">{avgJobs}</span>
              </div>
            </div>
          </div>
        )}

        <StaffListView
          staff={visibleStaff}
          loading={loading}
          canManage={canManageStaff}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />

        {/* Add Staff Modal */}
        <StaffFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleAddStaff}
          editingId={editingId}
          saving={saving}
          formData={formData}
          setFormData={setFormData}
        />

        {/* Delete Confirmation Modal */}
        <StaffDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          saving={saving}
        />
      </SubscriptionGate>
    </div>
  );
}
