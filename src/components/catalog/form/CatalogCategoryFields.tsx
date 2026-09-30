import React from 'react';
import { CatalogFormData } from '../catalogTypes';
import {
  CATALOG_DEPARTMENTS,
  CATALOG_OTHERS_SUBCATEGORY,
  catalogSubcategoryOptions,
  catalogStructureOptions,
  catalogGarmentTypeOptions,
} from '../catalogCategories';
import { isDepartment, GarmentStructure } from '@/lib/canonicalTaxonomy';

interface CatalogCategoryFieldsProps {
  readonly formData: CatalogFormData;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  readonly setFormData: React.Dispatch<React.SetStateAction<CatalogFormData>>;
  /** Render only the category trail or only the garment type; default is all four. */
  readonly only?: 'trail' | 'type';
}

// Department → Subcategory → Garment Structure → Garment Type. Returned as a
// fragment of grid cells so each host lays them out in its own grid.
export function CatalogCategoryFields({ formData, onChange, setFormData, only }: CatalogCategoryFieldsProps) {
  const { department, subcategory, garment_structure: structure } = formData;
  const departmentIsCanonical = isDepartment(department);
  const isChildrenDept = department === 'children';
  const isOthersSubcategory = subcategory === CATALOG_OTHERS_SUBCATEGORY;

  const subcategoryOptions = departmentIsCanonical ? catalogSubcategoryOptions(department) : [];
  const structureOptions = departmentIsCanonical && subcategory ? catalogStructureOptions(department, subcategory, structure) : [];
  const structureSelected = departmentIsCanonical && !!subcategory && !!structure;
  const garmentTypeOptions = structureSelected
    ? catalogGarmentTypeOptions(department, subcategory, structure as GarmentStructure)
    : [];
  const showGarmentTypeFreeText = isChildrenDept || isOthersSubcategory || (structureSelected && garmentTypeOptions.length === 0);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, department: value, subcategory: '', garment_structure: '', garment_type: '' }));
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, subcategory: value, garment_structure: '', garment_type: '' }));
  };

  const handleStructureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, garment_structure: value, garment_type: '' }));
  };

  return (
    <>
      {only !== 'type' && (
        <>
        <div>
          <label htmlFor="catalog-department" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
            Department
          </label>
          <select
            id="catalog-department"
            name="department"
            value={formData.department}
            onChange={handleDepartmentChange}
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:border-taupe text-sm"
          >
            <option value="">No specific department</option>
            {CATALOG_DEPARTMENTS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="catalog-subcategory" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
            Subcategory
          </label>
          <select
            id="catalog-subcategory"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleSubcategoryChange}
            disabled={!departmentIsCanonical}
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:border-taupe text-sm disabled:opacity-50"
          >
            <option value="">{departmentIsCanonical ? 'Select a subcategory…' : 'Select a department first'}</option>
            {subcategoryOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="catalog-structure" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
            Garment Structure
          </label>
          <select
            id="catalog-structure"
            name="garment_structure"
            value={formData.garment_structure}
            onChange={handleStructureChange}
            disabled={!subcategory}
            className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:border-taupe text-sm disabled:opacity-50"
          >
            <option value="">{subcategory ? 'Select a structure…' : 'Select a subcategory first'}</option>
            {structureOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        </>
      )}
      {only !== 'trail' && (
        <>
        <div>
          <label htmlFor="catalog-garment" className="block text-xs font-semibold text-ink-body uppercase tracking-wider mb-2">
            Garment Type <span className="text-ink-faint normal-case font-normal">— controls which category filters/nav links show this item</span>
          </label>
          {showGarmentTypeFreeText ? (
            <input
              id="catalog-garment"
              type="text"
              name="garment_type"
              value={formData.garment_type}
              onChange={onChange}
              placeholder="e.g. Barong, Gown, Suit"
              className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
            />
          ) : (
            <select
              id="catalog-garment"
              name="garment_type"
              value={formData.garment_type}
              onChange={onChange}
              disabled={!structureSelected}
              className="w-full px-4 py-2.5 bg-surface border border-line rounded-xl text-ink focus:outline-none focus:border-taupe text-sm disabled:opacity-50"
            >
              <option value="">{structureSelected ? 'Select a garment type…' : 'Select a structure first'}</option>
              {garmentTypeOptions.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
        </div>
        </>
      )}
    </>
  );
}
