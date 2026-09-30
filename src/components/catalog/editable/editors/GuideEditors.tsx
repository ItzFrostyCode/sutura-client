import React from 'react';
import GuideImageField from '@/components/shared/GuideImageField';
import type { CatalogDraftEdit } from '../useCatalogSectionEdit';
import { FIELD, LABEL } from './fieldStyles';

export function MeasurementGuideEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const f = edit.form;
  return (
    <div className="space-y-4">
      <div>
        <p className={LABEL}>Guide image <span className="text-ink-faint normal-case font-normal">(optional)</span></p>
        <GuideImageField
          imageUrl={f.measurementGuideImage}
          uploading={f.uploadingSection === 'measurement_guide'}
          alt="Measurement Guide"
          onRemove={() => f.setMeasurementGuideImage('')}
          onUpload={file => f.handleSectionUpload(file, 'measurement_guide')}
        />
      </div>
      <div>
        <label htmlFor="edit-measure" className={LABEL}>How to measure / fit notes</label>
        <textarea
          id="edit-measure"
          rows={5}
          name="measurement_guide"
          value={f.formData.measurement_guide}
          onChange={f.handleChange}
          placeholder="Measure around the fullest part of your chest, keeping the tape level…"
          className={FIELD}
        />
      </div>
    </div>
  );
}

export function DescriptionEditor({ edit }: Readonly<{ edit: CatalogDraftEdit }>) {
  const f = edit.form;
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="edit-desc" className={LABEL}>Description</label>
        <textarea
          id="edit-desc"
          rows={5}
          name="description"
          value={f.formData.description}
          onChange={f.handleChange}
          placeholder="Tell clients about the design, silhouette details, and styling recommendations…"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="edit-care" className={LABEL}>Garment care &amp; alterations</label>
        <textarea
          id="edit-care"
          rows={4}
          name="care_instructions"
          value={f.formData.care_instructions}
          onChange={f.handleChange}
          placeholder="Dry clean only. Minor alterations are free within 30 days…"
          className={FIELD}
        />
      </div>
      <div>
        <p className={LABEL}>Image <span className="text-ink-faint normal-case font-normal">(optional)</span></p>
        <GuideImageField
          imageUrl={f.careImage}
          uploading={f.uploadingSection === 'care'}
          alt="Description visual"
          onRemove={() => f.setCareImage('')}
          onUpload={file => f.handleSectionUpload(file, 'care')}
        />
      </div>
    </div>
  );
}
