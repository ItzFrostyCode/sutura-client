import Link from 'next/link';
import Image from 'next/image';
import { Store, Star, Clock, MapPin } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { getItemDistanceInfo } from '@/lib/customerLocation';
import type { CatalogItemResult } from '@/types/publicCatalog';

import { resolveFabricImage } from '@/lib/fabricHelper';

/**
 * The one catalog-item card style every customer-facing browse surface
 * (landing page's Catalog Showroom, /search's results grid) should use —
 * matches store/[store_id]'s own catalog tab card exactly (aspect-3/4,
 * bordered uppercase material badge on hover, rating-or-est.-days row,
 * name + price) so a visitor doesn't land somewhere that looks like a
 * different product. Clicking navigates straight to that item's real page
 * (store/[store_id]/catalog/[item_id]) — same destination the storefront's
 * own catalog tab uses.
 */
export default function CatalogItemCard({
  item,
  showFabric = false,
  userCoords,
}: {
  readonly item: CatalogItemResult;
  /** Model/Fabric toggle on /search — seamlessly swaps between the model wearing
   * the garment and the high-resolution fabric texture swatch. */
  readonly showFabric?: boolean;
  readonly userCoords?: { lat: number; lng: number } | null;
}) {
  const primaryImage = item.images.find((img) => img.is_primary)?.image_url ?? item.images[0]?.image_url;
  const fabricImage = resolveFabricImage(item);
  const displayImage = showFabric ? (fabricImage || primaryImage) : primaryImage;
  const gate = useGuestGatedHref();
  const distInfo = getItemDistanceInfo(item, userCoords);

  return (
    <Link
      href={gate(item.store ? `/store/${item.store.slug}/catalog/${item.id}` : '/search')}
      className="group flex flex-col justify-between w-full h-full bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors"
    >
      <div className="aspect-3/4 bg-sunken relative overflow-hidden shrink-0">
        {displayImage ? (
          <Image
            key={displayImage}
            src={getMediaUrl(displayImage)}
            alt={`${item.name}${showFabric ? ' - Fabric Swatch' : ''}`}
            fill
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={22} className="text-ink-faint" />
          </div>
        )}

        {/* Distance Badge on image — instant proximity awareness */}
        {distInfo && (
          <div className="absolute top-1.5 left-1.5 z-10 bg-ink/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <MapPin size={9} className="text-white/80 shrink-0" />
            <span className="truncate max-w-[110px]">{distInfo.label}</span>
          </div>
        )}

        {/* Hover overlay — matches the storefront's own catalog card exactly:
            a bordered, uppercase, tracked-out material badge, not plain text. */}
        <div className="absolute inset-0 bg-surface/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-2 text-center">
          <span className="text-[10px] font-medium tracking-widest uppercase text-ink border border-ink px-3 py-1.5">
            {showFabric ? `Fabric: ${item.material || 'Material Swatch'}` : (item.material || 'View Details')}
          </span>
        </div>
      </div>

      <div className="px-1.5 pt-2 pb-2.5 flex-1 flex flex-col justify-between">
        <div>
          {item.reviews_avg_rating && Number(item.reviews_avg_rating) > 0 ? (
            <div className="flex items-center gap-1 mb-1.5 h-4">
              <Star size={11} className="fill-amber-400 text-amber-500 shrink-0" />
              <span className="text-[11px] font-semibold text-ink">{Number(item.reviews_avg_rating).toFixed(1)}</span>
              {item.reviews_count > 0 && <span className="text-[11px] text-ink-faint">({item.reviews_count})</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1 mb-1.5 text-ink-faint h-4">
              <Clock size={11} />
              <span className="text-[11px]">Est. {item.estimated_days ?? 7}d</span>
            </div>
          )}

          <p className="text-[13px] font-semibold text-ink line-clamp-2 leading-snug group-hover:text-taupe transition-colors h-[36px]">
            {item.name}
          </p>

          <div className="h-4 flex items-center text-[11px] text-ink-faint mt-0.5 overflow-hidden">
            {item.garment_type ? (
              <span className="truncate">
                <span className="capitalize">{item.garment_type}</span>
                {(item.material || item.color) && (
                  <span> • {item.material || ''}{item.material && item.color ? ` (${item.color})` : item.color || ''}</span>
                )}
              </span>
            ) : (
              <span className="text-transparent">Custom</span>
            )}
          </div>
        </div>

        {item.price !== null && (
          <div className="mt-2 pt-1 border-t border-line/40">
            <p className="text-sm font-bold text-ink">₱{Number(item.price).toLocaleString()}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
