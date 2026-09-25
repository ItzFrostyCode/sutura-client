'use client';

import React from 'react';
import SizeChartEditor from '@/components/shared/SizeChartEditor';
import { CatalogFormProps } from './form/formTypes';
import { useCatalogForm } from './form/useCatalogForm';
import { CatalogFormHeader } from './form/CatalogFormHeader';
import { BasicInfoSection } from './form/BasicInfoSection';
import { SpecificationsAccordion } from './form/SpecificationsAccordion';
import { CareAccordion } from './form/CareAccordion';
import { ImagesSidebar } from './form/ImagesSidebar';

export default function CatalogForm({
  title,
  description,
  submitLabel,
  initialData,
  onSubmit,
  submitting,
}: Readonly<CatalogFormProps>) {
  const {
    store,
    formData,
    setFormData,
    storeServices,
    fabricImageUploading,
    fabricImageInputRef,
    sizeInput,
    setSizeInput,
    addSize,
    removeSize,
    features,
    setFeatures,
    sizeChart,
    setSizeChart,
    images,
    setImages,
    featuresImage,
    setFeaturesImage,
    careImage,
    setCareImage,
    uploadingSection,
    accordionOpen,
    toggleAccordion,
    showMoreDetails,
    setShowMoreDetails,
    handleChange,
    handleSectionUpload,
    handleFabricImageUpload,
    saveDisabled,
    handleFormSubmit,
  } = useCatalogForm({ initialData, onSubmit, submitting });

  return (
    <form onSubmit={handleFormSubmit} className="bg-canvas min-h-screen text-ink pb-16 font-sans selection:bg-line">
      <CatalogFormHeader
        title={title}
        description={description}
        submitLabel={submitLabel}
        submitting={submitting}
        saveDisabled={saveDisabled}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <BasicInfoSection
              formData={formData}
              onChange={handleChange}
              setFormData={setFormData}
              storeServices={storeServices}
              fabricImageUploading={fabricImageUploading}
              fabricImageInputRef={fabricImageInputRef}
              onFabricUpload={handleFabricImageUpload}
              showMoreDetails={showMoreDetails}
              setShowMoreDetails={setShowMoreDetails}
              sizeInput={sizeInput}
              setSizeInput={setSizeInput}
              onAddSize={addSize}
              onRemoveSize={removeSize}
            />

            <div className="space-y-4">
              <SpecificationsAccordion
                isOpen={accordionOpen.specs}
                onToggle={() => toggleAccordion('specs')}
                features={features}
                setFeatures={setFeatures}
                featuresImage={featuresImage}
                setFeaturesImage={setFeaturesImage}
                uploading={uploadingSection === 'specs'}
                onUpload={file => handleSectionUpload(file, 'specs')}
              />

              <div className="bg-surface border border-line rounded-2xl p-5">
                <SizeChartEditor
                  mode="table"
                  value={sizeChart}
                  onChange={setSizeChart}
                  storeId={store?.id ?? 0}
                  title="Fit & Sizing Guidelines"
                  description="Show customers exactly how you measure — upload your own reference chart image and/or build a size & measurement table."
                />
              </div>

              <CareAccordion
                isOpen={accordionOpen.care}
                onToggle={() => toggleAccordion('care')}
                careInstructions={formData.care_instructions}
                onChange={handleChange}
                careImage={careImage}
                setCareImage={setCareImage}
                uploading={uploadingSection === 'care'}
                onUpload={file => handleSectionUpload(file, 'care')}
              />
            </div>
          </div>

          {/* Right Images Sidebar */}
          <div className="space-y-6">
            <ImagesSidebar
              images={images}
              setImages={setImages}
              storeId={store?.id}
              saveDisabled={saveDisabled}
              submitting={submitting}
              submitLabel={submitLabel}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
