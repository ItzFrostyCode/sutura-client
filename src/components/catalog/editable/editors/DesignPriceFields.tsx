import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { DESIGN_PRICING_CHOICES } from '@/lib/designPricing';
import { FIELD, LABEL } from './fieldStyles';

const peso = (v: string | number | null | undefined) => (v != null && Number(v) > 0 ? `₱${Number(v).toLocaleString('en-PH')}` : null);

// The service a design belongs to, then how the design is priced against it. A design is a style under a
// service, so by default it costs what the service costs; the shop can add an extra charge or ask for a quote.
// Only a design with no service needs a price of its own.
export default function DesignPriceFields({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const f = edit.form;
  const { formData, handleChange, setFormData } = f;
  const service = f.storeServices.find((s) => String(s.id) === formData.service_id);
  const servicePrice = peso(service?.base_price);

  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor="edit-service" className={LABEL}>Service</label>
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
              className="w-12 h-12 shrink-0 bg-[#6B5346] text-white flex items-center justify-center hover:bg-ink transition-colors"
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

      {service ? (
        <fieldset className="sm:col-span-2">
          <legend className={LABEL}>Price for this design</legend>
          <div className="space-y-2">
            {DESIGN_PRICING_CHOICES.map((c) => (
              <label key={c.value} className="flex cursor-pointer items-start gap-3 py-1">
                <input
                  type="radio"
                  name="pricing_mode"
                  value={c.value}
                  checked={formData.pricing_mode === c.value}
                  onChange={() => setFormData((prev) => ({ ...prev, pricing_mode: c.value, extra_charge: c.value === 'extra' ? prev.extra_charge : '' }))}
                  className="mt-1 h-4 w-4 accent-taupe"
                />
                <span className="min-w-0">
                  <span className="mobile-body-md block text-ink">
                    {c.label}{c.value === 'same' && servicePrice ? ` (${servicePrice})` : ''}
                  </span>
                  <span className="mobile-body-sm block text-ink-muted">{c.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {formData.pricing_mode === 'extra' && (
            <div className="mt-3">
              <label htmlFor="edit-extra" className={LABEL}>Extra charge (PHP) <span className="text-red-600">*</span></label>
              <input id="edit-extra" name="extra_charge" type="number" min="1" value={formData.extra_charge} onChange={handleChange} placeholder="e.g. 500" className={FIELD} />
              {servicePrice && Number(formData.extra_charge) > 0 && (
                <p className="text-[11px] text-ink-faint mt-1.5">
                  Customers see: from {peso(Number(service.base_price) + Number(formData.extra_charge))} ({servicePrice} + {peso(formData.extra_charge)}).
                </p>
              )}
            </div>
          )}
          {!servicePrice && formData.pricing_mode !== 'quote' && (
            <p className="text-[11px] text-ink-faint mt-2">This service has no price yet, so customers see &quot;Price on quotation&quot;.</p>
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
