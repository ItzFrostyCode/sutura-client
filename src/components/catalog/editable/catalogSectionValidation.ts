import { MAX_CATALOG_IMAGES } from '../form/formTypes';
import type { useCatalogForm } from '../form/useCatalogForm';
import type { CatalogSection } from './useCatalogSectionEdit';

// Shared by the edit boxes and the create steps, so "required" means the same in both.
export function validateCatalogSection(section: CatalogSection, form: ReturnType<typeof useCatalogForm>): string | null {
  const { formData, images, colorItems } = form;
  if (section === 'info') {
    if (!formData.name.trim() || formData.price === '') return 'Design name and price are required.';
    if (!formData.estimated_days || Number(formData.estimated_days) < 1) return 'Enter the production time (from days).';
    const from = Number(formData.estimated_days);
    const to = Number(formData.estimated_days_max);
    if (formData.estimated_days_max !== '' && to <= from) return `The "to" days must be ${from + 1} or higher — or leave it blank.`;
  }
  const photoCount = images.filter(i => i.url.trim() !== '').length;
  const colorPhotoCount = colorItems.filter((c, i) => i > 0 && c.name.trim() && c.image_url.trim()).length;
  if (section === 'gallery') {
    if (images.some(i => i.uploading) || colorItems.some(c => c.uploading)) return 'Wait for the upload to finish.';
    if (photoCount === 0) return 'Add at least one photo.';
    if (photoCount + colorPhotoCount > MAX_CATALOG_IMAGES) {
      return `A design can hold up to ${MAX_CATALOG_IMAGES} photos in total, angle photos and color photos combined.`;
    }
  }
  return null;
}
