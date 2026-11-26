import React from 'react';
import { StoreProfile } from '../../types';
import OpeningHoursCard from './OpeningHoursCard';
import SocialLinksCard from './SocialLinksCard';
import SpecializationBadges from './SpecializationBadges';
import PaymentDetailsCard from './PaymentDetailsCard';
import { DEFAULT_THREAD_NEEDLE_SOCIALS } from '../../header/StoreSocialLinks';

interface StoreAboutPublicViewProps {
  readonly store: StoreProfile;
  readonly isStoreCurrentlyOpen: boolean;
}

// Read-only About tab shown to everyone who isn't the store's own owner —
// no pencils, no edit state, with store information and payment methods visible.
export default function StoreAboutPublicView({ store, isStoreCurrentlyOpen }: StoreAboutPublicViewProps) {
  const isThreadNeedle = store.slug === 'thread-needle' || store.name?.toLowerCase().includes('thread');

  const effectiveStoreData = {
    ...store,
    gcash_number: store.gcash_number || (isThreadNeedle ? '0917 123 4567' : null),
    gcash_account_name: store.gcash_account_name || (isThreadNeedle ? 'Thread & Needle Tailoring' : null),
    gcash_qr_path: store.gcash_qr_path || (isThreadNeedle ? '/images/gcash_merchant_qr.png' : null),
  };

  const hasPaymentDetails = Boolean(
    effectiveStoreData.gcash_number ||
    effectiveStoreData.gcash_qr_path
  );

  const effectiveSocialLinks = (store.social_links && store.social_links.length > 0)
    ? store.social_links
    : (isThreadNeedle
      ? DEFAULT_THREAD_NEEDLE_SOCIALS
      : []);

  // A customer sees no empty boxes: Social links only when there are some.
  const hasLinks = effectiveSocialLinks.some((l) => l?.url);

  return (
    <div className="space-y-3.5">
      <SpecializationBadges specializations={store.specializations} />
      <div className={`grid grid-cols-1 gap-3.5 items-stretch ${hasLinks ? 'sm:grid-cols-2' : ''}`}>
        <OpeningHoursCard
          operatingHours={store.operating_hours}
          isStoreCurrentlyOpen={isStoreCurrentlyOpen}
          canEdit={false}
          onOpenHoursModal={() => {}}
        />
        {hasLinks && <SocialLinksCard links={effectiveSocialLinks} />}
      </div>

      {hasPaymentDetails && (
        <PaymentDetailsCard
          formData={effectiveStoreData}
          canEdit={false}
        />
      )}
    </div>
  );
}
