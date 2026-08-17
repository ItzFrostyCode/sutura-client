import React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Heart, Eye, Star, Image as ImageIcon, Clock } from 'lucide-react';
import { CatalogItem, formatCatalogPrice } from './catalogHelpers';
import Badge from '@/components/shared/Badge';
import { getMediaUrl } from '@/lib/media';

interface CatalogItemCardProps {
  readonly item: CatalogItem;
  readonly onView?: (id: number) => void;
  readonly onOpenDelete: (id: number) => void;
}

export default function CatalogItemCard({
  item,
  onView,
  onOpenDelete,
}: CatalogItemCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;

  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden group relative flex flex-col text-ink shadow-2xs hover:shadow-md transition-all">
      {/* Image Section */}
      <div className="aspect-3/4 bg-sunken relative overflow-hidden">
        {primaryImage && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(primaryImage)}
            alt={item.name}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${item.is_active === false ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF6F3] text-ink-muted">
            <ImageIcon size={36} className="text-ink-faint mb-1" />
            <span className="text-[10px] font-semibold text-ink-muted">No Image</span>
          </div>
        )}
        {item.is_active === false && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#2D2A26] rounded-full text-[10px] font-bold text-white uppercase tracking-wider z-20">
            Paused
          </div>
        )}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-white rounded-lg text-xs font-bold border border-line flex items-center gap-1.5 shadow-2xs">
          <span className="text-ink">{formatCatalogPrice(item.price)}</span>
        </div>

        <div className="absolute top-3 left-3 flex gap-2 z-20">
          <Link
            href={`/dashboard/catalog/${item.id}/edit`}
            className="p-1.5 bg-surface border border-line rounded-lg text-ink-body hover:text-taupe transition-colors shadow-2xs"
            title="Edit Design"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={e => {
              e.preventDefault();
              onOpenDelete(item.id);
            }}
            className="p-1.5 bg-surface border border-line rounded-lg text-ink-body hover:text-danger transition-colors cursor-pointer shadow-2xs"
            title="Delete Design"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 text-center z-10 translate-y-4 group-hover:translate-y-0">
          <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Material</h4>
          <p className="text-lg font-medium text-white mb-6">{item.material || 'Premium Fabric'}</p>

          <div className="flex flex-col gap-2.5 w-full max-w-[160px]">
            <Link
              href={`/dashboard/catalog/${item.id}`}
              className="w-full py-2 bg-canvas hover:bg-canvas/90 text-ink rounded-xl text-xs font-bold transition-all text-center"
            >
              View Overview
            </Link>
            <Link
              href={`/dashboard/catalog/${item.id}/edit`}
              className="w-full py-2 bg-taupe hover:bg-taupe text-white rounded-xl text-xs font-bold transition-all text-center"
            >
              Edit Design
            </Link>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 bg-white border-t border-line/60">
        <div className="flex items-center justify-between mb-1.5">
          <Badge variant="accent" icon={Clock}>
            Est. {item.estimated_days ?? 7} day{(item.estimated_days ?? 7) === 1 ? '' : 's'}
          </Badge>
        </div>
        <Link href={`/dashboard/catalog/${item.id}`} className="hover:text-taupe transition-colors">
          <h3 className="text-sm font-semibold text-ink truncate">{item.name}</h3>
        </Link>
        <p className="text-xs text-ink-muted mt-1 truncate">{item.material || 'No material specified'}</p>

        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-line/85">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#BCA89F] bg-[#BCA89F]/10 px-2 py-1 rounded-md">
              <Star size={12} className="fill-current" />
              <span className="text-[11px] font-semibold">
                {item.reviews_avg_rating ? item.reviews_avg_rating : '0.0'}{' '}
                <span className="text-ink-faint ml-0.5">({item.reviews_count || 0})</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-ink-muted text-[11px] font-medium">
              <span className="flex items-center gap-1 bg-sunken/50 px-2 py-1 rounded-md">
                <Eye size={12} /> {item.views_count || 0}
              </span>
              <span className="flex items-center gap-1 bg-sunken/50 px-2 py-1 rounded-md">
                <Heart size={12} className={item.saves_count > 0 ? 'fill-current text-danger' : ''} />{' '}
                {item.saves_count || 0}
              </span>
            </div>
          </div>

          {/* Sales Performance Row */}
          <div className="flex items-center justify-between text-xs text-ink-body border-t border-line/45 pt-2.5 bg-canvas/50 p-2 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider">Revenue</span>
              <span className="font-bold text-ink mt-0.5">₱{Number(item.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider">Sales</span>
              <span className="font-semibold text-taupe text-[10px] bg-taupe/10 px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wider">{item.order_count || 0} Orders</span>
            </div>
          </div>

          <Link
            href={`/dashboard/catalog/${item.id}`}
            className="w-full mt-1 bg-taupe hover:bg-[#8A7063] text-white py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
