'use client';

import { useCanGoBack } from '@/hooks/useCanGoBack';
import PremiumBadge from '@/components/shared/PremiumBadge';
import ShopQuickInfo from '@/components/search/map/ShopQuickInfo';
import type { OperatingHours } from '@/lib/storeStatus';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  MapPin,
  Star,
  Bookmark,
  Pencil,
  Camera,
  Calendar,
  Clock,
  LayoutDashboard,
  Upload,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { StoreProfile, StoreBranch, StorefrontTab } from '../types';
import { getMediaUrl } from '@/lib/media';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import ScrollNav from '@/components/shared/ScrollNav';
import StoreSocialLinks from './StoreSocialLinks';

interface StoreHeroHeaderProps {
  readonly store: StoreProfile;
  readonly storeId: string;
  readonly isStoreCurrentlyOpen: boolean;
  readonly activeBranch?: StoreBranch;
  readonly isOwnerViewingOwnStore: boolean;
  /** Owner, branch manager, or staff on their own Store Profile (hides back, shows Dashboard). */
  readonly isShopViewingOwnStore?: boolean;
  /** Shown inside the map panel: the panel's own header carries the Back, the name and the address, so they are left out here. */
  readonly embedded?: boolean;
  /** The shop has an Alterations & Repairs service — shown under its name (owner's rule, 2026-10-14). */
  readonly altersRepairs?: boolean;
  readonly onEditProfile: () => void;
  readonly tabList: { id: StorefrontTab; label: string }[];
  readonly activeTab: StorefrontTab;
  readonly setActiveTab: (tab: StorefrontTab) => void;
  readonly tabBarRef: React.RefObject<HTMLDivElement | null>;
  readonly myReview: { id?: number; rating: number; comment?: string | null } | null;
  readonly onOpenRatingModal: () => void;
  readonly isBookmarked: boolean;
  /** Saves or unsaves the shop on the server (My Saved > Shops). */
  readonly onToggleBookmark: () => void;
  /** Refreshes the storefront's own `store` state after the logo/banner is replaced. */
  readonly onImagesSaved?: () => void;
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

interface PendingImageChange {
  file?: File;
  previewUrl?: string;
  isRemove: boolean;
}

export default function StoreHeroHeader({
  store,
  storeId,
  isStoreCurrentlyOpen,
  activeBranch,
  isOwnerViewingOwnStore,
  isShopViewingOwnStore = false,
  embedded = false,
  altersRepairs = false,
  onEditProfile,
  tabList,
  activeTab,
  setActiveTab,
  tabBarRef,
  myReview,
  onOpenRatingModal,
  isBookmarked,
  onToggleBookmark,
  onImagesSaved,
}: StoreHeroHeaderProps) {
  const cleanAddress = formatCleanAddress(activeBranch, store);
  const router = useRouter();
  const { user, token, setAuth, staffProfile } = useAuthStore();
  const toast = useToast();
  // A tab opened from the dashboard's Eye icon (or a shared link) has nothing to go back to: no Back button there.
  const canGoBack = useCanGoBack();

  // Banner direct editing state
  const [pendingBanner, setPendingBanner] = useState<PendingImageChange | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerMenuOpen, setBannerMenuOpen] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const bannerMenuRef = useRef<HTMLDivElement>(null);

  // Logo direct editing state
  const [pendingLogo, setPendingLogo] = useState<PendingImageChange | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);

  // Compute effective banner URL based on pending changes
  const baseBannerUrl = store.banner_path || activeBranch?.guide_image_url;
  const effectiveBannerUrl = pendingBanner
    ? (pendingBanner.isRemove ? null : pendingBanner.previewUrl)
    : baseBannerUrl;
  const hasBanner = Boolean(effectiveBannerUrl) && !bannerFailed;

  // Compute effective logo URL based on pending changes
  const effectiveLogoUrl = pendingLogo
    ? (pendingLogo.isRemove ? null : pendingLogo.previewUrl)
    : store.logo_path;

  useEffect(() => {
    setBannerFailed(false);
  }, [effectiveBannerUrl]);

  // Clean up blob URLs when pending changes cancel or unmount
  useEffect(() => {
    return () => {
      if (pendingBanner?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingBanner.previewUrl);
      }
    };
  }, [pendingBanner]);

  useEffect(() => {
    return () => {
      if (pendingLogo?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingLogo.previewUrl);
      }
    };
  }, [pendingLogo]);

  // Dismiss dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bannerMenuRef.current && !bannerMenuRef.current.contains(e.target as Node)) {
        setBannerMenuOpen(false);
      }
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setLogoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Banner Handlers ---
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pendingBanner?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingBanner.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingBanner({ file, previewUrl, isRemove: false });
    setBannerMenuOpen(false);
    setBannerFailed(false);
    e.target.value = '';
  };

  const handleRemoveBannerClick = () => {
    if (pendingBanner?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingBanner.previewUrl);
    }
    setPendingBanner({ isRemove: true });
    setBannerMenuOpen(false);
  };

  const handleCancelBanner = () => {
    if (pendingBanner?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingBanner.previewUrl);
    }
    setPendingBanner(null);
    setBannerFailed(false);
  };

  const handleSaveBanner = async () => {
    if (!pendingBanner || !store) return;
    setSavingBanner(true);
    try {
      let finalUrl: string | null = null;
      if (!pendingBanner.isRemove && pendingBanner.file) {
        const fd = new FormData();
        fd.append('file', pendingBanner.file);
        const uploadRes = await api.post(`/stores/${store.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalUrl = uploadRes.data.data.url;
      }
      const saveRes = await api.put(`/stores/${store.id}`, { banner_path: finalUrl });
      if (user && token) {
        setAuth(user, token, saveRes.data.data, staffProfile || undefined);
      }
      toast.success(finalUrl ? 'Cover banner updated.' : 'Cover banner removed.');
      if (pendingBanner.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingBanner.previewUrl);
      }
      setPendingBanner(null);
      onImagesSaved?.();
    } catch {
      toast.error('Failed to update cover banner. Please try again.');
    } finally {
      setSavingBanner(false);
    }
  };

  // --- Logo Handlers ---
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pendingLogo?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingLogo.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingLogo({ file, previewUrl, isRemove: false });
    setLogoMenuOpen(false);
    e.target.value = '';
  };

  const handleRemoveLogoClick = () => {
    if (pendingLogo?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingLogo.previewUrl);
    }
    setPendingLogo({ isRemove: true });
    setLogoMenuOpen(false);
  };

  const handleCancelLogo = () => {
    if (pendingLogo?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(pendingLogo.previewUrl);
    }
    setPendingLogo(null);
  };

  const handleSaveLogo = async () => {
    if (!pendingLogo || !store) return;
    setSavingLogo(true);
    try {
      let finalUrl: string | null = null;
      if (!pendingLogo.isRemove && pendingLogo.file) {
        const fd = new FormData();
        fd.append('file', pendingLogo.file);
        const uploadRes = await api.post(`/stores/${store.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalUrl = uploadRes.data.data.url;
      }
      const saveRes = await api.put(`/stores/${store.id}`, { logo_path: finalUrl });
      if (user && token) {
        setAuth(user, token, saveRes.data.data, staffProfile || undefined);
      }
      toast.success(finalUrl ? 'Store logo updated.' : 'Store logo removed.');
      if (pendingLogo.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pendingLogo.previewUrl);
      }
      setPendingLogo(null);
      onImagesSaved?.();
    } catch {
      toast.error('Failed to update store logo. Please try again.');
    } finally {
      setSavingLogo(false);
    }
  };

  return (
    <>
      {/* No Back button from 600px up: the browser's own Back does it (and the site header is there to move around). */}

      {/* 📸 1. Cover Banner Image — Facebook precise responsive heights: mobile 220-240px (16:9), tablet 312px, desktop 360px */}
      <div className="h-[220px] min-[420px]:h-[240px] sm:h-[312px] lg:h-[360px] w-full max-w-[960px] mx-auto bg-surface px-0 sm:px-8 lg:px-0">
        <div className="relative w-full h-full overflow-hidden sm:rounded-b-2xl border border-t-0 border-line/60">
          {/* Mobile Back button (width <= 599px, i.e. 320px - 599px) — Overlaid on banner for compact mobile screens */}
          {!isShopViewingOwnStore && !embedded && canGoBack && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Back"
              className={`min-[600px]:hidden absolute top-4 left-4 z-20 w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                hasBanner
                  ? 'bg-ink/60 text-white hover:bg-ink/80'
                  : 'bg-surface/85 border border-line text-ink hover:bg-surface'
              }`}
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* Hidden File Input for Banner */}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={handleBannerFileChange}
          />

          {hasBanner ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getMediaUrl(effectiveBannerUrl || '')}
                alt={activeBranch?.name ? `${store.name} - ${activeBranch.name}` : store.name}
                className="w-full h-full object-cover"
                onError={() => setBannerFailed(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
            </>
          ) : (
            <div className="w-full h-full bg-sunken flex flex-col items-center justify-center p-4 text-center select-none">
              {isOwnerViewingOwnStore && !activeBranch ? (
                <div className="flex flex-col items-center gap-1.5 text-ink-faint">
                  <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-ink-faint shadow-2xs">
                    <Camera size={18} />
                  </div>
                  <span className="text-xs font-semibold text-ink-muted">
                    {pendingBanner?.isRemove ? 'Cover photo removed' : 'No cover photo yet'}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {pendingBanner?.isRemove
                      ? 'Save changes to confirm removal, or Cancel to restore'
                      : 'Upload a banner to customize your storefront'}
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Banner Floating Save/Cancel Action Bar (shown when there are pending banner changes) */}
          {isOwnerViewingOwnStore && !activeBranch && pendingBanner && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium mr-1">
                <Camera size={14} className="text-white/70" />
                <span className="hidden sm:inline">
                  {pendingBanner.isRemove ? 'Remove cover photo?' : 'New cover preview'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelBanner}
                disabled={savingBanner}
                className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBanner}
                disabled={savingBanner}
                className="min-h-[36px] px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-taupe hover:bg-taupe transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              >
                {savingBanner ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>{savingBanner ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}

          {/* Banner Change/Remove Button & Popover Menu (when no pending banner changes) */}
          {isOwnerViewingOwnStore && !activeBranch && !pendingBanner && (
            <div ref={bannerMenuRef} className="absolute bottom-3 right-3 z-20">
              {hasBanner ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBannerMenuOpen(!bannerMenuOpen)}
                    aria-label="Change cover banner"
                    className="min-h-[44px] px-3.5 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md border border-white/10"
                  >
                    <Camera size={14} />
                    <span>Change Cover</span>
                  </button>

                  {bannerMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-line rounded-xl shadow-xl overflow-hidden py-1 z-30 animate-in fade-in zoom-in-95">
                      <button
                        type="button"
                        onClick={() => {
                          setBannerMenuOpen(false);
                          bannerInputRef.current?.click();
                        }}
                        className="w-full min-h-[40px] px-3.5 py-2 text-left text-xs font-medium text-ink hover:bg-sunken flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Upload size={14} className="text-ink-muted" />
                        <span>Upload Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveBannerClick}
                        className="w-full min-h-[40px] px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer border-t border-line/60"
                      >
                        <Trash2 size={14} className="text-rose-600" />
                        <span>Remove Cover Photo</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  aria-label="Add cover photo"
                  className="min-h-[44px] px-3.5 flex items-center gap-1.5 bg-surface/95 hover:bg-surface border border-line text-ink text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <Camera size={14} />
                  <span>Add Cover Photo</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Special Hours Alert Banner (if active) */}
      {(store.active_special_hours?.announcement_message ||
        store.active_special_hours?.announcement_image_url) && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-3 px-4 max-w-[960px] mx-auto w-full">
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
      <div className="max-w-[960px] mx-auto w-full px-4 sm:px-8 lg:px-0">
        <div className="relative flex flex-col items-center text-center pb-2">
          {/* Hidden File Input for Logo */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={handleLogoFileChange}
          />

          {/* Centered Avatar Overlapping Cover Banner */}
          <div className="-mt-14 sm:-mt-18 md:-mt-20 relative z-10 flex flex-col items-center">
            <div className="relative inline-block">
              <StoreLogoAvatar
                src={effectiveLogoUrl}
                name={store.name}
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 border-surface bg-surface shadow-xl overflow-hidden shrink-0"
                isOpen={isStoreCurrentlyOpen}
              />
              {isOwnerViewingOwnStore && !pendingLogo && (
                <div ref={logoMenuRef} className="absolute bottom-0.5 right-0.5">
                  {store.logo_path ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setLogoMenuOpen(!logoMenuOpen)}
                        aria-label="Change store logo"
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-ink/80 hover:bg-ink text-white border-2 border-surface shadow-md transition-colors cursor-pointer"
                      >
                        <Camera size={14} />
                      </button>
                      {logoMenuOpen && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-surface border border-line rounded-xl shadow-xl overflow-hidden py-1 z-30 animate-in fade-in zoom-in-95 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setLogoMenuOpen(false);
                              logoInputRef.current?.click();
                            }}
                            className="w-full min-h-[40px] px-3.5 py-2 text-left text-xs font-medium text-ink hover:bg-sunken flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Upload size={14} className="text-ink-muted" />
                            <span>Upload Logo</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveLogoClick}
                            className="w-full min-h-[40px] px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer border-t border-line/60"
                          >
                            <Trash2 size={14} className="text-rose-600" />
                            <span>Remove Logo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      aria-label="Add store logo"
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-ink/80 hover:bg-ink text-white border-2 border-surface shadow-md transition-colors cursor-pointer"
                    >
                      <Camera size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Logo Floating Save/Cancel Action Bar (shown when there are pending logo changes) */}
            {isOwnerViewingOwnStore && pendingLogo && (
              <div className="mt-2.5 flex items-center justify-center gap-2 bg-surface border border-line px-3 py-1.5 rounded-xl shadow-lg animate-in fade-in zoom-in-95">
                <span className="text-xs font-medium text-ink-muted px-1">
                  {pendingLogo.isRemove ? 'Remove logo?' : 'New logo preview'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelLogo}
                  disabled={savingLogo}
                  className="min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold text-ink-body hover:text-ink bg-sunken hover:bg-line transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLogo}
                  disabled={savingLogo}
                  className="min-h-[34px] px-3.5 py-1 rounded-lg text-xs font-semibold text-white bg-taupe hover:bg-taupe transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                >
                  {savingLogo ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{savingLogo ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Main Store Name (in the map sheet the sheet's own header carries it) */}
          {!embedded && <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-ink mt-3 tracking-tight">
            {store.name}
          </h1>}

          {/* Subtitle Metadata (Branch, Ratings, Services) */}
          {!embedded && <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-ink-muted mt-1.5 font-normal">
            {/* Trust first: only shops the SUTURA team approved (documents checked) have a public page. */}
            {store.is_premium && <PremiumBadge />}
            {activeBranch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-taupe/15 text-taupe font-semibold text-xs">
                {/* The main branch is marked once, by " · Main HQ": a name that already says "(Main)" would show it twice. */}
                <MapPin size={11} /> {Boolean(activeBranch.is_main) ? activeBranch.name.replace(/\s*\(main\)\s*$/i, '') : activeBranch.name}
                {Boolean(activeBranch.is_main) ? ' · Main HQ' : ''}
              </span>
            )}
            {Boolean(store.reviews_count && store.reviews_count > 0) && (
              <>
                {activeBranch && <span className="text-ink-faint">·</span>}
                <span className="inline-flex items-center gap-1 font-semibold text-ink-body">
                  <Star size={13} className="fill-amber-400 text-amber-500 shrink-0" />
                  {Number(store.reviews_avg_rating ?? 0).toFixed(1)}
                  <span className="text-ink-faint font-normal">({store.reviews_count})</span>
                </span>
              </>
            )}

          </div>}

          {/* ⚡ 3. Centered Action Buttons Row (in the map sheet: Book Appointment and Directions are in the sheet's header) */}
          {!embedded && <div className="flex items-center justify-center gap-2 mt-4 max-w-md sm:max-w-lg w-full">
            {isOwnerViewingOwnStore ? (
              <button
                type="button"
                onClick={onEditProfile}
                className="min-h-[44px] px-6 py-2.5 bg-ink hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer rounded-lg"
              >
                <Pencil size={15} />
                <span>Edit Profile</span>
              </button>
            ) : isShopViewingOwnStore ? (
              // Branch manager / staff: same way back as the owner, minus
              // Edit (store settings are owner-only).
              <Link
                href="/dashboard"
                className="flex-1 min-h-[46px] px-5 py-2.5 bg-ink hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href={activeBranch ? `/store/${storeId}/book?branch=${activeBranch.id}` : `/store/${storeId}/book`}
                  className="flex-1 min-w-0 min-h-12 px-3 sm:px-6 py-2.5 bg-ink hover:bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap shadow-xs transition-colors cursor-pointer"
                >
                  <Calendar size={16} aria-hidden />
                  {/* One line always: "Book" alone on the narrowest phones, beside the Rate / Save / Map icons. */}
                  <span className="max-[359px]:hidden">Book Appointment</span><span className="min-[360px]:hidden">Book</span>
                </Link>

                <button
                  type="button"
                  onClick={onOpenRatingModal}
                  aria-label={myReview?.rating ? `Your rating: ${myReview.rating} stars. Edit` : 'Rate this shop'}
                  title={myReview?.rating ? `Your rating: ${myReview.rating}★` : 'Rate this shop'}
                  className="min-h-12 min-w-12 px-3 flex items-center justify-center gap-1.5 bg-sunken hover:bg-line text-sm font-medium text-ink border border-line transition-colors cursor-pointer shrink-0"
                >
                  <Star size={17} aria-hidden className={myReview?.rating ? 'fill-amber-400 text-amber-500' : ''} />
                  {/* Named from 640px wide (the star and the bookmark looked alike); icon alone (with a spoken name) below that, so "Book Appointment" keeps one line. */}
                  <span className="max-sm:sr-only">Rate</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleBookmark}
                  aria-pressed={isBookmarked}
                  aria-label={isBookmarked ? 'Saved shop' : 'Save shop'}
                  title={isBookmarked ? 'Saved' : 'Save shop'}
                  className="min-h-12 min-w-12 px-3 flex items-center justify-center gap-1.5 bg-sunken hover:bg-line text-sm font-medium text-ink border border-line transition-colors cursor-pointer shrink-0"
                >
                  <Bookmark size={17} aria-hidden className={isBookmarked ? 'fill-current text-taupe-dark' : ''} />
                  <span className="max-sm:sr-only">{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>

                {/* Back to the map with this shop open: where it is and directions (thesis: "access directions to selected branches"). */}
                <Link
                  href={`/search?tab=store&store=${encodeURIComponent(storeId)}`}
                  aria-label="Show on map"
                  title="Show on map"
                  className="min-h-12 min-w-12 px-3 flex items-center justify-center gap-1.5 bg-sunken hover:bg-line text-sm font-medium text-ink border border-line transition-colors shrink-0"
                >
                  <MapPin size={17} aria-hidden />
                  <span className="max-sm:sr-only">Map</span>
                </Link>
              </>
            )}
          </div>}

          {/* 📝 4. Centered Bio / Description */}
          {store.description && (
            <p className="mobile-body-sm sm:tablet-body-md text-ink-body text-center max-w-xl mx-auto mt-3 px-2 font-normal leading-relaxed">
              {store.description}
            </p>
          )}

          {/* In the Map's shop panel: where, when, how to call — INSIDE the scrolling page, so they scroll away with it. */}
          {embedded && (
            <div className="mt-2 w-full text-left">
              <ShopQuickInfo
                address={cleanAddress || null}
                hours={(activeBranch as { operating_hours?: OperatingHours | null } | null)?.operating_hours ?? store.operating_hours}
                phone={(activeBranch as { contact_number?: string | null } | null)?.contact_number || store.phone}
              />
            </div>
          )}

          {/* 📌 5. Where, when, how to call — the same list as the shop panel in Search / Map, so the shop reads the same
              wherever it is opened: address, open/closed with the next opening on its own line, then the phone. */}
          {!embedded && (
            <div className="mt-3 w-full max-w-md text-left">
              <ShopQuickInfo
                address={cleanAddress || null}
                hours={(activeBranch as { operating_hours?: OperatingHours | null } | null)?.operating_hours ?? store.operating_hours}
                phone={(activeBranch as { contact_number?: string | null } | null)?.contact_number || store.phone}
              />
            </div>
          )}

          {/* Social pages on their own line under the details, each clickable (the owner adds them in About). */}
          {!embedded && <StoreSocialLinks links={store.social_links} />}
        </div>

      </div>

      {/* 📑 6. Navigation tabs (not pinned: only the Services search stays at the top while scrolling). */}
        {/* Pinned while scrolling a long Services list, so About and Ratings are always one tap away. */}
        <div ref={tabBarRef} className="mt-4 mb-4 border-b border-line bg-surface">
          <div className="max-w-[960px] mx-auto w-full px-4 sm:px-8 lg:px-0">
          <ScrollNav className="flex justify-center">
          <div className="flex items-center justify-center gap-1 sm:gap-6 px-2 min-w-full sm:min-w-0">
            {tabList.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'services' && typeof window !== 'undefined') {
                      const el = document.getElementById('service-group-title') || tabBarRef.current;
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
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
          </ScrollNav>
          </div>
        </div>
    </>
  );
}
