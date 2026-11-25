'use client';

import Image from 'next/image';
import { LayoutGrid, Scissors } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { PublicService } from '../types';

export interface ServiceGroup {
  value: string;
  label: string;
  services: PublicService[];
}

/**
 * One storefront category (Uniform, Alterations & Repairs…): photo from its
 * first service, how many services it has (prices are shown per service, inside), and "View Catalog", which opens the
 * category's services in a dialog (ServiceCategoryModal).
 */
export default function ServiceCategoryCard({ group, onViewCatalog }: Readonly<{
  group: ServiceGroup;
  onViewCatalog: () => void;
}>) {
  const image = group.services.find((s) => s.image_url)?.image_url ?? null;
  const count = group.services.length;

  return (
    <article className="group flex w-[78%] min-[480px]:w-[46%] md:w-[31.5%] lg:w-[23.6%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-line bg-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-line-strong hover:shadow-[0_4px_14px_rgba(45,42,38,0.08)]">
      <button type="button" onClick={onViewCatalog} tabIndex={-1} aria-hidden="true" className="block cursor-pointer">
        <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
          {image ? (
            <Image
              src={getMediaUrl(image)}
              alt=""
              fill
              sizes="(min-width: 1024px) 24vw, (min-width: 768px) 32vw, (min-width: 480px) 46vw, 78vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-faint">
              <Scissors size={28} />
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="text-base sm:text-lg font-medium leading-snug text-ink line-clamp-2">{group.label}</h3>
        <p className="mt-1 mb-3 text-sm text-ink-muted tabular-nums">
          {count} {count === 1 ? 'service' : 'services'}
        </p>

        <button
          type="button"
          onClick={onViewCatalog}
          aria-haspopup="dialog"
          className="mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-sunken text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink cursor-pointer"
        >
          <LayoutGrid size={15} aria-hidden="true" />
          View Catalog
          <span className="text-xs font-normal text-ink-muted">({count})</span>
        </button>
      </div>
    </article>
  );
}
