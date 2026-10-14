import React, { useState } from 'react';
import { CatalogFormData } from '../catalogTypes';
import {
  GARMENT_CATEGORIES,
  GARMENT_CATEGORY_KEYS,
  GARMENTS,
  canonicalGarment,
  categoryOfGarment,
  garmentsInCategory,
  type GarmentCategory,
} from '@/lib/garmentTaxonomy';

const FIELD = 'w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:border-taupe text-base sm:text-sm disabled:opacity-50';
const LABEL = 'block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2';
// Every category except the catch-all, which is the "type a name" choice.
const LISTED = GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other');

/**
 * Garment Category → Garment (2-level taxonomy, src/lib/garmentTaxonomy.ts). Who wears it and where it sits on the
 * body are not asked any more. "Other garment" takes a typed name, which SUTURA's admin approves before the design
 * shows to customers. A design saved under an old slug shows as the garment it was merged into.
 */
export function GarmentPicker({
  formData,
  setFormData,
}: Readonly<{ formData: CatalogFormData; setFormData: React.Dispatch<React.SetStateAction<CatalogFormData>> }>) {
  const saved = formData.garment_type ?? '';
  const known = canonicalGarment(saved);
  const [pickedCategory, setPickedCategory] = useState<GarmentCategory | ''>(() => {
    if (!saved) return '';
    return categoryOfGarment(saved) ?? 'other';
  });
  const category: GarmentCategory | '' = known ? (categoryOfGarment(known) as GarmentCategory) : pickedCategory;
  const isOther = category === 'other';

  const setGarment = (value: string) => setFormData((prev) => ({ ...prev, garment_type: value }));

  const onCategory = (value: string) => {
    setPickedCategory(value as GarmentCategory | '');
    setGarment('');
  };

  return (
    <>
      <div>
        <label htmlFor="catalog-garment-category" className={LABEL}>Garment category</label>
        <select id="catalog-garment-category" value={category} onChange={(e) => onCategory(e.target.value)} className={FIELD}>
          <option value="">Select a category…</option>
          {LISTED.map((c) => (
            <option key={c} value={c}>{GARMENT_CATEGORIES[c].label}</option>
          ))}
          <option value="other">Other garment (type the name)</option>
        </select>
      </div>
      <div>
        <label htmlFor="catalog-garment" className={LABEL}>
          Garment <span className="text-ink-faint normal-case font-normal">— customers find the design by this</span>
        </label>
        {isOther ? (
          <input
            id="catalog-garment"
            type="text"
            name="garment_type"
            value={known ? '' : saved}
            onChange={(e) => setGarment(e.target.value)}
            maxLength={100}
            placeholder="e.g. Kimono, Malong"
            aria-describedby="catalog-garment-review"
            className={FIELD}
          />
        ) : (
          <select
            id="catalog-garment"
            name="garment_type"
            value={known ?? ''}
            onChange={(e) => setGarment(e.target.value)}
            disabled={!category}
            className={FIELD}
          >
            <option value="">{category ? 'Select a garment…' : 'Select a category first'}</option>
            {category &&
              garmentsInCategory(category).map((g) => (
                <option key={g} value={g}>{GARMENTS[g].label}</option>
              ))}
          </select>
        )}
        {isOther && (
          <p id="catalog-garment-review" className="mt-1.5 text-xs text-ink-muted">
            A typed-in garment is checked by SUTURA first — the design shows to customers once it is approved.
          </p>
        )}
      </div>
    </>
  );
}
