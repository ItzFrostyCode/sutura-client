'use client';

import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { FIELD, LABEL } from './fieldStyles';

export default function AddOnsEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const { formData, setFormData, storeServices } = edit.form;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const parentService = storeServices.find((s) => String(s.id) === formData.service_id);
  const serviceTiers = parentService?.pricing ?? [];
  const addOns = formData.add_ons || [];

  const addAddOn = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const numPrice = Math.max(0, parseFloat(price) || 0);

    // Prevent duplicate name within design add-ons
    if (addOns.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) return;

    setFormData((prev) => ({
      ...prev,
      add_ons: [
        ...(prev.add_ons || []),
        { id: `addon-${Date.now()}`, name: trimmed, price: numPrice },
      ],
    }));
    setName('');
    setPrice('');
  };

  const removeAddOn = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      add_ons: (prev.add_ons || []).filter((_, i) => i !== index),
    }));
  };

  const isDuplicateOfService = serviceTiers.some(
    (t) => t.label.trim().toLowerCase() === name.trim().toLowerCase()
  );

  return (
    <div className="space-y-4 pt-6 border-t border-line">
      <div>
        <p className={LABEL}>Design-Specific Add-ons (Optional)</p>
        <p className="text-xs text-ink-muted">
          Add optional customizations available only for this specific design (e.g. special lining, monogram, metallic buttons).
        </p>
      </div>

      {serviceTiers.length > 0 && (
        <div className="p-3 bg-sunken/60 border border-line text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <AlertCircle size={14} className="text-taupe shrink-0" />
            <span>Service-level add-ons (already active for this service):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {serviceTiers.map((t) => (
              <span key={t.id ?? t.label} className="px-2 py-0.5 bg-white border border-line text-ink text-[11px]">
                {t.label} (+₱{Number(t.amount).toLocaleString('en-PH')})
              </span>
            ))}
          </div>
          <p className="text-[11px] text-ink-muted italic">
            Do not re-add the same customizations here to avoid charging the customer twice.
          </p>
        </div>
      )}

      {addOns.length > 0 ? (
        <div className="border border-line divide-y divide-line bg-white">
          {addOns.map((addon, idx) => (
            <div key={addon.id || idx} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className="font-semibold text-ink truncate">{addon.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 bg-taupe/10 text-taupe font-semibold border border-taupe/20">
                  +₱{Number(addon.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => removeAddOn(idx)}
                  aria-label={`Remove add-on ${addon.name}`}
                  className="w-8 h-8 flex items-center justify-center text-ink-muted hover:text-danger cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-muted italic">
          No design-specific add-ons configured.
        </p>
      )}

      <div className="pt-1">
        <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
          Add an add-on
        </label>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAddOn();
              }
            }}
            placeholder="e.g. Chest Pocket or Monogram"
            aria-label="Add-on name"
            className={`${FIELD} flex-1 min-w-[140px]`}
          />
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-ink-muted">+₱</span>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price ₱"
              aria-label="Add-on price"
              className="w-24 h-12 px-3 bg-surface border border-line text-base text-ink focus:outline-none focus:border-taupe text-right"
            />
          </div>
          <button
            type="button"
            onClick={addAddOn}
            className="h-12 px-5 bg-taupe-dark text-white hover:bg-ink text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} /> Add add-on
          </button>
        </div>
        {isDuplicateOfService && (
          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            Warning: This add-on name matches an existing service-level add-on.
          </p>
        )}
      </div>
    </div>
  );
}
