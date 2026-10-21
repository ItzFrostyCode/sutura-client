import React from 'react';
import { X } from 'lucide-react';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { FIELD, LABEL } from './fieldStyles';
import DesignPriceFields from './DesignPriceFields';

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
      <DesignPriceFields edit={edit} />
      <div>
        <label htmlFor="edit-days" className={`${LABEL} sm:min-h-[2.5rem] flex items-end`}>
          <span>Production time — from (days) <span className="text-red-600">*</span></span>
        </label>
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
        <p className="text-[11px] text-ink-faint mt-1.5">{hasFrom ? 'Minimum days needed.' : 'Type this first.'}</p>
      </div>
      <div>
        <label htmlFor="edit-days-max" className={`${LABEL} sm:min-h-[2.5rem] flex items-end`}>
          <span>To (days)</span>
        </label>
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

export { SizesEditor } from './SizesEditor';

