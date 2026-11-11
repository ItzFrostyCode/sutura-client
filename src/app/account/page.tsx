'use client';

import { useAuthStore } from '@/store/useAuthStore';
import GuestAccountHub from '@/components/account/hub/GuestAccountHub';
import AccountProfileHeader from '@/components/account/hub/AccountProfileHeader';
import JobOrdersQuickBar from '@/components/account/hub/JobOrdersQuickBar';
import AppointmentsPreviewCard from '@/components/account/hub/AppointmentsPreviewCard';
import AccountActivityGroups from '@/components/account/hub/AccountActivityGroups';
import { useAccountHub } from '@/components/account/hub/useAccountHub';

/** My Profile: the customer's home in SUTURA — orders first (the thesis' order tracking), then appointments, then the rest. */
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

  // The guest hub has no account data, so it is safe before hydration and avoids a blank flash.
  if (!hydrated || !isAuthenticated) return <GuestAccountHub />;
  if (!user) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* The page's one H1, for screen readers only: no visible title on this hub (the side menu already shows where you are). */}
      <h1 className="sr-only">Dashboard Overview</h1>

      {/* Phone / tablet: the profile card (on desktop the side menu shows the same summary). */}
      <div className="lg:hidden">
        <AccountProfileHeader user={user} />
      </div>

      <JobOrdersQuickBar inProduction={inProduction} readyForPickup={readyForPickup} completed={completed} />

      {/* Two columns from 640px: content is 576px+ wide there on a tablet, and 672px beside the desktop menu. */}
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:items-start">
        <AppointmentsPreviewCard
          appointments={appointments}
          apptView={apptView}
          setApptView={setApptView}
          hasActiveAppointment={hasActiveAppointment}
          previewAppt={previewAppt}
          calCells={calCells}
        />
        <div className="flex flex-col gap-4">
          <AccountActivityGroups measurementCount={measurementCount} />
        </div>
      </div>
    </div>
  );
}
