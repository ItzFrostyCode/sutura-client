'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/components/settings/useSettings';
import { StoreProfile } from '../../types';
import OpeningHoursCard from './OpeningHoursCard';
import SocialLinksCard from './SocialLinksCard';
import DescriptionCard from './DescriptionCard';
import ContactInfoCard from './ContactInfoCard';
import PaymentDetailsCard from './PaymentDetailsCard';
import BookingFlowCard from './BookingFlowCard';
import MapLocationInfoCard from './MapLocationInfoCard';
import BusinessTypeCard from './BusinessTypeCard';
import SpecializationsCard from './SpecializationsCard';
import StoreVisibilityCard from './StoreVisibilityCard';

type SectionKey =
  | 'social_links' | 'description' | 'contact_info' | 'payment_details'
  | 'booking_flow' | 'business_type' | 'specializations' | 'visibility';

interface StoreAboutOwnerViewProps {
  readonly store: StoreProfile;
  readonly isStoreCurrentlyOpen: boolean;
  readonly onOpenHoursModal: () => void;
  readonly onProfileSaved: () => void;
}

// The owner's editable version of the About tab: every field lives in its
// own card, right where customers see it, with its own pencil — instead of
// a separate "Store Settings" form with an unrelated left-nav mixing every
// section together. Only one card can be in edit mode at a time so an edit
// in one section never bleeds into another.
export default function StoreAboutOwnerView({ store, isStoreCurrentlyOpen, onOpenHoursModal, onProfileSaved }: StoreAboutOwnerViewProps) {
  const {
    loading,
    saving,
    formData,
    setFormDataWithDirty,
    handleChange,
    handleSocialChange,
    handleBusinessTypeChange,
    handleGcashQrUpload,
    handleBankQrUpload,
    handleSave,
    handleDiscard,
  } = useSettings();

  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);

  const commitSave = async () => {
    const ok = await handleSave();
    if (ok) {
      setEditingSection(null);
      onProfileSaved();
    }
  };

  const cancelEdit = () => {
    handleDiscard();
    setEditingSection(null);
  };

  const sectionProps = (key: SectionKey) => ({
    isEditing: editingSection === key,
    saving,
    onEdit: () => setEditingSection(key),
    onCancel: cancelEdit,
    onSave: commitSave,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-surface border border-line text-ink-muted">
        <Loader2 size={24} className="animate-spin text-taupe mb-2" />
        <span className="text-xs font-medium">Loading your store settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
        <div className="space-y-3.5">
          <OpeningHoursCard
            operatingHours={store.operating_hours}
            isStoreCurrentlyOpen={isStoreCurrentlyOpen}
            canEdit
            onOpenHoursModal={onOpenHoursModal}
          />
          <SocialLinksCard
            links={formData.social_links}
            edit={{ ...sectionProps('social_links'), onLinksChange: handleSocialChange }}
          />
        </div>
        <DescriptionCard
          description={formData.description}
          edit={{ ...sectionProps('description'), value: formData.description, onChange: (value) => setFormDataWithDirty((prev) => ({ ...prev, description: value })) }}
        />
      </div>

      <ContactInfoCard formData={formData} onChange={handleChange} {...sectionProps('contact_info')} />

      <PaymentDetailsCard
        formData={formData}
        onChange={handleChange}
        {...sectionProps('payment_details')}
        onGcashQrUpload={handleGcashQrUpload}
        onBankQrUpload={handleBankQrUpload}
      />

      <BookingFlowCard formData={formData} onChange={handleChange} setFormData={setFormDataWithDirty} {...sectionProps('booking_flow')} />

      <MapLocationInfoCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
        <BusinessTypeCard businessType={formData.business_type} onChange={handleBusinessTypeChange} {...sectionProps('business_type')} />
        <StoreVisibilityCard
          isFeatured={formData.is_featured}
          isHidden={formData.is_hidden}
          onHiddenChange={(is_hidden) => setFormDataWithDirty((prev) => ({ ...prev, is_hidden }))}
          {...sectionProps('visibility')}
        />
      </div>

      <SpecializationsCard
        specializations={formData.specializations}
        onChange={(specializations) => setFormDataWithDirty((prev) => ({ ...prev, specializations }))}
        {...sectionProps('specializations')}
      />
    </div>
  );
}
