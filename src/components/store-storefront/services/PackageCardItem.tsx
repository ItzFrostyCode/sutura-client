import React from 'react';
import Link from 'next/link';
import { Package, Star } from 'lucide-react';
import { PublicServicePackage } from '../types';

interface PackageCardItemProps {
  readonly pkg: PublicServicePackage;
  readonly storeId: string;
}

export default function PackageCardItem({ pkg, storeId }: PackageCardItemProps) {
  const sumPrice = pkg.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0);
  const displayPrice = pkg.bundle_price ? Number(pkg.bundle_price) : sumPrice;

  return (
    <Link
      href={`/store/${storeId}/package/${pkg.id}`}
      aria-label={`View ${pkg.name} package details`}
      className="group flex flex-col justify-between w-full bg-surface border border-line hover:border-taupe transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-taupe"
    >
      <div className="aspect-4/3 w-full bg-taupe/10 relative overflow-hidden shrink-0 border-b border-line flex items-center justify-center">
        <Package size={32} className="text-taupe/50 transition-transform duration-500 group-hover:scale-110" />
      </div>

      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          {pkg.reviews_count ? (
            <div className="flex items-center gap-1 mb-1 h-3.5">
              <Star size={10} className="fill-amber-400 text-amber-500 shrink-0" />
              <span className="text-[10px] font-semibold text-ink">
                {Number(pkg.reviews_avg_rating ?? 0).toFixed(1)}
              </span>
              <span className="text-[10px] text-ink-faint">({pkg.reviews_count})</span>
            </div>
          ) : null}
          <span className="text-[9px] font-medium uppercase tracking-wide text-taupe truncate block">
            Package Deal
          </span>
          <h4 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 line-clamp-2">
            {pkg.name}
          </h4>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-2">
          <span className="text-xs font-bold text-ink truncate">Est. ₱{displayPrice.toLocaleString()}</span>

          <span className="flex items-center gap-1 text-[10px] text-ink-muted font-medium shrink-0 ml-1">
            <Package size={10} className="text-taupe shrink-0" />
            <span>
              {pkg.services.length} {pkg.services.length === 1 ? 'service' : 'services'}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
