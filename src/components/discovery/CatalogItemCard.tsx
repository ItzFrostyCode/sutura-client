import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { CatalogItemResult } from '@/types/publicCatalog';

/**
 * The one catalog-item card style every customer-facing browse surface
 * (landing page's Catalog Showroom, /search's results grid) should use —
 * matches shop/[shop_id]'s own catalog tab card (aspect-3/4, material on
 * hover, name + price + order count) so a visitor doesn't land somewhere
 * that looks like a different product.
 */
export default function CatalogItemCard({ item }: { readonly item: CatalogItemResult }) {
  const primaryImage = item.images.find((img) => img.is_primary)?.image_url ?? item.images[0]?.image_url;

  return (
    <Link
      href={item.shop ? `/shop/${item.shop.slug}` : '/search'}
      className="group block bg-surface border border-line overflow-hidden hover:border-line-strong transition-colors"
    >
      <div className="aspect-3/4 bg-sunken relative overflow-hidden">
        {primaryImage ? (
          <Image
            src={getMediaUrl(primaryImage)}
            alt={item.name}
            fill
            unoptimized
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store size={22} className="text-ink-faint" />
          </div>
        )}
        {/* Hover overlay — material, matching the storefront's own catalog
            card pattern exactly. */}
        <div className="absolute inset-0 bg-surface/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-2 text-center">
          <span className="text-[11px] font-medium tracking-wide text-ink">
            {item.material || 'View Details'}
          </span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold text-ink line-clamp-2 leading-snug min-h-[2rem]">{item.name}</p>
        {item.price !== null && (
          <p className="text-sm font-bold text-taupe mt-1">₱{Number(item.price).toLocaleString()}</p>
        )}
        <p className="text-[11px] text-ink-faint mt-0.5">
          {item.order_count > 0 ? `${item.order_count} ordered` : 'New'}
        </p>
      </div>
    </Link>
  );
}
