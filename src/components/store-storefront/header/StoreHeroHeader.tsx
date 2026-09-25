import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  MapPin,
  Star,
  Bookmark,
  Pencil,
  Calendar,
  Clock,
  Phone,
  LayoutDashboard,
} from 'lucide-react';
import { StoreProfile, StoreBranch, StorefrontTab } from '../types';
import { getMediaUrl } from '@/lib/media';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';

interface StoreHeroHeaderProps {
  readonly store: StoreProfile;
  readonly storeId: string;
  readonly isStoreCurrentlyOpen: boolean;
  readonly activeBranch?: StoreBranch;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onEditProfile: () => void;
  readonly tabList: { id: StorefrontTab; label: string }[];
  readonly activeTab: StorefrontTab;
  readonly setActiveTab: (tab: StorefrontTab) => void;
  readonly tabBarRef: React.RefObject<HTMLDivElement | null>;
  readonly myReview: { id?: number; rating: number; comment?: string | null } | null;
  readonly onOpenRatingModal: () => void;
  readonly isBookmarked: boolean;
  readonly setIsBookmarked: React.Dispatch<React.SetStateAction<boolean>>;
  readonly onOpenMap?: () => void;
}

// Clean address deduplication to avoid repetitive "Poblacion, Poblacion, Davao City"
function formatCleanAddress(branch?: StoreBranch | null, store?: StoreProfile | null): string {
  if (branch) {
    const parts: string[] = [];
    if (branch.address) parts.push(branch.address);
    if (branch.district && !branch.address?.toLowerCase().includes(branch.district.toLowerCase())) {
      parts.push(branch.district);
    }
    if (branch.city && !branch.address?.toLowerCase().includes(branch.city.toLowerCase())) {
      parts.push(branch.city);
    }
    return parts.length > 0 ? parts.join(', ') : 'Davao City';
  }
  const parts: string[] = [];
  if (store?.address) parts.push(store.address);
  if (store?.district && !store.address?.toLowerCase().includes(store.district.toLowerCase())) {
    parts.push(store.district);
  }
  if (store?.city && !store.address?.toLowerCase().includes(store.city.toLowerCase())) {
    parts.push(store.city);
  }
  return parts.length > 0 ? parts.join(', ') : 'Davao City';
}

export default function StoreHeroHeader({
  store,
  storeId,
  isStoreCurrentlyOpen,
  activeBranch,
  isOwnerViewingOwnStore,
  onEditProfile,
  tabList,
  activeTab,
  setActiveTab,
  tabBarRef,
  myReview,
  onOpenRatingModal,
  isBookmarked,
  setIsBookmarked,
  onOpenMap,
}: StoreHeroHeaderProps) {
  const cleanAddress = formatCleanAddress(activeBranch, store);

  return (
    <>
      {/* 📸 1. Cover Banner Image */}
      <div className="h-48 sm:h-64 md:h-72 w-full max-w-7xl mx-auto bg-surface px-0 sm:px-8">
        <div className="relative w-full h-full overflow-hidden">
          {(activeBranch?.guide_image_url || store.banner_path) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getMediaUrl(activeBranch?.guide_image_url || store.banner_path || '')}
              alt={activeBranch?.name ? `${store.name} - ${activeBranch.name}` : store.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Image
              src="/images/hero_banner.jpg"
              alt={store.name}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
        </div>
      </div>

      {/* Special Hours Alert Banner (if active) */}
      {(store.active_special_hours?.announcement_message ||
        store.active_special_hours?.announcement_image_url) && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-3 px-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            {store.active_special_hours.announcement_image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={store.active_special_hours.announcement_image_url}
                alt=""
                className="w-10 h-10 object-cover border border-amber-200 shrink-0"
              />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div className="text-xs font-medium">
              <span className="font-bold mr-1">{store.active_special_hours.title}:</span>
              {store.active_special_hours.announcement_message}
            </div>
          </div>
        </div>
      )}

      {/* 👤 2. Profile Details Container (Centered Social Profile Layout) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8">
        <div className="relative flex flex-col items-center text-center pb-2">
          {/* Centered Avatar Overlapping Cover Banner */}
          <div className="-mt-14 sm:-mt-18 md:-mt-20 relative z-10 flex justify-center">
            <StoreLogoAvatar
              src={store.logo_path}
              name={store.name}
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 border-surface bg-surface shadow-xl overflow-hidden shrink-0"
              isOpen={isStoreCurrentlyOpen}
            />
          </div>

          {/* Main Store Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-ink mt-3 tracking-tight">
            {store.name}
          </h1>

          {/* Subtitle Metadata (Branch, Owner, Ratings) */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-ink-muted mt-1.5 font-normal">
            {activeBranch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-taupe/15 text-taupe font-semibold text-xs">
                <MapPin size={11} /> {activeBranch.name}
                {Boolean(activeBranch.is_main) ? ' · Main HQ' : ''}
              </span>
            )}
            <span className="text-ink-faint">·</span>
            <span>
              Store Owner · <strong className="font-semibold text-ink-body">{store.owner?.name || 'Store Owner'}</strong>
            </span>
            <span className="text-ink-faint">·</span>
            {store.reviews_count && store.reviews_count > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-ink-body">
                <Star size={13} className="fill-amber-400 text-amber-500 shrink-0" />
                {Number(store.reviews_avg_rating ?? 0).toFixed(1)}
                <span className="text-ink-faint font-normal">({store.reviews_count})</span>
              </span>
            ) : (
              <span className="text-ink-faint font-normal">No ratings yet</span>
            )}
          </div>

          {/* ⚡ 3. Centered Action Buttons Row */}
          <div className="flex items-center justify-center gap-2 mt-4 max-w-md w-full">
            {isOwnerViewingOwnStore ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex-1 min-h-[46px] px-5 py-2.5 bg-ink hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="min-h-[46px] px-4 py-2.5 bg-sunken hover:bg-line border border-line text-ink text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Pencil size={15} />
                  <span>Edit Profile</span>
                </button>
                <AccountHeaderMenu />
              </>
            ) : (
              <>
                <Link
                  href={activeBranch ? `/store/${storeId}/book?branch=${activeBranch.id}` : `/store/${storeId}/book`}
                  className="flex-1 min-h-[46px] px-6 py-2.5 bg-ink hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Calendar size={16} />
                  <span>Book Appointment</span>
                </Link>

                <button
                  type="button"
                  onClick={onOpenRatingModal}
                  aria-label="Rate this store"
                  title={myReview?.rating ? `Your rating: ${myReview.rating}★` : 'Rate store'}
                  className="min-h-[46px] w-12 h-12 flex items-center justify-center bg-sunken hover:bg-line text-ink border border-line transition-colors cursor-pointer shrink-0"
                >
                  <Star size={17} className={myReview?.rating ? 'fill-amber-400 text-amber-500' : ''} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  aria-label="Bookmark store"
                  title={isBookmarked ? 'Bookmarked' : 'Bookmark store'}
                  className="min-h-[46px] w-12 h-12 flex items-center justify-center bg-sunken hover:bg-line text-ink border border-line transition-colors cursor-pointer shrink-0"
                >
                  <Bookmark size={17} className={isBookmarked ? 'fill-current text-taupe' : ''} />
                </button>

                {onOpenMap && (
                  <button
                    type="button"
                    onClick={onOpenMap}
                    aria-label="View branch locations on map"
                    title="View branch locations on map"
                    className="min-h-[46px] w-12 h-12 flex items-center justify-center bg-sunken hover:bg-line text-ink border border-line transition-colors cursor-pointer shrink-0"
                  >
                    <MapPin size={17} className="text-taupe" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* 📝 4. Centered Bio / Description */}
          {store.description && (
            <p className="mobile-body-sm sm:tablet-body-md text-ink-body text-center max-w-xl mx-auto mt-3 px-2 font-normal leading-relaxed">
              {store.description}
            </p>
          )}

          {/* 📌 5. Centered Key Details Row (with icons like Facebook profile info) */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-ink-muted text-center mt-3 pt-2.5 border-t border-line/60 w-full max-w-2xl px-2">
            {/* Location (Clean, deduplicated) */}
            <div className="flex items-center gap-1.5 text-ink-body">
              <MapPin size={14} className="text-taupe shrink-0" />
              <span>{cleanAddress}</span>
            </div>

            {/* Open / Closed Status */}
            <div className="flex items-center gap-1.5">
              <Clock size={14} className={isStoreCurrentlyOpen ? 'text-emerald-500 shrink-0' : 'text-rose-500 shrink-0'} />
              <span className={isStoreCurrentlyOpen ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-medium'}>
                {isStoreCurrentlyOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {/* Phone */}
            {store.phone && (
              <div className="flex items-center gap-1.5 text-ink-muted">
                <Phone size={14} className="text-ink-muted shrink-0" />
                <span>{store.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* 📑 6. Streamlined Navigation Tabs Bar */}
        <div ref={tabBarRef} className="flex justify-center border-b border-line mt-4 mb-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-1 sm:gap-6 px-2 min-w-full sm:min-w-0">
            {tabList.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 sm:flex-none min-w-0 min-h-[46px] py-2.5 px-3 sm:px-5 flex items-center justify-center text-center text-sm sm:text-base whitespace-nowrap transition-all border-b-2 -mb-px cursor-pointer ${
                    isActive
                      ? 'border-ink text-ink font-semibold'
                      : 'border-transparent text-ink-muted hover:text-ink font-normal'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
