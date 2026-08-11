import React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Heart, Eye, Star, Image as ImageIcon, Clock } from 'lucide-react';
import { CatalogItem, formatCatalogPrice } from './catalogHelpers';

interface CatalogItemCardProps {
  readonly item: CatalogItem;
  readonly onView: (id: number) => void;
  readonly onOpenDelete: (id: number) => void;
}

export default function CatalogItemCard({
  item,
  onView,
  onOpenDelete,
}: CatalogItemCardProps) {
  const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;

  return (
    <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden group relative flex flex-col shadow-lg shadow-black/20 text-[#2D2A26]">
      {/* Image Section */}
      <div className="aspect-3/4 bg-[#F0EAE3] relative overflow-hidden">
        {primaryImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={primaryImage}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${item.is_active === false ? 'grayscale opacity-60' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#827A73]">
            <ImageIcon size={32} />
          </div>
        )}
        {item.is_active === false && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#2D2A26]/90 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-sm z-20">
            Paused
          </div>
        )}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-xs font-bold shadow-sm border border-[#EBE6E0] flex items-center gap-1.5">
          <span className="text-[#2D2A26]">{formatCatalogPrice(item.price)}</span>
        </div>

        <div className="absolute top-3 left-3 flex gap-2 z-20">
          <Link
            href={`/dashboard/catalog/${item.id}/edit`}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[#524A44] hover:text-taupe transition-colors shadow-sm"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={e => {
              e.preventDefault();
              onOpenDelete(item.id);
            }}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[#524A44] hover:text-[#B26959] transition-colors shadow-sm cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm p-6 text-center z-10 translate-y-4 group-hover:translate-y-0">
          <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Material</h4>
          <p className="text-lg font-medium text-white mb-6">{item.material || 'Premium Fabric'}</p>

          <div className="flex flex-col gap-2.5 w-full max-w-[160px]">
            <button
              onClick={(e) => {
                e.preventDefault();
                onView(item.id);
              }}
              className="w-full py-2 bg-[#FAF6F3] hover:bg-[#FAF6F3]/90 text-[#2D2A26] rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              View Details
            </button>
            <Link
              href={`/dashboard/catalog/${item.id}/edit`}
              className="w-full py-2 bg-taupe hover:bg-[#9A8073] text-white rounded-xl text-xs font-bold transition-all shadow-md text-center"
            >
              Edit Design
            </Link>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 bg-white border-t border-[#EBE6E0]/60">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#9A8073] bg-[#9A8073]/10 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Clock size={10} /> Est. {item.estimated_days ?? 7} day{(item.estimated_days ?? 7) === 1 ? '' : 's'}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-[#2D2A26] truncate">{item.name}</h3>
        <p className="text-xs text-[#827A73] mt-1 truncate">{item.material || 'No material specified'}</p>

        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-[#EBE6E0]/85">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#BCA89F] bg-[#BCA89F]/10 px-2 py-1 rounded-md">
              <Star size={12} className="fill-current" />
              <span className="text-[11px] font-semibold">
                {item.reviews_avg_rating ? item.reviews_avg_rating : '0.0'}{' '}
                <span className="text-[#A8A19A] ml-0.5">({item.reviews_count || 0})</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#827A73] text-[11px] font-medium">
              <span className="flex items-center gap-1 bg-[#F0EAE3]/50 px-2 py-1 rounded-md">
                <Eye size={12} /> {item.views_count || 0}
              </span>
              <span className="flex items-center gap-1 bg-[#F0EAE3]/50 px-2 py-1 rounded-md">
                <Heart size={12} className={item.saves_count > 0 ? 'fill-current text-[#B26959]' : ''} />{' '}
                {item.saves_count || 0}
              </span>
            </div>
          </div>

          {/* Sales Performance Row */}
          <div className="flex items-center justify-between text-xs text-[#524A44] border-t border-[#EBE6E0]/45 pt-2.5 bg-[#FAF6F3]/50 p-2 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[#827A73] uppercase tracking-wider">Revenue</span>
              <span className="font-bold text-[#2D2A26] mt-0.5">₱{Number(item.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-[#827A73] uppercase tracking-wider">Sales</span>
              <span className="font-semibold text-taupe text-[10px] bg-taupe/10 px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wider">{item.order_count || 0} Orders</span>
            </div>
          </div>

          <button
            onClick={() => onView(item.id)}
            className="w-full mt-1 bg-taupe hover:bg-taupe/90 text-white py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
