import Link from 'next/link';
import Image from 'next/image';
import { Shirt, Trash2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { CatalogItemImage } from '../types';

export interface DesignTileItem {
  readonly id: number;
  readonly name: string;
  readonly garment_type?: string | null;
  readonly images: CatalogItemImage[];
}

interface DesignTileProps {
  readonly item: DesignTileItem;
  readonly href: string;
  readonly className?: string;
  /** Shop owner viewing their own store: a small delete button on the picture. */
  readonly onDelete?: (id: number) => void;
}

/**
 * One catalog design as a picture with its name — no price, rating or location: on a service, the designs are there to show
 * what the shop makes; price and booking live on the service and the design's own page.
 */
export default function DesignTile({ item, href, className = '', onDelete }: DesignTileProps) {
  const image = item.images.find((i) => i.is_primary) ?? item.images[0];

  return (
    <div className={`relative ${className}`}>
      <Link href={href} className="group block transition-opacity active:opacity-80">
        <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-sunken">
          {image ? (
            <Image src={getMediaUrl(image.image_url)} alt="" fill sizes="(min-width: 1024px) 20vw, (min-width: 600px) 30vw, 45vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-faint"><Shirt size={24} /></span>
          )}
        </span>
        <span className="mobile-body-sm mt-2 line-clamp-2 block font-medium text-ink">{item.name}</span>
        {item.garment_type && <span className="mobile-caption block truncate capitalize text-ink-muted">{item.garment_type.replace(/_/g, ' ')}</span>}
      </Link>
      {onDelete && (
        <button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-danger shadow-sm">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
