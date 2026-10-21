import Link from 'next/link';
import { Star, MapPin, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { isStoreOpen } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { type StoreResult } from './storesTypes';

export default function StoreCard({ store }: Readonly<{ store: StoreResult }>) {
  const gate = useGuestGatedHref();
  const isOpen = isStoreOpen(store.operating_hours);
  const branch = store.branches[0];
  const locationLabel = branch?.district ?? branch?.city ?? branch?.name ?? 'Davao City';

  return (
    <Link
      href={gate(`/store/${store.slug}`)}
      className="bg-surface border border-line rounded-xl sm:rounded-2xl overflow-hidden hover:border-line-strong hover:shadow-md transition-all flex flex-col group"
    >
      {/* Banner Cover with subtle gradient fallback & status pill */}
      <div className="h-28 sm:h-32 bg-sunken relative shrink-0 overflow-hidden">
        {store.banner_path ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={getMediaUrl(store.banner_path)}
            alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#FAF7F4] to-[#ECE7E1] flex items-center justify-center">
            <Store size={26} className="text-taupe/40" />
          </div>
        )}

        {/* Live Open / Closed Status Pill */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-xs border ${
              isOpen
                ? 'bg-white/90 text-emerald-700 border-emerald-200'
                : 'bg-white/90 text-ink-muted border-line'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-ink-muted/50'}`} />
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Card Content: Logo placed cleanly INSIDE the layout beside the store name */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start gap-3">
            <StoreLogoAvatar
              src={store.logo_path}
              name={store.name}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-line bg-surface shadow-2xs shrink-0 transition-transform group-hover:scale-105"
              textClassName="text-base font-bold text-taupe"
            />
            <div className="min-w-0 flex-1">
              <h3 className="mobile-h4 font-bold text-ink group-hover:text-taupe transition-colors truncate leading-tight">
                {store.name}
              </h3>
              <p className="mobile-caption text-ink-muted flex items-center gap-1 mt-1 truncate font-normal">
                <MapPin size={12} className="shrink-0 text-taupe" />
                <span className="truncate">{locationLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer: Rating & Visit CTA */}
        <div className="flex items-center justify-between gap-1 mt-4 pt-3 border-t border-line/60">
          <div className="flex items-center gap-1.5">
            <Star size={13} className="text-[#D97706] fill-[#D97706]" />
            <span className="text-xs font-bold text-ink">
              {store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New'}
            </span>
            <span className="text-xs text-ink-faint font-normal">({store.reviews_count})</span>
          </div>
          <span className="text-xs font-semibold text-taupe flex items-center gap-1 group-hover:text-ink transition-colors">
            <span>Visit</span>
            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

