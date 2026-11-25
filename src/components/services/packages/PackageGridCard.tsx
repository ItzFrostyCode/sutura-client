import Link from 'next/link';
import Image from 'next/image';
import { Package as PackageIcon } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { ServicePackage } from '../serviceHelpers';
import { pricedTotal } from './packageEditing';

// The owner's card for a combo: same shape as a service card, one tap opens the package's own page.
export default function PackageGridCard({ pkg }: Readonly<{ pkg: ServicePackage }>) {
  const price = pkg.bundle_price ? Number(pkg.bundle_price) : pricedTotal(pkg.services);
  const paused = !pkg.is_active;
  return (
    <Link
      href={`/dashboard/services/packages/${pkg.id}`}
      className="w-full h-full bg-surface border border-line hover:border-taupe transition-all duration-300 flex flex-col overflow-hidden group active:scale-[0.98]"
    >
      <div className="aspect-4/3 w-full bg-sunken relative overflow-hidden shrink-0 border-b border-line">
        {paused && <div className="absolute top-1.5 left-1.5 z-10 px-2 py-0.5 bg-ink/85 text-white text-[9px] font-bold uppercase tracking-wider">Paused</div>}
        {pkg.image_url ? (
          <Image src={getMediaUrl(pkg.image_url)} alt={pkg.name} fill className={`object-cover object-top transition-transform duration-500 group-hover:scale-105 ${paused ? 'grayscale opacity-60' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><PackageIcon size={26} className="text-taupe/40" /></div>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <h3 className="text-xs font-semibold text-ink group-hover:text-taupe transition-colors leading-snug line-clamp-1">{pkg.name}</h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-taupe block">Package deal</span>
        <p className="text-xs font-bold text-ink">₱{price.toLocaleString()}</p>
        <p className="text-[10px] text-ink-muted flex items-center gap-1">
          <PackageIcon size={10} className="text-taupe shrink-0" />
          {pkg.services.length} {pkg.services.length === 1 ? 'service' : 'services'}
        </p>
      </div>
    </Link>
  );
}
