import React from 'react';
import { Package } from 'lucide-react';
import { PublicServicePackage } from '../types';

interface PackageCardItemProps {
  readonly pkg: PublicServicePackage;
  readonly onSelect: (pkg: PublicServicePackage) => void;
}

export default function PackageCardItem({ pkg, onSelect }: PackageCardItemProps) {
  const sumPrice = pkg.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0);
  const displayPrice = pkg.bundle_price ? Number(pkg.bundle_price) : sumPrice;

  return (
    <div
      key={`package-${pkg.id}`}
      onClick={() => onSelect(pkg)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(pkg);
      }}
      role="button"
      tabIndex={0}
      className="group flex flex-col justify-between w-full bg-surface border border-line hover:border-taupe transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-taupe"
    >
      <div className="aspect-4/3 w-full bg-taupe/10 relative overflow-hidden shrink-0 border-b border-line flex items-center justify-center">
        <Package size={32} className="text-taupe/50 transition-transform duration-500 group-hover:scale-110" />
      </div>

      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-medium uppercase tracking-wide text-taupe truncate block">
            Package Deal
          </span>
          <h4 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug mt-0.5 line-clamp-2">
            {pkg.name}
          </h4>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-line/50 mt-2">
          <span className="text-xs font-bold text-ink truncate">₱{displayPrice.toLocaleString()}</span>

          <span className="flex items-center gap-1 text-[10px] text-ink-muted font-medium shrink-0 ml-1">
            <Package size={10} className="text-taupe shrink-0" />
            <span>
              {pkg.services.length} {pkg.services.length === 1 ? 'service' : 'services'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
