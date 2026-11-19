'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Store } from 'lucide-react';
import api from '@/lib/axios';
import Modal from '@/components/Modal';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { serviceOrderHref } from '@/lib/serviceOrderHref';
import OnlineOrderLink from '@/components/service-order/OnlineOrderLink';

interface DesignDetail {
  description?: string | null;
  images?: { image_url: string; is_primary?: boolean | number }[];
  service_id?: number | null;
  service?: { id: number; service_types?: string[] | null } | null;
}

/**
 * A design opened from a card: its photo gallery and full description, plus
 * a "Book an Appointment" button. Starts from what the card already has and
 * fills in the full description and every photo from the design's endpoint.
 */
export default function CatalogDesignModal({ item, isOpen, onClose }: Readonly<{
  item: CatalogItemResult;
  isOpen: boolean;
  onClose: () => void;
}>) {
  const gate = useGuestGatedHref();
  const [detail, setDetail] = useState<DesignDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState('');
  const slug = item.store?.slug;

  useEffect(() => {
    if (!isOpen || !slug || detail) return;
    setLoading(true);
    api.get(`/catalog/${slug}/${item.id}`)
      .then(res => setDetail(res.data?.data ?? null))
      .catch(() => setDetail({}))
      .finally(() => setLoading(false));
  }, [isOpen, slug, item.id, detail]);

  const images = (detail?.images?.length ? detail.images : item.images)
    .map(i => i.image_url)
    .filter((url, idx, all) => url && all.indexOf(url) === idx);
  const primary = (detail?.images ?? item.images).find(i => i.is_primary)?.image_url ?? images[0] ?? '';
  const current = images.includes(picked) ? picked : primary;
  const description = (detail?.description ?? item.description ?? '').trim();

  // "Place Order" opens the online order form for the service this design is
  // linked to (every design made from the Create modal has one).
  const serviceId = detail?.service?.id ?? detail?.service_id ?? item.service_id ?? null;
  // The design's main photo and name ride along, so the order form attaches
  // the photo as a reference image and the shop sees which design was ordered.
  const designParams = `&design=${encodeURIComponent(item.name)}${primary ? `&design_image=${encodeURIComponent(primary)}` : ''}`;
  const orderHref = slug && serviceId
    ? gate(`${serviceOrderHref(slug, { id: serviceId, service_types: detail?.service?.service_types })}${designParams}`)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      maxWidth="md:max-w-3xl"
      footer={orderHref ? (
        <OnlineOrderLink
          href={orderHref}
          storeSlug={slug!}
          className="h-11 px-5 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold flex items-center transition-colors"
        >
          Place Order
        </OnlineOrderLink>
      ) : loading ? (
        <Loader2 size={18} className="animate-spin text-ink-faint" />
      ) : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="relative aspect-[3/4] bg-sunken border border-line overflow-hidden">
            {current ? (
              <Image src={getMediaUrl(current)} alt={item.name} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-faint"><Store size={24} /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setPicked(url)}
                  aria-label={`Photo ${i + 1}`}
                  aria-pressed={url === current}
                  className={`relative aspect-square overflow-hidden border-2 cursor-pointer ${url === current ? 'border-taupe' : 'border-line hover:border-taupe/60'}`}
                >
                  <Image src={getMediaUrl(url)} alt="" fill sizes="80px" className="object-cover object-top" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {item.store?.name && <p className="text-sm font-semibold text-taupe">{item.store.name}</p>}
          {loading && !description ? (
            <Loader2 size={18} className="animate-spin text-ink-faint" />
          ) : description ? (
            <p className="text-sm text-ink-body leading-relaxed whitespace-pre-line">{description}</p>
          ) : (
            <p className="text-sm text-ink-faint">No description yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
