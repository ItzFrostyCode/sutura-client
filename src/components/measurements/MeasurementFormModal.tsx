'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Ruler, Loader2, Eye, Pencil } from 'lucide-react';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { CustomerData } from './measurementTypes';
import { emptyForm } from './measurementHelpers';
import SizeChartEditor, { SizeChartValue, emptySizeChart } from '@/components/shared/SizeChartEditor';

interface MeasurementFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingId: number | null;
  readonly form: ReturnType<typeof emptyForm>;
  readonly setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  readonly customers: CustomerData[];
  readonly error: string;
  readonly isSubmitting: boolean;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
}

// A brand-new profile starts with zero fields (matching Service/Catalog's
// own Size Chart builder) — only a value actually present in `metrics`
// becomes a field, so re-opening an existing profile shows exactly what was
// recorded, custom field names included.
function metricsToSizeChart(metrics: Record<string, string | undefined>): SizeChartValue {
  const columns = Object.entries(metrics)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k]) => k);
  return {
    image_url: null,
    columns,
    rows: columns.length > 0 ? [{ size: 'value', values: columns.map(c => metrics[c] ?? '') }] : [],
  };
}

function sizeChartToMetrics(sizeChart: SizeChartValue): Record<string, string> {
  const values = sizeChart.rows[0]?.values ?? [];
  return Object.fromEntries(sizeChart.columns.map((col, i) => [col, values[i] ?? '']));
}

export default function MeasurementFormModal({
  isOpen,
  onClose,
  editingId,
  form,
  setForm,
  customers,
  error,
  isSubmitting,
  onSubmit,
}: MeasurementFormModalProps) {
  const { shop } = useAuthStore();
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [sizeChart, setSizeChart] = useState<SizeChartValue>(emptySizeChart);

  // Re-derive fields from `form.metrics` whenever the modal opens for a
  // (possibly different) record — not on every keystroke, since sizeChart
  // itself is the working copy while editing.
  useEffect(() => {
    const syncFromForm = () => {
      if (!isOpen) return;
      setSizeChart(metricsToSizeChart(form.metrics));
      setView('edit');
    };
    syncFromForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  const handleSizeChartChange = (next: SizeChartValue) => {
    setSizeChart(next);
    setForm(f => ({ ...f, metrics: sizeChartToMetrics(next) }));
  };

  const selectedCustomer = customers.find(c => c.id.toString() === form.customer_id);
  const filledFields = sizeChart.columns.filter((_, i) => (sizeChart.rows[0]?.values[i] ?? '').trim() !== '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Edit Measurement Profile' : 'New Measurement Profile'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        )}

        {view === 'edit' ? (
          <>
            {/* Customer */}
            <div>
              <label htmlFor="measurement-customer" className="block text-sm font-medium text-ink-body mb-1.5">
                Customer <span className="text-danger">*</span>
              </label>
              {customers.length === 0 ? (
                <div className="bg-canvas border border-line border-dashed rounded-lg px-4 py-3 text-sm text-ink-muted">
                  No customers yet.{' '}
                  <Link href="/dashboard/customers" className="text-taupe font-semibold hover:underline">
                    Add one first
                  </Link>{' '}
                  — a measurement profile always belongs to a customer.
                </div>
              ) : (
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <select
                    id="measurement-customer"
                    required
                    value={form.customer_id}
                    onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30 appearance-none cursor-pointer"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Profile Name */}
            <div>
              <label htmlFor="measurement-profile-name" className="block text-sm font-medium text-ink-body mb-1.5">
                Profile Name <span className="text-danger">*</span>
                <span className="text-ink-faint font-normal ml-1">(e.g. &quot;Formal Suit&quot;, &quot;School Uniform&quot;)</span>
              </label>
              <input
                id="measurement-profile-name"
                required
                type="text"
                value={form.profile_name}
                onChange={e => setForm(f => ({ ...f, profile_name: e.target.value }))}
                placeholder="e.g. Wedding Barong"
                className="w-full px-4 py-2.5 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30"
              />
            </div>

            <div>
              <label htmlFor="measurement-source" className="block text-sm font-medium text-ink-body mb-1.5">Record Type</label>
              <select
                id="measurement-source"
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="w-full px-4 py-2.5 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30"
              >
                <option value="shop_owner">Shop Owner (tailor&apos;s own format)</option>
                <option value="customer">Customer-Side (encoded from the customer)</option>
              </select>
            </div>

            {/* Measurement Fields — same flexible builder used on Services & Catalog */}
            <div>
              <p className="text-sm font-medium text-ink-body mb-1 flex items-center gap-2">
                <Ruler size={14} className="text-taupe" />
                Body Measurements
              </p>
              <SizeChartEditor
                mode="single-row"
                value={sizeChart}
                onChange={handleSizeChartChange}
                shopId={shop?.id ?? 0}
                title="Measurement Fields"
                description="Add whatever fields you need for this customer — all values in inches (″)."
                columnPlaceholder="e.g. Sleeve to Wrist"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="measurement-notes" className="block text-sm font-medium text-ink-body mb-1.5">
                Notes <span className="text-ink-faint font-normal">(optional)</span>
              </label>
              <textarea
                id="measurement-notes"
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Client prefers loose fit, allergic to polyester..."
                className="w-full px-4 py-2.5 bg-canvas border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe/30 resize-none"
              />
            </div>

            <div className="pt-1 flex justify-end gap-3 border-t border-line mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:text-ink transition-colors hover:bg-sunken"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!form.customer_id || !form.profile_name}
                onClick={() => setView('preview')}
                className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <Eye size={15} />
                Review
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview — read-only summary shown before the save actually commits */}
            <div className="bg-canvas border border-line rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-faint uppercase tracking-wider font-semibold">Customer</p>
                  <p className="text-sm font-semibold text-ink">{selectedCustomer?.name || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-faint uppercase tracking-wider font-semibold">Profile</p>
                  <p className="text-sm font-semibold text-ink">{form.profile_name || '—'}</p>
                </div>
              </div>

              <div className="border-t border-line pt-3">
                <p className="text-xs text-ink-faint uppercase tracking-wider font-semibold mb-2">
                  Measurements ({filledFields.length} field{filledFields.length === 1 ? '' : 's'})
                </p>
                {sizeChart.columns.length === 0 ? (
                  <p className="text-sm text-ink-faint italic">No measurement fields added.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {sizeChart.columns.map((col, i) => (
                      <div key={col} className="flex items-center justify-between bg-surface border border-line rounded-lg px-3 py-2">
                        <span className="text-xs text-ink-muted">{col}</span>
                        <span className="text-sm font-semibold text-ink">{sizeChart.rows[0]?.values[i] || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {form.notes && (
                <div className="border-t border-line pt-3">
                  <p className="text-xs text-ink-faint uppercase tracking-wider font-semibold mb-1">Notes</p>
                  <p className="text-sm text-ink-body">{form.notes}</p>
                </div>
              )}
            </div>

            {editingId && (
              <p className="text-xs text-ink-muted bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Saving creates a new version of this profile — the current version is kept in its history, not overwritten.
              </p>
            )}

            <div className="pt-1 flex justify-end gap-3 border-t border-line mt-4">
              <button
                type="button"
                onClick={() => setView('edit')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:text-ink transition-colors hover:bg-sunken flex items-center gap-2"
              >
                <Pencil size={14} />
                Back to Edit
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                Confirm & Save
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
