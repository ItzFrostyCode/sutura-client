'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scissors, Eye, EyeOff, Trash2, Loader2 } from 'lucide-react';
import { DetailedCatalogItem } from './detailTypes';

interface CatalogItemHeaderProps {
  item: DetailedCatalogItem;
  togglingStatus: boolean;
  onToggleStatus: () => void;
  onOpenDeleteModal: () => void;
  onBack: () => void;
  /** Design actions (Tailor / Pause / Delete) belong to the Overview tab only. */
  showActions?: boolean;
}

const ICON_BTN =
  'h-11 min-w-11 px-3 border border-line bg-white hover:bg-sunken text-ink text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer';

// Just navigation + actions. The design's name, price, category and status
// already show in the page below, exactly as customers see them.
export default function CatalogItemHeader({
  item,
  togglingStatus,
  onToggleStatus,
  onOpenDeleteModal,
  onBack,
  showActions = true,
}: CatalogItemHeaderProps) {
  const isActive = item.is_active !== false;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to catalog"
        title="Back to catalog"
        className="w-11 h-11 rounded-full bg-ink text-white hover:bg-ink/85 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
      >
        <ArrowLeft size={18} />
      </button>

      {showActions && !isActive && (
        <span className="text-[11px] px-2.5 py-1 font-bold uppercase tracking-wider border bg-zinc-100 text-zinc-600 border-zinc-200">
          Paused
        </span>
      )}

      {showActions && (
      <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
        <Link
          href={`/dashboard/jobs/new?catalog_item_id=${item.id}&return=${encodeURIComponent(`/dashboard/catalog/${item.id}`)}`}
          className="h-11 px-4 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold transition-colors flex items-center gap-2"
          title="Create a tailored job order from this design"
        >
          <Scissors size={16} />
          <span>Tailor this Design</span>
        </Link>

        <button
          type="button"
          onClick={onToggleStatus}
          disabled={togglingStatus}
          aria-label={isActive ? 'Pause listing' : 'Activate listing'}
          title={isActive ? 'Pause listing' : 'Activate listing'}
          className={`${ICON_BTN} disabled:opacity-50`}
        >
          {togglingStatus ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isActive ? (
            <EyeOff size={16} className="text-ink-muted" />
          ) : (
            <Eye size={16} className="text-emerald-600" />
          )}
          <span className="hidden sm:inline">{isActive ? 'Pause' : 'Activate'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenDeleteModal}
          aria-label="Delete design"
          title="Delete design"
          className="w-11 h-11 border border-line bg-white text-ink-muted hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>
      )}
    </div>
  );
}
