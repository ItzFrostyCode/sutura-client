'use client';

import React, { useState } from 'react';
import api from '@/lib/axios';
import { Plus, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { MeasurementProfile } from './customerTypes';
import { MeasurementRecord } from '@/components/measurements/measurementTypes';
import MeasurementFormModal from '@/components/measurements/MeasurementFormModal';
import MeasurementList from '@/components/measurements/MeasurementList';
import { emptyForm } from '@/components/measurements/measurementHelpers';

interface CustomerMeasurementsTabProps {
  readonly customerId: number;
  readonly customerName: string;
  readonly shopId: number;
  readonly measurements: MeasurementProfile[];
  readonly onReload: () => Promise<void>;
}

// This tab used to run its own separate "Custom Specs" form alongside the
// shared MeasurementFormModal ("Body Measurements") — two different flows
// for what's now one unified, flexible-field system. Consolidated onto the
// same components the main Measurements page uses so both stay in sync
// (same edit-a-past-version guard, same Preview step, same versioning).
export default function CustomerMeasurementsTab({
  customerId,
  customerName,
  shopId,
  measurements,
  onReload,
}: CustomerMeasurementsTabProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedVersionIds, setSelectedVersionIds] = useState<Record<string, number>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), customer_id: customerId.toString() });
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (rec: MeasurementRecord) => {
    setEditingId(rec.id);
    setForm({
      customer_id: customerId.toString(),
      source: rec.source ?? 'shop_owner',
      profile_name: rec.profile_name,
      metrics: rec.metrics,
      notes: rec.notes || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openClone = (rec: MeasurementRecord) => {
    setEditingId(null);
    setForm({
      customer_id: customerId.toString(),
      source: rec.source ?? 'shop_owner',
      profile_name: rec.profile_name,
      metrics: rec.metrics,
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

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

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
        await api.put(`/shops/${shopId}/measurements/${editingId}`, payload);
      } else {
        await api.post(`/shops/${shopId}/measurements`, payload);
      }
      await onReload();
      closeModal();
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { message?: string } } };
      setError(ex.response?.data?.message || 'Failed to save measurement profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shopId}/measurements/${deletingId}`);
      await onReload();
      setIsDeleteOpen(false);
      setDeletingId(null);
    } catch {
      setError('Failed to delete measurement profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const grouped = { [customerName]: measurements as unknown as MeasurementRecord[] };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-ink">Measurement Profiles</h2>
          <p className="text-xs text-ink-muted mt-0.5">Store different versions of body dimensions for this client — all values in inches (″).</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white px-3.5 py-2 rounded-lg font-medium text-xs transition-colors cursor-pointer"
        >
          <Plus size={14} /> New Profile
        </button>
      </div>

      {measurements.length === 0 ? (
        <div className="bg-canvas/50 border border-line border-dashed rounded-xl p-12 text-center text-sm text-ink-faint">
          No measurements recorded for this client yet.
        </div>
      ) : (
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
      )}

      <MeasurementFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        editingId={editingId}
        form={form}
        setForm={setForm}
        customers={[{ id: customerId, name: customerName }]}
        error={error}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Measurement Profile">
        <div className="space-y-4">
          <p className="text-sm text-ink-body">
            Are you sure you want to delete this measurement profile? This action cannot be undone.
            Existing job orders that reference this profile will not be affected.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
