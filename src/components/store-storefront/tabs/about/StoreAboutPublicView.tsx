import React, { useMemo } from 'react';
import { storeToSettings } from '@/components/settings/useSettings';
import { StoreProfile } from '../../types';
import { AboutReadOnly } from './EditableCard';
import DescriptionCard from './DescriptionCard';
import ContactInfoCard from './ContactInfoCard';
import OpeningHoursCard from './OpeningHoursCard';
import SocialLinksCard from './SocialLinksCard';
import BusinessTypeCard from './BusinessTypeCard';
import SpecializationsCard from './SpecializationsCard';
import { ShopGcashPublicCard } from './ShopGcashCard';
import ShopLinkCard from './ShopLinkCard';

interface StoreAboutPublicViewProps {
  readonly store: StoreProfile;
  readonly isStoreCurrentlyOpen: boolean;
}

const noop = () => {};

// The customer's About tab: the owner's very same cards, in the same order, read-only (no pencils) — so what the shop
// set is exactly what a customer reads, and both see the same page. Only the owner's own settings (visibility, the map
// pin note) are left out.
export default function StoreAboutPublicView({ store, isStoreCurrentlyOpen }: StoreAboutPublicViewProps) {
  const data = useMemo(() => storeToSettings(store), [store]);
  const view = { isEditing: false, saving: false, onEdit: noop, onCancel: noop, onSave: noop };

  return (
    <AboutReadOnly.Provider value>
      <div className="space-y-3.5">
        <DescriptionCard description={data.description} />
        <ContactInfoCard formData={data} onChange={noop} {...view} />
        <OpeningHoursCard operatingHours={store.operating_hours} isStoreCurrentlyOpen={isStoreCurrentlyOpen} canEdit={false} onOpenHoursModal={noop} />
        <SocialLinksCard links={data.social_links} />
        <ShopLinkCard slug={store.slug} shopName={store.name} />
        <BusinessTypeCard businessType={data.business_type} onChange={noop} {...view} />
        <SpecializationsCard specializations={data.specializations} onChange={noop} {...view} />
        <ShopGcashPublicCard storeSlug={store.slug} />
      </div>
    </AboutReadOnly.Provider>
  );
}
