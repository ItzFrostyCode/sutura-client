'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import Modal from '@/components/Modal';
import { Ruler, Plus, Search, Loader2 } from 'lucide-react';
import { MeasurementRecord, CustomerData } from '@/components/measurements/measurementTypes';
import { emptyForm, emptyMetrics } from '@/components/measurements/measurementHelpers';
import MeasurementFormModal from '@/components/measurements/MeasurementFormModal';
import MeasurementList from '@/components/measurements/MeasurementList';
import { useToast } from '@/context/ToastContext';

function MeasurementsContent() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filterCustomer, setFilterCustomer] = useState('');
  const [selectedVersionIds, setSelectedVersionIds] = useState<Record<string, number>>({});

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm());

  // Check query params to auto-open modal for a specific customer
  useEffect(() => {
    const custId = searchParams.get('customer_id');
    if (custId && customers.length > 0) {
      const timer = setTimeout(() => {
        setForm(f => ({ ...f, customer_id: custId }));
        setEditingId(null);
        setError('');
        setIsModalOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, customers]);

  // Data Fetching
  useEffect(() => {
    if (!shop) {
      if (!user) return;
      setTimeout(() => setLoading(false), 0);
      return;
    }
    Promise.all([
      api.get(`/shops/${shop.id}/measurements`),
      api.get(`/shops/${shop.id}/customers`),
    ])
      .then(([mRes, cRes]) => {
        setRecords(mRes.data.data);
        setCustomers(cRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [shop, user]);

  // CRUD
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    
    // Strip empty metric keys
    const cleanMetrics: Record<string, string> = {};
    for (const [k, v] of Object.entries(form.metrics)) {
      if (v && v.trim() !== '') cleanMetrics[k] = v.trim();
    }
    const payload = {
      customer_id: form.customer_id,
      source: form.source,
      profile_name: form.profile_name,
      metrics: cleanMetrics,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        // Saving an edit no longer overwrites the record in place — the
        // backend closes out the current version and returns a brand-new
        // one, so it has to be added alongside the old row (not replace it),
        // or the version history this page already knows how to display
        // would never actually accumulate.
        const res = await api.put(`/shops/${shop.id}/measurements/${editingId}`, payload);
        setRecords(prev => [
          res.data.data,
          ...prev.map(r => (r.id === editingId ? { ...r, superseded_at: new Date().toISOString() } : r)),
        ]);
      } else {
        const res = await api.post(`/shops/${shop.id}/measurements`, payload);
        setRecords(prev => [res.data.data, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { message?: string } } };
      setError(ex.response?.data?.message || 'Failed to save measurement profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/measurements/${deletingId}`);
      setRecords(prev => prev.filter(r => r.id !== deletingId));
      setIsDeleteOpen(false);
      setDeletingId(null);
    } catch {
      toast.error('Failed to delete measurement profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI Helpers
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (rec: MeasurementRecord) => {
    setEditingId(rec.id);
    setForm({
      customer_id: rec.customer_id.toString(),
      source: rec.source ?? 'shop_owner',
      profile_name: rec.profile_name,
      metrics: { ...emptyMetrics(), ...rec.metrics },
      notes: rec.notes || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openClone = (rec: MeasurementRecord) => {
    setEditingId(null);
    setForm({
      customer_id: rec.customer_id.toString(),
      source: rec.source ?? 'shop_owner',
      profile_name: rec.profile_name,
      metrics: { ...emptyMetrics(), ...rec.metrics },
      notes: rec.notes || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setError('');
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtering
  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.profile_name.toLowerCase().includes(q) ||
      r.customer?.name.toLowerCase().includes(q);
    const matchCustomer =
      !filterCustomer || r.customer_id.toString() === filterCustomer;
    return matchSearch && matchCustomer;
  });

  // Group by customer
  const grouped = filtered.reduce((acc, r) => {
    const key = r.customer?.name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, MeasurementRecord[]>);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight flex items-center gap-2">
            <Ruler size={22} className="text-[#9A8073]" />
            All Measurements
          </h1>
          <p className="text-[#827A73] text-sm mt-1">
            Search measurement profiles across every customer. To add a new profile, open a customer&apos;s own
            page and use their Measurements tab — it&apos;s faster since the customer is already selected.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          New Profile
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
          <input
            type="text"
            placeholder="Search profiles or customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 w-64 shadow-sm"
          />
        </div>
        <select
          value={filterCustomer}
          onChange={e => setFilterCustomer(e.target.value)}
          className="px-3 py-2 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#524A44] focus:outline-none focus:border-[#9A8073] shadow-sm cursor-pointer"
        >
          <option value="">All Customers</option>
          {customers.map(c => (
            <option key={c.id} value={c.id.toString()}>{c.name}</option>
          ))}
        </select>
        <div className="ml-auto text-sm text-[#A8A19A] font-medium">
          {filtered.length} profile{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Content */}
      {(() => {
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[#9A8073] animate-spin" />
              <p className="text-[#A8A19A] text-sm">Loading measurement profiles...</p>
            </div>
          );
        }
        if (filtered.length === 0) {
          return (
            <div className="bg-white border border-[#EBE6E0] rounded-2xl p-12 text-center shadow-sm">
              <div className="w-14 h-14 bg-[#F0EAE3] rounded-full flex items-center justify-center mx-auto mb-4">
                <Ruler size={26} className="text-[#9A8073]" />
              </div>
              <h3 className="text-[#2D2A26] font-semibold mb-1">No measurement profiles yet</h3>
              <p className="text-[#A8A19A] text-sm mb-5">
                Create reusable measurement profiles for your customers to speed up job order creation.
              </p>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 bg-[#9A8073] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#9A8073]/90 transition-colors cursor-pointer"
              >
                <Plus size={16} /> Create First Profile
              </button>
            </div>
          );
        }
        return (
          <MeasurementList
            grouped={grouped}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            selectedVersionIds={selectedVersionIds}
            setSelectedVersionIds={setSelectedVersionIds}
            openClone={openClone}
            openEdit={openEdit}
            openDelete={(id) => { setDeletingId(id); setIsDeleteOpen(true); }}
          />
        );
      })()}

      {/* Form Modal */}
      <MeasurementFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingId={editingId}
        form={form}
        setForm={setForm}
        customers={customers}
        error={error}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Measurement Profile">
        <div className="space-y-4">
          <p className="text-sm text-[#524A44]">
            Are you sure you want to delete this measurement profile? This action cannot be undone.
            Existing job orders that reference this profile will not be affected.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function MeasurementsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading measurements...</div>}>
      <MeasurementsContent />
    </Suspense>
  );
}
