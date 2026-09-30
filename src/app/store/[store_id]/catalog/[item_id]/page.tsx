'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCatalogItemDetail } from '@/components/store-catalog-detail/hooks/useCatalogItemDetail';
import CatalogDetailHeader from '@/components/store-catalog-detail/CatalogDetailHeader';
import CatalogDesktopHeader from '@/components/store-catalog-detail/CatalogDesktopHeader';
import CatalogDetailGrid from '@/components/store-catalog-detail/CatalogDetailGrid';
import CatalogHeroGallery from '@/components/store-catalog-detail/CatalogHeroGallery';
import CatalogProductInfo from '@/components/store-catalog-detail/CatalogProductInfo';
import CatalogColorSelector from '@/components/store-catalog-detail/CatalogColorSelector';
import CatalogSizeSelector from '@/components/store-catalog-detail/CatalogSizeSelector';
import CatalogAccordionSections from '@/components/store-catalog-detail/CatalogAccordionSections';
import CatalogRatingsSection from '@/components/store-catalog-detail/CatalogRatingsSection';
import CatalogStoreProfileCard from '@/components/store-catalog-detail/CatalogStoreProfileCard';
import CatalogRecommendationsSection from '@/components/store-catalog-detail/CatalogRecommendationsSection';
import CatalogBottomActionBar from '@/components/store-catalog-detail/CatalogBottomActionBar';
import CatalogDesktopActionButtons from '@/components/store-catalog-detail/CatalogDesktopActionButtons';
import CatalogFindInStoreSheet from '@/components/store-catalog-detail/CatalogFindInStoreSheet';
import BulkOrderSheet from '@/components/store-catalog-detail/BulkOrderSheet';
import CatalogDetailBreadcrumb from '@/components/store-catalog-detail/CatalogDetailBreadcrumb';

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
    selectedVariation,
    setSelectedVariation,
    selectedColor,
    setSelectedColor,
    colorOptions,
    selectedSize,
    setSelectedSize,
    orderSuccess,
    isSaved,
    togglingSave,
    handleToggleSave,
    isBulkItem,
    bulkMinQty,
    bulkRosterFields,
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
      {/* Header — desktop minimal / mobile floating overlay */}
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

      <main className="flex-1 w-full max-w-7xl mx-auto px-0 min-[600px]:px-[10px] md:px-8 py-0 min-[600px]:py-[10px] md:py-6 pb-24 min-[600px]:pb-10">
        {/* Breadcrumb — tablet/desktop only */}
        <div className="hidden min-[600px]:block">
          <CatalogDetailBreadcrumb item={item} />
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 1: Hero Gallery (left) + Buy Zone (right)
            Two-column activates at 600px.
        ────────────────────────────────────────────────────── */}
        <CatalogDetailGrid
          gallery={
            <CatalogHeroGallery
              item={item}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              selectedVariation={selectedVariation}
              setSelectedVariation={setSelectedVariation}
              storeId={storeId}
              itemId={itemId}
              colorOptions={colorOptions}
              isSaved={isSaved}
              togglingSave={togglingSave}
              onToggleSave={handleToggleSave}
              myRating={myRating}
              setMyRating={setMyRating}
              hoverRating={hoverRating}
              setHoverRating={setHoverRating}
              onSubmitRating={handleSubmitReview}
              submittingReview={submittingReview}
            />
          }
          buyZone={
          <div className="px-4 min-[375px]:px-6 min-[600px]:px-0">
            {/* Name → Rating → Price → Production Estimate → Service/Fabric */}
            <CatalogProductInfo item={item} />

            {/* Color row — only rendered when the item actually has more
                than one color; picking a swatch switches the hero gallery
                to that color's own photo. */}
            {colorOptions.length > 1 && (
              <div className="flex items-start gap-0 py-3.5 border-b border-line">
                <span className="w-[110px] shrink-0 text-sm text-ink-muted">Color</span>
                <div className="flex-1">
                  <CatalogColorSelector
                    options={colorOptions}
                    selectedColor={selectedColor}
                    onSelectColor={(opt) => {
                      setSelectedColor(opt.name);
                      setSelectedImage(opt.modelImage);
                      setSelectedVariation(opt.name);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Size row */}
            <CatalogSizeSelector
              sizes={item.sizes}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              orderSuccess={orderSuccess}
              onViewOrder={id => router.push(`/account/orders/${id}`)}
            />

            {/* Find a Branch | Book an Appointment (desktop/tablet inline buttons) */}
            <CatalogDesktopActionButtons
              onOpenFind={() => setShowFind(true)}
              bookHref={bookHref}
              orderAction={isBulkItem ? 'bulk' : null}
              onOrder={isBulkItem ? openBulkSheet : undefined}
            />
          </div>
          }
        />

        {/* ──────────────────────────────────────────────────────
            SECTION 2: Size Guide · Specification · Description
        ────────────────────────────────────────────────────── */}
        <div className="mt-6 px-4 min-[375px]:px-6 min-[600px]:px-0">
          <CatalogAccordionSections item={item} />
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 3: Product Ratings
        ────────────────────────────────────────────────────── */}
        <div className="mt-4 px-4 min-[375px]:px-6 min-[600px]:px-0">
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
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 4: Shop Profile
        ────────────────────────────────────────────────────── */}
        <div className="mt-4 px-4 min-[375px]:px-6 min-[600px]:px-0">
          <CatalogStoreProfileCard item={item} gate={gate} />
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 5 & 6: From the Same Shop + You May Also Like
        ────────────────────────────────────────────────────── */}
        <div className="mt-6 px-4 min-[375px]:px-6 min-[600px]:px-0">
          <CatalogRecommendationsSection
            fromSameShop={fromSameShop}
            moreLikeThis={moreLikeThis}
            storeId={storeId}
          />
        </div>
      </main>

      {/* Mobile sticky bottom action bar */}
      <CatalogBottomActionBar
        onOpenFind={() => setShowFind(true)}
        bookHref={bookHref}
        storeSlug={item.store?.slug}
        orderAction={isBulkItem ? 'bulk' : null}
        onOrder={isBulkItem ? openBulkSheet : undefined}
      />

      <BulkOrderSheet
        show={showBulkSheet}
        onClose={() => setShowBulkSheet(false)}
        itemName={item.name}
        sizes={item.sizes}
        minQty={bulkMinQty}
        rosterFields={bulkRosterFields}
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
