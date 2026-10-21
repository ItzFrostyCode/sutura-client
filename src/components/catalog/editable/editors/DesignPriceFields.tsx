import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import api from '@/lib/axios';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { DESIGN_PRICING_CHOICES } from '@/lib/designPricing';
import { FIELD, LABEL } from './fieldStyles';
import ParentServiceCard from './ParentServiceCard';
import type { StoreServiceOption } from '../../form/formTypes';

const peso = (v: string | number | null | undefined) => (v != null && Number(v) > 0 ? `₱${Number(v).toLocaleString('en-PH')}` : null);

// The service a design belongs to, then how the design is priced against it.
export default function DesignPriceFields({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const f = edit.form;
  const { formData, handleChange, setFormData } = f;
  const isServiceLocked = Boolean(edit.fromServiceId);

  // Directly fetch service if not yet available in storeServices
  const [directService, setDirectService] = useState<StoreServiceOption | null>(null);

  useEffect(() => {
    if (edit.fromServiceId && edit.storeId) {
      if (formData.service_id !== edit.fromServiceId) {
        setFormData((prev) => ({ ...prev, service_id: edit.fromServiceId! }));
      }
      const existing = f.storeServices.find((s) => String(s.id) === String(edit.fromServiceId));
      if (!existing && !directService) {
        api.get(`/stores/${edit.storeId}/services/${edit.fromServiceId}`)
          .then((res) => {
            if (res.data?.data) {
              setDirectService(res.data.data);
            }
          })
          .catch(() => {});
      }
    }
  }, [edit.fromServiceId, edit.storeId, f.storeServices, formData.service_id, directService, setFormData]);

  const service = f.storeServices.find((s) => String(s.id) === String(formData.service_id)) || directService;
  const servicePrice = peso(service?.base_price);
  const hasServicePrice = Number(service?.base_price) > 0;

  // Auto-switch away from 'same' or 'extra' if the chosen service has no numeric base price
  useEffect(() => {
    if (service && !hasServicePrice && (formData.pricing_mode === 'same' || formData.pricing_mode === 'extra')) {
      setFormData((prev) => ({ ...prev, pricing_mode: 'set' }));
    }
  }, [service, hasServicePrice, formData.pricing_mode, setFormData]);

  return (
    <>
      <div className="sm:col-span-2">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={isServiceLocked ? undefined : 'edit-service'} className={LABEL}>Service</label>
          {service && (
            <span className="text-[11px] font-semibold text-taupe bg-taupe/10 px-2 py-0.5 rounded">
              Linked: {service.name}
            </span>
          )}
        </div>

        {isServiceLocked ? (
          <div className="space-y-2">
            {/* Automatic read-only Service Label Card — NO combo box */}
            <div className="min-h-[52px] px-4 py-3 bg-canvas border border-line rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center text-taupe font-bold text-xs shrink-0 shadow-2xs">
                  {service?.name ? service.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {service?.name || 'Loading chosen service...'}
                  </p>
                  {service && (
                    <p className="text-xs text-ink-muted truncate">
                      {service.service_category ? service.service_category.replaceAll('_', ' ') : 'Custom Service'}
                      {service.base_price ? ` · Base: ₱${Number(service.base_price).toLocaleString('en-PH')}` : ''}
                      {(service.service_types ?? []).includes('bulk_sublimation') ? ' · Takes bulk orders' : ''}
                    </p>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                Assigned
              </span>
            </div>
            <p className="text-[11px] text-ink-faint">
              This design is automatically assigned to this service.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <select id="edit-service" name="service_id" value={formData.service_id} onChange={handleChange} className={FIELD}>
                <option value="">No service</option>
                {f.storeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{(s.service_types ?? []).includes('bulk_sublimation') ? ' (Bulk orders)' : ''}
                  </option>
                ))}
              </select>
              {edit.itemId > 0 && (
                <Link
                  href={`/dashboard/services/new?return=${encodeURIComponent(`/dashboard/catalog/${edit.itemId}`)}`}
                  aria-label="Add a new service"
                  title="Add a new service — you'll come back here with it linked"
                  className="w-12 h-12 shrink-0 bg-taupe-dark text-white flex items-center justify-center hover:bg-ink transition-colors"
                >
                  <Plus size={18} />
                </Link>
              )}
            </div>
            <p className="text-[11px] text-ink-faint mt-1.5">
              {f.storeServices.length === 0
                ? 'No services yet — add one under Services first.'
                : 'The work this design is made under. A service that takes bulk orders turns on Bulk Order.'}
            </p>
          </div>
        )}

        {service && <ParentServiceCard service={service} />}
      </div>

      {service ? (
        <fieldset className="sm:col-span-2">
          <legend className={LABEL}>Price for this design</legend>
          <div className="space-y-2">
            {DESIGN_PRICING_CHOICES.map((c) => {
              const isSameOrExtra = c.value === 'same' || c.value === 'extra';
              const disabled = isSameOrExtra && !hasServicePrice;
              return (
                <label
                  key={c.value}
                  className={`flex items-start gap-3 py-1 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="radio"
                    name="pricing_mode"
                    value={c.value}
                    disabled={disabled}
                    checked={formData.pricing_mode === c.value}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        pricing_mode: c.value,
                        extra_charge: c.value === 'extra' ? prev.extra_charge : '',
                        price: c.value === 'set' ? prev.price : '',
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-taupe"
                  />
                  <span className="min-w-0">
                    <span className="mobile-body-md block text-ink">
                      {c.label}{c.value === 'same' && servicePrice ? ` (${servicePrice})` : ''}
                    </span>
                    <span className="mobile-body-sm block text-ink-muted">
                      {disabled
                        ? 'Unavailable: Parent service has no base price set.'
                        : c.hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {formData.pricing_mode === 'set' && (
            <div className="mt-3">
              <label htmlFor="edit-price" className={LABEL}>
                Base price for this design (PHP) <span className="text-red-600">*</span>
              </label>
              <input
                id="edit-price"
                name="price"
                type="number"
                min="1"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 650"
                className={FIELD}
              />
              <p className="text-xs text-ink-muted mt-1.5">
                Customers start from {formData.price ? peso(formData.price) : 'this amount'} per piece. (Service price is not added).
              </p>
            </div>
          )}

          {formData.pricing_mode === 'extra' && (
            <div className="mt-3">
              <label htmlFor="edit-extra" className={LABEL}>
                Extra surcharge for this design (PHP) <span className="text-red-600">*</span>
              </label>
              <input
                id="edit-extra"
                name="extra_charge"
                type="number"
                min="1"
                value={formData.extra_charge}
                onChange={handleChange}
                placeholder="e.g. 150"
                className={FIELD}
              />
              {servicePrice && Number(formData.extra_charge) > 0 && (
                <p className="text-xs text-ink-muted mt-1.5">
                  Customers see: from {peso(Number(service.base_price) + Number(formData.extra_charge))} ({servicePrice} service + {peso(formData.extra_charge)} surcharge).
                </p>
              )}
            </div>
          )}
        </fieldset>
      ) : (
        <div className="sm:col-span-2">
          <label htmlFor="edit-price" className={LABEL}>Price (PHP) <span className="text-red-600">*</span></label>
          <input id="edit-price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} className={FIELD} />
          <p className="text-[11px] text-ink-faint mt-1.5">Only for a design with no service. Pick a service above to use its price instead.</p>
        </div>
      )}
    </>
  );
}
