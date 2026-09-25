'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Scissors, Eye, EyeOff, Edit3, Trash2, Clock, ExternalLink, Loader2
} from 'lucide-react';
import { formatCatalogPrice } from '../catalogHelpers';
import { DetailedCatalogItem } from './detailTypes';

interface CatalogItemHeaderProps {
  item: DetailedCatalogItem;
  storeSlug?: string;
  togglingStatus: boolean;
  onToggleStatus: () => void;
  onOpenDeleteModal: () => void;
}

export default function CatalogItemHeader({
  item,
  storeSlug,
  togglingStatus,
  onToggleStatus,
  onOpenDeleteModal,
}: CatalogItemHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/catalog')}
          className="h-10 w-10 rounded-xl bg-canvas border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer mt-0.5"
          title="Back to Catalog"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{item.name}</h1>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                item.is_active !== false
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
            >
              {item.is_active !== false ? 'Active' : 'Paused'}
            </span>
            {item.garment_type && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-sunken text-ink-muted border border-line capitalize">
                {item.garment_type.replaceAll('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
            <span className="font-semibold text-ink">{formatCatalogPrice(item.price)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-taupe" /> Est. {item.estimated_days ?? 7} days
            </span>
            {item.material && (
              <>
                <span>•</span>
                <span>{item.material}</span>
              </>
            )}
            {storeSlug && (
              <>
                <span>•</span>
                <a
                  href={`/store/${storeSlug}?tab=catalog`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-taupe hover:underline"
                >
                  <span>Storefront View</span>
                  <ExternalLink size={12} />
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
        <Link
          href={`/dashboard/jobs/new?catalog_item_id=${item.id}`}
          className="px-4 py-2 rounded-xl bg-taupe hover:bg-[#8A7063] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs"
          title="Create a tailored job order from this design"
        >
          <Scissors size={14} />
          <span>Tailor this Design</span>
        </Link>
        <button
          type="button"
          onClick={onToggleStatus}
          disabled={togglingStatus}
          className="px-3.5 py-2 rounded-xl bg-canvas hover:bg-sunken border border-line text-ink-body font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          title={item.is_active !== false ? 'Pause listing' : 'Activate listing'}
        >
          {togglingStatus ? (
            <Loader2 size={14} className="animate-spin" />
          ) : item.is_active !== false ? (
            <>
              <EyeOff size={14} className="text-ink-muted" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Eye size={14} className="text-emerald-600" />
              <span>Activate</span>
            </>
          )}
        </button>
        <Link
          href={`/dashboard/catalog/${item.id}/edit`}
          className="px-4 py-2 rounded-xl bg-canvas hover:bg-sunken border border-line text-ink font-semibold text-xs transition-all flex items-center gap-1.5"
        >
          <Edit3 size={14} className="text-taupe" />
          <span>Edit Design</span>
        </Link>
        <button
          type="button"
          onClick={onOpenDeleteModal}
          className="p-2 rounded-xl bg-canvas hover:bg-red-50 border border-line hover:border-red-200 text-ink-muted hover:text-red-600 transition-all cursor-pointer"
          title="Delete design"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
