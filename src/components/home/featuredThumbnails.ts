import type { CatalogItemResult } from '@/types/publicCatalog';
import type { StoreResult } from './homeTypes';
import type { DesignPricing } from '@/lib/designPricing';

export interface ThumbnailItem {
  id: number;
  name: string;
  price?: number | string | null;
  pricing?: DesignPricing | null;
  imageUrl: string;
}

/**
 * Up to 4 of a featured shop's own designs: its best-sellers first (from the site-wide best-seller list), then its
 * newest. Only the shop's own work — a thumbnail links to /store/{this shop}/catalog/{id}, so a design from another
 * shop would open the wrong page. A shop with fewer designs simply shows fewer.
 */
export function getStoreThumbnails(store: StoreResult | null, trendingItems: CatalogItemResult[]): ThumbnailItem[] {
  if (!store) return [];
  const results: ThumbnailItem[] = [];
  const seen = new Set<number>();
  const add = (item: { id: number; name: string; price?: number | string | null; pricing?: DesignPricing | null }, imageUrl?: string) => {
    if (imageUrl && !seen.has(item.id) && results.length < 4) {
      seen.add(item.id);
      results.push({ id: item.id, name: item.name, price: item.price, pricing: item.pricing, imageUrl });
    }
  };
  const primary = (images?: { image_url: string; is_primary?: boolean | number }[]) =>
    images?.find((i) => i.is_primary)?.image_url ?? images?.[0]?.image_url;

  for (const item of trendingItems) {
    if (item.store?.slug === store.slug || item.store?.id === store.id) add(item, primary(item.images));
  }
  for (const item of store.catalog_items ?? []) add(item, primary(item.images));

  return results;
}
