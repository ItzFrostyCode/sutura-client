import React from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { BulletItem, ImageItem, ColorItem, CatalogFormData, CatalogItemResponse } from './catalogTypes';
import type { SizeChartValue } from '@/components/shared/SizeChartEditor';

export interface CatalogItem {
  id: number;
  name: string;
  price: string;
  estimated_days?: number | null;
  estimated_days_max?: number | null;
  material: string;
  color?: string;
  fabric_image_url?: string;
  sizes?: string[] | null;
  description?: string;
  garment_type?: string;
  department?: string;
  category?: string;
  images: { id: number; image_url: string; is_primary: boolean }[];
  views_count: number;
  saves_count: number;
  reviews_avg_rating: number | null;
  reviews_count: number;
  features?: unknown;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  measurement_guide?: unknown;
  care_instructions?: unknown;
  external_gallery_url?: string;
  total_revenue?: number;
  order_count?: number;
  is_active?: boolean;
}

/** Made-to-order only — the price is the real tailoring price, not a sale price. */
export function formatCatalogPrice(price: string | number): string {
  const numericPrice = Number(price);
  const formattedPrice = Number.isNaN(numericPrice) ? '0' : numericPrice.toLocaleString();
  return `Starting at ₱${formattedPrice}`;
}

export function parseFeatures(featuresInput?: unknown): { bullets: BulletItem[]; imageUrl: string } {
  let bullets: BulletItem[] = [{ id: 'init', text: '' }];
  let imageUrl = '';
  if (!featuresInput) return { bullets, imageUrl };

  let parsed: unknown = featuresInput;
  if (typeof featuresInput === 'string') {
    const trimmed = featuresInput.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(featuresInput);
      } catch (e) {
        console.error('Failed to parse features JSON string', e);
      }
    } else {
      return { bullets: [{ id: 'feat-0', text: featuresInput }], imageUrl };
    }
  }

  if (parsed && typeof parsed === 'object') {
    const parsedObj = parsed as Record<string, unknown>;
    if (Array.isArray(parsedObj.rows)) {
      bullets = (parsedObj.rows as { label?: unknown; value?: unknown }[]).map((r, i) => ({
        id: `feat-${i}`,
        text: String(r?.label ?? ''),
        value: String(r?.value ?? ''),
      }));
      imageUrl = typeof parsedObj.image_url === 'string' ? parsedObj.image_url : '';
    } else if ('bullets' in parsedObj) {
      const bulletsArr = Array.isArray(parsedObj.bullets) ? parsedObj.bullets : [''];
      bullets = bulletsArr.map((b: unknown, i: number) => ({ id: `feat-${i}`, text: String(b) }));
      imageUrl = typeof parsedObj.image_url === 'string' ? parsedObj.image_url : '';
    } else if (Array.isArray(parsedObj)) {
      bullets = parsedObj.map((b: unknown, i: number) => ({ id: `feat-${i}`, text: String(b) }));
    }
  }
  return { bullets, imageUrl };
}

export function parseCareInstructions(careInstructionsInput?: unknown): { text: string; imageUrl: string } {
  let text = '';
  let imageUrl = '';
  if (!careInstructionsInput) return { text, imageUrl };

  let parsed: unknown = careInstructionsInput;
  if (typeof careInstructionsInput === 'string') {
    const trimmed = careInstructionsInput.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(careInstructionsInput);
      } catch (e) {
        console.error('Failed to parse care instructions JSON string', e);
      }
    } else {
      return { text: careInstructionsInput, imageUrl };
    }
  }

  if (parsed && typeof parsed === 'object') {
    const parsedObj = parsed as Record<string, unknown>;
    if ('text' in parsedObj || 'image_url' in parsedObj) {
      text = typeof parsedObj.text === 'string' ? parsedObj.text : '';
      imageUrl = typeof parsedObj.image_url === 'string' ? parsedObj.image_url : '';
    } else {
      text = JSON.stringify(parsedObj);
    }
  } else if (careInstructionsInput !== null && careInstructionsInput !== undefined) {
    text = typeof careInstructionsInput === 'object' ? JSON.stringify(careInstructionsInput) : String(careInstructionsInput as string | number | boolean);
  }
  return { text, imageUrl };
}

// Colors this item can be tailored in, hydrated from the plain `color`
// comma-list plus any image whose view_angle names one of those colors —
// same convention CatalogHeroGallery/fabricHelper.ts already use to tell a
// color-variant photo apart from a plain front/back angle shot. Starts
// genuinely empty for an item with no color set, unlike getItemColorOptions
// (which always returns a "Default" fallback for the customer-facing view).
export function parseColorItems(item: CatalogItemResponse): ColorItem[] {
  const raw = (item.color ?? '').trim();
  if (!raw) return [];
  const names = raw.split(',').map(c => c.trim()).filter(Boolean);
  return names.map((name, i) => {
    const match = (item.images || []).find(img => img.view_angle?.toLowerCase() === name.toLowerCase());
    return { id: `color-${i}`, name, image_url: match?.image_url ?? '' };
  });
}

export function mapCatalogItemToState(item: CatalogItemResponse) {
  const { bullets: parsedFeatures, imageUrl: featuresImgUrl } = parseFeatures(item.features);
  const { text: careText, imageUrl: careImgUrl } = parseCareInstructions(item.care_instructions);
  // Same {text, image_url} shape as care_instructions — reuses the same parser.
  const { text: measurementGuideText, imageUrl: measurementGuideImgUrl } = parseCareInstructions(item.measurement_guide);

  const form = {
    name: item.name,
    price: item.price.toString(),
    service_id: item.service_id != null ? String(item.service_id) : '',
    estimated_days: item.estimated_days != null ? String(item.estimated_days) : '',
    estimated_days_max: item.estimated_days_max != null ? String(item.estimated_days_max) : '',
    material: item.material ?? '',
    fabric_image_url: item.fabric_image_url ?? '',
    description: item.description ?? '',
    care_instructions: careText,
    measurement_guide: measurementGuideText,
    garment_type: item.garment_type ?? '',
    department: item.department ?? '',
    subcategory: item.subcategory ?? '',
    garment_structure: item.garment_structure ?? '',
    sizes: Array.isArray(item.sizes) ? item.sizes : [],
    external_gallery_url: item.external_gallery_url ?? '',
    is_active: item.is_active ?? true,
  };

  // A color's own photo is edited in the Colors box (colorItems below) and
  // re-added to the payload from there, so keep it out of the angle photos or
  // every save would write it twice.
  const colorItems = parseColorItems(item);
  const colorNames = new Set(colorItems.map(c => c.name.toLowerCase()));
  const angleImages = (item.images || []).filter(img => !colorNames.has((img.view_angle ?? '').trim().toLowerCase()));
  const imgs = angleImages.map((img, i) => ({
    id: `img-${i}`,
    url: img.image_url,
    angle: img.view_angle ?? 'Default',
    is_primary: img.is_primary === 1,
  }));

  return {
    features: parsedFeatures,
    featuresImage: featuresImgUrl,
    sizeChart: {
      image_url: item.size_chart_image_url ?? null,
      columns: item.size_chart_columns ?? [],
      rows: item.size_chart_rows ?? [],
    },
    careImage: careImgUrl,
    measurementGuideImage: measurementGuideImgUrl,
    colorItems,
    formData: form,
    images: imgs.length > 0 ? imgs : [{ id: 'init', url: '', angle: 'Default', is_primary: true }],
  };
}

export async function uploadSectionImage({
  file,
  storeId,
  section,
  setUploadingSection,
  setFeaturesImage,
  setCareImage,
  setMeasurementGuideImage,
}: {
  file: File;
  storeId: number;
  section: 'specs' | 'care' | 'measurement_guide';
  setUploadingSection: (sec: 'specs' | 'care' | 'measurement_guide' | null) => void;
  setFeaturesImage: (url: string) => void;
  setCareImage: (url: string) => void;
  setMeasurementGuideImage: (url: string) => void;
}) {
  setUploadingSection(section);
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await api.post(`/stores/${storeId}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data.data.url;
    if (section === 'specs') setFeaturesImage(url);
    else if (section === 'care') setCareImage(url);
    else if (section === 'measurement_guide') setMeasurementGuideImage(url);
  } catch (err) {
    console.error(`${section} image upload failed`, err);
    alert(getErrorMessage(err, 'Failed to upload image. File may be too large.'));
  } finally {
    setUploadingSection(null);
  }
}

export async function uploadCatalogImage({
  file,
  storeId,
  imageId,
  setImages,
}: {
  file: File;
  storeId: number;
  imageId: string;
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
}) {
  const fd = new FormData();
  fd.append('file', file);

  // Functional updates matched by the slot's stable id (not array index) —
  // an index snapshot taken when the upload started can point at the wrong
  // slot (or silently discard other edits) if a slot is added/removed while
  // this upload is still in flight.
  setImages(prev => prev.map(img => (img.id === imageId ? { ...img, uploading: true } : img)));

  try {
    const res = await api.post(`/stores/${storeId}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data.data.url;
    setImages(prev => prev.map(img => (img.id === imageId ? { ...img, url, uploading: false } : img)));
  } catch (err) {
    console.error('Upload failed', err);
    alert(getErrorMessage(err, 'Failed to upload image. File may be too large.'));
    setImages(prev => prev.map(img => (img.id === imageId ? { ...img, uploading: false } : img)));
  }
}

export function buildSavePayload(
  formData: CatalogFormData,
  features: BulletItem[],
  featuresImage: string,
  sizeChart: SizeChartValue,
  careImage: string,
  images: ImageItem[],
  measurementGuideImage: string,
  colorItems: ColorItem[]
) {
  const featureRows = features
    .filter(f => f.text.trim() !== '')
    .map(f => ({ label: f.text.trim(), value: (f.value ?? '').trim() }));
  const filteredImages = images.filter(img => img.url.trim() !== '');
  const validColors = colorItems.map(c => ({ ...c, name: c.name.trim() })).filter(c => c.name);
  // Each color's own reference photo rides along as a regular catalog image,
  // tagged by color name — the same convention getItemColorOptions/
  // CatalogHeroGallery already use to tell a color photo apart from a plain
  // angle shot on the customer-facing side.
  const colorImages = validColors
    .filter(c => c.image_url.trim() !== '')
    .map(c => ({ url: c.image_url, angle: c.name, is_primary: false }));

  return {
    ...formData,
    service_id: formData.service_id ? Number(formData.service_id) : null,
    fabric_image_url: formData.fabric_image_url || null,
    sizes: formData.sizes,
    color: validColors.length > 0 ? validColors.map(c => c.name).join(', ') : null,
    features: {
      rows: featureRows,
      image_url: featuresImage,
    },
    size_chart_image_url: sizeChart.image_url,
    size_chart_columns: sizeChart.columns.length > 0 ? sizeChart.columns : null,
    size_chart_rows: sizeChart.rows.length > 0 ? sizeChart.rows : null,
    care_instructions: JSON.stringify({
      text: formData.care_instructions,
      image_url: careImage,
    }),
    measurement_guide: JSON.stringify({
      text: formData.measurement_guide,
      image_url: measurementGuideImage,
    }),
    images: [
      ...filteredImages.map(img => ({
        url: img.url,
        angle: img.angle,
        is_primary: img.is_primary,
      })),
      ...colorImages,
    ],
    external_gallery_url: formData.external_gallery_url || null,
  };
}
