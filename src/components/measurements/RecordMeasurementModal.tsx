'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import MeasurementFormModal from './MeasurementFormModal';
import { emptyForm } from './measurementHelpers';

interface RecordMeasurementModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly storeId: number;
  readonly customer: { id: number; name: string };
  /** When set, the new measurements are attached to this order right after saving. */
  readonly jobOrderId?: number | null;
  readonly defaultProfileName?: string;
  readonly onSaved: () => void;
}

/**
 * The shop's measurement form for one customer, opened from an order or a
 * measurement visit. Saves a new profile to the customer and, when an order is
 * given, attaches it to that order in the same step, so the order shows the
 * numbers (and drops its "Needs measuring" tag) without a second trip.
 */
export default function RecordMeasurementModal({
  isOpen, onClose, storeId, customer, jobOrderId, defaultProfileName = 'Body measurements', onSaved,
}: RecordMeasurementModalProps) {
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({ ...emptyForm(), customer_id: customer.id.toString(), profile_name: defaultProfileName });
    setError('');
  }, [isOpen, customer.id, defaultProfileName]);

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const metrics = Object.fromEntries(
      Object.entries(form.metrics)
        .map(([k, v]) => [k, (v ?? '').trim()] as const)
        .filter(([, v]) => v !== ''),
    );
    let savedId: number | null = null;
    try {
      const res = await api.post(`/stores/${storeId}/measurements`, {
        customer_id: form.customer_id,
        source: form.source,
        profile_name: form.profile_name,
        metrics,
        photo_urls: form.photo_urls,
        status: form.status,
        notes: form.notes || null,
      });
      savedId = res.data?.data?.id ?? null;
      if (jobOrderId && savedId) {
        await api.put(`/stores/${storeId}/jobs/${jobOrderId}`, { measurement_id: savedId });
      }
      onSaved();
      onClose();
    } catch (err) {
      // Saved to the customer but not attached: say so, so staff can attach it from the order.
      setError(savedId
        ? `Measurements were saved to ${customer.name}'s profile, but couldn't be attached to the order: ${getErrorMessage(err, 'try "Attach saved measurements" on the order.')}`
        : getErrorMessage(err, "The measurements didn't save. Check the fields and try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MeasurementFormModal
      isOpen={isOpen}
      onClose={onClose}
      editingId={null}
      form={form}
      setForm={setForm}
      customers={[customer]}
      error={error}
      isSubmitting={saving}
      onSubmit={submit}
    />
  );
}
