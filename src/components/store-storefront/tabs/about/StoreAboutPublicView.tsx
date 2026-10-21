import React from 'react';
import { StoreProfile } from '../../types';
import OpeningHoursCard from './OpeningHoursCard';
import SocialLinksCard from './SocialLinksCard';
import DescriptionCard from './DescriptionCard';
import SpecializationBadges from './SpecializationBadges';
import PaymentDetailsCard from './PaymentDetailsCard';

interface StoreAboutPublicViewProps {
  readonly store: StoreProfile;
  readonly isStoreCurrentlyOpen: boolean;
}

// Read-only About tab shown to everyone who isn't the store's own owner —
// no pencils, no edit state, with store information and payment methods visible.
export default function StoreAboutPublicView({ store, isStoreCurrentlyOpen }: StoreAboutPublicViewProps) {
  const hasPaymentDetails = Boolean(
    store.gcash_number ||
    store.gcash_qr_path ||
    store.bank_account_number ||
    store.bank_qr_path
  );

  return (
    <div className="space-y-3.5">
      <SpecializationBadges specializations={store.specializations} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
        <div className="space-y-3.5">
          <OpeningHoursCard
            operatingHours={store.operating_hours}
            isStoreCurrentlyOpen={isStoreCurrentlyOpen}
            canEdit={false}
            onOpenHoursModal={() => {}}
          />
          <SocialLinksCard links={store.social_links} />
        </div>
        <DescriptionCard description={store.description} />
      </div>

      {hasPaymentDetails && (
        <PaymentDetailsCard
          formData={store}
          canEdit={false}
        />
      )}
    </div>
  );
}
