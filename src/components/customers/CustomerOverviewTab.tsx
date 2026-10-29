'use client';

import React from 'react';
import { CustomerData, JobOrder, MeasurementProfile, Appointment } from './customerTypes';
import type { CustomerTabType } from './profile/CustomerTabNav';
import { moneySummary } from './customerMoney';
import CustomerPreferencesCard from './overview/CustomerPreferencesCard';
import CustomerMeasurementsCard from './overview/CustomerMeasurementsCard';
import CustomerQuickActionsCard from './overview/CustomerQuickActionsCard';
import CustomerActiveJobsCard from './overview/CustomerActiveJobsCard';
import CustomerFinancialLedgerCard from './overview/CustomerFinancialLedgerCard';
import CustomerActivityTimeline from './CustomerActivityTimeline';

interface CustomerOverviewTabProps {
  readonly customer: CustomerData | null;
  readonly jobs: JobOrder[];
  readonly measurements: MeasurementProfile[];
  readonly appointments: Appointment[];
  readonly setActiveTab: (tab: CustomerTabType) => void;
  readonly canCollect?: boolean;
  readonly canText?: boolean;
  readonly canTrust?: boolean;
  readonly onTrustChanged?: () => void;
  readonly onEditProfile?: () => void;
}

/** Two-column workspace: how this client is set up on the left, what is happening with them on the right. */
export default function CustomerOverviewTab({
  customer,
  jobs,
  measurements,
  appointments,
  setActiveTab,
  canCollect = false,
  canText = false,
  canTrust = false,
  onTrustChanged,
  onEditProfile,
}: CustomerOverviewTabProps) {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
        {/* LEFT COLUMN (35%): preferences, measurement snapshot, quick hub */}
        <div className="lg:col-span-4 space-y-4 lg:space-y-5">
          <CustomerPreferencesCard customer={customer} canTrust={canTrust} onTrustChanged={onTrustChanged} onEdit={onEditProfile} />
          <CustomerMeasurementsCard measurements={measurements} onManage={() => setActiveTab('measurements')} />
          <CustomerQuickActionsCard
            customerId={customer?.id}
            balance={moneySummary(jobs).balance}
            canCollect={canCollect}
            canText={canText}
            onOpenTab={setActiveTab}
          />
        </div>

        {/* RIGHT COLUMN (65%): live production, money, and the auto-logged record */}
        <div className="lg:col-span-8 space-y-4 lg:space-y-5">
          <CustomerActiveJobsCard jobs={jobs} customerId={customer?.id} onViewAll={() => setActiveTab('orders')} />
          <CustomerFinancialLedgerCard customer={customer} jobs={jobs} canCollect={canCollect} onCollect={() => setActiveTab('payments')} />
          <CustomerActivityTimeline customer={customer} measurements={measurements} jobs={jobs} appointments={appointments} limit={5} onViewAll={() => setActiveTab('activity')} />
        </div>
      </div>
    </div>
  );
}
