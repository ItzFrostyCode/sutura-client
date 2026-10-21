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
  const seenUrls = new Set<string>();

  const add = (
    item: { id: number; name: string; price?: number | string | null; pricing?: DesignPricing | null },
    imageUrl?: string,
    variantLabel?: string
  ) => {
    if (imageUrl && !seenUrls.has(imageUrl) && results.length < 4) {
      seenUrls.add(imageUrl);
      results.push({
        id: item.id,
        name: variantLabel && variantLabel !== 'Front' ? `${item.name} (${variantLabel})` : item.name,
        price: item.price,
        pricing: item.pricing,
        imageUrl,
      });
    }
  };

  const primary = (images?: { image_url: string; is_primary?: boolean | number }[]) =>
    images?.find((i) => i.is_primary)?.image_url ?? images?.[0]?.image_url;

  // 1. Trending items matching this store
  for (const item of trendingItems) {
    if (item.store?.slug === store.slug || item.store?.id === store.id) {
      add(item, primary(item.images));
    }
  }

  // 2. Primary images from this store's catalog items
  for (const item of store.catalog_items ?? []) {
    add(item, primary(item.images));
  }

  // 3. If the store has fewer than 4 items, include additional image variants from its catalog items (e.g. colors/angles)
  if (results.length < 4) {
    for (const item of store.catalog_items ?? []) {
      for (const img of item.images ?? []) {
        if (results.length >= 4) break;
        add(item, img.image_url);
      }
    }
  }

  return results;
}

