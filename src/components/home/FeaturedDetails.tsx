import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { designPriceLabel } from '@/lib/designPricing';
import { GARMENT_CATEGORIES, GARMENT_CATEGORY_KEYS, SERVICE_GROUP_KEYS, categoryOfGarment } from '@/lib/garmentTaxonomy';
import type { StoreResult } from './homeTypes';
import type { ThumbnailItem } from './featuredThumbnails';

// Short names for the 4 services, for chips (the full names are on the service pages).
const WORK_CHIP: Record<string, string> = {
  custom_tailoring: 'Made to measure',
  uniform_production: 'Uniforms & jerseys',
  alterations_repairs: 'Alterations & repairs',
  garment_customization: 'Embroidery',
};

/** The kinds of work the shop offers, in the fixed order of the 4 services. */
function workOf(store: StoreResult): string[] {
  const groups = new Set((store.services ?? []).map((s) => s.service_category ?? ''));
  return SERVICE_GROUP_KEYS.filter((g) => groups.has(g)).map((g) => WORK_CHIP[g]);
}

/** The garment categories it makes or fixes — from its services' garments and its designs. */
function garmentCategoriesOf(store: StoreResult): string[] {
  const cats = new Set<string>();
  for (const svc of store.services ?? []) for (const g of svc.garment_types ?? []) cats.add(categoryOfGarment(g) ?? '');
  for (const item of store.catalog_items ?? []) cats.add(categoryOfGarment(item.garment_type) ?? '');
  return GARMENT_CATEGORY_KEYS.filter((c) => c !== 'other' && cats.has(c)).map((c) => GARMENT_CATEGORIES[c].label);
}

interface FeaturedDetailsProps {
  readonly store: StoreResult;
  readonly thumbnails: ThumbnailItem[];
  readonly hoveredId?: number;
  readonly onHover: (thumb: ThumbnailItem | null) => void;
  readonly gate: (href: string) => string;
}

/**
 * Right side of the featured card: name, rating, place, what the shop does, the garments it works on, up to four of
 * its own designs and the way to the shop.
 */
export default function FeaturedDetails({ store, thumbnails, hoveredId, onHover, gate }: FeaturedDetailsProps) {
  const branch = store.branches?.[0];
  const work = workOf(store);
  const garments = garmentCategoriesOf(store);
  const shownGarments = garments.slice(0, 3);
  const shownThumbs = thumbnails.slice(0, 2);

  return (
    <div className="flex w-full shrink-0 flex-col justify-between p-3.5 sm:p-4 lg:w-[340px] lg:p-3.5">
      <div>
        <Link href={gate(`/search?store=${store.slug}`)} className="group block">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink transition-colors group-hover:text-taupe sm:text-lg">
            {store.name}
          </h3>
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-ink-muted">
          <span className="flex items-center gap-1 font-medium text-ink">
            <Star size={13} className="fill-taupe text-taupe" />
            {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
          </span>
          <span>{store.reviews_count ? `${store.reviews_count} reviews` : 'Verified tailor'}</span>
          {branch && (
            <span className="flex items-center gap-1">
              <MapPin size={12} className="shrink-0 text-taupe" />
              <span className="truncate max-w-[130px]">{branch.district ?? branch.city ?? branch.name}</span>
            </span>
          )}
        </div>
      </div>

      {(work.length > 0 || garments.length > 0) && (
        <div className="mt-2 space-y-1">
          {work.length > 0 && (
            <ul className="flex flex-wrap gap-1">
              {work.slice(0, 3).map((w) => (
                <li key={w} className="rounded-full border border-line bg-sunken/30 px-2 py-0.5 text-[11px] text-ink-body">
                  {w}
                </li>
              ))}
            </ul>
          )}
          {garments.length > 0 && (
            <p className="truncate text-[11px] text-ink-muted">
              <span className="text-ink-faint">Works on:</span> {shownGarments.join(' · ')}
              {garments.length > shownGarments.length ? ` +${garments.length - shownGarments.length}` : ''}
            </p>
          )}
        </div>
      )}

      {shownThumbs.length > 0 && (
        <div className="my-2">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
            Signature works
          </p>
          <div className="grid grid-cols-2 gap-2">
            {shownThumbs.map((thumb) => (
              <Link
                key={thumb.id}
                href={gate(`/store/${store.slug}/catalog/${thumb.id}`)}
                onMouseEnter={() => onHover(thumb)}
                onMouseLeave={() => onHover(null)}
                className="group/thumb block"
              >
                <div
                  className={`relative aspect-[16/10] overflow-hidden rounded-lg bg-sunken ring-2 transition-shadow ${
                    hoveredId === thumb.id ? 'ring-taupe/50' : 'ring-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(thumb.imageUrl)}
                    alt={thumb.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/shop_storefront.jpg';
                    }}
                  />
                </div>
                <p className="mt-1 truncate text-[11px] text-ink-body leading-tight">{thumb.name}</p>
                <p className="truncate text-[11px] font-semibold text-ink">
                  {designPriceLabel(thumb.pricing, thumb.price)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href={gate(`/search?store=${store.slug}`)}
        className="flex h-9 w-full items-center justify-center rounded-full bg-ink text-xs font-semibold text-white transition-colors hover:bg-taupe active:opacity-80 mt-1"
      >
        Visit store
      </Link>
    </div>
  );
}
