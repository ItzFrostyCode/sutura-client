import type { CatalogItemResult } from '@/types/publicCatalog';
import type { StoreResult } from './homeTypes';

export interface ThumbnailItem {
  id: number;
  name: string;
  price?: number | string | null;
  imageUrl: string;
}

/**
 * Up to 4 preview thumbnails for a featured store: its own catalog items first, then best-sellers that belong
 * to it, then general best-sellers so the four slots are filled.
 */
export function getStoreThumbnails(store: StoreResult | null, trendingItems: CatalogItemResult[]): ThumbnailItem[] {
  if (!store) return [];
  const results: ThumbnailItem[] = [];
  const seen = new Set<number>();
  const add = (item: { id: number; name: string; price?: number | string | null }, imageUrl?: string) => {
    if (imageUrl && !seen.has(item.id) && results.length < 4) {
      seen.add(item.id);
      results.push({ id: item.id, name: item.name, price: item.price, imageUrl });
    }
  };

  for (const item of store.catalog_items ?? []) add(item, item.images?.[0]?.image_url);

  const primary = (item: CatalogItemResult) => item.images?.find((i) => i.is_primary)?.image_url ?? item.images?.[0]?.image_url;
  for (const item of trendingItems) {
    if (item.store?.slug === store.slug || item.store?.id === store.id) add(item, primary(item));
  }
  for (const item of trendingItems) add(item, primary(item));

  return results;
}
