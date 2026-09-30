import Link from 'next/link';
import Image from 'next/image';
import { Package as PackageIcon, Star } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import type { SearchPackageResult } from './types';

// A combo in search results — same card shape as a service, opens the package's own page.
export default function SearchPackageCard({ pkg, gate }: Readonly<{ pkg: SearchPackageResult; gate: (href: string) => string }>) {
  const sum = pkg.services.reduce((t, s) => t + (Number(s.base_price) || 0), 0);
  const price = pkg.bundle_price ? Number(pkg.bundle_price) : sum;
  const cat = pkg.service_category ? SERVICE_CATEGORY_LABELS[pkg.service_category as ServiceCategory] : null;
  const branch = pkg.store?.branches?.[0];
  const where = branch?.district ? `${branch.district}, Davao City` : (pkg.store?.name ?? 'Davao City');

  return (
    <Link
      href={gate(`/store/${pkg.store?.slug}/package/${pkg.id}`)}
      className="w-full h-full bg-surface border border-line hover:border-taupe transition-all flex flex-col overflow-hidden group active:scale-[0.98]"
    >
      <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
        {pkg.image_url ? (
          <Image src={getMediaUrl(pkg.image_url)} alt={pkg.name} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><PackageIcon size={26} className="text-taupe/40" /></div>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <h3 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug line-clamp-1">{pkg.name}</h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-taupe block truncate">Package deal{cat ? ` · ${cat}` : ''}</span>
        <p className="text-xs font-bold text-ink">₱{price.toLocaleString()}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
          <Star size={10} className="fill-amber-400 text-amber-500 shrink-0" />
          <span className="font-semibold text-ink">{pkg.reviews_avg_rating ? Number(pkg.reviews_avg_rating).toFixed(1) : '0.0'}</span>
          <span className="text-ink-faint">|</span>
          <span className="truncate">{pkg.services.length} services</span>
        </div>
        <p className="text-[10px] text-ink-faint truncate">{where}</p>
      </div>
    </Link>
  );
}
