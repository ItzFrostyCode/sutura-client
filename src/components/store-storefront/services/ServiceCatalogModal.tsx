'use client';

import Link from 'next/link';
import { Clock, Scissors, Shirt } from 'lucide-react';
import Modal from '@/components/Modal';
import { getMediaUrl } from '@/lib/media';
import { formatTurnaround } from '@/lib/formatTurnaround';
import type { CatalogListItem } from '../types';

const peso = (v: string | number | null | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `₱${n.toLocaleString('en-PH')}` : null;
};

const primaryImage = (item: CatalogListItem) =>
  item.images.find((i) => Boolean(i.is_primary))?.image_url ?? item.images[0]?.image_url ?? null;

/** Booking pre-filled with this design and its service (same params as the design page's "Book"). */
function bookingHref(storeId: string, serviceId: number, item: CatalogListItem): string {
  const q = new URLSearchParams({ ref: item.name, ref_item_id: String(item.id), service_id: String(serviceId) });
  const img = primaryImage(item);
  if (img) q.set('ref_image', img);
  if (item.price != null) q.set('ref_price', String(item.price));
  return `/store/${storeId}/book?${q.toString()}`;
}

/**
 * "View Catalog" on a service card: that service's designs in a dialog over
 * the shop page (backdrop click, Esc and ✕ close it — shared Modal). Each
 * design opens its own page, or goes straight to booking with the design and
 * service filled in.
 */
export default function ServiceCatalogModal({ isOpen, onClose, storeId, service, designs, loading }: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  service: { id: number; name: string } | null;
  designs: CatalogListItem[];
  loading: boolean;
}>) {
  if (!service) return null;
  const count = designs.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md:max-w-3xl lg:max-w-5xl"
      title={
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{service.name} — Catalog Designs</span>
          <span className="text-xs font-normal text-ink-muted">
            {loading ? 'Loading designs…' : `${count} ${count === 1 ? 'design' : 'designs'}`}
          </span>
        </span>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-line bg-surface">
              <div className="aspect-[4/5] bg-sunken" />
              <div className="space-y-2 p-3"><div className="h-4 w-2/3 bg-sunken" /><div className="h-3 w-1/3 bg-sunken" /></div>
            </div>
          ))}
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sunken">
            <Shirt size={24} className="text-taupe" aria-hidden="true" />
          </span>
          <p className="font-semibold text-ink">No pre-made designs uploaded for this service yet.</p>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">You can still book it — the shop will go over the design with you.</p>
          <Link
            href={`/store/${storeId}/service/${service.id}`}
            className="mt-5 inline-flex min-h-11 items-center bg-ink px-5 text-sm font-semibold text-white hover:bg-black"
          >
            See service &amp; book
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {designs.map((item) => {
            const img = primaryImage(item);
            const price = peso(item.price);
            return (
              <li key={item.id} className="group flex flex-col overflow-hidden border border-line bg-surface transition-[border-color,box-shadow] duration-200 ease-out hover:border-line-strong hover:shadow-[0_4px_14px_rgba(45,42,38,0.08)]">
                <Link href={`/store/${storeId}/catalog/${item.id}`} className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#EFE6DA]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getMediaUrl(img)} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
                    ) : (
                      <span className="flex h-full items-center justify-center" aria-hidden="true"><Shirt size={28} className="text-taupe/50" /></span>
                    )}
                  </div>
                  <div className="space-y-1 px-3 pt-3">
                    <p className="truncate font-semibold text-ink" title={item.name}>{item.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                      {price && <span className="font-semibold tabular-nums text-ink">{price}</span>}
                      {item.estimated_days != null && (
                        <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" /> Ready in {formatTurnaround(item.estimated_days)}</span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="mt-auto p-3">
                  <Link
                    href={bookingHref(storeId, service.id, item)}
                    className="flex min-h-10 w-full items-center justify-center gap-1.5 bg-ink px-3 text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe"
                  >
                    <Scissors size={14} aria-hidden="true" /> Select This Design
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
