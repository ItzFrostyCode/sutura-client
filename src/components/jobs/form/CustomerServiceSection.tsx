'use client';

import React from 'react';
import Link from 'next/link';
import { User, ShoppingBag, Store, Sparkles } from 'lucide-react';
import CollapsibleSection from '@/components/jobs/CollapsibleSection';
import { MetricPill, humanizeMetricKey } from '@/components/measurements/measurementHelpers';
import { CustomerData, CustomerMeasurement, JobCreateFormData, ServiceData } from './types';
import { CatalogItem } from '@/components/catalog/catalogHelpers';

interface CustomerServiceSectionProps {
  readonly formData: JobCreateFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<JobCreateFormData>>;
  readonly effectiveIntakeChannel: 'walk_in' | 'online';
  readonly appointmentId: string | null;
  readonly customerLocked: boolean;
  readonly setCustomerLocked: (locked: boolean) => void;
  readonly customers: CustomerData[];
  readonly services: ServiceData[];
  readonly customerMeasurements: CustomerMeasurement[];
  readonly isBulkOrder: boolean;
  readonly setIsBulkOrder: (bulk: boolean) => void;
  readonly setIsTotalAmountCustom: (custom: boolean) => void;
  readonly setIsDueDateCustom: (custom: boolean) => void;
  readonly setCustomFieldValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly selectedCatalogItem?: CatalogItem | null;
}

export default function CustomerServiceSection({
  formData,
  setFormData,
  effectiveIntakeChannel,
  appointmentId,
  customerLocked,
  setCustomerLocked,
  customers,
  services,
  customerMeasurements,
  isBulkOrder,
  setIsBulkOrder,
  setIsTotalAmountCustom,
  setIsDueDateCustom,
  setCustomFieldValues,
  selectedCatalogItem,
}: CustomerServiceSectionProps) {
  const renderMeasurementSelector = () => {
    if (isBulkOrder) {
      return (
        <p className="text-xs text-ink-muted italic py-2.5 bg-canvas border border-line rounded-lg px-3 h-[38px] flex items-center">
          Bulk Order (Roster Sheet will be used)
        </p>
      );
    }

    if (!formData.customer_id) {
      return (
        <p className="text-xs text-ink-faint italic py-3">
          Please select a customer first.
        </p>
      );
    }

    if (customerMeasurements.length === 0) {
      return (
        <div className="text-xs text-danger bg-danger/5 border border-danger/10 rounded-lg p-2.5 flex items-center justify-between">
          <span>No measurement profiles found.</span>
          <Link
            href={`/dashboard/measurements?customer_id=${formData.customer_id}`}
            className="font-semibold underline text-danger hover:text-danger/80 ml-2"
          >
            Record Measurements
          </Link>
        </div>
      );
    }

    const displayMeasurements = [...customerMeasurements].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    const mostRecentId = displayMeasurements[0]?.id?.toString();

    return (
      <div className="space-y-1">
        <select
          id="measurement_id"
          value={formData.measurement_id}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, measurement_id: e.target.value }))
          }
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        >
          <option value="">No profile selected / Consultation Only</option>
          {displayMeasurements.map((m) => (
            <option key={m.id} value={m.id}>
              V{m.version} - {m.profile_name}
            </option>
          ))}
        </select>
        {formData.measurement_id && formData.measurement_id === mostRecentId && (
          <p className="text-[11px] text-sage font-medium">
            ✓ Retrieved this customer&apos;s last saved measurements — no need to re-measure a returning client.
          </p>
        )}
      </div>
    );
  };

  const renderMeasurementSummary = () => {
    if (isBulkOrder || !formData.measurement_id) return null;
    const selected = customerMeasurements.find((m) => m.id.toString() === formData.measurement_id);
    if (!selected) return null;

    const filledMetrics = Object.entries(selected.metrics || {}).filter(([, v]) => v);

    return (
      <div className="bg-canvas/60 border border-line/60 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            {selected.profile_name} — Saved Measurements
          </span>
          <Link
            href={`/dashboard/measurements?customer_id=${formData.customer_id}`}
            className="text-[11px] font-semibold text-taupe hover:underline shrink-0"
          >
            View / Edit
          </Link>
        </div>
        {filledMetrics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {filledMetrics.map(([key, value]) => (
              <MetricPill key={key} label={humanizeMetricKey(key)} value={value} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-faint italic">No measurement fields recorded yet.</p>
        )}
        {selected.notes && (
          <p className="text-xs text-ink-body border-t border-line/60 pt-2 mt-1">
            <span className="font-semibold text-ink-muted">Notes: </span>
            {selected.notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <CollapsibleSection
      icon={<User size={16} className="text-taupe" />}
      title="Customer & Service Details"
      defaultOpen
    >
      {/* Order source */}
      <div>
        <span className="block text-xs font-semibold text-ink-muted mb-2 uppercase tracking-wider">
          Order Source <span className="text-[10px] font-normal normal-case text-ink-faint">(auto-detected)</span>
        </span>
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm ${
            effectiveIntakeChannel === 'online'
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : 'border-taupe bg-canvas text-ink'
          }`}
        >
          {effectiveIntakeChannel === 'online' ? <ShoppingBag size={18} /> : <Store size={18} />}
          <span>{effectiveIntakeChannel === 'online' ? 'Online' : 'Walk-in'}</span>
          <span className="text-[10px] font-normal opacity-70 ml-1">
            {appointmentId
              ? `From linked Appointment #${appointmentId}`
              : 'Created directly at the store counter'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="customer_id"
            className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider"
          >
            Customer <span className="text-danger">*</span>
          </label>
          {customerLocked && formData.customer_id ? (
            (() => {
              const lockedCustomer = customers.find((c) => c.id.toString() === formData.customer_id);
              return (
                <div className="flex items-center justify-between gap-3 bg-canvas border border-taupe/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-taupe/15 text-taupe flex items-center justify-center text-xs font-bold shrink-0">
                      {(lockedCustomer?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {lockedCustomer?.name || `Customer #${formData.customer_id}`}
                      </p>
                      {lockedCustomer?.email && (
                        <p className="text-[11px] text-ink-faint truncate">{lockedCustomer.email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerLocked(false)}
                    className="text-taupe hover:underline text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              );
            })()
          ) : (
            <select
              id="customer_id"
              required
              value={formData.customer_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, customer_id: e.target.value }))}
              className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.phone ? ` — ${c.phone}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label
            htmlFor="measurement_id"
            className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider"
          >
            Measurement Profile
          </label>
          {renderMeasurementSelector()}
        </div>
      </div>

      {renderMeasurementSummary()}

      <div>
        <label
          htmlFor="service_id"
          className="block text-xs font-semibold text-ink-muted mb-1 uppercase tracking-wider"
        >
          Type of Service <span className="text-danger">*</span>
        </label>
        {selectedCatalogItem && formData.service_id && (() => {
          const currentService = services.find((s) => s.id.toString() === formData.service_id);
          return currentService ? (
            <div className="flex items-center gap-2 text-xs text-taupe font-semibold bg-taupe/10 border border-taupe/20 px-3 py-2 rounded-lg mb-2">
              <Sparkles size={14} className="shrink-0 text-taupe" />
              <span>Tailoring Service auto-selected from lookbook design <strong>{selectedCatalogItem.name}</strong></span>
            </div>
          ) : null;
        })()}
        <select
          id="service_id"
          required
          value={formData.service_id}
          onChange={(e) => {
            const val = e.target.value;
            setIsTotalAmountCustom(false);
            setIsDueDateCustom(false);
            setFormData((prev) => ({ ...prev, service_id: val }));
            const selected = services.find((s) => s.id.toString() === val);
            const fields = selected?.custom_fields || [];
            const initialValues: Record<string, string> = {};
            fields.forEach((f) => {
              initialValues[f.label] = '';
            });
            setCustomFieldValues(initialValues);

            if (selected) {
              const name = selected.name.toLowerCase();
              const looksBulk =
                name.includes('jersey') ||
                name.includes('sublimation') ||
                name.includes('uniform') ||
                name.includes('esports');
              if (selected.service_type === 'bulk_sublimation' || looksBulk) {
                setIsBulkOrder(true);
              }
            }
          }}
          className="w-full bg-canvas border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
        >
          <option value="" disabled>
            Select a service
          </option>
          {services.map((s) => {
            const label =
              s.tags && s.tags.length > 0
                ? `${s.name} (${s.tags.slice(0, 3).join(', ')}${s.tags.length > 3 ? '...' : ''})`
                : s.name;
            return (
              <option key={s.id} value={s.id}>
                {label}
              </option>
            );
          })}
        </select>
      </div>
    </CollapsibleSection>
  );
}
