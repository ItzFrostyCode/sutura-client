'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Copy, Check, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { Service } from '@/components/services/serviceHelpers';
import { getActiveSale } from '@/lib/salePricing';
import { CatalogItem } from '@/components/catalog/catalogHelpers';

interface PromoPostModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  // Services have a sale-price mechanism this modal was originally built
  // around ("PROMO! Limited Time Offer"). Catalog items dropped sale/rental
  // fields entirely when the catalog became made-to-order-only, so opening
  // this same modal from the Catalog page against the services endpoint
  // always came up empty — there was nothing to ever be "on sale". 'catalog'
  // mode fetches catalog items instead and builds a showcase-style caption
  // (no discount framing) around whichever items the owner picks.
  readonly mode?: 'services' | 'catalog';
}

interface SelectableImage {
  key: string;
  url: string;
  label: string;
  checked: boolean;
}

const DEFAULT_VALUE_PROPS = [
  'Premium Quality',
  'Customizable Designs',
  'Perfect for Teams, Events & Souvenirs',
  'Cash on Delivery Available',
];

export default function PromoPostModal({ isOpen, onClose, mode = 'services' }: PromoPostModalProps) {
  const { shop } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<SelectableImage[]>([]);
  const [valueProps, setValueProps] = useState(DEFAULT_VALUE_PROPS.join('\n'));
  const [ctaLine, setCtaLine] = useState('Message us now to order!');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !shop?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    if (mode === 'catalog') {
      api.get(`/shops/${shop.id}/catalog`).then((res) => {
        const items: CatalogItem[] = res.data.data || [];
        setCatalogItems(items.filter(i => i.is_active !== false));
        setLoading(false);
      }).catch(() => setLoading(false));
      return;
    }
    api.get(`/shops/${shop.id}/services`).then((servicesRes) => {
      const svcItems: Service[] = servicesRes.data.data || [];
      setServices(svcItems.filter(s => getActiveSale({ price: s.base_price ?? 0, sale_price: s.sale_price, sale_starts_at: s.sale_starts_at, sale_ends_at: s.sale_ends_at })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isOpen, shop, mode]);

  // Default all active-sale items (or, in catalog mode, all active catalog
  // items) checked, and default-select each item's photo, whenever the
  // fetched set changes.
  useEffect(() => {
    if (loading) return;

    if (mode === 'catalog') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckedItems(new Set(catalogItems.map(i => `catalog-${i.id}`)));
      const imgs: SelectableImage[] = [];
      catalogItems.forEach(item => {
        const primary = item.images.find(im => im.is_primary) || item.images[0];
        if (primary) {
          imgs.push({ key: `catalog-img-${item.id}`, url: primary.image_url, label: item.name, checked: true });
        }
      });
      setImages(imgs);
      return;
    }

    const keys = services.map(s => `service-${s.id}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckedItems(new Set(keys));

    const imgs: SelectableImage[] = [];
    services.forEach(svc => {
      if (svc.image_url) {
        imgs.push({ key: `svc-img-${svc.id}`, url: svc.image_url, label: svc.name, checked: true });
      }
    });
    setImages(imgs);
  }, [loading, services, catalogItems, mode]);

  const toggleItem = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleImage = (key: string) => {
    setImages(prev => prev.map(im => im.key === key ? { ...im, checked: !im.checked } : im));
  };

  const caption = useMemo(() => {
    if (mode === 'catalog') {
      const lines: string[] = ['NEW DESIGN DROP!', 'Now available at our Design Catalog:', ''];

      catalogItems.filter(i => checkedItems.has(`catalog-${i.id}`)).forEach(item => {
        lines.push(`${item.name} - ₱${Number(item.price).toLocaleString()}`);
      });

      const props = valueProps.split('\n').map(p => p.trim()).filter(Boolean);
      if (props.length > 0) {
        lines.push('');
        props.forEach(p => lines.push(`- ${p}`));
      }

      if (ctaLine.trim()) {
        lines.push('');
        lines.push(ctaLine.trim());
      }

      return lines.join('\n');
    }

    const lines: string[] = ['PROMO!', 'Limited Time Offer - Grab Yours Now!', ''];

    let earliestEnd: number | null = null;

    services.filter(s => checkedItems.has(`service-${s.id}`)).forEach(svc => {
      const sale = getActiveSale({ price: svc.base_price ?? 0, sale_price: svc.sale_price, sale_starts_at: svc.sale_starts_at, sale_ends_at: svc.sale_ends_at });
      if (!sale) return;
      lines.push(`${svc.name} - ₱${sale.sale.toLocaleString()} (from ₱${sale.original.toLocaleString()})`);
      if (svc.sale_ends_at) {
        const t = new Date(svc.sale_ends_at).getTime();
        if (earliestEnd === null || t < earliestEnd) earliestEnd = t;
      }
    });

    if (earliestEnd !== null) {
      lines.push('');
      const d = new Date(earliestEnd);
      lines.push(`Promo Until: ${d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`);
    }

    const props = valueProps.split('\n').map(p => p.trim()).filter(Boolean);
    if (props.length > 0) {
      lines.push('');
      props.forEach(p => lines.push(`- ${p}`));
    }

    if (ctaLine.trim()) {
      lines.push('');
      lines.push(ctaLine.trim());
    }

    return lines.join('\n');
  }, [mode, services, catalogItems, checkedItems, valueProps, ctaLine]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasAnySale = mode === 'catalog' ? catalogItems.length > 0 : services.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Promo Post" maxWidth="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#A8A19A]">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : !hasAnySale ? (
        <div className="text-center py-12 text-sm text-[#827A73]">
          {mode === 'catalog'
            ? 'No active catalog items to promote yet. Add one to your Design Catalog first.'
            : 'No services are currently on sale. Set a Sale Price on a Service first.'}
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <span className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-2">Include in Post</span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-[#EBE6E0] rounded-lg p-2">
              {mode === 'catalog' ? catalogItems.map(item => (
                <label key={`catalog-${item.id}`} className="flex items-center gap-2 text-sm px-1.5 py-1 rounded hover:bg-[#FAF6F3] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(`catalog-${item.id}`)}
                    onChange={() => toggleItem(`catalog-${item.id}`)}
                    className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-[#2D2A26] font-semibold text-xs">₱{Number(item.price).toLocaleString()}</span>
                </label>
              )) : services.map(svc => {
                const sale = getActiveSale({ price: svc.base_price ?? 0, sale_price: svc.sale_price, sale_starts_at: svc.sale_starts_at, sale_ends_at: svc.sale_ends_at });
                if (!sale) return null;
                return (
                  <label key={`service-${svc.id}`} className="flex items-center gap-2 text-sm px-1.5 py-1 rounded hover:bg-[#FAF6F3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkedItems.has(`service-${svc.id}`)}
                      onChange={() => toggleItem(`service-${svc.id}`)}
                      className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                    />
                    <span className="flex-1 truncate">{svc.name}</span>
                    <span className="text-[#A8A19A] line-through text-xs">₱{sale.original.toLocaleString()}</span>
                    <span className="text-rose-600 font-semibold text-xs">₱{sale.sale.toLocaleString()}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="promo-value-props" className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-2">
              Value Props <span className="font-normal normal-case text-[#A8A19A]">(one per line, editable)</span>
            </label>
            <textarea
              id="promo-value-props"
              value={valueProps}
              onChange={e => setValueProps(e.target.value)}
              rows={4}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe resize-none"
            />
          </div>

          <div>
            <label htmlFor="promo-cta" className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-2">Call to Action</label>
            <input
              id="promo-cta"
              type="text"
              value={ctaLine}
              onChange={e => setCtaLine(e.target.value)}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-2">Preview</span>
            <pre className="whitespace-pre-wrap bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-4 text-sm text-[#2D2A26] font-sans">{caption}</pre>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-2 flex items-center gap-2 bg-[#2D2A26] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy Caption'}
            </button>
          </div>

          {images.length > 0 && (
            <div>
              <span className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-2">
                Photos to Attach <span className="font-normal normal-case text-[#A8A19A]">(tap to toggle, then save/download to attach on Facebook)</span>
              </span>
              <div className="grid grid-cols-4 gap-2">
                {images.map(img => (
                  <button
                    key={img.key}
                    type="button"
                    onClick={() => toggleImage(img.key)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${img.checked ? 'border-taupe' : 'border-transparent opacity-50'}`}
                    title={img.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    <span className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center ${img.checked ? 'bg-taupe text-white' : 'bg-white/80 text-[#A8A19A]'}`}>
                      {img.checked ? <Check size={12} /> : <ImageIcon size={10} />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {images.filter(i => i.checked).map(img => (
                  <a
                    key={img.key}
                    href={img.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-taupe hover:underline"
                  >
                    <Download size={12} /> {img.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
