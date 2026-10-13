'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, Pencil, Scissors, Trash2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getActiveSale } from '@/lib/salePricing';
import type { PublicService } from '../types';

interface ServiceShowcaseCardProps {
  readonly service: PublicService;
  readonly href: string;
  readonly designCount: number;
  readonly catalogOpen: boolean;
  readonly onViewCatalog: () => void;
  readonly onOpen?: () => void;
  readonly canManage?: boolean;
  readonly onEdit?: (id: number) => void;
  readonly onDelete?: (id: number) => void;
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

/** One service on the storefront Services tab: photo, name, starting price, View Catalog. */
export default function ServiceShowcaseCard({
  service, href, designCount, catalogOpen, onViewCatalog, onOpen, canManage, onEdit, onDelete,
}: ServiceShowcaseCardProps) {
  const sale = service.base_price
    ? getActiveSale({ price: service.base_price, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at })
    : null;
  const base = Number(service.base_price);

  return (
    <article
      className={`group relative flex w-[78%] min-[480px]:w-[46%] md:w-[31.5%] lg:w-[23.6%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-surface transition-[border-color,box-shadow] duration-200 ease-out ${
        catalogOpen ? 'border-ink shadow-[0_6px_18px_rgba(45,42,38,0.14)]' : 'border-line hover:border-line-strong hover:shadow-[0_4px_14px_rgba(45,42,38,0.08)]'
      }`}
    >
      <Link href={href} onClick={onOpen} className="block" aria-label={`${service.name} — service details`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
          {service.image_url ? (
            <Image
              src={getMediaUrl(service.image_url)}
              alt=""
              fill
              sizes="(min-width: 1024px) 24vw, (min-width: 768px) 32vw, (min-width: 480px) 46vw, 78vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-faint">
              <Scissors size={28} aria-hidden="true" />
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <Link href={href} onClick={onOpen} className="text-base sm:text-lg font-medium leading-snug text-ink hover:text-taupe line-clamp-2">
          {service.name}
        </Link>
        <p className="mt-1 mb-3 text-sm text-ink-body">
          {Number.isFinite(base) && base > 0 ? (
            <>
              From{' '}
              {sale ? (
                <>
                  <span className="font-semibold text-danger">{peso(sale.sale)}</span>{' '}
                  <span className="text-ink-faint line-through">{peso(base)}</span>
                </>
              ) : (
                <span className="font-semibold text-ink">{peso(base)}</span>
              )}
            </>
          ) : (
            <span className="text-ink-muted">Price on consultation</span>
          )}
        </p>

        <button
          type="button"
          onClick={onViewCatalog}
          aria-pressed={catalogOpen}
          aria-controls="service-catalog"
          className={`mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors duration-200 cursor-pointer ${
            catalogOpen ? 'border-ink bg-ink text-white' : 'border-line-strong bg-sunken text-ink hover:border-ink'
          }`}
        >
          <LayoutGrid size={15} aria-hidden="true" />
          {catalogOpen ? 'Hide Catalog' : 'View Catalog'}
          <span className={`text-xs font-normal ${catalogOpen ? 'text-white/75' : 'text-ink-muted'}`}>({designCount})</span>
        </button>
      </div>

      {canManage && (
        <div className="absolute right-2 top-2 flex gap-1">
          <button type="button" onClick={() => onEdit?.(service.id)} aria-label={`Edit ${service.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-ink shadow-sm hover:bg-surface cursor-pointer">
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onDelete?.(service.id)} aria-label={`Delete ${service.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-danger shadow-sm hover:bg-surface cursor-pointer">
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}
