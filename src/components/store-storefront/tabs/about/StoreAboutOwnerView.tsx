'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/components/settings/useSettings';
import { StoreProfile } from '../../types';
import OpeningHoursCard from './OpeningHoursCard';
import SocialLinksCard from './SocialLinksCard';
import DescriptionCard from './DescriptionCard';
import ContactInfoCard from './ContactInfoCard';
import { ShopGcashOwnerCard } from './ShopGcashCard';
import ShopLinkCard from './ShopLinkCard';
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

  // One column, in reading order (no numbers): what the shop is, how to reach it, when it is open, where else to find
  // it (social links, then the shop's own order link), what it does, how to pay, how booking works — then the owner-only settings. The customer's About tab shows the
  // same cards in the same order (StoreAboutPublicView), only without the pencils.
  return (
    <div className="space-y-3.5">
      <DescriptionCard
        description={formData.description}
        edit={{ ...sectionProps('description'), value: formData.description, onChange: (value) => setFormDataWithDirty((prev) => ({ ...prev, description: value })) }}
      />

      <ContactInfoCard formData={formData} onChange={handleChange} {...sectionProps('contact_info')} />

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

      {/* The shop's own SUTURA page, apart from its social links: the link customers order from. */}
      <ShopLinkCard slug={store.slug} shopName={store.name} isOwner />

      <BusinessTypeCard businessType={formData.business_type} onChange={handleBusinessTypeChange} {...sectionProps('business_type')} />

      <SpecializationsCard
        specializations={formData.specializations}
        onChange={(specializations) => setFormDataWithDirty((prev) => ({ ...prev, specializations }))}
        {...sectionProps('specializations')}
      />

      {/* The shop's GCash payment method itself (Payments → Payment Methods), so customers pay to what is shown here. */}
      <ShopGcashOwnerCard
        isEditing={editingSection === 'payment_details'}
        onEdit={() => setEditingSection('payment_details')}
        onDone={() => { setEditingSection(null); onProfileSaved(); }}
      />

      <BookingFlowCard formData={formData} onChange={handleChange} setFormData={setFormDataWithDirty} {...sectionProps('booking_flow')} />

      <StoreVisibilityCard
        isFeatured={formData.is_featured}
        isHidden={formData.is_hidden}
        onHiddenChange={(is_hidden) => setFormDataWithDirty((prev) => ({ ...prev, is_hidden }))}
        {...sectionProps('visibility')}
      />

      <MapLocationInfoCard />
    </div>
  );
}
