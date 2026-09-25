import Image from 'next/image';
import { MapPin, Store, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';

interface MapSidebarStoreListProps {
  branches: DiscoveryMapBranch[];
  selectedBranch: DiscoveryMapBranch | null;
  onSelectBranch: (branch: DiscoveryMapBranch) => void;
  loading: boolean;
}

export default function MapSidebarStoreList({
  branches,
  selectedBranch,
  onSelectBranch,
  loading,
}: MapSidebarStoreListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-xs text-ink-muted">
        Loading stores…
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-ink-muted space-y-2">
        <Store size={28} className="text-ink-faint" />
        <p className="text-xs font-medium text-ink">No stores found</p>
        <p className="text-[11px] text-ink-faint max-w-xs">
          Try clearing your search query or selecting a different district.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-line/60">
      <div className="p-2 space-y-1.5">
        {branches.map((b) => {
          const isSelected =
            selectedBranch?.storeSlug === b.storeSlug && selectedBranch?.branchId === b.branchId;

          return (
            <button
              key={`${b.storeSlug}-${b.branchId}`}
              type="button"
              onClick={() => onSelectBranch(b)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                isSelected
                  ? 'bg-surface border-taupe shadow-xs ring-1 ring-taupe'
                  : 'bg-canvas hover:bg-surface border-line/70 hover:border-line'
              }`}
            >
              {/* Store Avatar */}
              <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
                {b.storeLogoPath ? (
                  <Image
                    src={getMediaUrl(b.storeLogoPath)}
                    alt={b.storeName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-ink-muted">
                    {b.storeName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Store Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-ink truncate block">
                    {b.storeName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                      b.isOpen
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-rose-700 bg-rose-50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        b.isOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'
                      }`}
                    />
                    {b.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>

                <div className="mt-1 space-y-0.5">
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-ink leading-tight truncate">
                    <MapPin size={10} className="text-taupe shrink-0" />
                    <span className="truncate">
                      {b.address || (b.isMain ? 'Main Branch' : b.branchName)}
                    </span>
                  </p>
                  <p className="text-[10px] text-ink-muted pl-3.5 leading-tight truncate">
                    {b.district ? `${b.district} District` : b.city || 'Davao City'}
                  </p>
                </div>
              </div>

              <ChevronRight size={14} className="text-ink-faint shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
