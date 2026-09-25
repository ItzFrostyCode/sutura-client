'use client';

import { useAuthStore } from '@/store/useAuthStore';
import GuestAccountHub from '@/components/account/hub/GuestAccountHub';
import AccountProfileHeader from '@/components/account/hub/AccountProfileHeader';
import JobOrdersQuickBar from '@/components/account/hub/JobOrdersQuickBar';
import AppointmentsPreviewCard from '@/components/account/hub/AppointmentsPreviewCard';
import MeasurementsQuickCard from '@/components/account/hub/MeasurementsQuickCard';
import AccountMoreActivitiesCard from '@/components/account/hub/AccountMoreActivitiesCard';
import AccountSupportCard from '@/components/account/hub/AccountSupportCard';
import { useAccountHub } from '@/components/account/hub/useAccountHub';

export default function AccountHubPage() {
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const {
    appointments,
    measurementCount,
    apptView,
    setApptView,
    hasActiveAppointment,
    previewAppt,
    calCells,
    inProduction,
    readyForPickup,
    completed,
  } = useAccountHub(isAuthenticated);

  // Show the guest hub immediately — it has no auth-dependent data, so it's
  // safe to render before hydration completes and avoids a blank flash.
  if (!hydrated || !isAuthenticated) return <GuestAccountHub />;
  if (!user) return null;

  return (
    <>
      {/* Mobile Profile Header (hidden on md+ — the layout's persistent
          sidebar already shows the profile summary there) */}
      <div className="md:hidden">
        <AccountProfileHeader user={user} />
      </div>

      <JobOrdersQuickBar
        inProduction={inProduction}
        readyForPickup={readyForPickup}
        completed={completed}
      />

      <div className="sm:grid sm:grid-cols-2 sm:gap-4 items-start">
        <AppointmentsPreviewCard
          appointments={appointments}
          apptView={apptView}
          setApptView={setApptView}
          hasActiveAppointment={hasActiveAppointment}
          previewAppt={previewAppt}
          calCells={calCells}
        />
        <div className="flex flex-col">
          <MeasurementsQuickCard measurementCount={measurementCount} />
          <AccountMoreActivitiesCard />
          <AccountSupportCard />
        </div>
      </div>
    </>
  );
}
