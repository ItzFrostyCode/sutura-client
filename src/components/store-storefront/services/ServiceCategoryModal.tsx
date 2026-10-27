'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Scissors, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { getMediaUrl } from '@/lib/media';
import { getActiveSale } from '@/lib/salePricing';
import { serviceOrderHref } from '@/lib/serviceOrderHref';
import type { ServiceGroup } from './ServiceCategoryList';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

/**
 * "View Catalog" on a category card: every service in that category
 * ("Uniform — Catalog Designs" → PNP Uniform), each with booking and details.
 */
export default function ServiceCategoryModal({
  group, onClose, storeId, onOpenService, canManage, onEdit, onDelete,
}: Readonly<{
  group: ServiceGroup | null;
  onClose: () => void;
  storeId: string;
  onOpenService: (serviceId: number) => void;
  canManage: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}>) {
  if (!group) return null;
  const count = group.services.length;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{group.label} — Catalog Designs</span>
          <span className="text-xs font-normal text-ink-muted">
            {count} {count === 1 ? 'service' : 'services'} available
          </span>
        </span>
      }
    >
      <ul className="space-y-3">
        {group.services.map((service) => {
          const base = Number(service.base_price);
          const sale = base > 0
            ? getActiveSale({ price: service.base_price, sale_price: service.sale_price, sale_starts_at: service.sale_starts_at, sale_ends_at: service.sale_ends_at })
            : null;
          const detailsHref = `/store/${storeId}/service/${service.id}`;
          return (
            <li key={service.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-[0_2px_8px_rgba(45,42,38,0.05)] sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-sunken">
                  {service.image_url ? (
                    <Image src={getMediaUrl(service.image_url)} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-ink-faint" aria-hidden="true"><Scissors size={22} /></span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-medium text-ink" title={service.name}>{service.name}</p>
                  <p className="text-sm text-ink-body tabular-nums">
                    {Number.isFinite(base) && base > 0 ? (
                      <>From{' '}
                        {sale ? (
                          <><span className="font-semibold text-danger">{peso(sale.sale)}</span>{' '}<span className="text-ink-faint line-through">{peso(base)}</span></>
                        ) : peso(base)}
                      </>
                    ) : <span className="text-ink-muted">Price on consultation</span>}
                  </p>
                  {canManage && (
                    <div className="mt-1 flex gap-1">
                      <button type="button" onClick={() => onEdit(service.id)} aria-label={`Edit ${service.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink cursor-pointer">
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => onDelete(service.id)} aria-label={`Delete ${service.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-danger/10 hover:text-danger cursor-pointer">
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
                <Link
                  href={serviceOrderHref(storeId, service)}
                  onClick={() => onOpenService(service.id)}
                  className="flex min-h-10 flex-1 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe sm:flex-none"
                >
                  Place Order
                </Link>
                <Link
                  href={detailsHref}
                  onClick={() => onOpenService(service.id)}
                  className="flex min-h-10 flex-1 items-center justify-center rounded-lg border border-line-strong bg-sunken px-4 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe sm:flex-none"
                >
                  View details
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
