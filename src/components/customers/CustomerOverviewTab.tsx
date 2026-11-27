'use client';

import React from 'react';
import { CustomerData, JobOrder, MeasurementProfile } from './customerTypes';
import CustomerProfileCard from './overview/CustomerProfileCard';
import CustomerActiveJobsCard from './overview/CustomerActiveJobsCard';
import CustomerMeasurementsCard from './overview/CustomerMeasurementsCard';
import CustomerQuickActionsCard from './overview/CustomerQuickActionsCard';

interface CustomerOverviewTabProps {
  readonly customer: CustomerData | null;
  readonly jobs: JobOrder[];
  readonly measurements: MeasurementProfile[];
  readonly setActiveTab: (tab: 'overview' | 'measurements' | 'orders' | 'appointments' | 'history') => void;
}

export default function CustomerOverviewTab({
  customer,
  jobs,
  measurements,
  setActiveTab,
}: CustomerOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
      {/* LEFT COLUMN: Client Details & Active Production (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <CustomerProfileCard customer={customer} />
        <CustomerActiveJobsCard
          jobs={jobs}
          customerId={customer?.id}
          onViewAll={() => setActiveTab('orders')}
        />
      </div>

      {/* RIGHT COLUMN: Body Measurements Snapshot & Quick Hub (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        <CustomerMeasurementsCard
          measurements={measurements}
          onManage={() => setActiveTab('measurements')}
        />
        <CustomerQuickActionsCard customerId={customer?.id} />
      </div>
    </div>
  );
}
