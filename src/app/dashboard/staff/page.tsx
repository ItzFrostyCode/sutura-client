'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Plus } from 'lucide-react';
import SubscriptionGate from '@/components/SubscriptionGate';
import { Staff } from '@/components/staff/staffHelpers';
import StaffFormModal from '@/components/staff/StaffFormModal';
import StaffDeleteModal from '@/components/staff/StaffDeleteModal';
import StaffListView from '@/components/staff/StaffListView';

export default function StaffPage() {
  const { shop, user } = useAuthStore();
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
    shop_branch_id: '',
    is_branch_manager: false,
    bio: '',
    is_available: true,
  });

  const fetchStaff = useCallback(() => {
    if (shop?.id) {
      api
        .get(`/shops/${shop.id}/staff`)
        .then(res => {
          setStaff(res.data.data);
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

  // Initial load + live refresh every 30 s so statuses stay current
  useEffect(() => {
    fetchStaff();
    const interval = setInterval(fetchStaff, 30_000);
    return () => clearInterval(interval);
  }, [fetchStaff]);

  const handleAddStaff = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop) return;
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
        shop_branch_id: number | null;
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
        shop_branch_id: formData.shop_branch_id ? Number.parseInt(formData.shop_branch_id, 10) : null,
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
        await api.put(`/shops/${shop.id}/staff/${editingId}`, payload);
      } else {
        await api.post(`/shops/${shop.id}/staff`, payload);
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
        shop_branch_id: '',
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
      shop_branch_id: member.shop_branch_id ? String(member.shop_branch_id) : '',
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
    if (!shop || !deletingId) return;
    setSaving(true);
    try {
      await api.delete(`/shops/${shop.id}/staff/${deletingId}`);
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

  // Previously scoped by the dashboard header's global branch selector —
  // removed per user request in favor of StaffListView's own explicit
  // Branch filter (see its filter bar), so there's exactly one place on
  // this page that filters by branch instead of two. The header selector
  // itself is now hidden on /dashboard/staff routes (see dashboard/layout.tsx).
  const visibleStaff = staff;

  const activeStaff = visibleStaff.filter(s => s.is_active);
  const totalActiveJobs = visibleStaff.reduce((sum, s) => sum + (s.active_jobs || 0), 0);
  const avgJobs = activeStaff.length > 0 ? (totalActiveJobs / activeStaff.length).toFixed(1) : '0';
  const overloadedStaffCount = visibleStaff.filter(s => (s.active_jobs || 0) >= 5).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Staff Management</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your tailors, cutters, and front desk team.</p>
        </div>
        <button
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
              shop_branch_id: '',
              is_branch_manager: false,
              bio: '',
              is_available: true,
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Workload Summary Cards */}
      <SubscriptionGate feature="staff">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[#EBE6E0]">
            <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-1">
              Active Tailors / Cutters
            </p>
            <p className="text-2xl font-bold text-[#2D2A26]">
              {activeStaff.length}{' '}
              <span className="text-xs font-normal text-[#A8A19A]">/ {visibleStaff.length} total</span>
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[#EBE6E0]">
            <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-1">
              Total Active Jobs Assigned
            </p>
            <p className="text-2xl font-bold text-[#2D2A26]">{totalActiveJobs}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white shadow-xs border border-[#EBE6E0]">
            <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-1">
              Avg Workload per Staff
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-[#2D2A26]">{avgJobs} jobs</p>
              {overloadedStaffCount > 0 && (
                <span className="text-[10px] font-bold text-[#B26959] bg-[#B26959]/10 px-2 py-0.5 rounded border border-[#B26959]/20">
                  {overloadedStaffCount} Overloaded
                </span>
              )}
            </div>
          </div>
        </div>

        <StaffListView
          staff={visibleStaff}
          loading={loading}
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
