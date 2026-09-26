'use client';

import { use, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, MapPin, Search, X, SlidersHorizontal } from 'lucide-react';
import Modal from '@/components/Modal';
import ServiceDetailModal from '@/components/profile/ServiceDetailModal';
import ServiceFormModal from '@/components/services/ServiceFormModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import EditOperatingHoursModal from '@/components/profile/EditOperatingHoursModal';
import PostImageLightbox from '@/components/profile/PostImageLightbox';
import { getSocialUrl } from '@/components/store-storefront/storeStorefrontHelpers';

import { PublicStoreProfilePageProps } from '@/components/store-storefront/types';
import { useStoreStorefront } from '@/components/store-storefront/hooks/useStoreStorefront';
import PublicNav from '@/components/shared/PublicNav';
import StoreHeroHeader from '@/components/store-storefront/header/StoreHeroHeader';
import StoreCatalogTab from '@/components/store-storefront/tabs/StoreCatalogTab';
import StoreCatalogFilterSidebar from '@/components/store-storefront/catalog/StoreCatalogFilterSidebar';
import StoreServicesTab from '@/components/store-storefront/tabs/StoreServicesTab';
import StoreAboutTab from '@/components/store-storefront/tabs/StoreAboutTab';
import StoreHoursTab from '@/components/store-storefront/tabs/StoreHoursTab';
import StoreLocationsTab from '@/components/store-storefront/tabs/StoreLocationsTab';
import StoreWorkTab from '@/components/store-storefront/tabs/StoreWorkTab';
import StoreReviewsTab from '@/components/store-storefront/tabs/StoreReviewsTab';
import PortfolioFilterSheet from '@/components/store-storefront/modals/PortfolioFilterSheet';
import RatingModal from '@/components/store-storefront/modals/RatingModal';



const BranchesMap = dynamic(() => import('@/components/branches/BranchesMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-canvas border border-line rounded-2xl p-10 text-center text-sm text-ink-muted" style={{ height: 400 }}>
      Loading Davao City branch map…
    </div>
  ),
});

function PublicStoreProfileContent({ params }: Readonly<PublicStoreProfilePageProps>) {
  const { store_id: storeId } = use(params);
  const s = useStoreStorefront(storeId);

  if (s.loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!s.store) {
    return <div className="py-32 text-center text-ink-faint">Store not found.</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-surface text-ink selection:bg-sunken selection:text-indigo-900 relative">
      {/* Header — same PublicNav used on the landing page, not a page-specific header */}
      <PublicNav />

      {/* Hero Banner, Avatar, Details & Tab Bar */}
      <StoreHeroHeader
        store={s.store}
        storeId={storeId}
        isStoreCurrentlyOpen={s.isStoreCurrentlyOpen}
        activeBranch={s.activeBranch}
        isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
        onEditProfile={() => s.router.push('/dashboard/settings')}
        myReview={s.myReview}
        isBookmarked={s.isBookmarked}
        setIsBookmarked={s.setIsBookmarked}
        onOpenRatingModal={() => {
          s.setRatingValue(s.myReview?.rating || 0);
          s.setIsRatingModalOpen(true);
        }}
        tabList={s.tabList}
        activeTab={s.activeTab}
        setActiveTab={s.setActiveTab}
        tabBarRef={s.tabBarRef}
        onOpenMap={() => s.setIsAllBranchesMapOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {/* Search + Location + Filter — lives above the Catalog/Services
            content itself now (mobile, tablet, desktop alike), not faded
            into the header on scroll. */}
        {(s.activeTab === 'catalog' || s.activeTab === 'services') && (
          <div className="mb-4 space-y-2">
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <MapPin size={12} className="text-taupe shrink-0" />
              {s.activeBranch
                ? `${s.activeBranch.name}, ${s.activeBranch.city}`
                : `${s.store.branches?.[0]?.district || s.store.district || s.store.city || 'Poblacion District'}, Davao City`}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 h-11 px-3.5 border border-line bg-surface">
                <Search size={18} className="text-taupe shrink-0" />
                <input
                  type="text"
                  placeholder={
                    s.activeTab === 'services'
                      ? 'Search services & packages...'
                      : 'Search this collection... e.g. barong, gown'
                  }
                  value={s.activeTab === 'services' ? s.serviceSearch : s.catalogSearch}
                  onChange={(e) => {
                    if (s.activeTab === 'services') {
                      s.setServiceSearch(e.target.value);
                    } else {
                      s.setCatalogSearch(e.target.value);
                    }
                  }}
                  className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
                />
                {(s.activeTab === 'services' ? s.serviceSearch : s.catalogSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (s.activeTab === 'services') {
                        s.setServiceSearch('');
                      } else {
                        s.setCatalogSearch('');
                      }
                    }}
                    aria-label="Clear search"
                    className="w-7 h-7 flex items-center justify-center shrink-0 text-ink-faint hover:text-ink cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* sm+ already has the persistent StoreCatalogFilterSidebar on
                  the right — this trigger is mobile-only so there isn't a
                  redundant second way to open filters on tablet/desktop. */}
              {s.activeTab === 'catalog' && (
                <button
                  type="button"
                  onClick={s.openFilterPanel}
                  className={`sm:hidden h-11 px-3.5 border transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    s.activeFilterCount > 0
                      ? 'bg-ink text-white border-ink'
                      : 'bg-surface text-ink-body border-line hover:bg-sunken'
                  }`}
                  title="Filter collection"
                >
                  <SlidersHorizontal size={16} />
                  <span>Filter</span>
                  {s.activeFilterCount > 0 && (
                    <span className="w-5 h-5 bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                      {s.activeFilterCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {s.activeTab === 'catalog' && (
          <div className="flex items-start gap-8">
            <div className="flex-1 min-w-0">
              <StoreCatalogTab
                catalogLoading={s.catalogLoading}
                catalogItems={s.catalogItems}
                catalogSearch={s.catalogSearch}
                catalogGarmentTypeFilters={s.catalogGarmentTypeFilters}
                toggleGarmentType={s.toggleGarmentType}
                minPrice={s.minPrice}
                setMinPrice={s.setMinPrice}
                maxPrice={s.maxPrice}
                setMaxPrice={s.setMaxPrice}
                priceSort={s.priceSort}
                setPriceSort={s.setPriceSort}
                colorFilter={s.colorFilter}
                setColorFilter={s.setColorFilter}
                ratingFilter={s.ratingFilter}
                setRatingFilter={s.setRatingFilter}
                resetFilterPanel={s.resetFilterPanel}
                showPortfolioFabric={s.showPortfolioFabric}
                setShowPortfolioFabric={s.setShowPortfolioFabric}
                highlightedItemId={s.highlightedItemId}
                storeId={storeId}
              />
            </div>

            {/* Persistent filter sidebar — hidden on mobile, right side on sm+ */}
            <div className="hidden sm:block">
              <StoreCatalogFilterSidebar
                activeFilterCount={s.activeFilterCount}
                priceSort={s.priceSort}
                setPriceSort={s.setPriceSort}
                minPrice={s.minPrice}
                setMinPrice={s.setMinPrice}
                maxPrice={s.maxPrice}
                setMaxPrice={s.setMaxPrice}
                colorFilter={s.colorFilter}
                setColorFilter={s.setColorFilter}
                availableColors={s.availableColors}
                ratingFilter={s.ratingFilter}
                setRatingFilter={s.setRatingFilter}
                garmentTypeTally={s.garmentTypeTally}
                garmentTypeFilters={s.catalogGarmentTypeFilters}
                toggleGarmentType={s.toggleGarmentType}
                onReset={s.resetFilterPanel}
              />
            </div>
          </div>
        )}

        {s.activeTab === 'services' && (
          <StoreServicesTab
            services={s.services}
            packages={s.packages}
            storeId={storeId}
            expandedServiceId={s.expandedServiceId}
            highlightedServiceId={s.highlightedServiceId}
            serviceSearch={s.serviceSearch}
            setServiceSearch={s.setServiceSearch}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            onAddService={() => {
              s.setEditingServiceId(null);
              s.setServiceError('');
              s.setIsServiceModalOpen(true);
            }}
            user={s.user}
          />
        )}

        {s.activeTab === 'about' && (
          <StoreAboutTab
            store={s.store}
            isStoreCurrentlyOpen={s.isStoreCurrentlyOpen}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            onOpenHoursModal={() => s.setIsHoursModalOpen(true)}
          />
        )}

        {s.activeTab === 'hours' && (
          <StoreHoursTab
            store={s.store}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            onOpenHoursModal={() => s.setIsHoursModalOpen(true)}
          />
        )}

        {s.activeTab === 'locations' && s.store.branches && (
          <StoreLocationsTab
            store={s.store}
            branches={s.store.branches}
            selectedBranchSlug={s.selectedBranchSlug}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            onSelectBranch={(branch) => {
              s.router.push(`/store/${storeId}?branch=${branch.slug}`);
            }}
          />
        )}

        {s.activeTab === 'work' && (
          <StoreWorkTab
            posts={s.posts}
            store={s.store}
            storeId={storeId}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            isAddingPost={s.isAddingPost}
            setIsAddingPost={s.setIsAddingPost}
            postImageUrls={s.postImageUrls}
            postUploading={s.postUploading}
            postCaption={s.postCaption}
            setPostCaption={s.setPostCaption}
            postServiceId={s.postServiceId}
            setPostServiceId={s.setPostServiceId}
            postSubmitting={s.postSubmitting}
            ownerServices={s.ownerServices}
            submitPost={s.submitPost}
            deletePost={s.deletePost}
            handlePostImageUpload={s.handlePostImageUpload}
            removePostImage={s.removePostImage}
            onOpenLightbox={(images, index) => {
              s.setLightboxImages(images);
              s.setLightboxIndex(index);
            }}
          />
        )}

        {s.activeTab === 'reviews' && (
          <StoreReviewsTab
            reviews={s.reviews}
            reviewsLoading={s.reviewsLoading}
            reviewsPage={s.reviewsPage}
            setReviewsPage={s.setReviewsPage}
            reviewsLastPage={s.reviewsLastPage}
            reviewFilterRating={s.reviewFilterRating}
            setReviewFilterRating={s.setReviewFilterRating}
            store={s.store}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            myReview={s.myReview}
            onOpenRatingModal={() => {
              s.setRatingValue(s.myReview?.rating || 0);
              s.setIsRatingModalOpen(true);
            }}
            onDeleteReview={s.handleDeleteReview}
          />
        )}
      </main>

      {/* Filter Bottom Sheet Modal */}
      <PortfolioFilterSheet
        isOpen={s.isPortfolioFilterOpen}
        mounted={s.mounted}
        onClose={() => s.setIsPortfolioFilterOpen(false)}
        activeFilterCount={s.activeFilterCount}
        draftPriceSort={s.draftPriceSort}
        setDraftPriceSort={s.setDraftPriceSort}
        draftMinPrice={s.draftMinPrice}
        setDraftMinPrice={s.setDraftMinPrice}
        draftMaxPrice={s.draftMaxPrice}
        setDraftMaxPrice={s.setDraftMaxPrice}
        draftColorFilter={s.draftColorFilter}
        setDraftColorFilter={s.setDraftColorFilter}
        availableColors={s.availableColors}
        draftRatingFilter={s.draftRatingFilter}
        setDraftRatingFilter={s.setDraftRatingFilter}
        garmentTypeOptions={s.garmentTypeOptions}
        draftGarmentTypeFilters={s.draftGarmentTypeFilters}
        setDraftGarmentTypeFilters={s.setDraftGarmentTypeFilters}
        garmentTypeTally={s.garmentTypeTally}
        onReset={s.resetFilterPanel}
        onApply={s.applyFilterPanel}
      />

      {/* Store Rating Modal */}
      <RatingModal
        isOpen={s.isRatingModalOpen}
        mounted={s.mounted}
        onClose={() => s.setIsRatingModalOpen(false)}
        subjectName={s.store.name}
        subjectType="Store"
        myReview={s.myReview}
        ratingValue={s.ratingValue}
        setRatingValue={s.setRatingValue}
        hoveredStar={s.hoveredStar}
        setHoveredStar={s.setHoveredStar}
        isSubmitting={s.isSubmittingRating}
        onSubmit={s.submitRating}
      />

      {/* Service Rating Modal */}
      {s.ratingService && (
        <RatingModal
          isOpen={s.isServiceRatingModalOpen}
          mounted={s.mounted}
          onClose={() => s.setIsServiceRatingModalOpen(false)}
          subjectName={s.ratingService.name}
          subjectType="Service"
          myReview={s.myServiceReview}
          ratingValue={s.serviceRatingValue}
          setRatingValue={s.setServiceRatingValue}
          hoveredStar={s.serviceHoveredStar}
          setHoveredStar={s.setServiceHoveredStar}
          isSubmitting={s.isSubmittingServiceRating}
          onSubmit={s.submitServiceRating}
        />
      )}

      {/* Service Detail & Package Modals */}
      <ServiceDetailModal
        service={s.selectedService}
        isOpen={s.selectedService !== null}
        onClose={() => s.setSelectedService(null)}
        facebookUrl={getSocialUrl(s.store.social_links, 'facebook')}
        storeId={storeId}
      />

      {/* Post Image Lightbox */}
      <PostImageLightbox
        images={s.lightboxImages || []}
        initialIndex={s.lightboxIndex}
        isOpen={s.lightboxImages !== null}
        onClose={() => s.setLightboxImages(null)}
      />

      {/* Pinpointed Branches Map Modal */}
      <Modal
        isOpen={s.isAllBranchesMapOpen}
        onClose={() => s.setIsAllBranchesMapOpen(false)}
        title={`${s.store.name} — Davao City Branch Locations`}
      >
        {s.store.branches && s.store.branches.length > 0 ? (
          <div className="p-1 space-y-3">
            <p className="text-xs text-ink-muted">
              Pinpointed physical branches across Davao City. Click any location pin to view details or switch to that branch profile.
            </p>
            <BranchesMap
              branches={s.store.branches as any}
              initialSelectedId={s.activeBranch?.id ?? null}
              onSelectBranch={(branch) => {
                s.setIsAllBranchesMapOpen(false);
                s.router.push(`/store/${storeId}?branch=${branch.slug}`);
              }}
              height={400}
            />
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-ink-muted">
            No branch locations available for this store.
          </div>
        )}
      </Modal>

      {/* Owner Inline Management Modals */}
      {s.isOwnerViewingOwnStore && (
        <>
          <ServiceFormModal
            isOpen={s.isServiceModalOpen}
            onClose={() => {
              s.setIsServiceModalOpen(false);
              s.setEditingServiceId(null);
              s.setServiceError('');
            }}
            editingId={s.editingServiceId}
            onSubmit={s.handleServiceSubmit}
            isSubmitting={s.isServiceSubmitting}
            error={s.serviceError}
            editingService={s.editingServiceId ? s.ownerServices.find((item) => item.id === s.editingServiceId) || null : null}
          />

          <ServiceDeleteModal
            isOpen={s.isServiceDeleteOpen}
            onClose={() => {
              s.setIsServiceDeleteOpen(false);
              s.setDeletingServiceId(null);
            }}
            onConfirm={s.confirmDeleteService}
            isSubmitting={s.isServiceSubmitting}
          />

          <EditOperatingHoursModal
            isOpen={s.isHoursModalOpen}
            onClose={() => s.setIsHoursModalOpen(false)}
            storeId={s.authStore!.id}
            initialHours={s.store.operating_hours || {}}
            onSaved={s.handleHoursSaved}
          />
        </>
      )}
    </div>
  );
}

export default function PublicStoreProfilePage(props: Readonly<PublicStoreProfilePageProps>) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-ink-faint" />
        </div>
      }
    >
      <PublicStoreProfileContent {...props} />
    </Suspense>
  );
}
