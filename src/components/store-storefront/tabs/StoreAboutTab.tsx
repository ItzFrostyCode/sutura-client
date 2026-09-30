import React from 'react';
import { StoreProfile } from '../types';
import StoreAboutPublicView from './about/StoreAboutPublicView';
import StoreAboutOwnerView from './about/StoreAboutOwnerView';

interface StoreAboutTabProps {
  readonly store: StoreProfile;
  readonly isStoreCurrentlyOpen: boolean;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onOpenHoursModal: () => void;
  /** Refreshes the storefront's own `store` state after an inline edit is
   * saved, so the hero header (name, phone, address, description) reflects
   * the change immediately without a full page reload. */
  readonly onProfileSaved: () => void;
}

export default function StoreAboutTab({
  store,
  isStoreCurrentlyOpen,
  isOwnerViewingOwnStore,
  onOpenHoursModal,
  onProfileSaved,
}: StoreAboutTabProps) {
  return (
    <div>
      {isOwnerViewingOwnStore ? (
        <StoreAboutOwnerView
          store={store}
          isStoreCurrentlyOpen={isStoreCurrentlyOpen}
          onOpenHoursModal={onOpenHoursModal}
          onProfileSaved={onProfileSaved}
        />
      ) : (
        <StoreAboutPublicView store={store} isStoreCurrentlyOpen={isStoreCurrentlyOpen} />
      )}
    </div>
  );
}
