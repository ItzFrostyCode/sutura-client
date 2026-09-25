import Link from 'next/link';
import Image from 'next/image';
import { MapPin, X, Check, Navigation, ArrowLeft, ExternalLink } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { SavedLocation } from '@/lib/customerLocation';

interface MapSidebarSelectedStoreProps {
  branch: DiscoveryMapBranch;
  onClose: () => void;
  isSelectMode: boolean;
  userLocation: { lat: number; lng: number } | null;
  onConfirmLocation: (loc?: SavedLocation) => void;
}

export default function MapSidebarSelectedStore({
  branch,
  onClose,
  isSelectMode,
  userLocation,
  onConfirmLocation,
}: MapSidebarSelectedStoreProps) {
  const gate = useGuestGatedHref();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 animate-in fade-in-50 duration-150">
      {/* Back / Close Action Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} /> Back to all stores
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="text-ink-faint hover:text-ink p-1 rounded-md hover:bg-sunken cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Store Header & Logo */}
      <div className="flex items-start gap-3">
        <Link
          href={gate(`/store/${branch.storeSlug}`)}
          className="relative w-12 h-12 rounded-xl overflow-hidden border border-line shrink-0 bg-sunken transition-transform active:scale-95 block"
        >
          {branch.storeLogoPath ? (
            <Image
              src={getMediaUrl(branch.storeLogoPath)}
              alt={branch.storeName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-ink-muted">
              {branch.storeName.charAt(0)}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={gate(`/store/${branch.storeSlug}`)}
              className="font-bold text-sm text-ink hover:text-taupe transition-colors inline-flex items-center gap-1"
            >
              {branch.storeName}
              <ExternalLink size={12} className="text-ink-faint" />
            </Link>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
              branch.isOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                branch.isOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
              }`}
            />
            {branch.isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Location Details Box */}
      <div className="bg-surface rounded-xl border border-line p-3 space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-taupe shrink-0 mt-0.5" />
          <div className="text-ink-body leading-relaxed">
            <p className="font-semibold text-ink">
              {branch.address || (branch.isMain ? 'Main Branch' : branch.branchName)}
            </p>
            <p className="text-ink-muted">
              {branch.district ? `${branch.district} District` : branch.city || 'Davao City'}
              {branch.isMain ? ` (${branch.branchName})` : ''}
            </p>
            {branch.landmark && (
              <p className="text-[11px] text-ink-faint italic mt-0.5">
                Landmark: {branch.landmark}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-1 space-y-2">
        {isSelectMode ? (
          <button
            type="button"
            onClick={() =>
              onConfirmLocation({
                lat: branch.latitude,
                lng: branch.longitude,
                address: `${branch.storeName} - ${branch.address || branch.city || 'Davao City'}`,
                district: branch.city || 'Davao City',
              })
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-taupe text-white text-xs font-semibold hover:bg-taupe-hover transition-colors shadow-xs cursor-pointer"
          >
            <Check size={16} /> Choose this Store Location
          </button>
        ) : (
          <div className="space-y-2">
            <Link
              href={gate(`/store/${branch.storeSlug}/book`)}
              className="w-full bg-ink hover:bg-taupe text-white font-semibold h-9 transition-colors flex items-center justify-center rounded-xl text-xs shadow-xs"
            >
              Book Now
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&${
                  userLocation ? `origin=${userLocation.lat},${userLocation.lng}&` : ''
                }destination=${branch.latitude},${branch.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium h-8 transition-colors flex items-center justify-center rounded-lg text-xs"
              >
                Directions
              </a>
              <button
                type="button"
                onClick={() =>
                  onConfirmLocation({
                    lat: branch.latitude,
                    lng: branch.longitude,
                    address: `${branch.storeName} - ${branch.address || branch.city || 'Davao City'}`,
                    district: branch.city || 'Davao City',
                  })
                }
                title="Set as My Location"
                className="px-3 h-8 border border-line hover:border-taupe text-taupe font-medium rounded-lg text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Navigation size={12} /> Set as Location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
