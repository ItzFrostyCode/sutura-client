import type { CatalogItemResult } from '@/types/publicCatalog';
import type { CatalogListItem, StoreProfile } from '../types';


// CatalogListItem (this store's own catalog feed) is already shaped almost
// identically to the shared CatalogItemResult that CatalogItemCard expects —
// it's just missing the `store`/`order_count` fields, which are trivial to
// fill in here since the owning store is already known (storeId). Reusing
// the same card component every other catalog grid in the app uses (see
// SearchStoresTab.tsx's own toCatalogItemResult) keeps this store's own
// catalog page visually identical to how its items look everywhere else.
export function toCatalogItemResult(item: CatalogListItem, storeId: string, store?: StoreProfile | null): CatalogItemResult {
  return {
    id: item.id,
    name: item.name,
    garment_type: item.garment_type ?? '',
    price: item.price != null ? Number(item.price) : null,
    material: item.material ?? null,
    color: item.color ?? null,
    estimated_days: item.estimated_days ?? null,
    reviews_count: item.reviews_count ?? 0,
    reviews_avg_rating: item.reviews_avg_rating ?? null,
    order_count: (item as { order_count?: number }).order_count ?? 0,
    images: item.images.map((img) => ({ image_url: img.image_url, is_primary: img.is_primary })),
    fabric_image_url: item.fabric_image_url ?? null,
    distance_km: null,
    store: {
      id: store?.id ?? 0,
      name: store?.name ?? '',
      slug: storeId,
      branches: store?.branches?.map((b) => ({
        id: b.id,
        name: b.name,
        is_main: Boolean(b.is_main),
        district: b.district ?? null,
        city: b.city ?? null,
        latitude: b.latitude,
        longitude: b.longitude,
      })),
    },
  };
}
