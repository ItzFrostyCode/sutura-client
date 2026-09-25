'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCatalogItemDetail } from '@/components/store-catalog-detail/hooks/useCatalogItemDetail';
import CatalogDetailHeader from '@/components/store-catalog-detail/CatalogDetailHeader';
import CatalogDesktopHeader from '@/components/store-catalog-detail/CatalogDesktopHeader';
import CatalogHeroGallery from '@/components/store-catalog-detail/CatalogHeroGallery';
import CatalogProductInfo from '@/components/store-catalog-detail/CatalogProductInfo';
import CatalogSizeSelector from '@/components/store-catalog-detail/CatalogSizeSelector';
import CatalogAccordionSections from '@/components/store-catalog-detail/CatalogAccordionSections';
import CatalogRatingsSection from '@/components/store-catalog-detail/CatalogRatingsSection';
import CatalogStoreProfileCard from '@/components/store-catalog-detail/CatalogStoreProfileCard';
import CatalogRecommendationsSection from '@/components/store-catalog-detail/CatalogRecommendationsSection';
import CatalogBottomActionBar from '@/components/store-catalog-detail/CatalogBottomActionBar';
import CatalogDesktopActionButtons from '@/components/store-catalog-detail/CatalogDesktopActionButtons';
import CatalogFindInStoreSheet from '@/components/store-catalog-detail/CatalogFindInStoreSheet';
import BulkOrderSheet from '@/components/store-catalog-detail/BulkOrderSheet';

export default function PublicProductDetailPage({
  params,
}: Readonly<{ params: Promise<{ store_id: string; item_id: string }> }>) {
  const { store_id: storeId, item_id: itemId } = use(params);
  const router = useRouter();

  const {
    item,
    loading,
    selectedImage,
    setSelectedImage,
    setSelectedVariation,
    selectedSize,
    setSelectedSize,
    orderSuccess,
    isBulkItem,
    bulkMinQty,
    showBulkSheet,
    setShowBulkSheet,
    openBulkSheet,
    bulkOrganizationName,
    setBulkOrganizationName,
    bulkRoster,
    setBulkRoster,
    bulkBranchId,
    setBulkBranchId,
    bulkSubmitting,
    bulkError,
    handleBulkOrder,
    myRating,
    setMyRating,
    hoverRating,
    setHoverRating,
    submittingReview,
    reviewMessage,
    handleSubmitReview,
    headerOpacity,
    fromSameShop,
    moreLikeThis,
    showFind,
    setShowFind,
    findInteractive,
    findSheetBranchId,
    setFindSheetBranchId,
    showBookConfirm,
    setShowBookConfirm,
    showBranchPickModal,
    setShowBranchPickModal,
    userPos,
    locating,
    locateError,
    handleLocate,
    pageRef,
    gate,
    handleBackClick,
    handleReportClick,
    branches,
    findBranch,
    mapBranches,
    selectedFindBranch,
    selectedDistanceKm,
    nearerBranchSuggestion,
    buildBookHref,
  } = useCatalogItemDetail(storeId, itemId);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-canvas">
        <Loader2 size={28} className="animate-spin text-ink-faint" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-full flex items-center justify-center bg-canvas">
        <div className="text-center text-ink-faint">Item not found.</div>
      </div>
    );
  }

  const bookHref = gate(buildBookHref(selectedFindBranch?.slug ?? findBranch?.slug ?? null));
  const bookConfirmHref = buildBookHref(branches.find(b => b.id === selectedFindBranch?.id)?.slug);

  return (
    <div ref={pageRef} className="min-h-full flex flex-col bg-canvas">
      {/* Desktop/tablet: minimal product-page header (Back / Share / more-
          options dropdown) — deliberately not the full site PublicNav,
          per explicit request. Switches at 600px, not md's 768px: the
          two-column grid below still stacks at md per the mobile-first
          design, but 600-767px looked broken with the mobile header's
          floating back/flag overlay (meant for a true edge-to-edge hero
          image) once the gallery itself is no longer full-bleed there —
          this range now keeps the tablet header while the stacked
          single-column layout is untouched. True mobile (below 600px)
          is unchanged. */}
      <div className="hidden min-[600px]:block">
        <CatalogDesktopHeader onBack={handleBackClick} onReport={handleReportClick} />
      </div>
      <div className="min-[600px]:hidden">
        <CatalogDetailHeader
          headerOpacity={headerOpacity}
          onBack={handleBackClick}
          onReport={handleReportClick}
        />
      </div>

      {/* px-0/375/600/md tiers: 0px (320-374px), 24px (375-599px), 10px
          (600-767px), 32px (768px+) — every section (image, header,
          Model/Price/Title/Sizing, ...) inherits this same inset from
          <main> directly instead of each one hand-tuning its own margin,
          so they all stay aligned by construction. */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-0 min-[375px]:px-6 min-[600px]:px-[10px] md:px-8 py-4 min-[600px]:py-[10px] md:py-6 pb-24 min-[600px]:pb-10">
        {/* Two-column layout activates at 600px, not md's 768px — a
            600-767px screen showing only the tall portrait hero image with
            price/title/model below the fold (needing a scroll to see
            anything else) read as broken; side-by-side here matches what
            768px+ already does, just at narrower column widths. */}
        <div className="min-[600px]:grid min-[600px]:grid-cols-12 min-[600px]:gap-2.5 md:gap-10 min-[600px]:items-start">
          {/* Gallery Column */}
          <div className="min-[600px]:col-span-7">
            <CatalogHeroGallery
              item={item}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              setSelectedVariation={setSelectedVariation}
              storeId={storeId}
              itemId={itemId}
            />
          </div>

          {/* Product Info & Purchase Column — not sticky: the info content
              (price/title/store card/accordions) is shorter than the hero
              image, so a sticky column here just left a large blank gap
              below the buttons once the image itself extended further down. */}
          <div className="min-[600px]:col-span-5 space-y-3 mt-4 min-[600px]:mt-0">
            <CatalogProductInfo item={item} />

            <CatalogSizeSelector
              sizes={item.sizes}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              orderSuccess={orderSuccess}
              onViewOrder={id => router.push(`/account/orders/${id}`)}
            />

            {/* Size Guide / Specs & Description / Garment Care sit here,
                grouped with sizing/product details — NOT pushed to the
                bottom. Price > Title > Available Sizing > Product Rating >
                Store Profile (per explicit request) governs those 5 named
                sections; the accordions aren't one of them, so they stay
                next to the sizing content they relate to. */}
            <CatalogAccordionSections item={item} />

            <CatalogRatingsSection
              item={item}
              storeId={storeId}
              itemId={itemId}
              myRating={myRating}
              setMyRating={setMyRating}
              hoverRating={hoverRating}
              setHoverRating={setHoverRating}
              submittingReview={submittingReview}
              reviewMessage={reviewMessage}
              onSubmitReview={handleSubmitReview}
            />

            <CatalogStoreProfileCard item={item} gate={gate} />

            <CatalogDesktopActionButtons
              onOpenFind={() => setShowFind(true)}
              bookHref={bookHref}
              orderAction={isBulkItem ? 'bulk' : null}
              onOrder={isBulkItem ? openBulkSheet : undefined}
            />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-line space-y-8">
          <CatalogRecommendationsSection
            recommendations={item.recommendations}
            fromSameShop={fromSameShop}
            moreLikeThis={moreLikeThis}
            storeId={storeId}
          />
        </div>
      </main>

      <CatalogBottomActionBar
        onOpenFind={() => setShowFind(true)}
        bookHref={bookHref}
        orderAction={isBulkItem ? 'bulk' : null}
        onOrder={isBulkItem ? openBulkSheet : undefined}
      />

      <BulkOrderSheet
        show={showBulkSheet}
        onClose={() => setShowBulkSheet(false)}
        itemName={item.name}
        sizes={item.sizes}
        minQty={bulkMinQty}
        branches={branches}
        branchId={bulkBranchId}
        setBranchId={setBulkBranchId}
        organizationName={bulkOrganizationName}
        setOrganizationName={setBulkOrganizationName}
        roster={bulkRoster}
        setRoster={setBulkRoster}
        submitting={bulkSubmitting}
        error={bulkError}
        onSubmit={handleBulkOrder}
      />

      <CatalogFindInStoreSheet
        showFind={showFind}
        onClose={() => setShowFind(false)}
        findInteractive={findInteractive}
        mapBranches={mapBranches}
        findSheetBranchId={findSheetBranchId}
        setFindSheetBranchId={setFindSheetBranchId}
        selectedFindBranch={selectedFindBranch}
        userPos={userPos}
        onLocate={handleLocate}
        locating={locating}
        locateError={locateError}
        selectedImage={selectedImage}
        itemName={item.name}
        itemPrice={item.price}
        showBookConfirm={showBookConfirm}
        setShowBookConfirm={setShowBookConfirm}
        selectedDistanceKm={selectedDistanceKm}
        nearerBranchSuggestion={nearerBranchSuggestion}
        showBranchPickModal={showBranchPickModal}
        setShowBranchPickModal={setShowBranchPickModal}
        bookConfirmHref={bookConfirmHref}
      />
    </div>
  );
}
