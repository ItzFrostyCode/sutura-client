'use client';

import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { FIELD, LABEL } from './fieldStyles';
import AddOnsEditor from './AddOnsEditor';
import SizeRowItem from './SizeRowItem';
import AddCustomSizeRow from './AddCustomSizeRow';

export function parseSizeItem(raw: string): { label: string; extra: number } {
  const match = raw.match(/^(.*?)\s*\(\+₱([0-9,.]+)\)$/);
  if (match) {
    const extra = parseFloat(match[2].replace(/,/g, ''));
    return { label: match[1].trim(), extra: Number.isFinite(extra) ? extra : 0 };
  }
  return { label: raw.trim(), extra: 0 };
}

export function formatSizeItem(label: string, extra: number): string {
  const cleanLabel = label.trim();
  if (extra > 0) {
    return `${cleanLabel} (+₱${extra.toLocaleString('en-PH', { maximumFractionDigits: 2 })})`;
  }
  return cleanLabel;
}

const STANDARD_PRESETS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

export function SizesEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const { formData, setFormData } = edit.form;
  const [newLabel, setNewLabel] = useState('');
  const [newExtra, setNewExtra] = useState('');

  const parsedSizes = formData.sizes.map((s) => parseSizeItem(s));

  const updateExtra = (index: number, extraValue: string) => {
    const numericExtra = Math.max(0, parseFloat(extraValue) || 0);
    const updated = [...parsedSizes];
    updated[index] = { ...updated[index], extra: numericExtra };
    setFormData((prev) => ({
      ...prev,
      sizes: updated.map((item) => formatSizeItem(item.label, item.extra)),
    }));
  };

  const removeAt = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const addCustomSize = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (parsedSizes.some((s) => s.label.toLowerCase() === trimmed.toLowerCase())) return;
    const extra = Math.max(0, parseFloat(newExtra) || 0);
    const formatted = formatSizeItem(trimmed, extra);
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, formatted],
    }));
    setNewLabel('');
    setNewExtra('');
  };

  const addStandardPresets = () => {
    const existingLabels = new Set(parsedSizes.map((s) => s.label.toLowerCase()));
    const toAdd = STANDARD_PRESETS.filter((p) => !existingLabels.has(p.toLowerCase())).map((p) =>
      formatSizeItem(p, 0)
    );
    if (toAdd.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, ...toAdd],
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={LABEL}>Sizes &amp; Price Adjustments</p>
        <p className="text-xs text-ink-muted">
          Set the sizes you offer for this design. Add an optional extra charge per piece (tubo sa tela/labor) for plus sizes (e.g. 2XL, 3XL). Leave at ₱0 for standard sizes. Skip if fully made-to-measure.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs font-semibold text-ink">
          Offered Sizes ({formData.sizes.length})
        </span>
        <button
          type="button"
          onClick={addStandardPresets}
          className="h-9 px-3 bg-taupe/10 text-taupe hover:bg-taupe/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles size={14} /> Add standard sizes (XS–3XL)
        </button>
      </div>

      {parsedSizes.length > 0 ? (
        <div className="border border-line divide-y divide-line bg-white">
          {parsedSizes.map((item, idx) => (
            <SizeRowItem
              key={`${item.label}-${idx}`}
              label={item.label}
              extra={item.extra}
              onUpdateExtra={(val) => updateExtra(idx, val)}
              onRemove={() => removeAt(idx)}
            />
          ))}
        </div>
      ) : (
        <div className="p-4 bg-sunken/50 border border-line border-dashed text-center text-xs text-ink-muted">
          No sizes added yet. Click &ldquo;Add standard sizes (XS–3XL)&rdquo; above or add custom sizes below.
        </div>
      )}

      {/* Add single size */}
      <AddCustomSizeRow
        newLabel={newLabel}
        newExtra={newExtra}
        onLabelChange={setNewLabel}
        onExtraChange={setNewExtra}
        onAdd={addCustomSize}
      />

      {/* Design Add-ons Section */}
      <AddOnsEditor edit={edit} />
    </div>
  );
}
