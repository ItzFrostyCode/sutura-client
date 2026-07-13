import React from 'react';
import api from '@/lib/axios';
import { BulletItem, ImageItem, CatalogFormData, CatalogItemResponse } from './catalogTypes';
import type { SizeChartValue } from '@/components/shared/SizeChartEditor';

export interface CatalogItem {
  id: number;
  name: string;
  price: string;
  estimated_days?: number | null;
  material: string;
  color?: string;
  fabric_image_url?: string;
  sizes?: string[] | null;
  description?: string;
  garment_type?: string;
  images: { id: number; image_url: string; is_primary: boolean }[];
  views_count: number;
  saves_count: number;
  reviews_avg_rating: number | null;
  reviews_count: number;
  features?: unknown;
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
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
    if ('bullets' in parsedObj) {
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

export function mapCatalogItemToState(item: CatalogItemResponse) {
  const { bullets: parsedFeatures, imageUrl: featuresImgUrl } = parseFeatures(item.features);
  const { text: careText, imageUrl: careImgUrl } = parseCareInstructions(item.care_instructions);

  const form = {
    name: item.name,
    price: item.price.toString(),
    estimated_days: item.estimated_days != null ? String(item.estimated_days) : '',
    material: item.material ?? '',
    color: item.color ?? '',
    fabric_image_url: item.fabric_image_url ?? '',
    description: item.description ?? '',
    care_instructions: careText,
    garment_type: item.garment_type ?? '',
    sizes: Array.isArray(item.sizes) ? item.sizes : [],
    external_gallery_url: item.external_gallery_url ?? '',
    is_active: item.is_active ?? true,
  };

  const imgs = (item.images || []).map((img, i) => ({
    id: `img-${i}`,
    url: img.image_url,
    angle: img.angle ?? 'Default',
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
    formData: form,
    images: imgs.length > 0 ? imgs : [{ id: 'init', url: '', angle: 'Default', is_primary: true }],
  };
}

export async function uploadSectionImage({
  file,
  shopId,
  section,
  setUploadingSection,
  setFeaturesImage,
  setCareImage,
}: {
  file: File;
  shopId: number;
  section: 'specs' | 'care';
  setUploadingSection: (sec: 'specs' | 'care' | null) => void;
  setFeaturesImage: (url: string) => void;
  setCareImage: (url: string) => void;
}) {
  setUploadingSection(section);
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await api.post(`/shops/${shopId}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data.data.url;
    if (section === 'specs') setFeaturesImage(url);
    else if (section === 'care') setCareImage(url);
  } catch (err) {
    console.error(`${section} image upload failed`, err);
    alert('Failed to upload image. File may be too large.');
  } finally {
    setUploadingSection(null);
  }
}

export async function uploadCatalogImage({
  file,
  shopId,
  imageId,
  setImages,
}: {
  file: File;
  shopId: number;
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
    const res = await api.post(`/shops/${shopId}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = res.data.data.url;
    setImages(prev => prev.map(img => (img.id === imageId ? { ...img, url, uploading: false } : img)));
  } catch (err) {
    console.error('Upload failed', err);
    alert('Failed to upload image. File may be too large.');
    setImages(prev => prev.map(img => (img.id === imageId ? { ...img, uploading: false } : img)));
  }
}

export function buildSavePayload(
  formData: CatalogFormData,
  features: BulletItem[],
  featuresImage: string,
  sizeChart: SizeChartValue,
  careImage: string,
  images: ImageItem[]
) {
  const filteredFeatures = features.map(f => f.text).filter(t => t.trim() !== '');
  const filteredImages = images.filter(img => img.url.trim() !== '');

  return {
    ...formData,
    fabric_image_url: formData.fabric_image_url || null,
    sizes: formData.sizes,
    features: {
      bullets: filteredFeatures,
      image_url: featuresImage,
    },
    size_chart_image_url: sizeChart.image_url,
    size_chart_columns: sizeChart.columns.length > 0 ? sizeChart.columns : null,
    size_chart_rows: sizeChart.rows.length > 0 ? sizeChart.rows : null,
    care_instructions: JSON.stringify({
      text: formData.care_instructions,
      image_url: careImage,
    }),
    images: filteredImages.map(img => ({
      url: img.url,
      angle: img.angle,
      is_primary: img.is_primary,
    })),
    external_gallery_url: formData.external_gallery_url || null,
  };
}
