import React from 'react';
import { X } from 'lucide-react';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { FIELD, LABEL } from './fieldStyles';

export function InfoEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const { formData, handleChange, setFormData } = edit.form;
  const from = Number(formData.estimated_days);
  const hasFrom = formData.estimated_days !== '' && from >= 1;
  const belowFrom = hasFrom && formData.estimated_days_max !== '' && Number(formData.estimated_days_max) <= from;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor="edit-name" className={LABEL}>Design name <span className="text-red-600">*</span></label>
        <input id="edit-name" name="name" value={formData.name} onChange={handleChange} className={FIELD} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="edit-price" className={LABEL}>Starting price (PHP) <span className="text-red-600">*</span></label>
        <input id="edit-price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} className={FIELD} />
      </div>
      <div>
        <label htmlFor="edit-days" className={LABEL}>Production time — from (days) <span className="text-red-600">*</span></label>
        <input
          id="edit-days"
          name="estimated_days"
          type="number"
          min="1"
          value={formData.estimated_days}
          onChange={e => {
            handleChange(e);
            // No starting number, no range: drop a stale "to" so it can't outlive it.
            if (e.target.value === '') setFormData(prev => ({ ...prev, estimated_days_max: '' }));
          }}
          placeholder="e.g. 5"
          className={FIELD}
        />
        <p className="text-[11px] text-ink-faint mt-1.5">Type this first.</p>
      </div>
      <div>
        <label htmlFor="edit-days-max" className={LABEL}>to (days)</label>
        <input
          id="edit-days-max"
          name="estimated_days_max"
          type="number"
          min={hasFrom ? from + 1 : 1}
          value={formData.estimated_days_max}
          onChange={handleChange}
          disabled={!hasFrom}
          placeholder={hasFrom ? `${from + 1} or higher` : '—'}
          className={`${FIELD} disabled:bg-sunken disabled:cursor-not-allowed`}
        />
        <p className={`text-[11px] mt-1.5 ${belowFrom ? 'text-danger' : 'text-ink-faint'}`}>
          {!hasFrom
            ? 'Enter the "from" days first.'
            : belowFrom
              ? `Must be ${from + 1} or higher — or leave it blank.`
              : `Leave blank for exactly ${from} day${from === 1 ? '' : 's'}, or enter ${from + 1} or higher.`}
        </p>
      </div>
    </div>
  );
}

export function SizesEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const { formData, sizeInput, setSizeInput, addSize, removeSize } = edit.form;

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">Reference range for this design — leave empty if it is fully custom-measured.</p>
      {formData.sizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formData.sizes.map(size => (
            <span key={size} className="flex items-center gap-1 pl-3 pr-1 h-9 bg-taupe text-white text-sm">
              {size}
              <button type="button" onClick={() => removeSize(size)} aria-label={`Remove size ${size}`} className="w-8 h-8 flex items-center justify-center hover:text-white/70 cursor-pointer">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={sizeInput}
          onChange={e => setSizeInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSize();
            }
          }}
          placeholder="e.g. S, then press Enter"
          aria-label="New size"
          className={FIELD}
        />
        <button type="button" onClick={addSize} className="shrink-0 h-12 px-5 bg-taupe/10 text-taupe hover:bg-taupe/20 text-sm font-semibold cursor-pointer">
          Add
        </button>
      </div>
    </div>
  );
}
