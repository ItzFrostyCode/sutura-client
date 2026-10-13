'use client';

import { use, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import ServiceDetailModal from '@/components/profile/ServiceDetailModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';
import EditOperatingHoursModal from '@/components/profile/EditOperatingHoursModal';
import PostImageLightbox from '@/components/profile/PostImageLightbox';
import { getSocialUrl } from '@/components/store-storefront/storeStorefrontHelpers';

import { PublicStoreProfilePageProps } from '@/components/store-storefront/types';
import { useStoreStorefront } from '@/components/store-storefront/hooks/useStoreStorefront';
import PublicNav from '@/components/shared/PublicNav';
import { useShopViewingOwnStore } from '@/hooks/useShopAccount';
import StoreHeroHeader from '@/components/store-storefront/header/StoreHeroHeader';
import StoreOwnerTopBar from '@/components/store-storefront/header/StoreOwnerTopBar';
import StoreServicesTab from '@/components/store-storefront/tabs/StoreServicesTab';
import StoreAboutTab from '@/components/store-storefront/tabs/StoreAboutTab';
import StoreHoursTab from '@/components/store-storefront/tabs/StoreHoursTab';
import StoreLocationsTab from '@/components/store-storefront/tabs/StoreLocationsTab';
import StoreWorkTab from '@/components/store-storefront/tabs/StoreWorkTab';
import StoreReviewsTab from '@/components/store-storefront/tabs/StoreReviewsTab';
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
  const router = useRouter();
  // Owner / branch manager / staff looking at their own Store Profile: no
  // customer header or back arrow — the hero's Dashboard button is their
  // way back, and ShopRouteGuard blocks the customer pages anyway.
  const isShopView = useShopViewingOwnStore(storeId);

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
      {/* Header — same PublicNav used on the landing page for customers;
          the owner/manager/staff viewing their own store gets a sticky
          notifications/account bar instead (Dashboard/Edit are in the hero). */}
      {isShopView ? (
        <StoreOwnerTopBar />
      ) : (
        <PublicNav />
      )}

      {/* Hero Banner, Avatar, Details & Tab Bar */}
      <StoreHeroHeader
        store={s.store}
        storeId={storeId}
        isStoreCurrentlyOpen={s.isStoreCurrentlyOpen}
        activeBranch={s.activeBranch}
        isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
        isShopViewingOwnStore={isShopView}
        onEditProfile={() => s.setActiveTab('about')}
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
        onImagesSaved={s.fetchStore}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {s.activeTab === 'services' && (
          <StoreServicesTab
            services={s.services}
            packages={s.packages}
            catalogItems={s.catalogItems}
            catalogLoading={s.catalogLoading}
            storeId={storeId}
            expandedServiceId={s.expandedServiceId}
            highlightedServiceId={s.highlightedServiceId}
            serviceSearch={s.serviceSearch}
            setServiceSearch={s.setServiceSearch}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            onAddService={() => router.push('/dashboard/services/new')}
            onEditService={(id) => router.push(`/dashboard/services/${id}`)}
            onDeleteService={(id) => {
              s.setDeletingServiceId(id);
              s.setIsServiceDeleteOpen(true);
            }}
            onDeleteDesign={(id) => {
              s.setDeletingCatalogItemId(id);
              s.setIsCatalogDeleteOpen(true);
            }}
            user={s.user}
            store={s.store}
          />
        )}

        {s.activeTab === 'about' && (
          <StoreAboutTab
            store={s.store}
            isStoreCurrentlyOpen={s.isStoreCurrentlyOpen}
            isOwnerViewingOwnStore={s.isOwnerViewingOwnStore}
            onOpenHoursModal={() => s.setIsHoursModalOpen(true)}
            onProfileSaved={s.fetchStore}
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
            onReplyToReview={s.handleReplyToReview}
            onToggleFeaturedReview={s.handleToggleFeaturedReview}
          />
        )}
      </main>

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
          <ServiceDeleteModal
            isOpen={s.isServiceDeleteOpen}
            onClose={() => {
              s.setIsServiceDeleteOpen(false);
              s.setDeletingServiceId(null);
            }}
            onConfirm={s.confirmDeleteService}
            isSubmitting={s.isServiceSubmitting}
          />

          <CatalogDeleteModal
            isOpen={s.isCatalogDeleteOpen}
            onClose={() => {
              s.setIsCatalogDeleteOpen(false);
              s.setDeletingCatalogItemId(null);
            }}
            onConfirm={s.confirmDeleteCatalogItem}
            isSubmitting={s.isCatalogDeleteSubmitting}
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
