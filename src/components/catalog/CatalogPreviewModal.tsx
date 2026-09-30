'use client';

import { X, ExternalLink, Pencil } from 'lucide-react';
import Link from 'next/link';
import { CatalogItem } from './catalogHelpers';
import CatalogPreviewStats from './preview/CatalogPreviewStats';
import CatalogPreviewBody from './preview/CatalogPreviewBody';
import { CatalogItem as DetailItem } from '@/components/store-catalog-detail/types';

interface CatalogPreviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly item: CatalogItem | null;
  readonly storeSlug?: string;
}

// The body is the customer's Catalog Design Detail page, built from the same
// components — so what the owner previews is what customers actually get.
export default function CatalogPreviewModal({ isOpen, onClose, item, storeSlug }: CatalogPreviewModalProps) {
  if (!isOpen || !item) return null;

  // The owner list endpoint returns the same CatalogItem model (images with
  // view_angle, full taxonomy, linked service) as the public detail endpoint.
  const detailItem = item as unknown as DetailItem;

  return (
    <div className="fixed inset-0 bg-[#2D2A26]/80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in text-ink">
      <div className="bg-canvas w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh] border border-line animate-scale-up">
        <div className="px-4 sm:px-6 py-3 border-b border-line flex items-center justify-between gap-3 bg-white">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-taupe">Customer View Preview</p>
            <p className="text-sm text-ink-muted truncate">
              {item.is_active === false ? 'Hidden from customers — ' : ''}This is how the design page looks to customers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sunken rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          <CatalogPreviewStats item={item} />
          <CatalogPreviewBody key={item.id} item={detailItem} storeSlug={storeSlug ?? ''} />
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-line bg-white flex flex-wrap justify-end gap-3">
          {storeSlug && item.is_active !== false && (
            <Link
              href={`/store/${storeSlug}/catalog/${item.id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 h-11 border border-line hover:bg-canvas text-sm font-medium transition-colors"
            >
              <ExternalLink size={16} /> Open Public Page
            </Link>
          )}
          <Link
            href={`/dashboard/catalog/${item.id}`}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-5 h-11 text-sm font-medium transition-colors"
          >
            <Pencil size={16} /> Edit Design
          </Link>
        </div>
      </div>
    </div>
  );
}
