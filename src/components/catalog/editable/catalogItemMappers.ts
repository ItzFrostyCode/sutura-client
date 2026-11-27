import type { DetailedCatalogItem } from '../detail/detailTypes';
import type { CatalogItemResponse } from '../catalogTypes';
import type { CatalogItem as StorefrontCatalogItem } from '@/components/store-catalog-detail/types';

// The exact item shape the customer's design page renders — so the owner's
// view is built from the very same components, not a look-alike.
export function toStorefrontItem(item: DetailedCatalogItem): StorefrontCatalogItem {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    estimated_days: item.estimated_days,
    estimated_days_max: item.estimated_days_max,
    description: item.description ?? undefined,
    material: item.material,
    color: item.color,
    garment_type: item.garment_type ?? undefined,
    department: item.department,
    subcategory: item.subcategory,
    garment_structure: item.garment_structure,
    sizes: item.sizes,
    features: item.features as StorefrontCatalogItem['features'],
    size_chart_image_url: item.size_chart_image_url,
    size_chart_columns: item.size_chart_columns,
    size_chart_rows: item.size_chart_rows,
    measurement_guide: item.measurement_guide,
    care_instructions: item.care_instructions as string | undefined,
    images: (item.images ?? []).map((img) => ({ ...img, view_angle: img.view_angle ?? '' })),
    fabric_image_url: item.fabric_image_url,
    external_gallery_url: item.external_gallery_url ?? undefined,
    reviews_avg_rating: item.reviews_avg_rating,
    reviews_count: item.reviews_count,
    saves_count: item.saves_count,
    order_count: item.order_count,
    reviews: (item.reviews ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? null,
      created_at: r.created_at,
      user: r.user ? { name: r.user.name } : null,
    })),
    service: item.service ? { id: item.service.id, name: item.service.name } : null,
    store: null,
  };
}

// mapCatalogItemToState() expects the shape returned by GET
// /stores/{id}/catalog — close enough to DetailedCatalogItem that only a few
// runtime-safe casts are needed (parseFeatures/parseCareInstructions accept
// unknown at runtime regardless of the stricter `string` annotation).
export function toCatalogItemResponse(item: DetailedCatalogItem): CatalogItemResponse {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price),
    service_id: item.service_id ?? item.service?.id ?? null,
    estimated_days: item.estimated_days,
    estimated_days_max: item.estimated_days_max,
    material: item.material,
    color: item.color,
    fabric_image_url: item.fabric_image_url ?? undefined,
    sizes: item.sizes,
    description: item.description ?? undefined,
    features: item.features as unknown as string,
    size_chart_image_url: item.size_chart_image_url,
    size_chart_columns: item.size_chart_columns,
    size_chart_rows: item.size_chart_rows,
    measurement_guide: item.measurement_guide as unknown as string,
    care_instructions: item.care_instructions as unknown as string,
    garment_type: item.garment_type ?? undefined,
    department: item.department,
    subcategory: item.subcategory,
    garment_structure: item.garment_structure,
    images: (item.images ?? []).map((img) => ({
      id: img.id,
      image_url: img.image_url,
      view_angle: img.view_angle,
      is_primary: img.is_primary ? 1 : 0,
    })),
    external_gallery_url: item.external_gallery_url ?? undefined,
    is_active: item.is_active,
  };
}
