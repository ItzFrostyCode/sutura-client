import Link from 'next/link';
import Image from 'next/image';
import { MapPin, X, Check, Navigation } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { SavedLocation } from '@/lib/customerLocation';

interface SelectedBranchCardProps {
  branch: DiscoveryMapBranch | null;
  onClose: () => void;
  isSelectMode: boolean;
  userLocation: { lat: number; lng: number } | null;
  onConfirmLocation: (loc?: SavedLocation) => void;
}

export default function SelectedBranchCard({
  branch,
  onClose,
  isSelectMode,
  userLocation,
  onConfirmLocation,
}: SelectedBranchCardProps) {
  const gate = useGuestGatedHref();

  if (!branch) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 max-w-[599px] sm:max-w-xl mx-auto z-[1200] bg-surface border-t sm:border-x border-line rounded-t-2xl shadow-lg p-3 sm:p-4 space-y-2.5 animate-in slide-in-from-bottom-5 duration-150"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-2.5">
        <Link
          href={gate(`/store/${branch.storeSlug}`)}
          className="relative w-10 h-10 rounded-full overflow-hidden border border-line shrink-0 bg-sunken transition-transform active:scale-95 block"
          title="View Store"
        >
          {branch.storeLogoPath ? (
            <Image
              src={getMediaUrl(branch.storeLogoPath)}
              alt={branch.storeName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-ink-muted">
              {branch.storeName.charAt(0)}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={gate(`/store/${branch.storeSlug}`)}
              className="font-semibold text-xs text-ink truncate block hover:text-taupe transition-colors leading-tight"
            >
              {branch.storeName}
            </Link>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${
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
              {branch.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold text-ink leading-tight truncate">
              <MapPin size={11} className="text-taupe shrink-0" />
              <span className="truncate">
                {branch.address || branch.branchName}
              </span>
            </p>
            <p className="text-[10px] text-ink-muted pl-4 leading-tight truncate">
              {branch.district ? `${branch.district} District` : branch.city || 'Davao City'}
              {branch.landmark ? ` · Near ${branch.landmark}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 text-ink-faint hover:text-ink p-1 -mr-1 cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {isSelectMode ? (
        <button
          type="button"
          onClick={() =>
            onConfirmLocation({
              lat: branch.latitude,
              lng: branch.longitude,
              address: `${branch.storeName} - ${branch.address || branch.city || 'Davao City'}`,
              district: branch.district || branch.city || 'Davao City',
            })
          }
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-taupe text-white text-xs font-semibold hover:bg-taupe-hover transition-colors shadow-xs cursor-pointer"
        >
          <Check size={15} /> Choose this Store Location
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href={gate(`/store/${branch.storeSlug}/book`)}
            className="flex-1 bg-ink hover:bg-taupe text-white font-medium h-8 transition-colors flex items-center justify-center rounded-lg text-xs"
          >
            Book Now
          </Link>
          <a
            href={`https://www.google.com/maps/dir/?api=1&${
              userLocation ? `origin=${userLocation.lat},${userLocation.lng}&` : ''
            }destination=${branch.latitude},${branch.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium h-8 transition-colors flex items-center justify-center rounded-lg text-xs"
          >
            Direction
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
            className="px-2.5 h-8 border border-line hover:border-taupe text-taupe font-medium rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <Navigation size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
