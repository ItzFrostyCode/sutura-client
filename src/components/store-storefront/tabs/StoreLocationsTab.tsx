'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapPin, Phone, Clock, ExternalLink, Pencil, CheckCircle2 } from 'lucide-react';
import { StoreBranch, StoreProfile } from '../types';
import { getMediaUrl } from '@/lib/media';
import { getMapUrl } from '@/components/branches/branchHelpers';

const BranchesMap = dynamic(() => import('@/components/branches/BranchesMap'), {
  ssr: false,
  loading: () => (
    <div
      className="bg-canvas border border-line rounded-none p-10 flex flex-col items-center justify-center text-sm text-ink-muted"
      style={{ height: 380 }}
    >
      <MapPin className="w-8 h-8 text-taupe animate-pulse mb-2" />
      <p>Loading Davao City branch map…</p>
    </div>
  ),
});

interface StoreLocationsTabProps {
  readonly store: StoreProfile;
  readonly branches: StoreBranch[];
  readonly selectedBranchSlug: string | null;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onSelectBranch: (branch: StoreBranch) => void;
}

export default function StoreLocationsTab({
  store,
  branches,
  selectedBranchSlug,
  isOwnerViewingOwnStore,
  onSelectBranch,
}: StoreLocationsTabProps) {
  if (!branches || branches.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-none p-12 text-center text-ink-muted">
        <MapPin size={32} className="mx-auto text-taupe mb-3" />
        <h3 className="mobile-h3 font-semibold text-ink">No Physical Branches Listed</h3>
        <p className="mobile-body-sm text-ink-muted mt-1">
          This tailoring shop does not have registered branches yet.
        </p>
      </div>
    );
  }

  // Determine which branch is currently active (either via slug or default main branch)
  const activeBranch = branches.find((b) => b.slug && b.slug === selectedBranchSlug) ||
    branches.find((b) => Boolean(b.is_main)) ||
    branches[0];

  return (
    <section aria-labelledby="store-locations-title" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 id="store-locations-title" className="mobile-h2 text-ink">
            Davao City Branch Locations
          </h2>
          <p className="mobile-body-sm text-ink-muted mt-1">
            Explore physical branches of {store.name} across Davao City. Select a branch to view its profile or book a fitting.
          </p>
        </div>
        {isOwnerViewingOwnStore && (
          <Link
            href="/dashboard/branches"
            className="min-h-11 shrink-0 text-xs font-semibold text-taupe hover:underline flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
          >
            <Pencil size={13} /> Manage Branches
          </Link>
        )}
      </div>

      {/* Pinpointed Davao City Map — Single Clean Card without nested borders */}
      {/* Pinpointed Davao City Map — Single Clean Card without nested borders */}
      <div className="-mx-4 sm:mx-0">
        <BranchesMap
          branches={branches}
          initialSelectedId={activeBranch?.id ?? null}
          onSelectBranch={(b) => onSelectBranch(b)}
          height={420}
        />
      </div>

      {/* Branch Cards Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            All Physical Branches ({branches.length})
          </h3>
          {selectedBranchSlug && (
            <button
              type="button"
              onClick={() => {
                const main = branches.find((b) => Boolean(b.is_main)) || branches[0];
                onSelectBranch(main);
              }}
              className="text-xs text-taupe hover:underline font-medium cursor-pointer"
            >
              Reset to Main Branch
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-4 -mx-4 sm:mx-0">
          {branches.map((branch) => {
            const isCurrentlyActive = selectedBranchSlug
              ? branch.slug === selectedBranchSlug
              : Boolean(branch.is_main);

            const coverImage = branch.guide_image_url || store.banner_path || '/images/shop_storefront.jpg';

            return (
              <div
                key={branch.id}
                className={`bg-surface rounded-none border-y sm:border-x overflow-hidden flex flex-col transition-all duration-150 ${
                  isCurrentlyActive
                    ? 'border-ink shadow-sm'
                    : 'border-line hover:border-line-strong'
                }`}
              >
                {/* Storefront / Branch Image */}
                <div className="h-40 bg-sunken relative shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(coverImage)}
                    alt={`${store.name} - ${branch.name}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/shop_storefront.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

                  {/* Badges on Image */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    {isCurrentlyActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-none bg-ink text-white shadow-xs">
                        <CheckCircle2 size={12} className="text-emerald-400" /> Active Profile
                      </span>
                    ) : null}
                    {branch.is_main ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-none bg-amber-100 text-amber-900 border border-amber-300">
                        Main Branch (HQ)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-none bg-white/90 text-ink shadow-xs">
                        Satellite Branch
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-base font-bold text-ink leading-snug">
                        {store.name}
                      </h4>
                      <p className="text-sm font-semibold text-taupe">
                        {branch.name}
                      </p>
                    </div>

                    <p className="text-xs text-ink-body flex items-start gap-1.5 pt-1">
                      <MapPin size={14} className="shrink-0 text-taupe mt-0.5" />
                      <span>
                        {branch.address}
                        {branch.district ? `, ${branch.district}` : ''}, {branch.city}
                      </span>
                    </p>

                    {branch.contact_number && (
                      <p className="text-xs text-ink-muted flex items-center gap-1.5">
                        <Phone size={13} className="shrink-0 text-ink-muted" />
                        <span>{branch.contact_number}</span>
                      </p>
                    )}

                    <p className="text-xs text-ink-faint flex items-center gap-1.5">
                      <Clock size={13} className="shrink-0 text-ink-faint" />
                      <span>{branch.operating_hours || 'Mon - Fri 9:00 AM - 6:00 PM'}</span>
                    </p>
                  </div>

                  {/* Actions — Full Bleed Edge-to-Edge */}
                  <div className="mt-4 border-t border-line flex items-stretch bg-surface">
                    {isCurrentlyActive ? (
                      <div className="flex-1 flex items-center justify-center text-xs font-bold text-taupe bg-taupe/5 min-h-[44px]">
                        Active Branch
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectBranch(branch)}
                        className="flex-1 flex items-center justify-center text-xs font-semibold text-ink hover:bg-sunken transition-colors min-h-[44px] border-r border-line cursor-pointer"
                      >
                        View Profile
                      </button>
                    )}

                    <Link
                      href={`/store/${store.slug || store.id}/book?branch=${branch.id}`}
                      className="flex-1 flex items-center justify-center text-xs font-semibold text-ink hover:bg-sunken transition-colors min-h-[44px] border-r border-line cursor-pointer"
                    >
                      Book Fitting
                    </Link>

                    <a
                      href={getMapUrl(branch)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Directions in Google Maps"
                      className="w-[52px] flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sunken transition-colors min-h-[44px] shrink-0 cursor-pointer"
                    >
                      <MapPin size={16} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
