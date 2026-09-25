'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import CustomerOverviewTab from '@/components/customers/CustomerOverviewTab';
import CustomerMeasurementsTab from '@/components/customers/CustomerMeasurementsTab';
import CustomerJobsTab from '@/components/customers/CustomerJobsTab';
import CustomerAppointmentsTab from '@/components/customers/CustomerAppointmentsTab';
import CustomerHistoryTab from '@/components/customers/CustomerHistoryTab';
import { useCustomerProfile } from '@/components/customers/hooks/useCustomerProfile';
import CustomerProfileHeader from '@/components/customers/profile/CustomerProfileHeader';
import CustomerProfileStats from '@/components/customers/profile/CustomerProfileStats';
import CustomerProfileEditModal from '@/components/customers/profile/CustomerProfileEditModal';
import CustomerTabNav, { CustomerTabType } from '@/components/customers/profile/CustomerTabNav';

export default function CustomerProfilePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<CustomerTabType>('overview');

  const {
    customer,
    measurements,
    jobs,
    appointments,
    loading,
    isEditingProfile,
    setIsEditingProfile,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    editNotes,
    setEditNotes,
    savingProfile,
    handleUpdateProfile,
    totalSpend,
    activeJobsCount,
    completedJobsCount,
    noShowCount,
    store,
    loadData,
  } = useCustomerProfile(id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-ink-faint">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-taupe mx-auto" />
        <span className="text-sm font-medium">Loading customer profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <CustomerProfileHeader
        customer={customer}
        onBack={() => router.back()}
        onEditProfile={() => setIsEditingProfile(true)}
        onViewMeasurements={() => setActiveTab('measurements')}
      />

      {/* Stats Summary 5-Column Grid */}
      <CustomerProfileStats
        totalSpend={totalSpend}
        activeJobsCount={activeJobsCount}
        completedJobsCount={completedJobsCount}
        appointmentsCount={appointments.length}
        noShowCount={noShowCount}
      />

      {/* Profile Edit Dialog */}
      <CustomerProfileEditModal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        editName={editName}
        setEditName={setEditName}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editNotes={editNotes}
        setEditNotes={setEditNotes}
        savingProfile={savingProfile}
        onSubmit={handleUpdateProfile}
      />

      {/* Clean Tab Navigation */}
      <CustomerTabNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Active Tab Panel */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <CustomerOverviewTab
            customer={customer}
            jobs={jobs}
            measurements={measurements}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'measurements' && (
          <CustomerMeasurementsTab
            customerId={Number.parseInt(id, 10)}
            customerName={customer?.name || ''}
            storeId={store?.id || 0}
            measurements={measurements}
            onReload={loadData}
          />
        )}

        {activeTab === 'orders' && (
          <CustomerJobsTab jobs={jobs} />
        )}

        {activeTab === 'appointments' && (
          <CustomerAppointmentsTab appointments={appointments} />
        )}

        {activeTab === 'history' && (
          <CustomerHistoryTab
            customer={customer}
            measurements={measurements}
            jobs={jobs}
            appointments={appointments}
          />
        )}
      </div>
    </div>
  );
}
